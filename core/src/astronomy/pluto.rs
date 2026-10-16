//! Pluto position via Meeus "Astronomical Algorithms" ch. 37.
//!
//! Complete 43-term Table 37.A, valid 1885–2099. Heliocentric coordinates
//! refer to J2000; geocentric output is apparent and referred to date.
//! Monthly comparisons with Swiss Ephemeris over 1930–2040 measured maxima
//! of 1.1 arcseconds longitude and 0.3 arcseconds latitude. These are
//! measured residuals, not a general accuracy guarantee.

use crate::astronomy::constants::to_rad;

/// Heliocentric ecliptic coordinates of Pluto (J2000.0 ecliptic).
/// Returns `(lon_deg, lat_deg, radius_au)`.
///
/// Valid range: 1885–2099. Outside this range, results degrade gracefully.
#[must_use]
pub fn pluto_pos(jde: f64) -> (f64, f64, f64) {
    let t = (jde - 2_451_545.0) / 36525.0; // Julian centuries from J2000
    let j = to_rad(34.35 + 3034.9057 * t);
    let s = to_rad(50.08 + 1222.1138 * t);
    let p = to_rad(238.96 + 144.9600 * t);

    // Meeus table 37.a — 43 terms
    type PlutoTerm = (f64, f64, f64, f64, f64, f64, f64, f64, f64);
    let coeffs: &[PlutoTerm] = &[
        (
            0.0,
            0.0,
            1.0,
            -19799805.0,
            19850055.0,
            -5452852.0,
            -14974862.0,
            66865439.0,
            68951812.0,
        ),
        (
            0.0,
            0.0,
            2.0,
            897144.0,
            -4954829.0,
            3527812.0,
            1672790.0,
            -11827535.0,
            -332538.0,
        ),
        (
            0.0, 0.0, 3.0, 611149.0, 1211027.0, -1050748.0, 327647.0, 1593179.0, -1438890.0,
        ),
        (
            0.0, 0.0, 4.0, -341243.0, -189585.0, 178690.0, -292153.0, -18444.0, 483220.0,
        ),
        (
            0.0, 0.0, 5.0, 129287.0, -34992.0, 18650.0, 100340.0, -65977.0, -85431.0,
        ),
        (
            0.0, 0.0, 6.0, -38164.0, 30893.0, -30697.0, -25823.0, 31174.0, -6032.0,
        ),
        (
            0.0, 1.0, -1.0, 20442.0, -9987.0, 4878.0, 11248.0, -5794.0, 22161.0,
        ),
        (
            0.0, 1.0, 0.0, -4063.0, -5071.0, 226.0, -64.0, 4601.0, 4032.0,
        ),
        (
            0.0, 1.0, 1.0, -6016.0, -3336.0, 2030.0, -836.0, -1729.0, 234.0,
        ),
        (0.0, 1.0, 2.0, -3956.0, 3039.0, 69.0, -604.0, -415.0, 702.0),
        (0.0, 1.0, 3.0, -667.0, 3572.0, -247.0, -567.0, 239.0, 723.0),
        (0.0, 2.0, -2.0, 1276.0, 501.0, -57.0, 1.0, 67.0, -67.0),
        (
            0.0, 2.0, -1.0, 1152.0, -917.0, -122.0, 175.0, 1034.0, -451.0,
        ),
        (0.0, 2.0, 0.0, 630.0, -1277.0, -49.0, -164.0, -129.0, 504.0),
        (1.0, -1.0, 0.0, 2571.0, -459.0, -197.0, 199.0, 480.0, -231.0),
        (1.0, -1.0, 1.0, 899.0, -1449.0, -25.0, 217.0, 2.0, -441.0),
        (
            1.0, 0.0, -3.0, -1016.0, 1043.0, 589.0, -248.0, -3359.0, 265.0,
        ),
        (
            1.0, 0.0, -2.0, -2343.0, -1012.0, -269.0, 711.0, 7856.0, -7832.0,
        ),
        (1.0, 0.0, -1.0, 7042.0, 788.0, 185.0, 193.0, 36.0, 45763.0),
        (1.0, 0.0, 0.0, 1199.0, -338.0, 315.0, 807.0, 8663.0, 8547.0),
        (1.0, 0.0, 1.0, 418.0, -67.0, -130.0, -43.0, -809.0, -769.0),
        (1.0, 0.0, 2.0, 120.0, -274.0, 5.0, 3.0, 263.0, -144.0),
        (1.0, 0.0, 3.0, -60.0, -159.0, 2.0, 17.0, -126.0, 32.0),
        (1.0, 0.0, 4.0, -82.0, -29.0, 2.0, 5.0, -35.0, -16.0),
        (1.0, 1.0, -3.0, -36.0, -29.0, 2.0, 3.0, -19.0, -4.0),
        (1.0, 1.0, -2.0, -40.0, 7.0, 3.0, 1.0, -15.0, 8.0),
        (1.0, 1.0, -1.0, -14.0, 22.0, 2.0, -1.0, -4.0, 12.0),
        (1.0, 1.0, 0.0, 4.0, 13.0, 1.0, -1.0, 5.0, 6.0),
        (1.0, 1.0, 1.0, 5.0, 2.0, 0.0, -1.0, 3.0, 1.0),
        (1.0, 1.0, 3.0, -1.0, 0.0, 0.0, 0.0, 6.0, -2.0),
        (2.0, 0.0, -6.0, 2.0, 0.0, 0.0, -2.0, 2.0, 2.0),
        (2.0, 0.0, -5.0, -4.0, 5.0, 2.0, 2.0, -2.0, -2.0),
        (2.0, 0.0, -4.0, 4.0, -7.0, -7.0, 0.0, 14.0, 13.0),
        (2.0, 0.0, -3.0, 14.0, 24.0, 10.0, -8.0, -63.0, 13.0),
        (2.0, 0.0, -2.0, -49.0, -34.0, -3.0, 20.0, 136.0, -236.0),
        (2.0, 0.0, -1.0, 163.0, -48.0, 6.0, 5.0, 273.0, 1065.0),
        (2.0, 0.0, 0.0, 9.0, -24.0, 14.0, 17.0, 251.0, 149.0),
        (2.0, 0.0, 1.0, -4.0, 1.0, -2.0, 0.0, -25.0, -9.0),
        (2.0, 0.0, 2.0, -3.0, 1.0, 0.0, 0.0, 9.0, -2.0),
        (2.0, 0.0, 3.0, 1.0, 3.0, 0.0, 0.0, -8.0, 7.0),
        (3.0, 0.0, -2.0, -3.0, -1.0, 0.0, 1.0, 2.0, -10.0),
        (3.0, 0.0, -1.0, 5.0, -3.0, 0.0, 0.0, 19.0, 35.0),
        (3.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 10.0, 3.0),
    ];

    let mut lon_sum = 0.0_f64;
    let mut lat_sum = 0.0_f64;
    let mut rad_sum = 0.0_f64;

    for &(jc, sc, pc, la, lb, ba, bb, ra, rb) in coeffs {
        let arg = jc * j + sc * s + pc * p;
        let (sa, ca) = arg.sin_cos();
        lon_sum += la * sa + lb * ca;
        lat_sum += ba * sa + bb * ca;
        rad_sum += ra * sa + rb * ca;
    }

    // Convert from Meeus units (1e-6 degrees, 1e-7 AU)
    let mut lon = 238.958_116 + 144.960 * t + lon_sum * 1e-6;
    let lat = -3.908_239 + lat_sum * 1e-6;
    let rad = 40.7241346 + rad_sum * 1e-7;

    lon = lon.rem_euclid(360.0);
    (lon, lat, rad)
}

