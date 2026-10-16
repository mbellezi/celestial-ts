//! Solar gravitational deflection, including finite source distances.
//!
//! Adapted from `swi_deflect_light` and `meff` in the official Swiss Ephemeris
//! `sweph.c`, commit c113653fe37fe5cdbfcc030a6e341de03ef018d2:
//! https://github.com/aloistr/swisseph/blob/c113653fe37fe5cdbfcc030a6e341de03ef018d2/sweph.c
//! The AGPL option below applies to this derivative.

/* Copyright (C) 1997 - 2021 Astrodienst AG, Switzerland.  All rights reserved.

  License conditions
  ------------------

  This file is part of Swiss Ephemeris.

  Swiss Ephemeris is distributed with NO WARRANTY OF ANY KIND.  No author
  or distributor accepts any responsibility for the consequences of using it,
  or for whether it serves any particular purpose or works at all, unless he
  or she says so in writing.  

  Swiss Ephemeris is made available by its authors under a dual licensing
  system. The software developer, who uses any part of Swiss Ephemeris
  in his or her software, must choose between one of the two license models,
  which are
  a) GNU Affero General Public License (AGPL)
  b) Swiss Ephemeris Professional License

  The choice must be made before the software developer distributes software
  containing parts of Swiss Ephemeris to others, and before any public
  service using the developed software is activated.

  If the developer choses the AGPL software license, he or she must fulfill
  the conditions of that license, which includes the obligation to place his
  or her whole software project under the AGPL or a compatible license.
  See https://www.gnu.org/licenses/agpl-3.0.html

  If the developer choses the Swiss Ephemeris Professional license,
  he must follow the instructions as found in http://www.astro.com/swisseph/ 
  and purchase the Swiss Ephemeris Professional Edition from Astrodienst
  and sign the corresponding license contract.

  The License grants you the right to use, copy, modify and redistribute
  Swiss Ephemeris, but only under certain conditions described in the License.
  Among other things, the License requires that the copyright notices and
  this notice be preserved on all copies.

  Authors of the Swiss Ephemeris: Dieter Koch and Alois Treindl

  The authors of Swiss Ephemeris have no control or influence over any of
  the derived works, i.e. over software or services created by other
  programmers which use Swiss Ephemeris functions.

  The names of the authors or of the copyright holder (Astrodienst) must not
  be used for promoting any software, product or service which uses or contains
  the Swiss Ephemeris. This copyright notice is the ONLY place where the
  names of the authors can legally appear, except in cases where they have
  given special permission in writing.

  The trademarks 'Swiss Ephemeris' and 'Swiss Ephemeris inside' may be used
  for promoting such software, products or services.
*/

/// Effective solar mass along a ray at a fractional solar radius. The table
/// uses the Stix solar mass distribution (The Sun, p. 47); it is the projected
/// deflecting mass, rather than simply the mass enclosed in a sphere.
const EFFECTIVE_MASS: [f64; 101] = [
    0.000000,
    0.002767,
    0.009645,
    0.020953,
    0.036361,
    0.054833,
    0.077393,
    0.102237,
    0.128421,
    0.156287,
    0.186794,
    0.218327,
    0.250431,
    0.283565,
    0.316691,
    0.349955,
    0.382892,
    0.415454,
    0.447322,
    0.478420,
    0.508554,
    0.537697,
    0.565747,
    0.592586,
    0.618252,
    0.642597,
    0.665741,
    0.687583,
    0.708234,
    0.727557,
    0.745815,
    0.763021,
    0.778931,
    0.793962,
    0.808031,
    0.820876,
    0.833074,
    0.844619,
    0.855423,
    0.865206,
    0.874312,
    0.882940,
    0.891022,
    0.898353,
    0.905035,
    0.911432,
    0.917527,
    0.923288,
    0.928668,
    0.933563,
    0.937790,
    0.941838,
    0.945741,
    0.949495,
    0.953088,
    0.956515,
    0.959758,
    0.962797,
    0.965594,
    0.968024,
    0.970174,
    0.972253,
    0.974256,
    0.976182,
    0.978024,
    0.979779,
    0.981437,
    0.982986,
    0.984398,
    0.985610,
    0.986755,
    0.987856,
    0.988912,
    0.989919,
    0.990873,
    0.991770,
    0.992598,
    0.993326,
    0.993991,
    0.994625,
    0.995226,
    0.995791,
    0.996316,
    0.996792,
    0.997198,
    0.997571,
    0.997919,
    0.998242,
    0.998535,
    0.998786,
    0.999000,
    0.999192,
    0.999354,
    0.999497,
    0.999622,
    0.999724,
    0.999811,
    0.999881,
    0.999940,
    0.999979,
    1.000000,
 ];

fn effective_mass(radius: f64) -> f64 {
    let x = radius.clamp(0.0, 1.0) * 100.0;
    let i = (x.floor() as usize).min(99);
    EFFECTIVE_MASS[i] + (x - i as f64) * (EFFECTIVE_MASS[i + 1] - EFFECTIVE_MASS[i])
}

