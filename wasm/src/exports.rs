use super::{argument, insert_constant, js_binding_error, output};
use crate::{additional, native};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = "setEphePath", skip_typescript)]
pub fn set_ephe_path(path: JsValue) -> Result<JsValue, JsValue> {
    output(&native::set_ephe_path(argument::<String>(path)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "setJplFile", skip_typescript)]
pub fn set_jpl_file(fname: JsValue) -> Result<JsValue, JsValue> {
    output(&native::set_jpl_file(argument::<String>(fname)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "setSidMode", skip_typescript)]
pub fn set_sid_mode(sid_mode: JsValue, t0: JsValue, ayan_t0: JsValue) -> Result<JsValue, JsValue> {
    output(&native::set_sid_mode(
        argument::<i32>(sid_mode)?,
        argument::<Option<f64>>(t0)?,
        argument::<Option<f64>>(ayan_t0)?,
    ))
}

#[wasm_bindgen(js_name = "setTopo", skip_typescript)]
pub fn set_topo(geolon: JsValue, geolat: JsValue, geoalt: JsValue) -> Result<JsValue, JsValue> {
    output(&native::set_topo(
        argument::<f64>(geolon)?,
        argument::<f64>(geolat)?,
        argument::<f64>(geoalt)?,
    ))
}

#[wasm_bindgen(js_name = "close", skip_typescript)]
pub fn close() -> Result<JsValue, JsValue> {
    output(&native::close())
}

#[wasm_bindgen(js_name = "calc", skip_typescript)]
pub fn calc(tjdet: JsValue, planet: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::calc(
            argument::<f64>(tjdet)?,
            argument::<i32>(planet)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "calcUt", skip_typescript)]
pub fn calc_ut(tjdut: JsValue, planet: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::calc_ut(
            argument::<f64>(tjdut)?,
            argument::<i32>(planet)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "nutation", skip_typescript)]
pub fn nutation(jde: JsValue) -> Result<JsValue, JsValue> {
    output(&native::nutation(argument::<f64>(jde)?))
}

#[wasm_bindgen(js_name = "meanObliquity", skip_typescript)]
pub fn mean_obliquity(jde: JsValue) -> Result<JsValue, JsValue> {
    output(&native::mean_obliquity(argument::<f64>(jde)?))
}

#[wasm_bindgen(js_name = "trueObliquity", skip_typescript)]
pub fn true_obliquity(jde: JsValue) -> Result<JsValue, JsValue> {
    output(&native::true_obliquity(argument::<f64>(jde)?))
}

#[wasm_bindgen(js_name = "calcMany", skip_typescript)]
pub fn calc_many(tjdet: JsValue, planets: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(&native::calc_many(
        argument::<f64>(tjdet)?,
        argument::<Vec<i32>>(planets)?,
        argument::<i32>(flags)?,
    ))
}

#[wasm_bindgen(js_name = "calcUtMany", skip_typescript)]
pub fn calc_ut_many(tjdut: JsValue, planets: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(&native::calc_ut_many(
        argument::<f64>(tjdut)?,
        argument::<Vec<i32>>(planets)?,
        argument::<i32>(flags)?,
    ))
}

#[wasm_bindgen(js_name = "calcPctr", skip_typescript)]
pub fn calc_pctr(
    tjdet: JsValue,
    planet: JsValue,
    center: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::calc_pctr(
            argument::<f64>(tjdet)?,
            argument::<i32>(planet)?,
            argument::<i32>(center)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "fixstar", skip_typescript)]
pub fn fixstar(star: JsValue, tjdet: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::fixstar(
            argument::<String>(star)?,
            argument::<f64>(tjdet)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "fixstarUt", skip_typescript)]
pub fn fixstar_ut(star: JsValue, tjdut: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::fixstar_ut(
            argument::<String>(star)?,
            argument::<f64>(tjdut)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "fixstarMag", skip_typescript)]
pub fn fixstar_mag(star: JsValue) -> Result<JsValue, JsValue> {
    output(&native::fixstar_mag(argument::<String>(star)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "houses", skip_typescript)]
pub fn houses(
    tjdut: JsValue,
    lat: JsValue,
    lon: JsValue,
    hsys: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::houses(
            argument::<f64>(tjdut)?,
            argument::<f64>(lat)?,
            argument::<f64>(lon)?,
            argument::<u8>(hsys)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "housesEx", skip_typescript)]
pub fn houses_ex(
    tjdut: JsValue,
    lat: JsValue,
    lon: JsValue,
    hsys: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::houses_ex(
            argument::<f64>(tjdut)?,
            argument::<f64>(lat)?,
            argument::<f64>(lon)?,
            argument::<u8>(hsys)?,
            argument::<Option<i32>>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "housesEx2", skip_typescript)]
pub fn houses_ex2(
    tjdut: JsValue,
    lat: JsValue,
    lon: JsValue,
    hsys: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::houses_ex2(
            argument::<f64>(tjdut)?,
            argument::<f64>(lat)?,
            argument::<f64>(lon)?,
            argument::<u8>(hsys)?,
            argument::<Option<i32>>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "houseName", skip_typescript)]
pub fn house_name(hsys: JsValue) -> Result<JsValue, JsValue> {
    output(&native::house_name(argument::<u8>(hsys)?))
}

#[wasm_bindgen(js_name = "solEclipseWhenGlob", skip_typescript)]
pub fn sol_eclipse_when_glob(
    tjd_start: JsValue,
    flags: JsValue,
    ecl_type: JsValue,
    backwards: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::sol_eclipse_when_glob(
            argument::<f64>(tjd_start)?,
            argument::<i32>(flags)?,
            argument::<Option<i32>>(ecl_type)?,
            argument::<Option<bool>>(backwards)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "solEclipseWhenLoc", skip_typescript)]
pub fn sol_eclipse_when_loc(
    tjd_start: JsValue,
    geopos: JsValue,
    flags: JsValue,
    backwards: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::sol_eclipse_when_loc(
            argument::<f64>(tjd_start)?,
            argument::<Vec<f64>>(geopos)?,
            argument::<i32>(flags)?,
            argument::<Option<bool>>(backwards)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "solEclipseHow", skip_typescript)]
pub fn sol_eclipse_how(
    jd_ut: JsValue,
    geopos: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::sol_eclipse_how(
            argument::<f64>(jd_ut)?,
            argument::<Vec<f64>>(geopos)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "solEclipseWhere", skip_typescript)]
pub fn sol_eclipse_where(tjd: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::sol_eclipse_where(argument::<f64>(tjd)?, argument::<i32>(flags)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "lunEclipseWhen", skip_typescript)]
pub fn lun_eclipse_when(
    tjd_start: JsValue,
    flags: JsValue,
    ecl_type: JsValue,
    backwards: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::lun_eclipse_when(
            argument::<f64>(tjd_start)?,
            argument::<i32>(flags)?,
            argument::<Option<i32>>(ecl_type)?,
            argument::<Option<bool>>(backwards)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "lunEclipseHow", skip_typescript)]
pub fn lun_eclipse_how(
    jd_ut: JsValue,
    geopos: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::lun_eclipse_how(
            argument::<f64>(jd_ut)?,
            argument::<Option<Vec<f64>>>(geopos)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "riseTrans", skip_typescript)]
pub fn rise_trans(
    tjdut: JsValue,
    planet: JsValue,
    ephe_flags: JsValue,
    event_type: JsValue,
    geopos: JsValue,
    pressure_mb: JsValue,
    temp_c: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::rise_trans(
            argument::<f64>(tjdut)?,
            argument::<i32>(planet)?,
            argument::<i32>(ephe_flags)?,
            argument::<i32>(event_type)?,
            argument::<Vec<f64>>(geopos)?,
            argument::<Option<f64>>(pressure_mb)?,
            argument::<Option<f64>>(temp_c)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "julday", skip_typescript)]
pub fn julday(
    year: JsValue,
    month: JsValue,
    day: JsValue,
    hour: JsValue,
    calendar: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::julday(
        argument::<i32>(year)?,
        argument::<i32>(month)?,
        argument::<i32>(day)?,
        argument::<Option<f64>>(hour)?,
        argument::<Option<i32>>(calendar)?,
    ))
}

#[wasm_bindgen(js_name = "revjul", skip_typescript)]
pub fn revjul(jd: JsValue, calendar: JsValue) -> Result<JsValue, JsValue> {
    output(&native::revjul(
        argument::<f64>(jd)?,
        argument::<Option<i32>>(calendar)?,
    ))
}

#[wasm_bindgen(js_name = "dayOfWeek", skip_typescript)]
pub fn day_of_week(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::day_of_week(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "deltat", skip_typescript)]
pub fn deltat(tjd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::deltat(argument::<f64>(tjd)?))
}

#[wasm_bindgen(js_name = "sidtime", skip_typescript)]
pub fn sidtime(jd_ut: JsValue) -> Result<JsValue, JsValue> {
    output(&native::sidtime(argument::<f64>(jd_ut)?))
}

#[wasm_bindgen(js_name = "utcToJd", skip_typescript)]
pub fn utc_to_jd(date: JsValue, calendar: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::utc_to_jd(
            argument::<native::UtcDate>(date)?,
            argument::<Option<i32>>(calendar)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "ayanamsa", skip_typescript)]
pub fn ayanamsa(jd_et: JsValue) -> Result<JsValue, JsValue> {
    output(&native::ayanamsa(argument::<f64>(jd_et)?))
}

#[wasm_bindgen(js_name = "ayanamsaUt", skip_typescript)]
pub fn ayanamsa_ut(jd_ut: JsValue) -> Result<JsValue, JsValue> {
    output(&native::ayanamsa_ut(argument::<f64>(jd_ut)?))
}

#[wasm_bindgen(js_name = "ayanamsaName", skip_typescript)]
pub fn ayanamsa_name(sid_mode: JsValue) -> Result<JsValue, JsValue> {
    output(&native::ayanamsa_name(argument::<i32>(sid_mode)?))
}

#[wasm_bindgen(js_name = "degMidp", skip_typescript)]
pub fn midpoint_deg(x1: JsValue, x0: JsValue) -> Result<JsValue, JsValue> {
    output(&native::midpoint_deg(
        argument::<f64>(x1)?,
        argument::<f64>(x0)?,
    ))
}

#[wasm_bindgen(js_name = "splitDeg", skip_typescript)]
pub fn split_deg(deg: JsValue, round_flag: JsValue) -> Result<JsValue, JsValue> {
    output(&native::split_deg(
        argument::<f64>(deg)?,
        argument::<i32>(round_flag)?,
    ))
}

#[wasm_bindgen(js_name = "coordTransform", skip_typescript)]
pub fn coord_transform(coord: JsValue, eps: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::coord_transform(argument::<Vec<f64>>(coord)?, argument::<f64>(eps)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "azalt", skip_typescript)]
pub fn azalt(
    tjdut: JsValue,
    calc_flag: JsValue,
    geopos: JsValue,
    pressure_mb: JsValue,
    temp_c: JsValue,
    xin: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::azalt(
            argument::<f64>(tjdut)?,
            argument::<i32>(calc_flag)?,
            argument::<Vec<f64>>(geopos)?,
            argument::<f64>(pressure_mb)?,
            argument::<f64>(temp_c)?,
            argument::<Vec<f64>>(xin)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "refrac", skip_typescript)]
pub fn refrac(
    altitude: JsValue,
    pressure_mb: JsValue,
    temp_c: JsValue,
    calc_flag: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::refrac(
        argument::<f64>(altitude)?,
        argument::<f64>(pressure_mb)?,
        argument::<f64>(temp_c)?,
        argument::<i32>(calc_flag)?,
    ))
}

#[wasm_bindgen(js_name = "refracExtended", skip_typescript)]
pub fn refrac_extended(
    altitude: JsValue,
    geoalt: JsValue,
    pressure_mb: JsValue,
    temp_c: JsValue,
    lapse_rate: JsValue,
    calc_flag: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::refrac_extended(
        argument::<f64>(altitude)?,
        argument::<f64>(geoalt)?,
        argument::<f64>(pressure_mb)?,
        argument::<f64>(temp_c)?,
        argument::<f64>(lapse_rate)?,
        argument::<i32>(calc_flag)?,
    ))
}

#[wasm_bindgen(js_name = "planetName", skip_typescript)]
pub fn planet_name(planet: JsValue) -> Result<JsValue, JsValue> {
    output(&native::planet_name(argument::<i32>(planet)?))
}

#[wasm_bindgen(js_name = "jdDuration", skip_typescript)]
pub fn jd_duration(jd_start: JsValue, jd_end: JsValue) -> Result<JsValue, JsValue> {
    output(&native::jd_duration(
        argument::<f64>(jd_start)?,
        argument::<f64>(jd_end)?,
    ))
}

#[wasm_bindgen(js_name = "jdToIsoString", skip_typescript)]
pub fn jd_to_iso_string(jd: JsValue, calendar: JsValue) -> Result<JsValue, JsValue> {
    output(&native::jd_to_iso_string(
        argument::<f64>(jd)?,
        argument::<i32>(calendar)?,
    ))
}

#[wasm_bindgen(js_name = "mooncrossNode", skip_typescript)]
pub fn mooncross_node(jd_et: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::mooncross_node(argument::<f64>(jd_et)?, argument::<i32>(flags)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "mooncrossNodeUt", skip_typescript)]
pub fn mooncross_node_ut(jd_ut: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::mooncross_node_ut(argument::<f64>(jd_ut)?, argument::<i32>(flags)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "setDeltaTUserdef", skip_typescript)]
pub fn set_delta_t_userdef(dt: JsValue) -> Result<JsValue, JsValue> {
    output(&native::set_delta_t_userdef(argument::<f64>(dt)?))
}

#[wasm_bindgen(js_name = "revjulHms", skip_typescript)]
pub fn revjul_hms(jd: JsValue, calendar: JsValue) -> Result<JsValue, JsValue> {
    output(&native::revjul_hms(
        argument::<f64>(jd)?,
        argument::<i32>(calendar)?,
    ))
}

#[wasm_bindgen(js_name = "parseDatetime", skip_typescript)]
pub fn parse_datetime(s: JsValue) -> Result<JsValue, JsValue> {
    output(&native::parse_datetime(argument::<String>(s)?))
}

#[wasm_bindgen(js_name = "degsplit", skip_typescript)]
pub fn degsplit(pos: JsValue) -> Result<JsValue, JsValue> {
    output(&native::degsplit(argument::<f64>(pos)?))
}

