//! Chiron (2060 Chiron / 95P/Chiron) position.
//!
//! Chiron orbits between Saturn and Uranus with a ~50-year period.
//! For 1930–2040, versioned Swiss Ephemeris heliocentric states include the
//! perturbations absent from a two-body Kepler orbit. Cubic Hermite interpolation
//! is entirely local; see core/data/chiron-ephemeris.json for provenance.
//! Outside the table, the historical Kepler approximation remains available;
//! its accuracy is not covered by the 1930–2040 validation.

use crate::units::JulianDay;
use std::f64::consts::PI;

const J2000: f64 = 2451545.0;
const TWO_PI: f64 = 2.0 * PI;

include!("chiron_ephemeris.rs");

fn ephemeris_position(jd: f64) -> Option<(f64, f64, f64)> {
    let x = (jd - EPHE_START) / EPHE_STEP;
    if !(0.0..=(EPHE_STATES.len() - 1) as f64).contains(&x) {
        return None;
    }
    let index = (x.floor() as usize).min(EPHE_STATES.len() - 2);
    let t = x - index as f64;
    let a = EPHE_STATES[index];
    let b = EPHE_STATES[index + 1];
    let h00 = (2.0*t - 3.0)*t*t + 1.0;
    let h10 = ((t - 2.0)*t + 1.0)*t;
    let h01 = (-2.0*t + 3.0)*t*t;
    let h11 = (t - 1.0)*t*t;
    let p: [f64;3] = std::array::from_fn(|i|
        h00*a[i] + h10*EPHE_STEP*a[i+3] + h01*b[i] + h11*EPHE_STEP*b[i+3]);
    let xy = p[0].hypot(p[1]);
    Some((p[1].atan2(p[0]).to_degrees().rem_euclid(360.0),
          p[2].atan2(xy).to_degrees(), xy.hypot(p[2])))
}

#[allow(dead_code)]
fn norm360(d: f64) -> f64 {
    d.rem_euclid(360.0)
}
fn to_rad(d: f64) -> f64 {
    d * PI / 180.0
}
fn to_deg(r: f64) -> f64 {
    r * 180.0 / PI
}

/// Solve Kepler's equation M = E - e·sin(E) for the eccentric anomaly E.
/// Newton iteration with paired `sin_cos` (one transcendental call per iter).
fn kepler(m: f64, ecc: f64) -> f64 {
    let m = m.rem_euclid(TWO_PI);
    let mut e = m;
    for _ in 0..8 {
        let (sin_e, cos_e) = e.sin_cos();
        let de = (m - e + ecc * sin_e) / (1.0 - ecc * cos_e);
        e += de;
    }
    e
}

/// Compute Chiron's heliocentric ecliptic longitude and latitude (degrees)
/// and distance (AU) for a given Julian day (UT ≈ ET for this purpose).
///
/// Elements: epoch J2000.0, from MPC / AstDys.
#[must_use]
pub fn chiron_pos(jd: JulianDay) -> (f64, f64, f64) {
    let jd: f64 = jd.into();
    if let Some(position) = ephemeris_position(jd) {
        return position;
    }
    // Mean elements at epoch J2000.0
    let a = 13.648_16_f64; // AU
    let ecc = 0.382_95_f64;
    let inc = to_rad(6.930_2_f64);
    let node = to_rad(209.386_7_f64); // ascending node
    let peri = to_rad(339.534_3_f64); // argument of perihelion (from node)
                                      // Mean anomaly at J2000.0 in degrees.
                                      // Chiron perihelion was JD 2450162.0 (1996-02-14). At J2000.0 the
                                      // time since perihelion is 1383 d → M = n·1383 ≈ 27.0° where the
                                      // mean motion n = 360° / (50.45 y · 365.25 d/y) = 0.01956°/d.
                                      // The previous value 48.5° was ~21° ahead of orbit (caused ~26° too
                                      // far advanced in ecliptic longitude at all dates).
    let m0 = to_rad(27.0_f64);
    // Orbital period: P = sqrt(a³) years
    let period = a.powf(1.5) * 365.25; // days
    let n = TWO_PI / period; // mean motion rad/day

    // Mean anomaly at JD
    let dt = jd - J2000;
    let m = (m0 + n * dt).rem_euclid(TWO_PI);

    // Eccentric anomaly
    let e = kepler(m, ecc);

    // True anomaly
    let nu = 2.0 * (((1.0 + ecc) / (1.0 - ecc)).sqrt() * (e / 2.0).tan()).atan();

    // Distance
    let r = a * (1.0 - ecc * e.cos());

    // Heliocentric ecliptic coordinates (IAU 76 reference plane)
    // Argument of latitude
    let u = peri + nu;
    let (sin_u, cos_u) = u.sin_cos();
    let (sin_i, cos_i) = inc.sin_cos();
    let (sin_n, cos_n) = node.sin_cos();

    // 3-D heliocentric coordinates
    let x = r * (-sin_n * sin_u).mul_add(cos_i, cos_n * cos_u);
    let y = r * (cos_n * sin_u).mul_add(cos_i, sin_n * cos_u);
    let z = r * sin_u * sin_i;

    let lon = to_deg(y.atan2(x)).rem_euclid(360.0);
    let lat = to_deg((z / r).asin());

    (lon, lat, r)
}

