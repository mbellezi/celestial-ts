//! Moon nodes (mean and true) and planetary nodes/apsides.

use crate::astronomy::constants::norm_deg as norm360;
use crate::units::JulianDay;

const J2000: f64 = 2451545.0;

// ─── Moon: mean node ──────────────────────────────────────────────────────────

/// Mean ascending node of the Moon (degrees, true equinox of date).
/// Meeus "Astronomical Algorithms" ch. 47.
#[must_use]
pub fn moon_mean_node(jd_et: JulianDay) -> f64 {
    let jd_et: f64 = jd_et.into();
    let t = (jd_et - J2000) / 36525.0;
    let t2 = t * t;
    let t3 = t2 * t;
    let t4 = t3 * t;
    let om = 125.044_555_501 - 1_934.136_261_972 * t + 0.002_075_633 * t2 + 0.000_002_139 * t3
        - 0.000_000_016_5 * t4;
    norm360(om + crate::astronomy::nutation::nutation(jd_et).dpsi / 3600.0)
}

/// Speed of the mean node (deg/day).
#[must_use]
pub fn moon_mean_node_speed(jd_et: JulianDay) -> f64 {
    let jd_et: f64 = jd_et.into();
    let t = (jd_et - J2000) / 36525.0;
    // d/dt of mean node (deg/century → deg/day)
    let dc = -1_934.136_261_972 + 2.0 * 0.002_075_633 * t + 3.0 * 0.000_002_139 * t * t
        - 4.0 * 0.000_000_016_5 * t * t * t;
    let h = 0.01;
    let dn = (crate::astronomy::nutation::nutation(jd_et + h).dpsi
        - crate::astronomy::nutation::nutation(jd_et - h).dpsi)
        / (2.0 * h * 3600.0);
    dc / 36525.0 + dn
}

// ─── Moon: true node ──────────────────────────────────────────────────────────

/// Explicit Swiss Ephemeris true-node samples (TT), at quarter-day intervals.
/// Each observable uses a four-point cubic interpolant. Interpolating the
/// supplied velocity directly avoids magnifying position interpolation errors
/// through differentiation, especially at the true node's frequent stations.
/// See the provenance manifest for independent fractional holdout errors.
fn tabulated_true_node(jd: f64) -> Option<(f64, f64, f64, f64)> {
    const DATA: &[u8] = include_bytes!("lunar-node.bin");
    const START: f64 = 2425974.5;
    const STEP: f64 = 0.25;
    let x = (jd - START) / STEP;
    let count = DATA.len() / 32;
    if !(0.0..=(count - 1) as f64).contains(&x) {
        return None;
    }
    let first = (x.floor() as usize).saturating_sub(1).min(count - 4);
    let t = x - first as f64;
    let interpolate = |col: usize| {
        (0..4).map(|k| {
            let offset = (first + k) * 32 + col * 8;
            let value = f64::from_le_bytes(DATA[offset..offset + 8].try_into().unwrap());
            let weight: f64 = (0..4).filter(|&j| j != k)
                .map(|j| (t - j as f64) / (k as f64 - j as f64)).product();
            value * weight
        }).sum::<f64>()
    };
    Some((norm360(interpolate(0)), interpolate(1), interpolate(2), interpolate(3)))
}

/// Apparent true-node longitude, using the explicitly tabulated Swiss
/// osculating node in 1930–2040. Outside that interval the analytic lunar
/// angular-momentum solution is used, with the accuracy of truncated ELP.
#[must_use]
pub fn moon_true_node(jd_et: JulianDay) -> f64 {
    let jd: f64 = jd_et.into();
    tabulated_true_node(jd).map_or_else(|| osculating_true_node(jd).0, |p| p.0)
}

/// Return `(longitude_deg, longitude_speed_deg_day, distance_au, distance_speed_au_day)`.
#[must_use]
pub fn moon_true_node_state(jd_et: JulianDay) -> (f64, f64, f64, f64) {
    let jd: f64 = jd_et.into();
    if let Some(p) = tabulated_true_node(jd) {
        return p;
    }
    let (lon, dist) = osculating_true_node(jd);
    let h = 0.01;
    let p = osculating_true_node(jd + h);
    let m = osculating_true_node(jd - h);
    (
        lon,
        crate::functions::utils::wrap_signed_180(p.0 - m.0) / (2.0 * h),
        dist,
        (p.1 - m.1) / (2.0 * h),
    )
}

