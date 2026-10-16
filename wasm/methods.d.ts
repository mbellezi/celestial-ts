/** Core method counterparts. Builders consume their receiver when chaining;
 * retain the returned builder and do not reuse a consumed instance.
 * Raw body/flag/house/unit wrappers use the same primitive representation as
 * the flat API. Unit new/get wrappers preserve the original f64 unchanged.
 * Enum indices follow Rust declaration order:
 * Esbat: Wolf,Snow,Worm,Pink,Flower,Strawberry,Buck,Sturgeon,Harvest,Hunter,Beaver,Cold,Blue.
 * Sabbat: Yule,Imbolc,Ostara,Beltane,Litha,Lughnasadh,Mabon,Samhain.
 * MoonPhase: NewMoon,WaxingCrescent,FirstQuarter,WaxingGibbous,FullMoon,WaningGibbous,LastQuarter,WaningCrescent.
 * PrincipalPhase: NewMoon,FirstQuarter,FullMoon,LastQuarter.
 * SolarCyclePhase: Minimum,Rising,Maximum,Declining.
 * GrandSolarEpoch: SporerMinimum,MaunderMinimum,DaltonMinimum,ModernMaximum.
 * CalcOptions.strategy: 0=Auto,1=Sequential,2=Parallel.
 * Enum and strategy wrappers reject invalid/nonintegral indices.
 */
export interface AspectCheck {
  diff: number;
  speed: number;
  factor: number;
  matched: boolean;
}
