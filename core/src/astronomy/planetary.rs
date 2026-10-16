//! Geocentric apparent planetary positions.
//!
//! Converts VSOP87 heliocentric coordinates to geocentric ecliptic and
//! equatorial apparent coordinates, applying:
//!   - iterated light-time correction
//!   - conversion to geocentric from heliocentric
//!   - FK5 correction
//!   - solar gravitational deflection, including rays inside the solar disk
//!   - annual aberration from the Earth velocity
//!   - nutation in longitude

use crate::astronomy::{
    constants::{julian_centuries, norm_deg, to_deg, to_rad, LIGHT_SPEED_AU_DAY},
    deflection::solar_deflection,
    moon::lunar_position,
    nutation::{mean_obliquity, nutation},
    vsop87::{heliocentric, heliocentric_with_speed, HeliocentricPos, Planet},
};
use crate::units::{Degrees, Latitude, Longitude};

/// Geocentric ecliptic apparent coordinates (degrees).
#[derive(Debug, Clone, Copy)]
pub struct GeocentricPos {
    /// Apparent ecliptic longitude (degrees, 0..360).
    pub lon: f64,
    /// Apparent ecliptic latitude (degrees).
    pub lat: f64,
    /// Geocentric distance (AU).
    pub dist: f64,
    /// Right ascension (degrees).
    pub ra: f64,
    /// Declination (degrees).
    pub dec: f64,
}

/// Compute geocentric apparent position for a planet (JDE = TT).
#[inline]
#[must_use]
pub fn apparent_planet(planet: Planet, jde: f64) -> GeocentricPos {
    let precision_id = match planet {
        Planet::Mercury => Some(2),
        Planet::Neptune => Some(8),
        _ => None,
    };
    if let Some(position) = precision_id.and_then(|id| precision_apparent(id, jde)) {
        return position;
    }
    // Earth's heliocentric position
    let (earth, earth_speed) = heliocentric_with_speed(Planet::Earth, jde);
    let (xe, ye, ze) = ecliptic_rect(earth.lon, earth.lat, earth.rad);

    // First approximation: planet heliocentric position
    let p0 = heliocentric(planet, jde);
    let (xp0, yp0, zp0) = ecliptic_rect(p0.lon, p0.lat, p0.rad);

    // Geocentric rectangular
    let dx0 = xp0 - xe;
    let dy0 = yp0 - ye;
    let dz0 = zp0 - ze;
    let dist0 = (dx0 * dx0 + dy0 * dy0 + dz0 * dz0).sqrt();

    // Two light-time iterations; the first-order residual is suppressed
    // by another factor of orbital speed / c on each pass.
    let mut tau = dist0 / LIGHT_SPEED_AU_DAY;
    let mut jde_lt = jde - tau;
    let mut corrected = (xp0, yp0, zp0);
    for _ in 0..2 {
        let p_tmp = heliocentric(planet, jde_lt);
        let (xt, yt, zt) = ecliptic_rect(p_tmp.lon, p_tmp.lat, p_tmp.rad);
        corrected = (xt, yt, zt);
        let d_tmp = ((xt - xe) * (xt - xe) + (yt - ye) * (yt - ye) + (zt - ze) * (zt - ze)).sqrt();
        tau = d_tmp / LIGHT_SPEED_AU_DAY;
        jde_lt = jde - tau;
    }

    // Final corrected planet position
    let (xp, yp, zp) = corrected;
    let dx = xp - xe;
    let dy = yp - ye;
    let dz = zp - ze;
    let dist = (dx * dx + dy * dy + dz * dz).sqrt();

    // Geometric geocentric longitude and latitude (radians)
    let [dx, dy, dz] = solar_deflection([dx, dy, dz], [xe, ye, ze]);
    let lon_geo = dy.atan2(dx);
    let lat_geo = dz.atan2(dx.hypot(dy));

    // Apply FK5 correction
    let t = julian_centuries(jde);
    let (lon_fk5, lat_fk5) = fk5_correction(lon_geo, lat_geo, t);

    let nut = nutation(jde);

    // Apply aberration correction
    let (lon_ab, lat_ab) = aberration_from_earth(lon_fk5, lat_fk5, earth, earth_speed);
    // Rotate the aberrated mean direction to the true equinox.
    let lon_ab = lon_ab + to_rad(nut.dpsi / 3600.0);

    let lon_deg = norm_deg(to_deg(lon_ab));
    let lat_deg = to_deg(lat_ab);

    // Convert to equatorial
    // PERF-7: reuse the nutation already computed above instead of letting
    // true_obliquity recompute the same 77-term series. Byte-identical:
    // true_obliquity(jde) == mean_obliquity(jde) + nut.deps / 3600.0.
    let eps = mean_obliquity(jde) + nut.deps / 3600.0;
    let (ra, dec) = ecl_to_equ(
        Longitude::new(lon_deg),
        Latitude::new(lat_deg),
        Degrees::new(eps),
    );

    GeocentricPos {
        lon: lon_deg,
        lat: lat_deg,
        dist,
        ra,
        dec,
    }
}

