# Pluto and lunar nodes: source and measured accuracy

Pluto uses the complete 43 rows of Meeus, *Astronomical Algorithms*, second
edition, Table 37.A. The former implementation had 29 rows, misassigned
arguments and incorrect coefficients. The independently published 1992 October
13 example is a unit test. Table output is heliocentric J2000, rotated with
Meeus chapter 21 precession before subtracting the observation-time Earth.
The apparent result includes iterative light time, observer-velocity annual
aberration and nutation. The public `pluto_pos` remains geometric J2000.

A standalone source build compared 1,321 monthly TT epochs from 1930 through
2040 against Swiss Ephemeris 2.10.03 with SWIEPH and pinned `sepl_18.se1`.
Maximum residuals: longitude 1.063 arcseconds, latitude 0.270 arcseconds,
distance 0.000159 AU. These are measured residuals for this sample, not a
claim that the independent Meeus model reproduces Swiss everywhere.

The old five-term lunar-node expression used the wrong arguments and was not
an osculating node. The analytic replacement derives the ascending node from
`r × v`, with neighboring lunar positions rotated into one ecliptic frame
before differentiation. The node distance follows from the osculating
Keplerian eccentricity vector and semilatus rectum. With the existing truncated
lunar theory, monthly longitude residuals against Swiss reach 83.81 arcseconds;
its latitude derivative prevents a reliable sub-arcminute node guarantee.

For 1930–2040 the true node therefore uses an explicitly versioned tabulation
of the Swiss osculating node, with daily TT samples and cubic Hermite
interpolation of longitude and ascending-node distance. This is derived Swiss
data, not an independent lunar theory or an empirical correction fit.
The binary has padding from 1929 December 29 through 2041 January 4 TT.
Outside its coverage the analytic angular-momentum method is used.
`lunar-node.manifest.json` records input file hashes, source commit, output
hash, layout, dates and holdout measurements. The generator is
`scripts/generate-lunar-node.py`; it uses local ephemeris files and no network.
Swiss Ephemeris is used under AGPL-3.0-or-later, matching this repository.

On 10,000 seeded random fractional TT instants disjoint from every daily
sample, Hermite interpolation versus direct Swiss evaluation has maxima of
0.330 arcseconds longitude, 0.797 arcseconds/day longitude speed,
6.875e-9 AU distance and 2.064e-8 AU/day distance speed. Monthly samples measured
0.162 arcseconds longitude and 1.045 arcseconds/day speed. The manifest records
the reproducible random audit. This interpolation validation uses the same
upstream ephemeris and measures interpolation error only.

The mean node is the polynomial plus nutation in longitude (true equinox of
date). Its derivative includes the quartic polynomial and nutation. Monthly
mean-node residuals are below 0.132 arcseconds. Both true and mean node
functions return apparent equinox-of-date longitude; callers implementing
NONUT must remove nutation.

Sources:
- Meeus, *Astronomical Algorithms*, second edition, chapters 21, 37 and 47.
- [PyMeeus Table 37.A transcription and published example](https://github.com/architest/pymeeus/blob/master/pymeeus/Pluto.py).
- [Swiss Ephemeris source and license](https://github.com/aloistr/swisseph/tree/c113653fe37fe5cdbfcc030a6e341de03ef018d2).