#[wasm_bindgen(js_name = "antiscion", skip_typescript)]
pub fn antiscion(pos: JsValue, axis: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::antiscion(argument::<Vec<f64>>(pos)?, argument::<f64>(axis)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "matchAspect", skip_typescript)]
pub fn match_aspect(
    pos0: JsValue,
    speed0: JsValue,
    pos1: JsValue,
    speed1: JsValue,
    aspect: JsValue,
    orb: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::match_aspect(
        argument::<f64>(pos0)?,
        argument::<f64>(speed0)?,
        argument::<f64>(pos1)?,
        argument::<f64>(speed1)?,
        argument::<f64>(aspect)?,
        argument::<f64>(orb)?,
    ))
}

#[wasm_bindgen(js_name = "matchAspect2", skip_typescript)]
pub fn match_aspect2(
    pos0: JsValue,
    speed0: JsValue,
    pos1: JsValue,
    speed1: JsValue,
    aspect: JsValue,
    orb: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::match_aspect2(
        argument::<f64>(pos0)?,
        argument::<f64>(speed0)?,
        argument::<f64>(pos1)?,
        argument::<f64>(speed1)?,
        argument::<f64>(aspect)?,
        argument::<f64>(orb)?,
    ))
}

#[wasm_bindgen(js_name = "matchAspect3", skip_typescript)]
pub fn match_aspect3(
    pos0: JsValue,
    speed0: JsValue,
    pos1: JsValue,
    speed1: JsValue,
    aspect: JsValue,
    app_orb: JsValue,
    sep_orb: JsValue,
    def_orb: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::match_aspect3(
        argument::<f64>(pos0)?,
        argument::<f64>(speed0)?,
        argument::<f64>(pos1)?,
        argument::<f64>(speed1)?,
        argument::<f64>(aspect)?,
        argument::<f64>(app_orb)?,
        argument::<f64>(sep_orb)?,
        argument::<f64>(def_orb)?,
    ))
}

#[wasm_bindgen(js_name = "matchAspect4", skip_typescript)]
pub fn match_aspect4(
    pos0: JsValue,
    speed0: JsValue,
    pos1: JsValue,
    speed1: JsValue,
    aspect: JsValue,
    app_orb: JsValue,
    sep_orb: JsValue,
    def_orb: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::match_aspect4(
        argument::<f64>(pos0)?,
        argument::<f64>(speed0)?,
        argument::<f64>(pos1)?,
        argument::<f64>(speed1)?,
        argument::<f64>(aspect)?,
        argument::<f64>(app_orb)?,
        argument::<f64>(sep_orb)?,
        argument::<f64>(def_orb)?,
    ))
}

#[wasm_bindgen(js_name = "nextRetro", skip_typescript)]
pub fn next_retro(
    planet: JsValue,
    jd_start: JsValue,
    backward: JsValue,
    stop_days: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::next_retro(
        argument::<i32>(planet)?,
        argument::<f64>(jd_start)?,
        argument::<bool>(backward)?,
        argument::<f64>(stop_days)?,
        argument::<i32>(flags)?,
    ))
}

#[wasm_bindgen(js_name = "nextAspect", skip_typescript)]
pub fn next_aspect(
    planet: JsValue,
    aspect: JsValue,
    fixed_pt: JsValue,
    jd_start: JsValue,
    backward: JsValue,
    stop_days: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::next_aspect(
        argument::<i32>(planet)?,
        argument::<f64>(aspect)?,
        argument::<f64>(fixed_pt)?,
        argument::<f64>(jd_start)?,
        argument::<bool>(backward)?,
        argument::<f64>(stop_days)?,
        argument::<i32>(flags)?,
    ))
}

#[wasm_bindgen(js_name = "nextAspectWith", skip_typescript)]
pub fn next_aspect_with(
    planet: JsValue,
    aspect: JsValue,
    other: JsValue,
    jd_start: JsValue,
    backward: JsValue,
    stop_days: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::next_aspect_with(
        argument::<i32>(planet)?,
        argument::<f64>(aspect)?,
        argument::<i32>(other)?,
        argument::<f64>(jd_start)?,
        argument::<bool>(backward)?,
        argument::<f64>(stop_days)?,
        argument::<i32>(flags)?,
    ))
}

#[wasm_bindgen(js_name = "housePos", skip_typescript)]
pub fn house_pos(
    armc: JsValue,
    lat: JsValue,
    eps: JsValue,
    hsys: JsValue,
    lon: JsValue,
    lat_body: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::house_pos(
            argument::<f64>(armc)?,
            argument::<f64>(lat)?,
            argument::<f64>(eps)?,
            argument::<u8>(hsys)?,
            argument::<f64>(lon)?,
            argument::<f64>(lat_body)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "lunEclipseWhenLoc", skip_typescript)]
pub fn lun_eclipse_when_loc(
    tjd_start: JsValue,
    geopos: JsValue,
    flags: JsValue,
    backwards: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::lun_eclipse_when_loc(
            argument::<f64>(tjd_start)?,
            argument::<Vec<f64>>(geopos)?,
            argument::<i32>(flags)?,
            argument::<bool>(backwards)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "fixstar2", skip_typescript)]
pub fn fixstar2(star: JsValue, tjdet: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::fixstar2(
            argument::<String>(star)?,
            argument::<f64>(tjdet)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "fixstar2Ut", skip_typescript)]
pub fn fixstar2_ut(star: JsValue, tjdut: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::fixstar2_ut(
            argument::<String>(star)?,
            argument::<f64>(tjdut)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "fixstar2Mag", skip_typescript)]
pub fn fixstar2_mag(star: JsValue) -> Result<JsValue, JsValue> {
    output(&native::fixstar2_mag(argument::<String>(star)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "azaltRev", skip_typescript)]
pub fn azalt_rev(
    tjdut: JsValue,
    calc_flag: JsValue,
    geopos: JsValue,
    az: JsValue,
    alt: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::azalt_rev(
            argument::<f64>(tjdut)?,
            argument::<i32>(calc_flag)?,
            argument::<Vec<f64>>(geopos)?,
            argument::<f64>(az)?,
            argument::<f64>(alt)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "signName", skip_typescript)]
pub fn sign_name(sign: JsValue) -> Result<JsValue, JsValue> {
    output(&native::sign_name(argument::<i32>(sign)?))
}

#[wasm_bindgen(js_name = "jdnow", skip_typescript)]
pub fn jdnow() -> Result<JsValue, JsValue> {
    output(&native::jdnow())
}

#[wasm_bindgen(js_name = "parseCoord", skip_typescript)]
pub fn parse_coord(s: JsValue) -> Result<JsValue, JsValue> {
    output(&native::parse_coord(argument::<String>(s)?))
}

#[wasm_bindgen(js_name = "formatCoord", skip_typescript)]
pub fn format_coord(coord: JsValue, is_latitude: JsValue) -> Result<JsValue, JsValue> {
    output(&native::format_coord(
        argument::<f64>(coord)?,
        argument::<bool>(is_latitude)?,
    ))
}

#[wasm_bindgen(js_name = "longToRasi", skip_typescript)]
pub fn long_to_rasi(lon: JsValue) -> Result<JsValue, JsValue> {
    output(&native::long_to_rasi(argument::<f64>(lon)?))
}

#[wasm_bindgen(js_name = "longToNavamsa", skip_typescript)]
pub fn long_to_navamsa(lon: JsValue) -> Result<JsValue, JsValue> {
    output(&native::long_to_navamsa(argument::<f64>(lon)?))
}

#[wasm_bindgen(js_name = "longToNakshatra", skip_typescript)]
pub fn long_to_nakshatra(lon: JsValue) -> Result<JsValue, JsValue> {
    output(&native::long_to_nakshatra(argument::<f64>(lon)?))
}

#[wasm_bindgen(js_name = "nakshatraName", skip_typescript)]
pub fn nakshatra_name(nak: JsValue) -> Result<JsValue, JsValue> {
    output(&native::nakshatra_name(argument::<i32>(nak)?))
}

#[wasm_bindgen(js_name = "ramanHouses", skip_typescript)]
pub fn raman_houses(asc: JsValue, mc: JsValue, sandhi: JsValue) -> Result<JsValue, JsValue> {
    output(&native::raman_houses(
        argument::<f64>(asc)?,
        argument::<f64>(mc)?,
        argument::<bool>(sandhi)?,
    ))
}

#[wasm_bindgen(js_name = "residentialStrength", skip_typescript)]
pub fn residential_strength(graha: JsValue, bm: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::residential_strength(argument::<f64>(graha)?, argument::<Vec<f64>>(bm)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "ochchabala", skip_typescript)]
pub fn ochchabala(graha: JsValue, sputha: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::ochchabala(argument::<i32>(graha)?, argument::<f64>(sputha)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "naisargakaRelation", skip_typescript)]
pub fn naisargika_relation(gr1: JsValue, gr2: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::naisargika_relation(argument::<i32>(gr1)?, argument::<i32>(gr2)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "saturnFourStars", skip_typescript)]
pub fn saturn_4_stars(jd: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::saturn_4_stars(argument::<f64>(jd)?, argument::<i32>(flags)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "version", skip_typescript)]
pub fn version() -> Result<JsValue, JsValue> {
    output(&native::version())
}

#[wasm_bindgen(js_name = "normDeg", skip_typescript)]
pub fn norm_deg(x: JsValue) -> Result<JsValue, JsValue> {
    output(&native::norm_deg(argument::<f64>(x)?))
}

#[wasm_bindgen(js_name = "diffDegSigned", skip_typescript)]
pub fn diff_deg_signed(p1: JsValue, p2: JsValue) -> Result<JsValue, JsValue> {
    output(&native::diff_deg_signed(
        argument::<f64>(p1)?,
        argument::<f64>(p2)?,
    ))
}

#[wasm_bindgen(js_name = "normCs", skip_typescript)]
pub fn norm_cs(p: JsValue) -> Result<JsValue, JsValue> {
    output(&native::norm_cs(argument::<i32>(p)?))
}

#[wasm_bindgen(js_name = "signIngressUt", skip_typescript)]
pub fn sign_ingress_ut(
    planet: JsValue,
    jd: JsValue,
    flags: JsValue,
    backward: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::sign_ingress_ut(
            argument::<i32>(planet)?,
            argument::<f64>(jd)?,
            argument::<i32>(flags)?,
            argument::<bool>(backward)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "retrogradeStationUt", skip_typescript)]
pub fn retrograde_station_ut(
    planet: JsValue,
    jd: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::retrograde_station_ut(
            argument::<i32>(planet)?,
            argument::<f64>(jd)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "arabicPart", skip_typescript)]
pub fn arabic_part(asc: JsValue, body2: JsValue, body1: JsValue) -> Result<JsValue, JsValue> {
    output(&native::arabic_part(
        argument::<f64>(asc)?,
        argument::<f64>(body2)?,
        argument::<f64>(body1)?,
    ))
}

#[wasm_bindgen(js_name = "transitToDegree", skip_typescript)]
pub fn transit_to_degree(
    planet: JsValue,
    target_lon: JsValue,
    jd: JsValue,
    flags: JsValue,
    backward: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::transit_to_degree(
            argument::<i32>(planet)?,
            argument::<f64>(target_lon)?,
            argument::<f64>(jd)?,
            argument::<i32>(flags)?,
            argument::<bool>(backward)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "mcTransitUt", skip_typescript)]
pub fn mc_transit_ut(
    planet: JsValue,
    jd_natal: JsValue,
    jd_start: JsValue,
    lat: JsValue,
    lon: JsValue,
    hsys: JsValue,
    flags: JsValue,
    backward: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::mc_transit_ut(
            argument::<i32>(planet)?,
            argument::<f64>(jd_natal)?,
            argument::<f64>(jd_start)?,
            argument::<f64>(lat)?,
            argument::<f64>(lon)?,
            argument::<u8>(hsys)?,
            argument::<i32>(flags)?,
            argument::<bool>(backward)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "solarReturnJd", skip_typescript)]
pub fn solar_return_jd(
    jd_natal: JsValue,
    return_year: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::solar_return_jd(
            argument::<f64>(jd_natal)?,
            argument::<i32>(return_year)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "lunarReturnJd", skip_typescript)]
pub fn lunar_return_jd(
    jd_natal: JsValue,
    jd_start: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::lunar_return_jd(
            argument::<f64>(jd_natal)?,
            argument::<f64>(jd_start)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "midpoint", skip_typescript)]
pub fn midpoint(lon1: JsValue, lon2: JsValue) -> Result<JsValue, JsValue> {
    output(&native::midpoint(
        argument::<f64>(lon1)?,
        argument::<f64>(lon2)?,
    ))
}

#[wasm_bindgen(js_name = "signRuler", skip_typescript)]
pub fn sign_ruler(sign: JsValue) -> Result<JsValue, JsValue> {
    output(&native::sign_ruler(argument::<u8>(sign)?))
}

#[wasm_bindgen(js_name = "signRulerModern", skip_typescript)]
pub fn sign_ruler_modern(sign: JsValue) -> Result<JsValue, JsValue> {
    output(&native::sign_ruler_modern(argument::<u8>(sign)?))
}

#[wasm_bindgen(js_name = "zodiacSignName", skip_typescript)]
pub fn zodiac_sign_name(sign: JsValue) -> Result<JsValue, JsValue> {
    output(&native::zodiac_sign_name(argument::<u8>(sign)?))
}

#[wasm_bindgen(js_name = "lonToSign", skip_typescript)]
pub fn lon_to_sign(lon: JsValue) -> Result<JsValue, JsValue> {
    output(&native::lon_to_sign(argument::<f64>(lon)?))
}

#[wasm_bindgen(js_name = "localApparentSolarTime", skip_typescript)]
pub fn local_apparent_solar_time(jd_ut: JsValue, geolon_deg: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::local_apparent_solar_time(argument::<f64>(jd_ut)?, argument::<f64>(geolon_deg)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "annualProfection", skip_typescript)]
pub fn annual_profection(cusps: JsValue, age: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::annual_profection(argument::<Vec<f64>>(cusps)?, argument::<u32>(age)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "vimshottariDasha", skip_typescript)]
pub fn vimshottari_dasha(
    jd_birth: JsValue,
    moon_lon_sidereal: JsValue,
    years_ahead: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::vimshottari_dasha(
        argument::<f64>(jd_birth)?,
        argument::<f64>(moon_lon_sidereal)?,
        argument::<f64>(years_ahead)?,
    ))
}

