use celestial_core as core;
use wasm_bindgen::prelude::*;

use crate::{binding, native};

fn invalid(reason: impl Into<String>) -> JsValue {
    crate::js_binding_error(binding::Error::from_reason(reason))
}

fn core_error(error: core::Error) -> JsValue {
    crate::js_binding_error(binding::Error::from(error))
}

fn integer<T: serde::de::DeserializeOwned>(value: f64) -> Result<T, JsValue> {
    crate::argument(JsValue::from_f64(value))
}

fn enum_value<T: Clone, const N: usize>(values: [T; N], index: f64) -> Result<T, JsValue> {
    if !index.is_finite() || index.fract() != 0.0 || index < 0.0 || index >= N as f64 {
        return Err(invalid(format!(
            "enum index must be an integer from 0 to {}",
            N - 1
        )));
    }
    Ok(values[index as usize].clone())
}

macro_rules! primitive {
    ($name:ident, $js:ident, ($arg:ident: i32) -> $ret:ty, $value:expr) => {
        #[wasm_bindgen(js_name = $js)]
        pub fn $name($arg: f64) -> Result<$ret, JsValue> {
            let $arg: i32 = integer($arg)?;
            Ok($value)
        }
    };
    ($name:ident, $js:ident, ($arg:ident: u8) -> $ret:ty, $value:expr) => {
        #[wasm_bindgen(js_name = $js)]
        pub fn $name($arg: f64) -> Result<$ret, JsValue> {
            let $arg: u8 = integer($arg)?;
            Ok($value)
        }
    };
    ($name:ident, $js:ident, ($($arg:ident: $ty:ty),*) -> $ret:ty, $value:expr) => {
        #[wasm_bindgen(js_name = $js)]
        pub fn $name($($arg: $ty),*) -> $ret { $value }
    };
}

primitive!(body_from_raw, bodyFromRaw, (value: i32) -> i32, core::Body::from_raw(value).as_raw());
primitive!(body_as_raw, bodyAsRaw, (value: i32) -> i32, core::Body::from_raw(value).as_raw());
primitive!(body_is_known_id, bodyIsKnownId, (value: i32) -> bool, core::Body::is_known_id(value));
primitive!(body_is_planet, bodyIsPlanet, (value: i32) -> bool, core::Body::from_raw(value).is_planet());
primitive!(body_retrograde_search_window, bodyRetrogradeSearchWindow, (value: i32) -> f64, core::Body::from_raw(value).retrograde_search_window());
primitive!(body_ingress_search_window, bodyIngressSearchWindow, (value: i32) -> f64, core::Body::from_raw(value).ingress_search_window());
primitive!(body_orb_weight, bodyOrbWeight, (value: i32) -> f64, core::Body::from_raw(value).orb_weight());
primitive!(body_is_node, bodyIsNode, (value: i32) -> bool, core::Body::from_raw(value).is_node());
primitive!(body_name, bodyName, (value: i32) -> String, core::Body::from_raw(value).name().to_owned());

#[wasm_bindgen(js_name = bodyTryFromRaw)]
pub fn body_try_from_raw(value: f64) -> Result<i32, JsValue> {
    let value: i32 = integer(value)?;
    core::Body::try_from_raw(value)
        .map(core::Body::as_raw)
        .map_err(|_| crate::js_binding_error(binding::Error::invalid_body(value)))
}

primitive!(calc_flags_as_raw, calcFlagsAsRaw, (value: i32) -> i32, core::CalcFlags(value).as_raw());
primitive!(calc_flags_is_sidereal, calcFlagsIsSidereal, (value: i32) -> bool, core::CalcFlags(value).is_sidereal());
primitive!(calc_flags_is_speed, calcFlagsIsSpeed, (value: i32) -> bool, core::CalcFlags(value).is_speed());
primitive!(house_system_as_raw, houseSystemAsRaw, (value: u8) -> u8, core::HouseSystem(value).as_raw());
primitive!(house_system_name, houseSystemName, (value: u8) -> String, core::HouseSystem(value).name().to_owned());
primitive!(sidereal_mode_as_raw, siderealModeAsRaw, (value: i32) -> i32, core::SiderealMode(value).as_raw());
primitive!(sidereal_mode_name, siderealModeName, (value: i32) -> String, core::SiderealMode(value).name().to_owned());
primitive!(calendar_as_raw, calendarAsRaw, (value: i32) -> i32, core::Calendar::from(value).as_raw());

