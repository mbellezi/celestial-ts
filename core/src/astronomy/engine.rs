//! Planetary computation engine — core dispatch hub.
//!
//! This module owns the `calc_ut` / `calc_tt` entry points and routes each
//! body-number to the appropriate algorithm (VSOP87, ELP2000, nodes, Chiron).
//! All other `astronomy::*` modules contain the pure maths; this module just
//! coordinates them.

use crate::astronomy::{
    ayanamsa::{ayanamsa as calc_ayanamsa, SidMode},
    body,
    constants::norm_deg,
    delta_t::ut_to_tt,
    flag,
    planetary::{apparent_moon, apparent_planet, apparent_sun},
    vsop87::{heliocentric, heliocentric_with_speed, Planet},
};
use crate::error::{Error, Result};
use crate::types::PlanetPos;
use crate::units::JulianDay;

// ─── Entry points ─────────────────────────────────────────────────────────────

/// Compute apparent geocentric position using UT (Universal Time).
///
/// Body numbers follow the Swiss Ephemeris convention (see [`body`]).
/// Flags are the `FLG_*` constants from [`crate::constants`].
#[inline]
pub fn calc_ut(jd_ut: JulianDay, body_num: i32, flags: i32) -> Result<PlanetPos> {
    let jd_ut: f64 = jd_ut.into();
    let jde = ut_to_tt(JulianDay::new(jd_ut));
    calc_tt(jde, body_num, flags)
}

/// Compute apparent geocentric position using TT (Terrestrial Time / JDE).
#[inline]
pub fn calc_tt(jde: f64, body_num: i32, flags: i32) -> Result<PlanetPos> {
    let use_equatorial = flags as u32 & flag::FLG_EQUATORIAL != 0;

    let geo = match body_num {
        body::SUN => apparent_sun(jde),
        body::MERCURY => apparent_planet(Planet::Mercury, jde),
        body::VENUS => apparent_planet(Planet::Venus, jde),
        body::MARS => apparent_planet(Planet::Mars, jde),
        body::JUPITER => apparent_planet(Planet::Jupiter, jde),
        body::SATURN => apparent_planet(Planet::Saturn, jde),
        body::URANUS => apparent_planet(Planet::Uranus, jde),
        body::NEPTUNE => apparent_planet(Planet::Neptune, jde),
        body::MOON => apparent_moon(jde),
        body::MEAN_NODE | body::TRUE_NODE => return Ok(calc_node(jde, body_num, flags)),
        body::CHIRON => return Ok(calc_chiron(jde, flags)),
        body::PLUTO => return Ok(calc_pluto(jde, flags)),
        _ => {
            return Err(Error::Calc(
                "body not implemented in pure-Rust engine".into(),
            ))
        }
    };

    if flags as u32 & flag::FLG_HELCTR != 0 {
        if let Some(pos) = calc_heliocentric(jde, body_num, flags) {
            return Ok(pos);
        }
    }

    let mut lon = if use_equatorial { geo.ra } else { geo.lon };
    let lat = if use_equatorial { geo.dec } else { geo.lat };

    if flags & crate::FLG_TOPOCTR != 0 {
        lon = topocentric_lon(jde, &geo, use_equatorial);
    }

    if flags as u32 & flag::FLG_SIDEREAL != 0 {
        lon = norm_deg(lon - sidereal_ayanamsa(jde));
    }

    let (speed_lon, speed_lat, speed_dist) = compute_speed(jde, body_num, flags, use_equatorial)?;

    Ok(PlanetPos {
        lon,
        lat,
        dist: geo.dist,
        speed_lon,
        speed_lat,
        speed_dist,
        ret_flags: (flags as u32 | flag::FLG_BUILTIN) as i32,
    })
}