/// Compute the Sun's apparent geocentric position (JDE = TT).
///
/// This is the negative of the Earth's heliocentric position with
/// aberration and nutation applied.
#[inline]
#[must_use]
pub fn apparent_sun(jde: f64) -> GeocentricPos {
    let earth = heliocentric(Planet::Earth, jde);
    let t = julian_centuries(jde);

    // Sun's geometric longitude = Earth's heliocentric + 180°
    let lon_geo = earth.lon + std::f64::consts::PI;
    let lat_geo = -earth.lat;

    // FK5 correction
    let (lon_fk5, lat_fk5) = fk5_correction(lon_geo, lat_geo, t);

    // Nutation
    let nut = nutation(jde);
    let lon_nut = lon_fk5 + to_rad(nut.dpsi / 3600.0);

    // Solar aberration (Meeus 25): -20.4898 arcseconds divided by R (AU).
    let lon_ab = lon_nut - to_rad(20.4898 / (3600.0 * earth.rad));
    let lat_ab = lat_fk5;

    let lon_deg = norm_deg(to_deg(lon_ab));
    let lat_deg = to_deg(lat_ab);

    // PERF-7: reuse the nutation already computed above instead of letting
    // true_obliquity recompute the same 77-term series. Byte-identical:
    // true_obliquity(jde) == mean_obliquity(jde) + nut.deps / 3600.0.
    let eps = mean_obliquity(jde) + nut.deps / 3600.0;
    let (ra, dec) = ecl_to_equ(
        Longitude::new(lon_deg),
        Latitude::new(lat_deg),
        Degrees::new(eps),
    );

    GeocentricPos {
        lon: lon_deg,
        lat: lat_deg,
        dist: earth.rad,
        ra,
        dec,
    }
}

/// Compute the Moon's apparent geocentric position (JDE = TT).
#[inline]
#[must_use]
pub fn apparent_moon(jde: f64) -> GeocentricPos {
    if let Some(position) = precision_apparent(1, jde) {
        return position;
    }
    let lunar = lunar_position(jde);
    let nut = nutation(jde);
    let lon_deg = norm_deg(to_deg(lunar.lon) + nut.dpsi / 3600.0);
    let lat_deg = to_deg(lunar.lat);
    let dist_au = lunar.dist_km / 149_597_870.7;

    // PERF-7: reuse the nutation already computed above instead of letting
    // true_obliquity recompute the same 77-term series. Byte-identical:
    // true_obliquity(jde) == mean_obliquity(jde) + nut.deps / 3600.0.
    let eps = mean_obliquity(jde) + nut.deps / 3600.0;
    let (ra, dec) = ecl_to_equ(
        Longitude::new(lon_deg),
        Latitude::new(lat_deg),
        Degrees::new(eps),
    );

    GeocentricPos {
        lon: lon_deg,
        lat: lat_deg,
        dist: dist_au,
        ra,
        dec,
    }
}

/// Finish full-state mean-ecliptic tables without applying a second FK5 change.
/// Planet states retain light time but need deflection and aberration; lunar
/// table states already include Swiss apparent lunar treatment except nutation.
pub(crate) fn precision_apparent(body_id: u32, jde: f64) -> Option<GeocentricPos> {
    let vector = crate::astronomy::precision_ephemeris::pre_apparent(body_id, jde)?;
    let dist = vector.iter().map(|x| x*x).sum::<f64>().sqrt();
    let (lon, lat) = if body_id == 1 {
        (vector[1].atan2(vector[0]), vector[2].atan2(vector[0].hypot(vector[1])))
    } else {
        let (earth, speed) = heliocentric_with_speed(Planet::Earth, jde);
        let (x, y, z) = ecliptic_rect(earth.lon, earth.lat, earth.rad);
        let direction = solar_deflection(vector, [x, y, z]);
        aberration_from_earth(direction[1].atan2(direction[0]), direction[2].atan2(direction[0].hypot(direction[1])), earth, speed)
    };
    let nut = nutation(jde);
    let lon = norm_deg(to_deg(lon) + nut.dpsi / 3600.0);
    let lat = to_deg(lat);
    let eps = mean_obliquity(jde) + nut.deps / 3600.0;
    let (ra, dec) = ecl_to_equ(Longitude::new(lon), Latitude::new(lat), Degrees::new(eps));
    Some(GeocentricPos { lon, lat, dist, ra, dec })
}

