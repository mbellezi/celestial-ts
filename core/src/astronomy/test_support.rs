#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::wasm_bindgen_test as test;

// Platform transcendental functions differ at the last bits; retain the upstream
// regression values with an absolute bound also suitable for small derivatives.
fn regression_close(actual: f64, expected: f64) -> bool {
    actual.is_finite() && expected.is_finite() && (actual - expected).abs() <= 1e-12
}

pub(crate) fn assert_close<const N: usize>(actual: [f64; N], expected: [f64; N]) {
    for (index, (actual, expected)) in actual.into_iter().zip(expected).enumerate() {
        assert!(
            regression_close(actual, expected),
            "field {index}: {actual:?} != {expected:?} (absolute tolerance 1e-12)"
        );
    }
}

#[test]
fn regression_tolerance_accepts_only_small_finite_errors() {
    assert!(regression_close(1.0, 1.0));
    assert!(regression_close(1.0 + 5e-13, 1.0));
    assert!(!regression_close(1.0 + 1e-8, 1.0));
    assert!(!regression_close(1.0, 1.0 + 1e-8));
    for invalid in [f64::NAN, f64::INFINITY, f64::NEG_INFINITY] {
        assert!(!regression_close(invalid, 1.0));
        assert!(!regression_close(1.0, invalid));
        assert!(!regression_close(invalid, invalid));
    }
}

pub(crate) fn f64_fingerprint(values: impl IntoIterator<Item = f64>) -> u64 {
    values
        .into_iter()
        .fold(0xcbf2_9ce4_8422_2325, |hash, value| {
            (hash ^ value.to_bits()).wrapping_mul(0x100_0000_01b3)
        })
}

#[test]
fn fingerprint_is_order_and_bit_sensitive() {
    assert_eq!(f64_fingerprint([1.0, -0.0]), 0x22c2_8807_b4eb_6fed);
    assert_ne!(f64_fingerprint([1.0, 0.0]), f64_fingerprint([1.0, -0.0]));
    assert_ne!(f64_fingerprint([-0.0, 1.0]), f64_fingerprint([1.0, -0.0]));
}
