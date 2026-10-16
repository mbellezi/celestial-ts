<!-- Gerado por scripts/docs.mjs. Não editar manualmente. -->
# Referência da API TypeScript

Baseado na biblioteca original [Celestial](https://github.com/geraldo-netto/celestial), de [geraldo-netto](https://github.com/geraldo-netto). Agradecemos ao autor por disponibilizar o motor de efemérides que fundamenta esta distribuição.

Gerada das declarações emitidas pelo build com a AST do TypeScript. Inclui todos os
exports dos três entrypoints do pacote, suas assinaturas completas, campos e JSDoc
disponível. Os blocos preservam os tipos emitidos; não substituem a documentação
matemática do core Rust. Membros privados/protegidos das classes ficam fora da API.

Consulte [uso, unidades e erros](../wasm/README.md) antes de calcular.

Para atualizar: `npm run build` e `npm run docs`. Para verificar: `npm run docs:check`.
A geração não executa cálculos nem modifica o pacote compilado.

- [Core WASM](#core-wasm): 410 exports.
- [Relatórios coletivos](#relatórios-coletivos): 40 exports e 0 tipos de apoio.
- [Gráficos SVG](#gráficos-svg): 51 exports e 7 tipos de apoio.

`InitOutput` descreve o ABI bruto retornado pela inicialização; os cálculos de
aplicação usam as funções/classes tipadas do módulo, e não esses ponteiros internos.

## Core WASM

Importação: `celestial-wasm`. **410 exports públicos**.

| Categoria | Exports |
| --- | ---: |
| Funções | 346 |
| Classes | 6 |
| Interfaces | 53 |
| Aliases de tipos | 5 |
| Constantes e variáveis | 0 |
| Enumerações | 0 |

### Funções (346)

[`almuten`](#core-almuten) · [`annualProfection`](#core-annualProfection) · [`antiscion`](#core-antiscion) · [`approxHebrewYear`](#core-approxHebrewYear) · [`arabicPart`](#core-arabicPart) · [`arabicPartsSeven`](#core-arabicPartsSeven) · [`ascTransitUt`](#core-ascTransitUt) · [`ayanamsa`](#core-ayanamsa) · [`ayanamsaEx`](#core-ayanamsaEx) · [`ayanamsaExUt`](#core-ayanamsaExUt) · [`ayanamsaName`](#core-ayanamsaName) · [`ayanamsaUt`](#core-ayanamsaUt) · [`azalt`](#core-azalt) · [`azaltRev`](#core-azaltRev) · [`bahaiHolyDays`](#core-bahaiHolyDays) · [`bestTimeMethod`](#core-bestTimeMethod) · [`bodyAsRaw`](#core-bodyAsRaw) · [`bodyFromRaw`](#core-bodyFromRaw) · [`bodyIngressSearchWindow`](#core-bodyIngressSearchWindow) · [`bodyIsKnownId`](#core-bodyIsKnownId) · [`bodyIsNode`](#core-bodyIsNode) · [`bodyIsPlanet`](#core-bodyIsPlanet) · [`bodyName`](#core-bodyName) · [`bodyOrbWeight`](#core-bodyOrbWeight) · [`bodyRetrogradeSearchWindow`](#core-bodyRetrogradeSearchWindow) · [`bodyTryFromRaw`](#core-bodyTryFromRaw) · [`calc`](#core-calc) · [`calcChartAspects`](#core-calcChartAspects) · [`calcChartAspectsAuto`](#core-calcChartAspectsAuto) · [`calcFlagsAsRaw`](#core-calcFlagsAsRaw) · [`calcFlagsIsSidereal`](#core-calcFlagsIsSidereal) · [`calcFlagsIsSpeed`](#core-calcFlagsIsSpeed) · [`calcMany`](#core-calcMany) · [`calcPctr`](#core-calcPctr) · [`calcUt`](#core-calcUt) · [`calcUtMany`](#core-calcUtMany) · [`calendarAsRaw`](#core-calendarAsRaw) · [`calendarRound`](#core-calendarRound) · [`centisecToDegStr`](#core-centisecToDegStr) · [`centisecToLonlatStr`](#core-centisecToLonlatStr) · [`centisecToTimeStr`](#core-centisecToTimeStr) · [`christianFeasts`](#core-christianFeasts) · [`christianFixedFeasts`](#core-christianFixedFeasts) · [`close`](#core-close) · [`constants`](#core-constants) · [`coordTransform`](#core-coordTransform) · [`coordTransformWithSpeed`](#core-coordTransformWithSpeed) · [`copticMonthDays`](#core-copticMonthDays) · [`copticToJd`](#core-copticToJd) · [`csRoundSec`](#core-csRoundSec) · [`currentFileData`](#core-currentFileData) · [`cycleNickname`](#core-cycleNickname) · [`dateConversion`](#core-dateConversion) · [`dayOfWeek`](#core-dayOfWeek) · [`dayOfYear`](#core-dayOfYear) · [`daysInHebrewYear`](#core-daysInHebrewYear) · [`decanRuler`](#core-decanRuler) · [`default`](#core-default) · [`defaultOrb`](#core-defaultOrb) · [`degMidp`](#core-degMidp) · [`degToCs`](#core-degToCs) · [`degnorm`](#core-degnorm) · [`degreesGet`](#core-degreesGet) · [`degreesNew`](#core-degreesNew) · [`degsplit`](#core-degsplit) · [`deltat`](#core-deltat) · [`deltatEx`](#core-deltatEx) · [`difdeg2n`](#core-difdeg2n) · [`diffCs`](#core-diffCs) · [`diffCsSigned`](#core-diffCsSigned) · [`diffDeg`](#core-diffDeg) · [`diffDegSigned`](#core-diffDegSigned) · [`diffRadSigned`](#core-diffRadSigned) · [`distanceToMc`](#core-distanceToMc) · [`dscTransitUt`](#core-dscTransitUt) · [`easterGregorian`](#core-easterGregorian) · [`easterJd`](#core-easterJd) · [`easterJulian`](#core-easterJulian) · [`easterOrthodox`](#core-easterOrthodox) · [`easterOrthodoxJd`](#core-easterOrthodoxJd) · [`egyptianDecan`](#core-egyptianDecan) · [`egyptianTermsRuler`](#core-egyptianTermsRuler) · [`elapsedDays`](#core-elapsedDays) · [`esbatAltNames`](#core-esbatAltNames) · [`esbatDisplayName`](#core-esbatDisplayName) · [`esbatsForYear`](#core-esbatsForYear) · [`ethiopicToJd`](#core-ethiopicToJd) · [`fasliNowruzJd`](#core-fasliNowruzJd) · [`firdaria`](#core-firdaria) · [`fixstar`](#core-fixstar) · [`fixstar2`](#core-fixstar2) · [`fixstar2Mag`](#core-fixstar2Mag) · [`fixstar2Ut`](#core-fixstar2Ut) · [`fixstarMag`](#core-fixstarMag) · [`fixstarUt`](#core-fixstarUt) · [`formatCoord`](#core-formatCoord) · [`fourPillars`](#core-fourPillars) · [`fullDignity`](#core-fullDignity) · [`gauquelinSector`](#core-gauquelinSector) · [`geoToDms`](#core-geoToDms) · [`getOrbitalElements`](#core-getOrbitalElements) · [`grandSolarEpoch`](#core-grandSolarEpoch) · [`grandSolarEpochName`](#core-grandSolarEpochName) · [`gregorianToHijriYears`](#core-gregorianToHijriYears) · [`gregorianToSolarHijri`](#core-gregorianToSolarHijri) · [`haab`](#core-haab) · [`hebrewMonthDays`](#core-hebrewMonthDays) · [`hebrewMonthStartJd`](#core-hebrewMonthStartJd) · [`hebrewNewYearJd`](#core-hebrewNewYearJd) · [`hebrewYearFromJd`](#core-hebrewYearFromJd) · [`heliacalPhenoUt`](#core-heliacalPhenoUt) · [`heliacalUt`](#core-heliacalUt) · [`helioCross`](#core-helioCross) · [`helioCrossUt`](#core-helioCrossUt) · [`hijriFromJd`](#core-hijriFromJd) · [`hijriMonthDays`](#core-hijriMonthDays) · [`hijriMonthName`](#core-hijriMonthName) · [`hijriMonthStartJd`](#core-hijriMonthStartJd) · [`hijriNewYearJd`](#core-hijriNewYearJd) · [`hijriToJd`](#core-hijriToJd) · [`hinduFestivals`](#core-hinduFestivals) · [`houseName`](#core-houseName) · [`housePos`](#core-housePos) · [`houseSystemAsRaw`](#core-houseSystemAsRaw) · [`houseSystemChar`](#core-houseSystemChar) · [`houseSystemId`](#core-houseSystemId) · [`houseSystemName`](#core-houseSystemName) · [`houses`](#core-houses) · [`housesArmc`](#core-housesArmc) · [`housesArmcEx2`](#core-housesArmcEx2) · [`housesEx`](#core-housesEx) · [`housesEx2`](#core-housesEx2) · [`housesFromArmc`](#core-housesFromArmc) · [`icTransitUt`](#core-icTransitUt) · [`initSync`](#core-initSync) · [`isApplying`](#core-isApplying) · [`isBahaiLeapYear`](#core-isBahaiLeapYear) · [`isCopticLeapYear`](#core-isCopticLeapYear) · [`isDayChart`](#core-isDayChart) · [`isHebrewLeapYear`](#core-isHebrewLeapYear) · [`isHijriLeapYear`](#core-isHijriLeapYear) · [`islamicObservances`](#core-islamicObservances) · [`islamicObservancesForJd`](#core-islamicObservancesForJd) · [`isoWeek`](#core-isoWeek) · [`jdDuration`](#core-jdDuration) · [`jdEtToUtc`](#core-jdEtToUtc) · [`jdToBahai`](#core-jdToBahai) · [`jdToCoptic`](#core-jdToCoptic) · [`jdToEthiopic`](#core-jdToEthiopic) · [`jdToFasli`](#core-jdToFasli) · [`jdToHebrewDate`](#core-jdToHebrewDate) · [`jdToIsoString`](#core-jdToIsoString) · [`jdUtToUtc`](#core-jdUtToUtc) · [`jdnow`](#core-jdnow) · [`jewishHolidayJd`](#core-jewishHolidayJd) · [`jewishHolidays`](#core-jewishHolidays) · [`julday`](#core-julday) · [`julianDayGet`](#core-julianDayGet) · [`julianDayNew`](#core-julianDayNew) · [`karanaName`](#core-karanaName) · [`latToLmt`](#core-latToLmt) · [`latitudeGet`](#core-latitudeGet) · [`latitudeNew`](#core-latitudeNew) · [`libraryPath`](#core-libraryPath) · [`lmtToLat`](#core-lmtToLat) · [`localApparentSolarTime`](#core-localApparentSolarTime) · [`lonToSign`](#core-lonToSign) · [`longToNakshatra`](#core-longToNakshatra) · [`longToNavamsa`](#core-longToNavamsa) · [`longToRasi`](#core-longToRasi) · [`longitudeGet`](#core-longitudeGet) · [`longitudeNew`](#core-longitudeNew) · [`losarJd`](#core-losarJd) · [`lowerMeridianTransitUt`](#core-lowerMeridianTransitUt) · [`lunEclipseHow`](#core-lunEclipseHow) · [`lunEclipseWhen`](#core-lunEclipseWhen) · [`lunEclipseWhenLoc`](#core-lunEclipseWhenLoc) · [`lunOccultWhenGlob`](#core-lunOccultWhenGlob) · [`lunOccultWhenLoc`](#core-lunOccultWhenLoc) · [`lunOccultWhere`](#core-lunOccultWhere) · [`lunarReturnJd`](#core-lunarReturnJd) · [`makePillar`](#core-makePillar) · [`matchAspect`](#core-matchAspect) · [`matchAspect2`](#core-matchAspect2) · [`matchAspect3`](#core-matchAspect3) · [`matchAspect4`](#core-matchAspect4) · [`mayaLongCount`](#core-mayaLongCount) · [`mayaLongCountStr`](#core-mayaLongCountStr) · [`mcTransitUt`](#core-mcTransitUt) · [`meanObliquity`](#core-meanObliquity) · [`meanSiderealTimeDeg`](#core-meanSiderealTimeDeg) · [`meanSidtime`](#core-meanSidtime) · [`medicineWheelTotem`](#core-medicineWheelTotem) · [`meridianTransitUt`](#core-meridianTransitUt) · [`midpoint`](#core-midpoint) · [`midpointRad`](#core-midpointRad) · [`midpointTable`](#core-midpointTable) · [`monthlyProfection`](#core-monthlyProfection) · [`monthsInHebrewYear`](#core-monthsInHebrewYear) · [`moonElongation`](#core-moonElongation) · [`moonIllumination`](#core-moonIllumination) · [`moonPhase`](#core-moonPhase) · [`moonPhaseAngle`](#core-moonPhaseAngle) · [`moonPhaseInfo`](#core-moonPhaseInfo) · [`moonPhaseName`](#core-moonPhaseName) · [`moonPhaseTargetElongation`](#core-moonPhaseTargetElongation) · [`moonPhasesForMonth`](#core-moonPhasesForMonth) · [`mooncross`](#core-mooncross) · [`mooncrossBackUt`](#core-mooncrossBackUt) · [`mooncrossNode`](#core-mooncrossNode) · [`mooncrossNodeUt`](#core-mooncrossNodeUt) · [`mooncrossUt`](#core-mooncrossUt) · [`naisargakaRelation`](#core-naisargakaRelation) · [`nakshatraName`](#core-nakshatraName) · [`nawRuzJd`](#core-nawRuzJd) · [`nextAspect`](#core-nextAspect) · [`nextAspect2`](#core-nextAspect2) · [`nextAspectCusp`](#core-nextAspectCusp) · [`nextAspectCusp2`](#core-nextAspectCusp2) · [`nextAspectWith`](#core-nextAspectWith) · [`nextAspectWith2`](#core-nextAspectWith2) · [`nextEsbat`](#core-nextEsbat) · [`nextFirstQuarter`](#core-nextFirstQuarter) · [`nextFullMoon`](#core-nextFullMoon) · [`nextFullMoonAfter`](#core-nextFullMoonAfter) · [`nextFullMoonPhase`](#core-nextFullMoonPhase) · [`nextLastQuarter`](#core-nextLastQuarter) · [`nextNewMoon`](#core-nextNewMoon) · [`nextNewMoonAfter`](#core-nextNewMoonAfter) · [`nextPrincipalPhase`](#core-nextPrincipalPhase) · [`nextRetro`](#core-nextRetro) · [`nextSabbat`](#core-nextSabbat) · [`nextSabbatName`](#core-nextSabbatName) · [`nodAps`](#core-nodAps) · [`nodApsUt`](#core-nodApsUt) · [`normCs`](#core-normCs) · [`normDeg`](#core-normDeg) · [`normRad`](#core-normRad) · [`nowruzJd`](#core-nowruzJd) · [`nutation`](#core-nutation) · [`ochchabala`](#core-ochchabala) · [`omerDayJd`](#core-omerDayJd) · [`omerDays`](#core-omerDays) · [`omerDeclaration`](#core-omerDeclaration) · [`omerFromJd`](#core-omerFromJd) · [`omerPeriod`](#core-omerPeriod) · [`omerStartJd`](#core-omerStartJd) · [`orbitMaxMinTrueDistance`](#core-orbitMaxMinTrueDistance) · [`panchanga`](#core-panchanga) · [`parallacticAngle`](#core-parallacticAngle) · [`parseCoord`](#core-parseCoord) · [`parseDatetime`](#core-parseDatetime) · [`parseTime`](#core-parseTime) · [`pheno`](#core-pheno) · [`phenoUt`](#core-phenoUt) · [`planetConjunctMc`](#core-planetConjunctMc) · [`planetHouseNumber`](#core-planetHouseNumber) · [`planetName`](#core-planetName) · [`planetOnMidpoint`](#core-planetOnMidpoint) · [`principalPhaseElongationTarget`](#core-principalPhaseElongationTarget) · [`principalPhaseName`](#core-principalPhaseName) · [`ramanHouses`](#core-ramanHouses) · [`rasiDiff`](#core-rasiDiff) · [`rasiDiff2`](#core-rasiDiff2) · [`rasiNorm`](#core-rasiNorm) · [`refrac`](#core-refrac) · [`refracExtended`](#core-refracExtended) · [`residentialStrength`](#core-residentialStrength) · [`retrogradeStationUt`](#core-retrogradeStationUt) · [`revjul`](#core-revjul) · [`revjulHms`](#core-revjulHms) · [`riseTrans`](#core-riseTrans) · [`riseTransTrueHor`](#core-riseTransTrueHor) · [`sabbatAllByLongitude`](#core-sabbatAllByLongitude) · [`sabbatAltNames`](#core-sabbatAltNames) · [`sabbatIsCrossQuarter`](#core-sabbatIsCrossQuarter) · [`sabbatIsQuarterDay`](#core-sabbatIsQuarterDay) · [`sabbatJd`](#core-sabbatJd) · [`sabbatName`](#core-sabbatName) · [`sabbatSolarLongitude`](#core-sabbatSolarLongitude) · [`sabbatsForYear`](#core-sabbatsForYear) · [`sameSect`](#core-sameSect) · [`saturnFourStars`](#core-saturnFourStars) · [`secondaryProgressions`](#core-secondaryProgressions) · [`setDeltaTUserdef`](#core-setDeltaTUserdef) · [`setEphePath`](#core-setEphePath) · [`setJplFile`](#core-setJplFile) · [`setLapseRate`](#core-setLapseRate) · [`setSidMode`](#core-setSidMode) · [`setTidAcc`](#core-setTidAcc) · [`setTopo`](#core-setTopo) · [`sexagenaryName`](#core-sexagenaryName) · [`siderealModeAsRaw`](#core-siderealModeAsRaw) · [`siderealModeFlag`](#core-siderealModeFlag) · [`siderealModeId`](#core-siderealModeId) · [`siderealModeName`](#core-siderealModeName) · [`siderealTimeDeg`](#core-siderealTimeDeg) · [`sidtime`](#core-sidtime) · [`sidtime0`](#core-sidtime0) · [`signExaltation`](#core-signExaltation) · [`signIngressUt`](#core-signIngressUt) · [`signLord`](#core-signLord) · [`signName`](#core-signName) · [`signRuler`](#core-signRuler) · [`signRulerModern`](#core-signRulerModern) · [`solEclipseHow`](#core-solEclipseHow) · [`solEclipseWhenGlob`](#core-solEclipseWhenGlob) · [`solEclipseWhenLoc`](#core-solEclipseWhenLoc) · [`solEclipseWhere`](#core-solEclipseWhere) · [`solarArcDirections`](#core-solarArcDirections) · [`solarCycle`](#core-solarCycle) · [`solarCyclePhaseName`](#core-solarCyclePhaseName) · [`solarHijriToGregorian`](#core-solarHijriToGregorian) · [`solarReturnJd`](#core-solarReturnJd) · [`solarTermPosition`](#core-solarTermPosition) · [`solcross`](#core-solcross) · [`solcrossBackUt`](#core-solcrossBackUt) · [`solcrossUt`](#core-solcrossUt) · [`splitDeg`](#core-splitDeg) · [`tatkalikaRelation`](#core-tatkalikaRelation) · [`tibetanYearName`](#core-tibetanYearName) · [`tidAcc`](#core-tidAcc) · [`timeEqu`](#core-timeEqu) · [`tonalpohualli`](#core-tonalpohualli) · [`transitToDegree`](#core-transitToDegree) · [`triplicityRulers`](#core-triplicityRulers) · [`trueObliquity`](#core-trueObliquity) · [`tryPanchanga`](#core-tryPanchanga) · [`ttToUt`](#core-ttToUt) · [`tzAbbrFind`](#core-tzAbbrFind) · [`tzolkin`](#core-tzolkin) · [`uposathaDays`](#core-uposathaDays) · [`utcTimeZone`](#core-utcTimeZone) · [`utcToJd`](#core-utcToJd) · [`version`](#core-version) · [`vesakJd`](#core-vesakJd) · [`vietnameseChineseBoundaryDiffers`](#core-vietnameseChineseBoundaryDiffers) · [`vietnameseMonthStartJd`](#core-vietnameseMonthStartJd) · [`vimshottariDasha`](#core-vimshottariDasha) · [`visLimitMag`](#core-visLimitMag) · [`weeksInIsoYear`](#core-weeksInIsoYear) · [`wrapSigned180`](#core-wrapSigned180) · [`xiuhpohualli`](#core-xiuhpohualli) · [`yallopQ`](#core-yallopQ) · [`yearsDiff`](#core-yearsDiff) · [`zodiacSignName`](#core-zodiacSignName)

<a id="core-almuten"></a>

#### `almuten`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function almuten(lon: number, isDay: boolean): Array<number>;
```

<a id="core-annualProfection"></a>

#### `annualProfection`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function annualProfection(cusps: Array<number>, age: number): Array<number>;
```

<a id="core-antiscion"></a>

#### `antiscion`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function antiscion(pos: Array<number>, axis: number): Antiscion;
```

<a id="core-approxHebrewYear"></a>

#### `approxHebrewYear`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function approxHebrewYear(jd: number): number;
```

<a id="core-arabicPart"></a>

#### `arabicPart`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function arabicPart(asc: number, body2: number, body1: number): number;
```

<a id="core-arabicPartsSeven"></a>

#### `arabicPartsSeven`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function arabicPartsSeven(asc: number, sun: number, moon: number, sat: number, mar: number, jup: number, mer: number, ven: number, isDay: boolean): Array<ArabicPartResult>;
```

<a id="core-ascTransitUt"></a>

#### `ascTransitUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function ascTransitUt(planet: number, jdNatal: number, jdStart: number, lat: number, lon: number, hsys: number, flags: number, backward: boolean): number;
```

<a id="core-ayanamsa"></a>

#### `ayanamsa`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function ayanamsa(jdEt: number): number;
```

<a id="core-ayanamsaEx"></a>

#### `ayanamsaEx`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function ayanamsaEx(jdEt: number, flags: number): number;
```

<a id="core-ayanamsaExUt"></a>

#### `ayanamsaExUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function ayanamsaExUt(jdUt: number, flags: number): number;
```

<a id="core-ayanamsaName"></a>

#### `ayanamsaName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function ayanamsaName(sidMode: number): string;
```

<a id="core-ayanamsaUt"></a>

#### `ayanamsaUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function ayanamsaUt(jdUt: number): number;
```

<a id="core-azalt"></a>

#### `azalt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function azalt(tjdut: number, calcFlag: number, geopos: Array<number>, pressureMb: number, tempC: number, xin: Array<number>): AzAlt;
```

<a id="core-azaltRev"></a>

#### `azaltRev`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function azaltRev(tjdut: number, calcFlag: number, geopos: Array<number>, az: number, alt: number): Array<number>;
```

<a id="core-bahaiHolyDays"></a>

#### `bahaiHolyDays`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function bahaiHolyDays(bahaiYear: number): Array<BahaiHolyDay>;
```

<a id="core-bestTimeMethod"></a>

#### `bestTimeMethod`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function bestTimeMethod(jdSunset: number, jdMoonset: number): number;
```

<a id="core-bodyAsRaw"></a>

#### `bodyAsRaw`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function bodyAsRaw(value: number): number;
```

<a id="core-bodyFromRaw"></a>

#### `bodyFromRaw`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function bodyFromRaw(value: number): number;
```

<a id="core-bodyIngressSearchWindow"></a>

#### `bodyIngressSearchWindow`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function bodyIngressSearchWindow(value: number): number;
```

<a id="core-bodyIsKnownId"></a>

#### `bodyIsKnownId`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function bodyIsKnownId(value: number): boolean;
```

<a id="core-bodyIsNode"></a>

#### `bodyIsNode`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function bodyIsNode(value: number): boolean;
```

<a id="core-bodyIsPlanet"></a>

#### `bodyIsPlanet`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function bodyIsPlanet(value: number): boolean;
```

<a id="core-bodyName"></a>

#### `bodyName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function bodyName(value: number): string;
```

<a id="core-bodyOrbWeight"></a>

#### `bodyOrbWeight`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function bodyOrbWeight(value: number): number;
```

<a id="core-bodyRetrogradeSearchWindow"></a>

#### `bodyRetrogradeSearchWindow`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function bodyRetrogradeSearchWindow(value: number): number;
```

<a id="core-bodyTryFromRaw"></a>

#### `bodyTryFromRaw`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function bodyTryFromRaw(value: number): number;
```

<a id="core-calc"></a>

#### `calc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function calc(tjdet: number, planet: number, flags: number): PlanetPos;
```

<a id="core-calcChartAspects"></a>

#### `calcChartAspects`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function calcChartAspects(positions: Array<number>, aspects: Array<number>, orb: number): Array<Array<number>>;
```

<a id="core-calcChartAspectsAuto"></a>

#### `calcChartAspectsAuto`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function calcChartAspectsAuto(positions: Array<number>, aspects: Array<number>): Array<Array<number>>;
```

<a id="core-calcFlagsAsRaw"></a>

#### `calcFlagsAsRaw`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function calcFlagsAsRaw(value: number): number;
```

<a id="core-calcFlagsIsSidereal"></a>

#### `calcFlagsIsSidereal`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function calcFlagsIsSidereal(value: number): boolean;
```

<a id="core-calcFlagsIsSpeed"></a>

#### `calcFlagsIsSpeed`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function calcFlagsIsSpeed(value: number): boolean;
```

<a id="core-calcMany"></a>

#### `calcMany`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function calcMany(tjdet: number, planets: Array<number>, flags: number): Array<CalcResult>;
```

<a id="core-calcPctr"></a>

#### `calcPctr`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function calcPctr(tjdet: number, planet: number, center: number, flags: number): PlanetPos;
```

<a id="core-calcUt"></a>

#### `calcUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function calcUt(tjdut: number, planet: number, flags: number): PlanetPos;
```

<a id="core-calcUtMany"></a>

#### `calcUtMany`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function calcUtMany(tjdut: number, planets: Array<number>, flags: number): Array<CalcResult>;
```

<a id="core-calendarAsRaw"></a>

#### `calendarAsRaw`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function calendarAsRaw(value: number): number;
```

<a id="core-calendarRound"></a>

#### `calendarRound`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function calendarRound(jd: number): Array<string>;
```

<a id="core-centisecToDegStr"></a>

#### `centisecToDegStr`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function centisecToDegStr(value: number): string;
```

<a id="core-centisecToLonlatStr"></a>

#### `centisecToLonlatStr`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function centisecToLonlatStr(value: number, positive: string, negative: string): string;
```

<a id="core-centisecToTimeStr"></a>

#### `centisecToTimeStr`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function centisecToTimeStr(value: number, separator: string, suppressZero: boolean): string;
```

<a id="core-christianFeasts"></a>

#### `christianFeasts`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function christianFeasts(year: number): Array<ChristianFeast>;
```

<a id="core-christianFixedFeasts"></a>

#### `christianFixedFeasts`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function christianFixedFeasts(year: number): Array<ChristianFeast>;
```

<a id="core-close"></a>

#### `close`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function close(): void;
```

<a id="core-constants"></a>

#### `constants`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function constants(): CoreConstants;
```

<a id="core-coordTransform"></a>

#### `coordTransform`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function coordTransform(coord: Array<number>, eps: number): Array<number>;
```

<a id="core-coordTransformWithSpeed"></a>

#### `coordTransformWithSpeed`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function coordTransformWithSpeed(coords: Array<number>, eps: number): Array<number>;
```

<a id="core-copticMonthDays"></a>

#### `copticMonthDays`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function copticMonthDays(year: number, month: number): number;
```

<a id="core-copticToJd"></a>

#### `copticToJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function copticToJd(year: number, month: number, day: number): number;
```

<a id="core-csRoundSec"></a>

#### `csRoundSec`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function csRoundSec(value: number): bigint;
```

<a id="core-currentFileData"></a>

#### `currentFileData`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function currentFileData(fileNumber: number): CurrentFileData | null;
```

<a id="core-cycleNickname"></a>

#### `cycleNickname`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function cycleNickname(n: number): string | null;
```

<a id="core-dateConversion"></a>

#### `dateConversion`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function dateConversion(year: number, month: number, day: number, hour: number, calendar: number): number;
```

<a id="core-dayOfWeek"></a>

#### `dayOfWeek`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function dayOfWeek(jd: number): number;
```

<a id="core-dayOfYear"></a>

#### `dayOfYear`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function dayOfYear(year: number, month: number, day: number): number;
```

<a id="core-daysInHebrewYear"></a>

#### `daysInHebrewYear`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function daysInHebrewYear(year: number): number;
```

<a id="core-decanRuler"></a>

#### `decanRuler`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function decanRuler(lon: number): number;
```

<a id="core-default"></a>

#### `default`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(module_or_path?: {
    module_or_path: InitInput | Promise<InitInput>;
} | InitInput | Promise<InitInput>): Promise<InitOutput>;
```

<a id="core-defaultOrb"></a>

#### `defaultOrb`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function defaultOrb(body1: number, body2: number, aspect: number): number;
```

<a id="core-degMidp"></a>

#### `degMidp`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function degMidp(x1: number, x0: number): number;
```

<a id="core-degToCs"></a>

#### `degToCs`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function degToCs(value: number): bigint;
```

<a id="core-degnorm"></a>

#### `degnorm`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function degnorm(d: number): number;
```

<a id="core-degreesGet"></a>

#### `degreesGet`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function degreesGet(value: number): number;
```

<a id="core-degreesNew"></a>

#### `degreesNew`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function degreesNew(value: number): number;
```

<a id="core-degsplit"></a>

#### `degsplit`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function degsplit(pos: number): Array<number>;
```

<a id="core-deltat"></a>

#### `deltat`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function deltat(tjd: number): number;
```

<a id="core-deltatEx"></a>

#### `deltatEx`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function deltatEx(jd: number, flags: number): number;
```

<a id="core-difdeg2n"></a>

#### `difdeg2n`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function difdeg2n(p1: number, p2: number): number;
```

<a id="core-diffCs"></a>

#### `diffCs`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function diffCs(first: number, second: number): bigint;
```

<a id="core-diffCsSigned"></a>

#### `diffCsSigned`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function diffCsSigned(first: number, second: number): bigint;
```

<a id="core-diffDeg"></a>

#### `diffDeg`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function diffDeg(p1: number, p2: number): number;
```

<a id="core-diffDegSigned"></a>

#### `diffDegSigned`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function diffDegSigned(p1: number, p2: number): number;
```

<a id="core-diffRadSigned"></a>

#### `diffRadSigned`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function diffRadSigned(first: number, second: number): number;
```

<a id="core-distanceToMc"></a>

#### `distanceToMc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function distanceToMc(planetLon: number, mcLon: number): number;
```

<a id="core-dscTransitUt"></a>

#### `dscTransitUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function dscTransitUt(planet: number, jdNatal: number, jdStart: number, lat: number, lon: number, hsys: number, flags: number, backward: boolean): number;
```

<a id="core-easterGregorian"></a>

#### `easterGregorian`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function easterGregorian(year: number): CalendarDate;
```

<a id="core-easterJd"></a>

#### `easterJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function easterJd(year: number): number;
```

<a id="core-easterJulian"></a>

#### `easterJulian`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function easterJulian(year: number): Array<number>;
```

<a id="core-easterOrthodox"></a>

#### `easterOrthodox`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function easterOrthodox(year: number): CalendarDate;
```

<a id="core-easterOrthodoxJd"></a>

#### `easterOrthodoxJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function easterOrthodoxJd(year: number): number;
```

<a id="core-egyptianDecan"></a>

#### `egyptianDecan`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function egyptianDecan(lon: number): Array<string>;
```

<a id="core-egyptianTermsRuler"></a>

#### `egyptianTermsRuler`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function egyptianTermsRuler(lon: number): number;
```

<a id="core-elapsedDays"></a>

#### `elapsedDays`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function elapsedDays(year: number): bigint;
```

<a id="core-esbatAltNames"></a>

#### `esbatAltNames`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function esbatAltNames(index: number): Array<string>;
```

<a id="core-esbatDisplayName"></a>

#### `esbatDisplayName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function esbatDisplayName(index: number): string;
```

<a id="core-esbatsForYear"></a>

#### `esbatsForYear`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function esbatsForYear(year: number): Array<Esbat>;
```

<a id="core-ethiopicToJd"></a>

#### `ethiopicToJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function ethiopicToJd(year: number, month: number, day: number): number;
```

<a id="core-fasliNowruzJd"></a>

#### `fasliNowruzJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function fasliNowruzJd(year: number): number | null;
```

<a id="core-firdaria"></a>

#### `firdaria`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function firdaria(jdBirth: number, isDay: boolean, spanYears: number): Array<Array<number>>;
```

<a id="core-fixstar"></a>

#### `fixstar`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function fixstar(star: string, tjdet: number, flags: number): StarPos;
```

<a id="core-fixstar2"></a>

#### `fixstar2`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function fixstar2(star: string, tjdet: number, flags: number): StarPos;
```

<a id="core-fixstar2Mag"></a>

#### `fixstar2Mag`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function fixstar2Mag(star: string): number;
```

<a id="core-fixstar2Ut"></a>

#### `fixstar2Ut`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function fixstar2Ut(star: string, tjdut: number, flags: number): StarPos;
```

<a id="core-fixstarMag"></a>

#### `fixstarMag`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function fixstarMag(star: string): number;
```

<a id="core-fixstarUt"></a>

#### `fixstarUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function fixstarUt(star: string, tjdut: number, flags: number): StarPos;
```

<a id="core-formatCoord"></a>

#### `formatCoord`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function formatCoord(coord: number, isLatitude: boolean): string | null;
```

<a id="core-fourPillars"></a>

#### `fourPillars`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function fourPillars(jdUt: number, hourUt: number, sunLon: number): Array<BaZiPillar>;
```

<a id="core-fullDignity"></a>

#### `fullDignity`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function fullDignity(bodyRaw: number, lon: number, isDay: boolean): Array<string | number>;
```

<a id="core-gauquelinSector"></a>

#### `gauquelinSector`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function gauquelinSector(jdUt: number, body: number, starname: string | null | undefined, flags: number, method: number, geopos: Array<number>, pressure: number, temperature: number): number;
```

<a id="core-geoToDms"></a>

#### `geoToDms`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function geoToDms(coord: number): Array<number>;
```

<a id="core-getOrbitalElements"></a>

#### `getOrbitalElements`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function getOrbitalElements(jdEt: number, body: number, flags: number): OrbitalElements;
```

<a id="core-grandSolarEpoch"></a>

#### `grandSolarEpoch`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function grandSolarEpoch(jd: number): string | null;
```

<a id="core-grandSolarEpochName"></a>

#### `grandSolarEpochName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function grandSolarEpochName(index: number): string;
```

<a id="core-gregorianToHijriYears"></a>

#### `gregorianToHijriYears`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function gregorianToHijriYears(gregorianYear: number): HijriYears;
```

<a id="core-gregorianToSolarHijri"></a>

#### `gregorianToSolarHijri`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function gregorianToSolarHijri(year: number): number;
```

<a id="core-haab"></a>

#### `haab`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function haab(jd: number): Array<string>;
```

<a id="core-hebrewMonthDays"></a>

#### `hebrewMonthDays`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function hebrewMonthDays(year: number, month: number): number;
```

<a id="core-hebrewMonthStartJd"></a>

#### `hebrewMonthStartJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function hebrewMonthStartJd(year: number, month: number): number;
```

<a id="core-hebrewNewYearJd"></a>

#### `hebrewNewYearJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function hebrewNewYearJd(year: number): number;
```

<a id="core-hebrewYearFromJd"></a>

#### `hebrewYearFromJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function hebrewYearFromJd(jd: number): number;
```

<a id="core-heliacalPhenoUt"></a>

#### `heliacalPhenoUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function heliacalPhenoUt(jdUt: number, geopos: Array<number>, atmosphere: Array<number>, observer: Array<number>, objectName: string, event: number, flags: number): Array<number>;
```

<a id="core-heliacalUt"></a>

#### `heliacalUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function heliacalUt(jdStart: number, dgeo: Array<number>, datm: Array<number>, dobs: Array<number>, objectname: string, typeEvent: number, flags: number): Array<number>;
```

<a id="core-helioCross"></a>

#### `helioCross`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function helioCross(body: number, x2cross: number, jdEt: number, flags: number, dir: number): number;
```

<a id="core-helioCrossUt"></a>

#### `helioCrossUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function helioCrossUt(body: number, x2cross: number, jdUt: number, flags: number, dir: number): number;
```

<a id="core-hijriFromJd"></a>

#### `hijriFromJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function hijriFromJd(jd: number): HijriDate;
```

<a id="core-hijriMonthDays"></a>

#### `hijriMonthDays`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function hijriMonthDays(year: number, month: number): number;
```

<a id="core-hijriMonthName"></a>

#### `hijriMonthName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function hijriMonthName(month: number): string;
```

<a id="core-hijriMonthStartJd"></a>

#### `hijriMonthStartJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function hijriMonthStartJd(year: number, month: number): number;
```

<a id="core-hijriNewYearJd"></a>

#### `hijriNewYearJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function hijriNewYearJd(year: number): number;
```

<a id="core-hijriToJd"></a>

#### `hijriToJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function hijriToJd(year: number, month: number, day: number): number;
```

<a id="core-hinduFestivals"></a>

#### `hinduFestivals`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function hinduFestivals(gregorianYear: number): Array<HinduFestival>;
```

<a id="core-houseName"></a>

#### `houseName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function houseName(hsys: number): string;
```

<a id="core-housePos"></a>

#### `housePos`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function housePos(armc: number, lat: number, eps: number, hsys: number, lon: number, latBody: number): number;
```

<a id="core-houseSystemAsRaw"></a>

#### `houseSystemAsRaw`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function houseSystemAsRaw(value: number): number;
```

<a id="core-houseSystemChar"></a>

#### `houseSystemChar`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function houseSystemChar(id: number): number | null;
```

<a id="core-houseSystemId"></a>

#### `houseSystemId`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function houseSystemId(hsys: number): number | null;
```

<a id="core-houseSystemName"></a>

#### `houseSystemName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function houseSystemName(value: number): string;
```

<a id="core-houses"></a>

#### `houses`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function houses(tjdut: number, lat: number, lon: number, hsys: number): HouseResult;
```

<a id="core-housesArmc"></a>

#### `housesArmc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function housesArmc(armc: number, lat: number, eps: number, hsys: number): HouseResult;
```

<a id="core-housesArmcEx2"></a>

#### `housesArmcEx2`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function housesArmcEx2(armc: number, lat: number, eps: number, hsys: number): HouseResultEx2;
```

<a id="core-housesEx"></a>

#### `housesEx`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function housesEx(tjdut: number, lat: number, lon: number, hsys: number, flags?: number | null | undefined): HouseResult;
```

<a id="core-housesEx2"></a>

#### `housesEx2`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function housesEx2(tjdut: number, lat: number, lon: number, hsys: number, flags?: number | null | undefined): HouseResultEx2;
```

<a id="core-housesFromArmc"></a>

#### `housesFromArmc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function housesFromArmc(armc: number, lat: number, eps: number, hsys: number): HouseResult;
```

<a id="core-icTransitUt"></a>

#### `icTransitUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function icTransitUt(planet: number, jdNatal: number, jdStart: number, lat: number, lon: number, hsys: number, flags: number, backward: boolean): number;
```

<a id="core-initSync"></a>

#### `initSync`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: {
    module: SyncInitInput;
} | SyncInitInput): InitOutput;
```

<a id="core-isApplying"></a>

#### `isApplying`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function isApplying(signedSeparation: number, relativeSpeed: number, aspect: number): boolean;
```

<a id="core-isBahaiLeapYear"></a>

#### `isBahaiLeapYear`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function isBahaiLeapYear(bahaiYear: number): boolean;
```

<a id="core-isCopticLeapYear"></a>

#### `isCopticLeapYear`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function isCopticLeapYear(year: number): boolean;
```

<a id="core-isDayChart"></a>

#### `isDayChart`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function isDayChart(sunLon: number, cusps: Array<number>): boolean;
```

<a id="core-isHebrewLeapYear"></a>

#### `isHebrewLeapYear`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function isHebrewLeapYear(year: number): boolean;
```

<a id="core-isHijriLeapYear"></a>

#### `isHijriLeapYear`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function isHijriLeapYear(year: number): boolean;
```

<a id="core-islamicObservances"></a>

#### `islamicObservances`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function islamicObservances(hijriYear: number): Array<IslamicObservance>;
```

<a id="core-islamicObservancesForJd"></a>

#### `islamicObservancesForJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function islamicObservancesForJd(jd: number): Array<IslamicObservance>;
```

<a id="core-isoWeek"></a>

#### `isoWeek`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function isoWeek(jd: number): Array<number>;
```

<a id="core-jdDuration"></a>

#### `jdDuration`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function jdDuration(jdStart: number, jdEnd: number): Array<number>;
```

<a id="core-jdEtToUtc"></a>

#### `jdEtToUtc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function jdEtToUtc(jdEt: number, calendar: number): Array<number>;
```

<a id="core-jdToBahai"></a>

#### `jdToBahai`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function jdToBahai(jd: number): BahaiDate;
```

<a id="core-jdToCoptic"></a>

#### `jdToCoptic`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function jdToCoptic(jd: number): Array<number>;
```

<a id="core-jdToEthiopic"></a>

#### `jdToEthiopic`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function jdToEthiopic(jd: number): Array<number>;
```

<a id="core-jdToFasli"></a>

#### `jdToFasli`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function jdToFasli(jd: number): Array<number> | null;
```

<a id="core-jdToHebrewDate"></a>

#### `jdToHebrewDate`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function jdToHebrewDate(jd: number): HebrewDate;
```

<a id="core-jdToIsoString"></a>

#### `jdToIsoString`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function jdToIsoString(jd: number, calendar: number): string;
```

<a id="core-jdUtToUtc"></a>

#### `jdUtToUtc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function jdUtToUtc(jdUt: number, calendar: number): Array<number>;
```

<a id="core-jdnow"></a>

#### `jdnow`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function jdnow(): number;
```

<a id="core-jewishHolidayJd"></a>

#### `jewishHolidayJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function jewishHolidayJd(hebrewYear: number, name: string): number | null;
```

<a id="core-jewishHolidays"></a>

#### `jewishHolidays`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function jewishHolidays(hebrewYear: number): Array<JewishHoliday>;
```

<a id="core-julday"></a>

#### `julday`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function julday(year: number, month: number, day: number, hour?: number | null | undefined, calendar?: number | null | undefined): number;
```

<a id="core-julianDayGet"></a>

#### `julianDayGet`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function julianDayGet(value: number): number;
```

<a id="core-julianDayNew"></a>

#### `julianDayNew`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function julianDayNew(value: number): number;
```

<a id="core-karanaName"></a>

#### `karanaName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function karanaName(karana: number): string;
```

<a id="core-latToLmt"></a>

#### `latToLmt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function latToLmt(tjdLat: number, geolon: number): number;
```

<a id="core-latitudeGet"></a>

#### `latitudeGet`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function latitudeGet(value: number): number;
```

<a id="core-latitudeNew"></a>

#### `latitudeNew`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function latitudeNew(value: number): number;
```

<a id="core-libraryPath"></a>

#### `libraryPath`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function libraryPath(): string;
```

<a id="core-lmtToLat"></a>

#### `lmtToLat`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function lmtToLat(tjdLmt: number, geolon: number): number;
```

<a id="core-localApparentSolarTime"></a>

#### `localApparentSolarTime`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function localApparentSolarTime(jdUt: number, geolonDeg: number): number;
```

<a id="core-lonToSign"></a>

#### `lonToSign`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function lonToSign(lon: number): Array<number>;
```

<a id="core-longToNakshatra"></a>

#### `longToNakshatra`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function longToNakshatra(lon: number): Array<number>;
```

<a id="core-longToNavamsa"></a>

#### `longToNavamsa`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function longToNavamsa(lon: number): number;
```

<a id="core-longToRasi"></a>

#### `longToRasi`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function longToRasi(lon: number): number;
```

<a id="core-longitudeGet"></a>

#### `longitudeGet`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function longitudeGet(value: number): number;
```

<a id="core-longitudeNew"></a>

#### `longitudeNew`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function longitudeNew(value: number): number;
```

<a id="core-losarJd"></a>

#### `losarJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function losarJd(year: number): number | null;
```

<a id="core-lowerMeridianTransitUt"></a>

#### `lowerMeridianTransitUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function lowerMeridianTransitUt(body: number, jdStart: number, geopos: Array<number>, flags: number): RiseTrans;
```

<a id="core-lunEclipseHow"></a>

#### `lunEclipseHow`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function lunEclipseHow(jdUt: number, geopos: Array<number> | null | undefined, flags: number): EclipseHow;
```

<a id="core-lunEclipseWhen"></a>

#### `lunEclipseWhen`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function lunEclipseWhen(tjdStart: number, flags: number, eclType?: number | null | undefined, backwards?: boolean | null | undefined): EclipseResult;
```

<a id="core-lunEclipseWhenLoc"></a>

#### `lunEclipseWhenLoc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function lunEclipseWhenLoc(tjdStart: number, geopos: Array<number>, flags: number, backwards: boolean): EclipseResultAttr;
```

<a id="core-lunOccultWhenGlob"></a>

#### `lunOccultWhenGlob`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function lunOccultWhenGlob(tjdStart: number, body: number, starname: string, flags: number, eclType: number, backwards: boolean): EclipseResult;
```

<a id="core-lunOccultWhenLoc"></a>

#### `lunOccultWhenLoc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function lunOccultWhenLoc(tjdStart: number, body: number, starname: string, flags: number, geopos: Array<number>, backwards: boolean): EclipseResultAttr;
```

<a id="core-lunOccultWhere"></a>

#### `lunOccultWhere`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function lunOccultWhere(jdUt: number, body: number, starname: string, flags: number): EclipseWhere;
```

<a id="core-lunarReturnJd"></a>

#### `lunarReturnJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function lunarReturnJd(jdNatal: number, jdStart: number, flags: number): number;
```

<a id="core-makePillar"></a>

#### `makePillar`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function makePillar(stem: number, branch: number): BaZiPillar;
```

<a id="core-matchAspect"></a>

#### `matchAspect`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function matchAspect(pos0: number, speed0: number, pos1: number, speed1: number, aspect: number, orb: number): Array<number>;
```

<a id="core-matchAspect2"></a>

#### `matchAspect2`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function matchAspect2(pos0: number, speed0: number, pos1: number, speed1: number, aspect: number, orb: number): Array<number>;
```

<a id="core-matchAspect3"></a>

#### `matchAspect3`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function matchAspect3(pos0: number, speed0: number, pos1: number, speed1: number, aspect: number, appOrb: number, sepOrb: number, defOrb: number): Array<number>;
```

<a id="core-matchAspect4"></a>

#### `matchAspect4`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function matchAspect4(pos0: number, speed0: number, pos1: number, speed1: number, aspect: number, appOrb: number, sepOrb: number, defOrb: number): Array<number>;
```

<a id="core-mayaLongCount"></a>

#### `mayaLongCount`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function mayaLongCount(jd: number): Array<number>;
```

<a id="core-mayaLongCountStr"></a>

#### `mayaLongCountStr`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function mayaLongCountStr(jd: number): string;
```

<a id="core-mcTransitUt"></a>

#### `mcTransitUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function mcTransitUt(planet: number, jdNatal: number, jdStart: number, lat: number, lon: number, hsys: number, flags: number, backward: boolean): number;
```

<a id="core-meanObliquity"></a>

#### `meanObliquity`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function meanObliquity(jde: number): number;
```

<a id="core-meanSiderealTimeDeg"></a>

#### `meanSiderealTimeDeg`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function meanSiderealTimeDeg(jdUt: number): number;
```

<a id="core-meanSidtime"></a>

#### `meanSidtime`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function meanSidtime(jd: number): number;
```

<a id="core-medicineWheelTotem"></a>

#### `medicineWheelTotem`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function medicineWheelTotem(sunLon: number): Array<string>;
```

<a id="core-meridianTransitUt"></a>

#### `meridianTransitUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function meridianTransitUt(body: number, jdStart: number, geopos: Array<number>, flags: number): RiseTrans;
```

<a id="core-midpoint"></a>

#### `midpoint`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function midpoint(lon1: number, lon2: number): number;
```

<a id="core-midpointRad"></a>

#### `midpointRad`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function midpointRad(first: number, second: number): number;
```

<a id="core-midpointTable"></a>

#### `midpointTable`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function midpointTable(positions: Array<number>, orb: number): Array<MidpointEntry>;
```

<a id="core-monthlyProfection"></a>

#### `monthlyProfection`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function monthlyProfection(cusps: Array<number>, ageYears: number, ageMonths: number): Array<number>;
```

<a id="core-monthsInHebrewYear"></a>

#### `monthsInHebrewYear`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function monthsInHebrewYear(year: number): number;
```

<a id="core-moonElongation"></a>

#### `moonElongation`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function moonElongation(jd: number): number;
```

<a id="core-moonIllumination"></a>

#### `moonIllumination`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function moonIllumination(jd: number): number;
```

<a id="core-moonPhase"></a>

#### `moonPhase`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function moonPhase(jd: number): string;
```

<a id="core-moonPhaseAngle"></a>

#### `moonPhaseAngle`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function moonPhaseAngle(jd: number): number;
```

<a id="core-moonPhaseInfo"></a>

#### `moonPhaseInfo`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function moonPhaseInfo(jd: number): MoonPhaseInfo;
```

<a id="core-moonPhaseName"></a>

#### `moonPhaseName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function moonPhaseName(index: number): string;
```

<a id="core-moonPhaseTargetElongation"></a>

#### `moonPhaseTargetElongation`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function moonPhaseTargetElongation(index: number): number;
```

<a id="core-moonPhasesForMonth"></a>

#### `moonPhasesForMonth`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function moonPhasesForMonth(year: number, month: number): Array<PhaseEvent>;
```

<a id="core-mooncross"></a>

#### `mooncross`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function mooncross(x2cross: number, jdEt: number, flags: number): number;
```

<a id="core-mooncrossBackUt"></a>

#### `mooncrossBackUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function mooncrossBackUt(x2cross: number, jdUt: number, flags: number): number;
```

<a id="core-mooncrossNode"></a>

#### `mooncrossNode`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function mooncrossNode(jdEt: number, flags: number): MoonCrossNodeResult;
```

<a id="core-mooncrossNodeUt"></a>

#### `mooncrossNodeUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function mooncrossNodeUt(jdUt: number, flags: number): MoonCrossNodeResult;
```

<a id="core-mooncrossUt"></a>

#### `mooncrossUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function mooncrossUt(x2cross: number, jdUt: number, flags: number): number;
```

<a id="core-naisargakaRelation"></a>

#### `naisargakaRelation`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function naisargakaRelation(gr1: number, gr2: number): number;
```

<a id="core-nakshatraName"></a>

#### `nakshatraName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nakshatraName(nak: number): string | null;
```

<a id="core-nawRuzJd"></a>

#### `nawRuzJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nawRuzJd(bahaiYear: number): number;
```

<a id="core-nextAspect"></a>

#### `nextAspect`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextAspect(planet: number, aspect: number, fixedPt: number, jdStart: number, backward: boolean, stopDays: number, flags: number): Array<number> | null;
```

<a id="core-nextAspect2"></a>

#### `nextAspect2`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextAspect2(planet: number, aspect: number, fixedPt: number, jdStart: number, backward: boolean, stopDays: number, flags: number): Array<number> | null;
```

<a id="core-nextAspectCusp"></a>

#### `nextAspectCusp`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextAspectCusp(body: number, aspect: number, cusp: number, jdStart: number, lat: number, lon: number, hsys: number, backward: boolean, flags: number): AspectCuspResult | null;
```

<a id="core-nextAspectCusp2"></a>

#### `nextAspectCusp2`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextAspectCusp2(body: number, aspect: number, cusp: number, jdStart: number, lat: number, lon: number, hsys: number, backward: boolean, flags: number): AspectCuspResult | null;
```

<a id="core-nextAspectWith"></a>

#### `nextAspectWith`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextAspectWith(planet: number, aspect: number, other: number, jdStart: number, backward: boolean, stopDays: number, flags: number): Array<number> | null;
```

<a id="core-nextAspectWith2"></a>

#### `nextAspectWith2`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextAspectWith2(planet: number, aspect: number, other: number, jdStart: number, backward: boolean, stopDays: number, flags: number): Array<number> | null;
```

<a id="core-nextEsbat"></a>

#### `nextEsbat`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextEsbat(jdFrom: number): Esbat;
```

<a id="core-nextFirstQuarter"></a>

#### `nextFirstQuarter`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextFirstQuarter(jdFrom: number): number;
```

<a id="core-nextFullMoon"></a>

#### `nextFullMoon`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextFullMoon(jdStart: number): number;
```

<a id="core-nextFullMoonAfter"></a>

#### `nextFullMoonAfter`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextFullMoonAfter(jdStart: number): number;
```

<a id="core-nextFullMoonPhase"></a>

#### `nextFullMoonPhase`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextFullMoonPhase(jdFrom: number): number;
```

<a id="core-nextLastQuarter"></a>

#### `nextLastQuarter`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextLastQuarter(jdFrom: number): number;
```

<a id="core-nextNewMoon"></a>

#### `nextNewMoon`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextNewMoon(jdFrom: number): number;
```

<a id="core-nextNewMoonAfter"></a>

#### `nextNewMoonAfter`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextNewMoonAfter(jdStart: number): number;
```

<a id="core-nextPrincipalPhase"></a>

#### `nextPrincipalPhase`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextPrincipalPhase(jdFrom: number, phase: number): PhaseEvent;
```

<a id="core-nextRetro"></a>

#### `nextRetro`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextRetro(planet: number, jdStart: number, backward: boolean, stopDays: number, flags: number): Array<number> | null;
```

<a id="core-nextSabbat"></a>

#### `nextSabbat`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextSabbat(jdFrom: number): Sabbat;
```

<a id="core-nextSabbatName"></a>

#### `nextSabbatName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nextSabbatName(jdFrom: number): string;
```

<a id="core-nodAps"></a>

#### `nodAps`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nodAps(jdEt: number, body: number, flags: number, method: number): Array<number>;
```

<a id="core-nodApsUt"></a>

#### `nodApsUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nodApsUt(jdUt: number, body: number, flags: number, method: number): Array<number>;
```

<a id="core-normCs"></a>

#### `normCs`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function normCs(p: number): number;
```

<a id="core-normDeg"></a>

#### `normDeg`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function normDeg(x: number): number;
```

<a id="core-normRad"></a>

#### `normRad`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function normRad(value: number): number;
```

<a id="core-nowruzJd"></a>

#### `nowruzJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nowruzJd(year: number): number;
```

<a id="core-nutation"></a>

#### `nutation`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function nutation(jde: number): Array<number>;
```

<a id="core-ochchabala"></a>

#### `ochchabala`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function ochchabala(graha: number, sputha: number): number;
```

<a id="core-omerDayJd"></a>

#### `omerDayJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function omerDayJd(hebrewYear: number, day: number): number | null;
```

<a id="core-omerDays"></a>

#### `omerDays`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function omerDays(hebrewYear: number): Array<OmerDay>;
```

<a id="core-omerDeclaration"></a>

#### `omerDeclaration`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function omerDeclaration(day: number): string;
```

<a id="core-omerFromJd"></a>

#### `omerFromJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function omerFromJd(jd: number): OmerDay | null;
```

<a id="core-omerPeriod"></a>

#### `omerPeriod`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function omerPeriod(jd: number): OmerPeriod;
```

<a id="core-omerStartJd"></a>

#### `omerStartJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function omerStartJd(hebrewYear: number): number;
```

<a id="core-orbitMaxMinTrueDistance"></a>

#### `orbitMaxMinTrueDistance`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function orbitMaxMinTrueDistance(jdEt: number, body: number, flags: number): OrbitalDistances;
```

<a id="core-panchanga"></a>

#### `panchanga`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function panchanga(jd: number): Panchanga;
```

<a id="core-parallacticAngle"></a>

#### `parallacticAngle`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function parallacticAngle(haDeg: number, decDeg: number, latDeg: number): number;
```

<a id="core-parseCoord"></a>

#### `parseCoord`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function parseCoord(s: string): number | null;
```

<a id="core-parseDatetime"></a>

#### `parseDatetime`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function parseDatetime(s: string): Array<number> | null;
```

<a id="core-parseTime"></a>

#### `parseTime`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function parseTime(s: string): Array<number> | null;
```

<a id="core-pheno"></a>

#### `pheno`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function pheno(jdEt: number, body: number, flags: number): Array<number>;
```

<a id="core-phenoUt"></a>

#### `phenoUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function phenoUt(jdUt: number, body: number, flags: number): Array<number>;
```

<a id="core-planetConjunctMc"></a>

#### `planetConjunctMc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function planetConjunctMc(planetLon: number, mcLon: number, orb: number): boolean;
```

<a id="core-planetHouseNumber"></a>

#### `planetHouseNumber`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function planetHouseNumber(planetLon: number, cusps: Array<number>): number;
```

<a id="core-planetName"></a>

#### `planetName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function planetName(planet: number): string;
```

<a id="core-planetOnMidpoint"></a>

#### `planetOnMidpoint`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function planetOnMidpoint(planetLon: number, midLon: number, orb: number): number | null;
```

<a id="core-principalPhaseElongationTarget"></a>

#### `principalPhaseElongationTarget`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function principalPhaseElongationTarget(index: number): number;
```

<a id="core-principalPhaseName"></a>

#### `principalPhaseName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function principalPhaseName(index: number): string;
```

<a id="core-ramanHouses"></a>

#### `ramanHouses`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function ramanHouses(asc: number, mc: number, sandhi: boolean): Array<number>;
```

<a id="core-rasiDiff"></a>

#### `rasiDiff`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function rasiDiff(r1: number, r2: number): number;
```

<a id="core-rasiDiff2"></a>

#### `rasiDiff2`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function rasiDiff2(r1: number, r2: number): number;
```

<a id="core-rasiNorm"></a>

#### `rasiNorm`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function rasiNorm(r: number): number;
```

<a id="core-refrac"></a>

#### `refrac`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function refrac(altitude: number, pressureMb: number, tempC: number, calcFlag: number): number;
```

<a id="core-refracExtended"></a>

#### `refracExtended`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function refracExtended(altitude: number, geoalt: number, pressureMb: number, tempC: number, lapseRate: number, calcFlag: number): RefracExt;
```

<a id="core-residentialStrength"></a>

#### `residentialStrength`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function residentialStrength(graha: number, bm: Array<number>): number;
```

<a id="core-retrogradeStationUt"></a>

#### `retrogradeStationUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function retrogradeStationUt(planet: number, jd: number, flags: number): Stations;
```

<a id="core-revjul"></a>

#### `revjul`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function revjul(jd: number, calendar?: number | null | undefined): CalDate;
```

<a id="core-revjulHms"></a>

#### `revjulHms`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function revjulHms(jd: number, calendar: number): Array<number>;
```

<a id="core-riseTrans"></a>

#### `riseTrans`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function riseTrans(tjdut: number, planet: number, epheFlags: number, eventType: number, geopos: Array<number>, pressureMb?: number | null | undefined, tempC?: number | null | undefined): RiseTrans;
```

<a id="core-riseTransTrueHor"></a>

#### `riseTransTrueHor`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function riseTransTrueHor(tjdut: number, planet: number, flags: number, eventType: number, geopos: Array<number>, pressureMb: number, tempC: number, horhgt: number): RiseTrans;
```

<a id="core-sabbatAllByLongitude"></a>

#### `sabbatAllByLongitude`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function sabbatAllByLongitude(): Uint32Array;
```

<a id="core-sabbatAltNames"></a>

#### `sabbatAltNames`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function sabbatAltNames(index: number): Array<string>;
```

<a id="core-sabbatIsCrossQuarter"></a>

#### `sabbatIsCrossQuarter`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function sabbatIsCrossQuarter(index: number): boolean;
```

<a id="core-sabbatIsQuarterDay"></a>

#### `sabbatIsQuarterDay`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function sabbatIsQuarterDay(index: number): boolean;
```

<a id="core-sabbatJd"></a>

#### `sabbatJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function sabbatJd(year: number, kind: string): number;
```

<a id="core-sabbatName"></a>

#### `sabbatName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function sabbatName(index: number): string;
```

<a id="core-sabbatSolarLongitude"></a>

#### `sabbatSolarLongitude`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function sabbatSolarLongitude(index: number): number;
```

<a id="core-sabbatsForYear"></a>

#### `sabbatsForYear`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function sabbatsForYear(year: number): Array<Sabbat>;
```

<a id="core-sameSect"></a>

#### `sameSect`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function sameSect(body: number, isDay: boolean): boolean;
```

<a id="core-saturnFourStars"></a>

#### `saturnFourStars`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function saturnFourStars(jd: number, flags: number): Array<number>;
```

<a id="core-secondaryProgressions"></a>

#### `secondaryProgressions`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function secondaryProgressions(jdNatal: number, years: number, bodies: Array<number>, lat: number, lon: number, hsys: number, flags: number): SecondaryProgressionsResult;
```

<a id="core-setDeltaTUserdef"></a>

#### `setDeltaTUserdef`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function setDeltaTUserdef(dt: number): void;
```

<a id="core-setEphePath"></a>

#### `setEphePath`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function setEphePath(path: string): void;
```

<a id="core-setJplFile"></a>

#### `setJplFile`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function setJplFile(fname: string): void;
```

<a id="core-setLapseRate"></a>

#### `setLapseRate`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function setLapseRate(lapseRate: number): void;
```

<a id="core-setSidMode"></a>

#### `setSidMode`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function setSidMode(sidMode: number, t0?: number | null | undefined, ayanT0?: number | null | undefined): void;
```

<a id="core-setTidAcc"></a>

#### `setTidAcc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function setTidAcc(acceleration: number): void;
```

<a id="core-setTopo"></a>

#### `setTopo`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function setTopo(geolon: number, geolat: number, geoalt: number): void;
```

<a id="core-sexagenaryName"></a>

#### `sexagenaryName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function sexagenaryName(cycleIndex: number): Array<string>;
```

<a id="core-siderealModeAsRaw"></a>

#### `siderealModeAsRaw`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function siderealModeAsRaw(value: number): number;
```

<a id="core-siderealModeFlag"></a>

#### `siderealModeFlag`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function siderealModeFlag(sidmode: number): number | null;
```

<a id="core-siderealModeId"></a>

#### `siderealModeId`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function siderealModeId(flag: number): number | null;
```

<a id="core-siderealModeName"></a>

#### `siderealModeName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function siderealModeName(value: number): string;
```

<a id="core-siderealTimeDeg"></a>

#### `siderealTimeDeg`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function siderealTimeDeg(jdUt: number): number;
```

<a id="core-sidtime"></a>

#### `sidtime`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function sidtime(jdUt: number): number;
```

<a id="core-sidtime0"></a>

#### `sidtime0`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function sidtime0(jdUt: number, eps: number, nut: number): number;
```

<a id="core-signExaltation"></a>

#### `signExaltation`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function signExaltation(body: number): number;
```

<a id="core-signIngressUt"></a>

#### `signIngressUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function signIngressUt(planet: number, jd: number, flags: number, backward: boolean): IngressResult;
```

<a id="core-signLord"></a>

#### `signLord`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function signLord(sign: number): number | null;
```

<a id="core-signName"></a>

#### `signName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function signName(sign: number): string | null;
```

<a id="core-signRuler"></a>

#### `signRuler`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function signRuler(sign: number): number;
```

<a id="core-signRulerModern"></a>

#### `signRulerModern`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function signRulerModern(sign: number): number;
```

<a id="core-solEclipseHow"></a>

#### `solEclipseHow`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function solEclipseHow(jdUt: number, geopos: Array<number>, flags: number): EclipseHow;
```

<a id="core-solEclipseWhenGlob"></a>

#### `solEclipseWhenGlob`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function solEclipseWhenGlob(tjdStart: number, flags: number, eclType?: number | null | undefined, backwards?: boolean | null | undefined): EclipseResult;
```

<a id="core-solEclipseWhenLoc"></a>

#### `solEclipseWhenLoc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function solEclipseWhenLoc(tjdStart: number, geopos: Array<number>, flags: number, backwards?: boolean | null | undefined): EclipseResultAttr;
```

<a id="core-solEclipseWhere"></a>

#### `solEclipseWhere`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function solEclipseWhere(tjd: number, flags: number): EclipseWhere;
```

<a id="core-solarArcDirections"></a>

#### `solarArcDirections`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function solarArcDirections(jdNatal: number, years: number, natalPositions: Array<number>, natalMc: number, flags: number): Array<number>;
```

<a id="core-solarCycle"></a>

#### `solarCycle`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function solarCycle(jd: number): SolarCycleInfo | null;
```

<a id="core-solarCyclePhaseName"></a>

#### `solarCyclePhaseName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function solarCyclePhaseName(index: number): string;
```

<a id="core-solarHijriToGregorian"></a>

#### `solarHijriToGregorian`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function solarHijriToGregorian(solarHijriYear: number): number;
```

<a id="core-solarReturnJd"></a>

#### `solarReturnJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function solarReturnJd(jdNatal: number, returnYear: number, flags: number): number;
```

<a id="core-solarTermPosition"></a>

#### `solarTermPosition`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function solarTermPosition(sunLon: number): Array<number>;
```

<a id="core-solcross"></a>

#### `solcross`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function solcross(x2cross: number, jdEt: number, flags: number): number;
```

<a id="core-solcrossBackUt"></a>

#### `solcrossBackUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function solcrossBackUt(x2cross: number, jdUt: number, flags: number): number;
```

<a id="core-solcrossUt"></a>

#### `solcrossUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function solcrossUt(x2cross: number, jdUt: number, flags: number): number;
```

<a id="core-splitDeg"></a>

#### `splitDeg`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function splitDeg(deg: number, roundFlag: number): Array<number>;
```

<a id="core-tatkalikaRelation"></a>

#### `tatkalikaRelation`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function tatkalikaRelation(r1: number, r2: number): number;
```

<a id="core-tibetanYearName"></a>

#### `tibetanYearName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function tibetanYearName(year: number): Array<string>;
```

<a id="core-tidAcc"></a>

#### `tidAcc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function tidAcc(): number;
```

<a id="core-timeEqu"></a>

#### `timeEqu`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function timeEqu(jdUt: number): number;
```

<a id="core-tonalpohualli"></a>

#### `tonalpohualli`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function tonalpohualli(jd: number): Array<string>;
```

<a id="core-transitToDegree"></a>

#### `transitToDegree`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function transitToDegree(planet: number, targetLon: number, jd: number, flags: number, backward: boolean): number;
```

<a id="core-triplicityRulers"></a>

#### `triplicityRulers`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function triplicityRulers(lon: number): Array<number>;
```

<a id="core-trueObliquity"></a>

#### `trueObliquity`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function trueObliquity(jde: number): number;
```

<a id="core-tryPanchanga"></a>

#### `tryPanchanga`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function tryPanchanga(jd: number): Panchanga;
```

<a id="core-ttToUt"></a>

#### `ttToUt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function ttToUt(jde: number): number;
```

<a id="core-tzAbbrFind"></a>

#### `tzAbbrFind`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function tzAbbrFind(abbr: string): Array<TzAbbrResult>;
```

<a id="core-tzolkin"></a>

#### `tzolkin`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function tzolkin(jd: number): Array<string>;
```

<a id="core-uposathaDays"></a>

#### `uposathaDays`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function uposathaDays(year: number): Array<Uposatha>;
```

<a id="core-utcTimeZone"></a>

#### `utcTimeZone`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function utcTimeZone(year: number, month: number, day: number, hour: number, minute: number, second: number, dTimezone: number): Array<number>;
```

<a id="core-utcToJd"></a>

#### `utcToJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function utcToJd(date: UtcDate, calendar?: number | null | undefined): JdPair;
```

<a id="core-version"></a>

#### `version`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function version(): string;
```

<a id="core-vesakJd"></a>

#### `vesakJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function vesakJd(year: number): number;
```

<a id="core-vietnameseChineseBoundaryDiffers"></a>

#### `vietnameseChineseBoundaryDiffers`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function vietnameseChineseBoundaryDiffers(jdUt: number): boolean;
```

<a id="core-vietnameseMonthStartJd"></a>

#### `vietnameseMonthStartJd`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function vietnameseMonthStartJd(jdUt: number): number | null;
```

<a id="core-vimshottariDasha"></a>

#### `vimshottariDasha`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function vimshottariDasha(jdBirth: number, moonLonSidereal: number, yearsAhead: number): Array<Array<number>>;
```

<a id="core-visLimitMag"></a>

#### `visLimitMag`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function visLimitMag(jdUt: number, geopos: Array<number>, atmosphere: Array<number>, observer: Array<number>, objectName: string, flags: number): Array<number>;
```

<a id="core-weeksInIsoYear"></a>

#### `weeksInIsoYear`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function weeksInIsoYear(year: number): number;
```

<a id="core-wrapSigned180"></a>

#### `wrapSigned180`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function wrapSigned180(value: number): number;
```

<a id="core-xiuhpohualli"></a>

#### `xiuhpohualli`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function xiuhpohualli(jd: number): Array<string>;
```

<a id="core-yallopQ"></a>

#### `yallopQ`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function yallopQ(arcvDeg: number, arclDeg: number, sdArcmin: number): Array<number>;
```

<a id="core-yearsDiff"></a>

#### `yearsDiff`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function yearsDiff(jd1: number, jd2: number, flags: number): number;
```

<a id="core-zodiacSignName"></a>

#### `zodiacSignName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export function zodiacSignName(sign: number): string;
```

### Classes (6)

[`AspectOrbs`](#core-AspectOrbs) · [`CalcOptions`](#core-CalcOptions) · [`MultiCalc`](#core-MultiCalc) · [`RiseTransOptions`](#core-RiseTransOptions) · [`SearchOptions`](#core-SearchOptions) · [`SingleCalc`](#core-SingleCalc)

<a id="core-AspectOrbs"></a>

#### `AspectOrbs`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export class AspectOrbs {
    free(): void;
    [Symbol.dispose](): void;
    checkSimple(pos0: number, speed0: number, pos1: number, speed1: number, aspect: number): AspectCheck;
    check(pos0: number, speed0: number, pos1: number, speed1: number, aspect: number): AspectCheck;
    defOrb(orb: number): AspectOrbs;
    constructor(app_orb: number, sep_orb: number);
}
```

<a id="core-CalcOptions"></a>

#### `CalcOptions`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export class CalcOptions {
    free(): void;
    [Symbol.dispose](): void;
    bodies(bodies: Array<number>): MultiCalc;
    body(body: number): SingleCalc;
    strategy(strategy: number): CalcOptions;
    static tt(jd: number, flags: number): CalcOptions;
    static ut(jd: number, flags: number): CalcOptions;
}
```

<a id="core-MultiCalc"></a>

#### `MultiCalc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export class MultiCalc {
    free(): void;
    [Symbol.dispose](): void;
    getMany(): Array<CalcResult>;
}
```

<a id="core-RiseTransOptions"></a>

#### `RiseTransOptions`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export class RiseTransOptions {
    free(): void;
    [Symbol.dispose](): void;
    atmosphere(pressure_mb: number, temp_c: number): RiseTransOptions;
    event(event: number): RiseTransOptions;
    flags(flags: number): RiseTransOptions;
    horizonHeight(height: number): RiseTransOptions;
    constructor(jd: number, body: number, geopos: Float64Array);
    search(): RiseTrans;
    star(name: string): RiseTransOptions;
}
```

<a id="core-SearchOptions"></a>

#### `SearchOptions`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export class SearchOptions {
    free(): void;
    [Symbol.dispose](): void;
    aspect(degrees: number): SearchOptions;
    backward(back: boolean): SearchOptions;
    cusp(cusp: number, lat: number, lon: number, hsys: number): SearchOptions;
    flags(flags: number): SearchOptions;
    natalChart(jd: number, lat: number, lon: number, hsys: number): SearchOptions;
    constructor(body: number, jd_start: number);
    searchAscTransit(): number;
    searchCusp(): AspectCuspResult | null;
    searchDscTransit(): number;
    searchIcTransit(): number;
    searchMcTransit(): number;
}
```

<a id="core-SingleCalc"></a>

#### `SingleCalc`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export class SingleCalc {
    free(): void;
    [Symbol.dispose](): void;
    get(): PlanetPos;
}
```

### Interfaces (53)

[`Antiscion`](#core-Antiscion) · [`ArabicPartResult`](#core-ArabicPartResult) · [`AspectCheck`](#core-AspectCheck) · [`AspectCuspResult`](#core-AspectCuspResult) · [`AzAlt`](#core-AzAlt) · [`BaZiPillar`](#core-BaZiPillar) · [`BahaiDate`](#core-BahaiDate) · [`BahaiHolyDay`](#core-BahaiHolyDay) · [`CalDate`](#core-CalDate) · [`CalendarDate`](#core-CalendarDate) · [`CelestialError`](#core-CelestialError) · [`ChristianFeast`](#core-ChristianFeast) · [`CoreConstants`](#core-CoreConstants) · [`CurrentFileData`](#core-CurrentFileData) · [`EclipseHow`](#core-EclipseHow) · [`EclipseResult`](#core-EclipseResult) · [`EclipseResultAttr`](#core-EclipseResultAttr) · [`EclipseWhere`](#core-EclipseWhere) · [`ErrorDetails`](#core-ErrorDetails) · [`Esbat`](#core-Esbat) · [`HebrewDate`](#core-HebrewDate) · [`HijriDate`](#core-HijriDate) · [`HijriYears`](#core-HijriYears) · [`HinduFestival`](#core-HinduFestival) · [`HouseResult`](#core-HouseResult) · [`HouseResultEx2`](#core-HouseResultEx2) · [`IngressResult`](#core-IngressResult) · [`InitOutput`](#core-InitOutput) · [`IslamicObservance`](#core-IslamicObservance) · [`JdPair`](#core-JdPair) · [`JewishHoliday`](#core-JewishHoliday) · [`MidpointEntry`](#core-MidpointEntry) · [`MidpointPlanet`](#core-MidpointPlanet) · [`MoonCrossNodeResult`](#core-MoonCrossNodeResult) · [`MoonPhaseInfo`](#core-MoonPhaseInfo) · [`OmerDay`](#core-OmerDay) · [`OmerPeriod`](#core-OmerPeriod) · [`OrbitalDistances`](#core-OrbitalDistances) · [`OrbitalElements`](#core-OrbitalElements) · [`Panchanga`](#core-Panchanga) · [`PhaseEvent`](#core-PhaseEvent) · [`PlanetPos`](#core-PlanetPos) · [`ProgressedPosition`](#core-ProgressedPosition) · [`RefracExt`](#core-RefracExt) · [`RiseTrans`](#core-RiseTrans) · [`Sabbat`](#core-Sabbat) · [`SecondaryProgressionsResult`](#core-SecondaryProgressionsResult) · [`SolarCycleInfo`](#core-SolarCycleInfo) · [`StarPos`](#core-StarPos) · [`Stations`](#core-Stations) · [`TzAbbrResult`](#core-TzAbbrResult) · [`Uposatha`](#core-Uposatha) · [`UtcDate`](#core-UtcDate)

<a id="core-Antiscion"></a>

#### `Antiscion`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface Antiscion {
    antiscion: Array<number>;
    contrantiscion: Array<number>;
}
```

<a id="core-ArabicPartResult"></a>

#### `ArabicPartResult`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface ArabicPartResult {
    name: string;
    formula: string;
    degree: number;
}
```

<a id="core-AspectCheck"></a>

#### `AspectCheck`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
/* tslint:disable */
/* eslint-disable */
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
```

<a id="core-AspectCuspResult"></a>

#### `AspectCuspResult`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface AspectCuspResult {
    jd: number;
    pos: Array<number>;
    cusps: Array<number>;
    ascmc: Array<number>;
}
```

<a id="core-AzAlt"></a>

#### `AzAlt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface AzAlt {
    azimuth: number;
    trueAlt: number;
    apparentAlt: number;
}
```

<a id="core-BaZiPillar"></a>

#### `BaZiPillar`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface BaZiPillar {
    stem: number;
    branch: number;
    stemName: string;
    branchName: string;
    animal: string;
    stemElement: string;
    branchElement: string;
    yang: boolean;
}
```

<a id="core-BahaiDate"></a>

#### `BahaiDate`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface BahaiDate {
    year: number;
    month: number;
    day: number;
    monthName: string;
    jd: number;
}
```

<a id="core-BahaiHolyDay"></a>

#### `BahaiHolyDay`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface BahaiHolyDay {
    name: string;
    description: string;
    bahaiMonth: number;
    bahaiDay: number;
    jd: number;
}
```

<a id="core-CalDate"></a>

#### `CalDate`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface CalDate {
    year: number;
    month: number;
    day: number;
    hour: number;
}
```

<a id="core-CalendarDate"></a>

#### `CalendarDate`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface CalendarDate {
    year: number;
    month: number;
    day: number;
}
```

