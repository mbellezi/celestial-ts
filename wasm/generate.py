#!/usr/bin/env python3
"""Generate the WASM seam and declarations from the checked-in Rust adapters."""

import argparse
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
CORE = ROOT.parent / "core" / "src"
JS_NAMES = {
    "midpoint_deg": "degMidp",
    "naisargika_relation": "naisargakaRelation",
    "saturn_4_stars": "saturnFourStars",
}
MODULES = {
    "aspect_angles", "signs", "nakshatras", "buddhist", "celtic", "christian",
    "hebrew", "hindu", "islamic", "persian",
}


def camel(name):
    head, *tail = name.split("_")
    return head + "".join(part[:1].upper() + part[1:] for part in tail)


def split_types(text):
    depth = 0
    start = 0
    parts = []
    for index, char in enumerate(text):
        depth += char in "<(["
        depth -= char in ">)]"
        if char == "," and depth == 0:
            parts.append(text[start:index].strip())
            start = index + 1
    parts.append(text[start:].strip())
    return [part for part in parts if part]


def ts_type(rust):
    rust = rust.strip()
    scalars = {"f64": "number", "i32": "number", "u32": "number", "u8": "number",
               "usize": "number", "i64": "bigint", "bool": "boolean", "String": "string",
               "&'static str": "string", "&str": "string", "()": "void", "Body": "number",
               "binding::Error": "CelestialError"}
    if rust in scalars:
        return scalars[rust]
    if rust.startswith("&"):
        return ts_type(rust[1:])
    if rust.startswith("["):
        return "Array<" + ts_type(rust[1:-1].split(";")[0]) + ">"
    if rust.startswith("("):
        return "[" + ", ".join(map(ts_type, split_types(rust[1:-1]))) + "]"
    match = re.fullmatch(r"([\w:]+)<(.*)>", rust)
    if not match:
        return rust
    return ts_generic(match[1], split_types(match[2]))


def ts_generic(name, args):
    if name.endswith("Result"):
        return ts_type(args[0])
    if name == "Vec":
        return "Array<" + ts_type(args[0]) + ">"
    if name == "Option":
        return ts_type(args[0]) + " | null"
    if name.endswith("Either"):
        return " | ".join(map(ts_type, args))
    raise ValueError("unsupported binding type: " + name)


def functions(source, module):
    source = re.sub(r"//[^\n]*", "", source)
    pattern = r"^pub fn (\w+)\s*\((.*?)\)\s*(?:->\s*([^\{]+))?\{"
    result = []
    for match in re.finditer(pattern, source, re.M | re.S):
        name, params, returns = match.groups()
        args = [tuple(part.split(":", 1)) for part in split_types(params)]
        result.append({"core": name, "js": JS_NAMES.get(name, camel(name)),
                       "args": [(name.strip(), kind.strip()) for name, kind in args],
                       "returns": (returns or "()").strip(), "module": module})
    return result


def structs(source):
    pattern = r"^pub struct (\w+)\s*\{(.*?)^\}"
    declarations = []
    for name, fields in re.findall(pattern, source, re.M | re.S):
        lines = [f"export interface {name} {{"]
        for field, kind in re.findall(r"^\s*pub (\w+):\s*([^\n]+),", fields, re.M):
            lines.append(f"  {camel(field)}: {ts_type(kind)};")
        declarations.append("\n".join(lines + ["}"]))
    return declarations


def tagged_enums(source):
    pattern = r'#\[serde\(tag = "(\w+)", content = "(\w+)", rename_all = "lowercase"\)\]\s*pub enum (\w+)\s*\{(.*?)^\}'
    declarations = []
    for tag, content, name, body in re.findall(pattern, source, re.M | re.S):
        variants = re.findall(r"^\s*(\w+)\(([^)]+)\),", body, re.M)
        cases = [f'{{ {tag}: "{variant.lower()}"; {content}: {ts_type(kind)} }}' for variant, kind in variants]
        declarations.append(f"export type {name} = " + " | ".join(cases) + ";")
    return declarations


def flat_exports():
    names = set()
    source = (CORE / "lib.rs").read_text()
    for declaration in re.findall(r"^pub use ([^;]+);", source, re.M):
        match = re.search(r"\{(.*)\}", declaration, re.S)
        tokens = match[1].split(",") if match else [declaration.split("::")[-1]]
        names.update(token.strip() for token in tokens if token.strip())
    return names


def constants():
    exported = {name for name in flat_exports() if name[0].isupper() and name.upper() == name}
    declarations = {}
    for path in sorted(CORE.rglob("*.rs")):
        pattern = r"^pub (?:const|static) ([A-Z][A-Z_0-9]*):\s*(.*?)\s*="
        for name, kind in re.findall(pattern, path.read_text(), re.M):
            if name in exported:
                declarations[name] = kind
    missing = exported - declarations.keys()
    if missing:
        raise ValueError("unresolved constants: " + str(sorted(missing)))
    return declarations