#[wasm_bindgen(js_name = "omerFromJd", skip_typescript)]
pub fn omer_from_jd(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::omer_from_jd(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "omerDayJd", skip_typescript)]
pub fn omer_day_jd(hebrew_year: JsValue, day: JsValue) -> Result<JsValue, JsValue> {
    output(&native::omer_day_jd(
        argument::<i32>(hebrew_year)?,
        argument::<u8>(day)?,
    ))
}

#[wasm_bindgen(js_name = "omerStartJd", skip_typescript)]
pub fn omer_start_jd(hebrew_year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::omer_start_jd(argument::<i32>(hebrew_year)?))
}

#[wasm_bindgen(js_name = "omerDays", skip_typescript)]
pub fn omer_days(hebrew_year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::omer_days(argument::<i32>(hebrew_year)?))
}

#[wasm_bindgen(js_name = "omerPeriod", skip_typescript)]
pub fn omer_period(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::omer_period(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "omerDeclaration", skip_typescript)]
pub fn omer_declaration(day: JsValue) -> Result<JsValue, JsValue> {
    output(&native::omer_declaration(argument::<u8>(day)?))
}

#[wasm_bindgen(js_name = "jewishHolidays", skip_typescript)]
pub fn jewish_holidays(hebrew_year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::jewish_holidays(argument::<i32>(hebrew_year)?))
}

#[wasm_bindgen(js_name = "jewishHolidayJd", skip_typescript)]
pub fn jewish_holiday_jd(hebrew_year: JsValue, name: JsValue) -> Result<JsValue, JsValue> {
    output(&native::jewish_holiday_jd(
        argument::<i32>(hebrew_year)?,
        argument::<String>(name)?,
    ))
}

#[wasm_bindgen(js_name = "hebrewYearFromJd", skip_typescript)]
pub fn hebrew_year_from_jd(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::hebrew_year_from_jd(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "jdToHebrewDate", skip_typescript)]
pub fn jd_to_hebrew_date(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::jd_to_hebrew_date(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "easterGregorian", skip_typescript)]
pub fn easter_gregorian(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::easter_gregorian(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "easterOrthodox", skip_typescript)]
pub fn easter_orthodox(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::easter_orthodox(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "easterJd", skip_typescript)]
pub fn easter_jd(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::easter_jd(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "easterOrthodoxJd", skip_typescript)]
pub fn easter_orthodox_jd(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::easter_orthodox_jd(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "christianFeasts", skip_typescript)]
pub fn christian_feasts(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::christian_feasts(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "christianFixedFeasts", skip_typescript)]
pub fn christian_fixed_feasts(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::christian_fixed_feasts(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "hijriFromJd", skip_typescript)]
pub fn hijri_from_jd(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::hijri_from_jd(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "hijriToJd", skip_typescript)]
pub fn hijri_to_jd(year: JsValue, month: JsValue, day: JsValue) -> Result<JsValue, JsValue> {
    output(&native::hijri_to_jd(
        argument::<i32>(year)?,
        argument::<u8>(month)?,
        argument::<u8>(day)?,
    ))
}

#[wasm_bindgen(js_name = "hijriMonthName", skip_typescript)]
pub fn hijri_month_name(month: JsValue) -> Result<JsValue, JsValue> {
    output(&native::hijri_month_name(argument::<u8>(month)?))
}

#[wasm_bindgen(js_name = "daysInHebrewYear", skip_typescript)]
pub fn days_in_hebrew_year(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::days_in_hebrew_year(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "monthsInHebrewYear", skip_typescript)]
pub fn months_in_hebrew_year(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::months_in_hebrew_year(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "isHebrewLeapYear", skip_typescript)]
pub fn is_hebrew_leap_year(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::is_hebrew_leap_year(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "hebrewMonthDays", skip_typescript)]
pub fn hebrew_month_days(year: JsValue, month: JsValue) -> Result<JsValue, JsValue> {
    output(&native::hebrew_month_days(
        argument::<i32>(year)?,
        argument::<i32>(month)?,
    ))
}

#[wasm_bindgen(js_name = "hebrewMonthStartJd", skip_typescript)]
pub fn hebrew_month_start_jd(year: JsValue, month: JsValue) -> Result<JsValue, JsValue> {
    output(&native::hebrew_month_start_jd(
        argument::<i32>(year)?,
        argument::<i32>(month)?,
    ))
}

#[wasm_bindgen(js_name = "hebrewNewYearJd", skip_typescript)]
pub fn hebrew_new_year_jd(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::hebrew_new_year_jd(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "isHijriLeapYear", skip_typescript)]
pub fn is_hijri_leap_year(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::is_hijri_leap_year(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "hijriMonthDays", skip_typescript)]
pub fn hijri_month_days(year: JsValue, month: JsValue) -> Result<JsValue, JsValue> {
    output(&native::hijri_month_days(
        argument::<i32>(year)?,
        argument::<u8>(month)?,
    ))
}

#[wasm_bindgen(js_name = "hijriMonthStartJd", skip_typescript)]
pub fn hijri_month_start_jd(year: JsValue, month: JsValue) -> Result<JsValue, JsValue> {
    output(&native::hijri_month_start_jd(
        argument::<i32>(year)?,
        argument::<u8>(month)?,
    ))
}

#[wasm_bindgen(js_name = "hijriNewYearJd", skip_typescript)]
pub fn hijri_new_year_jd(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::hijri_new_year_jd(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "isBahaiLeapYear", skip_typescript)]
pub fn is_bahai_leap_year(bahai_year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::is_bahai_leap_year(argument::<i32>(bahai_year)?))
}

#[wasm_bindgen(js_name = "islamicObservances", skip_typescript)]
pub fn islamic_observances(hijri_year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::islamic_observances(argument::<i32>(hijri_year)?))
}

#[wasm_bindgen(js_name = "gregorianToHijriYears", skip_typescript)]
pub fn gregorian_to_hijri_years(gregorian_year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::gregorian_to_hijri_years(argument::<i32>(
        gregorian_year,
    )?))
}

#[wasm_bindgen(js_name = "panchanga", skip_typescript)]
pub fn panchanga(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::panchanga(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "tryPanchanga", skip_typescript)]
pub fn try_panchanga(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::try_panchanga(argument::<f64>(jd)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "hinduFestivals", skip_typescript)]
pub fn hindu_festivals(gregorian_year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::hindu_festivals(argument::<i32>(gregorian_year)?))
}

#[wasm_bindgen(js_name = "vesakJd", skip_typescript)]
pub fn vesak_jd(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::vesak_jd(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "uposathaDays", skip_typescript)]
pub fn uposatha_days(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::uposatha_days(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "nowruzJd", skip_typescript)]
pub fn nowruz_jd(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::nowruz_jd(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "gregorianToSolarHijri", skip_typescript)]
pub fn gregorian_to_solar_hijri(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::gregorian_to_solar_hijri(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "nawRuzJd", skip_typescript)]
pub fn naw_ruz_jd(bahai_year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::naw_ruz_jd(argument::<i32>(bahai_year)?))
}

#[wasm_bindgen(js_name = "jdToBahai", skip_typescript)]
pub fn jd_to_bahai(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::jd_to_bahai(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "bahaiHolyDays", skip_typescript)]
pub fn bahai_holy_days(bahai_year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::bahai_holy_days(argument::<i32>(bahai_year)?))
}