/// Rotate ecliptic coordinates between mean equinoxes (IAU 1976 precession).
/// Meeus chapter 21; input/output angles are radians.
pub(crate) fn precess_ecliptic(lon: f64, lat: f64, from: f64, to: f64) -> (f64, f64) {
    let t0 = (from - 2451545.0) / 36525.0;
    let t = (to - from) / 36525.0;
    let eta = ((47.0029 - 0.06603 * t0 + 0.000598 * t0 * t0) * t
        + (-0.03302 + 0.000598 * t0) * t * t
        + 0.000060 * t * t * t)
        .to_radians()
        / 3600.0;
    let pi = (174.876384
        + (3289.4789 * t0 + 0.60622 * t0 * t0 - (869.8089 + 0.50491 * t0) * t + 0.03536 * t * t)
            / 3600.0)
        .to_radians();
    let p = ((5029.0966 + 2.22226 * t0 - 0.000042 * t0 * t0) * t
        + (1.11113 - 0.000042 * t0) * t * t
        - 0.000006 * t * t * t)
        .to_radians()
        / 3600.0;
    let a = eta.cos() * lat.cos() * (pi - lon).sin() - eta.sin() * lat.sin();
    let b = lat.cos() * (pi - lon).cos();
    let c = eta.cos() * lat.sin() + eta.sin() * lat.cos() * (pi - lon).sin();
    (p + pi - a.atan2(b), c.asin())
}