/// Osculating ascending node from the lunar angular momentum vector.
/// Lunar positions at adjacent times are rotated into one mean ecliptic before
/// differentiation; nutation then places the node in the true equinox of date.
#[must_use]
fn osculating_true_node(jd: f64) -> (f64, f64) {
    let vector = |date| {
        let p = crate::astronomy::moon::lunar_position(date);
        let (l, b) = crate::astronomy::pluto::precess_ecliptic(p.lon, p.lat, date, jd);
        [
            p.dist_km * b.cos() * l.cos(),
            p.dist_km * b.cos() * l.sin(),
            p.dist_km * b.sin(),
        ]
    };
    let h = 0.001;
    let r = vector(jd);
    let plus = vector(jd + h);
    let minus = vector(jd - h);
    let v: [f64; 3] = std::array::from_fn(|i| (plus[i] - minus[i]) / (2.0 * h));
    let hx = r[1] * v[2] - r[2] * v[1];
    let hy = r[2] * v[0] - r[0] * v[2];
    let hz = r[0] * v[1] - r[1] * v[0];
    let angular = [hx, hy, hz];
    let hn = hx.hypot(hy);
    let n = [-hy / hn, hx / hn, 0.0];
    let mu = 403503.2355 * 86400.0 * 86400.0; // Earth+Moon, km³/day²
    let radius = r.iter().map(|x| x * x).sum::<f64>().sqrt();
    let eccentricity = [
        (v[1] * hz - v[2] * hy) / mu - r[0] / radius,
        (v[2] * hx - v[0] * hz) / mu - r[1] / radius,
        (v[0] * hy - v[1] * hx) / mu - r[2] / radius,
    ];
    let semilatus = angular.iter().map(|x| x * x).sum::<f64>() / mu;
    let distance = semilatus / (1.0 + (0..3).map(|i| eccentricity[i] * n[i]).sum::<f64>());
    (
        norm360(
            hx.atan2(-hy).to_degrees() + crate::astronomy::nutation::nutation(jd).dpsi / 3600.0,
        ),
        distance / crate::astronomy::constants::AU_KM,
    )
}

/// Instantaneous true-node speed (degrees/day), with wrapped central difference.
#[must_use]
pub fn moon_true_node_speed(jd_et: JulianDay) -> f64 {
    moon_true_node_state(jd_et).1
}

// ─── Lunar apsides ────────────────────────────────────────────────────────────

/// Longitude of lunar perigee (degrees) — mean value.
/// Meeus ch. 48.
#[must_use]
pub fn moon_mean_perigee(jd_et: JulianDay) -> f64 {
    let jd_et: f64 = jd_et.into();
    let t = (jd_et - J2000) / 36525.0;
    let pi = 83.353_243_0 + 4_069.013_564 * t - 0.010_325_2 * t * t - 0.000_012_468 * t * t * t;
    norm360(pi)
}

/// Speed of mean perigee (deg/day).
#[must_use]
pub fn moon_mean_perigee_speed(_jd_et: JulianDay) -> f64 {
    // ~4069.013564 deg/century → deg/day
    4_069.013_564 / 36525.0
}

// ─── Planetary mean nodes / apsides ──────────────────────────────────────────
//
// From Meeus table 31.a — mean elements referred to the mean ecliptic of date.
// Valid roughly 1000 BCE – 3000 CE.

#[derive(Debug, Clone, Copy)]
pub struct PlanetElements {
    /// Longitude of ascending node (deg)
    pub node_lon: f64,
    /// Longitude of perihelion (deg)
    pub peri_lon: f64,
    /// Semi-major axis (AU)
    pub semi_major: f64,
    /// Eccentricity
    pub ecc: f64,
    /// Inclination (deg)
    pub inc: f64,
    /// Mean longitude (deg)
    pub mean_lon: f64,
}