#[wasm_bindgen(js_name = "moonPhase", skip_typescript)]
pub fn moon_phase(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::moon_phase(argument::<f64>(jd)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "moonIllumination", skip_typescript)]
pub fn moon_illumination(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::moon_illumination(argument::<f64>(jd)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "moonElongation", skip_typescript)]
pub fn moon_elongation(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::moon_elongation(argument::<f64>(jd)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "moonPhaseAngle", skip_typescript)]
pub fn moon_phase_angle(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::moon_phase_angle(argument::<f64>(jd)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "nextNewMoon", skip_typescript)]
pub fn next_new_moon(jd_from: JsValue) -> Result<JsValue, JsValue> {
    output(&native::next_new_moon(argument::<f64>(jd_from)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "nextFirstQuarter", skip_typescript)]
pub fn next_first_quarter(jd_from: JsValue) -> Result<JsValue, JsValue> {
    output(&native::next_first_quarter(argument::<f64>(jd_from)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "nextFullMoonPhase", skip_typescript)]
pub fn next_full_moon_phase(jd_from: JsValue) -> Result<JsValue, JsValue> {
    output(&native::next_full_moon_phase(argument::<f64>(jd_from)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "nextLastQuarter", skip_typescript)]
pub fn next_last_quarter(jd_from: JsValue) -> Result<JsValue, JsValue> {
    output(&native::next_last_quarter(argument::<f64>(jd_from)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "moonPhasesForMonth", skip_typescript)]
pub fn moon_phases_for_month(year: JsValue, month: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::moon_phases_for_month(argument::<i32>(year)?, argument::<u8>(month)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "moonPhaseInfo", skip_typescript)]
pub fn moon_phase_info(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::moon_phase_info(argument::<f64>(jd)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "egyptianTermsRuler", skip_typescript)]
pub fn egyptian_terms_ruler(lon: JsValue) -> Result<JsValue, JsValue> {
    output(&native::egyptian_terms_ruler(argument::<f64>(lon)?))
}

#[wasm_bindgen(js_name = "decanRuler", skip_typescript)]
pub fn decan_ruler(lon: JsValue) -> Result<JsValue, JsValue> {
    output(&native::decan_ruler(argument::<f64>(lon)?))
}

#[wasm_bindgen(js_name = "fullDignity", skip_typescript)]
pub fn full_dignity(body_raw: JsValue, lon: JsValue, is_day: JsValue) -> Result<JsValue, JsValue> {
    output(&native::full_dignity(
        argument::<i32>(body_raw)?,
        argument::<f64>(lon)?,
        argument::<bool>(is_day)?,
    ))
}

#[wasm_bindgen(js_name = "almuten", skip_typescript)]
pub fn almuten(lon: JsValue, is_day: JsValue) -> Result<JsValue, JsValue> {
    output(&native::almuten(
        argument::<f64>(lon)?,
        argument::<bool>(is_day)?,
    ))
}

#[wasm_bindgen(js_name = "firdaria", skip_typescript)]
pub fn firdaria(
    jd_birth: JsValue,
    is_day: JsValue,
    span_years: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::firdaria(
        argument::<f64>(jd_birth)?,
        argument::<bool>(is_day)?,
        argument::<f64>(span_years)?,
    ))
}

#[wasm_bindgen(js_name = "fourPillars", skip_typescript)]
pub fn four_pillars(
    jd_ut: JsValue,
    hour_ut: JsValue,
    sun_lon: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::four_pillars(
        argument::<f64>(jd_ut)?,
        argument::<f64>(hour_ut)?,
        argument::<f64>(sun_lon)?,
    ))
}

#[wasm_bindgen(js_name = "solarTermPosition", skip_typescript)]
pub fn solar_term_position(sun_lon: JsValue) -> Result<JsValue, JsValue> {
    output(&native::solar_term_position(argument::<f64>(sun_lon)?))
}

#[wasm_bindgen(js_name = "tonalpohualli", skip_typescript)]
pub fn tonalpohualli(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::tonalpohualli(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "xiuhpohualli", skip_typescript)]
pub fn xiuhpohualli(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::xiuhpohualli(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "tzolkin", skip_typescript)]
pub fn tzolkin(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::tzolkin(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "haab", skip_typescript)]
pub fn haab(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::haab(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "calendarRound", skip_typescript)]
pub fn calendar_round(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::calendar_round(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "medicineWheelTotem", skip_typescript)]
pub fn medicine_wheel_totem(sun_lon: JsValue) -> Result<JsValue, JsValue> {
    output(&native::medicine_wheel_totem(argument::<f64>(sun_lon)?))
}

#[wasm_bindgen(js_name = "egyptianDecan", skip_typescript)]
pub fn egyptian_decan(lon: JsValue) -> Result<JsValue, JsValue> {
    output(&native::egyptian_decan(argument::<f64>(lon)?))
}

#[wasm_bindgen(js_name = "solarCycle", skip_typescript)]
pub fn solar_cycle(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::solar_cycle(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "grandSolarEpoch", skip_typescript)]
pub fn grand_solar_epoch(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::grand_solar_epoch(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "cycleNickname", skip_typescript)]
pub fn cycle_nickname(n: JsValue) -> Result<JsValue, JsValue> {
    output(&native::cycle_nickname(argument::<u32>(n)?))
}

#[wasm_bindgen(js_name = "isDayChart", skip_typescript)]
pub fn is_day_chart(sun_lon: JsValue, cusps: JsValue) -> Result<JsValue, JsValue> {
    output(&native::is_day_chart(
        argument::<f64>(sun_lon)?,
        argument::<Vec<f64>>(cusps)?,
    ))
}

#[wasm_bindgen(js_name = "meanSidtime", skip_typescript)]
pub fn mean_sidtime(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::mean_sidtime(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "triplicityRulers", skip_typescript)]
pub fn triplicity_rulers(lon: JsValue) -> Result<JsValue, JsValue> {
    output(&native::triplicity_rulers(argument::<f64>(lon)?))
}

#[wasm_bindgen(js_name = "sabbatsForYear", skip_typescript)]
pub fn sabbats_for_year(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::sabbats_for_year(argument::<i32>(year)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "sabbatJd", skip_typescript)]
pub fn sabbat_jd(year: JsValue, kind: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::sabbat_jd(argument::<i32>(year)?, argument::<String>(kind)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "nextSabbat", skip_typescript)]
pub fn next_sabbat(jd_from: JsValue) -> Result<JsValue, JsValue> {
    output(&native::next_sabbat(argument::<f64>(jd_from)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "esbatsForYear", skip_typescript)]
pub fn esbats_for_year(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::esbats_for_year(argument::<i32>(year)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "nextEsbat", skip_typescript)]
pub fn next_esbat(jd_from: JsValue) -> Result<JsValue, JsValue> {
    output(&native::next_esbat(argument::<f64>(jd_from)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "secondaryProgressions", skip_typescript)]
pub fn secondary_progressions(
    jd_natal: JsValue,
    years: JsValue,
    bodies: JsValue,
    lat: JsValue,
    lon: JsValue,
    hsys: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::secondary_progressions(
            argument::<f64>(jd_natal)?,
            argument::<f64>(years)?,
            argument::<Vec<i32>>(bodies)?,
            argument::<f64>(lat)?,
            argument::<f64>(lon)?,
            argument::<u8>(hsys)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "solarArcDirections", skip_typescript)]
pub fn solar_arc_directions(
    jd_natal: JsValue,
    years: JsValue,
    natal_positions: JsValue,
    natal_mc: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::solar_arc_directions(
            argument::<f64>(jd_natal)?,
            argument::<f64>(years)?,
            argument::<Vec<f64>>(natal_positions)?,
            argument::<f64>(natal_mc)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "midpointTable", skip_typescript)]
pub fn midpoint_table(positions: JsValue, orb: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::midpoint_table(argument::<Vec<f64>>(positions)?, argument::<f64>(orb)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "calcChartAspects", skip_typescript)]
pub fn calc_chart_aspects(
    positions: JsValue,
    aspects: JsValue,
    orb: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::calc_chart_aspects(
            argument::<Vec<f64>>(positions)?,
            argument::<Vec<f64>>(aspects)?,
            argument::<f64>(orb)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "calcChartAspectsAuto", skip_typescript)]
pub fn calc_chart_aspects_auto(positions: JsValue, aspects: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::calc_chart_aspects_auto(
            argument::<Vec<f64>>(positions)?,
            argument::<Vec<f64>>(aspects)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "sexagenaryName", skip_typescript)]
pub fn sexagenary_name(cycle_index: JsValue) -> Result<JsValue, JsValue> {
    output(&native::sexagenary_name(argument::<u8>(cycle_index)?))
}

#[wasm_bindgen(js_name = "monthlyProfection", skip_typescript)]
pub fn monthly_profection(
    cusps: JsValue,
    age_years: JsValue,
    age_months: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::monthly_profection(
            argument::<Vec<f64>>(cusps)?,
            argument::<u32>(age_years)?,
            argument::<u32>(age_months)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "icTransitUt", skip_typescript)]
pub fn ic_transit_ut(
    planet: JsValue,
    jd_natal: JsValue,
    jd_start: JsValue,
    lat: JsValue,
    lon: JsValue,
    hsys: JsValue,
    flags: JsValue,
    backward: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::ic_transit_ut(
            argument::<i32>(planet)?,
            argument::<f64>(jd_natal)?,
            argument::<f64>(jd_start)?,
            argument::<f64>(lat)?,
            argument::<f64>(lon)?,
            argument::<u8>(hsys)?,
            argument::<i32>(flags)?,
            argument::<bool>(backward)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "ascTransitUt", skip_typescript)]
pub fn asc_transit_ut(
    planet: JsValue,
    jd_natal: JsValue,
    jd_start: JsValue,
    lat: JsValue,
    lon: JsValue,
    hsys: JsValue,
    flags: JsValue,
    backward: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::asc_transit_ut(
            argument::<i32>(planet)?,
            argument::<f64>(jd_natal)?,
            argument::<f64>(jd_start)?,
            argument::<f64>(lat)?,
            argument::<f64>(lon)?,
            argument::<u8>(hsys)?,
            argument::<i32>(flags)?,
            argument::<bool>(backward)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "dscTransitUt", skip_typescript)]
pub fn dsc_transit_ut(
    planet: JsValue,
    jd_natal: JsValue,
    jd_start: JsValue,
    lat: JsValue,
    lon: JsValue,
    hsys: JsValue,
    flags: JsValue,
    backward: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::dsc_transit_ut(
            argument::<i32>(planet)?,
            argument::<f64>(jd_natal)?,
            argument::<f64>(jd_start)?,
            argument::<f64>(lat)?,
            argument::<f64>(lon)?,
            argument::<u8>(hsys)?,
            argument::<i32>(flags)?,
            argument::<bool>(backward)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "nextAspectCusp", skip_typescript)]
pub fn next_aspect_cusp(
    body: JsValue,
    aspect: JsValue,
    cusp: JsValue,
    jd_start: JsValue,
    lat: JsValue,
    lon: JsValue,
    hsys: JsValue,
    backward: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::next_aspect_cusp(
        argument::<i32>(body)?,
        argument::<f64>(aspect)?,
        argument::<u32>(cusp)?,
        argument::<f64>(jd_start)?,
        argument::<f64>(lat)?,
        argument::<f64>(lon)?,
        argument::<u8>(hsys)?,
        argument::<bool>(backward)?,
        argument::<i32>(flags)?,
    ))
}

#[wasm_bindgen(js_name = "nextAspectCusp2", skip_typescript)]
pub fn next_aspect_cusp2(
    body: JsValue,
    aspect: JsValue,
    cusp: JsValue,
    jd_start: JsValue,
    lat: JsValue,
    lon: JsValue,
    hsys: JsValue,
    backward: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::next_aspect_cusp2(
        argument::<i32>(body)?,
        argument::<f64>(aspect)?,
        argument::<u32>(cusp)?,
        argument::<f64>(jd_start)?,
        argument::<f64>(lat)?,
        argument::<f64>(lon)?,
        argument::<u8>(hsys)?,
        argument::<bool>(backward)?,
        argument::<i32>(flags)?,
    ))
}

#[wasm_bindgen(js_name = "degnorm", skip_typescript)]
pub fn degnorm(d: JsValue) -> Result<JsValue, JsValue> {
    output(&native::degnorm(argument::<f64>(d)?))
}

#[wasm_bindgen(js_name = "difdeg2n", skip_typescript)]
pub fn difdeg2n(p1: JsValue, p2: JsValue) -> Result<JsValue, JsValue> {
    output(&native::difdeg2n(
        argument::<f64>(p1)?,
        argument::<f64>(p2)?,
    ))
}

#[wasm_bindgen(js_name = "nextFullMoon", skip_typescript)]
pub fn next_full_moon(jd_start: JsValue) -> Result<JsValue, JsValue> {
    output(&native::next_full_moon(argument::<f64>(jd_start)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "nextSabbatName", skip_typescript)]
pub fn next_sabbat_name(jd_from: JsValue) -> Result<JsValue, JsValue> {
    output(&native::next_sabbat_name(argument::<f64>(jd_from)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "solcrossUt", skip_typescript)]
pub fn solcross_ut(x2cross: JsValue, jd_ut: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::solcross_ut(
            argument::<f64>(x2cross)?,
            argument::<f64>(jd_ut)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "isoWeek", skip_typescript)]
pub fn iso_week(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::iso_week(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "dayOfYear", skip_typescript)]
pub fn day_of_year(year: JsValue, month: JsValue, day: JsValue) -> Result<JsValue, JsValue> {
    output(&native::day_of_year(
        argument::<i32>(year)?,
        argument::<u32>(month)?,
        argument::<u32>(day)?,
    ))
}

#[wasm_bindgen(js_name = "weeksInIsoYear", skip_typescript)]
pub fn weeks_in_iso_year(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::weeks_in_iso_year(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "mayaLongCount", skip_typescript)]
pub fn maya_long_count(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::maya_long_count(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "mayaLongCountStr", skip_typescript)]
pub fn maya_long_count_str(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::maya_long_count_str(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "yallopQ", skip_typescript)]
pub fn yallop_q(
    arcv_deg: JsValue,
    arcl_deg: JsValue,
    sd_arcmin: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::yallop_q(
        argument::<f64>(arcv_deg)?,
        argument::<f64>(arcl_deg)?,
        argument::<f64>(sd_arcmin)?,
    ))
}

#[wasm_bindgen(js_name = "bestTimeMethod", skip_typescript)]
pub fn best_time_method(jd_sunset: JsValue, jd_moonset: JsValue) -> Result<JsValue, JsValue> {
    output(&native::best_time_method(
        argument::<f64>(jd_sunset)?,
        argument::<f64>(jd_moonset)?,
    ))
}

#[wasm_bindgen(js_name = "vietnameseMonthStartJd", skip_typescript)]
pub fn vietnamese_month_start_jd(jd_ut: JsValue) -> Result<JsValue, JsValue> {
    output(&native::vietnamese_month_start_jd(argument::<f64>(jd_ut)?))
}

#[wasm_bindgen(js_name = "vietnameseChineseBoundaryDiffers", skip_typescript)]
pub fn vietnamese_chinese_boundary_differs(jd_ut: JsValue) -> Result<JsValue, JsValue> {
    output(&native::vietnamese_chinese_boundary_differs(
        argument::<f64>(jd_ut)?,
    ))
}

#[wasm_bindgen(js_name = "copticToJd", skip_typescript)]
pub fn coptic_to_jd(year: JsValue, month: JsValue, day: JsValue) -> Result<JsValue, JsValue> {
    output(&native::coptic_to_jd(
        argument::<i32>(year)?,
        argument::<u32>(month)?,
        argument::<u32>(day)?,
    ))
}

#[wasm_bindgen(js_name = "jdToCoptic", skip_typescript)]
pub fn jd_to_coptic(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::jd_to_coptic(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "ethiopicToJd", skip_typescript)]
pub fn ethiopic_to_jd(year: JsValue, month: JsValue, day: JsValue) -> Result<JsValue, JsValue> {
    output(&native::ethiopic_to_jd(
        argument::<i32>(year)?,
        argument::<u32>(month)?,
        argument::<u32>(day)?,
    ))
}

#[wasm_bindgen(js_name = "jdToEthiopic", skip_typescript)]
pub fn jd_to_ethiopic(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::jd_to_ethiopic(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "isCopticLeapYear", skip_typescript)]
pub fn is_coptic_leap_year(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::is_coptic_leap_year(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "copticMonthDays", skip_typescript)]
pub fn coptic_month_days(year: JsValue, month: JsValue) -> Result<JsValue, JsValue> {
    output(&native::coptic_month_days(
        argument::<i32>(year)?,
        argument::<u32>(month)?,
    ))
}

#[wasm_bindgen(js_name = "fasliNowruzJd", skip_typescript)]
pub fn fasli_nowruz_jd(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::fasli_nowruz_jd(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "jdToFasli", skip_typescript)]
pub fn jd_to_fasli(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::jd_to_fasli(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "losarJd", skip_typescript)]
pub fn losar_jd(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::losar_jd(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "tibetanYearName", skip_typescript)]
pub fn tibetan_year_name(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::tibetan_year_name(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "approxHebrewYear", skip_typescript)]
pub fn approx_hebrew_year(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::approx_hebrew_year(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "arabicPartsSeven", skip_typescript)]
pub fn arabic_parts_seven(
    asc: JsValue,
    sun: JsValue,
    moon: JsValue,
    sat: JsValue,
    mar: JsValue,
    jup: JsValue,
    mer: JsValue,
    ven: JsValue,
    is_day: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::arabic_parts_seven(
        argument::<f64>(asc)?,
        argument::<f64>(sun)?,
        argument::<f64>(moon)?,
        argument::<f64>(sat)?,
        argument::<f64>(mar)?,
        argument::<f64>(jup)?,
        argument::<f64>(mer)?,
        argument::<f64>(ven)?,
        argument::<bool>(is_day)?,
    ))
}

#[wasm_bindgen(js_name = "diffDeg", skip_typescript)]
pub fn diff_deg(p1: JsValue, p2: JsValue) -> Result<JsValue, JsValue> {
    output(&native::diff_deg(
        argument::<f64>(p1)?,
        argument::<f64>(p2)?,
    ))
}

#[wasm_bindgen(js_name = "distanceToMc", skip_typescript)]
pub fn distance_to_mc(planet_lon: JsValue, mc_lon: JsValue) -> Result<JsValue, JsValue> {
    output(&native::distance_to_mc(
        argument::<f64>(planet_lon)?,
        argument::<f64>(mc_lon)?,
    ))
}

#[wasm_bindgen(js_name = "easterJulian", skip_typescript)]
pub fn easter_julian(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::easter_julian(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "elapsedDays", skip_typescript)]
pub fn elapsed_days(year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::elapsed_days(argument::<i32>(year)?))
}

#[wasm_bindgen(js_name = "geoToDms", skip_typescript)]
pub fn geo_to_dms(coord: JsValue) -> Result<JsValue, JsValue> {
    output(&native::geo_to_dms(argument::<f64>(coord)?))
}

#[wasm_bindgen(js_name = "heliacalUt", skip_typescript)]
pub fn heliacal_ut(
    jd_start: JsValue,
    dgeo: JsValue,
    datm: JsValue,
    dobs: JsValue,
    objectname: JsValue,
    type_event: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::heliacal_ut(
            argument::<f64>(jd_start)?,
            argument::<Vec<f64>>(dgeo)?,
            argument::<Vec<f64>>(datm)?,
            argument::<Vec<f64>>(dobs)?,
            argument::<String>(objectname)?,
            argument::<i32>(type_event)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "helioCross", skip_typescript)]
pub fn helio_cross(
    body: JsValue,
    x2cross: JsValue,
    jd_et: JsValue,
    flags: JsValue,
    dir: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::helio_cross(
            argument::<i32>(body)?,
            argument::<f64>(x2cross)?,
            argument::<f64>(jd_et)?,
            argument::<i32>(flags)?,
            argument::<i32>(dir)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "helioCrossUt", skip_typescript)]
pub fn helio_cross_ut(
    body: JsValue,
    x2cross: JsValue,
    jd_ut: JsValue,
    flags: JsValue,
    dir: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::helio_cross_ut(
            argument::<i32>(body)?,
            argument::<f64>(x2cross)?,
            argument::<f64>(jd_ut)?,
            argument::<i32>(flags)?,
            argument::<i32>(dir)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "houseSystemChar", skip_typescript)]
pub fn house_system_char(id: JsValue) -> Result<JsValue, JsValue> {
    output(&native::house_system_char(argument::<i32>(id)?))
}

#[wasm_bindgen(js_name = "houseSystemId", skip_typescript)]
pub fn house_system_id(hsys: JsValue) -> Result<JsValue, JsValue> {
    output(&native::house_system_id(argument::<u8>(hsys)?))
}

#[wasm_bindgen(js_name = "housesArmc", skip_typescript)]
pub fn houses_armc(
    armc: JsValue,
    lat: JsValue,
    eps: JsValue,
    hsys: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::houses_armc(
            argument::<f64>(armc)?,
            argument::<f64>(lat)?,
            argument::<f64>(eps)?,
            argument::<u8>(hsys)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "housesArmcEx2", skip_typescript)]
pub fn houses_armc_ex2(
    armc: JsValue,
    lat: JsValue,
    eps: JsValue,
    hsys: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::houses_armc_ex2(
            argument::<f64>(armc)?,
            argument::<f64>(lat)?,
            argument::<f64>(eps)?,
            argument::<u8>(hsys)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "housesFromArmc", skip_typescript)]
pub fn houses_from_armc(
    armc: JsValue,
    lat: JsValue,
    eps: JsValue,
    hsys: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::houses_from_armc(
        argument::<f64>(armc)?,
        argument::<f64>(lat)?,
        argument::<f64>(eps)?,
        argument::<u8>(hsys)?,
    ))
}

