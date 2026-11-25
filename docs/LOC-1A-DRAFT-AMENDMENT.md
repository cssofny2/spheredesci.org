# Draft Pre-Confirmatory Protocol Amendment LOC-1A

- **Document ID**: `SPHERE-AMD-LOC-1A`
- **Status**: **DRAFT — NOT YET REGISTERED OR SUBMITTED TO OSF**
- **Target Governing Record**: Immutable Protocol LOC-1 Registration on OSF (`https://osf.io/5b6mj/overview`, registered 2026-10-23)
- **Date Drafted**: 2026-11-24
- **Authoring Organization**: SPHERE Research, LLC (Project S.P.H.E.R.E.)
- **Rule of Authority**: Nothing in this draft alters the immutable OSF registration. Registered Protocol LOC-1 remains the governing Phase 1 study plan unless and until this amendment (after independent metrology and statistical review and qualification closure) is formally filed as a dated, versioned pre-confirmatory amendment on OSF **before** any confirmatory A/B data are collected or inspected.

---

## 1. Purpose of Draft Amendment LOC-1A

Following a comprehensive internal metrology, statistical, and documentation audit (November 2026), Project S.P.H.E.R.E. identified specific operational and mathematical ambiguities in the initial v1.0 whitepaper and working protocol summaries that should be resolved **before confirmatory acquisition begins**. Draft Amendment LOC-1A formalizes those refinements while preserving LOC-1's theory-neutral scientific framing:

> *LOC-1 is a theory-neutral differential mechanical-resonance experiment testing for a reproducible position-associated residual under controlled conditions. A detected residual would constitute an observation requiring further investigation rather than evidence of a specific mechanism.*

---

## 2. Explicit Differences from Immutable Registered LOC-1 (Summary Table)

| Area | Registered LOC-1 Baseline (2026-10-23) | Proposed Pre-Confirmatory Refinement (Draft LOC-1A) | Freeze Gate |
|---|---|---|---|
| **Primary Endpoint Formula** | Earlier v1.0 summary wrote `Δ_ppb = 10^9(r̄_A - r̄_B)` (dimensionless ratio difference, which has scale bias when `f_T ≠ f_R`). | Freeze one baseline-normalized primary endpoint: `θ = (μ_A - μ_B) / μ_B`, `Δ_ppb = 10^9 θ` (or fixed qualification baseline `r_0 > 0`), with log-ratio `z_p = ln(f̂_{T,p}/f̂_{R,p})`, `Δ_ppb = 10^9(exp(θ_log) - 1)` as prespecified sensitivity analysis. Preserve raw `f_T` and `f_R` alongside ratios. | Pre-confirmatory statistical sign-off (Gate G3-A) |
| **Artifact Geometry & Target Frequency Band (`>230 kHz` vs `3–4 in` / `low-kHz`)** | OSF description specifies a `99.999%` purity hollow copper sphere and a resonance mode `>230 kHz` (v1.0 estimated `9.2 mm OD`, `0.3 mm` wall, `R ≈ 4.6 mm`, yielding `~218–229 kHz` depending on modulus `117–130 GPa`) at `0.40 m` separation. | Explicitly reconcile with the motivating source geometry (a `3–4 in` / `76.2–101.6 mm` thin hollow copper sphere on a `6–10 ft` / `1.83–3.05 m` ultra-flat table, whose fundamental breathing mode lies near `20–28 kHz` with lower flexural modes in the low-kHz band). Declare `230 kHz` a hypothesis-inherited design criterion, not a physical threshold. Freeze exact sphere diameter, wall thickness, alloy (5N or C10100 OFE), mode index, and span (`0.40 m` enclosed vs `1.83–3.05 m` table) **only after analytical prediction, FEM, and experimental modal survey**. | Artifact Qualification Gate (Gate Q2 / M1) |
| **Operational Definition of One Placement** | Specified `≥40` placements/position (`≥80` total, 10 blocks of 8) without full 28-field operational lock. | Freeze complete 28-element placement specification (start event, position/orientation tolerances, kinematic seating acceptance, handling SOP, settling criteria, excitation waveform/amplitude/duty cycle, fixed acquisition window, sample rate, test-reference timing tolerance, estimator, MAC/SNR thresholds, retry/replacement limits, lock procedure) and enforce: *"Repeated records within a placement characterize that placement and do not increase the number of independent placements."* | Qualification & Pilot Gate (Gate Q5 / M4) |
| **Thermal Settling Acceptance** | Provisional `30 min` wait time (`1800 s`). | Retain `30 min` only as a planning minimum; freeze objective, qualification-derived thresholds for artifact temperature slope, test-reference `ΔT` & differential slope, enclosure gradient, reference-frequency drift, drive amplitude stability, optical SNR, pressure stability, vibration, EM background, and maximum settling timeout. Ban "frequency stopped changing" as sole criterion. | Thermal Qualification Gate (Gate Q3) |
| **Artifact-Specific Thermal Calibration** | Assumed matched spheres reduce thermal sensitivity via ratio; v1.0 cited `~10^-4 K^-1` planning estimate. | Measure artifact- and mode-specific thermal response `ln f_i(T) = a_i + β_i(T - T_0) + q_i(T - T_0)^2` for both `T` and `R` spheres across heating/cooling (hysteresis), thermal lag, drive heating, move transients, and `β_T - β_R` mismatch; propagate correction-parameter uncertainty without double-counting. Explicitly designate unadjusted vs environmentally adjusted contrast as primary vs diagnostic. | Thermal Qualification Gate (Gate Q3) |
| **Mode Identity & Deterministic Frequency Estimator** | General call for optical mode-shape mapping without locked estimator or MAC threshold. | Lock ONE deterministic frequency estimator (qualified ring-down or complex-plane resonance fit) in versioned, containerized code with frozen fitting window, initialization, convergence rules, and numerical MAC mode-identity threshold (`TBD by qualification`) to eliminate manual modal-ID estimator variance (documented up to 10 Hz on copper shells in LNE-CNAM `hal-01511297`). | Software & Estimator Lock Gate (Gate Q4) |
| **Uncertainty Budget & Allan Deviation** | Generic GUM linearized equation in v1.0. | Full JCGM GUM (`JCGM 100:2008`, `JCGM 101:2008` Monte Carlo, `JCGM GUM-6:2020`) 34-component budget including fluid-structure gas coupling, electrostatic charging, humidity, patch potentials, and actuator back-action; explicit anti-double-counting matrix; Allan deviation (`NIST SP 1065`) establishing optimal averaging time and block duration. | Qualification Gate (Gate Q5) |
| **Statistical Decision Procedure & Stopping Rule** | Ambiguous single `H_0` conflating difference and equivalence; open-ended `"at least 40"` placements; unverified `α=0.01` / `90%` power across OSF vs homepage Nov 4 caveat. | Separate three questions (difference from zero, equivalence within `[−δ, +δ]`, inconclusive) with explicit 4-outcome matrix (difference only / equivalence only / both / neither). Freeze exact `N`, block count, failed-placement replacement, max attempts, incomplete-block handling, autocorrelation model, fallback model, multiplicity rules, and end-to-end synthetic-data validation reporting both power and false-positive rate. | Independent Statistician Sign-Off (Gate G3-A) |
| **Scheduled Control Matrix with Binding Failure Actions** | Controls listed conceptually (sham moves, rotations, dummy, ref-only, ≥20 remove-and-replace). | Convert all 17 controls into scheduled experiments with explicit trial counts, metrics, numerical acceptance rules (`TBD by qualification`), and binding failure consequences (invalidate block, suspend acquisition, requalify apparatus, amend protocol, restrict interpretation, or abandon mode). | Qualification Gate (Gate Q5) |
| **Optical vs VNA Channel Separation** | Both optical LDV and VNA described in stack. | Optical mechanical-resonance readout is strictly primary; VNA electromagnetic features remain strictly diagnostic unless independently qualified and adopted by documented pre-confirmatory amendment. | Pre-Confirmatory Freeze |
| **Stage Separation & Requalification Triggers** | Qualification, pilot, and confirmation not strictly separated from data pooling. | Strictly separate Qualification, Pilot, Confirmation, and Independent Replication; prohibit pooling qualification/pilot data into confirmation; codify 10 mandatory requalification triggers. | Pre-Confirmatory Freeze |