/// Apparent geocentric ecliptic coordinates referred to the true equinox of date.
/// Includes iterative light time, annual aberration and nutation. The Table
/// 37.A heliocentric series is J2000 and must be rotated before Earth subtraction.
#[must_use]
pub fn pluto_geocentric(jde: f64) -> (f64, f64, f64) {
    if let Some(position) = crate::astronomy::planetary::precision_apparent(9, jde) {
        return (position.lon, position.lat, position.dist);
    }
    use crate::astronomy::{
        nutation::nutation,
        vsop87::{heliocentric, Planet},
    };
    fn rect(l: f64, b: f64, r: f64) -> [f64; 3] {
        [r * b.cos() * l.cos(), r * b.cos() * l.sin(), r * b.sin()]
    }
    let earth = heliocentric(Planet::Earth, jde);
    let e = rect(earth.lon, earth.lat, earth.rad);
    let mut tau = 0.0;
    let mut g = [0.0; 3];
    let mut distance = 0.0;
    for _ in 0..4 {
        let (l, b, r) = pluto_pos(jde - tau);
        let (l, b) = precess_ecliptic(l.to_radians(), b.to_radians(), 2451545.0, jde);
        let p = rect(l, b, r);
        g = [p[0] - e[0], p[1] - e[1], p[2] - e[2]];
        distance = g.iter().map(|x| x * x).sum::<f64>().sqrt();
        tau = distance / crate::astronomy::constants::LIGHT_SPEED_AU_DAY;
    }
    // Observer velocity in the same mean ecliptic of date. Rotate the adjacent
    // Earth vectors into the observation frame before taking their derivative.
    let h = 0.01;
    let velocity = |date| {
        let e = heliocentric(Planet::Earth, date);
        let (l, b) = precess_ecliptic(e.lon, e.lat, date, jde);
        rect(l, b, e.rad)
    };
    let ep = velocity(jde + h);
    let em = velocity(jde - h);
    let g = crate::astronomy::deflection::solar_deflection(g, e);
    let mut u = g.map(|x| x / distance);
    let v: [f64; 3] = std::array::from_fn(|i| {
        (ep[i] - em[i]) / (2.0 * h * crate::astronomy::constants::LIGHT_SPEED_AU_DAY)
    });
    let dot = (0..3).map(|i| u[i] * v[i]).sum::<f64>();
    for i in 0..3 {
        u[i] += v[i] - dot * u[i];
    }
    let lon = (u[1].atan2(u[0]).to_degrees() + nutation(jde).dpsi / 3600.0).rem_euclid(360.0);
    let lat = u[2].atan2(u[0].hypot(u[1])).to_degrees();
    (lon, lat, distance)
}

#[cfg(test)]
mod tests {
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    use super::*;

    #[test]
    fn meeus_published_1992_example() {
        // Meeus, Astronomical Algorithms, chapter 37, 1992 October 13 TT.
        let (lon, lat, r) = pluto_pos(2448908.5);
        assert!((lon - 232.74071).abs() < 0.000005);
        assert!((lat - 14.58782).abs() < 0.000005);
        assert!((r - 29.711111).abs() < 0.0000005);
    }

    #[test]
    fn apparent_pluto_matches_swiss_reference() {
        // Swiss Ephemeris 2.10.03 SWIEPH, TT, apparent equinox of date.
        for (jd, lon, lat, dist) in [
            (
                2425977.5,
                108.72393195667239,
                -0.2679460393035423,
                40.356003420607166,
            ),
            (
                2441465.6666666665,
                179.35111257952653,
                16.486428885417485,
                30.856543016904887,
            ),
            (
                2451545.0,
                251.45475332520456,
                10.85523062557241,
                31.0643668786955,
            ),
            (
                2466520.5,
                325.4606271889736,
                -10.011920925026256,
                39.93345090929446,
            ),
        ] {
            let p = pluto_geocentric(jd);
            assert!((p.0 - lon).abs() * 3600.0 < 1.5);
            assert!((p.1 - lat).abs() * 3600.0 < 0.5);
            assert!((p.2 - dist).abs() < 0.0002);
        }
    }

    #[test]
    fn ecliptic_precession_round_trip() {
        let (l, b) = precess_ecliptic(1.3, 0.4, 2451545.0, 2425977.5);
        let (l, b) = precess_ecliptic(l, b, 2425977.5, 2451545.0);
        assert!((l - 1.3).abs() < 1e-9);
        assert!((b - 0.4).abs() < 1e-9);
    }

    #[test]
    fn pluto_j2000_reasonable() {
        let (lon, lat, r) = pluto_pos(2_451_545.0);
        assert!((0.0..360.0).contains(&lon), "lon={lon}");
        assert!(lat.abs() < 20.0, "lat={lat}");
        assert!(r > 28.0 && r < 50.0, "r={r} AU");
        // Pluto was at ~246° (Sagittarius) around J2000
        assert!(
            lon > 240.0 && lon < 260.0,
            "Pluto lon={lon:.2}°, expected ~246-250°"
        );
    }
}