fn calc_node(jde: f64, body_num: i32, flags: i32) -> PlanetPos {
    let (lon, speed_lon, dist, speed_dist) = if body_num == body::MEAN_NODE {
        (crate::astronomy::nodes::moon_mean_node(JulianDay::new(jde)),
         crate::astronomy::nodes::moon_mean_node_speed(JulianDay::new(jde)),
         0.0025695552898, 0.0)
    } else {
        crate::astronomy::nodes::moon_true_node_state(JulianDay::new(jde))
    };
    let speed = flags as u32 & flag::FLG_SPEED != 0;
    PlanetPos { lon, lat: 0.0, dist, speed_lon: if speed { speed_lon } else { 0.0 },
        speed_lat: 0.0, speed_dist: if speed { speed_dist } else { 0.0 },
        ret_flags: (flags as u32 | flag::FLG_BUILTIN) as i32 }
}

fn calc_chiron(jde: f64, flags: i32) -> PlanetPos {
    calc_outer_body(jde, body::CHIRON, flags)
}

fn calc_pluto(jde: f64, flags: i32) -> PlanetPos {
    calc_outer_body(jde, body::PLUTO, flags)
}

/// Apply the same coordinate/velocity conventions to the two non-VSOP bodies.
fn calc_outer_body(jde: f64, body_num: i32, flags: i32) -> PlanetPos {
    let helio = flags as u32 & flag::FLG_HELCTR != 0;
    let (mut lon, mut lat, dist) = match (body_num, helio) {
        (body::CHIRON, true) => crate::astronomy::chiron::chiron_pos(JulianDay::new(jde)),
        (body::CHIRON, false) => crate::astronomy::chiron::chiron_geocentric(jde),
        (_, true) => crate::astronomy::pluto::pluto_pos(jde),
        (_, false) => crate::astronomy::pluto::pluto_geocentric(jde),
    };
    if helio {
        let (l,b) = crate::astronomy::pluto::precess_ecliptic(lon.to_radians(),lat.to_radians(),2451545.0,jde);
        lon = l.to_degrees().rem_euclid(360.0); lat = b.to_degrees();
    }
    if flags as u32 & flag::FLG_EQUATORIAL != 0 {
        let eps = crate::astronomy::nutation::mean_obliquity(jde)
            + if helio { 0.0 } else { crate::astronomy::nutation::nutation(jde).deps/3600.0 };
        (lon,lat) = crate::astronomy::planetary::ecl_to_equ(
            crate::units::Longitude::new(lon),crate::units::Latitude::new(lat),crate::units::Degrees::new(eps));
    }
    if flags as u32 & flag::FLG_SIDEREAL != 0 { lon = norm_deg(lon-sidereal_ayanamsa(jde)); }
    let (speed_lon,speed_lat,speed_dist) = if flags as u32 & flag::FLG_SPEED != 0 {
        let h = 0.0001;
        let interval = (jde + h) - (jde - h);
        let position_flags = flags & !(flag::FLG_SPEED as i32);
        let p = calc_outer_body(jde+h,body_num,position_flags);
        let m = calc_outer_body(jde-h,body_num,position_flags);
        (angle_speed(p.lon,m.lon)/interval,(p.lat-m.lat)/interval,(p.dist-m.dist)/interval)
    } else { (0.0,0.0,0.0) };
    PlanetPos { lon,lat,dist,speed_lon,speed_lat,speed_dist,
        ret_flags: (flags as u32 | flag::FLG_BUILTIN) as i32 }
}

fn calc_heliocentric(jde: f64, body_num: i32, flags: i32) -> Option<PlanetPos> {
    let vsop_planet = body_to_vsop(body_num)?;
    let (h, (speed_lon, speed_lat, speed_dist)) = if flags as u32 & flag::FLG_SPEED != 0 {
        heliocentric_with_speed(vsop_planet, jde)
    } else {
        (heliocentric(vsop_planet, jde), (0.0, 0.0, 0.0))
    };
    let lon_deg = h.lon.to_degrees().rem_euclid(360.0);
    let lat_deg = h.lat.to_degrees();
    Some(PlanetPos {
        lon: lon_deg,
        lat: lat_deg,
        dist: h.rad,
        speed_lon,
        speed_lat,
        speed_dist,
        ret_flags: (flags as u32 | flag::FLG_BUILTIN) as i32,
    })
}