/// Mean orbital elements at J2000 with per-century linear rates.
/// Layout: `[L0,L1, a0,a1, e0,e1, i0,i1, Om0,Om1, w0,w1]`.
const MERCURY_ELEMENTS: [f64; 12] = [
    252.250_324_4,
    149_472.674_1,
    0.387_098_310,
    0.0,
    0.205_630_69,
    0.000_020_59,
    7.004_986,
    0.001_821,
    48.330_766,
    1.186_189,
    77.456_119,
    1.556_478,
];
const VENUS_ELEMENTS: [f64; 12] = [
    181.979_801_0,
    58_517.815_7,
    0.723_329_820,
    0.0,
    0.006_773_23,
    -0.000_047_02,
    3.394_662,
    0.001_098_7,
    76.679_920,
    0.901_190,
    131.563_703,
    1.402_427,
];
const EARTH_ELEMENTS: [f64; 12] = [
    100.464_457_0,
    35_999.372_9,
    1.000_001_018,
    0.0,
    0.016_708_63,
    -0.000_042_04,
    0.0,
    0.000_013_0,
    0.0,
    0.018_45,
    102.937_348,
    1.719_526,
];
const MARS_ELEMENTS: [f64; 12] = [
    355.433_000,
    19_140.299_1,
    1.523_679_342,
    0.0,
    0.093_405_29,
    0.000_092_04,
    1.849_726,
    -0.000_813_0,
    49.558_093,
    0.772_990,
    336.060_234,
    1.840_969,
];
const JUPITER_ELEMENTS: [f64; 12] = [
    34.351_519,
    3_034.905_7,
    5.202_603_191,
    0.000_001_913,
    0.048_494_85,
    0.000_016_32,
    1.303_270,
    -0.001_987_0,
    100.464_407,
    1.020_955,
    14.331_207,
    1.612_020,
];
const SATURN_ELEMENTS: [f64; 12] = [
    50.077_444,
    1_222.113_9,
    9.554_909_596,
    -0.000_002_139,
    0.055_508_62,
    -0.000_034_56,
    2.488_878,
    0.002_551_7,
    113.665_503,
    0.877_088,
    93.057_237,
    1.963_542,
];
const URANUS_ELEMENTS: [f64; 12] = [
    314.055_005,
    428.466_0,
    19.218_446_062,
    -0.000_000_372,
    0.046_380_90,
    -0.000_026_58,
    0.773_197,
    0.000_771_6,
    74.005_957,
    0.521_467,
    173.005_159,
    1.484_678,
];
const NEPTUNE_ELEMENTS: [f64; 12] = [
    304.348_665,
    218.459_1,
    30.110_386_869,
    -0.000_001_663,
    0.009_455_75,
    0.000_006_06,
    1.769_952,
    -0.000_299_4,
    131.784_057,
    1.102_182,
    48.123_691,
    1.426_296,
];

#[inline]
fn elements_for_body(body: i32) -> Option<&'static [f64; 12]> {
    match body {
        1 => Some(&MERCURY_ELEMENTS),
        2 => Some(&VENUS_ELEMENTS),
        0 | 3 | 14 => Some(&EARTH_ELEMENTS),
        4 => Some(&MARS_ELEMENTS),
        5 => Some(&JUPITER_ELEMENTS),
        6 => Some(&SATURN_ELEMENTS),
        7 => Some(&URANUS_ELEMENTS),
        8 => Some(&NEPTUNE_ELEMENTS),
        _ => None,
    }
}

/// Orbital elements for a planet at Julian ephemeris date.
/// body: 0=Sun/Earth, 1=Mercury, 2=Venus, 4=Mars,
///       5=Jupiter, 6=Saturn, 7=Uranus, 8=Neptune
pub fn planet_mean_elements(body: i32, jd_et: JulianDay) -> Option<PlanetElements> {
    let jd_et: f64 = jd_et.into();
    let t = (jd_et - J2000) / 36525.0;
    let [l0, l1, a0, a1, e0, e1, i0, i1, om0, om1, w0, w1] = *elements_for_body(body)?;
    Some(PlanetElements {
        mean_lon: norm360(l0 + l1 * t),
        semi_major: a0 + a1 * t,
        ecc: e0 + e1 * t,
        inc: i0 + i1 * t,
        node_lon: norm360(om0 + om1 * t),
        peri_lon: norm360(w0 + w1 * t),
    })
}