/// Deflect a light-time-corrected geocentric vector (AU). Both vectors must
/// share an inertial orientation. Call before annual aberration and nutation.
/// The returned radius is not intended as a new physical distance.
/// Sun barycentric motion during light time is negligible at this precision.
pub(crate) fn solar_deflection(geocentric: [f64; 3], earth: [f64; 3]) -> [f64; 3] {
    let norm = |v: [f64; 3]| v[0].hypot(v[1]).hypot(v[2]);
    let source = std::array::from_fn(|i| geocentric[i] + earth[i]);
    let distance = norm(geocentric);
    let earth_distance = norm(earth);
    let source_distance = norm(source);
    if distance == 0.0 || earth_distance == 0.0 || source_distance == 0.0 {
        return geocentric;
    }
    let u = geocentric.map(|v| v / distance);
    let e = earth.map(|v| v / earth_distance);
    let q = source.map(|v| v / source_distance);
    let dot = |a: [f64; 3], b: [f64; 3]| (0..3).map(|i| a[i] * b[i]).sum::<f64>();
    let uq = dot(u, q);
    let ue = dot(u, e);
    // Cross product avoids catastrophic cancellation in 1 - (u dot e)^2
    // inside the disk. Likewise |q+e|²/2 is a stable form of 1 + q dot e.
    let cross = [u[1]*e[2]-u[2]*e[1], u[2]*e[0]-u[0]*e[2], u[0]*e[1]-u[1]*e[0]];
    let sine = norm(cross);
    let sum = std::array::from_fn(|i| q[i] + e[i]);
    let denominator = dot(sum, sum) * 0.5;
    if sine == 0.0 || denominator == 0.0 {
        return geocentric;
    }
    let solar_radius = (959.63_f64 / 3600.0).to_radians();
    let mass = effective_mass(sine * earth_distance / solar_radius);
    let strength = 2.0 * 1.32712440017987e20 / 299_792_458.0_f64.powi(2)
        / 149_597_870_700.0 / earth_distance * mass / denominator;
    std::array::from_fn(|i| distance * (u[i] + strength * (uq * e[i] - ue * q[i])))
}

#[cfg(test)]
mod tests {
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::wasm_bindgen_test as test;
    use super::*;

    #[test]
    fn independent_swiss_finite_distance_disk_fixtures() {
        // Swiss Ephemeris 2.10.03, SWIEPH, J2000 equatorial XYZ, NOABERR,
        // NONUT. Input uses NOGDEFL; expected removes only that flag.
        // TT = listed UT + swe.deltat(UT); fixtures generated independently
        // through pyswisseph, not from this implementation. All four rays
        // pass through the solar disk, spanning 0.012..0.377 solar radii.
        let cases = [
            ([-0.9691443457790754, 5.604600492969016, 2.426916718396447],
             [0.15952453734303582, -0.92119671815798, -0.39949838265882315],
             [-0.9691139039197231, 5.604640114314219, 2.426837375230886]),
            ([-5.516897803451318, -17.66899631899573, -7.660283555285753],
             [0.27129433584396495, 0.8689757469389037, 0.37678487479470446],
             [-5.516931472447536, -17.669004170882378, -7.660241196100852]),
            ([-14.535897578330792, 36.384790746997986, 15.732880358547058],
             [0.34992589306677846, -0.8755807359207323, -0.3797650912666793],
             [-14.53592870108379, 36.385137563305584, 15.732049535733209]),
            ([16.559314609928055, 8.780263956671314, 3.7775007609073703],
             [-0.8695180646613541, -0.4616629203696456, -0.20011254662167188],
             [16.55942289408057, 8.780199034903493, 3.777176980405888]),
        ];
        for (g, earth, expected) in cases {
            let actual = solar_deflection(g, earth);
            let distance = g[0].hypot(g[1]).hypot(g[2]);
            let error = (0..3).map(|i| (actual[i]-expected[i]).powi(2)).sum::<f64>().sqrt();
            // The omitted solar barycentric displacement during light time
            // contributes less than 0.0005 arcsecond for these fixtures.
            assert!(error / distance * 206264.806 < 0.001);
        }
    }

    #[test]
    fn solar_limb_is_continuous_and_conjunction_is_finite() {
        let radius = (959.63_f64 / 3600.0).to_radians();
        let ray = |r: f64| {
            let a = (radius * r).asin();
            solar_deflection([-6.0*a.cos(), 6.0*a.sin(), 0.0], [1.0, 0.0, 0.0])
        };
        let a = ray(1.0-1e-8);
        let b = ray(1.0+1e-8);
        assert!((a[1]-b[1]).abs() < 1e-9);
        for r in [0.0, 1e-10, 0.005, 0.01, 0.5, 1.0, 2.0] {
            assert!(ray(r).iter().all(|x| x.is_finite()));
        }
        // Finite source distance matters: a nearby body between Earth and
        // Sun must not acquire the far-source solar-limb deflection.
        let g = [-0.002, 0.000001, 0.0];
        let d = solar_deflection(g, [1.0,0.0,0.0]);
        assert!((d[1]-g[1]).abs() < 1e-12);
    }
}