def export_function(function):
    name, js, args = function["core"], function["js"], function["args"]
    signature = ", ".join(f"{name}: JsValue" for name, _ in args)
    values = ", ".join(f"argument::<{function['module']}::{kind}>({name})?" if kind == "UtcDate"
                       else f"argument::<{kind}>({name})?" for name, kind in args)
    call = f"{function['module']}::{name}({values})"
    if function["returns"].startswith("binding::Result<"):
        call += ".map_err(js_binding_error)?"
    return (f'#[wasm_bindgen(js_name = "{js}", skip_typescript)]\n'
            f"pub fn {name}({signature}) -> Result<JsValue, JsValue> {{\n"
            f"    output(&{call})\n}}\n")


def function_declaration(function):
    args = []
    for index, (name, rust) in enumerate(function["args"]):
        optional = rust.startswith("Option<") and all(kind.startswith("Option<") for _, kind in function["args"][index:])
        name = camel(name) + ("?" if optional else "")
        kind = ts_type(rust)
        if kind.endswith(" | null"):
            kind += " | undefined"
        args.append(f"{name}: {kind}")
    return f"export function {function['js']}({', '.join(args)}): {ts_type(function['returns'])};"


def constant_exports(declarations):
    lines = ['#[wasm_bindgen(js_name = "constants", skip_typescript)]',
             'pub fn constants() -> Result<JsValue, JsValue> {',
             '    let object = js_sys::Object::new();']
    for name in sorted(declarations):
        value = f"celestial_core::{name}"
        if name == "TZ_TABLE":
            value = "additional::timezone_table()"
        lines.append(f'    insert_constant(&object, "{name}", &{value})?;')
    return "\n".join(lines + ['    Ok(object.into())', '}'])


def constant_declarations(declarations):
    fields = ["export interface CoreConstants {"]
    for name, kind in sorted(declarations.items()):
        kind = "Vec<TzAbbrResult>" if name == "TZ_TABLE" else kind
        fields.append(f"  readonly {name}: {ts_type(kind)};")
    return "\n".join(fields + ["}", "export function constants(): CoreConstants;"])


def validate_coverage(api):
    expected = ({name for name in flat_exports() if name[0].islower()} - MODULES) | {"try_panchanga"}
    actual = {function["core"] for function in api}
    missing = expected - actual
    if missing:
        raise ValueError("unbound core functions: " + str(sorted(missing)))
    return sorted(expected)


def function_names(api, expected):
    names = {function["core"]: function["js"] for function in api}
    core = "export type CoreFunctionName =\n" + "\n".join(f'  | "{names[name]}"' for name in expected) + ";\n"
    aliases = sorted(set(names) - set(expected))
    exported = "export type ExportedFunctionName = CoreFunctionName"
    exported += "".join(f' | "{names[name]}"' for name in aliases) + ";\n"
    return core + exported


def generate():
    sources = {name: (ROOT / "src" / f"{name}.rs").read_text()
               for name in ["native", "additional", "binding"]}
    api = [function for name, source in sources.items() for function in functions(source, name)]
    expected = validate_coverage(api)
    declarations = constants()
    rust = "use super::{argument, insert_constant, js_binding_error, output};\n"
    rust += "use crate::{additional, native};\nuse wasm_bindgen::prelude::*;\n\n"
    rust += "\n".join(map(export_function, api)) + "\n" + constant_exports(declarations) + "\n"
    rust = subprocess.run(["rustfmt", "--edition", "2021", "--emit", "stdout"], input=rust,
                          capture_output=True, check=True, text=True).stdout
    dts = "// Generated by wasm/generate.py. Synchronous; initialize the WASM module first.\n\n"
    dts += "\n\n".join(decl for source in sources.values() for decl in structs(source)) + "\n\n"
    dts += "\n\n".join(decl for source in sources.values() for decl in tagged_enums(source)) + "\n\n"
    dts += function_names(api, expected) + "\n"
    dts += "\n".join(map(function_declaration, api)) + "\n\n" + constant_declarations(declarations) + "\n"
    manifest = {"coreFunctions": expected, "functions": {fn["core"]: fn["js"] for fn in api},
                "constants": sorted(declarations), "coreModules": sorted(MODULES),
                "moduleFunctions": {"try_panchanga": "celestial_core::vedic::try_panchanga"}}
    return {"src/exports.rs": rust, "api.d.ts": dts,
            "api-manifest.json": json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = generate()
    for name, content in outputs.items():
        path = ROOT / name
        if args.check:
            if path.read_text() != content:
                sys.exit(f"stale generated interface: {path}")
        else:
            path.write_text(content)
    manifest = json.loads(outputs["api-manifest.json"])
    print(f"WASM API: {len(manifest['coreFunctions'])} core functions, 3 compatibility aliases; all flat constants covered")


if __name__ == "__main__":
    main()
