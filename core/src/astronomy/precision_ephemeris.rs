//! Uniform full-state Swiss Ephemeris tables for the validated 1930–2040 interval.
//! See precision-ephemeris.manifest.json for flags, provenance and holdout bounds.
//! Generated data are AGPL-3.0-or-later; no fitted residuals or special-case dates.

const DATA: &[u8] = include_bytes!("precision-ephemeris.bin");
const START: f64 = 2_425_960.5;
const DEGREE: usize = 18;
const STRIDE: usize = 3 * (DEGREE + 1) * 8;

fn coefficient(offset: usize, k: usize) -> f64 {
    let i = offset + 8 * k;
    f64::from_le_bytes(DATA[i..i + 8].try_into().expect("ephemeris coefficient"))
}

fn clenshaw(mut coefficient: impl FnMut(usize) -> f64, x: f64, degree: usize) -> f64 {
    let (mut b1, mut b2) = (0.0, 0.0);
    for k in (1..=degree).rev() {
        let b = coefficient(k) + 2.0 * x * b1 - b2;
        b2 = b1;
        b1 = b;
    }
    coefficient(0) + x * b1 - b2
}

/// Geocentric Cartesian AU in the mean ecliptic/equinox of date, argument TT.
/// Moon already includes Swiss apparent light-time/aberration treatment; apply
/// nutation only. Mercury, Neptune and Pluto retain light time, but require
/// aberration, gravitational deflection and nutation. Unsupported bodies and
/// instants outside the uniform padded table return `None` for model fallback.
pub(crate) fn pre_apparent(body_id: u32, jde_tt: f64) -> Option<[f64; 3]> {
    let (step, count, first_segment) = match body_id {
        1 => (4.0, 10_150, 0),
        2 => (8.0, 5_075, 10_150),
        8 => (32.0, 1_269, 15_225),
        9 => (32.0, 1_269, 16_494),
        _ => return None,
    };
    let t = (jde_tt - START) / step;
    if !t.is_finite() || !(0.0..=count as f64).contains(&t) {
        return None;
    }
    let segment = (t.floor() as usize).min(count - 1);
    let x = 2.0 * (t - segment as f64) - 1.0;
    let offset = (first_segment + segment) * STRIDE;
    Some(std::array::from_fn(|axis| {
        clenshaw(|k| coefficient(offset + axis * (DEGREE + 1) * 8, k), x, DEGREE)
    }))
}

#[cfg(test)]
mod tests {
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    use super::*;

    #[test]
    fn clenshaw_known_polynomial() {
        // 2 + 3 T1(x) - 4 T2(x) + 5 T3(x).
        let c = [2.0, 3.0, -4.0, 5.0];
        for x in [-1.0, -0.7, 0.0, 0.4, 1.0] {
            let expected = 2.0 + 3.0*x - 4.0*(2.0*x*x-1.0) + 5.0*(4.0*x*x*x-3.0*x);
            assert!((clenshaw(|k| c[k], x, 3) - expected).abs() < 1e-13);
        }
    }

    #[test]
    fn table_coverage_and_junctions() {
        assert_eq!(DATA.len(), 17_763 * STRIDE);
        for (body, step, count) in [(1, 4.0, 10_150), (2, 8.0, 5_075), (8, 32.0, 1_269), (9, 32.0, 1_269)] {
            assert!(pre_apparent(body, START).is_some());
            assert!(pre_apparent(body, START + step * count as f64).is_some());
            assert!(pre_apparent(body, START - 1.0).is_none());
            assert!(pre_apparent(body, START + step * count as f64 + 1.0).is_none());
            for j in 1..count {
                let jd = START + step * j as f64;
                let left = pre_apparent(body, jd - 1e-7).unwrap();
                let right = pre_apparent(body, jd + 1e-7).unwrap();
                let r = left.iter().map(|x| x*x).sum::<f64>().sqrt();
                let delta = left.iter().zip(right).map(|(a,b)| (a-b).powi(2)).sum::<f64>().sqrt();
                assert!(delta / r < 2e-7, "body {body}, junction {j}");
            }
        }
        assert!(pre_apparent(0, START).is_none());
        assert!(pre_apparent(1, f64::NAN).is_none());
    }
}