<a id="core-CelestialError"></a>

#### `CelestialError`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface CelestialError {
    kind: string;
    details: ErrorDetails;
    message: string;
}
```

<a id="core-ChristianFeast"></a>

#### `ChristianFeast`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface ChristianFeast {
    name: string;
    easterOffset: number;
    jd: number;
    year: number;
    month: number;
    day: number;
}
```

<a id="core-CoreConstants"></a>

#### `CoreConstants`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface CoreConstants {
    readonly ACRONYCHAL_RISING: number;
    readonly ACRONYCHAL_SETTING: number;
    readonly ADMETOS: number;
    readonly ALL_ASPECTS: Array<number>;
    readonly APOLLON: number;
    readonly APP_TO_TRUE: number;
    readonly ARCSEC_PER_RAD: number;
    readonly ARMC: number;
    readonly ASC: number;
    readonly ASTNAMFILE: string;
    readonly AST_OFFSET: number;
    readonly AU_KM: number;
    readonly BIT_ASTRO_TWILIGHT: number;
    readonly BIT_CIVIL_TWILIGHT: number;
    readonly BIT_DISC_BOTTOM: number;
    readonly BIT_DISC_CENTER: number;
    readonly BIT_FIXED_DISC_SIZE: number;
    readonly BIT_FORCE_SLOW_METHOD: number;
    readonly BIT_GEOCTR_NO_ECL_LAT: number;
    readonly BIT_HINDU_RISING: number;
    readonly BIT_NAUTIC_TWILIGHT: number;
    readonly BIT_NO_REFRACTION: number;
    readonly CALC_AZALT: number;
    readonly CALC_AZALT_REV: number;
    readonly CALC_ITRANSIT: number;
    readonly CALC_MTRANSIT: number;
    readonly CALC_RISE: number;
    readonly CALC_SET: number;
    readonly CERES: number;
    readonly CHINA_TZ_OFFSET_HOURS: number;
    readonly CHIRON: number;
    readonly COASC1: number;
    readonly COASC2: number;
    readonly COMET_OFFSET: number;
    readonly COPTIC_EPOCH_JD: bigint;
    readonly COPTIC_MONTHS: Array<string>;
    readonly COSMICAL_RISING: number;
    readonly COSMICAL_SETTING: number;
    readonly CUPIDO: number;
    readonly DASHA_SEQUENCE: Array<[
        number,
        number
    ]>;
    readonly EARTH: number;
    readonly EARTHLY_BRANCHES: Array<[
        string,
        string,
        string,
        boolean
    ]>;
    readonly EARTH_RADIUS_KM: number;
    readonly ECL_1ST_VISIBLE: number;
    readonly ECL_2ND_VISIBLE: number;
    readonly ECL_3RD_VISIBLE: number;
    readonly ECL_4TH_VISIBLE: number;
    readonly ECL_ALLTYPES_LUNAR: number;
    readonly ECL_ALLTYPES_SOLAR: number;
    readonly ECL_ANNULAR: number;
    readonly ECL_ANNULAR_TOTAL: number;
    readonly ECL_CENTRAL: number;
    readonly ECL_HYBRID: number;
    readonly ECL_MAX_VISIBLE: number;
    readonly ECL_NONCENTRAL: number;
    readonly ECL_NUT: number;
    readonly ECL_OCCULTATION: number;
    readonly ECL_ONE_TRY: number;
    readonly ECL_PARTBEG_VISIBLE: number;
    readonly ECL_PARTEND_VISIBLE: number;
    readonly ECL_PARTIAL: number;
    readonly ECL_PENUMBRAL: number;
    readonly ECL_TOTAL: number;
    readonly ECL_TOTBEG_VISIBLE: number;
    readonly ECL_TOTEND_VISIBLE: number;
    readonly ECL_VISIBLE: number;
    readonly EPHE_PATH: string;
    readonly EQUASC: number;
    readonly ETHIOPIC_EPOCH_JD: bigint;
    readonly ETHIOPIC_MONTHS: Array<string>;
    readonly EVENING_FIRST: number;
    readonly EVENING_RISING: number;
    readonly FASLI_MONTHS: Array<string>;
    readonly FICTFILE: string;
    readonly FICT_MAX: number;
    readonly FICT_OFFSET: number;
    readonly FICT_OFFSET_1: number;
    readonly FIXSTAR: number;
    readonly FLG_ASTROMETRIC: number;
    readonly FLG_BARYCTR: number;
    readonly FLG_BUILTIN: number;
    readonly FLG_CENTER_BODY: number;
    readonly FLG_DPSIDEPS_1980: number;
    readonly FLG_EQUATORIAL: number;
    readonly FLG_HELCTR: number;
    readonly FLG_ICRS: number;
    readonly FLG_J2000: number;
    readonly FLG_JPL: number;
    readonly FLG_JPLHOR: number;
    readonly FLG_JPLHOR_APPROX: number;
    readonly FLG_MOSHIER: number;
    readonly FLG_NOABERR: number;
    readonly FLG_NOGDEFL: number;
    readonly FLG_NONUT: number;
    readonly FLG_ORBEL_AA: number;
    readonly FLG_RADIANS: number;
    readonly FLG_SIDEREAL: number;
    readonly FLG_SPEED: number;
    readonly FLG_SPEED3: number;
    readonly FLG_TEST_PLMOON: number;
    readonly FLG_TOPOCTR: number;
    readonly FLG_TROPICAL: number;
    readonly FLG_TRUEPOS: number;
    readonly FLG_XYZ: number;
    readonly FNAME_DE200: string;
    readonly FNAME_DE403: string;
    readonly FNAME_DE404: string;
    readonly FNAME_DE405: string;
    readonly FNAME_DE406: string;
    readonly FNAME_DE431: string;
    readonly FNAME_DFT: string;
    readonly FNAME_DFT2: string;
    readonly GATHA_DAYS: Array<string>;
    readonly GMT_CORRELATION: bigint;
    readonly GREG_CAL: number;
    readonly HADES: number;
    readonly HARRINGTON: number;
    readonly HEAVENLY_STEMS: Array<[
        string,
        string,
        boolean
    ]>;
    readonly HELFLAG_AV: number;
    readonly HELFLAG_AVKIND_MIN7: number;
    readonly HELFLAG_AVKIND_MIN9: number;
    readonly HELFLAG_AVKIND_PTO: number;
    readonly HELFLAG_AVKIND_VR: number;
    readonly HELFLAG_HIGH_PRECISION: number;
    readonly HELFLAG_LONG_SEARCH: number;
    readonly HELFLAG_NO_DETAILS: number;
    readonly HELFLAG_OPTICAL_PARAMS: number;
    readonly HELFLAG_SEARCH_1_PERIOD: number;
    readonly HELFLAG_VISLIM_DARK: number;
    readonly HELFLAG_VISLIM_NOMOON: number;
    readonly HELFLAG_VISLIM_PHOTOPIC: number;
    readonly HELFLAG_VISLIM_SCOTOPIC: number;
    readonly HELIACAL_RISING: number;
    readonly HELIACAL_SETTING: number;
    readonly INTP_APOG: number;
    readonly INTP_PERG: number;
    readonly ISIS: number;
    readonly JUL_CAL: number;
    readonly JUNO: number;
    readonly JUPITER: number;
    readonly KARANA_NAMES: Array<string>;
    readonly KRONOS: number;
    readonly LHASA_TZ_OFFSET_HOURS: number;
    readonly MAJOR_ASPECTS: Array<number>;
    readonly MARS: number;
    readonly MC: number;
    readonly MEAN_APOG: number;
    readonly MEAN_NODE: number;
    readonly MERCURY: number;
    readonly MOON: number;
    readonly MORNING_LAST: number;
    readonly MORNING_SETTING: number;
    readonly NAKSHATRA_NAMES: Array<string>;
    readonly NALL_NAT_POINTS: number;
    readonly NASCMC: number;
    readonly NEPTUNE: number;
    readonly NEPTUNE_ADAMS: number;
    readonly NEPTUNE_LEVERRIER: number;
    readonly NFICT_ELEM: number;
    readonly NIBIRU: number;
    readonly NODBIT_FOPOINT: number;
    readonly NODBIT_MEAN: number;
    readonly NODBIT_OSCU: number;
    readonly NODBIT_OSCU_BAR: number;
    readonly NPLANETS: number;
    readonly OBLIQUITY_J2000: number;
    readonly OSCU_APOG: number;
    readonly PALLAS: number;
    readonly PHOLUS: number;
    readonly PLMOON_OFFSET: number;
    readonly PLUTO: number;
    readonly PLUTO_LOWELL: number;
    readonly PLUTO_PICKERING: number;
    readonly POLASC: number;
    readonly POSEIDON: number;
    readonly PROSERPINA: number;
    readonly RAD_PER_ARCSEC: number;
    readonly SATURN: number;
    readonly SIDBITS: number;
    readonly SIDBIT_ECL_DATE: number;
    readonly SIDBIT_ECL_T0: number;
    readonly SIDBIT_NO_PREC_OFFSET: number;
    readonly SIDBIT_PREC_ORIG: number;
    readonly SIDBIT_SSY_PLANE: number;
    readonly SIDBIT_USER_UT: number;
    readonly SIDM_ALDEBARAN_15TAU: number;
    readonly SIDM_ARYABHATA: number;
    readonly SIDM_ARYABHATA_522: number;
    readonly SIDM_ARYABHATA_MSUN: number;
    readonly SIDM_B1950: number;
    readonly SIDM_BABYL_BRITTON: number;
    readonly SIDM_BABYL_ETPSC: number;
    readonly SIDM_BABYL_HUBER: number;
    readonly SIDM_BABYL_KUGLER1: number;
    readonly SIDM_BABYL_KUGLER2: number;
    readonly SIDM_BABYL_KUGLER3: number;
    readonly SIDM_DELUCE: number;
    readonly SIDM_DJWHAL_KHUL: number;
    readonly SIDM_FAGAN_BRADLEY: number;
    readonly SIDM_GALALIGN_MARDYKS: number;
    readonly SIDM_GALCENT_0SAG: number;
    readonly SIDM_GALCENT_COCHRANE: number;
    readonly SIDM_GALCENT_MULA_WILHELM: number;
    readonly SIDM_GALCENT_RGILBRAND: number;
    readonly SIDM_GALEQU_FIORENZA: number;
    readonly SIDM_GALEQU_IAU1958: number;
    readonly SIDM_GALEQU_MULA: number;
    readonly SIDM_GALEQU_TRUE: number;
    readonly SIDM_HIPPARCHOS: number;
    readonly SIDM_J1900: number;
    readonly SIDM_J2000: number;
    readonly SIDM_JN_BHASIN: number;
    readonly SIDM_KRISHNAMURTI: number;
    readonly SIDM_KRISHNAMURTI_VP291: number;
    readonly SIDM_LAHIRI: number;
    readonly SIDM_LAHIRI_1940: number;
    readonly SIDM_LAHIRI_ICRC: number;
    readonly SIDM_LAHIRI_VP285: number;
    readonly SIDM_RAMAN: number;
    readonly SIDM_SASSANIAN: number;
    readonly SIDM_SS_CITRA: number;
    readonly SIDM_SS_REVATI: number;
    readonly SIDM_SURYASIDDHANTA: number;
    readonly SIDM_SURYASIDDHANTA_MSUN: number;
    readonly SIDM_TRUE_CITRA: number;
    readonly SIDM_TRUE_MULA: number;
    readonly SIDM_TRUE_PUSHYA: number;
    readonly SIDM_TRUE_REVATI: number;
    readonly SIDM_TRUE_SHEORAN: number;
    readonly SIDM_USER: number;
    readonly SIDM_USHASHASHI: number;
    readonly SIDM_VALENS_MOON: number;
    readonly SIDM_YUKTESHWAR: number;
    readonly SOLAR_PARALLAX: number;
    readonly SOLAR_TERMS: Array<[
        number,
        string,
        string
    ]>;
    readonly SPLIT_DEG_KEEP_DEG: number;
    readonly SPLIT_DEG_KEEP_SIGN: number;
    readonly SPLIT_DEG_NAKSHATRA: number;
    readonly SPLIT_DEG_ROUND_DEG: number;
    readonly SPLIT_DEG_ROUND_MIN: number;
    readonly SPLIT_DEG_ROUND_SEC: number;
    readonly SPLIT_DEG_ZODIACAL: number;
    readonly STARFILE: string;
    readonly STARFILE_OLD: string;
    readonly SUN: number;
    readonly SYNODIC_MONTH: number;
    readonly TIDAL_26: number;
    readonly TIDAL_AUTOMATIC: number;
    readonly TIDAL_DE200: number;
    readonly TIDAL_DE403: number;
    readonly TIDAL_DE404: number;
    readonly TIDAL_DE405: number;
    readonly TIDAL_DE406: number;
    readonly TIDAL_DE421: number;
    readonly TIDAL_DE422: number;
    readonly TIDAL_DE430: number;
    readonly TIDAL_DE431: number;
    readonly TIDAL_DEFAULT: number;
    readonly TIDAL_JPLEPH_DE406: number;
    readonly TIDAL_MOSEPH: number;
    readonly TIDAL_STEPHENSON_2016: number;
    readonly TIDAL_SWIEPH: number;
    readonly TITHI_NAMES: Array<string>;
    readonly TONALPOHUALLI_SIGNS: Array<[
        string,
        string
    ]>;
    readonly TRUE_NODE: number;
    readonly TRUE_TO_APP: number;
    readonly TZOLKIN_SIGNS: Array<[
        string,
        string
    ]>;
    readonly TZ_TABLE: Array<TzAbbrResult>;
    readonly URANUS: number;
    readonly VARA_NAMES: Array<string>;
    readonly VARUNA: number;
    readonly VENUS: number;
    readonly VERTEX: number;
    readonly VESTA: number;
    readonly VIETNAM_TZ_OFFSET_HOURS: number;
    readonly VULCAN: number;
    readonly VULKANUS: number;
    readonly WALDEMATH: number;
    readonly WHITE_MOON: number;
    readonly XIUHPOHUALLI_MONTHS: Array<[
        string,
        string
    ]>;
    readonly YOGA_NAMES: Array<string>;
    readonly ZEUS: number;
}
```

<a id="core-CurrentFileData"></a>

#### `CurrentFileData`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface CurrentFileData {
    path: string;
    tfstart: number;
    tfend: number;
    denum: number;
}
```