macro_rules! unit_methods {
    ($type:ident, $new:ident, $js_new:ident, $get:ident, $js_get:ident) => {
        primitive!($new, $js_new, (value: f64) -> f64, core::$type::new(value).get());
        primitive!($get, $js_get, (value: f64) -> f64, core::$type::new(value).get());
    };
}
unit_methods!(
    JulianDay,
    julian_day_new,
    julianDayNew,
    julian_day_get,
    julianDayGet
);
unit_methods!(
    Latitude,
    latitude_new,
    latitudeNew,
    latitude_get,
    latitudeGet
);
unit_methods!(
    Longitude,
    longitude_new,
    longitudeNew,
    longitude_get,
    longitudeGet
);
unit_methods!(Degrees, degrees_new, degreesNew, degrees_get, degreesGet);

fn esbat(index: f64) -> Result<core::EsbatName, JsValue> {
    use core::EsbatName::*;
    enum_value(
        [
            Wolf, Snow, Worm, Pink, Flower, Strawberry, Buck, Sturgeon, Harvest, Hunter, Beaver,
            Cold, Blue,
        ],
        index,
    )
}

fn sabbat(index: f64) -> Result<core::SabbatKind, JsValue> {
    use core::SabbatKind::*;
    enum_value(
        [
            Yule, Imbolc, Ostara, Beltane, Litha, Lughnasadh, Mabon, Samhain,
        ],
        index,
    )
}

fn moon_phase(index: f64) -> Result<core::MoonPhase, JsValue> {
    use core::MoonPhase::*;
    enum_value(
        [
            NewMoon,
            WaxingCrescent,
            FirstQuarter,
            WaxingGibbous,
            FullMoon,
            WaningGibbous,
            LastQuarter,
            WaningCrescent,
        ],
        index,
    )
}

fn principal_phase(index: f64) -> Result<core::PrincipalPhase, JsValue> {
    use core::PrincipalPhase::*;
    enum_value([NewMoon, FirstQuarter, FullMoon, LastQuarter], index)
}

primitive!(esbat_display_name, esbatDisplayName, (index: f64) -> Result<String, JsValue>, Ok(esbat(index)?.display_name().to_owned()));
primitive!(sabbat_solar_longitude, sabbatSolarLongitude, (index: f64) -> Result<f64, JsValue>, Ok(sabbat(index)?.solar_longitude()));
primitive!(sabbat_name, sabbatName, (index: f64) -> Result<String, JsValue>, Ok(sabbat(index)?.name().to_owned()));
primitive!(sabbat_is_quarter_day, sabbatIsQuarterDay, (index: f64) -> Result<bool, JsValue>, Ok(sabbat(index)?.is_quarter_day()));
primitive!(sabbat_is_cross_quarter, sabbatIsCrossQuarter, (index: f64) -> Result<bool, JsValue>, Ok(sabbat(index)?.is_cross_quarter()));
primitive!(sabbat_all_by_longitude, sabbatAllByLongitude, () -> Vec<u32>, core::SabbatKind::all_by_longitude().map(|value| value as u32).to_vec());
primitive!(moon_phase_name, moonPhaseName, (index: f64) -> Result<String, JsValue>, Ok(moon_phase(index)?.name().to_owned()));
primitive!(moon_phase_target_elongation, moonPhaseTargetElongation, (index: f64) -> Result<f64, JsValue>, Ok(moon_phase(index)?.target_elongation()));
primitive!(principal_phase_name, principalPhaseName, (index: f64) -> Result<String, JsValue>, Ok(principal_phase(index)?.name().to_owned()));
primitive!(principal_phase_elongation_target, principalPhaseElongationTarget, (index: f64) -> Result<f64, JsValue>, Ok(principal_phase(index)?.elongation_target()));

#[wasm_bindgen(js_name = esbatAltNames, unchecked_return_type = "Array<string>")]
pub fn esbat_alt_names(index: f64) -> Result<JsValue, JsValue> {
    crate::output(&esbat(index)?.alt_names())
}

#[wasm_bindgen(js_name = sabbatAltNames, unchecked_return_type = "Array<string>")]
pub fn sabbat_alt_names(index: f64) -> Result<JsValue, JsValue> {
    crate::output(&sabbat(index)?.alt_names())
}

#[wasm_bindgen(js_name = solarCyclePhaseName)]
pub fn solar_cycle_phase_name(index: f64) -> Result<String, JsValue> {
    use core::SolarCyclePhase::*;
    Ok(enum_value([Minimum, Rising, Maximum, Declining], index)?
        .name()
        .to_owned())
}