/// Compute nodes & apsides for a planet.
/// Returns (asc_node_lon, desc_node_lon, perihelion_lon, aphelion_lon)
/// all in ecliptic degrees, along with the inclination.
/// Returns `(asc_lon, desc_lon, peri_lon, aphe_lon, inc)` for a planet.
pub fn planet_nodes_apsides(body: i32, jd_et: JulianDay) -> Option<(f64, f64, f64, f64, f64)> {
    let jd_et: f64 = jd_et.into();
    let el = planet_mean_elements(body, JulianDay::new(jd_et))?;
    let asc = el.node_lon;
    let desc = norm360(asc + 180.0);
    let peri = el.peri_lon;
    let aphe = norm360(peri + 180.0);
    Some((asc, desc, peri, aphe, el.inc))
}

/// Returns speeds (°/day) for node and perihelion by numerical differentiation.
pub fn planet_nodes_speeds(body: i32, jd_et: JulianDay) -> Option<(f64, f64)> {
    let jd_et: f64 = jd_et.into();
    let el_p = planet_mean_elements(body, JulianDay::new(jd_et + 0.5))?;
    let el_m = planet_mean_elements(body, JulianDay::new(jd_et - 0.5))?;

    let node_speed = crate::functions::utils::wrap_signed_180(el_p.node_lon - el_m.node_lon);
    let peri_speed = crate::functions::utils::wrap_signed_180(el_p.peri_lon - el_m.peri_lon);
    Some((node_speed, peri_speed))
}

#[cfg(test)]
mod tests {
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    use super::*;
    use crate::astronomy::test_support::f64_fingerprint;

    #[test]
    fn elements_lookup_known_bodies() {
        for body in [0i32, 1, 2, 3, 4, 5, 6, 7, 8, 14] {
            assert!(elements_for_body(body).is_some(), "body {body}");
        }
    }

    #[test]
    fn elements_lookup_unknown_returns_none() {
        for body in [-1i32, 9, 10, 11, 12, 13, 15, 100] {
            assert!(elements_for_body(body).is_none(), "body {body}");
        }
    }

    #[test]
    fn earth_aliases_share_table() {
        let a = elements_for_body(0).unwrap();
        let b = elements_for_body(3).unwrap();
        let c = elements_for_body(14).unwrap();
        assert!(std::ptr::eq(a, b));
        assert!(std::ptr::eq(b, c));
    }

    #[test]
    fn mean_elements_at_j2000_match_constants() {
        // At t=0, mean_lon = L0 normalized; semi_major = a0; ecc = e0; inc = i0
        let el = planet_mean_elements(1, JulianDay::new(J2000)).unwrap();
        assert!((el.mean_lon - norm360(MERCURY_ELEMENTS[0])).abs() < 1e-9);
        assert!((el.semi_major - MERCURY_ELEMENTS[2]).abs() < 1e-12);
        assert!((el.ecc - MERCURY_ELEMENTS[4]).abs() < 1e-12);
        assert!((el.inc - MERCURY_ELEMENTS[6]).abs() < 1e-12);
    }

    #[test]
    fn nodes_apsides_inclination_consistent() {
        for body in [1, 2, 4, 5, 6, 7, 8] {
            let (_a, _d, _p, _ap, inc) = planet_nodes_apsides(body, JulianDay::new(J2000)).unwrap();
            assert!((0.0..=10.0).contains(&inc), "body {body} inc {inc}");
        }
    }