<a id="core-EclipseHow"></a>

#### `EclipseHow`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface EclipseHow {
    retFlags: number;
    attr: Array<number>;
}
```

<a id="core-EclipseResult"></a>

#### `EclipseResult`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface EclipseResult {
    retFlags: number;
    tret: Array<number>;
}
```

<a id="core-EclipseResultAttr"></a>

#### `EclipseResultAttr`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface EclipseResultAttr {
    retFlags: number;
    tret: Array<number>;
    attr: Array<number>;
}
```

<a id="core-EclipseWhere"></a>

#### `EclipseWhere`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface EclipseWhere {
    retFlags: number;
    geopos: Array<number>;
    attr: Array<number>;
}
```

<a id="core-ErrorDetails"></a>

#### `ErrorDetails`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface ErrorDetails {
    body: number | null;
    name: string | null;
    phase: string | null;
    fromJd: number | null;
    lat: number | null;
    system: number | null;
    id: number | null;
    reason: string | null;
}
```

<a id="core-Esbat"></a>

#### `Esbat`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface Esbat {
    name: string;
    displayName: string;
    jd: number;
}
```

<a id="core-HebrewDate"></a>

#### `HebrewDate`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface HebrewDate {
    year: number;
    month: number;
    day: number;
}
```

<a id="core-HijriDate"></a>

#### `HijriDate`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface HijriDate {
    year: number;
    month: number;
    day: number;
}
```

