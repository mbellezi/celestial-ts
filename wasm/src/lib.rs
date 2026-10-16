//! Complete, synchronous JavaScript interface suitable for a dedicated Web Worker.

mod additional;
mod binding;
mod exports;
mod methods;
mod native;

use serde::{de::DeserializeOwned, Serialize};
use wasm_bindgen::prelude::*;

fn argument<T: DeserializeOwned>(value: JsValue) -> Result<T, JsValue> {
    serde_wasm_bindgen::from_value(value)
        .map_err(|error| js_binding_error(binding::Error::from_reason(error.to_string())))
}

fn output<T: Serialize>(value: &T) -> Result<JsValue, JsValue> {
    value
        .serialize(
            &serde_wasm_bindgen::Serializer::new()
                .serialize_maps_as_objects(true)
                .serialize_missing_as_null(true)
                .serialize_large_number_types_as_bigints(true),
        )
        .map_err(js_error)
}

fn js_error(error: impl std::fmt::Display) -> JsValue {
    js_sys::Error::new(&error.to_string()).into()
}

fn js_binding_error(error: binding::Error) -> JsValue {
    let result = js_sys::Error::new(&error.message);
    let kind = JsValue::from_str(&error.kind);
    let details =
        output(&error.details).expect("error details contain only supported JavaScript values");
    js_sys::Reflect::set(&result, &JsValue::from_str("kind"), &kind)
        .expect("new Error supports custom properties");
    js_sys::Reflect::set(&result, &JsValue::from_str("details"), &details)
        .expect("new Error supports custom properties");
    result.into()
}

fn insert_constant<T: Serialize>(
    object: &js_sys::Object,
    name: &str,
    value: &T,
) -> Result<(), JsValue> {
    js_sys::Reflect::set(object, &JsValue::from_str(name), &output(value)?)?;
    Ok(())
}

#[wasm_bindgen(typescript_custom_section)]
const TYPES: &str = include_str!("../api.d.ts");

#[wasm_bindgen(typescript_custom_section)]
const METHOD_TYPES: &str = include_str!("../methods.d.ts");
