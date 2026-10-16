use celestial_core::{
    set_delta_t_userdef, set_sid_mode, set_topo, Latitude, Longitude, SiderealMode,
};

pub struct ConfigGuard;

impl Drop for ConfigGuard {
    fn drop(&mut self) {
        set_sid_mode(SiderealMode::FAGAN_BRADLEY, 0.0, 0.0);
        set_topo(Longitude::new(0.0), Latitude::new(0.0), 0.0);
        set_delta_t_userdef(f64::NAN);
    }
}