// ─── Coordinate helpers ───────────────────────────────────────────────────────

/// Convert spherical ecliptic to rectangular. Pairs sin/cos via `sin_cos`
/// (one transcendental call per angle vs. two) — meaningful inside the
/// light-time-correction loop in `apparent_planet`, which calls this 4× including the Earth vector.
#[inline]
fn ecliptic_rect(lon: f64, lat: f64, r: f64) -> (f64, f64, f64) {
    let (sin_lon, cos_lon) = lon.sin_cos();
    let (sin_lat, cos_lat) = lat.sin_cos();
    (r * cos_lat * cos_lon, r * cos_lat * sin_lon, r * sin_lat)
}

/// Convert ecliptic longitude/latitude (degrees) to RA/Dec (degrees).
#[must_use]
pub fn ecl_to_equ(lon: Longitude, lat: Latitude, eps: Degrees) -> (f64, f64) {
    let lon: f64 = lon.into();
    let lat: f64 = lat.into();
    let eps: f64 = eps.into();
    let lon_r = to_rad(lon);
    let lat_r = to_rad(lat);
    let eps_r = to_rad(eps);
    let (sin_lon, cos_lon) = lon_r.sin_cos();
    let (sin_lat, cos_lat) = lat_r.sin_cos();
    let cos_lat_denom = cos_lat.abs().max(1e-10).copysign(cos_lat);
    let (sin_eps, cos_eps) = eps_r.sin_cos();

    let ra = norm_deg(to_deg(
        (sin_lon * cos_eps - sin_lat / cos_lat_denom * sin_eps).atan2(cos_lon),
    ));
    let dec = to_deg((sin_lat * cos_eps + cos_lat * sin_eps * sin_lon).asin());
    (ra, dec)
}

/// FK5 correction to ecliptic longitude and latitude (radians → radians).
#[inline]
fn fk5_correction(lon: f64, lat: f64, t: f64) -> (f64, f64) {
    let lp = lon - to_rad(1.397) * t - to_rad(0.000_31) * t * t;
    let (sin_lp, cos_lp) = lp.sin_cos();
    let delta_lon = to_rad((-0.09033 + 0.03916 * (cos_lp + sin_lp) * lat.tan()) / 3600.0);
    let delta_lat = to_rad((0.03916 * (cos_lp - sin_lp)) / 3600.0);
    (lon + delta_lon, lat + delta_lat)
}

/// Annual aberration from the Earth's instantaneous VSOP87D velocity.
/// Input and output directions are ecliptic of date, in radians. The Lorentz
/// transformation avoids singular longitude corrections near the poles.
/// The derivative includes motion of the date frame, whose sub-milliarcsecond
/// effect on aberration is below this model's accuracy.
#[inline]
pub(crate) fn aberration(lon: f64, lat: f64, jde: f64) -> (f64, f64) {
    let (earth, (dl, db, dr)) = heliocentric_with_speed(Planet::Earth, jde);
    aberration_from_earth(lon, lat, earth, (dl, db, dr))
}