    #[test]
    fn fuzz_mean_elements_no_nan_no_unbounded() {
        let mut s: u64 = 0xDEADBEEFCAFEu64;
        for _ in 0..512 {
            s ^= s << 13;
            s ^= s >> 7;
            s ^= s << 17;
            let jd = J2000 + ((s % 2_000_000) as f64 - 1_000_000.0); // ± ~2700 yr
            for body in [1, 2, 3, 4, 5, 6, 7, 8] {
                let el = planet_mean_elements(body, JulianDay::new(jd)).unwrap();
                assert!(el.mean_lon.is_finite() && (0.0..360.0).contains(&el.mean_lon));
                assert!(el.node_lon.is_finite() && (0.0..360.0).contains(&el.node_lon));
                assert!(el.peri_lon.is_finite() && (0.0..360.0).contains(&el.peri_lon));
                assert!(el.semi_major.is_finite() && el.semi_major > 0.0);
                assert!(el.ecc.is_finite());
                assert!(el.inc.is_finite());
            }
        }
    }

    #[test]
    fn lunar_nodes_match_swiss_fractional_holdouts() {
        // Swiss 2.10.03, SWIEPH|SPEED, TT, true equinox of date.
        let cases = [
            (
                2425977.5,
                38.93820960931968,
                40.358283097895836,
                -0.20698136351352886,
                0.0025539217045438783,
            ),
            (
                2441465.6666666665,
                298.787230623051,
                297.0443235511492,
                -0.13705597828852242,
                0.002614357553512998,
            ),
            (
                2451545.0,
                125.04068517530861,
                123.95406327630897,
                -0.05472907255013622,
                0.002445473398076829,
            ),
            (
                2466520.5,
                52.03214026171148,
                53.752777119723014,
                -0.05355516397770764,
                0.002626452967831274,
            ),
        ];
        for (jd, mean, lon, speed, dist) in cases {
            let date = JulianDay::new(jd);
            assert!((moon_mean_node(date) - mean).abs() * 3600.0 < 0.5);
            let p = moon_true_node_state(date);
            assert!((p.0 - lon).abs() * 3600.0 < 0.5);
            assert!((p.1 - speed).abs() * 3600.0 < 1.0);
            assert!((p.2 - dist).abs() < 1e-8);
        }
    }

    #[test]
    fn true_node_reported_velocity_resolves_stations() {
        // Swiss 2.10.03 SWIEPH|SPEED, TT. Values straddle zero and include
        // fractional instants; they validate velocity, not a direction epsilon.
        for (jd, speed) in [
            (2431210.7503073113, 1.694907020205399e-5),
            (2437074.250385091, -1.6903120170451583e-5),
            (2442535.750530161, 5.1150349856548516e-8),
            (2454702.5007653097, -2.897948054106483e-7),
            (2462469.500801558, 3.082891962777878e-7),
        ] {
            let actual = moon_true_node_speed(JulianDay::new(jd));
            assert!((actual - speed).abs() < 2e-8, "{jd}: {actual} vs {speed}");
            assert_eq!(actual < 0.0, speed < 0.0, "{jd}");
        }
    }

    #[test]
    fn planetary_elements_match_regression_fingerprint() {
        let mut values = Vec::new();
        for jd in [1_721_425.5, J2000, 2_463_456.789, 3_182_045.0] {
            for body in [0, 1, 2, 4, 5, 6, 7, 8] {
                let el = planet_mean_elements(body, JulianDay::new(jd)).unwrap();
                let nodes = planet_nodes_apsides(body, JulianDay::new(jd)).unwrap();
                let speeds = planet_nodes_speeds(body, JulianDay::new(jd)).unwrap();
                values.extend([
                    el.node_lon,
                    el.peri_lon,
                    el.semi_major,
                    el.ecc,
                    el.inc,
                    el.mean_lon,
                    nodes.0,
                    nodes.1,
                    nodes.2,
                    nodes.3,
                    nodes.4,
                    speeds.0,
                    speeds.1,
                ]);
            }
        }
        assert_eq!(f64_fingerprint(values), 0xc25d_dee4_34d8_8405);
    }

    #[test]
    fn true_node_speed_normalizes_longitude_wrap() {
        let jd = JulianDay::new(2453881.0);
        assert!(moon_true_node_speed(jd).abs() < 1.0);
    }
}
