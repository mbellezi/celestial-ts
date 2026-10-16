//! VSOP87D planetary position theory for all eight planets.
#![allow(clippy::approx_constant)]
//!
//! Heliocentric dynamical ecliptic and equinox of date (not J2000 or FK5).
//! Uses native IMCCE amplitudes: longitude/latitude in radians, radius in AU,
//! and time in Julian millennia of 365250 days from J2000 TT.
//! For |tau| <= 0.1, selected terms have a rigorous omitted-amplitude bound
//! of 1e-7 radians (L/B) or AU (R) per coordinate. Outside that interval all
//! original terms are evaluated. This bound describes truncation only, not
//! the intrinsic error of the VSOP87 theory against modern ephemerides.
//! Source: Bretagnon & Francou, A&A 202 (1988); IMCCE VSOP87D distribution.
//! Source hashes and generation instructions are in `vsop87_data.rs` and
//! `scripts/generate-vsop87.py`.

use crate::astronomy::constants::{julian_millennia, norm_rad, DAYS_PER_MILLENNIUM};

/// A single VSOP87 series term: `A · cos(B + C·τ)`.
#[derive(Clone, Copy)]
struct Term(f64, f64, f64);
type VsopSeries = (
    &'static [&'static [Term]],
    &'static [&'static [Term]],
    &'static [&'static [Term]],
);

/// Evaluate a VSOP87 sub-series: `Σ A·cos(B + C·τ)`.
///
/// Uses `f64::mul_add(c, tau, b)` so the compiler can fuse `b + c*τ` into a
/// single FMA instruction on `target_feature = "fma"` builds (≥ Haswell).
/// Without FMA support, mul_add still expands to a normal mul-then-add.
#[inline]
fn eval_series(terms: &[Term], tau: f64) -> f64 {
    terms
        .iter()
        .map(|&Term(a, b, c)| a * c.mul_add(tau, b).cos())
        .sum()
}

/// Evaluate a full VSOP87 variable (L, B, or R).
///
/// `series` = [L0, L1, L2, ...], result = L0 + L1·τ + L2·τ² + …
///
/// Uses Horner's method:
///     result = (((Lₙ·τ + Lₙ₋₁)·τ + Lₙ₋₂)·τ + … + L₁)·τ + L₀
/// This replaces `n+1` calls to `tau.powi()` and `n+1` multiplies with `n`
/// fused multiply-adds, and is numerically more stable when `|τ|` is small
/// (two millennia from J2000 correspond to |τ| = 2).
///
/// Amplitudes use the native VSOP87D units, with no scale factor.
fn eval_vsop(series: &[&[Term]], tau: f64) -> f64 {
    let mut acc = 0.0_f64;
    for s in series.iter().rev() {
        acc = acc.mul_add(tau, eval_series(s, tau));
    }
    acc
}

/// Evaluate a VSOP sub-series and its d/dτ together.
#[inline]
fn eval_series_with_deriv(terms: &[Term], tau: f64) -> (f64, f64) {
    terms.iter().fold((0.0, 0.0), |(val, der), &Term(a, b, c)| {
        let (sin_arg, cos_arg) = c.mul_add(tau, b).sin_cos();
        (a.mul_add(cos_arg, val), (-a * c).mul_add(sin_arg, der))
    })
}