fn sidereal_ayanamsa(jde: f64) -> f64 {
    let sid_mode = crate::functions::config::current_sid_mode();
    let mode = SidMode::from_i32(sid_mode).unwrap_or(SidMode::Lahiri);
    calc_ayanamsa(jde, mode)
}

/// Apply diurnal parallax (FLG_TOPOCTR) and return the corrected lon.
/// Significant for Moon (~57'), smaller for Sun (~8.8"), negligible for outer planets.
fn topocentric_lon(
    jde: f64,
    geo: &crate::astronomy::planetary::GeocentricPos,
    use_equatorial: bool,
) -> f64 {
    let (obs_lon, obs_lat, obs_alt) = crate::functions::config::current_topo();
    let obs_lat_r = obs_lat.to_radians();

    let dist_km = geo.dist * 149_597_870.7;
    let sin_pi = 6_378.137 / dist_km;
    let horiz_parallax_r = sin_pi.asin();

    let gst_deg = crate::functions::time::sidtime(JulianDay::new(
        jde - crate::astronomy::delta_t::delta_t(JulianDay::new(jde)) / 86400.0,
    )) * 15.0;
    let ha_deg = (gst_deg + obs_lon - geo.ra).rem_euclid(360.0);
    let ha_r = ha_deg.to_radians();

    let u = (0.996_647_19_f64 * obs_lat_r.tan()).atan();
    let (sin_u, cos_u) = u.sin_cos();
    let (sin_obs_lat, cos_obs_lat) = obs_lat_r.sin_cos();
    let alt_ratio = obs_alt / 6_378_137.0;
    let rho_sin = alt_ratio.mul_add(sin_obs_lat, 0.996_647_19 * sin_u);
    let rho_cos = alt_ratio.mul_add(cos_obs_lat, cos_u);

    let dec_r = geo.dec.to_radians();
    let hp_sin = horiz_parallax_r.sin();
    let (sin_ha, cos_ha) = ha_r.sin_cos();
    let (sin_dec, cos_dec) = dec_r.sin_cos();
    let rho_cos_hp = rho_cos * hp_sin;
    let denom = (-rho_cos_hp).mul_add(cos_ha, cos_dec);
    let delta_ra = (-rho_cos_hp * sin_ha) / denom;
    let delta_dec = rho_cos_hp
        .mul_add(cos_ha * delta_ra.sin(), -rho_sin * hp_sin)
        .mul_add(sin_dec, -rho_cos_hp * cos_ha)
        / denom;

    let topo_ra = geo.ra + delta_ra.atan().to_degrees();
    let topo_dec = geo.dec + delta_dec.atan().to_degrees();

    if use_equatorial {
        return topo_ra.rem_euclid(360.0);
    }
    let eps_r = crate::astronomy::obliquity(jde).to_radians();
    let ra_r2 = topo_ra.to_radians();
    let dec_r2 = topo_dec.to_radians();
    let (sin_ra2, cos_ra2) = ra_r2.sin_cos();
    let (sin_eps2, cos_eps2) = eps_r.sin_cos();
    dec_r2
        .tan()
        .mul_add(sin_eps2, sin_ra2 * cos_eps2)
        .atan2(cos_ra2)
        .to_degrees()
        .rem_euclid(360.0)
}