#[wasm_bindgen(js_name = grandSolarEpochName)]
pub fn grand_solar_epoch_name(index: f64) -> Result<String, JsValue> {
    use core::GrandSolarEpoch::*;
    Ok(enum_value(
        [SporerMinimum, MaunderMinimum, DaltonMinimum, ModernMaximum],
        index,
    )?
    .name()
    .to_owned())
}

#[wasm_bindgen]
pub struct CalcOptions(core::CalcOptions);

#[wasm_bindgen]
impl CalcOptions {
    pub fn ut(jd: f64, flags: f64) -> Result<Self, JsValue> {
        Ok(Self(core::CalcOptions::ut(
            core::JulianDay::new(jd),
            core::CalcFlags(integer(flags)?),
        )))
    }
    pub fn tt(jd: f64, flags: f64) -> Result<Self, JsValue> {
        Ok(Self(core::CalcOptions::tt(
            core::JulianDay::new(jd),
            core::CalcFlags(integer(flags)?),
        )))
    }
    pub fn strategy(self, strategy: f64) -> Result<Self, JsValue> {
        use core::CalcStrategy::*;
        Ok(Self(self.0.strategy(enum_value(
            [Auto, Sequential, Parallel],
            strategy,
        )?)))
    }
    pub fn body(self, body: f64) -> Result<SingleCalc, JsValue> {
        Ok(SingleCalc {
            options: self.0,
            body: integer(body)?,
        })
    }
    pub fn bodies(
        self,
        #[wasm_bindgen(unchecked_param_type = "Array<number>")] bodies: JsValue,
    ) -> Result<MultiCalc, JsValue> {
        Ok(MultiCalc {
            options: self.0,
            bodies: crate::argument(bodies)?,
        })
    }
}

#[wasm_bindgen]
pub struct SingleCalc {
    options: core::CalcOptions,
    body: i32,
}

#[wasm_bindgen]
impl SingleCalc {
    #[wasm_bindgen(unchecked_return_type = "PlanetPos")]
    pub fn get(self) -> Result<JsValue, JsValue> {
        let body = core::Body::try_from_raw(self.body)
            .map_err(|_| crate::js_binding_error(binding::Error::invalid_body(self.body)))?;
        let result = self.options.body(body).get().map_err(core_error)?;
        crate::output(&native::PlanetPos::from(result))
    }
}

#[wasm_bindgen]
pub struct MultiCalc {
    options: core::CalcOptions,
    bodies: Vec<i32>,
}

#[wasm_bindgen]
impl MultiCalc {
    #[wasm_bindgen(js_name = getMany, unchecked_return_type = "Array<CalcResult>")]
    pub fn get_many(self) -> Result<JsValue, JsValue> {
        let bodies: Vec<_> = self
            .bodies
            .iter()
            .copied()
            .map(core::Body::from_raw)
            .collect();
        let results: Vec<_> = self
            .options
            .bodies(&bodies)
            .get_many()
            .into_iter()
            .zip(self.bodies)
            .map(|(result, body)| native::calc_result(body, result))
            .collect();
        crate::output(&results)
    }
}

#[wasm_bindgen]
pub struct AspectOrbs(core::AspectOrbs);

#[derive(serde::Serialize)]
struct AspectCheck {
    diff: f64,
    speed: f64,
    factor: f64,
    matched: bool,
}

impl From<core::AspectMatch> for AspectCheck {
    fn from(value: core::AspectMatch) -> Self {
        Self {
            diff: value.diff,
            speed: value.speed,
            factor: value.factor,
            matched: value.matched,
        }
    }
}

#[wasm_bindgen]
impl AspectOrbs {
    #[wasm_bindgen(constructor)]
    pub fn new(app_orb: f64, sep_orb: f64) -> Self {
        Self(core::AspectOrbs::new(app_orb, sep_orb))
    }
    #[wasm_bindgen(js_name = defOrb)]
    pub fn def_orb(self, orb: f64) -> Self {
        Self(self.0.def_orb(orb))
    }
    #[wasm_bindgen(unchecked_return_type = "AspectCheck")]
    pub fn check(
        &self,
        pos0: f64,
        speed0: f64,
        pos1: f64,
        speed1: f64,
        aspect: f64,
    ) -> Result<JsValue, JsValue> {
        crate::output(&AspectCheck::from(
            self.0.check(pos0, speed0, pos1, speed1, aspect),
        ))
    }
    #[wasm_bindgen(js_name = checkSimple, unchecked_return_type = "AspectCheck")]
    pub fn check_simple(
        &self,
        pos0: f64,
        speed0: f64,
        pos1: f64,
        speed1: f64,
        aspect: f64,
    ) -> Result<JsValue, JsValue> {
        crate::output(&AspectCheck::from(
            self.0.check_simple(pos0, speed0, pos1, speed1, aspect),
        ))
    }
}