/// Value **and** analytic dV/dτ of a full VSOP variable.
///
/// `V(τ) = Σ_k τ^k · S_k(τ)` ⇒ `dV/dτ = Σ_k ( k·τ^{k-1}·S_k + τ^k·S_k′ )`.
/// Amplitudes use the same native units as [`eval_vsop`].
/// `τ^{k-1}` is carried, never divided, so τ≈0 (near J2000) is exact.
fn eval_vsop_with_deriv(series: &[&[Term]], tau: f64) -> (f64, f64) {
    let mut val = 0.0_f64;
    let mut der = 0.0_f64;
    let mut tk = 1.0_f64; // τ^k
    let mut tkm1 = 0.0_f64; // τ^{k-1} (0 for k=0; the k·… term vanishes anyway)
    for (k, s) in series.iter().enumerate() {
        let (sk, skp) = eval_series_with_deriv(s, tau);
        val = tk.mul_add(sk, val);
        der += (k as f64) * tkm1 * sk + tk * skp;
        tkm1 = tk;
        tk *= tau;
    }
    (val, der)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/// Heliocentric ecliptic coordinates.
#[derive(Debug, Clone, Copy)]
pub struct HeliocentricPos {
    /// Ecliptic longitude (radians, 0..2π).
    pub lon: f64,
    /// Ecliptic latitude (radians, -π/2..π/2).
    pub lat: f64,
    /// Radius vector (AU).
    pub rad: f64,
}

// The Earth is shared by every geocentric body and by centered speed samples.
// Keep the two evaluation paths separate: Horner position evaluation and the
// analytic-derivative evaluator can differ in their final floating-point bits.
// A fixed-size FIFO cache has no allocation, interpolation, or global settings.
// Exact TT bits are the only key; all coefficients are immutable.
const EARTH_CACHE_SIZE: usize = 16;
type PositionAndSpeed = (HeliocentricPos, (f64, f64, f64));

struct EarthCache<T: Copy> {
    entries: [Option<(u64, T)>; EARTH_CACHE_SIZE],
    next: usize,
}

impl<T: Copy> EarthCache<T> {
    const fn new() -> Self {
        Self {
            entries: [None; EARTH_CACHE_SIZE],
            next: 0,
        }
    }

    fn get(&self, jde: f64) -> Option<T> {
        let key = jde.to_bits();
        self.entries
            .iter()
            .flatten()
            .find(|(cached_key, _)| *cached_key == key)
            .map(|(_, value)| *value)
    }

    fn insert(&mut self, jde: f64, value: T) {
        self.entries[self.next] = Some((jde.to_bits(), value));
        self.next = (self.next + 1) % EARTH_CACHE_SIZE;
    }
}

thread_local! {
    static EARTH_POSITION_CACHE: std::cell::RefCell<EarthCache<HeliocentricPos>> =
        const { std::cell::RefCell::new(EarthCache::new()) };
    static EARTH_SPEED_CACHE: std::cell::RefCell<EarthCache<PositionAndSpeed>> =
        const { std::cell::RefCell::new(EarthCache::new()) };
}

/// Compute heliocentric ecliptic coordinates for a planet.
///
/// `tau` is Julian millennia from J2000.0 (= JDE / 365250 − J2000/365250).
#[inline]
#[must_use]
pub fn heliocentric(planet: Planet, jde: f64) -> HeliocentricPos {
    if planet != Planet::Earth {
        return heliocentric_uncached(planet, jde);
    }
    EARTH_POSITION_CACHE.with(|cache| {
        if let Some(value) = cache.borrow().get(jde) {
            return value;
        }
        let value = heliocentric_uncached(planet, jde);
        cache.borrow_mut().insert(jde, value);
        value
    })
}

fn heliocentric_uncached(planet: Planet, jde: f64) -> HeliocentricPos {
    let tau = julian_millennia(jde);
    let (l_series, b_series, r_series) = planet.series(tau);
    let lon = norm_rad(eval_vsop(l_series, tau));
    let lat = eval_vsop(b_series, tau);
    let rad = eval_vsop(r_series, tau);
    HeliocentricPos { lon, lat, rad }
}

/// Heliocentric position **and** analytic instantaneous speed.
///
/// `speed_lon`/`speed_lat` are deg/day, `speed_rad` is AU/day. The
/// derivative is taken analytically from the same truncated VSOP
/// series that produces the position — so it carries no
/// finite-difference O(h²) truncation error (PERF-1: replaces the
/// former ±0.5-day 3× series evaluation).
#[must_use]
pub fn heliocentric_with_speed(planet: Planet, jde: f64) -> (HeliocentricPos, (f64, f64, f64)) {
    if planet != Planet::Earth {
        return heliocentric_with_speed_uncached(planet, jde);
    }
    EARTH_SPEED_CACHE.with(|cache| {
        if let Some(value) = cache.borrow().get(jde) {
            return value;
        }
        let value = heliocentric_with_speed_uncached(planet, jde);
        cache.borrow_mut().insert(jde, value);
        value
    })
}

fn heliocentric_with_speed_uncached(planet: Planet, jde: f64) -> PositionAndSpeed {
    let tau = julian_millennia(jde);
    let (l_series, b_series, r_series) = planet.series(tau);
    let (l, dl) = eval_vsop_with_deriv(l_series, tau);
    let (b, db) = eval_vsop_with_deriv(b_series, tau);
    let (r, dr) = eval_vsop_with_deriv(r_series, tau);
    // dτ/dJDE = 1 / DAYS_PER_MILLENNIUM; lon/lat in rad → deg/day.
    let per_day = 1.0 / DAYS_PER_MILLENNIUM;
    let pos = HeliocentricPos {
        lon: norm_rad(l),
        lat: b,
        rad: r,
    };
    let speed = (
        (dl * per_day).to_degrees(),
        (db * per_day).to_degrees(),
        dr * per_day,
    );
    (pos, speed)
}

/// Planets supported by the VSOP87 engine.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Planet {
    Mercury,
    Venus,
    Earth,
    Mars,
    Jupiter,
    Saturn,
    Uranus,
    Neptune,
}