#[wasm_bindgen(js_name = "islamicObservancesForJd", skip_typescript)]
pub fn islamic_observances_for_jd(jd: JsValue) -> Result<JsValue, JsValue> {
    output(&native::islamic_observances_for_jd(argument::<f64>(jd)?))
}

#[wasm_bindgen(js_name = "jdEtToUtc", skip_typescript)]
pub fn jd_et_to_utc(jd_et: JsValue, calendar: JsValue) -> Result<JsValue, JsValue> {
    output(&native::jd_et_to_utc(
        argument::<f64>(jd_et)?,
        argument::<i32>(calendar)?,
    ))
}

#[wasm_bindgen(js_name = "jdUtToUtc", skip_typescript)]
pub fn jd_ut_to_utc(jd_ut: JsValue, calendar: JsValue) -> Result<JsValue, JsValue> {
    output(&native::jd_ut_to_utc(
        argument::<f64>(jd_ut)?,
        argument::<i32>(calendar)?,
    ))
}

#[wasm_bindgen(js_name = "karanaName", skip_typescript)]
pub fn karana_name(karana: JsValue) -> Result<JsValue, JsValue> {
    output(&native::karana_name(argument::<u8>(karana)?))
}

#[wasm_bindgen(js_name = "latToLmt", skip_typescript)]
pub fn lat_to_lmt(tjd_lat: JsValue, geolon: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::lat_to_lmt(argument::<f64>(tjd_lat)?, argument::<f64>(geolon)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "lmtToLat", skip_typescript)]
pub fn lmt_to_lat(tjd_lmt: JsValue, geolon: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::lmt_to_lat(argument::<f64>(tjd_lmt)?, argument::<f64>(geolon)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "lowerMeridianTransitUt", skip_typescript)]
pub fn lower_meridian_transit_ut(
    body: JsValue,
    jd_start: JsValue,
    geopos: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::lower_meridian_transit_ut(
            argument::<i32>(body)?,
            argument::<f64>(jd_start)?,
            argument::<Vec<f64>>(geopos)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "lunOccultWhenGlob", skip_typescript)]
pub fn lun_occult_when_glob(
    tjd_start: JsValue,
    body: JsValue,
    starname: JsValue,
    flags: JsValue,
    ecl_type: JsValue,
    backwards: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::lun_occult_when_glob(
            argument::<f64>(tjd_start)?,
            argument::<i32>(body)?,
            argument::<String>(starname)?,
            argument::<i32>(flags)?,
            argument::<i32>(ecl_type)?,
            argument::<bool>(backwards)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "lunOccultWhenLoc", skip_typescript)]
pub fn lun_occult_when_loc(
    tjd_start: JsValue,
    body: JsValue,
    starname: JsValue,
    flags: JsValue,
    geopos: JsValue,
    backwards: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::lun_occult_when_loc(
            argument::<f64>(tjd_start)?,
            argument::<i32>(body)?,
            argument::<String>(starname)?,
            argument::<i32>(flags)?,
            argument::<Vec<f64>>(geopos)?,
            argument::<bool>(backwards)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "lunOccultWhere", skip_typescript)]
pub fn lun_occult_where(
    jd_ut: JsValue,
    body: JsValue,
    starname: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::lun_occult_where(
            argument::<f64>(jd_ut)?,
            argument::<i32>(body)?,
            argument::<String>(starname)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "meanSiderealTimeDeg", skip_typescript)]
pub fn mean_sidereal_time_deg(jd_ut: JsValue) -> Result<JsValue, JsValue> {
    output(&native::mean_sidereal_time_deg(argument::<f64>(jd_ut)?))
}

#[wasm_bindgen(js_name = "meridianTransitUt", skip_typescript)]
pub fn meridian_transit_ut(
    body: JsValue,
    jd_start: JsValue,
    geopos: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::meridian_transit_ut(
            argument::<i32>(body)?,
            argument::<f64>(jd_start)?,
            argument::<Vec<f64>>(geopos)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "mooncross", skip_typescript)]
pub fn mooncross(x2cross: JsValue, jd_et: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::mooncross(
            argument::<f64>(x2cross)?,
            argument::<f64>(jd_et)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "mooncrossBackUt", skip_typescript)]
pub fn mooncross_back_ut(
    x2cross: JsValue,
    jd_ut: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::mooncross_back_ut(
            argument::<f64>(x2cross)?,
            argument::<f64>(jd_ut)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "mooncrossUt", skip_typescript)]
pub fn mooncross_ut(x2cross: JsValue, jd_ut: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::mooncross_ut(
            argument::<f64>(x2cross)?,
            argument::<f64>(jd_ut)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "nextAspect2", skip_typescript)]
pub fn next_aspect2(
    planet: JsValue,
    aspect: JsValue,
    fixed_pt: JsValue,
    jd_start: JsValue,
    backward: JsValue,
    stop_days: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::next_aspect2(
        argument::<i32>(planet)?,
        argument::<f64>(aspect)?,
        argument::<f64>(fixed_pt)?,
        argument::<f64>(jd_start)?,
        argument::<bool>(backward)?,
        argument::<f64>(stop_days)?,
        argument::<i32>(flags)?,
    ))
}

#[wasm_bindgen(js_name = "nextAspectWith2", skip_typescript)]
pub fn next_aspect_with2(
    planet: JsValue,
    aspect: JsValue,
    other: JsValue,
    jd_start: JsValue,
    backward: JsValue,
    stop_days: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::next_aspect_with2(
        argument::<i32>(planet)?,
        argument::<f64>(aspect)?,
        argument::<i32>(other)?,
        argument::<f64>(jd_start)?,
        argument::<bool>(backward)?,
        argument::<f64>(stop_days)?,
        argument::<i32>(flags)?,
    ))
}

#[wasm_bindgen(js_name = "nextFullMoonAfter", skip_typescript)]
pub fn next_full_moon_after(jd_start: JsValue) -> Result<JsValue, JsValue> {
    output(&native::next_full_moon_after(argument::<f64>(jd_start)?))
}

#[wasm_bindgen(js_name = "nextNewMoonAfter", skip_typescript)]
pub fn next_new_moon_after(jd_start: JsValue) -> Result<JsValue, JsValue> {
    output(&native::next_new_moon_after(argument::<f64>(jd_start)?))
}

#[wasm_bindgen(js_name = "nextPrincipalPhase", skip_typescript)]
pub fn next_principal_phase(jd_from: JsValue, phase: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::next_principal_phase(argument::<f64>(jd_from)?, argument::<i32>(phase)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "nodAps", skip_typescript)]
pub fn nod_aps(
    jd_et: JsValue,
    body: JsValue,
    flags: JsValue,
    method: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::nod_aps(
            argument::<f64>(jd_et)?,
            argument::<i32>(body)?,
            argument::<i32>(flags)?,
            argument::<i32>(method)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "nodApsUt", skip_typescript)]
pub fn nod_aps_ut(
    jd_ut: JsValue,
    body: JsValue,
    flags: JsValue,
    method: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::nod_aps_ut(
            argument::<f64>(jd_ut)?,
            argument::<i32>(body)?,
            argument::<i32>(flags)?,
            argument::<i32>(method)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "parallacticAngle", skip_typescript)]
pub fn parallactic_angle(
    ha_deg: JsValue,
    dec_deg: JsValue,
    lat_deg: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::parallactic_angle(
        argument::<f64>(ha_deg)?,
        argument::<f64>(dec_deg)?,
        argument::<f64>(lat_deg)?,
    ))
}

#[wasm_bindgen(js_name = "parseTime", skip_typescript)]
pub fn parse_time(s: JsValue) -> Result<JsValue, JsValue> {
    output(&native::parse_time(argument::<String>(s)?))
}

#[wasm_bindgen(js_name = "pheno", skip_typescript)]
pub fn pheno(jd_et: JsValue, body: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::pheno(
            argument::<f64>(jd_et)?,
            argument::<i32>(body)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "phenoUt", skip_typescript)]
pub fn pheno_ut(jd_ut: JsValue, body: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::pheno_ut(
            argument::<f64>(jd_ut)?,
            argument::<i32>(body)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "planetConjunctMc", skip_typescript)]
pub fn planet_conjunct_mc(
    planet_lon: JsValue,
    mc_lon: JsValue,
    orb: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::planet_conjunct_mc(
        argument::<f64>(planet_lon)?,
        argument::<f64>(mc_lon)?,
        argument::<f64>(orb)?,
    ))
}

#[wasm_bindgen(js_name = "planetHouseNumber", skip_typescript)]
pub fn planet_house_number(planet_lon: JsValue, cusps: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::planet_house_number(argument::<f64>(planet_lon)?, argument::<Vec<f64>>(cusps)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "planetOnMidpoint", skip_typescript)]
pub fn planet_on_midpoint(
    planet_lon: JsValue,
    mid_lon: JsValue,
    orb: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::planet_on_midpoint(
        argument::<f64>(planet_lon)?,
        argument::<f64>(mid_lon)?,
        argument::<f64>(orb)?,
    ))
}

#[wasm_bindgen(js_name = "rasiDiff", skip_typescript)]
pub fn rasi_diff(r1: JsValue, r2: JsValue) -> Result<JsValue, JsValue> {
    output(&native::rasi_diff(
        argument::<i32>(r1)?,
        argument::<i32>(r2)?,
    ))
}

#[wasm_bindgen(js_name = "rasiDiff2", skip_typescript)]
pub fn rasi_diff2(r1: JsValue, r2: JsValue) -> Result<JsValue, JsValue> {
    output(&native::rasi_diff2(
        argument::<i32>(r1)?,
        argument::<i32>(r2)?,
    ))
}

#[wasm_bindgen(js_name = "rasiNorm", skip_typescript)]
pub fn rasi_norm(r: JsValue) -> Result<JsValue, JsValue> {
    output(&native::rasi_norm(argument::<i32>(r)?))
}

#[wasm_bindgen(js_name = "riseTransTrueHor", skip_typescript)]
pub fn rise_trans_true_hor(
    tjdut: JsValue,
    planet: JsValue,
    flags: JsValue,
    event_type: JsValue,
    geopos: JsValue,
    pressure_mb: JsValue,
    temp_c: JsValue,
    horhgt: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::rise_trans_true_hor(
            argument::<f64>(tjdut)?,
            argument::<i32>(planet)?,
            argument::<i32>(flags)?,
            argument::<i32>(event_type)?,
            argument::<Vec<f64>>(geopos)?,
            argument::<f64>(pressure_mb)?,
            argument::<f64>(temp_c)?,
            argument::<f64>(horhgt)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "sameSect", skip_typescript)]
pub fn same_sect(body: JsValue, is_day: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::same_sect(argument::<i32>(body)?, argument::<bool>(is_day)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "siderealModeFlag", skip_typescript)]
pub fn sidereal_mode_flag(sidmode: JsValue) -> Result<JsValue, JsValue> {
    output(&native::sidereal_mode_flag(argument::<i32>(sidmode)?))
}

#[wasm_bindgen(js_name = "siderealModeId", skip_typescript)]
pub fn sidereal_mode_id(flag: JsValue) -> Result<JsValue, JsValue> {
    output(&native::sidereal_mode_id(argument::<i32>(flag)?))
}

#[wasm_bindgen(js_name = "siderealTimeDeg", skip_typescript)]
pub fn sidereal_time_deg(jd_ut: JsValue) -> Result<JsValue, JsValue> {
    output(&native::sidereal_time_deg(argument::<f64>(jd_ut)?))
}

#[wasm_bindgen(js_name = "sidtime0", skip_typescript)]
pub fn sidtime0(jd_ut: JsValue, eps: JsValue, nut: JsValue) -> Result<JsValue, JsValue> {
    output(&native::sidtime0(
        argument::<f64>(jd_ut)?,
        argument::<f64>(eps)?,
        argument::<f64>(nut)?,
    ))
}