<a id="core-HijriYears"></a>

#### `HijriYears`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface HijriYears {
    year1: number;
    year2: number;
}
```

<a id="core-HinduFestival"></a>

#### `HinduFestival`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface HinduFestival {
    name: string;
    description: string;
    jd: number;
}
```

<a id="core-HouseResult"></a>

#### `HouseResult`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface HouseResult {
    cusps: Array<number>;
    ascmc: Array<number>;
}
```

<a id="core-HouseResultEx2"></a>

#### `HouseResultEx2`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface HouseResultEx2 {
    cusps: Array<number>;
    ascmc: Array<number>;
    cuspSpeeds: Array<number>;
    ascmcSpeeds: Array<number>;
}
```

<a id="core-IngressResult"></a>

#### `IngressResult`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface IngressResult {
    jd: number;
    sign: number;
}
```

<a id="core-InitOutput"></a>

#### `InitOutput`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_aspectorbs_free: (a: number, b: number) => void;
    readonly __wbg_calcoptions_free: (a: number, b: number) => void;
    readonly __wbg_multicalc_free: (a: number, b: number) => void;
    readonly __wbg_risetransoptions_free: (a: number, b: number) => void;
    readonly __wbg_searchoptions_free: (a: number, b: number) => void;
    readonly __wbg_singlecalc_free: (a: number, b: number) => void;
    readonly almuten: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly annualProfection: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly antiscion: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly approxHebrewYear: (a: any) => [
        number,
        number,
        number
    ];
    readonly arabicPart: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly arabicPartsSeven: (a: any, b: any, c: any, d: any, e: any, f: any, g: any, h: any, i: any) => [
        number,
        number,
        number
    ];
    readonly ascTransitUt: (a: any, b: any, c: any, d: any, e: any, f: any, g: any, h: any) => [
        number,
        number,
        number
    ];
    readonly aspectorbs_check: (a: number, b: number, c: number, d: number, e: number, f: number) => [
        number,
        number,
        number
    ];
    readonly aspectorbs_checkSimple: (a: number, b: number, c: number, d: number, e: number, f: number) => [
        number,
        number,
        number
    ];
    readonly aspectorbs_defOrb: (a: number, b: number) => number;
    readonly aspectorbs_new: (a: number, b: number) => number;
    readonly ayanamsa: (a: any) => [
        number,
        number,
        number
    ];
    readonly ayanamsaEx: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly ayanamsaExUt: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly ayanamsaName: (a: any) => [
        number,
        number,
        number
    ];
    readonly ayanamsaUt: (a: any) => [
        number,
        number,
        number
    ];
    readonly azalt: (a: any, b: any, c: any, d: any, e: any, f: any) => [
        number,
        number,
        number
    ];
    readonly azaltRev: (a: any, b: any, c: any, d: any, e: any) => [
        number,
        number,
        number
    ];
    readonly bahaiHolyDays: (a: any) => [
        number,
        number,
        number
    ];
    readonly bestTimeMethod: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly bodyAsRaw: (a: number) => [
        number,
        number,
        number
    ];
    readonly bodyFromRaw: (a: number) => [
        number,
        number,
        number
    ];
    readonly bodyIngressSearchWindow: (a: number) => [
        number,
        number,
        number
    ];
    readonly bodyIsKnownId: (a: number) => [
        number,
        number,
        number
    ];
    readonly bodyIsNode: (a: number) => [
        number,
        number,
        number
    ];
    readonly bodyIsPlanet: (a: number) => [
        number,
        number,
        number
    ];
    readonly bodyName: (a: number) => [
        number,
        number,
        number,
        number
    ];
    readonly bodyOrbWeight: (a: number) => [
        number,
        number,
        number
    ];
    readonly bodyRetrogradeSearchWindow: (a: number) => [
        number,
        number,
        number
    ];
    readonly bodyTryFromRaw: (a: number) => [
        number,
        number,
        number
    ];
    readonly calc: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly calcChartAspects: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly calcChartAspectsAuto: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly calcFlagsAsRaw: (a: number) => [
        number,
        number,
        number
    ];
    readonly calcFlagsIsSidereal: (a: number) => [
        number,
        number,
        number
    ];
    readonly calcFlagsIsSpeed: (a: number) => [
        number,
        number,
        number
    ];
    readonly calcMany: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly calcPctr: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly calcUt: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly calcUtMany: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly calcoptions_bodies: (a: number, b: any) => [
        number,
        number,
        number
    ];
    readonly calcoptions_body: (a: number, b: number) => [
        number,
        number,
        number
    ];
    readonly calcoptions_strategy: (a: number, b: number) => [
        number,
        number,
        number
    ];
    readonly calcoptions_tt: (a: number, b: number) => [
        number,
        number,
        number
    ];
    readonly calcoptions_ut: (a: number, b: number) => [
        number,
        number,
        number
    ];
    readonly calendarAsRaw: (a: number) => [
        number,
        number,
        number
    ];
    readonly calendarRound: (a: any) => [
        number,
        number,
        number
    ];
    readonly centisecToDegStr: (a: any) => [
        number,
        number,
        number
    ];
    readonly centisecToLonlatStr: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly centisecToTimeStr: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly christianFeasts: (a: any) => [
        number,
        number,
        number
    ];
    readonly christianFixedFeasts: (a: any) => [
        number,
        number,
        number
    ];
    readonly close: () => [
        number,
        number,
        number
    ];
    readonly constants: () => [
        number,
        number,
        number
    ];
    readonly coordTransform: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly coordTransformWithSpeed: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly copticMonthDays: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly copticToJd: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly csRoundSec: (a: any) => [
        number,
        number,
        number
    ];
    readonly currentFileData: (a: any) => [
        number,
        number,
        number
    ];
    readonly cycleNickname: (a: any) => [
        number,
        number,
        number
    ];
    readonly dateConversion: (a: any, b: any, c: any, d: any, e: any) => [
        number,
        number,
        number
    ];
    readonly dayOfWeek: (a: any) => [
        number,
        number,
        number
    ];
    readonly dayOfYear: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly daysInHebrewYear: (a: any) => [
        number,
        number,
        number
    ];
    readonly decanRuler: (a: any) => [
        number,
        number,
        number
    ];
    readonly defaultOrb: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly degMidp: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly degToCs: (a: any) => [
        number,
        number,
        number
    ];
    readonly degnorm: (a: any) => [
        number,
        number,
        number
    ];
    readonly degreesGet: (a: number) => number;
    readonly degreesNew: (a: number) => number;
    readonly degsplit: (a: any) => [
        number,
        number,
        number
    ];
    readonly deltat: (a: any) => [
        number,
        number,
        number
    ];
    readonly deltatEx: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly difdeg2n: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly diffCs: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly diffCsSigned: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly diffDeg: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly diffDegSigned: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly diffRadSigned: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly distanceToMc: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly dscTransitUt: (a: any, b: any, c: any, d: any, e: any, f: any, g: any, h: any) => [
        number,
        number,
        number
    ];
    readonly easterGregorian: (a: any) => [
        number,
        number,
        number
    ];
    readonly easterJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly easterJulian: (a: any) => [
        number,
        number,
        number
    ];
    readonly easterOrthodox: (a: any) => [
        number,
        number,
        number
    ];
    readonly easterOrthodoxJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly egyptianDecan: (a: any) => [
        number,
        number,
        number
    ];
    readonly egyptianTermsRuler: (a: any) => [
        number,
        number,
        number
    ];
    readonly elapsedDays: (a: any) => [
        number,
        number,
        number
    ];
    readonly esbatAltNames: (a: number) => [
        number,
        number,
        number
    ];
    readonly esbatDisplayName: (a: number) => [
        number,
        number,
        number,
        number
    ];
    readonly esbatsForYear: (a: any) => [
        number,
        number,
        number
    ];
    readonly ethiopicToJd: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly fasliNowruzJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly firdaria: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly fixstar: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly fixstar2: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly fixstar2Mag: (a: any) => [
        number,
        number,
        number
    ];
    readonly fixstar2Ut: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly fixstarMag: (a: any) => [
        number,
        number,
        number
    ];
    readonly fixstarUt: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly formatCoord: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly fourPillars: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly fullDignity: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly gauquelinSector: (a: any, b: any, c: any, d: any, e: any, f: any, g: any, h: any) => [
        number,
        number,
        number
    ];
    readonly geoToDms: (a: any) => [
        number,
        number,
        number
    ];
    readonly getOrbitalElements: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly grandSolarEpoch: (a: any) => [
        number,
        number,
        number
    ];
    readonly grandSolarEpochName: (a: number) => [
        number,
        number,
        number,
        number
    ];
    readonly gregorianToHijriYears: (a: any) => [
        number,
        number,
        number
    ];
    readonly gregorianToSolarHijri: (a: any) => [
        number,
        number,
        number
    ];
    readonly haab: (a: any) => [
        number,
        number,
        number
    ];
    readonly hebrewMonthDays: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly hebrewMonthStartJd: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly hebrewNewYearJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly hebrewYearFromJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly heliacalPhenoUt: (a: any, b: any, c: any, d: any, e: any, f: any, g: any) => [
        number,
        number,
        number
    ];
    readonly heliacalUt: (a: any, b: any, c: any, d: any, e: any, f: any, g: any) => [
        number,
        number,
        number
    ];
    readonly helioCross: (a: any, b: any, c: any, d: any, e: any) => [
        number,
        number,
        number
    ];
    readonly helioCrossUt: (a: any, b: any, c: any, d: any, e: any) => [
        number,
        number,
        number
    ];
    readonly hijriFromJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly hijriMonthDays: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly hijriMonthName: (a: any) => [
        number,
        number,
        number
    ];
    readonly hijriMonthStartJd: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly hijriNewYearJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly hijriToJd: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly hinduFestivals: (a: any) => [
        number,
        number,
        number
    ];
    readonly houseName: (a: any) => [
        number,
        number,
        number
    ];
    readonly housePos: (a: any, b: any, c: any, d: any, e: any, f: any) => [
        number,
        number,
        number
    ];
    readonly houseSystemAsRaw: (a: number) => [
        number,
        number,
        number
    ];
    readonly houseSystemChar: (a: any) => [
        number,
        number,
        number
    ];
    readonly houseSystemId: (a: any) => [
        number,
        number,
        number
    ];
    readonly houseSystemName: (a: number) => [
        number,
        number,
        number,
        number
    ];
    readonly houses: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly housesArmc: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly housesArmcEx2: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly housesEx: (a: any, b: any, c: any, d: any, e: any) => [
        number,
        number,
        number
    ];
    readonly housesEx2: (a: any, b: any, c: any, d: any, e: any) => [
        number,
        number,
        number
    ];
    readonly housesFromArmc: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly icTransitUt: (a: any, b: any, c: any, d: any, e: any, f: any, g: any, h: any) => [
        number,
        number,
        number
    ];
    readonly isApplying: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly isBahaiLeapYear: (a: any) => [
        number,
        number,
        number
    ];
    readonly isCopticLeapYear: (a: any) => [
        number,
        number,
        number
    ];
    readonly isDayChart: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly isHebrewLeapYear: (a: any) => [
        number,
        number,
        number
    ];
    readonly isHijriLeapYear: (a: any) => [
        number,
        number,
        number
    ];
    readonly islamicObservances: (a: any) => [
        number,
        number,
        number
    ];
    readonly islamicObservancesForJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly isoWeek: (a: any) => [
        number,
        number,
        number
    ];
    readonly jdDuration: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly jdEtToUtc: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly jdToBahai: (a: any) => [
        number,
        number,
        number
    ];
    readonly jdToCoptic: (a: any) => [
        number,
        number,
        number
    ];
    readonly jdToEthiopic: (a: any) => [
        number,
        number,
        number
    ];
    readonly jdToFasli: (a: any) => [
        number,
        number,
        number
    ];
    readonly jdToHebrewDate: (a: any) => [
        number,
        number,
        number
    ];
    readonly jdToIsoString: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly jdUtToUtc: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly jdnow: () => [
        number,
        number,
        number
    ];
    readonly jewishHolidayJd: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly jewishHolidays: (a: any) => [
        number,
        number,
        number
    ];
    readonly julday: (a: any, b: any, c: any, d: any, e: any) => [
        number,
        number,
        number
    ];
    readonly julianDayGet: (a: number) => number;
    readonly julianDayNew: (a: number) => number;
    readonly karanaName: (a: any) => [
        number,
        number,
        number
    ];
    readonly latToLmt: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly latitudeGet: (a: number) => number;
    readonly latitudeNew: (a: number) => number;
    readonly libraryPath: () => [
        number,
        number,
        number
    ];
    readonly lmtToLat: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly localApparentSolarTime: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly lonToSign: (a: any) => [
        number,
        number,
        number
    ];
    readonly longToNakshatra: (a: any) => [
        number,
        number,
        number
    ];
    readonly longToNavamsa: (a: any) => [
        number,
        number,
        number
    ];
    readonly longToRasi: (a: any) => [
        number,
        number,
        number
    ];
    readonly longitudeGet: (a: number) => number;
    readonly longitudeNew: (a: number) => number;
    readonly losarJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly lowerMeridianTransitUt: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly lunEclipseHow: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly lunEclipseWhen: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly lunEclipseWhenLoc: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly lunOccultWhenGlob: (a: any, b: any, c: any, d: any, e: any, f: any) => [
        number,
        number,
        number
    ];
    readonly lunOccultWhenLoc: (a: any, b: any, c: any, d: any, e: any, f: any) => [
        number,
        number,
        number
    ];
    readonly lunOccultWhere: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly lunarReturnJd: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly makePillar: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly matchAspect: (a: any, b: any, c: any, d: any, e: any, f: any) => [
        number,
        number,
        number
    ];
    readonly matchAspect2: (a: any, b: any, c: any, d: any, e: any, f: any) => [
        number,
        number,
        number
    ];
    readonly matchAspect3: (a: any, b: any, c: any, d: any, e: any, f: any, g: any, h: any) => [
        number,
        number,
        number
    ];
    readonly matchAspect4: (a: any, b: any, c: any, d: any, e: any, f: any, g: any, h: any) => [
        number,
        number,
        number
    ];
    readonly mayaLongCount: (a: any) => [
        number,
        number,
        number
    ];
    readonly mayaLongCountStr: (a: any) => [
        number,
        number,
        number
    ];
    readonly mcTransitUt: (a: any, b: any, c: any, d: any, e: any, f: any, g: any, h: any) => [
        number,
        number,
        number
    ];
    readonly meanObliquity: (a: any) => [
        number,
        number,
        number
    ];
    readonly meanSiderealTimeDeg: (a: any) => [
        number,
        number,
        number
    ];
    readonly meanSidtime: (a: any) => [
        number,
        number,
        number
    ];
    readonly medicineWheelTotem: (a: any) => [
        number,
        number,
        number
    ];
    readonly meridianTransitUt: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly midpoint: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly midpointRad: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly midpointTable: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly monthlyProfection: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly monthsInHebrewYear: (a: any) => [
        number,
        number,
        number
    ];
    readonly moonElongation: (a: any) => [
        number,
        number,
        number
    ];
    readonly moonIllumination: (a: any) => [
        number,
        number,
        number
    ];
    readonly moonPhase: (a: any) => [
        number,
        number,
        number
    ];
    readonly moonPhaseAngle: (a: any) => [
        number,
        number,
        number
    ];
    readonly moonPhaseInfo: (a: any) => [
        number,
        number,
        number
    ];
    readonly moonPhaseName: (a: number) => [
        number,
        number,
        number,
        number
    ];
    readonly moonPhaseTargetElongation: (a: number) => [
        number,
        number,
        number
    ];
    readonly moonPhasesForMonth: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly mooncross: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly mooncrossBackUt: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly mooncrossNode: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly mooncrossNodeUt: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly mooncrossUt: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly multicalc_getMany: (a: number) => [
        number,
        number,
        number
    ];
    readonly naisargakaRelation: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly nakshatraName: (a: any) => [
        number,
        number,
        number
    ];
    readonly nawRuzJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly nextAspect: (a: any, b: any, c: any, d: any, e: any, f: any, g: any) => [
        number,
        number,
        number
    ];
    readonly nextAspect2: (a: any, b: any, c: any, d: any, e: any, f: any, g: any) => [
        number,
        number,
        number
    ];
    readonly nextAspectCusp: (a: any, b: any, c: any, d: any, e: any, f: any, g: any, h: any, i: any) => [
        number,
        number,
        number
    ];
    readonly nextAspectCusp2: (a: any, b: any, c: any, d: any, e: any, f: any, g: any, h: any, i: any) => [
        number,
        number,
        number
    ];
    readonly nextAspectWith: (a: any, b: any, c: any, d: any, e: any, f: any, g: any) => [
        number,
        number,
        number
    ];
    readonly nextAspectWith2: (a: any, b: any, c: any, d: any, e: any, f: any, g: any) => [
        number,
        number,
        number
    ];
    readonly nextEsbat: (a: any) => [
        number,
        number,
        number
    ];
    readonly nextFirstQuarter: (a: any) => [
        number,
        number,
        number
    ];
    readonly nextFullMoon: (a: any) => [
        number,
        number,
        number
    ];
    readonly nextFullMoonAfter: (a: any) => [
        number,
        number,
        number
    ];
    readonly nextFullMoonPhase: (a: any) => [
        number,
        number,
        number
    ];
    readonly nextLastQuarter: (a: any) => [
        number,
        number,
        number
    ];
    readonly nextNewMoon: (a: any) => [
        number,
        number,
        number
    ];
    readonly nextNewMoonAfter: (a: any) => [
        number,
        number,
        number
    ];
    readonly nextPrincipalPhase: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly nextRetro: (a: any, b: any, c: any, d: any, e: any) => [
        number,
        number,
        number
    ];
    readonly nextSabbat: (a: any) => [
        number,
        number,
        number
    ];
    readonly nextSabbatName: (a: any) => [
        number,
        number,
        number
    ];
    readonly nodAps: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly nodApsUt: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly normCs: (a: any) => [
        number,
        number,
        number
    ];
    readonly normDeg: (a: any) => [
        number,
        number,
        number
    ];
    readonly normRad: (a: any) => [
        number,
        number,
        number
    ];
    readonly nowruzJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly nutation: (a: any) => [
        number,
        number,
        number
    ];
    readonly ochchabala: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly omerDayJd: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly omerDays: (a: any) => [
        number,
        number,
        number
    ];
    readonly omerDeclaration: (a: any) => [
        number,
        number,
        number
    ];
    readonly omerFromJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly omerPeriod: (a: any) => [
        number,
        number,
        number
    ];
    readonly omerStartJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly orbitMaxMinTrueDistance: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly panchanga: (a: any) => [
        number,
        number,
        number
    ];
    readonly parallacticAngle: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly parseCoord: (a: any) => [
        number,
        number,
        number
    ];
    readonly parseDatetime: (a: any) => [
        number,
        number,
        number
    ];
    readonly parseTime: (a: any) => [
        number,
        number,
        number
    ];
    readonly pheno: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly phenoUt: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly planetConjunctMc: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly planetHouseNumber: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly planetName: (a: any) => [
        number,
        number,
        number
    ];
    readonly planetOnMidpoint: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly principalPhaseElongationTarget: (a: number) => [
        number,
        number,
        number
    ];
    readonly principalPhaseName: (a: number) => [
        number,
        number,
        number,
        number
    ];
    readonly ramanHouses: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly rasiDiff: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly rasiDiff2: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly rasiNorm: (a: any) => [
        number,
        number,
        number
    ];
    readonly refrac: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly refracExtended: (a: any, b: any, c: any, d: any, e: any, f: any) => [
        number,
        number,
        number
    ];
    readonly residentialStrength: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly retrogradeStationUt: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly revjul: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly revjulHms: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly riseTrans: (a: any, b: any, c: any, d: any, e: any, f: any, g: any) => [
        number,
        number,
        number
    ];
    readonly riseTransTrueHor: (a: any, b: any, c: any, d: any, e: any, f: any, g: any, h: any) => [
        number,
        number,
        number
    ];
    readonly risetransoptions_atmosphere: (a: number, b: number, c: number) => number;
    readonly risetransoptions_event: (a: number, b: number) => [
        number,
        number,
        number
    ];
    readonly risetransoptions_flags: (a: number, b: number) => [
        number,
        number,
        number
    ];
    readonly risetransoptions_horizonHeight: (a: number, b: number) => number;
    readonly risetransoptions_new: (a: number, b: number, c: number, d: number) => [
        number,
        number,
        number
    ];
    readonly risetransoptions_search: (a: number) => [
        number,
        number,
        number
    ];
    readonly risetransoptions_star: (a: number, b: number, c: number) => number;
    readonly sabbatAllByLongitude: () => [
        number,
        number
    ];
    readonly sabbatAltNames: (a: number) => [
        number,
        number,
        number
    ];
    readonly sabbatIsCrossQuarter: (a: number) => [
        number,
        number,
        number
    ];
    readonly sabbatIsQuarterDay: (a: number) => [
        number,
        number,
        number
    ];
    readonly sabbatJd: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly sabbatName: (a: number) => [
        number,
        number,
        number,
        number
    ];
    readonly sabbatSolarLongitude: (a: number) => [
        number,
        number,
        number
    ];
    readonly sabbatsForYear: (a: any) => [
        number,
        number,
        number
    ];
    readonly sameSect: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly saturnFourStars: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly searchoptions_aspect: (a: number, b: number) => number;
    readonly searchoptions_backward: (a: number, b: number) => number;
    readonly searchoptions_cusp: (a: number, b: number, c: number, d: number, e: number) => [
        number,
        number,
        number
    ];
    readonly searchoptions_flags: (a: number, b: number) => [
        number,
        number,
        number
    ];
    readonly searchoptions_natalChart: (a: number, b: number, c: number, d: number, e: number) => [
        number,
        number,
        number
    ];
    readonly searchoptions_new: (a: number, b: number) => [
        number,
        number,
        number
    ];
    readonly searchoptions_searchAscTransit: (a: number) => [
        number,
        number,
        number
    ];
    readonly searchoptions_searchCusp: (a: number) => [
        number,
        number,
        number
    ];
    readonly searchoptions_searchDscTransit: (a: number) => [
        number,
        number,
        number
    ];
    readonly searchoptions_searchIcTransit: (a: number) => [
        number,
        number,
        number
    ];
    readonly searchoptions_searchMcTransit: (a: number) => [
        number,
        number,
        number
    ];
    readonly secondaryProgressions: (a: any, b: any, c: any, d: any, e: any, f: any, g: any) => [
        number,
        number,
        number
    ];
    readonly setDeltaTUserdef: (a: any) => [
        number,
        number,
        number
    ];
    readonly setEphePath: (a: any) => [
        number,
        number,
        number
    ];
    readonly setJplFile: (a: any) => [
        number,
        number,
        number
    ];
    readonly setLapseRate: (a: any) => [
        number,
        number,
        number
    ];
    readonly setSidMode: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly setTidAcc: (a: any) => [
        number,
        number,
        number
    ];
    readonly setTopo: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly sexagenaryName: (a: any) => [
        number,
        number,
        number
    ];
    readonly siderealModeAsRaw: (a: number) => [
        number,
        number,
        number
    ];
    readonly siderealModeFlag: (a: any) => [
        number,
        number,
        number
    ];
    readonly siderealModeId: (a: any) => [
        number,
        number,
        number
    ];
    readonly siderealModeName: (a: number) => [
        number,
        number,
        number,
        number
    ];
    readonly siderealTimeDeg: (a: any) => [
        number,
        number,
        number
    ];
    readonly sidtime: (a: any) => [
        number,
        number,
        number
    ];
    readonly sidtime0: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly signExaltation: (a: any) => [
        number,
        number,
        number
    ];
    readonly signIngressUt: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly signLord: (a: any) => [
        number,
        number,
        number
    ];
    readonly signName: (a: any) => [
        number,
        number,
        number
    ];
    readonly signRuler: (a: any) => [
        number,
        number,
        number
    ];
    readonly signRulerModern: (a: any) => [
        number,
        number,
        number
    ];
    readonly singlecalc_get: (a: number) => [
        number,
        number,
        number
    ];
    readonly solEclipseHow: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly solEclipseWhenGlob: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly solEclipseWhenLoc: (a: any, b: any, c: any, d: any) => [
        number,
        number,
        number
    ];
    readonly solEclipseWhere: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly solarArcDirections: (a: any, b: any, c: any, d: any, e: any) => [
        number,
        number,
        number
    ];
    readonly solarCycle: (a: any) => [
        number,
        number,
        number
    ];
    readonly solarCyclePhaseName: (a: number) => [
        number,
        number,
        number,
        number
    ];
    readonly solarHijriToGregorian: (a: any) => [
        number,
        number,
        number
    ];
    readonly solarReturnJd: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly solarTermPosition: (a: any) => [
        number,
        number,
        number
    ];
    readonly solcross: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly solcrossBackUt: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly solcrossUt: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly splitDeg: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly tatkalikaRelation: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly tibetanYearName: (a: any) => [
        number,
        number,
        number
    ];
    readonly tidAcc: () => [
        number,
        number,
        number
    ];
    readonly timeEqu: (a: any) => [
        number,
        number,
        number
    ];
    readonly tonalpohualli: (a: any) => [
        number,
        number,
        number
    ];
    readonly transitToDegree: (a: any, b: any, c: any, d: any, e: any) => [
        number,
        number,
        number
    ];
    readonly triplicityRulers: (a: any) => [
        number,
        number,
        number
    ];
    readonly trueObliquity: (a: any) => [
        number,
        number,
        number
    ];
    readonly tryPanchanga: (a: any) => [
        number,
        number,
        number
    ];
    readonly ttToUt: (a: any) => [
        number,
        number,
        number
    ];
    readonly tzAbbrFind: (a: any) => [
        number,
        number,
        number
    ];
    readonly tzolkin: (a: any) => [
        number,
        number,
        number
    ];
    readonly uposathaDays: (a: any) => [
        number,
        number,
        number
    ];
    readonly utcTimeZone: (a: any, b: any, c: any, d: any, e: any, f: any, g: any) => [
        number,
        number,
        number
    ];
    readonly utcToJd: (a: any, b: any) => [
        number,
        number,
        number
    ];
    readonly version: () => [
        number,
        number,
        number
    ];
    readonly vesakJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly vietnameseChineseBoundaryDiffers: (a: any) => [
        number,
        number,
        number
    ];
    readonly vietnameseMonthStartJd: (a: any) => [
        number,
        number,
        number
    ];
    readonly vimshottariDasha: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly visLimitMag: (a: any, b: any, c: any, d: any, e: any, f: any) => [
        number,
        number,
        number
    ];
    readonly weeksInIsoYear: (a: any) => [
        number,
        number,
        number
    ];
    readonly wrapSigned180: (a: any) => [
        number,
        number,
        number
    ];
    readonly xiuhpohualli: (a: any) => [
        number,
        number,
        number
    ];
    readonly yallopQ: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly yearsDiff: (a: any, b: any, c: any) => [
        number,
        number,
        number
    ];
    readonly zodiacSignName: (a: any) => [
        number,
        number,
        number
    ];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}
```