impl Planet {
    fn series(self, tau: f64) -> VsopSeries {
        let fast = tau.abs() <= 0.1;
        match self {
            Planet::Mercury => {
                if fast {
                    (MERCURY_L_FAST, MERCURY_B_FAST, MERCURY_R_FAST)
                } else {
                    (MERCURY_L_FULL, MERCURY_B_FULL, MERCURY_R_FULL)
                }
            }
            Planet::Venus => {
                if fast {
                    (VENUS_L_FAST, VENUS_B_FAST, VENUS_R_FAST)
                } else {
                    (VENUS_L_FULL, VENUS_B_FULL, VENUS_R_FULL)
                }
            }
            Planet::Earth => {
                if fast {
                    (EARTH_L_FAST, EARTH_B_FAST, EARTH_R_FAST)
                } else {
                    (EARTH_L_FULL, EARTH_B_FULL, EARTH_R_FULL)
                }
            }
            Planet::Mars => {
                if fast {
                    (MARS_L_FAST, MARS_B_FAST, MARS_R_FAST)
                } else {
                    (MARS_L_FULL, MARS_B_FULL, MARS_R_FULL)
                }
            }
            Planet::Jupiter => {
                if fast {
                    (JUPITER_L_FAST, JUPITER_B_FAST, JUPITER_R_FAST)
                } else {
                    (JUPITER_L_FULL, JUPITER_B_FULL, JUPITER_R_FULL)
                }
            }
            Planet::Saturn => {
                if fast {
                    (SATURN_L_FAST, SATURN_B_FAST, SATURN_R_FAST)
                } else {
                    (SATURN_L_FULL, SATURN_B_FULL, SATURN_R_FULL)
                }
            }
            Planet::Uranus => {
                if fast {
                    (URANUS_L_FAST, URANUS_B_FAST, URANUS_R_FAST)
                } else {
                    (URANUS_L_FULL, URANUS_B_FULL, URANUS_R_FULL)
                }
            }
            Planet::Neptune => {
                if fast {
                    (NEPTUNE_L_FAST, NEPTUNE_B_FAST, NEPTUNE_R_FAST)
                } else {
                    (NEPTUNE_L_FULL, NEPTUNE_B_FULL, NEPTUNE_R_FULL)
                }
            }
        }
    }
}

// IMCCE coefficients, reproducibly generated with bounded truncation.
include!("vsop87_data.rs");

#[cfg(test)]
mod tests {
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    use super::*;
    use crate::astronomy::constants::to_deg;
    use std::f64::consts::PI;

    fn position_bits(position: HeliocentricPos) -> [u64; 3] {
        [
            position.lon.to_bits(),
            position.lat.to_bits(),
            position.rad.to_bits(),
        ]
    }

