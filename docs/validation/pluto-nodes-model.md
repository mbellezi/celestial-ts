# Pluto and lunar nodes: current models and measured Swiss fidelity

The apparent geocentric calculation for Pluto in 1930–2040 uses an explicit
Swiss-derived Cartesian ephemeris followed by the built-in apparent-position
pipeline. The true lunar node uses a separate Swiss-derived table. These are
versioned representations of Swiss Ephemeris, not independent lunar or planetary
theories. Runtime evaluation requires no Swiss installation or network access.
The previous model description and its measurements are preserved in
[pluto-nodes-model-before-deflection.md](pluto-nodes-model-before-deflection.md).

## Pluto

`precision_ephemeris.rs` evaluates degree-18 Chebyshev polynomials for geocentric
Cartesian coordinates in AU, referred to the mean ecliptic and equinox of date,
with TT as the time argument. Pluto has 1,269 segments of 32 days, from
JD TT 2425960.5 through 2466568.5, padding the supported 1930–2040 interval.
The same binary also contains Moon, Mercury and Neptune states, with body-specific
segment lengths and preprocessing flags.

Pluto's sampled Swiss states retain light time and disable annual aberration,
solar gravitational deflection and nutation. The built-in pipeline applies
finite-source-distance solar deflection, the effective solar mass profile for
rays inside the solar disk, observer-velocity annual aberration, and nutation.
It then forms equatorial coordinates when requested. Ecliptic longitude speeds
are central derivatives of the resulting positions using a 0.0001-day half-step
and the actual representable JD interval. These derivatives can differ from
Swiss's reported `SPEED` because of its frame-rotation convention; the separate
[Swiss Pluto speed diagnostic](swiss-pluto-speed-diagnostic.json) records the
obliquity derivative term and retains the original reference discrepancies.

Outside the padded Cartesian table, apparent Pluto falls back to the complete
43-row Meeus Table 37.A heliocentric J2000 series. That path rotates the
heliocentric vector into the observation-time mean ecliptic, subtracts Earth,
and applies iterative light time, solar deflection, annual aberration and
nutation. The public geometric `pluto_pos` continues to use the Meeus series.
The independent published 1992 October 13 example tests that analytic series;
it does not independently validate the Swiss-derived table or its whole
apparent-position pipeline. Accuracy measured inside the table must not be
extended to the fallback interval.

The generator is `scripts/generate-precision-ephemeris.py`. Its adjacent
[`precision-ephemeris.manifest.json`](../../core/src/astronomy/precision-ephemeris.manifest.json)
records source flags and file hashes, output and generator hashes, layout,
coverage, and interpolation checks. For Pluto, 10,000 seeded off-grid holdouts
and 3,804 junction/adjacent checks measured a maximum angular vector error of
0.000362846 arcsecond and a maximum Cartesian error of 5.28539e-8 AU. The
0.01-day central-derivative comparison reached 0.00279271 arcsecond/day.
These are checks of the pre-apparent table representation against its Swiss
source, not error bounds for the finished apparent output or guarantees over
all possible instants. The angular vector metric covers both angular
coordinates except the usual spherical-coordinate pole singularity.

## Lunar nodes

The mean ascending node is the Meeus polynomial plus nutation in longitude,
referred to the true equinox of date. Its velocity includes the polynomial
and nutation derivatives. The true node is an osculating ascending node; it is
not the former short periodic approximation to the mean node.

For JD TT 2425974.5 through 2466523.5, the true node uses 162,197 quarter-day
Swiss samples. Each record contains unwrapped longitude, reported longitude
velocity, ascending-node distance and reported distance velocity. Each
observable is evaluated with its own four-point cubic Lagrange interpolant.
Interpolating the supplied velocity directly avoids amplifying position
interpolation error by differentiating the position interpolant near stations.
The position and velocity interpolants are therefore separate approximations;
the velocity is not defined as the exact derivative of the position polynomial.

Outside the table, the analytic fallback obtains the node direction from the
lunar angular momentum vector `r × v`. Neighboring lunar positions are rotated
into one mean ecliptic before differentiation. The ascending-node distance
follows from the osculating eccentricity vector and semilatus rectum; nutation
places its longitude in the true equinox of date. The truncated lunar theory
limits the fallback's accuracy, and table holdout results do not apply to it.

The generator `scripts/generate-lunar-node.py` verifies pinned source versions
and file hashes before generating data. The
[`lunar-node.manifest.json`](../../core/src/astronomy/lunar-node.manifest.json)
records layout, source and output hashes, interpolation method, coverage,
source-join treatment and 10,000 seeded fractional holdouts. Current maximum
holdout errors against direct Swiss evaluation are:

| Observable | Maximum sampled difference |
| --- | ---: |
| Longitude | 0.218771 arcsecond |
| Longitude velocity | 1.54027 arcseconds/day |
| Distance | 1.41215e-9 AU |
| Distance velocity | 1.28298e-8 AU/day |

### Source segment joins and reported direction

The source Moon file uses independently encoded Chebyshev segments. Tiny
position discontinuities at their joins can produce narrow spikes when Swiss
computes true-node velocity by a central difference with a 0.0001-day
half-step. A smooth interpolation must not spread such a sampled spike across
an entire quarter-day interval. For every source boundary, the generator
therefore identifies velocity knots within 0.00012 day: the derivative stencil
plus a conservative lunar light-time allowance. It reconstructs those velocity
observables from four safe neighboring samples; the sampled positions remain
unchanged. The current manifest lists the sole affected knot, JD TT 2437178.75,
and the exact reconstruction method. This is a general source-boundary rule,
not a list of audit-date direction overrides.

The remaining raw direction discrepancy at JD UT 2462308.5 is documented in
[true-node-segment-join.json](true-node-segment-join.json), generated by
`scripts/validation/node-diagnostic.py`. It includes the exact source segment
boundary, backend flags, source hashes, independent position derivatives at
several steps, and nearby lunar/node samples. Swiss reports approximately
+0.128255 degree/day there, while the smooth table gives approximately
−0.00551525 degree/day. The tiny-step derivative on one side of the join and
the longer-step derivatives indicate negative motion; a stencil crossing the
join produces the positive spike. The standard comparison retains the raw
Swiss speed and direction disagreement. The diagnostic explains this reference
feature without deleting the record or claiming an exact Swiss match.

## What these checks establish

The table holdouts measure interpolation fidelity to pinned Swiss Ephemeris
2.10.03 and its pinned ephemeris files. Separate full standard comparisons
measure the complete built-in pipeline, including TT conversion and apparent
corrections; their provenance and residuals are recorded in
[swiss-1930-2040.json](swiss-1930-2040.json). These two kinds of measurements
must remain distinct. Neither comparison with the same upstream data supplies
an independent observational validation or a proof of physical accuracy at
every instant. Future delta-T values additionally depend on an Earth-rotation
prediction model.

The Swiss-derived data and adapted deflection implementation use the Swiss
Ephemeris AGPL option, matching this repository. Source versions, flags and
licensing provenance are recorded in the manifests rather than inferred from
agreement with selected chart examples.

Sources:

- Meeus, *Astronomical Algorithms*, second edition, chapters 21, 37 and 47.
- [Swiss Ephemeris pinned source and license](https://github.com/aloistr/swisseph/tree/c113653fe37fe5cdbfcc030a6e341de03ef018d2).
- The table manifests and diagnostic JSONs linked above contain the measured
  values, flags, input hashes and reproducible-generation details.