<a id="core-IslamicObservance"></a>

#### `IslamicObservance`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface IslamicObservance {
    name: string;
    arabicName: string;
    hijriMonth: number;
    hijriDay: number;
    jd: number;
    days: number;
}
```

<a id="core-JdPair"></a>

#### `JdPair`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface JdPair {
    et: number;
    ut1: number;
}
```

<a id="core-JewishHoliday"></a>

#### `JewishHoliday`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface JewishHoliday {
    name: string;
    hebrewName: string;
    hebrewMonth: number;
    hebrewDay: number;
    jd: number;
    jdEnd: number;
    days: number;
    category: string;
}
```

<a id="core-MidpointEntry"></a>

#### `MidpointEntry`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface MidpointEntry {
    body1: number;
    body2: number;
    longitude: number;
    planetsOnMidpoint: Array<MidpointPlanet>;
}
```

<a id="core-MidpointPlanet"></a>

#### `MidpointPlanet`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface MidpointPlanet {
    body: number;
    orb: number;
}
```

<a id="core-MoonCrossNodeResult"></a>

#### `MoonCrossNodeResult`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface MoonCrossNodeResult {
    jdCross: number;
    xlon: number;
}
```

<a id="core-MoonPhaseInfo"></a>

#### `MoonPhaseInfo`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface MoonPhaseInfo {
    phase: string;
    phaseName: string;
    elongation: number;
    illumination: number;
    prevPhaseName: string;
    prevPhaseJd: number;
    nextPhaseName: string;
    nextPhaseJd: number;
    ageDays: number;
}
```

<a id="core-OmerDay"></a>

#### `OmerDay`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface OmerDay {
    day: number;
    week: number;
    dayOfWeek: number;
    weekSefirah: string;
    daySefirah: string;
    hebrewText: string;
    isLagBaomer: boolean;
    jd: number;
}
```