    fn position_speed_bits((position, speed): PositionAndSpeed) -> [u64; 6] {
        [
            position.lon.to_bits(),
            position.lat.to_bits(),
            position.rad.to_bits(),
            speed.0.to_bits(),
            speed.1.to_bits(),
            speed.2.to_bits(),
        ]
    }

    #[test]
    fn earth_cache_is_bit_identical_for_hits_order_and_eviction() {
        EARTH_POSITION_CACHE.with(|c| *c.borrow_mut() = EarthCache::new());
        EARTH_SPEED_CACHE.with(|c| *c.borrow_mut() = EarthCache::new());
        let epochs: Vec<_> = (0..40).map(|i| 2451545.0 + i as f64 * 0.00001).collect();
        // Fill beyond capacity, visit in reverse, repeat hits, and cross the
        // fast/full-series boundary. Cached results must preserve every bit.
        for jd in epochs
            .iter()
            .chain(epochs.iter().rev())
            .copied()
            .chain([2415020.0, 2415019.0, 2488070.0, 2488071.0])
        {
            let position = position_bits(heliocentric_uncached(Planet::Earth, jd));
            let speed = position_speed_bits(heliocentric_with_speed_uncached(Planet::Earth, jd));
            for _ in 0..2 {
                assert_eq!(position_bits(heliocentric(Planet::Earth, jd)), position);
                assert_eq!(
                    position_speed_bits(heliocentric_with_speed(Planet::Earth, jd)),
                    speed
                );
            }
        }
        EARTH_POSITION_CACHE.with(|c| {
            assert!(
                c.borrow().get(epochs[39]).is_none(),
                "old entry must be evicted"
            );
            assert!(c.borrow().get(2488071.0).is_some());
        });
        EARTH_SPEED_CACHE.with(|c| assert!(c.borrow().get(2488071.0).is_some()));
    }

    #[test]
    fn earth_cache_leaves_other_planets_and_paths_independent() {
        EARTH_POSITION_CACHE.with(|c| *c.borrow_mut() = EarthCache::new());
        EARTH_SPEED_CACHE.with(|c| *c.borrow_mut() = EarthCache::new());
        let jd = 2451545.125;
        heliocentric(Planet::Earth, jd);
        EARTH_SPEED_CACHE.with(|c| assert!(c.borrow().get(jd).is_none()));
        for planet in [
            Planet::Mercury,
            Planet::Venus,
            Planet::Mars,
            Planet::Jupiter,
            Planet::Saturn,
            Planet::Uranus,
            Planet::Neptune,
        ] {
            assert_eq!(
                position_bits(heliocentric(planet, jd)),
                position_bits(heliocentric_uncached(planet, jd))
            );
            assert_eq!(
                position_speed_bits(heliocentric_with_speed(planet, jd)),
                position_speed_bits(heliocentric_with_speed_uncached(planet, jd))
            );
        }
        EARTH_POSITION_CACHE.with(|c| assert_eq!(c.borrow().entries.iter().flatten().count(), 1));
        EARTH_SPEED_CACHE.with(|c| assert!(c.borrow().entries.iter().all(Option::is_none)));
    }

    /// Meeus Example 32.a — Earth, 1992 Oct 13, TT.
    #[test]
    fn earth_1992_oct_13() {
        let pos = heliocentric(Planet::Earth, 2_448_908.5);
        assert!((to_deg(pos.lon) - 19.907297).abs() < 0.00001);
        assert!((to_deg(pos.lat) + 0.0002066).abs() < 0.00001);
        assert!((pos.rad - 0.99760852).abs() < 0.0000001);
    }

