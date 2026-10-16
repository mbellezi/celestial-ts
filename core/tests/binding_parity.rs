//! Compile-time (well, test-time) check that all three language bindings
//! export the same set of functions.
//!
//! This test is intentionally simple: it reads the three binding source files,
//! extracts exported function names, and asserts the sets are equal.
//! It is not a substitute for `cargo xtask parity` but catches regressions
//! during a normal `cargo test` run without requiring the xtask binary.

#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::wasm_bindgen_test as test;

use std::collections::BTreeSet;

/// Extract a `fn`/`pub fn` name from a single line, if present and well-formed.
fn fn_name_from_line(line: &str) -> Option<String> {
    let l = line.trim();
    let rest = l
        .strip_prefix("pub fn ")
        .or_else(|| l.strip_prefix("fn "))?;
    let name: String = rest.split([' ', '(', '<']).next().unwrap_or("").to_string();
    let valid = !name.is_empty() && name.chars().all(|c| c.is_alphanumeric() || c == '_');
    if valid {
        Some(name)
    } else {
        None
    }
}

fn decorated_fns(src: &str, decorator: &str) -> BTreeSet<String> {
    let prefix = format!("#[{decorator}");
    let mut out = BTreeSet::new();
    let lines: Vec<&str> = src.lines().collect();
    for (i, head) in lines.iter().enumerate() {
        let t = head.trim();
        if !(t.starts_with(&prefix) || t.starts_with("#[allow")) {
            continue;
        }
        let n = lines.len();
        for line in lines.iter().take(n.min(i + 6)).skip(i) {
            if let Some(name) = fn_name_from_line(line) {
                out.insert(name);
                break;
            }
        }
    }
    out
}

fn py_wrapped_fns(src: &str) -> BTreeSet<String> {
    src.split("wrap_pyfunction!(")
        .skip(1)
        .filter_map(|chunk| {
            let name = chunk.split(',').next()?.trim().to_string();
            if !name.is_empty() && name.chars().all(|c| c.is_alphanumeric() || c == '_') {
                Some(name)
            } else {
                None
            }
        })
        .collect()
}

fn internal_fns() -> BTreeSet<String> {
    ["to_napi", "to_py", "tap"]
        .iter()
        .map(std::string::ToString::to_string)
        .collect()
}

fn load_fns(src: &str, decorator: &str, include_wrap: bool) -> BTreeSet<String> {
    let skip = internal_fns();
    let mut fns = decorated_fns(src, decorator);
    if include_wrap {
        fns.extend(py_wrapped_fns(src));
    }
    fns.retain(|f| !skip.contains(f));
    fns
}

#[test]
fn all_bindings_export_same_functions() {
    let py = load_fns(
        include_str!("../../tests/fixtures/bindings/python.rs"),
        "pyfunction",
        true,
    );
    let js = load_fns(
        include_str!("../../tests/fixtures/bindings/js.rs"),
        "napi",
        false,
    );
    let php = load_fns(
        include_str!("../../tests/fixtures/bindings/php.rs"),
        "php_function",
        false,
    );

    // Build human-readable diff messages before asserting
    let mut errors: Vec<String> = Vec::new();

    let union: BTreeSet<_> = py
        .iter()
        .chain(js.iter())
        .chain(php.iter())
        .cloned()
        .collect();
    for fn_name in &union {
        let in_py = py.contains(fn_name);
        let in_js = js.contains(fn_name);
        let in_php = php.contains(fn_name);
        if !(in_py && in_js && in_php) {
            let mut missing = Vec::new();
            if !in_py {
                missing.push("Python");
            }
            if !in_js {
                missing.push("JS");
            }
            if !in_php {
                missing.push("PHP");
            }
            errors.push(format!(
                "  {fn_name:<40} missing from: {}",
                missing.join(", ")
            ));
        }
    }

    if !errors.is_empty() {
        let total = union.len();
        panic!(
            "\nBinding parity failure — {}/{total} functions differ:\n\n{}\n\n\
             Fix with:  cargo xtask codegen --apply\n",
            errors.len(),
            errors.join("\n"),
        );
    }

    // Also assert counts match as a sanity check
    assert_eq!(
        py.len(),
        js.len(),
        "Python ({}) and JS ({}) have different function counts",
        py.len(),
        js.len()
    );
    assert_eq!(
        js.len(),
        php.len(),
        "JS ({}) and PHP ({}) have different function counts",
        js.len(),
        php.len()
    );
}