<a id="core-OmerPeriod"></a>

#### `OmerPeriod`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface OmerPeriod {
    startJd: number;
    endJd: number;
    hebrewYear: number;
}
```

<a id="core-OrbitalDistances"></a>

#### `OrbitalDistances`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface OrbitalDistances {
    dmax: number;
    dmin: number;
    dtrue: number;
}
```

<a id="core-OrbitalElements"></a>

#### `OrbitalElements`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface OrbitalElements {
    semiMajorAxis: number;
    eccentricity: number;
    inclination: number;
    ascendingNode: number;
    argPerihelion: number;
    meanAnomaly: number;
    epoch: number;
    meanDailyMotion: number;
    extra: Array<number>;
}
```

<a id="core-Panchanga"></a>

#### `Panchanga`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface Panchanga {
    tithi: number;
    tithiName: string;
    paksha: string;
    vara: number;
    varaName: string;
    nakshatra: number;
    nakshatraName: string;
    nakshatraPada: number;
    yoga: number;
    yogaName: string;
    karana: number;
    karanaName: string;
    sunLon: number;
    moonLon: number;
    elongation: number;
}
```

<a id="core-PhaseEvent"></a>

#### `PhaseEvent`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface PhaseEvent {
    phase: string;
    jd: number;
    elongation: number;
}
```

<a id="core-PlanetPos"></a>

#### `PlanetPos`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
// Generated by wasm/generate.py. Synchronous; initialize the WASM module first.
export interface PlanetPos {
    lon: number;
    lat: number;
    dist: number;
    speedLon: number;
    speedLat: number;
    speedDist: number;
    retFlags: number;
}
```

<a id="core-ProgressedPosition"></a>

#### `ProgressedPosition`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface ProgressedPosition {
    body: number;
    position: PlanetPos;
}
```

<a id="core-RefracExt"></a>

#### `RefracExt`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface RefracExt {
    result: number;
    dret: Array<number>;
}
```

<a id="core-RiseTrans"></a>

#### `RiseTrans`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface RiseTrans {
    retFlags: number;
    tret: number;
}
```

<a id="core-Sabbat"></a>

#### `Sabbat`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface Sabbat {
    kind: string;
    name: string;
    jd: number;
}
```

<a id="core-SecondaryProgressionsResult"></a>

#### `SecondaryProgressionsResult`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface SecondaryProgressionsResult {
    positions: Array<ProgressedPosition>;
    houses: HouseResult;
}
```

<a id="core-SolarCycleInfo"></a>

#### `SolarCycleInfo`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface SolarCycleInfo {
    cycleNum: number;
    phase: number;
    phaseName: string;
    minJd: number;
    maxJd: number;
    nextMinJd: number;
    yearsSinceMin: number;
    nickname: string | null;
    grandEpoch: string | null;
}
```

<a id="core-StarPos"></a>

#### `StarPos`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface StarPos {
    xx: Array<number>;
    starName: string;
    retFlags: number;
}
```

<a id="core-Stations"></a>

#### `Stations`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface Stations {
    retrograde: number;
    direct: number;
}
```

<a id="core-TzAbbrResult"></a>

#### `TzAbbrResult`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface TzAbbrResult {
    name: string;
    desc: string;
    offset: string;
    hours: number;
    minutes: number;
}
```

<a id="core-Uposatha"></a>

#### `Uposatha`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface Uposatha {
    phase: string;
    jd: number;
    elongation: number;
}
```

<a id="core-UtcDate"></a>

#### `UtcDate`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export interface UtcDate {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
}
```

### Aliases de tipos (5)

[`CalcResult`](#core-CalcResult) · [`CoreFunctionName`](#core-CoreFunctionName) · [`ExportedFunctionName`](#core-ExportedFunctionName) · [`InitInput`](#core-InitInput) · [`SyncInitInput`](#core-SyncInitInput)

<a id="core-CalcResult"></a>

#### `CalcResult`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export type CalcResult = {
    status: "ok";
    value: PlanetPos;
} | {
    status: "error";
    value: CelestialError;
};
```

<a id="core-CoreFunctionName"></a>