    /// Meeus Example 33.a — Venus, 1992 Dec 20, JDE 2448976.5
    #[test]
    fn venus_1992_dec_20() {
        let jde = 2_448_976.5;
        let pos = heliocentric(Planet::Venus, jde);
        let lon_deg = to_deg(pos.lon);
        // Expected L ≈ 26.11° , B ≈ -2.62° , R ≈ 0.724603 AU
        assert!((lon_deg - 26.11).abs() < 0.5, "Venus L = {lon_deg}");
        assert!(
            (to_deg(pos.lat) - (-2.62)).abs() < 0.1,
            "Venus B = {}",
            to_deg(pos.lat)
        );
        assert!((pos.rad - 0.724603).abs() < 0.001, "Venus R = {}", pos.rad);
    }

    /// Sanity: all planets return finite coordinates near J2000
    #[test]
    fn all_planets_j2000() {
        let jde = 2_451_545.0;
        for planet in [
            Planet::Mercury,
            Planet::Venus,
            Planet::Earth,
            Planet::Mars,
            Planet::Jupiter,
            Planet::Saturn,
            Planet::Uranus,
            Planet::Neptune,
        ] {
            let pos = heliocentric(planet, jde);
            assert!(pos.lon.is_finite(), "{planet:?} L not finite");
            assert!(pos.lat.is_finite(), "{planet:?} B not finite");
            assert!(pos.rad.is_finite(), "{planet:?} R not finite");
            assert!(pos.rad > 0.0, "{planet:?} R <= 0");
            assert!(
                pos.lon >= 0.0 && pos.lon < 2.0 * PI,
                "{planet:?} L out of range"
            );
        }
    }

    #[test]
    fn earth_radius_near_1_au() {
        let pos = heliocentric(Planet::Earth, 2_451_545.0);
        assert!(
            (pos.rad - 1.0).abs() < 0.02,
            "Earth R at J2000 = {}",
            pos.rad
        );
    }

    /// Checks the analytic bound used by the generator, independently from
    /// sampled positions. |cos| <= 1 and |tau| <= 0.1 imply this L1 bound.
    #[test]
    fn selected_terms_have_bounded_error() {
        for p in [
            Planet::Mercury,
            Planet::Venus,
            Planet::Earth,
            Planet::Mars,
            Planet::Jupiter,
            Planet::Saturn,
            Planet::Uranus,
            Planet::Neptune,
        ] {
            let fast = p.series(0.0);
            let full = p.series(0.2);
            for (selected, original) in [fast.0, fast.1, fast.2]
                .into_iter()
                .zip([full.0, full.1, full.2])
            {
                let mut bound = 0.0;
                for (k, terms) in original.iter().enumerate() {
                    for term in *terms {
                        if !selected[k]
                            .iter()
                            .any(|t| t.0 == term.0 && t.1 == term.1 && t.2 == term.2)
                        {
                            bound += term.0.abs() * 0.1_f64.powi(k as i32);
                        }
                    }
                }
                assert!(bound <= 1e-7, "{p:?}: {bound}");
            }
        }
    }

    /// Asserts heliocentric radius vectors at J2000.0 are within 5% of the
    /// known mean orbital semi-major axis. Pins the R series.
    #[test]
    fn heliocentric_radii_at_j2000() {
        // (planet, semi-major axis in AU, tolerance AU)
        // Tolerance accounts for orbital eccentricity (instantaneous
        // distance ≠ semi-major axis): Mercury e=0.21, Mars e=0.09,
        // others much smaller. Test catches gross R-series errors.
        let cases = [
            (Planet::Mercury, 0.387, 0.15),
            (Planet::Venus, 0.723, 0.05),
            (Planet::Earth, 1.000, 0.05),
            (Planet::Mars, 1.524, 0.30),
            (Planet::Jupiter, 5.203, 0.60),
            (Planet::Saturn, 9.537, 1.00),
            (Planet::Uranus, 19.191, 2.00),
            (Planet::Neptune, 30.069, 1.00),
        ];
        for (planet, semi_major, tol) in cases {
            let pos = heliocentric(planet, 2_451_545.0);
            let diff = (pos.rad - semi_major).abs();
            assert!(
                diff < tol,
                "{planet:?} R at J2000 = {:.4} AU, expected ~{semi_major:.4} AU (diff {diff:.4})",
                pos.rad,
            );
        }
    }
}