/// Compute (speed_lon, speed_lat, speed_dist) via numerical differentiation.
/// In equatorial mode, recursively calls calc_tt to get RA/Dec rates.
fn compute_speed(
    jde: f64,
    body_num: i32,
    flags: i32,
    use_equatorial: bool,
) -> Result<(f64, f64, f64)> {
    if flags as u32 & flag::FLG_SPEED == 0 {
        return Ok((0.0, 0.0, 0.0));
    }
    // Resolve solar-disc deflection without averaging across its steep profile.
    // Use the actual representable JD spacing, not a rounded ideal interval.
    let h = 0.0001;
    let interval = (jde + h) - (jde - h);
    if use_equatorial {
        let flags_pos = flags & !(crate::astronomy::flag::FLG_SPEED as i32);
        let p_plus = calc_tt(jde + h, body_num, flags_pos)?;
        let p_minus = calc_tt(jde - h, body_num, flags_pos)?;
        return Ok((
            angle_speed(p_plus.lon, p_minus.lon) / interval,
            (p_plus.lat - p_minus.lat) / interval,
            (p_plus.dist - p_minus.dist) / interval,
        ));
    }
    let p_plus = body_position(body_num, jde + h)?;
    let p_minus = body_position(body_num, jde - h)?;
    Ok((
        angle_speed(p_plus.0, p_minus.0) / interval,
        (p_plus.1 - p_minus.1) / interval,
        (p_plus.2 - p_minus.2) / interval,
    ))
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/// Returns `(lon_deg, lat_deg, dist_au)` for a body at a given JDE.
pub(crate) fn body_position(body_num: i32, jde: f64) -> Result<(f64, f64, f64)> {
    let geo = match body_num {
        body::SUN => apparent_sun(jde),
        body::MERCURY => apparent_planet(Planet::Mercury, jde),
        body::VENUS => apparent_planet(Planet::Venus, jde),
        body::MARS => apparent_planet(Planet::Mars, jde),
        body::JUPITER => apparent_planet(Planet::Jupiter, jde),
        body::SATURN => apparent_planet(Planet::Saturn, jde),
        body::URANUS => apparent_planet(Planet::Uranus, jde),
        body::NEPTUNE => apparent_planet(Planet::Neptune, jde),
        body::MOON => apparent_moon(jde),
        body::MEAN_NODE => {
            return Ok((
                crate::astronomy::nodes::moon_mean_node(JulianDay::new(jde)),
                0.0,
                0.0025695552898,
            ))
        }
        body::TRUE_NODE => {
            let (lon, _, dist, _) = crate::astronomy::nodes::moon_true_node_state(JulianDay::new(jde));
            return Ok((lon, 0.0, dist));
        }
        body::CHIRON => {
            let (l, b, r) = crate::astronomy::chiron::chiron_geocentric(jde);
            return Ok((l, b, r));
        }
        body::PLUTO => return Ok(crate::astronomy::pluto::pluto_geocentric(jde)),
        _ => return Err(Error::BodyNotImplemented { body: body_num }),
    };
    Ok((geo.lon, geo.lat, geo.dist))
}

/// Compute angular speed (°/day) accounting for 0°/360° wrap.
fn angle_speed(plus: f64, minus: f64) -> f64 {
    let raw = plus - minus;
    if raw > 180.0 {
        raw - 360.0
    } else if raw < -180.0 {
        raw + 360.0
    } else {
        raw
    }
}

/// Map a body constant to its VSOP87 Planet enum (returns None for Sun, Moon, nodes, Chiron).
fn body_to_vsop(body_num: i32) -> Option<Planet> {
    match body_num {
        body::MERCURY => Some(Planet::Mercury),
        body::VENUS => Some(Planet::Venus),
        body::MARS => Some(Planet::Mars),
        body::JUPITER => Some(Planet::Jupiter),
        body::SATURN => Some(Planet::Saturn),
        body::URANUS => Some(Planet::Uranus),
        body::NEPTUNE => Some(Planet::Neptune),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;

    use super::*;
    use crate::units::{Latitude, Longitude};

    fn assert_position(actual: &PlanetPos, expected: [f64; 6]) {
        let actual = [
            actual.lon,
            actual.lat,
            actual.dist,
            actual.speed_lon,
            actual.speed_lat,
            actual.speed_dist,
        ];
        for (actual, expected) in actual.into_iter().zip(expected) {
            assert!((actual - expected).abs() < 1e-9, "{actual} != {expected}");
        }
    }

    #[test]
    fn engine_dispatch_and_flags_match_regression_vectors() {
        let _config_guard = crate::functions::config::TestConfigGuard::new();
        crate::functions::config::set_topo(Longitude::new(12.5), Latitude::new(48.25), 350.0);
        let cases = [
            (body::SUN, 258, [140.1305440882735, 3.418790053344105e-05, 1.0133288140270713, 0.9598885555254189, 3.3617022057474953e-05, -0.00017749958901463333]),
            (body::MOON, 258, [206.63106763987653, -0.5875401323810377, 0.0026588114593507042, 12.200151741945428, 1.0734065619257445, -2.6974313355300766e-05]),
            (body::MERCURY, 258, [121.25784425649907, -1.1595614453815397, 0.9057452142863742, 0.9838327538612527, 0.26676318895255696, 0.02589692058065319]),
            (body::VENUS, 258, [159.49009788573056, 1.4396073545861203, 1.592701129081559, 1.2267727154202341, -0.011246061954348721, -0.003908729822785265]),
            (body::MARS, 258, [130.2499243044335, 1.1108078576112685, 2.6282895577501066, 0.6419572188756651, 0.0033670857767705547, -0.001022781629322747]),
            (body::JUPITER, 258, [294.34677234634256, -0.5042338356683456, 4.197715575454598, -0.10408309466711782, -0.0014225825752591048, 0.006539428605137507]),
            (body::SATURN, 258, [93.34810681378738, -0.9902768740455449, 9.679571514783094, 0.10280814961228721, 0.00014164955956569907, -0.012031909621745308]),
            (body::URANUS, 258, [90.3876265435438, 0.17949568448186098, 19.682140191854838, 0.04313974509989798, 0.00026992795361328024, -0.013091549301452995]),
            (body::NEPTUNE, 258, [17.737444729172598, -1.6176634810516206, 29.291260983682353, -0.011802194131245138, -0.0008650946044694501, -0.014149779608368369]),
            (body::PLUTO, 258, [313.88367853342265, -7.147360051671049, 36.119653922686034, -0.022584090681468803, -0.0008210853600676541, 0.0027102329479321767]),
            (body::MEAN_NODE, 258, [214.27371771428153, 0.0, 0.0025695552898, -0.052973904979703945, 0.0, 0.0]),
            (body::TRUE_NODE, 258, [213.27847909167963, 0.0, 0.002643123996366021, -0.010118789724431256, 0.0, -2.64707144391873e-07]),
            (body::CHIRON, 258, [55.93695355660134, -2.6647622158849624, 16.238266873419953, 0.018588608761246923, -0.004162835608978729, -0.01796990445271832]),
            (body::MEAN_NODE, 2, [214.27371771428153, 0.0, 0.0025695552898, 0.0, 0.0, 0.0]),
            (body::CHIRON, 2, [55.93695355660134, -2.6647622158849624, 16.238266873419953, 0.0, 0.0, 0.0]),
            (body::PLUTO, 2, [313.88367853342265, -7.147360051671049, 36.119653922686034, 0.0, 0.0, 0.0]),
            (body::MOON, 2306, [204.4903641861343, -10.815959195073964, 0.0026588114593507042, 11.973709952987367, -3.4145574872127415, -2.6974313355300766e-05]),
            (body::MOON, 33026, [206.90360978131187, -0.5875401323810377, 0.0026588114593507042, 12.200151741945428, 1.0734065619257445, -2.6974313355300766e-05]),
            (body::MOON, 35074, [204.985787408134, -10.815959195073964, 0.0026588114593507042, 14.280715349647055, -3.4145574872127415, -2.6974313355300766e-05]),
            (body::VENUS, 266, [187.34232246086208, 3.183117999152018, 0.7205154556660428, 1.6168280640615547, -0.03327660167900506, 0.00011198828142437515]),
            (body::VENUS, 10, [187.34232246086535, 3.183117999152018, 0.7205154556660428, 0.0, 0.0, 0.0]),
            (body::JUPITER, 266, [299.27275454367265, -0.41272217609252787, 5.129029025451272, 0.08542261086268077, -0.001841387245564407, -0.0003516996114985271]),
            (body::SATURN, 266, [88.65193643938865, -1.0631441895638192, 9.016102898549324, 0.037379665341723864, 0.0014663510524714045, -2.18924486965258e-05]),
            (body::URANUS, 266, [88.06211680040764, 0.18556014804794269, 19.04302810864428, 0.011923226537682591, 0.00015576726218439593, -0.0001816448313516449]),
            (body::NEPTUNE, 266, [16.08960419365805, -1.5877002432209302, 29.846249009654723, 0.006116998774773038, -8.200933880640304e-05, -8.103752098299013e-06]),
        ];

        for (body, flags, expected) in cases {
            let actual = calc_tt(2_463_456.789, body, flags).unwrap();
            assert_position(&actual, expected);
            assert_eq!(actual.ret_flags, flags | flag::FLG_BUILTIN as i32);
        }
    }

    #[test]
    fn angle_speed_preserves_wrap_boundaries() {
        let cases = [
            (10.0, 350.0, 20.0),
            (350.0, 10.0, -20.0),
            (180.0, 0.0, 180.0),
            (0.0, 180.0, -180.0),
        ];
        for (plus, minus, expected) in cases {
            assert_eq!(angle_speed(plus, minus), expected);
        }
    }

    #[test]
    fn body_position_dispatches_special_bodies() {
        for body in [body::MEAN_NODE, body::TRUE_NODE, body::CHIRON, body::PLUTO] {
            let actual = body_position(body, 2_463_456.789).unwrap();
            let public = calc_tt(2_463_456.789, body, flag::FLG_BUILTIN as i32).unwrap();
            assert_eq!(actual, (public.lon, public.lat, public.dist));
        }
    }

    #[test]
    fn original_eight_sign_boundary_witnesses_match_swiss() {
        // Independent Swiss 2.10.03 SWIEPH|SPEED, apparent tropical
        // geocentric UT fixtures from residual-cases-before-deflection.json.
        // The original eight sign disagreements are particularly sensitive
        // to replacing Moon, Mercury, Neptune and Pluto source coordinates.
        let cases = [
            (2426677.5, 2, 9, 1.0915327176390606, 2e-05),
            (2437672.0, 1, 10, 14.705609991122298, 0.0001),
            (2445408.75, 1, 11, 12.611227388068281, 0.0001),
            (2453125.0, 1, 4, 12.862076404005334, 0.0001),
            (2460555.5, 9, 9, -0.01683667943584613, 1e-05),
            (2464166.75, 1, 6, 11.89497612485079, 0.0001),
            (2465565.5, 8, 0, 0.03341898787749671, 2e-05),
            (2465683.25, 1, 0, 11.906291908687797, 0.0001),
        ];
        for (ut, body, sign, speed, tolerance) in cases {
            let p = calc_ut(JulianDay::new(ut), body, 258).unwrap();
            assert_eq!((p.lon / 30.0).floor() as usize, sign, "UT {ut}, body {body}, longitude {}", p.lon);
            assert_eq!(p.speed_lon < 0.0, speed < 0.0, "UT {ut}, body {body}");
            assert!((p.speed_lon-speed).abs() < tolerance, "UT {ut}, body {body}: {} vs {speed}", p.speed_lon);
        }
    }

    #[test]
    fn original_twenty_one_true_node_station_witnesses_match_swiss() {
        // Independent Swiss 2.10.03 SWIEPH|SPEED UT fixtures, including
        // two random fractional instants; all are away from the documented
        // Swiss source discontinuity at UT 2462308.5 (tested separately).
        let cases = [
            (2431210.75, 1.693761486508283e-05),
            (2437074.25, -1.6913594666446e-05),
            (2438490.75, 1.327735828493324e-05),
            (2440449.25, 1.2699961727578713e-05),
            (2442049.25, 1.8019388174059148e-05),
            (2442535.75, 5.216239441548555e-08),
            (2447496.75, 4.176780864742182e-06),
            (2449592.25, 1.0140196827604292e-05),
            (2450163.25, 1.3828916721680997e-05),
            (2453387.75, 3.1655490650342307e-06),
            (2454313.75, -1.3156539158279645e-05),
            (2454702.5, -3.428180386132585e-07),
            (2456503.75, 2.7229359417517697e-06),
            (2456681.75, 5.736827537387245e-06),
            (2459007.25, 8.854025209306534e-06),
            (2462469.5, 3.084295771676209e-07),
            (2465260.75, -2.1543932590607194e-06),
            (2465579.75, -1.8292921135446186e-05),
            (2466042.0, 3.673806239804423e-07),
            (2457238.6184747946, -1.5396601484208838e-05),
            (2460210.3104330767, -2.965166284861596e-05),
        ];
        assert_eq!(cases.len(), 21);
        for (ut, expected_speed) in cases {
            let p = calc_ut(JulianDay::new(ut), body::TRUE_NODE, 258).unwrap();
            assert_eq!(p.speed_lon < 0.0, expected_speed < 0.0, "UT {ut}: {} vs {expected_speed}", p.speed_lon);
            // Bound the interpolation error to 0.0072 arcsecond/day; the
            // direction assertion separately resolves even the slowest stations.
            assert!((p.speed_lon-expected_speed).abs() < 2e-6, "UT {ut}: {} vs {expected_speed}", p.speed_lon);
        }
    }

    #[test]
    fn pluto_station_labels_follow_derivatives_of_swiss_longitudes() {
        // Swiss SPEED omits the time derivative of the equatorial-to-ecliptic
        // obliquity rotation. These independent central differences of Swiss
        // positions (h=.01 day) retain the physical direction at each witness.
        // See docs/validation/swiss-pluto-speed-diagnostic.json for flag isolation.
        let cases = [
            (2437646.0, -2.2333352944770013e-06),
            (2441477.75, 6.244484040962561e-06),
            (2445366.75, -3.1025109592519584e-06),
            (2446102.5, -1.0046775855698797e-06),
        ];
        for (ut, expected_speed) in cases {
            let p = calc_ut(JulianDay::new(ut), body::PLUTO, 258).unwrap();
            assert_eq!(p.speed_lon < 0.0, expected_speed < 0.0, "UT {ut}: {} vs {expected_speed}", p.speed_lon);
            assert!((p.speed_lon-expected_speed).abs() < 1e-7, "UT {ut}: {} vs {expected_speed}", p.speed_lon);
        }
    }

    #[test]
    fn true_node_source_discontinuity_does_not_reverse_smooth_motion() {
        // At this instant Swiss SPEED is +.1282548203 deg/day while its
        // longitude differences vary with h: +.0077308 (h=.001), -.0043200
        // (h=.01), -.0055069 (h=.1). Preserve smooth retrograde node motion
        // instead of reproducing that isolated source discontinuity.
        let p = calc_ut(JulianDay::new(2462308.5), body::TRUE_NODE, 258).unwrap();
        assert!(p.speed_lon < 0.0, "{}", p.speed_lon);
        assert!((p.speed_lon - (-0.005506864985704851)).abs() < 0.0002, "{}", p.speed_lon);
    }
}