#### `CoreFunctionName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export type CoreFunctionName = "almuten" | "annualProfection" | "antiscion" | "approxHebrewYear" | "arabicPart" | "arabicPartsSeven" | "ascTransitUt" | "ayanamsa" | "ayanamsaEx" | "ayanamsaExUt" | "ayanamsaName" | "ayanamsaUt" | "azalt" | "azaltRev" | "bahaiHolyDays" | "bestTimeMethod" | "calc" | "calcChartAspects" | "calcChartAspectsAuto" | "calcMany" | "calcPctr" | "calcUt" | "calcUtMany" | "calendarRound" | "centisecToDegStr" | "centisecToLonlatStr" | "centisecToTimeStr" | "christianFeasts" | "christianFixedFeasts" | "close" | "coordTransform" | "coordTransformWithSpeed" | "copticMonthDays" | "copticToJd" | "csRoundSec" | "currentFileData" | "cycleNickname" | "dateConversion" | "dayOfWeek" | "dayOfYear" | "daysInHebrewYear" | "decanRuler" | "defaultOrb" | "degToCs" | "degsplit" | "deltat" | "deltatEx" | "diffCs" | "diffCsSigned" | "diffDeg" | "diffDegSigned" | "diffRadSigned" | "distanceToMc" | "dscTransitUt" | "easterGregorian" | "easterJd" | "easterJulian" | "easterOrthodox" | "easterOrthodoxJd" | "egyptianDecan" | "egyptianTermsRuler" | "elapsedDays" | "esbatsForYear" | "ethiopicToJd" | "fasliNowruzJd" | "firdaria" | "fixstar" | "fixstar2" | "fixstar2Mag" | "fixstar2Ut" | "fixstarMag" | "fixstarUt" | "formatCoord" | "fourPillars" | "fullDignity" | "gauquelinSector" | "geoToDms" | "getOrbitalElements" | "grandSolarEpoch" | "gregorianToHijriYears" | "gregorianToSolarHijri" | "haab" | "hebrewMonthDays" | "hebrewMonthStartJd" | "hebrewNewYearJd" | "hebrewYearFromJd" | "heliacalPhenoUt" | "heliacalUt" | "helioCross" | "helioCrossUt" | "hijriFromJd" | "hijriMonthDays" | "hijriMonthName" | "hijriMonthStartJd" | "hijriNewYearJd" | "hijriToJd" | "hinduFestivals" | "houseName" | "housePos" | "houseSystemChar" | "houseSystemId" | "houses" | "housesArmc" | "housesArmcEx2" | "housesEx" | "housesEx2" | "housesFromArmc" | "icTransitUt" | "isApplying" | "isBahaiLeapYear" | "isCopticLeapYear" | "isDayChart" | "isHebrewLeapYear" | "isHijriLeapYear" | "islamicObservances" | "islamicObservancesForJd" | "isoWeek" | "jdDuration" | "jdEtToUtc" | "jdToBahai" | "jdToCoptic" | "jdToEthiopic" | "jdToFasli" | "jdToHebrewDate" | "jdToIsoString" | "jdUtToUtc" | "jdnow" | "jewishHolidayJd" | "jewishHolidays" | "julday" | "karanaName" | "latToLmt" | "libraryPath" | "lmtToLat" | "localApparentSolarTime" | "lonToSign" | "longToNakshatra" | "longToNavamsa" | "longToRasi" | "losarJd" | "lowerMeridianTransitUt" | "lunEclipseHow" | "lunEclipseWhen" | "lunEclipseWhenLoc" | "lunOccultWhenGlob" | "lunOccultWhenLoc" | "lunOccultWhere" | "lunarReturnJd" | "makePillar" | "matchAspect" | "matchAspect2" | "matchAspect3" | "matchAspect4" | "mayaLongCount" | "mayaLongCountStr" | "mcTransitUt" | "meanObliquity" | "meanSiderealTimeDeg" | "meanSidtime" | "medicineWheelTotem" | "meridianTransitUt" | "midpoint" | "degMidp" | "midpointRad" | "midpointTable" | "monthlyProfection" | "monthsInHebrewYear" | "moonElongation" | "moonIllumination" | "moonPhase" | "moonPhaseAngle" | "moonPhaseInfo" | "moonPhasesForMonth" | "mooncross" | "mooncrossBackUt" | "mooncrossNode" | "mooncrossNodeUt" | "mooncrossUt" | "naisargakaRelation" | "nakshatraName" | "nawRuzJd" | "nextAspect" | "nextAspect2" | "nextAspectCusp" | "nextAspectCusp2" | "nextAspectWith" | "nextAspectWith2" | "nextEsbat" | "nextFirstQuarter" | "nextFullMoon" | "nextFullMoonAfter" | "nextFullMoonPhase" | "nextLastQuarter" | "nextNewMoon" | "nextNewMoonAfter" | "nextPrincipalPhase" | "nextRetro" | "nextSabbat" | "nodAps" | "nodApsUt" | "normCs" | "normDeg" | "normRad" | "nowruzJd" | "nutation" | "ochchabala" | "omerDayJd" | "omerDays" | "omerDeclaration" | "omerFromJd" | "omerPeriod" | "omerStartJd" | "orbitMaxMinTrueDistance" | "panchanga" | "parallacticAngle" | "parseCoord" | "parseDatetime" | "parseTime" | "pheno" | "phenoUt" | "planetConjunctMc" | "planetHouseNumber" | "planetName" | "planetOnMidpoint" | "ramanHouses" | "rasiDiff" | "rasiDiff2" | "rasiNorm" | "refrac" | "refracExtended" | "residentialStrength" | "retrogradeStationUt" | "revjul" | "revjulHms" | "riseTrans" | "riseTransTrueHor" | "sabbatJd" | "sabbatsForYear" | "sameSect" | "saturnFourStars" | "secondaryProgressions" | "setDeltaTUserdef" | "setEphePath" | "setJplFile" | "setLapseRate" | "setSidMode" | "setTidAcc" | "setTopo" | "sexagenaryName" | "siderealModeFlag" | "siderealModeId" | "siderealTimeDeg" | "sidtime" | "sidtime0" | "signExaltation" | "signIngressUt" | "signLord" | "signName" | "signRuler" | "signRulerModern" | "solEclipseHow" | "solEclipseWhenGlob" | "solEclipseWhenLoc" | "solEclipseWhere" | "solarArcDirections" | "solarCycle" | "solarHijriToGregorian" | "solarReturnJd" | "solarTermPosition" | "solcross" | "solcrossBackUt" | "solcrossUt" | "splitDeg" | "tatkalikaRelation" | "tibetanYearName" | "tidAcc" | "timeEqu" | "tonalpohualli" | "transitToDegree" | "triplicityRulers" | "trueObliquity" | "tryPanchanga" | "ttToUt" | "tzAbbrFind" | "tzolkin" | "uposathaDays" | "utcTimeZone" | "utcToJd" | "version" | "vesakJd" | "vietnameseChineseBoundaryDiffers" | "vietnameseMonthStartJd" | "vimshottariDasha" | "visLimitMag" | "weeksInIsoYear" | "wrapSigned180" | "xiuhpohualli" | "yallopQ" | "yearsDiff" | "zodiacSignName";
```

<a id="core-ExportedFunctionName"></a>

#### `ExportedFunctionName`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export type ExportedFunctionName = CoreFunctionName | "degnorm" | "difdeg2n" | "nextSabbatName";
```

<a id="core-InitInput"></a>

#### `InitInput`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;
```

<a id="core-SyncInitInput"></a>

#### `SyncInitInput`

Declaração: [pkg/celestial_wasm.d.ts](../pkg/celestial_wasm.d.ts).

```typescript
export type SyncInitInput = BufferSource | WebAssembly.Module;
```



## Relatórios coletivos

Importação: `celestial-wasm/reports`. **40 exports públicos**.

| Categoria | Exports |
| --- | ---: |
| Funções | 14 |
| Classes | 0 |
| Interfaces | 14 |
| Aliases de tipos | 5 |
| Constantes e variáveis | 7 |
| Enumerações | 0 |

### Funções (14)

[`astroReport`](#reports-astroReport) · [`compactReport`](#reports-compactReport) · [`createReportGenerator`](#reports-createReportGenerator) · [`getCatalog`](#reports-getCatalog) · [`renderAstroReportHTML`](#reports-renderAstroReportHTML) · [`renderAstroReportMarkdown`](#reports-renderAstroReportMarkdown) · [`renderAstroReportText`](#reports-renderAstroReportText) · [`renderCompactReportHTML`](#reports-renderCompactReportHTML) · [`renderCompactReportMarkdown`](#reports-renderCompactReportMarkdown) · [`renderCompactReportText`](#reports-renderCompactReportText) · [`renderReportHTML`](#reports-renderReportHTML) · [`renderReportMarkdown`](#reports-renderReportMarkdown) · [`renderReportText`](#reports-renderReportText) · [`resolveInterpretation`](#reports-resolveInterpretation)

<a id="reports-astroReport"></a>

#### `astroReport`

Declaração: [pkg/reports/astro.d.ts](../pkg/reports/astro.d.ts).

```typescript
/** Versioned prose composed locally from selected calculated events, without a language-model service. */
export declare function astroReport(report: AstrologyReport, options?: AstroReportOptions): AstroReport;
```

<a id="reports-compactReport"></a>

#### `compactReport`

Declaração: [pkg/reports/compact.d.ts](../pkg/reports/compact.d.ts).

```typescript
/** A small editorial view of an existing report; full events remain available in the source report. */
export declare function compactReport(report: AstrologyReport, options?: CompactReportOptions): CompactAstrologyReport;
```

<a id="reports-createReportGenerator"></a>

#### `createReportGenerator`

Declaração: [pkg/reports/report.d.ts](../pkg/reports/report.d.ts).

```typescript
/** Own caches belong to one WASM instance; callers must clear after changing its calculation configuration. */
export declare function createReportGenerator(core: ReportWasmApi, options?: {
    cacheSize?: number;
}): {
    report: (input: ReportInput) => AstrologyReport;
    reportCompact: (input: ReportInput, options?: CompactReportOptions) => CompactAstrologyReport;
    reportAstro: (input: ReportInput, options?: AstroReportOptions) => AstroReport;
    reportAstroText(input: ReportInput, options?: AstroReportOptions): string;
    reportAstroHTML(input: ReportInput, options?: AstroReportOptions): string;
    reportAstroMarkdown(input: ReportInput, options?: AstroReportOptions): string;
    reportCompactText(input: ReportInput, options?: CompactReportOptions): string;
    reportCompactHTML(input: ReportInput, options?: CompactReportOptions): string;
    reportCompactMarkdown(input: ReportInput, options?: CompactReportOptions): string;
    reportText(input: ReportInput, textOptions?: ReportTextOptions): string;
    reportHTML(input: ReportInput, options?: ReportTextOptions): string;
    reportMarkdown(input: ReportInput, options?: ReportTextOptions): string;
    reportJSON(input: ReportInput, space?: number): string;
    clearCache(): void;
    readonly cacheStats: {
        astro: {
            size: number;
            capacity: number;
            hits: number;
            misses: number;
            bytes: number;
            maxBytes: number;
        };
        astroRendered: {
            size: number;
            capacity: number;
            hits: number;
            misses: number;
            bytes: number;
            maxBytes: number;
        };
        compact: {
            size: number;
            capacity: number;
            hits: number;
            misses: number;
            bytes: number;
            maxBytes: number;
        };
        compactRendered: {
            size: number;
            capacity: number;
            hits: number;
            misses: number;
            bytes: number;
            maxBytes: number;
        };
        reports: {
            size: number;
            capacity: number;
            hits: number;
            misses: number;
            bytes: number;
            maxBytes: number;
        };
        events: {
            size: number;
            capacity: number;
            hits: number;
            misses: number;
            bytes: number;
            maxBytes: number;
        };
        samples: {
            size: number;
            capacity: number;
            hits: number;
            misses: number;
            bytes: number;
            maxBytes: number;
        };
        serialized: {
            size: number;
            capacity: number;
            hits: number;
            misses: number;
            bytes: number;
            maxBytes: number;
        };
        rendered: {
            size: number;
            capacity: number;
            hits: number;
            misses: number;
            bytes: number;
            maxBytes: number;
        };
    };
};
```

<a id="reports-getCatalog"></a>

#### `getCatalog`

Declaração: [pkg/reports/catalog.d.ts](../pkg/reports/catalog.d.ts).

```typescript
/** Resolved combinations are composed from individually authored complete paragraphs. */
export declare function getCatalog(): ResolvedInterpretation[];
```

<a id="reports-renderAstroReportHTML"></a>

#### `renderAstroReportHTML`

Declaração: [pkg/reports/markup.d.ts](../pkg/reports/markup.d.ts).

```typescript
export declare function renderAstroReportHTML(report: AstroReport): string;
```

<a id="reports-renderAstroReportMarkdown"></a>

#### `renderAstroReportMarkdown`

Declaração: [pkg/reports/markup.d.ts](../pkg/reports/markup.d.ts).

```typescript
export declare function renderAstroReportMarkdown(report: AstroReport): string;
```

<a id="reports-renderAstroReportText"></a>

#### `renderAstroReportText`

Declaração: [pkg/reports/astro.d.ts](../pkg/reports/astro.d.ts).

```typescript
export declare function renderAstroReportText(report: AstroReport): string;
```

<a id="reports-renderCompactReportHTML"></a>

#### `renderCompactReportHTML`

Declaração: [pkg/reports/markup.d.ts](../pkg/reports/markup.d.ts).

```typescript
export declare function renderCompactReportHTML(report: CompactAstrologyReport): string;
```

<a id="reports-renderCompactReportMarkdown"></a>

#### `renderCompactReportMarkdown`

Declaração: [pkg/reports/markup.d.ts](../pkg/reports/markup.d.ts).

```typescript
export declare function renderCompactReportMarkdown(report: CompactAstrologyReport): string;
```

<a id="reports-renderCompactReportText"></a>

#### `renderCompactReportText`

Declaração: [pkg/reports/compact.d.ts](../pkg/reports/compact.d.ts).

```typescript
export declare function renderCompactReportText(report: CompactAstrologyReport): string;
```

<a id="reports-renderReportHTML"></a>

#### `renderReportHTML`

Declaração: [pkg/reports/markup.d.ts](../pkg/reports/markup.d.ts).

```typescript
/** Basic HTML fragment with sections and escaped text, without styles or scripts. */
export declare function renderReportHTML(report: AstrologyReport, options?: ReportTextOptions): string;
```

<a id="reports-renderReportMarkdown"></a>

#### `renderReportMarkdown`

Declaração: [pkg/reports/markup.d.ts](../pkg/reports/markup.d.ts).

```typescript
/** Markdown headings and paragraphs; report contents are treated as literal text. */
export declare function renderReportMarkdown(report: AstrologyReport, options?: ReportTextOptions): string;
```

<a id="reports-renderReportText"></a>

#### `renderReportText`

Declaração: [pkg/reports/text.d.ts](../pkg/reports/text.d.ts).

```typescript
/** Render every report event in chronological order, with source-authored Portuguese templates. */
export declare function renderReportText(report: AstrologyReport, options?: ReportTextOptions): string;
```

<a id="reports-resolveInterpretation"></a>

#### `resolveInterpretation`

Declaração: [pkg/reports/catalog.d.ts](../pkg/reports/catalog.d.ts).

```typescript
export declare function resolveInterpretation(key: string): ResolvedInterpretation;
```


### Interfaces (14)

[`AstroPassage`](#reports-AstroPassage) · [`AstroReport`](#reports-AstroReport) · [`AstroReportOptions`](#reports-AstroReportOptions) · [`AstrologyReport`](#reports-AstrologyReport) · [`CompactAstrologyReport`](#reports-CompactAstrologyReport) · [`CompactHighlight`](#reports-CompactHighlight) · [`CompactReportOptions`](#reports-CompactReportOptions) · [`DetectionRequest`](#reports-DetectionRequest) · [`DomainSummary`](#reports-DomainSummary) · [`ReportEntry`](#reports-ReportEntry) · [`ReportEvent`](#reports-ReportEvent) · [`ReportInput`](#reports-ReportInput) · [`ReportTextOptions`](#reports-ReportTextOptions) · [`ResolvedInterpretation`](#reports-ResolvedInterpretation)

<a id="reports-AstroPassage"></a>

#### `AstroPassage`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export interface AstroPassage {
    /** Chronological anchor, not a claim that an influence begins here. */
    at: string;
    background: boolean;
    eventIds: string[];
    interpretationKeys: string[];
    sourceKeys: string[];
    exact: string[];
    paragraphs: string[];
}
```

<a id="reports-AstroReport"></a>

#### `AstroReport`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export interface AstroReport {
    version: string;
    editorialVersion: string;
    sourceReportVersion: string;
    catalogVersion: string;
    locale: 'pt-BR';
    style: 'astro';
    kind: 'day' | 'month' | 'period';
    range: AstrologyReport['range'];
    title: string;
    overview: string;
    passages: AstroPassage[];
    selection: {
        totalEvents: number;
        selectedEvents: number;
        omittedEvents: number;
        maxEvents: number;
        policy: string;
    };
    disclaimer: string;
}
```

<a id="reports-AstroReportOptions"></a>

#### `AstroReportOptions`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export interface AstroReportOptions {
    /** Source events to select: 1–32; defaults to four for a day and eighteen otherwise. */
    maxEvents?: number;
}
```

<a id="reports-AstrologyReport"></a>

#### `AstrologyReport`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export interface AstrologyReport {
    version: string;
    locale: 'pt-BR';
    reference: 'western-tropical-geocentric';
    scope: 'collective-psychological';
    range: {
        start: string;
        endExclusive: string;
        timeZone: string;
    };
    calculation: {
        bodies: ReportBody[];
        orbs: Record<AspectAngle, number>;
    };
    catalogVersion: string;
    disclaimer: string;
    methodology: string;
    interpretations: Record<string, ResolvedInterpretation>;
    entries: ReportEntry[];
    summaries: Record<ReportDomain, DomainSummary>;
}
```

<a id="reports-CompactAstrologyReport"></a>

#### `CompactAstrologyReport`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export interface CompactAstrologyReport {
    version: string;
    catalogVersion: string;
    sourceReportVersion: string;
    locale: 'pt-BR';
    kind: 'day' | 'month' | 'period';
    range: AstrologyReport['range'];
    overview: string;
    highlights: CompactHighlight[];
    domains: {
        domain: ReportDomain;
        text: string;
        eventIds: string[];
        interpretationKeys: string[];
    }[];
    interpretations: Record<string, {
        key: string;
        title: string;
        sourceKeys: string[];
    }>;
    selection: {
        totalEvents: number;
        selectedEvents: number;
        omittedEvents: number;
        maxHighlights: number;
        policy: string;
    };
    disclaimer: string;
}
```

<a id="reports-CompactHighlight"></a>

#### `CompactHighlight`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export interface CompactHighlight {
    eventIds: string[];
    interpretationKey: string;
    title: string;
    text: string;
    timing: string;
    exact: string[];
    background: boolean;
}
```

<a id="reports-CompactReportOptions"></a>

#### `CompactReportOptions`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export interface CompactReportOptions {
    /** Five practical domains by default; general overview is always included. */
    domains?: 'all' | 'none' | readonly ReportDomain[];
    /** Defaults to three for a local day and five for longer periods. */
    maxHighlights?: number;
}
```

<a id="reports-DetectionRequest"></a>

#### `DetectionRequest`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export interface DetectionRequest {
    startMs: number;
    endMs: number;
    bodies: readonly ReportBody[];
    orbs: Record<AspectAngle, number>;
}
```

<a id="reports-DomainSummary"></a>

#### `DomainSummary`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export interface DomainSummary {
    domain: ReportDomain;
    text: string;
    eventIds: string[];
    highlightCatalogKeys: string[];
    contributions: {
        eventIds: string[];
        catalogKey: string;
        durationWithinRangeDays: number;
    }[];
}
```

<a id="reports-ReportEntry"></a>

#### `ReportEntry`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export interface ReportEntry {
    event: ReportEvent;
    interpretationKey: string;
    fullDurationDays: number | null;
    durationWithinRangeDays: number;
}
```

<a id="reports-ReportEvent"></a>

#### `ReportEvent`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export interface ReportEvent {
    id: string;
    kind: 'aspect' | 'sign' | 'station' | 'retrograde' | 'phase' | 'eclipse';
    catalogKey: string;
    bodies: ReportBody[];
    start: string;
    end: string;
    exact: string[];
    details: Record<string, string | number | boolean>;
    boundary: {
        startClipped: boolean;
        endClipped: boolean;
    };
}
```

<a id="reports-ReportInput"></a>

#### `ReportInput`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
/** Date-only end is inclusive; an offset-bearing instant end is exclusive. Never mix the forms. */
export interface ReportInput {
    start: string;
    end: string;
    timeZone?: string;
    bodies?: readonly ReportBody[];
    orbs?: Partial<Record<AspectAngle, number>>;
}
```

<a id="reports-ReportTextOptions"></a>

#### `ReportTextOptions`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export interface ReportTextOptions {
    /** Defaults to general; use all for all six editorial domains. */
    domains?: 'all' | readonly ReportDomain[];
}
```

<a id="reports-ResolvedInterpretation"></a>

#### `ResolvedInterpretation`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export interface ResolvedInterpretation extends DomainText {
    key: string;
    title: string;
    sourceKeys: string[];
}
```

### Aliases de tipos (5)

[`AspectAngle`](#reports-AspectAngle) · [`DomainText`](#reports-DomainText) · [`ReportBody`](#reports-ReportBody) · [`ReportDomain`](#reports-ReportDomain) · [`ReportWasmApi`](#reports-ReportWasmApi)

<a id="reports-AspectAngle"></a>

#### `AspectAngle`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export type AspectAngle = 0 | 60 | 90 | 120 | 180;
```

<a id="reports-DomainText"></a>

#### `DomainText`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export type DomainText = Record<ReportDomain, string>;
```

<a id="reports-ReportBody"></a>

#### `ReportBody`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export type ReportBody = typeof REPORT_BODIES[number];
```

<a id="reports-ReportDomain"></a>

#### `ReportDomain`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export type ReportDomain = typeof REPORT_DOMAINS[number];
```

<a id="reports-ReportWasmApi"></a>

#### `ReportWasmApi`

Declaração: [pkg/reports/events.d.ts](../pkg/reports/events.d.ts).

```typescript
export type ReportWasmApi = Pick<typeof import('../celestial_wasm.js'), 'constants' | 'calcUtMany' | 'setDeltaTUserdef'>;
```

### Constantes e variáveis (7)

[`ASTRO_REPORT_VERSION`](#reports-ASTRO_REPORT_VERSION) · [`CATALOG_VERSION`](#reports-CATALOG_VERSION) · [`COMPACT_REPORT_VERSION`](#reports-COMPACT_REPORT_VERSION) · [`DEFAULT_ORBS`](#reports-DEFAULT_ORBS) · [`REPORT_BODIES`](#reports-REPORT_BODIES) · [`REPORT_DOMAINS`](#reports-REPORT_DOMAINS) · [`REPORT_VERSION`](#reports-REPORT_VERSION)

<a id="reports-ASTRO_REPORT_VERSION"></a>

#### `ASTRO_REPORT_VERSION`

Declaração: [pkg/reports/astro.d.ts](../pkg/reports/astro.d.ts).

```typescript
export declare const ASTRO_REPORT_VERSION = "1.0.0";
```

<a id="reports-CATALOG_VERSION"></a>

#### `CATALOG_VERSION`

Declaração: [pkg/reports/catalog.d.ts](../pkg/reports/catalog.d.ts).

```typescript
export declare const CATALOG_VERSION: string;
```

<a id="reports-COMPACT_REPORT_VERSION"></a>

#### `COMPACT_REPORT_VERSION`

Declaração: [pkg/reports/compact.d.ts](../pkg/reports/compact.d.ts).

```typescript
export declare const COMPACT_REPORT_VERSION = "1.0.0";
```

<a id="reports-DEFAULT_ORBS"></a>

#### `DEFAULT_ORBS`

Declaração: [pkg/reports/range.d.ts](../pkg/reports/range.d.ts).

```typescript
export declare const DEFAULT_ORBS: Readonly<Record<AspectAngle, number>>;
```

<a id="reports-REPORT_BODIES"></a>

#### `REPORT_BODIES`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export declare const REPORT_BODIES: readonly [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto"
];
```