/// Speed of Chiron (deg/day) via numerical differentiation.
/// Uses geocentric (`chiron_geocentric`) so consumers see the apparent
/// motion of Chiron as seen from Earth — matching how
/// `chiron_speed` is consumed by `calc_chiron`.
#[must_use]
pub fn chiron_speed(jd: JulianDay) -> (f64, f64, f64) {
    let jd: f64 = jd.into();
    // Resolve rapid changes of solar deflection inside the solar disk.
    let h = 0.0001;
    let (l0, b0, r0) = chiron_geocentric(jd - h);
    let (l1, b1, r1) = chiron_geocentric(jd + h);
    let dl = ((l1 - l0 + 540.0) % 360.0) - 180.0; // handle 0/360 wrap
    (dl / (2.0*h), (b1 - b0) / (2.0*h), (r1 - r0) / (2.0*h))
}

/// Apparent geocentric ecliptic position at TT, true equinox of date.
/// J2000 heliocentric states are precessed into the observation frame before
/// subtracting Earth; light time, annual aberration and nutation follow.
#[must_use]
pub fn chiron_geocentric(jde: f64) -> (f64, f64, f64) {
    use crate::astronomy::{vsop87::{heliocentric, Planet}, pluto::precess_ecliptic,
        planetary::aberration, nutation::nutation, constants::LIGHT_SPEED_AU_DAY};
    fn rect(l: f64, b: f64, r: f64) -> [f64;3] {
        [r*b.cos()*l.cos(), r*b.cos()*l.sin(), r*b.sin()]
    }
    let earth = heliocentric(Planet::Earth, jde);
    let e = rect(earth.lon, earth.lat, earth.rad);
    let mut tau = 0.0;
    let mut g = [0.0;3];
    let mut distance = 0.0;
    for _ in 0..4 {
        let (lon,lat,r) = chiron_pos(JulianDay::new(jde-tau));
        let (l,b) = precess_ecliptic(lon.to_radians(),lat.to_radians(),J2000,jde);
        let p = rect(l,b,r);
        g = std::array::from_fn(|i|p[i]-e[i]);
        distance = g[0].hypot(g[1]).hypot(g[2]);
        tau = distance / LIGHT_SPEED_AU_DAY;
    }
    let g = crate::astronomy::deflection::solar_deflection(g, e);
    let (lon,lat) = aberration(g[1].atan2(g[0]),g[2].atan2(g[0].hypot(g[1])),jde);
    ((lon.to_degrees()+nutation(jde).dpsi/3600.0).rem_euclid(360.0),lat.to_degrees(),distance)
}

#[cfg(test)]
mod cov_tests {
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    use super::*;

    #[test]
    fn norm360_wraps() {
        assert!((norm360(361.0) - 1.0).abs() < 1e-9);
        assert!((norm360(-1.0) - 359.0).abs() < 1e-9);
    }

    #[test]
    fn independent_swiss_positions_and_speeds() {
        // Swiss 2.10.03 / seas_18, apparent geocentric ecliptic at these TT JDs.
        // These dates are not interpolation knots.
        let cases = [
            (2425977.5, [39.782044579599, -1.740979781139, 16.382619837132, -0.018621313402]),
            (2441465.6666666665, [16.196797138936, 1.768660080743, 19.432210295701, 0.041369257895]),
            (2451545.0, [251.617541980496, 4.071721834965, 10.663529965600, 0.114307496231]),
            (2466520.5, [110.552361089233, -7.481689920595, 9.975444277572, -0.068513202418]),
        ];
        for (jd, expected) in cases {
            let (lon, lat, dist) = chiron_geocentric(jd);
            let (speed,_,_) = chiron_speed(JulianDay::new(jd));
            assert!((lon-expected[0]).abs() < 1.0/3600.0, "{jd}: longitude {lon}");
            assert!((lat-expected[1]).abs() < 1.0/3600.0, "{jd}: latitude {lat}");
            assert!((dist-expected[2]).abs() < 1e-5, "{jd}: distance {dist}");
            assert!((speed-expected[3]).abs() < 1e-5, "{jd}: speed {speed}");
        }
        assert!(ephemeris_position(EPHE_START-1.0).is_none());
        assert!(ephemeris_position(EPHE_START).is_some());
        assert!(ephemeris_position(EPHE_START+EPHE_STEP*(EPHE_STATES.len()-1) as f64).is_some());
        assert!(ephemeris_position(EPHE_START+EPHE_STEP*EPHE_STATES.len() as f64).is_none());
    }

    #[test]
    fn kepler_solver_matches_regression_vectors() {
        let cases = [
            (0.0, 0.0),
            (1.25, 1.632_227_637_717_615_3),
            (-2.75, 3.425_805_408_883_046_5),
            (7.0, 1.048_757_387_221_363_6),
        ];
        for (mean_anomaly, expected) in cases {
            assert!((kepler(mean_anomaly, 0.382_95) - expected).abs() < 1e-14);
        }
    }
}