#[wasm_bindgen(js_name = "signExaltation", skip_typescript)]
pub fn sign_exaltation(body: JsValue) -> Result<JsValue, JsValue> {
    output(&native::sign_exaltation(argument::<i32>(body)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "signLord", skip_typescript)]
pub fn sign_lord(sign: JsValue) -> Result<JsValue, JsValue> {
    output(&native::sign_lord(argument::<i32>(sign)?))
}

#[wasm_bindgen(js_name = "solarHijriToGregorian", skip_typescript)]
pub fn solar_hijri_to_gregorian(solar_hijri_year: JsValue) -> Result<JsValue, JsValue> {
    output(&native::solar_hijri_to_gregorian(argument::<i32>(
        solar_hijri_year,
    )?))
}

#[wasm_bindgen(js_name = "solcross", skip_typescript)]
pub fn solcross(x2cross: JsValue, jd_et: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::solcross(
            argument::<f64>(x2cross)?,
            argument::<f64>(jd_et)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "solcrossBackUt", skip_typescript)]
pub fn solcross_back_ut(
    x2cross: JsValue,
    jd_ut: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &native::solcross_back_ut(
            argument::<f64>(x2cross)?,
            argument::<f64>(jd_ut)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "tatkalikaRelation", skip_typescript)]
pub fn tatkalika_relation(r1: JsValue, r2: JsValue) -> Result<JsValue, JsValue> {
    output(&native::tatkalika_relation(
        argument::<i32>(r1)?,
        argument::<i32>(r2)?,
    ))
}

#[wasm_bindgen(js_name = "timeEqu", skip_typescript)]
pub fn time_equ(jd_ut: JsValue) -> Result<JsValue, JsValue> {
    output(&native::time_equ(argument::<f64>(jd_ut)?).map_err(js_binding_error)?)
}

#[wasm_bindgen(js_name = "ttToUt", skip_typescript)]
pub fn tt_to_ut(jde: JsValue) -> Result<JsValue, JsValue> {
    output(&native::tt_to_ut(argument::<f64>(jde)?))
}

#[wasm_bindgen(js_name = "tzAbbrFind", skip_typescript)]
pub fn tz_abbr_find(abbr: JsValue) -> Result<JsValue, JsValue> {
    output(&native::tz_abbr_find(argument::<String>(abbr)?))
}

#[wasm_bindgen(js_name = "utcTimeZone", skip_typescript)]
pub fn utc_time_zone(
    year: JsValue,
    month: JsValue,
    day: JsValue,
    hour: JsValue,
    minute: JsValue,
    second: JsValue,
    d_timezone: JsValue,
) -> Result<JsValue, JsValue> {
    output(&native::utc_time_zone(
        argument::<i32>(year)?,
        argument::<i32>(month)?,
        argument::<i32>(day)?,
        argument::<i32>(hour)?,
        argument::<i32>(minute)?,
        argument::<f64>(second)?,
        argument::<f64>(d_timezone)?,
    ))
}

#[wasm_bindgen(js_name = "yearsDiff", skip_typescript)]
pub fn years_diff(jd1: JsValue, jd2: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &native::years_diff(
            argument::<f64>(jd1)?,
            argument::<f64>(jd2)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "ayanamsaEx", skip_typescript)]
pub fn ayanamsa_ex(jd_et: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &additional::ayanamsa_ex(argument::<f64>(jd_et)?, argument::<i32>(flags)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "ayanamsaExUt", skip_typescript)]
pub fn ayanamsa_ex_ut(jd_ut: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &additional::ayanamsa_ex_ut(argument::<f64>(jd_ut)?, argument::<i32>(flags)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "centisecToDegStr", skip_typescript)]
pub fn centisec_to_deg_str(value: JsValue) -> Result<JsValue, JsValue> {
    output(&additional::centisec_to_deg_str(argument::<i32>(value)?))
}

#[wasm_bindgen(js_name = "centisecToLonlatStr", skip_typescript)]
pub fn centisec_to_lonlat_str(
    value: JsValue,
    positive: JsValue,
    negative: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &additional::centisec_to_lonlat_str(
            argument::<i32>(value)?,
            argument::<String>(positive)?,
            argument::<String>(negative)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "centisecToTimeStr", skip_typescript)]
pub fn centisec_to_time_str(
    value: JsValue,
    separator: JsValue,
    suppress_zero: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &additional::centisec_to_time_str(
            argument::<i32>(value)?,
            argument::<String>(separator)?,
            argument::<bool>(suppress_zero)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "coordTransformWithSpeed", skip_typescript)]
pub fn coord_transform_with_speed(coords: JsValue, eps: JsValue) -> Result<JsValue, JsValue> {
    output(
        &additional::coord_transform_with_speed(
            argument::<Vec<f64>>(coords)?,
            argument::<f64>(eps)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "csRoundSec", skip_typescript)]
pub fn cs_round_sec(value: JsValue) -> Result<JsValue, JsValue> {
    output(&additional::cs_round_sec(argument::<i32>(value)?))
}

#[wasm_bindgen(js_name = "currentFileData", skip_typescript)]
pub fn current_file_data(file_number: JsValue) -> Result<JsValue, JsValue> {
    output(&additional::current_file_data(argument::<i32>(
        file_number,
    )?))
}

#[wasm_bindgen(js_name = "dateConversion", skip_typescript)]
pub fn date_conversion(
    year: JsValue,
    month: JsValue,
    day: JsValue,
    hour: JsValue,
    calendar: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &additional::date_conversion(
            argument::<i32>(year)?,
            argument::<i32>(month)?,
            argument::<i32>(day)?,
            argument::<f64>(hour)?,
            argument::<u8>(calendar)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "defaultOrb", skip_typescript)]
pub fn default_orb(body1: JsValue, body2: JsValue, aspect: JsValue) -> Result<JsValue, JsValue> {
    output(
        &additional::default_orb(
            argument::<i32>(body1)?,
            argument::<i32>(body2)?,
            argument::<f64>(aspect)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "degToCs", skip_typescript)]
pub fn deg_to_cs(value: JsValue) -> Result<JsValue, JsValue> {
    output(&additional::deg_to_cs(argument::<f64>(value)?))
}

#[wasm_bindgen(js_name = "deltatEx", skip_typescript)]
pub fn deltat_ex(jd: JsValue, flags: JsValue) -> Result<JsValue, JsValue> {
    output(
        &additional::deltat_ex(argument::<f64>(jd)?, argument::<i32>(flags)?)
            .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "diffCs", skip_typescript)]
pub fn diff_cs(first: JsValue, second: JsValue) -> Result<JsValue, JsValue> {
    output(&additional::diff_cs(
        argument::<i32>(first)?,
        argument::<i32>(second)?,
    ))
}

#[wasm_bindgen(js_name = "diffCsSigned", skip_typescript)]
pub fn diff_cs_signed(first: JsValue, second: JsValue) -> Result<JsValue, JsValue> {
    output(&additional::diff_cs_signed(
        argument::<i32>(first)?,
        argument::<i32>(second)?,
    ))
}

#[wasm_bindgen(js_name = "diffRadSigned", skip_typescript)]
pub fn diff_rad_signed(first: JsValue, second: JsValue) -> Result<JsValue, JsValue> {
    output(&additional::diff_rad_signed(
        argument::<f64>(first)?,
        argument::<f64>(second)?,
    ))
}

#[wasm_bindgen(js_name = "gauquelinSector", skip_typescript)]
pub fn gauquelin_sector(
    jd_ut: JsValue,
    body: JsValue,
    starname: JsValue,
    flags: JsValue,
    method: JsValue,
    geopos: JsValue,
    pressure: JsValue,
    temperature: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &additional::gauquelin_sector(
            argument::<f64>(jd_ut)?,
            argument::<i32>(body)?,
            argument::<Option<String>>(starname)?,
            argument::<i32>(flags)?,
            argument::<i32>(method)?,
            argument::<Vec<f64>>(geopos)?,
            argument::<f64>(pressure)?,
            argument::<f64>(temperature)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "getOrbitalElements", skip_typescript)]
pub fn get_orbital_elements(
    jd_et: JsValue,
    body: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &additional::get_orbital_elements(
            argument::<f64>(jd_et)?,
            argument::<i32>(body)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "heliacalPhenoUt", skip_typescript)]
pub fn heliacal_pheno_ut(
    jd_ut: JsValue,
    geopos: JsValue,
    atmosphere: JsValue,
    observer: JsValue,
    object_name: JsValue,
    event: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &additional::heliacal_pheno_ut(
            argument::<f64>(jd_ut)?,
            argument::<Vec<f64>>(geopos)?,
            argument::<Vec<f64>>(atmosphere)?,
            argument::<Vec<f64>>(observer)?,
            argument::<String>(object_name)?,
            argument::<i32>(event)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "isApplying", skip_typescript)]
pub fn is_applying(
    signed_separation: JsValue,
    relative_speed: JsValue,
    aspect: JsValue,
) -> Result<JsValue, JsValue> {
    output(&additional::is_applying(
        argument::<f64>(signed_separation)?,
        argument::<f64>(relative_speed)?,
        argument::<f64>(aspect)?,
    ))
}

#[wasm_bindgen(js_name = "libraryPath", skip_typescript)]
pub fn library_path() -> Result<JsValue, JsValue> {
    output(&additional::library_path())
}

#[wasm_bindgen(js_name = "makePillar", skip_typescript)]
pub fn make_pillar(stem: JsValue, branch: JsValue) -> Result<JsValue, JsValue> {
    output(&additional::make_pillar(
        argument::<u8>(stem)?,
        argument::<u8>(branch)?,
    ))
}

#[wasm_bindgen(js_name = "midpointRad", skip_typescript)]
pub fn midpoint_rad(first: JsValue, second: JsValue) -> Result<JsValue, JsValue> {
    output(&additional::midpoint_rad(
        argument::<f64>(first)?,
        argument::<f64>(second)?,
    ))
}

#[wasm_bindgen(js_name = "normRad", skip_typescript)]
pub fn norm_rad(value: JsValue) -> Result<JsValue, JsValue> {
    output(&additional::norm_rad(argument::<f64>(value)?))
}

#[wasm_bindgen(js_name = "orbitMaxMinTrueDistance", skip_typescript)]
pub fn orbit_max_min_true_distance(
    jd_et: JsValue,
    body: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &additional::orbit_max_min_true_distance(
            argument::<f64>(jd_et)?,
            argument::<i32>(body)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "setLapseRate", skip_typescript)]
pub fn set_lapse_rate(lapse_rate: JsValue) -> Result<JsValue, JsValue> {
    output(&additional::set_lapse_rate(argument::<f64>(lapse_rate)?))
}

#[wasm_bindgen(js_name = "setTidAcc", skip_typescript)]
pub fn set_tid_acc(acceleration: JsValue) -> Result<JsValue, JsValue> {
    output(&additional::set_tid_acc(argument::<f64>(acceleration)?))
}

#[wasm_bindgen(js_name = "tidAcc", skip_typescript)]
pub fn tid_acc() -> Result<JsValue, JsValue> {
    output(&additional::tid_acc())
}

#[wasm_bindgen(js_name = "visLimitMag", skip_typescript)]
pub fn vis_limit_mag(
    jd_ut: JsValue,
    geopos: JsValue,
    atmosphere: JsValue,
    observer: JsValue,
    object_name: JsValue,
    flags: JsValue,
) -> Result<JsValue, JsValue> {
    output(
        &additional::vis_limit_mag(
            argument::<f64>(jd_ut)?,
            argument::<Vec<f64>>(geopos)?,
            argument::<Vec<f64>>(atmosphere)?,
            argument::<Vec<f64>>(observer)?,
            argument::<String>(object_name)?,
            argument::<i32>(flags)?,
        )
        .map_err(js_binding_error)?,
    )
}

#[wasm_bindgen(js_name = "wrapSigned180", skip_typescript)]
pub fn wrap_signed_180(value: JsValue) -> Result<JsValue, JsValue> {
    output(&additional::wrap_signed_180(argument::<f64>(value)?))
}

#[wasm_bindgen(js_name = "constants", skip_typescript)]
pub fn constants() -> Result<JsValue, JsValue> {
    let object = js_sys::Object::new();
    insert_constant(
        &object,
        "ACRONYCHAL_RISING",
        &celestial_core::ACRONYCHAL_RISING,
    )?;
    insert_constant(
        &object,
        "ACRONYCHAL_SETTING",
        &celestial_core::ACRONYCHAL_SETTING,
    )?;
    insert_constant(&object, "ADMETOS", &celestial_core::ADMETOS)?;
    insert_constant(&object, "ALL_ASPECTS", &celestial_core::ALL_ASPECTS)?;
    insert_constant(&object, "APOLLON", &celestial_core::APOLLON)?;
    insert_constant(&object, "APP_TO_TRUE", &celestial_core::APP_TO_TRUE)?;
    insert_constant(&object, "ARCSEC_PER_RAD", &celestial_core::ARCSEC_PER_RAD)?;
    insert_constant(&object, "ARMC", &celestial_core::ARMC)?;
    insert_constant(&object, "ASC", &celestial_core::ASC)?;
    insert_constant(&object, "ASTNAMFILE", &celestial_core::ASTNAMFILE)?;
    insert_constant(&object, "AST_OFFSET", &celestial_core::AST_OFFSET)?;
    insert_constant(&object, "AU_KM", &celestial_core::AU_KM)?;
    insert_constant(
        &object,
        "BIT_ASTRO_TWILIGHT",
        &celestial_core::BIT_ASTRO_TWILIGHT,
    )?;
    insert_constant(
        &object,
        "BIT_CIVIL_TWILIGHT",
        &celestial_core::BIT_CIVIL_TWILIGHT,
    )?;
    insert_constant(&object, "BIT_DISC_BOTTOM", &celestial_core::BIT_DISC_BOTTOM)?;
    insert_constant(&object, "BIT_DISC_CENTER", &celestial_core::BIT_DISC_CENTER)?;
    insert_constant(
        &object,
        "BIT_FIXED_DISC_SIZE",
        &celestial_core::BIT_FIXED_DISC_SIZE,
    )?;
    insert_constant(
        &object,
        "BIT_FORCE_SLOW_METHOD",
        &celestial_core::BIT_FORCE_SLOW_METHOD,
    )?;
    insert_constant(
        &object,
        "BIT_GEOCTR_NO_ECL_LAT",
        &celestial_core::BIT_GEOCTR_NO_ECL_LAT,
    )?;
    insert_constant(
        &object,
        "BIT_HINDU_RISING",
        &celestial_core::BIT_HINDU_RISING,
    )?;
    insert_constant(
        &object,
        "BIT_NAUTIC_TWILIGHT",
        &celestial_core::BIT_NAUTIC_TWILIGHT,
    )?;
    insert_constant(
        &object,
        "BIT_NO_REFRACTION",
        &celestial_core::BIT_NO_REFRACTION,
    )?;
    insert_constant(&object, "CALC_AZALT", &celestial_core::CALC_AZALT)?;
    insert_constant(&object, "CALC_AZALT_REV", &celestial_core::CALC_AZALT_REV)?;
    insert_constant(&object, "CALC_ITRANSIT", &celestial_core::CALC_ITRANSIT)?;
    insert_constant(&object, "CALC_MTRANSIT", &celestial_core::CALC_MTRANSIT)?;
    insert_constant(&object, "CALC_RISE", &celestial_core::CALC_RISE)?;
    insert_constant(&object, "CALC_SET", &celestial_core::CALC_SET)?;
    insert_constant(&object, "CERES", &celestial_core::CERES)?;
    insert_constant(
        &object,
        "CHINA_TZ_OFFSET_HOURS",
        &celestial_core::CHINA_TZ_OFFSET_HOURS,
    )?;
    insert_constant(&object, "CHIRON", &celestial_core::CHIRON)?;
    insert_constant(&object, "COASC1", &celestial_core::COASC1)?;
    insert_constant(&object, "COASC2", &celestial_core::COASC2)?;
    insert_constant(&object, "COMET_OFFSET", &celestial_core::COMET_OFFSET)?;
    insert_constant(&object, "COPTIC_EPOCH_JD", &celestial_core::COPTIC_EPOCH_JD)?;
    insert_constant(&object, "COPTIC_MONTHS", &celestial_core::COPTIC_MONTHS)?;
    insert_constant(&object, "COSMICAL_RISING", &celestial_core::COSMICAL_RISING)?;
    insert_constant(
        &object,
        "COSMICAL_SETTING",
        &celestial_core::COSMICAL_SETTING,
    )?;
    insert_constant(&object, "CUPIDO", &celestial_core::CUPIDO)?;
    insert_constant(&object, "DASHA_SEQUENCE", &celestial_core::DASHA_SEQUENCE)?;
    insert_constant(&object, "EARTH", &celestial_core::EARTH)?;
    insert_constant(
        &object,
        "EARTHLY_BRANCHES",
        &celestial_core::EARTHLY_BRANCHES,
    )?;
    insert_constant(&object, "EARTH_RADIUS_KM", &celestial_core::EARTH_RADIUS_KM)?;
    insert_constant(&object, "ECL_1ST_VISIBLE", &celestial_core::ECL_1ST_VISIBLE)?;
    insert_constant(&object, "ECL_2ND_VISIBLE", &celestial_core::ECL_2ND_VISIBLE)?;
    insert_constant(&object, "ECL_3RD_VISIBLE", &celestial_core::ECL_3RD_VISIBLE)?;
    insert_constant(&object, "ECL_4TH_VISIBLE", &celestial_core::ECL_4TH_VISIBLE)?;
    insert_constant(
        &object,
        "ECL_ALLTYPES_LUNAR",
        &celestial_core::ECL_ALLTYPES_LUNAR,
    )?;
    insert_constant(
        &object,
        "ECL_ALLTYPES_SOLAR",
        &celestial_core::ECL_ALLTYPES_SOLAR,
    )?;
    insert_constant(&object, "ECL_ANNULAR", &celestial_core::ECL_ANNULAR)?;
    insert_constant(
        &object,
        "ECL_ANNULAR_TOTAL",
        &celestial_core::ECL_ANNULAR_TOTAL,
    )?;
    insert_constant(&object, "ECL_CENTRAL", &celestial_core::ECL_CENTRAL)?;
    insert_constant(&object, "ECL_HYBRID", &celestial_core::ECL_HYBRID)?;
    insert_constant(&object, "ECL_MAX_VISIBLE", &celestial_core::ECL_MAX_VISIBLE)?;
    insert_constant(&object, "ECL_NONCENTRAL", &celestial_core::ECL_NONCENTRAL)?;
    insert_constant(&object, "ECL_NUT", &celestial_core::ECL_NUT)?;
    insert_constant(&object, "ECL_OCCULTATION", &celestial_core::ECL_OCCULTATION)?;
    insert_constant(&object, "ECL_ONE_TRY", &celestial_core::ECL_ONE_TRY)?;
    insert_constant(
        &object,
        "ECL_PARTBEG_VISIBLE",
        &celestial_core::ECL_PARTBEG_VISIBLE,
    )?;
    insert_constant(
        &object,
        "ECL_PARTEND_VISIBLE",
        &celestial_core::ECL_PARTEND_VISIBLE,
    )?;
    insert_constant(&object, "ECL_PARTIAL", &celestial_core::ECL_PARTIAL)?;
    insert_constant(&object, "ECL_PENUMBRAL", &celestial_core::ECL_PENUMBRAL)?;
    insert_constant(&object, "ECL_TOTAL", &celestial_core::ECL_TOTAL)?;
    insert_constant(
        &object,
        "ECL_TOTBEG_VISIBLE",
        &celestial_core::ECL_TOTBEG_VISIBLE,
    )?;
    insert_constant(
        &object,
        "ECL_TOTEND_VISIBLE",
        &celestial_core::ECL_TOTEND_VISIBLE,
    )?;
    insert_constant(&object, "ECL_VISIBLE", &celestial_core::ECL_VISIBLE)?;
    insert_constant(&object, "EPHE_PATH", &celestial_core::EPHE_PATH)?;
    insert_constant(&object, "EQUASC", &celestial_core::EQUASC)?;
    insert_constant(
        &object,
        "ETHIOPIC_EPOCH_JD",
        &celestial_core::ETHIOPIC_EPOCH_JD,
    )?;
    insert_constant(&object, "ETHIOPIC_MONTHS", &celestial_core::ETHIOPIC_MONTHS)?;
    insert_constant(&object, "EVENING_FIRST", &celestial_core::EVENING_FIRST)?;
    insert_constant(&object, "EVENING_RISING", &celestial_core::EVENING_RISING)?;
    insert_constant(&object, "FASLI_MONTHS", &celestial_core::FASLI_MONTHS)?;
    insert_constant(&object, "FICTFILE", &celestial_core::FICTFILE)?;
    insert_constant(&object, "FICT_MAX", &celestial_core::FICT_MAX)?;
    insert_constant(&object, "FICT_OFFSET", &celestial_core::FICT_OFFSET)?;
    insert_constant(&object, "FICT_OFFSET_1", &celestial_core::FICT_OFFSET_1)?;
    insert_constant(&object, "FIXSTAR", &celestial_core::FIXSTAR)?;
    insert_constant(&object, "FLG_ASTROMETRIC", &celestial_core::FLG_ASTROMETRIC)?;
    insert_constant(&object, "FLG_BARYCTR", &celestial_core::FLG_BARYCTR)?;
    insert_constant(&object, "FLG_BUILTIN", &celestial_core::FLG_BUILTIN)?;
    insert_constant(&object, "FLG_CENTER_BODY", &celestial_core::FLG_CENTER_BODY)?;
    insert_constant(
        &object,
        "FLG_DPSIDEPS_1980",
        &celestial_core::FLG_DPSIDEPS_1980,
    )?;
    insert_constant(&object, "FLG_EQUATORIAL", &celestial_core::FLG_EQUATORIAL)?;
    insert_constant(&object, "FLG_HELCTR", &celestial_core::FLG_HELCTR)?;
    insert_constant(&object, "FLG_ICRS", &celestial_core::FLG_ICRS)?;
    insert_constant(&object, "FLG_J2000", &celestial_core::FLG_J2000)?;
    insert_constant(&object, "FLG_JPL", &celestial_core::FLG_JPL)?;
    insert_constant(&object, "FLG_JPLHOR", &celestial_core::FLG_JPLHOR)?;
    insert_constant(
        &object,
        "FLG_JPLHOR_APPROX",
        &celestial_core::FLG_JPLHOR_APPROX,
    )?;
    insert_constant(&object, "FLG_MOSHIER", &celestial_core::FLG_MOSHIER)?;
    insert_constant(&object, "FLG_NOABERR", &celestial_core::FLG_NOABERR)?;
    insert_constant(&object, "FLG_NOGDEFL", &celestial_core::FLG_NOGDEFL)?;
    insert_constant(&object, "FLG_NONUT", &celestial_core::FLG_NONUT)?;
    insert_constant(&object, "FLG_ORBEL_AA", &celestial_core::FLG_ORBEL_AA)?;
    insert_constant(&object, "FLG_RADIANS", &celestial_core::FLG_RADIANS)?;
    insert_constant(&object, "FLG_SIDEREAL", &celestial_core::FLG_SIDEREAL)?;
    insert_constant(&object, "FLG_SPEED", &celestial_core::FLG_SPEED)?;
    insert_constant(&object, "FLG_SPEED3", &celestial_core::FLG_SPEED3)?;
    insert_constant(&object, "FLG_TEST_PLMOON", &celestial_core::FLG_TEST_PLMOON)?;
    insert_constant(&object, "FLG_TOPOCTR", &celestial_core::FLG_TOPOCTR)?;
    insert_constant(&object, "FLG_TROPICAL", &celestial_core::FLG_TROPICAL)?;
    insert_constant(&object, "FLG_TRUEPOS", &celestial_core::FLG_TRUEPOS)?;
    insert_constant(&object, "FLG_XYZ", &celestial_core::FLG_XYZ)?;
    insert_constant(&object, "FNAME_DE200", &celestial_core::FNAME_DE200)?;
    insert_constant(&object, "FNAME_DE403", &celestial_core::FNAME_DE403)?;
    insert_constant(&object, "FNAME_DE404", &celestial_core::FNAME_DE404)?;
    insert_constant(&object, "FNAME_DE405", &celestial_core::FNAME_DE405)?;
    insert_constant(&object, "FNAME_DE406", &celestial_core::FNAME_DE406)?;
    insert_constant(&object, "FNAME_DE431", &celestial_core::FNAME_DE431)?;
    insert_constant(&object, "FNAME_DFT", &celestial_core::FNAME_DFT)?;
    insert_constant(&object, "FNAME_DFT2", &celestial_core::FNAME_DFT2)?;
    insert_constant(&object, "GATHA_DAYS", &celestial_core::GATHA_DAYS)?;
    insert_constant(&object, "GMT_CORRELATION", &celestial_core::GMT_CORRELATION)?;
    insert_constant(&object, "GREG_CAL", &celestial_core::GREG_CAL)?;
    insert_constant(&object, "HADES", &celestial_core::HADES)?;
    insert_constant(&object, "HARRINGTON", &celestial_core::HARRINGTON)?;
    insert_constant(&object, "HEAVENLY_STEMS", &celestial_core::HEAVENLY_STEMS)?;
    insert_constant(&object, "HELFLAG_AV", &celestial_core::HELFLAG_AV)?;
    insert_constant(
        &object,
        "HELFLAG_AVKIND_MIN7",
        &celestial_core::HELFLAG_AVKIND_MIN7,
    )?;
    insert_constant(
        &object,
        "HELFLAG_AVKIND_MIN9",
        &celestial_core::HELFLAG_AVKIND_MIN9,
    )?;
    insert_constant(
        &object,
        "HELFLAG_AVKIND_PTO",
        &celestial_core::HELFLAG_AVKIND_PTO,
    )?;
    insert_constant(
        &object,
        "HELFLAG_AVKIND_VR",
        &celestial_core::HELFLAG_AVKIND_VR,
    )?;
    insert_constant(
        &object,
        "HELFLAG_HIGH_PRECISION",
        &celestial_core::HELFLAG_HIGH_PRECISION,
    )?;
    insert_constant(
        &object,
        "HELFLAG_LONG_SEARCH",
        &celestial_core::HELFLAG_LONG_SEARCH,
    )?;
    insert_constant(
        &object,
        "HELFLAG_NO_DETAILS",
        &celestial_core::HELFLAG_NO_DETAILS,
    )?;
    insert_constant(
        &object,
        "HELFLAG_OPTICAL_PARAMS",
        &celestial_core::HELFLAG_OPTICAL_PARAMS,
    )?;
    insert_constant(
        &object,
        "HELFLAG_SEARCH_1_PERIOD",
        &celestial_core::HELFLAG_SEARCH_1_PERIOD,
    )?;
    insert_constant(
        &object,
        "HELFLAG_VISLIM_DARK",
        &celestial_core::HELFLAG_VISLIM_DARK,
    )?;
    insert_constant(
        &object,
        "HELFLAG_VISLIM_NOMOON",
        &celestial_core::HELFLAG_VISLIM_NOMOON,
    )?;
    insert_constant(
        &object,
        "HELFLAG_VISLIM_PHOTOPIC",
        &celestial_core::HELFLAG_VISLIM_PHOTOPIC,
    )?;
    insert_constant(
        &object,
        "HELFLAG_VISLIM_SCOTOPIC",
        &celestial_core::HELFLAG_VISLIM_SCOTOPIC,
    )?;
    insert_constant(&object, "HELIACAL_RISING", &celestial_core::HELIACAL_RISING)?;
    insert_constant(
        &object,
        "HELIACAL_SETTING",
        &celestial_core::HELIACAL_SETTING,
    )?;
    insert_constant(&object, "INTP_APOG", &celestial_core::INTP_APOG)?;
    insert_constant(&object, "INTP_PERG", &celestial_core::INTP_PERG)?;
    insert_constant(&object, "ISIS", &celestial_core::ISIS)?;
    insert_constant(&object, "JUL_CAL", &celestial_core::JUL_CAL)?;
    insert_constant(&object, "JUNO", &celestial_core::JUNO)?;
    insert_constant(&object, "JUPITER", &celestial_core::JUPITER)?;
    insert_constant(&object, "KARANA_NAMES", &celestial_core::KARANA_NAMES)?;
    insert_constant(&object, "KRONOS", &celestial_core::KRONOS)?;
    insert_constant(
        &object,
        "LHASA_TZ_OFFSET_HOURS",
        &celestial_core::LHASA_TZ_OFFSET_HOURS,
    )?;
    insert_constant(&object, "MAJOR_ASPECTS", &celestial_core::MAJOR_ASPECTS)?;
    insert_constant(&object, "MARS", &celestial_core::MARS)?;
    insert_constant(&object, "MC", &celestial_core::MC)?;
    insert_constant(&object, "MEAN_APOG", &celestial_core::MEAN_APOG)?;
    insert_constant(&object, "MEAN_NODE", &celestial_core::MEAN_NODE)?;
    insert_constant(&object, "MERCURY", &celestial_core::MERCURY)?;
    insert_constant(&object, "MOON", &celestial_core::MOON)?;
    insert_constant(&object, "MORNING_LAST", &celestial_core::MORNING_LAST)?;
    insert_constant(&object, "MORNING_SETTING", &celestial_core::MORNING_SETTING)?;
    insert_constant(&object, "NAKSHATRA_NAMES", &celestial_core::NAKSHATRA_NAMES)?;
    insert_constant(&object, "NALL_NAT_POINTS", &celestial_core::NALL_NAT_POINTS)?;
    insert_constant(&object, "NASCMC", &celestial_core::NASCMC)?;
    insert_constant(&object, "NEPTUNE", &celestial_core::NEPTUNE)?;
    insert_constant(&object, "NEPTUNE_ADAMS", &celestial_core::NEPTUNE_ADAMS)?;
    insert_constant(
        &object,
        "NEPTUNE_LEVERRIER",
        &celestial_core::NEPTUNE_LEVERRIER,
    )?;
    insert_constant(&object, "NFICT_ELEM", &celestial_core::NFICT_ELEM)?;
    insert_constant(&object, "NIBIRU", &celestial_core::NIBIRU)?;
    insert_constant(&object, "NODBIT_FOPOINT", &celestial_core::NODBIT_FOPOINT)?;
    insert_constant(&object, "NODBIT_MEAN", &celestial_core::NODBIT_MEAN)?;
    insert_constant(&object, "NODBIT_OSCU", &celestial_core::NODBIT_OSCU)?;
    insert_constant(&object, "NODBIT_OSCU_BAR", &celestial_core::NODBIT_OSCU_BAR)?;
    insert_constant(&object, "NPLANETS", &celestial_core::NPLANETS)?;
    insert_constant(&object, "OBLIQUITY_J2000", &celestial_core::OBLIQUITY_J2000)?;
    insert_constant(&object, "OSCU_APOG", &celestial_core::OSCU_APOG)?;
    insert_constant(&object, "PALLAS", &celestial_core::PALLAS)?;
    insert_constant(&object, "PHOLUS", &celestial_core::PHOLUS)?;
    insert_constant(&object, "PLMOON_OFFSET", &celestial_core::PLMOON_OFFSET)?;
    insert_constant(&object, "PLUTO", &celestial_core::PLUTO)?;
    insert_constant(&object, "PLUTO_LOWELL", &celestial_core::PLUTO_LOWELL)?;
    insert_constant(&object, "PLUTO_PICKERING", &celestial_core::PLUTO_PICKERING)?;
    insert_constant(&object, "POLASC", &celestial_core::POLASC)?;
    insert_constant(&object, "POSEIDON", &celestial_core::POSEIDON)?;
    insert_constant(&object, "PROSERPINA", &celestial_core::PROSERPINA)?;
    insert_constant(&object, "RAD_PER_ARCSEC", &celestial_core::RAD_PER_ARCSEC)?;
    insert_constant(&object, "SATURN", &celestial_core::SATURN)?;
    insert_constant(&object, "SIDBITS", &celestial_core::SIDBITS)?;
    insert_constant(&object, "SIDBIT_ECL_DATE", &celestial_core::SIDBIT_ECL_DATE)?;
    insert_constant(&object, "SIDBIT_ECL_T0", &celestial_core::SIDBIT_ECL_T0)?;
    insert_constant(
        &object,
        "SIDBIT_NO_PREC_OFFSET",
        &celestial_core::SIDBIT_NO_PREC_OFFSET,
    )?;
    insert_constant(
        &object,
        "SIDBIT_PREC_ORIG",
        &celestial_core::SIDBIT_PREC_ORIG,
    )?;
    insert_constant(
        &object,
        "SIDBIT_SSY_PLANE",
        &celestial_core::SIDBIT_SSY_PLANE,
    )?;
    insert_constant(&object, "SIDBIT_USER_UT", &celestial_core::SIDBIT_USER_UT)?;
    insert_constant(
        &object,
        "SIDM_ALDEBARAN_15TAU",
        &celestial_core::SIDM_ALDEBARAN_15TAU,
    )?;
    insert_constant(&object, "SIDM_ARYABHATA", &celestial_core::SIDM_ARYABHATA)?;
    insert_constant(
        &object,
        "SIDM_ARYABHATA_522",
        &celestial_core::SIDM_ARYABHATA_522,
    )?;
    insert_constant(
        &object,
        "SIDM_ARYABHATA_MSUN",
        &celestial_core::SIDM_ARYABHATA_MSUN,
    )?;
    insert_constant(&object, "SIDM_B1950", &celestial_core::SIDM_B1950)?;
    insert_constant(
        &object,
        "SIDM_BABYL_BRITTON",
        &celestial_core::SIDM_BABYL_BRITTON,
    )?;
    insert_constant(
        &object,
        "SIDM_BABYL_ETPSC",
        &celestial_core::SIDM_BABYL_ETPSC,
    )?;
    insert_constant(
        &object,
        "SIDM_BABYL_HUBER",
        &celestial_core::SIDM_BABYL_HUBER,
    )?;
    insert_constant(
        &object,
        "SIDM_BABYL_KUGLER1",
        &celestial_core::SIDM_BABYL_KUGLER1,
    )?;
    insert_constant(
        &object,
        "SIDM_BABYL_KUGLER2",
        &celestial_core::SIDM_BABYL_KUGLER2,
    )?;
    insert_constant(
        &object,
        "SIDM_BABYL_KUGLER3",
        &celestial_core::SIDM_BABYL_KUGLER3,
    )?;
    insert_constant(&object, "SIDM_DELUCE", &celestial_core::SIDM_DELUCE)?;
    insert_constant(
        &object,
        "SIDM_DJWHAL_KHUL",
        &celestial_core::SIDM_DJWHAL_KHUL,
    )?;
    insert_constant(
        &object,
        "SIDM_FAGAN_BRADLEY",
        &celestial_core::SIDM_FAGAN_BRADLEY,
    )?;
    insert_constant(
        &object,
        "SIDM_GALALIGN_MARDYKS",
        &celestial_core::SIDM_GALALIGN_MARDYKS,
    )?;
    insert_constant(
        &object,
        "SIDM_GALCENT_0SAG",
        &celestial_core::SIDM_GALCENT_0SAG,
    )?;
    insert_constant(
        &object,
        "SIDM_GALCENT_COCHRANE",
        &celestial_core::SIDM_GALCENT_COCHRANE,
    )?;
    insert_constant(
        &object,
        "SIDM_GALCENT_MULA_WILHELM",
        &celestial_core::SIDM_GALCENT_MULA_WILHELM,
    )?;
    insert_constant(
        &object,
        "SIDM_GALCENT_RGILBRAND",
        &celestial_core::SIDM_GALCENT_RGILBRAND,
    )?;
    insert_constant(
        &object,
        "SIDM_GALEQU_FIORENZA",
        &celestial_core::SIDM_GALEQU_FIORENZA,
    )?;
    insert_constant(
        &object,
        "SIDM_GALEQU_IAU1958",
        &celestial_core::SIDM_GALEQU_IAU1958,
    )?;
    insert_constant(
        &object,
        "SIDM_GALEQU_MULA",
        &celestial_core::SIDM_GALEQU_MULA,
    )?;
    insert_constant(
        &object,
        "SIDM_GALEQU_TRUE",
        &celestial_core::SIDM_GALEQU_TRUE,
    )?;
    insert_constant(&object, "SIDM_HIPPARCHOS", &celestial_core::SIDM_HIPPARCHOS)?;
    insert_constant(&object, "SIDM_J1900", &celestial_core::SIDM_J1900)?;
    insert_constant(&object, "SIDM_J2000", &celestial_core::SIDM_J2000)?;
    insert_constant(&object, "SIDM_JN_BHASIN", &celestial_core::SIDM_JN_BHASIN)?;
    insert_constant(
        &object,
        "SIDM_KRISHNAMURTI",
        &celestial_core::SIDM_KRISHNAMURTI,
    )?;
    insert_constant(
        &object,
        "SIDM_KRISHNAMURTI_VP291",
        &celestial_core::SIDM_KRISHNAMURTI_VP291,
    )?;
    insert_constant(&object, "SIDM_LAHIRI", &celestial_core::SIDM_LAHIRI)?;
    insert_constant(
        &object,
        "SIDM_LAHIRI_1940",
        &celestial_core::SIDM_LAHIRI_1940,
    )?;
    insert_constant(
        &object,
        "SIDM_LAHIRI_ICRC",
        &celestial_core::SIDM_LAHIRI_ICRC,
    )?;
    insert_constant(
        &object,
        "SIDM_LAHIRI_VP285",
        &celestial_core::SIDM_LAHIRI_VP285,
    )?;
    insert_constant(&object, "SIDM_RAMAN", &celestial_core::SIDM_RAMAN)?;
    insert_constant(&object, "SIDM_SASSANIAN", &celestial_core::SIDM_SASSANIAN)?;
    insert_constant(&object, "SIDM_SS_CITRA", &celestial_core::SIDM_SS_CITRA)?;
    insert_constant(&object, "SIDM_SS_REVATI", &celestial_core::SIDM_SS_REVATI)?;
    insert_constant(
        &object,
        "SIDM_SURYASIDDHANTA",
        &celestial_core::SIDM_SURYASIDDHANTA,
    )?;
    insert_constant(
        &object,
        "SIDM_SURYASIDDHANTA_MSUN",
        &celestial_core::SIDM_SURYASIDDHANTA_MSUN,
    )?;
    insert_constant(&object, "SIDM_TRUE_CITRA", &celestial_core::SIDM_TRUE_CITRA)?;
    insert_constant(&object, "SIDM_TRUE_MULA", &celestial_core::SIDM_TRUE_MULA)?;
    insert_constant(
        &object,
        "SIDM_TRUE_PUSHYA",
        &celestial_core::SIDM_TRUE_PUSHYA,
    )?;
    insert_constant(
        &object,
        "SIDM_TRUE_REVATI",
        &celestial_core::SIDM_TRUE_REVATI,
    )?;
    insert_constant(
        &object,
        "SIDM_TRUE_SHEORAN",
        &celestial_core::SIDM_TRUE_SHEORAN,
    )?;
    insert_constant(&object, "SIDM_USER", &celestial_core::SIDM_USER)?;
    insert_constant(&object, "SIDM_USHASHASHI", &celestial_core::SIDM_USHASHASHI)?;
    insert_constant(
        &object,
        "SIDM_VALENS_MOON",
        &celestial_core::SIDM_VALENS_MOON,
    )?;
    insert_constant(&object, "SIDM_YUKTESHWAR", &celestial_core::SIDM_YUKTESHWAR)?;
    insert_constant(&object, "SOLAR_PARALLAX", &celestial_core::SOLAR_PARALLAX)?;
    insert_constant(&object, "SOLAR_TERMS", &celestial_core::SOLAR_TERMS)?;
    insert_constant(
        &object,
        "SPLIT_DEG_KEEP_DEG",
        &celestial_core::SPLIT_DEG_KEEP_DEG,
    )?;
    insert_constant(
        &object,
        "SPLIT_DEG_KEEP_SIGN",
        &celestial_core::SPLIT_DEG_KEEP_SIGN,
    )?;
    insert_constant(
        &object,
        "SPLIT_DEG_NAKSHATRA",
        &celestial_core::SPLIT_DEG_NAKSHATRA,
    )?;
    insert_constant(
        &object,
        "SPLIT_DEG_ROUND_DEG",
        &celestial_core::SPLIT_DEG_ROUND_DEG,
    )?;
    insert_constant(
        &object,
        "SPLIT_DEG_ROUND_MIN",
        &celestial_core::SPLIT_DEG_ROUND_MIN,
    )?;
    insert_constant(
        &object,
        "SPLIT_DEG_ROUND_SEC",
        &celestial_core::SPLIT_DEG_ROUND_SEC,
    )?;
    insert_constant(
        &object,
        "SPLIT_DEG_ZODIACAL",
        &celestial_core::SPLIT_DEG_ZODIACAL,
    )?;
    insert_constant(&object, "STARFILE", &celestial_core::STARFILE)?;
    insert_constant(&object, "STARFILE_OLD", &celestial_core::STARFILE_OLD)?;
    insert_constant(&object, "SUN", &celestial_core::SUN)?;
    insert_constant(&object, "SYNODIC_MONTH", &celestial_core::SYNODIC_MONTH)?;
    insert_constant(&object, "TIDAL_26", &celestial_core::TIDAL_26)?;
    insert_constant(&object, "TIDAL_AUTOMATIC", &celestial_core::TIDAL_AUTOMATIC)?;
    insert_constant(&object, "TIDAL_DE200", &celestial_core::TIDAL_DE200)?;
    insert_constant(&object, "TIDAL_DE403", &celestial_core::TIDAL_DE403)?;
    insert_constant(&object, "TIDAL_DE404", &celestial_core::TIDAL_DE404)?;
    insert_constant(&object, "TIDAL_DE405", &celestial_core::TIDAL_DE405)?;
    insert_constant(&object, "TIDAL_DE406", &celestial_core::TIDAL_DE406)?;
    insert_constant(&object, "TIDAL_DE421", &celestial_core::TIDAL_DE421)?;
    insert_constant(&object, "TIDAL_DE422", &celestial_core::TIDAL_DE422)?;
    insert_constant(&object, "TIDAL_DE430", &celestial_core::TIDAL_DE430)?;
    insert_constant(&object, "TIDAL_DE431", &celestial_core::TIDAL_DE431)?;
    insert_constant(&object, "TIDAL_DEFAULT", &celestial_core::TIDAL_DEFAULT)?;
    insert_constant(
        &object,
        "TIDAL_JPLEPH_DE406",
        &celestial_core::TIDAL_JPLEPH_DE406,
    )?;
    insert_constant(&object, "TIDAL_MOSEPH", &celestial_core::TIDAL_MOSEPH)?;
    insert_constant(
        &object,
        "TIDAL_STEPHENSON_2016",
        &celestial_core::TIDAL_STEPHENSON_2016,
    )?;
    insert_constant(&object, "TIDAL_SWIEPH", &celestial_core::TIDAL_SWIEPH)?;
    insert_constant(&object, "TITHI_NAMES", &celestial_core::TITHI_NAMES)?;
    insert_constant(
        &object,
        "TONALPOHUALLI_SIGNS",
        &celestial_core::TONALPOHUALLI_SIGNS,
    )?;
    insert_constant(&object, "TRUE_NODE", &celestial_core::TRUE_NODE)?;
    insert_constant(&object, "TRUE_TO_APP", &celestial_core::TRUE_TO_APP)?;
    insert_constant(&object, "TZOLKIN_SIGNS", &celestial_core::TZOLKIN_SIGNS)?;
    insert_constant(&object, "TZ_TABLE", &additional::timezone_table())?;
    insert_constant(&object, "URANUS", &celestial_core::URANUS)?;
    insert_constant(&object, "VARA_NAMES", &celestial_core::VARA_NAMES)?;
    insert_constant(&object, "VARUNA", &celestial_core::VARUNA)?;
    insert_constant(&object, "VENUS", &celestial_core::VENUS)?;
    insert_constant(&object, "VERTEX", &celestial_core::VERTEX)?;
    insert_constant(&object, "VESTA", &celestial_core::VESTA)?;
    insert_constant(
        &object,
        "VIETNAM_TZ_OFFSET_HOURS",
        &celestial_core::VIETNAM_TZ_OFFSET_HOURS,
    )?;
    insert_constant(&object, "VULCAN", &celestial_core::VULCAN)?;
    insert_constant(&object, "VULKANUS", &celestial_core::VULKANUS)?;
    insert_constant(&object, "WALDEMATH", &celestial_core::WALDEMATH)?;
    insert_constant(&object, "WHITE_MOON", &celestial_core::WHITE_MOON)?;
    insert_constant(
        &object,
        "XIUHPOHUALLI_MONTHS",
        &celestial_core::XIUHPOHUALLI_MONTHS,
    )?;
    insert_constant(&object, "YOGA_NAMES", &celestial_core::YOGA_NAMES)?;
    insert_constant(&object, "ZEUS", &celestial_core::ZEUS)?;
    Ok(object.into())
}