#[inline]
fn aberration_from_earth(
    lon: f64,
    lat: f64,
    earth: HeliocentricPos,
    (dl, db, dr): (f64, f64, f64),
) -> (f64, f64) {
    let (sl, cl) = earth.lon.sin_cos();
    let (sb, cb) = earth.lat.sin_cos();
    let dl = to_rad(dl);
    let db = to_rad(db);
    let velocity = [
        dr * cb * cl - earth.rad * db * sb * cl - earth.rad * dl * cb * sl,
        dr * cb * sl - earth.rad * db * sb * sl + earth.rad * dl * cb * cl,
        dr * sb + earth.rad * db * cb,
    ];
    let beta = velocity.map(|v| v / LIGHT_SPEED_AU_DAY);
    let (sl, cl) = lon.sin_cos();
    let (sb, cb) = lat.sin_cos();
    let direction = [cb * cl, cb * sl, sb];
    let dot = direction.iter().zip(beta).map(|(n, b)| n * b).sum::<f64>();
    let beta2 = beta.iter().map(|b| b * b).sum::<f64>();
    let inverse_gamma = (1.0 - beta2).sqrt();
    let factor = 1.0 + dot / (1.0 + inverse_gamma);
    let shifted = std::array::from_fn::<_, 3, _>(|i| {
        (inverse_gamma * direction[i] + factor * beta[i]) / (1.0 + dot)
    });
    (
        shifted[1].atan2(shifted[0]),
        shifted[2].atan2(shifted[0].hypot(shifted[1])),
    )
}

#[cfg(test)]
mod tests {
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    use super::*;

    #[test]
    fn precision_apparent_matches_independent_swiss_states() {
        // Swiss 2.10.03, SWIEPH, TT, apparent geocentric ecliptic-of-date.
        // sepl_18/semo_18 hashes are pinned in the precision table manifest.
        let cases = [
            (1, 2425977.5, 290.85894693409261, -4.76238424666947),
            (2, 2425977.5, 298.08992476276717, -1.69873168380204),
            (8, 2425977.5, 153.40250206029498, 0.64629447602994),
            (9, 2425977.5, 108.72393195667239, -0.26794603930354),
            (1, 2451545.0, 223.31487054176762, 5.17087200951369),
            (2, 2451545.0, 271.88812734747586, -0.99475659058600),
            (8, 2451545.0, 303.19298694751757, 0.23499201329578),
            (9, 2451545.0, 251.45475332520456, 10.85523062557241),
            (1, 2466520.25, 252.46911947773424, -1.65062845779677),
            (2, 2466520.25, 290.69696767799428, -2.16239270500360),
            (8, 2466520.25, 33.09450280782525, -1.77493336229585),
            (9, 2466520.25, 325.45514070509716, -10.01245767523846),
        ];
        for (body, jd, lon, lat) in cases {
            let actual = precision_apparent(body, jd).unwrap();
            let longitude_error = ((actual.lon - lon + 180.0).rem_euclid(360.0) - 180.0).abs() * 3600.0;
            let latitude_error = (actual.lat - lat).abs() * 3600.0;
            assert!(longitude_error < 0.02 && latitude_error < 0.02, "body {body} JD {jd}: longitude {longitude_error} latitude {latitude_error} arcsec");
        }
    }

    /// Meeus Example 25.a, 1992 Oct 13, TT. Apparent longitude about 199.906°.
    #[test]
    fn sun_1992_oct_13() {
        let pos = apparent_sun(2_448_908.5);
        assert!((pos.lon - 199.906).abs() < 0.001, "Sun lon = {}", pos.lon);
        assert!((pos.lat - 0.0002).abs() < 0.00001, "Sun lat = {}", pos.lat);
        assert!(
            (pos.dist - 0.9976085).abs() < 0.000001,
            "Sun dist = {}",
            pos.dist
        );
    }