#[wasm_bindgen]
pub struct RiseTransOptions(core::RiseTransOptions);

#[wasm_bindgen]
impl RiseTransOptions {
    #[wasm_bindgen(constructor)]
    pub fn new(jd: f64, body: f64, geopos: Vec<f64>) -> Result<Self, JsValue> {
        let geopos = geopos
            .try_into()
            .map_err(|_| invalid("geopos must have 3 elements"))?;
        Ok(Self(core::RiseTransOptions::new(
            core::JulianDay::new(jd),
            core::Body::from_raw(integer(body)?),
            geopos,
        )))
    }
    pub fn event(self, event: f64) -> Result<Self, JsValue> {
        Ok(Self(self.0.event(integer(event)?)))
    }
    pub fn flags(self, flags: f64) -> Result<Self, JsValue> {
        Ok(Self(self.0.flags(core::CalcFlags(integer(flags)?))))
    }
    pub fn atmosphere(self, pressure_mb: f64, temp_c: f64) -> Self {
        Self(self.0.atmosphere(pressure_mb, temp_c))
    }
    #[wasm_bindgen(js_name = horizonHeight)]
    pub fn horizon_height(self, height: f64) -> Self {
        Self(self.0.horizon_height(height))
    }
    pub fn star(self, name: String) -> Self {
        Self(self.0.star(name))
    }
    #[wasm_bindgen(unchecked_return_type = "RiseTrans")]
    pub fn search(self) -> Result<JsValue, JsValue> {
        let result = self.0.search().map_err(core_error)?;
        crate::output(&native::RiseTrans {
            ret_flags: result.ret_flags,
            tret: result.tret,
        })
    }
}

#[wasm_bindgen]
pub struct SearchOptions(core::SearchOptions);

#[wasm_bindgen]
impl SearchOptions {
    #[wasm_bindgen(constructor)]
    pub fn new(body: f64, jd_start: f64) -> Result<Self, JsValue> {
        Ok(Self(core::SearchOptions::new(
            core::Body::from_raw(integer(body)?),
            jd_start,
        )))
    }
    pub fn aspect(self, degrees: f64) -> Self {
        Self(self.0.aspect(degrees))
    }
    pub fn cusp(self, cusp: f64, lat: f64, lon: f64, hsys: f64) -> Result<Self, JsValue> {
        Ok(Self(self.0.cusp(
            integer::<u32>(cusp)? as usize,
            lat,
            lon,
            core::HouseSystem(integer(hsys)?),
        )))
    }
    #[wasm_bindgen(js_name = natalChart)]
    pub fn natal_chart(self, jd: f64, lat: f64, lon: f64, hsys: f64) -> Result<Self, JsValue> {
        Ok(Self(self.0.natal_chart(
            jd,
            lat,
            lon,
            core::HouseSystem(integer(hsys)?),
        )))
    }
    pub fn backward(self, back: bool) -> Self {
        Self(self.0.backward(back))
    }
    pub fn flags(self, flags: f64) -> Result<Self, JsValue> {
        Ok(Self(self.0.flags(core::CalcFlags(integer(flags)?))))
    }
    #[wasm_bindgen(js_name = searchCusp, unchecked_return_type = "AspectCuspResult | null")]
    pub fn search_cusp(self) -> Result<JsValue, JsValue> {
        crate::output(&self.0.search_cusp().map(native::AspectCuspResult::from))
    }
    #[wasm_bindgen(js_name = searchMcTransit)]
    pub fn search_mc_transit(self) -> Result<f64, JsValue> {
        self.0.search_mc_transit().map_err(core_error)
    }
    #[wasm_bindgen(js_name = searchIcTransit)]
    pub fn search_ic_transit(self) -> Result<f64, JsValue> {
        self.0.search_ic_transit().map_err(core_error)
    }
    #[wasm_bindgen(js_name = searchAscTransit)]
    pub fn search_asc_transit(self) -> Result<f64, JsValue> {
        self.0.search_asc_transit().map_err(core_error)
    }
    #[wasm_bindgen(js_name = searchDscTransit)]
    pub fn search_dsc_transit(self) -> Result<f64, JsValue> {
        self.0.search_dsc_transit().map_err(core_error)
    }
}