<a id="reports-REPORT_DOMAINS"></a>

#### `REPORT_DOMAINS`

Declaração: [pkg/reports/types.d.ts](../pkg/reports/types.d.ts).

```typescript
export declare const REPORT_DOMAINS: readonly [
    "general",
    "health",
    "relationships",
    "finance",
    "work",
    "family"
];
```

<a id="reports-REPORT_VERSION"></a>

#### `REPORT_VERSION`

Declaração: [pkg/reports/report.d.ts](../pkg/reports/report.d.ts).

```typescript
export declare const REPORT_VERSION = "1.0.0";
```


## Gráficos SVG

Importação: `celestial-wasm/charts`. **51 exports públicos**.

| Categoria | Exports |
| --- | ---: |
| Funções | 20 |
| Classes | 1 |
| Interfaces | 14 |
| Aliases de tipos | 15 |
| Constantes e variáveis | 1 |
| Enumerações | 0 |

### Funções (20)

[`createChartCalculator`](#charts-createChartCalculator) · [`getMessages`](#charts-getMessages) · [`getTheme`](#charts-getTheme) · [`layoutPlanetLabels`](#charts-layoutPlanetLabels) · [`normalizeAngle`](#charts-normalizeAngle) · [`pointAt`](#charts-pointAt) · [`renderAspectMatrix`](#charts-renderAspectMatrix) · [`renderAspectMatrixSvg`](#charts-renderAspectMatrixSvg) · [`renderAspectsSvg`](#charts-renderAspectsSvg) · [`renderAspectsTable`](#charts-renderAspectsTable) · [`renderChartBundle`](#charts-renderChartBundle) · [`renderChartSvg`](#charts-renderChartSvg) · [`renderGlyph`](#charts-renderGlyph) · [`renderHousesSvg`](#charts-renderHousesSvg) · [`renderHousesTable`](#charts-renderHousesTable) · [`renderPositionsSvg`](#charts-renderPositionsSvg) · [`renderPositionsTable`](#charts-renderPositionsTable) · [`renderTablesSvg`](#charts-renderTablesSvg) · [`renderWheelSvg`](#charts-renderWheelSvg) · [`resolveTheme`](#charts-resolveTheme)

<a id="charts-createChartCalculator"></a>

#### `createChartCalculator`

Declaração: [pkg/charts/calculate.d.ts](../pkg/charts/calculate.d.ts).

```typescript
/** The injected WASM instance belongs to this calculator; every calculation selects automatic ΔT. */
export declare function createChartCalculator(api: ChartWasmApi): ChartCalculator;
```

<a id="charts-getMessages"></a>

#### `getMessages`

Declaração: [pkg/charts/locales.d.ts](../pkg/charts/locales.d.ts).

```typescript
export declare function getMessages(locale?: ChartLocale): ChartMessages;
```

<a id="charts-getTheme"></a>

#### `getTheme`

Declaração: [pkg/charts/themes.d.ts](../pkg/charts/themes.d.ts).

```typescript
/** Resolve a layout and fresh palette. Every layout defaults to light, including midnight. */
export declare function getTheme(id?: ThemeId, colors?: ThemeColorSelection): ChartTheme;
```

<a id="charts-layoutPlanetLabels"></a>

#### `layoutPlanetLabels`

Declaração: [pkg/charts/geometry.d.ts](../pkg/charts/geometry.d.ts).

```typescript
/** Move only labels. The wheel markers and aspect endpoints retain exact longitude. */
export declare function layoutPlanetLabels(bodies: readonly {
    id: number;
    longitude: number;
}[], minGap?: number): PlanetLabel[];
```

<a id="charts-normalizeAngle"></a>

#### `normalizeAngle`

Declaração: [pkg/charts/geometry.d.ts](../pkg/charts/geometry.d.ts).

```typescript
export declare function normalizeAngle(angle: number): number;
```

<a id="charts-pointAt"></a>

#### `pointAt`

Declaração: [pkg/charts/geometry.d.ts](../pkg/charts/geometry.d.ts).

```typescript
export declare function pointAt(longitude: number, rotation: number, cx: number, cy: number, radius: number): {
    x: number;
    y: number;
};
```

<a id="charts-renderAspectMatrix"></a>

#### `renderAspectMatrix`

Declaração: [pkg/charts/tables.d.ts](../pkg/charts/tables.d.ts).

```typescript
export declare function renderAspectMatrix(data: ChartData, options?: TableOptions): TableFragment;
```

<a id="charts-renderAspectMatrixSvg"></a>

#### `renderAspectMatrixSvg`

Declaração: [pkg/charts/render.d.ts](../pkg/charts/render.d.ts).

```typescript
export declare function renderAspectMatrixSvg(data: ChartData, options?: RenderOptions): string;
```

<a id="charts-renderAspectsSvg"></a>

#### `renderAspectsSvg`

Declaração: [pkg/charts/render.d.ts](../pkg/charts/render.d.ts).

```typescript
export declare function renderAspectsSvg(data: ChartData, options?: RenderOptions): string;
```

<a id="charts-renderAspectsTable"></a>

#### `renderAspectsTable`

Declaração: [pkg/charts/tables.d.ts](../pkg/charts/tables.d.ts).

```typescript
export declare function renderAspectsTable(data: ChartData, options?: TableOptions): TableFragment;
```

<a id="charts-renderChartBundle"></a>

#### `renderChartBundle`

Declaração: [pkg/charts/render.d.ts](../pkg/charts/render.d.ts).

```typescript
export declare function renderChartBundle(data: ChartData, options?: RenderOptions): ChartSvgBundle;
```

<a id="charts-renderChartSvg"></a>

#### `renderChartSvg`

Declaração: [pkg/charts/render.d.ts](../pkg/charts/render.d.ts).

```typescript
/** A complete vector composition. All styles share identical astronomical data. */
export declare function renderChartSvg(data: ChartData, options?: RenderOptions): string;
```

<a id="charts-renderGlyph"></a>

#### `renderGlyph`

Declaração: [pkg/charts/glyphs.d.ts](../pkg/charts/glyphs.d.ts).

```typescript
/** A centered, font-independent SVG group. Sign indices are zero-based. */
export declare function renderGlyph(category: GlyphCategory, key: string | number, x: number, y: number, size: number, color: string): string;
```

<a id="charts-renderHousesSvg"></a>

#### `renderHousesSvg`

Declaração: [pkg/charts/render.d.ts](../pkg/charts/render.d.ts).

```typescript
export declare function renderHousesSvg(data: ChartData, options?: RenderOptions): string | undefined;
```

<a id="charts-renderHousesTable"></a>

#### `renderHousesTable`

Declaração: [pkg/charts/tables.d.ts](../pkg/charts/tables.d.ts).

```typescript
export declare function renderHousesTable(data: ChartData, options?: TableOptions): TableFragment;
```

<a id="charts-renderPositionsSvg"></a>

#### `renderPositionsSvg`

Declaração: [pkg/charts/render.d.ts](../pkg/charts/render.d.ts).

```typescript
export declare function renderPositionsSvg(data: ChartData, options?: RenderOptions): string;
```

<a id="charts-renderPositionsTable"></a>

#### `renderPositionsTable`

Declaração: [pkg/charts/tables.d.ts](../pkg/charts/tables.d.ts).

```typescript
/** Body positions use actual calculated longitudes; planetary charts omit houses. */
export declare function renderPositionsTable(data: ChartData, options?: TableOptions): TableFragment;
```

<a id="charts-renderTablesSvg"></a>

#### `renderTablesSvg`

Declaração: [pkg/charts/render.d.ts](../pkg/charts/render.d.ts).

```typescript
export declare function renderTablesSvg(data: ChartData, options?: RenderOptions): string;
```

<a id="charts-renderWheelSvg"></a>

#### `renderWheelSvg`

Declaração: [pkg/charts/render.d.ts](../pkg/charts/render.d.ts).

```typescript
export declare function renderWheelSvg(data: ChartData, options?: RenderOptions): string;
```

<a id="charts-resolveTheme"></a>

#### `resolveTheme`

Declaração: [pkg/charts/themes.d.ts](../pkg/charts/themes.d.ts).

```typescript
/** Accept a layout name or an already resolved theme; an explicit selection overrides its colors. */
export declare function resolveTheme(theme?: ThemeId | ChartTheme, colors?: ThemeColorSelection): ChartTheme;
```

### Classes (1)

[`ChartError`](#charts-ChartError)

<a id="charts-ChartError"></a>

#### `ChartError`

Declaração: [pkg/charts/locales.d.ts](../pkg/charts/locales.d.ts).

```typescript
export declare class ChartError extends Error {
    readonly code: ChartErrorCode;
    constructor(code: ChartErrorCode, locale?: ChartLocale, options?: ErrorOptions);
}
```

### Interfaces (14)

[`BodyPosition`](#charts-BodyPosition) · [`CalculationOptions`](#charts-CalculationOptions) · [`ChartAspect`](#charts-ChartAspect) · [`ChartCalculator`](#charts-ChartCalculator) · [`ChartData`](#charts-ChartData) · [`ChartHouses`](#charts-ChartHouses) · [`ChartLocation`](#charts-ChartLocation) · [`ChartSvgBundle`](#charts-ChartSvgBundle) · [`ChartTheme`](#charts-ChartTheme) · [`RenderOptions`](#charts-RenderOptions) · [`TableFragment`](#charts-TableFragment) · [`TableOptions`](#charts-TableOptions) · [`ThemeColors`](#charts-ThemeColors) · [`ThemeDefinition`](#charts-ThemeDefinition)

<a id="charts-BodyPosition"></a>

#### `BodyPosition`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export interface BodyPosition {
    id: number;
    key: BodyKey;
    longitude: number;
    latitude: number;
    distance: number;
    speedLongitude: number;
    retrograde: boolean;
    sign: ZodiacSign;
    degreeInSign: number;
    house?: HouseNumber;
}
```

<a id="charts-CalculationOptions"></a>

#### `CalculationOptions`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export interface CalculationOptions {
    locale?: ChartLocale;
    bodies?: readonly BodyKey[];
    houseSystem?: HouseSystem;
}
```

<a id="charts-ChartAspect"></a>

#### `ChartAspect`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export interface ChartAspect {
    body1: number;
    body2: number;
    angle: AspectAngle;
    orb: number;
    applying: boolean;
}
```

<a id="charts-ChartCalculator"></a>

#### `ChartCalculator`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export interface ChartCalculator {
    natal(input: NatalChartInput): ChartData;
    planetary(input: PlanetaryChartInput): ChartData;
}
```

<a id="charts-ChartData"></a>

#### `ChartData`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export interface ChartData {
    kind: ChartKind;
    instant: string;
    displayDateTime: string;
    timeZone: string;
    location?: ChartLocation;
    julianDay: number;
    bodies: BodyPosition[];
    houses?: ChartHouses;
    aspects: ChartAspect[];
    elements: Record<ElementKey, number>;
}
```

<a id="charts-ChartHouses"></a>

#### `ChartHouses`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export interface ChartHouses {
    cusps: HouseCusps;
    ascendant: number;
    midheaven: number;
    system: HouseSystem;
}
```

<a id="charts-ChartLocation"></a>

#### `ChartLocation`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export interface ChartLocation {
    label?: string;
    latitude: number;
    longitude: number;
}
```

<a id="charts-ChartSvgBundle"></a>

#### `ChartSvgBundle`

Declaração: [pkg/charts/render.d.ts](../pkg/charts/render.d.ts).

```typescript
export interface ChartSvgBundle {
    chart: string;
    wheel: string;
    tables: string;
    positions: string;
    houses?: string;
    aspects: string;
    aspectList: string;
}
```

<a id="charts-ChartTheme"></a>

#### `ChartTheme`

Declaração: [pkg/charts/themes.d.ts](../pkg/charts/themes.d.ts).

```typescript
export interface ChartTheme extends ThemeMetadata {
    colors: ThemeColors;
    mode: ColorMode | 'custom';
}
```

<a id="charts-RenderOptions"></a>

#### `RenderOptions`

Declaração: [pkg/charts/render.d.ts](../pkg/charts/render.d.ts).

```typescript
export interface RenderOptions {
    theme?: ThemeId;
    colors?: ThemeColorSelection;
    locale?: ChartLocale;
    title?: string;
    idPrefix?: string;
}
```

<a id="charts-TableFragment"></a>

#### `TableFragment`

Declaração: [pkg/charts/tables.d.ts](../pkg/charts/tables.d.ts).

```typescript
export interface TableFragment {
    svg: string;
    width: number;
    height: number;
}
```

<a id="charts-TableOptions"></a>

#### `TableOptions`

Declaração: [pkg/charts/tables.d.ts](../pkg/charts/tables.d.ts).

```typescript
export interface TableOptions {
    theme?: ThemeId | ChartTheme;
    colors?: 'light' | 'dark' | ThemeColors;
    locale?: ChartLocale;
    x?: number;
    y?: number;
    width?: number;
}
```

<a id="charts-ThemeColors"></a>

#### `ThemeColors`

Declaração: [pkg/charts/themes.d.ts](../pkg/charts/themes.d.ts).

```typescript
/** Literal SVG colors; background is a suggested host background, never an SVG fill. */
export interface ThemeColors {
    background: string;
    foreground: string;
    muted: string;
    line: string;
    surface: string;
    accent: string;
    secondary: string;
    elements: [
        string,
        string,
        string,
        string
    ];
    aspects: Record<AspectAngle, string>;
}
```

<a id="charts-ThemeDefinition"></a>

#### `ThemeDefinition`

Declaração: [pkg/charts/themes.d.ts](../pkg/charts/themes.d.ts).

```typescript
export interface ThemeDefinition extends ThemeMetadata {
    palettes: Record<ColorMode, ThemeColors>;
}
```

### Aliases de tipos (15)

[`AspectAngle`](#charts-AspectAngle) · [`BodyKey`](#charts-BodyKey) · [`ChartKind`](#charts-ChartKind) · [`ChartLocale`](#charts-ChartLocale) · [`ColorMode`](#charts-ColorMode) · [`DateTimeInput`](#charts-DateTimeInput) · [`ElementKey`](#charts-ElementKey) · [`HouseCusps`](#charts-HouseCusps) · [`HouseNumber`](#charts-HouseNumber) · [`HouseSystem`](#charts-HouseSystem) · [`NatalChartInput`](#charts-NatalChartInput) · [`PlanetaryChartInput`](#charts-PlanetaryChartInput) · [`ThemeColorSelection`](#charts-ThemeColorSelection) · [`ThemeId`](#charts-ThemeId) · [`ZodiacSign`](#charts-ZodiacSign)

<a id="charts-AspectAngle"></a>

#### `AspectAngle`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export type AspectAngle = 0 | 60 | 90 | 120 | 180;
```

<a id="charts-BodyKey"></a>

#### `BodyKey`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export type BodyKey = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto' | 'trueNode' | 'chiron';
```

<a id="charts-ChartKind"></a>

#### `ChartKind`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export type ChartKind = 'natal' | 'planetary';
```

<a id="charts-ChartLocale"></a>

#### `ChartLocale`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export type ChartLocale = 'pt-BR' | 'en';
```

<a id="charts-ColorMode"></a>

#### `ColorMode`

Declaração: [pkg/charts/themes.d.ts](../pkg/charts/themes.d.ts).

```typescript
export type ColorMode = 'light' | 'dark';
```

<a id="charts-DateTimeInput"></a>

#### `DateTimeInput`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export type DateTimeInput = {
    instant: string;
    timeZone?: string;
    date?: never;
    time?: never;
} | {
    date: string;
    time: string;
    timeZone: string;
    instant?: never;
};
```

<a id="charts-ElementKey"></a>

#### `ElementKey`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export type ElementKey = 'fire' | 'earth' | 'air' | 'water';
```

<a id="charts-HouseCusps"></a>

#### `HouseCusps`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export type HouseCusps = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
];
```

<a id="charts-HouseNumber"></a>

#### `HouseNumber`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
```

<a id="charts-HouseSystem"></a>

#### `HouseSystem`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export type HouseSystem = 'P' | 'W' | 'E';
```

<a id="charts-NatalChartInput"></a>

#### `NatalChartInput`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export type NatalChartInput = DateTimeInput & CalculationOptions & {
    location: ChartLocation;
};
```

<a id="charts-PlanetaryChartInput"></a>

#### `PlanetaryChartInput`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export type PlanetaryChartInput = DateTimeInput & CalculationOptions & {
    location?: ChartLocation;
};
```

<a id="charts-ThemeColorSelection"></a>

#### `ThemeColorSelection`

Declaração: [pkg/charts/themes.d.ts](../pkg/charts/themes.d.ts).

```typescript
export type ThemeColorSelection = ColorMode | ThemeColors;
```

<a id="charts-ThemeId"></a>

#### `ThemeId`

Declaração: [pkg/charts/themes.d.ts](../pkg/charts/themes.d.ts).

```typescript
export type ThemeId = 'editorial' | 'midnight' | 'botanical' | 'prism' | 'atlas' | 'minimal';
```

<a id="charts-ZodiacSign"></a>

#### `ZodiacSign`

Declaração: [pkg/charts/types.d.ts](../pkg/charts/types.d.ts).

```typescript
export type ZodiacSign = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
```

### Constantes e variáveis (1)

[`THEMES`](#charts-THEMES)

<a id="charts-THEMES"></a>

#### `THEMES`

Declaração: [pkg/charts/themes.d.ts](../pkg/charts/themes.d.ts).

```typescript
/** Layout metadata and immutable presets; resolve a palette with getTheme(). */
export declare const THEMES: readonly ThemeDefinition[];
```

### Tipos de apoio (7)

Tipos referenciados nas assinaturas públicas, sem reexport direto pelo subpath.

<a id="charts-ChartErrorCode"></a>

#### `ChartErrorCode`

Declaração: [pkg/charts/locales.d.ts](../pkg/charts/locales.d.ts).

```typescript
export type ChartErrorCode = 'invalidDate' | 'invalidTime' | 'invalidInstant' | 'invalidDateTime' | 'unknownTimeZone' | 'ambiguousTime' | 'nonexistentTime' | 'invalidLocation' | 'invalidBodies' | 'invalidHouseSystem' | 'invalidLocale' | 'calculationFailed';
```

<a id="charts-ChartMessages"></a>

#### `ChartMessages`

Declaração: [pkg/charts/locales.d.ts](../pkg/charts/locales.d.ts).

```typescript
export interface ChartMessages {
    labels: Record<'natal' | 'planetary' | 'instant' | 'dateTime' | 'timeZone' | 'location' | 'latitude' | 'longitude' | 'julianDay' | 'planet' | 'sign' | 'degree' | 'distance' | 'speed' | 'retrograde' | 'house' | 'aspect' | 'orb' | 'applying' | 'separating' | 'elements' | 'element' | 'positions' | 'houses' | 'aspectMatrix' | 'aspectsTable' | 'noAspects' | 'retrogradeShort' | 'directShort' | 'cusp' | 'body1' | 'body2', string>;
    bodies: Record<BodyKey, string>;
    signs: readonly [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
    ];
    aspects: Record<AspectAngle, string>;
    elements: Record<ElementKey, string>;
    errors: Record<ChartErrorCode, string>;
}
```

<a id="charts-ChartWasmApi"></a>

#### `ChartWasmApi`

Declaração: [pkg/charts/calculate.d.ts](../pkg/charts/calculate.d.ts).

```typescript
export type ChartWasmApi = Pick<typeof import('../celestial_wasm.js'), 'constants' | 'julday' | 'calcUtMany' | 'houses' | 'normDeg' | 'lonToSign' | 'planetHouseNumber' | 'calcChartAspectsAuto' | 'setDeltaTUserdef'>;
```

<a id="charts-GlyphCategory"></a>

#### `GlyphCategory`

Declaração: [pkg/charts/glyphs.d.ts](../pkg/charts/glyphs.d.ts).

```typescript
export type GlyphCategory = 'body' | 'sign' | 'aspect';
```

<a id="charts-Localized"></a>

#### `Localized`

Declaração: [pkg/charts/themes.d.ts](../pkg/charts/themes.d.ts).

```typescript
type Localized = Record<ChartLocale, string>;
```

<a id="charts-PlanetLabel"></a>

#### `PlanetLabel`

Declaração: [pkg/charts/geometry.d.ts](../pkg/charts/geometry.d.ts).

```typescript
export interface PlanetLabel {
    id: number;
    longitude: number;
    labelLongitude: number;
}
```

<a id="charts-ThemeMetadata"></a>

#### `ThemeMetadata`

Declaração: [pkg/charts/themes.d.ts](../pkg/charts/themes.d.ts).

```typescript
interface ThemeMetadata {
    id: ThemeId;
    label: Localized;
    description: Localized;
    layout: ThemeId;
    font: string;
    headingFont: string;
    ring: 'sectors' | 'band' | 'ticks';
}
```