    /// Independent Swiss Ephemeris 2.10.03 SWIEPH geocentric apparent
    /// tropical ecliptic-of-date fixtures. JDE is TT (swe_calc, not calc_ut).
    /// Files: sepl_18.se1 and semo_18.se1; generated with pyswisseph 2.10.3.2.
    /// The 4 arcsecond threshold includes intrinsic VSOP87D/DE431 differences;
    /// it is much tighter than the one arcminute public target.
    #[test]
    fn apparent_positions_against_swiss_1930_2040() {
        let cases = [
            (2425977.5, None, 279.857674649355, -0.000050061592),
            (
                2425977.5,
                Some(Planet::Mercury),
                298.089924762767,
                -1.698731683802,
            ),
            (
                2425977.5,
                Some(Planet::Venus),
                271.062181047511,
                -0.078751110371,
            ),
            (
                2425977.5,
                Some(Planet::Mars),
                271.917218218765,
                -0.678441770047,
            ),
            (
                2425977.5,
                Some(Planet::Jupiter),
                67.882560601882,
                -0.690340797481,
            ),
            (
                2425977.5,
                Some(Planet::Saturn),
                273.712154557249,
                0.774431158963,
            ),
            (
                2425977.5,
                Some(Planet::Uranus),
                7.547275092022,
                -0.689963329829,
            ),
            (
                2425977.5,
                Some(Planet::Neptune),
                153.402502060295,
                0.646294476030,
            ),
            (2451545.0, None, 280.368165552580, 0.000227358550),
            (
                2451545.0,
                Some(Planet::Mercury),
                271.888127347476,
                -0.994756590586,
            ),
            (
                2451545.0,
                Some(Planet::Venus),
                241.564895190656,
                2.066369791593,
            ),
            (
                2451545.0,
                Some(Planet::Mars),
                327.962729488835,
                -1.067794655571,
            ),
            (
                2451545.0,
                Some(Planet::Jupiter),
                25.253057067051,
                -1.262191672867,
            ),
            (
                2451545.0,
                Some(Planet::Saturn),
                40.395678230260,
                -2.444858236722,
            ),
            (
                2451545.0,
                Some(Planet::Uranus),
                314.809150530645,
                -0.658335042866,
            ),
            (
                2451545.0,
                Some(Planet::Neptune),
                303.192986947518,
                0.234992013296,
            ),
            (2466155.0, None, 280.665918604037, 0.000086987446),
            (
                2466155.0,
                Some(Planet::Mercury),
                278.530218328891,
                -1.593924420330,
            ),
            (
                2466155.0,
                Some(Planet::Venus),
                244.352066864213,
                1.848051465941,
            ),
            (
                2466155.0,
                Some(Planet::Mars),
                102.287704989111,
                3.768094377857,
            ),
            (
                2466155.0,
                Some(Planet::Jupiter),
                181.479641325930,
                1.283961970018,
            ),
            (
                2466155.0,
                Some(Planet::Saturn),
                191.672325747590,
                2.367488821767,
            ),
            (
                2466155.0,
                Some(Planet::Uranus),
                122.233538118427,
                0.594135780256,
            ),
            (
                2466155.0,
                Some(Planet::Neptune),
                30.834625182396,
                -1.762547736269,
            ),
        ];
        for (jd, planet, lon, lat) in cases {
            let actual = planet.map_or_else(|| apparent_sun(jd), |p| apparent_planet(p, jd));
            let error = ((actual.lon - lon + 540.0) % 360.0 - 180.0).abs();
            assert!(
                error * 3600.0 < 4.0,
                "{planet:?} at {jd}: longitude error {} arcsec",
                error * 3600.0
            );
            assert!(
                (actual.lat - lat).abs() * 3600.0 < 1.0,
                "{planet:?} at {jd}: latitude error"
            );
        }
    }

    #[test]
    fn all_planets_finite_j2000() {
        let jde = 2_451_545.0;
        for p in [
            Planet::Mercury,
            Planet::Venus,
            Planet::Mars,
            Planet::Jupiter,
            Planet::Saturn,
            Planet::Uranus,
            Planet::Neptune,
        ] {
            let pos = apparent_planet(p, jde);
            assert!(pos.lon.is_finite(), "{p:?} lon NaN");
            assert!(pos.lat.is_finite(), "{p:?} lat NaN");
            assert!(pos.dist > 0.0, "{p:?} dist <= 0");
        }
    }

    #[test]
    fn moon_finite_j2000() {
        let pos = apparent_moon(2_451_545.0);
        assert!(pos.lon.is_finite());
        assert!(pos.lat.is_finite());
        assert!(pos.dist > 0.0);
    }

    #[test]
    fn ecl_to_equ_poles_are_finite() {
        for lat in [-90.0, 90.0] {
            let (ra, dec) = ecl_to_equ(
                Longitude::new(123.0),
                Latitude::new(lat),
                Degrees::new(23.4393),
            );
            assert!(ra.is_finite(), "ra={ra} lat={lat}");
            assert!(dec.is_finite(), "dec={dec} lat={lat}");
        }
    }

    #[test]
    fn aberration_poles_are_finite() {
        for lat in [-90.0, 90.0] {
            let (lon, corrected_lat) = aberration(to_rad(123.0), to_rad(lat), 2_451_545.0);
            assert!(lon.is_finite(), "lon={lon} lat={lat}");
            assert!(
                corrected_lat.is_finite(),
                "corrected_lat={corrected_lat} lat={lat}"
            );
        }
    }
}