---

## 3. Items Explicitly Excluded from Draft Amendment LOC-1A (Remaining in Phase 2 or Independent Tracks)

The following items are **NOT** part of LOC-1 or Draft Amendment LOC-1A and require separate protocols and preregistrations:

1. **Synchronized four-object measurement array** (S1–S4 parallel concurrent optical channels, rotating assignments, 6-pair covariance modeling).
2. **Closed-loop site-environment record-and-replay** (Time Waveform Replication shaker + Helmholtz coil replay of Location A at Location B).
3. **MOD-1 modal reconstruction, active feedback control, and A1–B–A2 excitation-off persistence experiments**.
4. **Celestial-motion / sidereal reference-frame campaigns** (multi-month orientation/turntable tracking; passive UTC/site metadata logging may be retained as non-confirmatory archival metadata if it introduces zero blinding leakage).
5. **Actuation, rolling, relocation, or field-mapping claims** mentioned in the motivating source passage (explicitly out of scope).
6. **Track ANT-B-01** (passive concentric-shell electromagnetic resonator characterization — scientifically and inferentially independent from LOC-1).

---

## 4. Adoption Checklist Required Before Submitting LOC-1A to OSF

- [ ] Verify and publish readable immutable export of the original 2026-10-23 OSF LOC-1 registration (`https://osf.io/5b6mj/overview`).
- [ ] Complete analytical + FEM modal comparison for candidate copper-shell geometries (3–4 in motivating scale vs 9.2 mm compact scale) and experimental modal survey.
- [ ] Complete thermal, gas-pressure, mounting, timing, and Allan deviation qualification runs to replace every `"TBD by qualification"` placeholder with empirical acceptance thresholds.
- [ ] Obtain written sign-off from at least **two independent technical/metrology reviewers** and **one distinct independent statistician** (minimum 3 individuals).
- [ ] Run and archive the end-to-end synthetic simulation validation (null false-positive rate and power across realistic drift, autocorrelation, thermal lag, missing placements, and correction uncertainty).
- [ ] File dated Amendment LOC-1A on OSF linking back to `https://osf.io/5b6mj/overview` **before** unlocking confirmatory A/B acquisition.
