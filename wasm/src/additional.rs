use crate::binding;
use celestial::{Body, CalcFlags, Degrees, JulianDay};
use celestial_core as celestial;

fn body_of(raw: i32) -> binding::Result<Body> {
    Body::try_from_raw(raw).map_err(|_| binding::Error::invalid_body(raw))
}

fn core_error(error: celestial::Error) -> binding::Error {
    binding::Error::from(error)
}

fn character(text: &str) -> binding::Result<char> {
    let mut characters = text.chars();
    let first = characters
        .next()
        .ok_or_else(|| binding::Error::from_reason("expected exactly one Unicode character"))?;
    if characters.next().is_some() {
        return Err(binding::Error::from_reason(
            "expected exactly one Unicode character",
        ));
    }
    Ok(first)
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrentFileData {
    pub path: String,
    pub tfstart: f64,
    pub tfend: f64,
    pub denum: i32,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrbitalElements {
    pub semi_major_axis: f64,
    pub eccentricity: f64,
    pub inclination: f64,
    pub ascending_node: f64,
    pub arg_perihelion: f64,
    pub mean_anomaly: f64,
    pub epoch: f64,
    pub mean_daily_motion: f64,
    pub extra: Vec<f64>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrbitalDistances {
    pub dmax: f64,
    pub dmin: f64,
    pub dtrue: f64,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BaZiPillar {
    pub stem: u8,
    pub branch: u8,
    pub stem_name: String,
    pub branch_name: String,
    pub animal: String,
    pub stem_element: String,
    pub branch_element: String,
    pub yang: bool,
}

impl From<celestial::BaZiPillar> for BaZiPillar {
    fn from(pillar: celestial::BaZiPillar) -> Self {
        Self {
            stem: pillar.stem,
            branch: pillar.branch,
            stem_name: pillar.stem_name.to_owned(),
            branch_name: pillar.branch_name.to_owned(),
            animal: pillar.animal.to_owned(),
            stem_element: pillar.stem_element.to_owned(),
            branch_element: pillar.branch_element.to_owned(),
            yang: pillar.yang,
        }
    }
}

pub fn ayanamsa_ex(jd_et: f64, flags: i32) -> binding::Result<f64> {
    celestial::ayanamsa_ex(JulianDay::new(jd_et), CalcFlags(flags)).map_err(core_error)
}

pub fn ayanamsa_ex_ut(jd_ut: f64, flags: i32) -> binding::Result<f64> {
    celestial::ayanamsa_ex_ut(JulianDay::new(jd_ut), CalcFlags(flags)).map_err(core_error)
}

pub fn centisec_to_deg_str(value: i32) -> String {
    celestial::centisec_to_deg_str(value)
}

pub fn centisec_to_lonlat_str(
    value: i32,
    positive: String,
    negative: String,
) -> binding::Result<String> {
    Ok(celestial::centisec_to_lonlat_str(
        value,
        character(&positive)?,
        character(&negative)?,
    ))
}

pub fn centisec_to_time_str(
    value: i32,
    separator: String,
    suppress_zero: bool,
) -> binding::Result<String> {
    Ok(celestial::centisec_to_time_str(
        value,
        character(&separator)?,
        suppress_zero,
    ))
}

pub fn coord_transform_with_speed(coords: Vec<f64>, eps: f64) -> binding::Result<Vec<f64>> {
    let coords: [f64; 6] = coords
        .try_into()
        .map_err(|_| binding::Error::from_reason("coords must have 6 elements"))?;
    Ok(celestial::coord_transform_with_speed(coords, Degrees::new(eps)).to_vec())
}

pub fn cs_round_sec(value: i32) -> i64 {
    celestial::cs_round_sec(value)
}

pub fn current_file_data(file_number: i32) -> Option<CurrentFileData> {
    celestial::current_file_data(file_number).map(|data| CurrentFileData {
        path: data.path,
        tfstart: data.tfstart,
        tfend: data.tfend,
        denum: data.denum,
    })
}

pub fn date_conversion(
    year: i32,
    month: i32,
    day: i32,
    hour: f64,
    calendar: u8,
) -> binding::Result<f64> {
    celestial::date_conversion(year, month, day, hour, calendar).map_err(core_error)
}

pub fn default_orb(body1: i32, body2: i32, aspect: f64) -> binding::Result<f64> {
    Ok(celestial::default_orb(
        body_of(body1)?,
        body_of(body2)?,
        aspect,
    ))
}

pub fn deg_to_cs(value: f64) -> i64 {
    celestial::deg_to_cs(value)
}

pub fn deltat_ex(jd: f64, flags: i32) -> binding::Result<f64> {
    celestial::deltat_ex(JulianDay::new(jd), CalcFlags(flags)).map_err(core_error)
}

pub fn diff_cs(first: i32, second: i32) -> i64 {
    celestial::diff_cs(first, second)
}

pub fn diff_cs_signed(first: i32, second: i32) -> i64 {
    celestial::diff_cs_signed(first, second)
}

pub fn diff_rad_signed(first: f64, second: f64) -> f64 {
    celestial::diff_rad_signed(first, second)
}

pub fn gauquelin_sector(
    jd_ut: f64,
    body: i32,
    starname: Option<String>,
    flags: i32,
    method: i32,
    geopos: Vec<f64>,
    pressure: f64,
    temperature: f64,
) -> binding::Result<f64> {
    let geopos: [f64; 3] = geopos
        .try_into()
        .map_err(|_| binding::Error::from_reason("geopos must have 3 elements"))?;
    celestial::gauquelin_sector(
        JulianDay::new(jd_ut),
        body_of(body)?,
        starname.as_deref(),
        CalcFlags(flags),
        method,
        geopos,
        pressure,
        temperature,
    )
    .map_err(core_error)
}

pub fn get_orbital_elements(jd_et: f64, body: i32, flags: i32) -> binding::Result<OrbitalElements> {
    let elements =
        celestial::get_orbital_elements(JulianDay::new(jd_et), body_of(body)?, CalcFlags(flags))
            .map_err(core_error)?;
    Ok(OrbitalElements {
        semi_major_axis: elements.semi_major_axis,
        eccentricity: elements.eccentricity,
        inclination: elements.inclination,
        ascending_node: elements.ascending_node,
        arg_perihelion: elements.arg_perihelion,
        mean_anomaly: elements.mean_anomaly,
        epoch: elements.epoch,
        mean_daily_motion: elements.mean_daily_motion,
        extra: elements.extra,
    })
}

pub fn heliacal_pheno_ut(
    jd_ut: f64,
    geopos: Vec<f64>,
    atmosphere: Vec<f64>,
    observer: Vec<f64>,
    object_name: String,
    event: i32,
    flags: i32,
) -> binding::Result<Vec<f64>> {
    let geopos = array(geopos, "geopos")?;
    let atmosphere = array(atmosphere, "atmosphere")?;
    let observer = array(observer, "observer")?;
    celestial::heliacal_pheno_ut(
        JulianDay::new(jd_ut),
        geopos,
        atmosphere,
        observer,
        &object_name,
        event,
        CalcFlags(flags),
    )
    .map_err(core_error)
}

fn array<const N: usize>(values: Vec<f64>, name: &str) -> binding::Result<[f64; N]> {
    values
        .try_into()
        .map_err(|_| binding::Error::from_reason(format!("{name} must have {N} elements")))
}

pub fn is_applying(signed_separation: f64, relative_speed: f64, aspect: f64) -> bool {
    celestial::is_applying(signed_separation, relative_speed, aspect)
}

pub fn library_path() -> String {
    celestial::library_path()
}

pub fn make_pillar(stem: u8, branch: u8) -> BaZiPillar {
    celestial::make_pillar(stem, branch).into()
}

pub fn midpoint_rad(first: f64, second: f64) -> f64 {
    celestial::midpoint_rad(first, second)
}

pub fn norm_rad(value: f64) -> f64 {
    celestial::norm_rad(value)
}

pub fn orbit_max_min_true_distance(
    jd_et: f64,
    body: i32,
    flags: i32,
) -> binding::Result<OrbitalDistances> {
    let distances = celestial::orbit_max_min_true_distance(
        JulianDay::new(jd_et),
        body_of(body)?,
        CalcFlags(flags),
    )
    .map_err(core_error)?;
    Ok(OrbitalDistances {
        dmax: distances.dmax,
        dmin: distances.dmin,
        dtrue: distances.dtrue,
    })
}

pub fn set_lapse_rate(lapse_rate: f64) {
    celestial::set_lapse_rate(lapse_rate);
}

pub fn set_tid_acc(acceleration: f64) {
    celestial::set_tid_acc(acceleration);
}

pub fn tid_acc() -> f64 {
    celestial::tid_acc()
}

pub fn vis_limit_mag(
    jd_ut: f64,
    geopos: Vec<f64>,
    atmosphere: Vec<f64>,
    observer: Vec<f64>,
    object_name: String,
    flags: i32,
) -> binding::Result<Vec<f64>> {
    let geopos = array(geopos, "geopos")?;
    let atmosphere = array(atmosphere, "atmosphere")?;
    let observer = array(observer, "observer")?;
    celestial::vis_limit_mag(
        JulianDay::new(jd_ut),
        geopos,
        atmosphere,
        observer,
        &object_name,
        flags,
    )
    .map(|values| values.to_vec())
    .map_err(core_error)
}

pub fn wrap_signed_180(value: f64) -> f64 {
    celestial::wrap_signed_180(value)
}

pub(crate) fn timezone_table() -> Vec<crate::native::TzAbbrResult> {
    celestial::TZ_TABLE
        .iter()
        .map(|zone| crate::native::TzAbbrResult {
            name: zone.name.to_owned(),
            desc: zone.desc.to_owned(),
            offset: zone.offset.to_owned(),
            hours: zone.hours,
            minutes: zone.minutes,
        })
        .collect()
}
