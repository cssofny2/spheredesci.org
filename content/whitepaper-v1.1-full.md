# Project S.P.H.E.R.E.

Spatial Positioning Harmonic Empirical Resonance Experiment

## DeSci Whitepaper

Open Resonance Metrology, Digital-Twin Validation, and Accountable Research Funding

| Document field | Value |
|---|---|
| Version | 1.1 — consolidated technical draft |
| Date | October 10, 2026 |
| Project domain | spheredesci.org |
| Classification | Proposed research infrastructure and experimental protocol |
| Adoption status | Not operationally adopted; independent review and unresolved-parameter closure required |
| Scope | Five principal sections and Appendices A–H |

> This document describes proposed capabilities. It is not a report of experimental findings. Planning estimates are not quotations; illustrative software outputs are not measurements; public participation is not proof of decentralized legal authority.

## Contents

1. Executive Summary
2. Physical Metrology & Experimental Lab Architecture
3. S.P.H.E.R.E. Simulator & Metrology Software
4. DeSci Governance & Crowdfunding Model
5. Risk Analysis & Mitigation

Appendices:

- A. Reproducibility Package & Experiment Data Specification
- B. Instrument Qualification & Calibration Acceptance Protocol
- C. LOC-1 Statistical Analysis Plan & Decision Rules
- D. Funding, Treasury Controls & Governance Implementation
- E. Safety, Ethics & Operational Authorization
- F. Implementation Roadmap & Stage-Gate Acceptance
- G. Publication, Licensing & Document Control
- H. Terminology, Evidentiary Classification & Adoption Conditions

---

## 1. EXECUTIVE SUMMARY

### 1.1 Project Status and Research Scope

Project S.P.H.E.R.E.—Spatial Positioning Harmonic Empirical Resonance Experiment—is a proposed open-science program investigating whether a controlled copper artifact exhibits a reproducible location-associated change in resonance after conventional environmental, mechanical, and instrumental influences have been characterized.

This whitepaper presents a research architecture, funding framework, and experimental verification procedure. It does not report a demonstrated anomaly, a qualified installed facility, a deployed DAO, or independently replicated findings. The October 2, 2026 founding packet identifies the project as pre-entity, pre-funding, and without collected experimental data. That statement is the documentary baseline, not an independently verified current operational status. [file:17]

The initial confirmatory experiment, LOC-1, will compare a selected mechanical resonance above 230 kHz at two positions separated by 0.40 m within one controlled enclosure. A stationary reference artifact will support ratio-based measurement. The experiment excludes teleportation, non-kinetic relocation, medical applications, and participant-based consciousness interventions. [file:17]

### 1.2 Problem Statement

S.P.H.E.R.E. addresses three connected constraints.

1. Replicability and research transparency. Reliable interpretation requires documented methods, qualified measurements, adequate statistical design, preserved raw records, and publication independent of outcome. The broader reproducibility problem motivates these safeguards; it does not substantiate an unconventional physical hypothesis. S.P.H.E.R.E. therefore requires preregistration, reproducible analysis, disclosure of deviations, and independent experimental replication before a positive scientific claim. [web:76][file:17]
2. Funding and infrastructure access. Precision optical sensing, environmental characterization, specialist review, and replication require resources before a confirmatory result can be obtained. Funding must support bounded technical work packages rather than depend on obtaining an anomaly. The project distinguishes a founding pilot using rented or partner-laboratory access from a laboratory MVP and a dedicated facility. [file:17][file:42]
3. Measurement uncertainty. Temperature, mounting stress, excitation, mode identification, electromagnetic coupling, and timebase drift can affect measured resonance. Instrument bandwidth exceeding 230 kHz does not establish sub-hertz accuracy or parts-per-billion sensitivity. The complete apparatus and procedure must demonstrate suitable uncertainty, stability, and repeatability through qualification. [file:17][web:72][web:73]

### 1.3 Proposed Solution

| Layer | Function | Required evidence |
|---|---|---|
| Open-science funding and governance | Finance equipment access, research execution, review, and replication | Adopted responsibilities, reconciled budgets, expenditure records, and milestone acceptance |
| S.P.H.E.R.E. Simulator | Model conventional responses, examine confounds, train analysts, and support experimental design | Versioned equations, numerical verification, documented assumptions, and separated fitting and validation data |
| Empirical metrology | Measure mechanical resonance, secondary electromagnetic response, excitation, and environmental conditions | Qualified apparatus, retained raw records, frozen analysis, and blinded execution |

The simulator shall distinguish synthetic outputs, fitted predictions, measured observations, and residuals. Agreement with data used for fitting shall not be represented as independent validation.

Non-contact optical sensing is the primary mechanical measurement. A VNA with near-field probes provides secondary electromagnetic diagnostics. Cross-channel confirmation is permitted only where qualification demonstrates a physical relationship between the electromagnetic feature and the selected artifact response. [file:17]

### 1.4 Primary Measurement and Endpoint

For placement \(p\):

\[
r_p=\frac{\hat f_{T,p}}{\hat f_{R,p}}.
\]

The primary contrast is:

\[
\Delta_{\mathrm{ppb}}=10^9\frac{\mu_A-\mu_B}{r_0},
\]

where \(\mu_A\) and \(\mu_B\) are adjusted mean frequency ratios and \(r_0>0\) is a fixed qualification-derived baseline ratio. Its derivation and uncertainty treatment shall be frozen before confirmation. This definition does not assume identical artifact frequencies and shall govern the statistical plan, simulator, exports, and equivalence bounds.

The protocol shall specify simultaneous, interleaved, or sequential reference acquisition. Ratio measurement is intended to reduce shared drift; its effectiveness must be demonstrated for the selected timing scheme.

### 1.5 Experimental Sequence and Decisions

Development establishes excitation, mode selection, timing, and acquisition. Qualification characterizes uncertainty and repeatability. Independent review precedes preregistration, which freezes the endpoint, smallest effect of interest, model, controls, exclusions, and decision rules. Confirmatory LOC-1 shall collect new data; development and qualification records shall not be reused as confirmation.

Let \(\delta>0\) be the smallest effect of interest in normalized ppb. The scientific equivalence region is \([-\delta,+\delta]\). The difference test evaluates \(\Delta_{\mathrm{ppb}}=0\); equivalence testing evaluates whether the contrast can be bounded within the predefined region.

The founding packet specifies a two-sided primary significance level of 0.01 and planned detection power of at least 90%. The final protocol shall specify the design effect for that calculation and assess equivalence power separately. [file:17]

| Classification | Meaning |
|---|---|
| Equivalent | Preregistered equivalence criteria pass |
| Detectable difference | Exact-zero test passes; materiality is not established by significance alone |
| Candidate material signal | Difference test passes, point estimate exceeds \(\delta\), and predefined controls pass |
| Supported effect beyond threshold | A separately preregistered procedure supports a contrast outside the equivalence interval |
| Inconclusive | The applicable equivalence or signal criteria are not established |
| Technically uninterpretable | Measurement or protocol failures prevent valid inference |

A nonsignificant difference test alone is not an established null result. Independent new experimental data are required before a positive project claim. [file:17]

### 1.6 Funding and Governance

| Stage | Planning amount | Scope |
|---|---:|---|
| Founding pilot | Approximately $27,000 lean or $86,000 standard | Initial apparatus, limited optical access, review, and publication |
| Laboratory MVP | $350,000–$520,000 | Refurbished or leased diagnostics and existing infrastructure |
| Turnkey facility | $969,000–$1,732,000 | Dedicated infrastructure, diagnostics, integration, and first-year execution |

These are planning estimates, not automatically additive requirements. The turnkey amount includes personnel and operating expenditure and is not solely capital expenditure. [file:17][file:42]

Founding operations remain accountable to the responsible legal operator. Advisory participation and possible multisignature custody do not themselves establish decentralized binding governance. Tokenization and transfer of authority require separate adoption and review. [file:17]

### 1.7 Evidentiary Limits

Speculative Models and Unverified Theories include an intrinsic locational-frequency variable and a fundamental threshold at 230 kHz. The founding packet identifies the Bashar material presented by Darryl Anka as inspiration, not evidence. In LOC-1, >230 kHz is an experimental selection criterion. [file:17]

A surviving residual would justify investigation, not uniquely identify a new mechanism. Equivalence would constrain the tested artifacts, mode, separation, apparatus, and sensitivity. The publication commitment in Appendix G applies to every outcome.

---

## 2. PHYSICAL METROLOGY & EXPERIMENTAL LAB ARCHITECTURE

### 2.1 Artifacts and Mode Selection

The proposed set comprises test, reference, spare, and dummy artifacts. Test and reference spheres shall be thin-walled hollow copper artifacts from the same stock and batch. The larger laboratory plan proposes 99.999% copper; final procurement shall separately document chemical purity, oxygen content, fabrication, dimensions, wall thickness, surface treatment, and stress history. Each artifact requires separate characterization. [file:17][file:42]

The founding packet uses the approximation:

\[
f_{\mathrm{breathing}}\approx\frac{1}{2\pi R}\sqrt{\frac{2E}{\rho(1-\nu)}}.
\]

Its approximate copper properties—130 GPa Young's modulus, 8960 kg/m³ density, and 0.34 Poisson ratio—give a radius near 4.6 mm for a breathing mode near 230 kHz. Larger artifacts may use higher-order modes. Finite-element analysis and measured mode shapes shall determine the final geometry and mode. [file:17]

### 2.2 Core Diagnostic Stack

| Subsystem | Core Concept | Technical Specifications | Cost/Complexity Impact | Pros | Cons |
|---|---|---|---|---|---|
| 3D SLDV | Primary mechanical mode identification | Legacy candidate: Polytec PSV-500-3D-HV; configuration-dependent scanning capabilities up to 25 MHz. Current VibroScan QTec Xtra systems offer acquisition and generation up to 32 MHz. Actual options require quotation and qualification. | $320,000–$450,000 new; $150,000–$220,000 refurbished or leased | No attached sensing mass; spatial mode maps | Optical geometry, return, and scan duration require characterization |
| Multiport VNA | Secondary electromagnetic diagnostics | Keysight E5080B, 2- or 4-port; lower limit depends on configuration, including 9 kHz or 100 kHz; complex S11 and supported S21 | $55,000–$95,000 new; $25,000–$45,000 refurbished or leased | Magnitude, phase, and coupling tests | Fixture and probe features may dominate |
| Near-field probes | Local non-contact coupling | Langer EMV or ETS-Lindgren candidates; selected response must cover the experimental band | $8,000–$15,000 new; $4,000–$8,000 refurbished | Local electromagnetic diagnostics | Position and orientation sensitivity |
| Frequency reference | Shared frequency reference | SRS FS725; 10 MHz distribution; optional external 1 PPS disciplining | $6,000–$14,000 new; $3,000–$6,000 refurbished | Reduces relative timebase drift when qualified | Does not itself synchronize timestamps |
| Four-channel oscilloscope | Drive and transient monitoring | Proposed WaveSurfer 4104HD: 1 GHz, 12-bit, four channels; 5 GS/s on two channels or 2.5 GS/s on four | Original allowance $30,000–$55,000 new; re-quote selected model | Concurrent drive and diagnostic records | Configuration-dependent sampling and record length |
| Environmental acquisition | Disturbance and correction records | Temperature, pressure, magnetic field, vibration, and humidity where applicable; ≥1 Hz founding minimum | Configuration-dependent | Environmental interpretation | Resolution is not uncertainty |

Budget allowances derive from the laboratory plan. Manufacturer capabilities are configuration-dependent and shall not be treated as demonstrated project performance. [file:42][web:58][web:59][web:54][web:55][web:77][web:78]

### 2.3 Excitation and Timing

The excitation chain shall use a qualified source, non-contact actuator, drive monitor, and bounded amplitude and duty cycle. The founding packet identifies air-coupled ultrasound and electromagnetic approaches. Air-coupled excitation cannot be assumed compatible with an evacuated propagation path. [file:17]

The protocol shall freeze:

```text
reference_acquisition_method
maximum_test_reference_time_separation
reference_sampling_schedule
pairing_or_interpolation_rule
trigger_and_timestamp_method
uncertainty_from_non_simultaneous_acquisition
```

### 2.4 Optical and VNA Qualification

Optical qualification shall document scan geometry, signal quality, repeatability, orientation effects, and mode identity.

VNA qualification shall include connector-plane calibration, verification, empty-fixture and dummy measurements, probe-position checks, drive dependence, complex fitting, and residual/model assessment. The channel shall be designated as a qualified secondary endpoint, conditional diagnostic, or exploratory endpoint before confirmation. Numerical agreement alone does not establish a common physical origin.

### 2.5 Calibration and S11 Fitting

1. Define the band and reference plane.
2. Identify standards and verification records.
3. Preserve power, IF bandwidth, averaging, sweep points, and cable configuration.
4. Characterize effects beyond the connector plane.
5. Fit complex response with justified background terms.
6. Retain covariance, residuals, and model sensitivity.
7. Repeat verification after relevant changes.

Calibration establishes a measurement relationship and uncertainty; verification checks requirements; qualification accepts the integrated procedure. The measurement model shall follow the GUM framework. [web:72][web:73]

### 2.6 Rubidium Startup, Lock, and Holdover

FS725 manufacturer specifications include less than six minutes to lock and less than seven minutes to reach 1 × 10⁻⁹ after startup under specified conditions. These are reference characteristics, not laboratory settling criteria. [web:53][web:55]

Log lock transitions, receiving-instrument status, distribution configuration, timestamp synchronization, and external-reference availability. External-reference loss shall create a holdover flag. Qualify free-running behavior over the intended interval; do not label interrupted data externally disciplined without evidence.

### 2.7 Environmental Architecture

| Subsystem | Proposed implementation | Planning allowance |
|---|---|---:|
| Thermal vacuum | Custom chamber, optical access, thermal control, qualified sensors | $110,000–$220,000 |
| Shielding | Dedicated modular room or qualified compact enclosure | $85,000–$165,000 for room concept |
| Mechanical isolation | Newport or TMC system selected against measured disturbances | $35,000–$65,000 |
| Power infrastructure | UPS, filtering, grounding, appropriate isolation | $18,000–$35,000 |

These are estimates, not quotations. [file:42]

The ±0.001 K objective requires separate definitions for temporal stability, spatial uniformity, measurement uncertainty, artifact-temperature estimation, and settling. The founding packet estimates a fractional thermal coefficient near 10⁻⁴/K, approximately 23 Hz/K at 230 kHz; each artifact and mode require measurement. [file:17]

The >100 dB shielding figure is a planning objective, not measured attenuation or a universal acceptance requirement. Characterize relevant frequencies, seams, apertures, and feedthroughs. Pressure, pump state, and vacuum compatibility require qualification and separate safety approval. [file:42][file:17]

### 2.8 Budget Basis

| Turnkey category | Lower estimate | Upper estimate |
|---|---:|---:|
| Diagnostics | $419,000 | $629,000 |
| Environmental isolation | $248,000 | $485,000 |
| Fabrication, calibration, software | $37,000 | $73,000 |
| Facility, integration, first-year personnel | $265,000 | $545,000 |
| Total | $969,000 | $1,732,000 |

Use this detailed total rather than the source's broader executive-summary range. MVP comparisons require explicit lease duration, staffing, operating period, and host-facility services. Reconcile taxes, shipping, insurance, contingency, and organizational overlap before fundraising. [file:42][file:8]

### 2.9 Authorization Sequence

Development → qualification → independent acceptance → preregistration → new confirmatory LOC-1 data → publication → independent replication.

Founding defaults are 0.40 m separation, at least 40 principal placements per position, ten blocks of eight placements, and 30-minute settling subject to qualification. Control counts shall be explicit and separate. Operational monitoring shall not expose position-revealing information to blinded analysts. [file:17]

---

## 3. S.P.H.E.R.E. SIMULATOR & METROLOGY SOFTWARE

### 3.1 Role and Implementation Status

The proposed digital twin shall predict conventional modes and sensitivities, evaluate confounds, support power planning, generate controlled synthetic records, and compare qualified measurements with predictions.

Reviewed project files contain a browser-based noise demonstration, not evidence of a completed validated twin, operational live telemetry, or finished Spatial Field Explorer. The prototype's unsupported statements that selected slider values guarantee genuine anomalies shall be removed. [file:19][file:52]

### 3.2 Technical Architecture

| Layer | Proposed implementation | Acceptance requirement |
|---|---|---|
| Browser | TypeScript interface, WebGL, room maps | Separate synthetic, imported, and live states |
| Models | Structural finite elements and environmental models | Versioned properties, boundaries, mesh and solver checks |
| Gateway | Supported APIs or SCPI adapters | Preserve native records and configuration |
| Telemetry | Authenticated monitoring stream | Acquisition time, latency, gaps, and status visible |
| Storage | Preserved raw objects and authenticated manifests | Trace derived outputs to inputs |
| Analysis | Reproducible execution and automated tests | Known-input recovery and null-case verification |

Model fitting and validation datasets shall be identified separately. Residuals are not automatically evidence of new physics.

### 3.3 Room Maps and Spatial Field Explorer

Maps shall define enclosure geometry, fixtures, reference location, sensors, optical paths, and coordinate frame. The explorer shall provide scalar heatmaps, physically defined vector displays, diverging scales, visible sampling locations, interpolation parameters, cross-validation, and masks for unsupported extrapolation.

A diverging color scale is not vector-field divergence. Computation of \(\nabla\cdot\mathbf F\) requires a defined vector quantity and an adequate sampling and differentiation procedure.

### 3.4 Telemetry and Exports

Monitor optical quality, fitted frequencies, uncertainty, VNA calibration and residuals, drive state, reference status, environment, and settling. Environmental logging shall meet the founding ≥1 Hz minimum and higher rates where qualification requires them. [file:17]

```text
experiment_id, session_id, block_id, placement_id, run_id,
artifact_id, coded_position, timestamp_utc, monotonic_time,
instrument_id, calibration_id, configuration_hash,
frequency_hz, frequency_standard_uncertainty_hz,
reference_frequency_hz, frequency_ratio,
baseline_ratio, normalized_contrast_ppb,
temperature_K, pressure_Pa, drive_amplitude,
clock_status, quality_flags, raw_hash, analysis_version
```

CSV/JSON shall supplement native waveforms, complex scattering data, and scan geometry. Schemas shall define units, missingness, time scale, and measured/derived/simulated status. Operational and analyst access shall be separated.

### 3.5 Access Modes

| Mode | Core Concept | Technical Specifications | Cost/Complexity Impact | Pros | Cons |
|---|---|---|---|---|---|
| Training | Teach calibration and confounds | Labeled synthetic records and answer keys | Low marginal cost | Repeatable instruction | Not physical evidence |
| Free-Lab | Explore models | Parameter sweeps and explicit assumptions | Computational demand | Design exploration | Post hoc selection risk |
| Challenge | Verify blinded analysis | Hidden null and injected-effect benchmarks | Benchmark maintenance | Sensitivity and false-positive checks | Not experimental confirmation |
| Peer-Review | Audit research | Read-only records, code, manifests | Curation and review effort | Independent reproduction | Depends on completeness and expertise |

### 3.6 Release Checks

Require unit-consistent equations, documented parameters, known-input tests, numerical convergence, null and injected-effect cases, empirical comparisons, and labels separating educational from validated and speculative outputs.

---

## 4. DeSci GOVERNANCE & CROWDFUNDING MODEL

### 4.1 Staged Governance

The founding packet retains founder-led legal and financial accountability, nonbinding advisory participation, and no founding-phase tokenization or financial-return promises. Earlier token concepts are future options, not deployed commitments. [file:17][file:8]

| Stage | Governance | Funding |
|---|---|---|
| Founding | Responsible legal operator and charter | Documented founder funds, grants, donation/reward mechanisms |
| Advisory | Independent review and public proposals | Restricted milestones |
| DAO-lite | Reviewed policy and optional multisignature custody | Separately approved mechanisms |
| Formal DAO | Adopted legal wrapper and binding rules | Legal, security, and operational review first |

Review triggers are replication, more than 25 active contributors, treasury above $50,000, or 12 months. Review does not automatically transfer authority. [file:17]

### 4.2 Decision Rights

Separate legal, scientific, safety, and advisory authority. Voting shall not suppress results, rewrite completed confirmation, override a safety stop, or determine physical truth. Donors shall not control findings. Conflicts shall be disclosed. [file:17]

### 4.3 Milestone Funding

Each tranche shall define scope, acceptance criteria, operator, reviewer, quotations, fees, contingency, unused-fund treatment, and publication duties. Completed valid null research satisfies delivery obligations. Purchases above $1,000 require a written quote and public changelog note; founder capital and donor funds remain separate. [file:17]

### 4.4 Logging and Hosting

Preserve original native records without overwrite. Use checksums, authenticated manifests, backups, retention controls, and versioned public releases. Optional blockchain commitments anchor hashes, not measurement truth. Large records remain off-chain; content-addressed distribution requires a persistence plan.

Where lawful privacy or security redaction is needed, retain the controlled original and publish an identified derivative with separate hashes. Corrections shall not replace the original. The founding GitHub, OSF, and Zenodo pathway remains the baseline release plan. [file:17]

### 4.5 Open Review

At least two independent reviewers and a statistician review LOC-1 before collection. Freeze protocol and analysis, analyze coded data, reproduce outputs, unblind after the freeze, publish conflicts/deviations, and obtain independent new data before positive claims. [file:17]

---

## 5. RISK ANALYSIS & MITIGATION

### 5.1 Measurement Risk Register

| Risk | Mechanism | Mitigation | Evidence |
|---|---|---|---|
| Thermal effects | Differential temperatures and coefficients | Separate characterization, gradients, settling | Thermal records and correction uncertainty |
| Mounting | Handling changes support conditions | Repeatable fixtures, sham and replacement tests | ≥20 replacement trials |
| Mode identity | Different/overlapping modes compared | Spatial mapping and frozen selection | Mode maps and residuals |
| Clock drift | Reference loss and instability | Logged states and qualified distribution | Stability and holdover records |
| Leakage | Apertures and local electronics interfere | Installed-system tests | Frequency-specific findings |
| Calibration/coupling | Fixture transfer response biases features | Calibration plus fixture characterization | Verification and uncertainty |
| Drive dependence | Heating or nonlinear behavior | Qualified amplitude range | Drive-response records |
| Optical artifacts | Return and geometry degrade fits | Quality checks and repeated scans | Scan acceptance records |
| Environmental noise | Disturbances correlate with placement | Logging and randomized schedule | Covariates and flags |
| Statistical bias | Search and exclusions favor effects | Frozen endpoint and rules | Preregistration and deviations |
| Governance | Funders influence reporting | Binding integrity obligations | Disclosures and review |
| Data/custody | Loss, overwrite, unauthorized transfers | Backups, manifests, access controls | Integrity and financial records |

The founding packet requires thermal characterization, repeatability, stationary monitoring, controls, and blinding. [file:17]

### 5.2 Uncertainty Model

For \(y=g(x_1,\ldots,x_n)\):

\[
u_c^2(y)=\sum_i\left(\frac{\partial g}{\partial x_i}\right)^2u^2(x_i)
+2\sum_{i<j}\frac{\partial g}{\partial x_i}\frac{\partial g}{\partial x_j}\operatorname{cov}(x_i,x_j).
\]

Include fit, thermal correction, placement, reference timing, baseline-ratio treatment, geometry, and between-block variation. Shared influences require covariance treatment rather than automatic independence. Report the coverage method and model limitations. [web:72][web:73]

### 5.3 Engineering Versus Hypothesis

| Category | Statement | Status |
|---|---|---|
| Engineering capability | Optical vibration and complex scattering measurement | Supported instrument functions; project qualification still required |
| Proposed capability | mK control and sub-hertz discrimination | Objectives, not demonstrated performance |
| Unverified Theory | Intrinsic location-frequency variable | Motivation, not established evidence |
| Unverified Theory | Universal 230 kHz threshold | Not demonstrated |
| Out of scope | Teleportation or non-kinetic relocation | Not tested or supported by LOC-1 |

### 5.4 Confirmatory Authorization

Before acquisition: reconcile public claims and budget; freeze artifacts and mode; qualify excitation, timing, thermal behavior, repeatability, and noise; correct simulator classifications; accept independent review; preregister; preserve and publish all results. A residual remains open to conventional explanations. [file:17]

---

## APPENDIX A. REPRODUCIBILITY PACKAGE & EXPERIMENT DATA SPECIFICATION

### A.1 Release Contents

Each experiment package shall include protocol, artifact records, configurations, calibration, raw measurements, manifests, software environment, quality-control decisions, deviations, blinding records, reviews, and replication guide. The founding packet requires drawings, bills of materials, SOPs, data, and code. [file:17]

### A.2 Package Layout

```text
SPHERE-LOC1/
├── README.md
├── LICENSES/
├── protocol/
│   ├── preregistration.json
│   ├── analysis-plan.md
│   ├── exclusion-rules.yaml
│   └── deviations.csv
├── artifacts/
│   ├── artifact-register.csv
│   ├── fabrication-records/
│   ├── dimensional-inspection/
│   ├── mode-identification/
│   └── fixture-drawings/
├── instrumentation/
│   ├── instrument-register.csv
│   ├── acquisition-configurations/
│   ├── calibration-records/
│   └── acceptance-tests/
├── raw/
│   ├── optical/
│   ├── vna/
│   ├── oscilloscope/
│   ├── environmental/
│   └── session-events/
├── manifests/
├── analysis/
│   ├── source/
│   ├── tests/
│   ├── environment-lockfile/
│   └── execution-records/
├── derived/
├── blinding/
├── review/
└── publication/
```

### A.3 Experiment Metadata

```json
{
  "schema_version": "proposed-1.1",
  "experiment_id": "LOC-1",
  "record_status": "protocol-template",
  "preregistration_identifier": null,
  "design": {
    "position_separation_m": 0.40,
    "minimum_principal_placements_per_position": 40,
    "number_of_blocks": 10,
    "principal_placements_per_block": 8,
    "additional_control_placements": null,
    "default_settling_time_s": 1800,
    "minimum_environmental_logging_rate_hz": 1.0,
    "reference_acquisition_method": null,
    "analyst_blinded": true
  },
  "primary_measurement": {
    "selected_mode_id": null,
    "selected_mode_must_exceed_hz": 230000,
    "baseline_ratio_r0": null,
    "baseline_ratio_derivation": null,
    "contrast_definition": "1e9*(adjusted_mean_ratio_A-adjusted_mean_ratio_B)/r0"
  },
  "analysis": {
    "primary_alpha": 0.01,
    "equivalence_alpha": null,
    "smallest_effect_of_interest_ppb": null,
    "difference_test_design_effect_ppb": null,
    "difference_test_power_target": 0.90,
    "equivalence_power_assessment": null,
    "model_specification": null
  }
}
```

Null indicates an unresolved template parameter, not a measured zero. Operational schemas shall distinguish unknown, not measured, invalid, and not applicable.

### A.4 Registers and Run Records

Artifacts require persistent identifiers, roles, certificates, batch, geometry, surface history, fixture, mode, thermal record, and modifications. Instruments require serials, options, firmware, calibration, channel assignments, reference settings, and configuration history.

Run records shall preserve experiment/session/block/placement/run hierarchy, coded position, acquisition time, reference state, configuration hashes, raw-record links, and quality flags. Repeated runs do not create additional placements.

### A.5 Raw and Derived Records

Preserve native optical signals and coordinates, complex VNA data, waveforms, environment, and session events. Store corrections and fitted estimates as derived records with input and code references. Redacted releases shall be separately identified derivatives.

### A.6 Manifest and Blinding

Capture → preserve → hash → manifest → authenticate → back up → verify. A manifest shall identify record path, type, byte length, checksum, acquisition configuration, and creation time.

Keep the true position schedule separate from analyst data. Freeze code and configuration before releasing the key. Document schedule amendments, failed placements, and exclusions. [file:17]

### A.7 Review Acceptance

Reviewers shall verify integrity, reconstruct the environment, rerun fits and summaries, inspect exclusions, reproduce decisions, and submit versioned findings. Distinguish package incomplete, computationally reproduced, methodologically reviewed, independently replicated, and unresolved discrepancy.

### A.8 Release Checklist

- [ ] Protocol and qualification versions identified.
- [ ] Artifact and instrument registers complete.
- [ ] Original records preserved.
- [ ] Units and status semantics documented.
- [ ] Derived outputs traceable.
- [ ] Checksums verified after transfer.
- [ ] Deviations and exclusions disclosed.
- [ ] Analysis environment reproducible.
- [ ] Blinding records released appropriately.
- [ ] Reviews, licensing, and contributor roles included.
- [ ] Outcome and replication status accurately labeled.

---

## APPENDIX B. INSTRUMENT QUALIFICATION & CALIBRATION ACCEPTANCE PROTOCOL

### B.1 Boundary and Stages

Qualification covers artifacts, fixtures, drive, sensing, reference distribution, environment, software, and provenance—not individual instruments alone.

| Stage | Work | Acceptance evidence |
|---|---|---|
| Q0 | Configuration freeze | Identifiable apparatus and code |
| Q1 | Instrument verification | Calibration and acquisition checks |
| Q2 | Artifact characterization | Mode, thermal, and drive behavior |
| Q3 | Environment | Bounded or modeled disturbances |
| Q4 | Repeatability | Stationary, replacement, and sham records |
| Q5 | Analysis verification | Known-input and failure-case tests |
| Q6 | Independent acceptance | Review findings and resolutions |

### B.2 Configuration Control

Identify artifact/fixture/register versions, connection diagram, reference distribution, excitation, sensors, code, and calibration manifest. Classify changes as administrative, measurement-affecting, or safety-affecting. Repeat affected qualification tests after review.

### B.3 Reference and Acquisition

Log startup, lock, disciplining, distribution, input compatibility, fallback, timestamps, and interruptions. Test restart and reference loss. Verify oscilloscope scaling, clipping, trigger, continuity, metadata, and actual sampling configuration. Manufacturer startup specifications do not define complete-system readiness. [web:53][web:55][web:77][web:78]

### B.4 Optical and Electromagnetic Checks

Optical tests shall preserve geometry, quality, repeated mode maps, orientation, and ambiguous features. VNA tests shall include calibration verification, empty fixture, dummy, probe geometry, drive dependence, residuals, and alternative backgrounds. Resolve channel relationships without forcing agreement.

### B.5 Excitation and Thermal Characterization

Characterize drive dependence and select a frozen operating range. Temperature steps shall characterize both artifacts, reversibility, settling, coefficients, covariance, and residuals. A 1 mK display increment is not proof of 1 mK stability or uncertainty. [file:17]

### B.6 Environmental and Repeatability Tests

Measure background with excitation off, reference-only behavior, electronics states, feedthrough effects, and pump states where relevant. Obtain at least 20 same-position remove-and-replace trials, no-move monitoring, sham moves, rotations, and settling records. [file:17]

### B.7 Analysis Verification

Test known frequencies, null and injected contrasts, overlapping features, missing records, reference loss, interruptions, exclusions, and repeat execution. Keep qualification records separate from confirmation.

### B.8 Acceptance and Requalification

Outcomes: qualified, conditionally qualified pending corrective work, or not qualified. Determine the final SESOI after qualification and before preregistration. Revisit qualification after changes to artifacts, mounts, paths, probes, cables, software, references, environment, or unexplained baseline shifts.

- [ ] Mode and artifact pair accepted.
- [ ] Timing and reference status characterized.
- [ ] Drive, thermal, environmental, and placement effects assessed.
- [ ] Uncertainty and dependence represented.
- [ ] Analysis tests pass.
- [ ] Review findings resolved.
- [ ] Final design supports the intended power assessment.

---

## APPENDIX C. LOC-1 STATISTICAL ANALYSIS PLAN & DECISION RULES

### C.1 Units and Endpoint

Use experiment → session → block → placement → run → sample hierarchy. The principal observation unit is physical placement. Control counts shall be separate from the minimum 80 principal A/B placements. [file:17]

\[
y_p=10^9\left(\frac{r_p}{r_0}-1\right),\qquad
\Delta_{\mathrm{ppb}}=10^9\frac{\mu_A-\mu_B}{r_0}.
\]

Freeze baseline derivation, uncertainty, and reference pairing before confirmation.

### C.2 Hypotheses

| Test | Null | Alternative |
|---|---|---|
| Difference | \(\Delta=0\) | \(\Delta\ne0\) |
| Lower equivalence | \(\Delta\le-\delta\) | \(\Delta>-\delta\) |
| Upper equivalence | \(\Delta\ge\delta\) | \(\Delta<\delta\) |

Primary two-sided alpha is 0.01. The equivalence alpha requires explicit adoption; 0.01 per one-sided test is a proposed option, not a finalized founding parameter. [file:17]

### C.3 Proposed Model

\[
y_p=\beta_0+\beta_L L_p+\boldsymbol\gamma^{\mathsf T}\mathbf X_p+b_{k(p)}+\epsilon_p,
\]

with \(L_p=+1/2\) at A and \(-1/2\) at B. The location coefficient estimates the normalized contrast.

Before freeze, select block treatment, session effects, temporal dependence, weighting, inferential method, convergence handling, and qualification-derived assumptions. Do not choose the model by favorable unblinded outcomes.

### C.4 Corrections and Covariates

Candidates include separate artifact temperatures, time since placement, drive, pressure where relevant, and predefined temporal structure. Use qualification evidence. Freeze pre-correction or in-model adjustment; explain any hybrid and avoid duplicate corrections. Propagate relevant correction and baseline uncertainty. [web:72][web:73]

### C.5 Frequency Estimation and Data Validity

Freeze window, mode model, backgrounds, bounds, fit diagnostics, aggregation, and placement uncertainty. Optical and VNA endpoints remain distinct.

Exclusions may cover incomplete records, interruption, invalid signal, failed settling, required-reference loss, configuration violation, unresolved mode identity, or defined incidents. Preserve reasons and timing. Freeze replacement and missing-data rules. Do not fabricate missing primary values or choose replacements after viewing effects.

### C.6 Power and Stopping

Assess placement variance, dependence, blocks, correction strategy, invalid-placement rates, design effect, and alpha. The founding ≥90% target applies to the explicitly identified difference-test design effect; equivalence and beyond-threshold power require separate assessment. The minimum placement count is not itself proof of power. No outcome-based stopping without a preregistered sequential procedure. [file:17]

### C.7 Decisions and Controls

Apply the Section 1.5 classifications. A significant estimate exceeding \(\delta\) is a candidate signal, not proof that the true effect exceeds \(\delta\). Define control acceptance and block consistency numerically or procedurally before acquisition.

| Control | Question |
|---|---|
| Sham movement | Does handling produce the association? |
| Rotation | Does orientation alter response? |
| Dummy | Does the apparatus produce artifact-independent behavior? |
| Reference-only | Does handling disturb the stationary reference? |
| Label/pipeline | Does coding or processing create a spurious contrast? |

Failure to reject a control null is not automatically proof of a clean control.

### C.8 Secondary Analyses and Unblinding

Label primary confirmatory, secondary preregistered, sensitivity preregistered, or exploratory post hoc. Define multiplicity treatment for any confirmatory secondary family.

Validate manifest → apply coded quality checks → freeze code/configuration → execute coded analysis → release position key → execute confirmation → publish. Document post-unblinding defect fixes and effects on conclusions.

### C.9 Reporting Checklist

- [ ] Dataset accounting and dependence structure.
- [ ] Adjusted estimate and uncertainty.
- [ ] Difference and equivalence outcomes.
- [ ] Controls and sensitivity analyses.
- [ ] Deviations, exclusions, limitations.
- [ ] Code, raw records, calibration identifiers.
- [ ] Accurate classification and replication status.

---

## APPENDIX D. FUNDING, TREASURY CONTROLS & GOVERNANCE IMPLEMENTATION

### D.1 Budget and Work Packages

Use the Section 1.6 tiers as separate scopes. Record quote, expiration, quantity, tax/shipping, installation, recurring cost, contingency, restriction, and acceptance milestone. Reconcile overlap before transitions.

| Package | Deliverable | Acceptance |
|---|---|---|
| WP-1 | Protocol and review | Reports and responses |
| WP-2 | Artifacts | Inspection and characterization |
| WP-3 | Diagnostics | Integration checks |
| WP-4 | Environment | Qualification and uncertainty |
| WP-5 | LOC-1 | Dataset and deviations |
| WP-6 | Publication | Reproducible release |
| WP-7 | Replication | External new dataset |

### D.2 Expenditure and Custody

Verify scope, attach quote/invoice, identify package, disclose conflict, obtain lawful approval, pay, register assets, and publish summaries. Reconcile opening balance, receipts, spending, restrictions, commitments, and closing balance. Follow the founding >$1,000 quote rule and separate founder/donor accounting. [file:17]

### D.3 Optional Multisignature

Before custody, adopt signers, threshold, limits, recovery, assets, networks, conversion, monitoring, incidents, and fees. Safe is an identified planning option, not evidence of deployment. Token activity or liquidity provision requires separately adopted scope and review. [file:8][file:17]

### D.4 Transition and Closure

Review triggers do not transfer authority. A transition defines legal responsibility, membership, decision rights, safety, custody, disputes, amendments, and dissolution. If terminated, publish financial and asset disposition, deliverables, limitations, and retained records.

---

## APPENDIX E. SAFETY, ETHICS & OPERATIONAL AUTHORIZATION

### E.1 Scope and Controls

No human-subject or consciousness interventions are included. Future participant research requires independent ethics approval. [file:17]

| Hazard | Control | Record |
|---|---|---|
| Laser | Instrument-specific class requirements and access control | SOP and training |
| Electrical | Protected circuits, grounding, qualified work | Inspection/checklist |
| Excitation | Bounded drive and controlled access | Operating range |
| Thermal | Independent over-temperature protection | Interlock test |
| Vacuum | Rated apparatus and separate review | Authorization |
| Mechanical | Defined lifting/installation | Installation plan |
| Chemicals | Documented handling/storage | Safety documentation |
| RF | Lowest practical power and reviewed shielding | Configuration/SOP |
| Data | Access controls, backup, integrity | Recovery test |

These are founding controls requiring installed-system SOPs. [file:17]

### E.2 Authorization and Stop-Work

Before operation, complete SOP, hazards, limits, shutdown, interlock checks, training, and authorization. Anyone present may stop unsafe work. Record incidents and near-misses and review within seven days. Restart requires cause, corrective action, data-validity review, requalification if needed, and authorization. [file:17]

### E.3 Public Claims

Distinguish proposed, simulated, measured, reviewed, and replicated outputs. No medical, financial-return, or teleportation claims. Credit inspiration without implied endorsement. Disclose funding and conflicts. [file:17]

---

## APPENDIX F. IMPLEMENTATION ROADMAP & STAGE-GATE ACCEPTANCE

### F.1 Research Gates

| Stage | Exit condition |
|---|---|
| F0 — Founding adoption | Reconciled charter, governance, scope |
| F1 — Protocol development | Independent review |
| F2 — Access/procurement | Documented agreements |
| F3 — Development and qualification | Accepted apparatus evidence |
| F4 — Software qualification | Verified capture, analysis, provenance |
| F5 — Preregistration | Frozen public protocol |
| F6 — Confirmation | New blinded dataset |
| F7 — Publication | Open reproducible package |
| F8 — Replication | Independent new data |
| F9 — Governance review | Documented continuation/restructuring decision |

These implementation gates extend, rather than silently replace, the founding charter. Formal adoption shall record the mapping to its gate labels. [file:17]

### F.2 Simulator Gates

Educational labeling → reproducible models → spatial diagnostics → instrument integration → calibrated comparison on identified validation data → independent computational review.

### F.3 Replication Handoff

Provide drawings, materials, permissible substitutions, fixtures, SOPs, qualification requirements, endpoint, threshold, code, limitations, and release duties. External teams must document their own configuration and collect new observations. [file:17]

### F.4 Pause Criteria

Pause when sensitivity is inadequate, mode identity unresolved, confounds unbounded, provenance incomplete, safety absent, or funds insufficient for an interpretable package. Improve, narrow scope, obtain partner access, or close transparently.

---

## APPENDIX G. PUBLICATION, LICENSING & DOCUMENT CONTROL

### G.1 Publication Obligation

Publish results within 60 days of unblinding regardless of positive, equivalent, inconclusive, or technically uninterpretable classification. Include apparatus, qualification, accounting of observations, estimate/uncertainty, tests, controls, deviations, limitations, provenance, funding, and replication status. [file:17]

### G.2 Licenses and Credit

| Output | Proposed default |
|---|---|
| Software | MIT or Apache-2.0 |
| Protocols/reports | CC BY 4.0 |
| Datasets | CC0 or CC BY 4.0 |
| Hardware/fixtures | CERN-OHL-P or CC BY 4.0 as appropriate |
| Name and marks | Not licensed by output policy |

Adopt licenses explicitly and respect third-party restrictions. Record contribution roles; funding alone does not confer authorship. Secure required contributor and contractor rights. [file:17]

### G.3 Revision Control

Track document identifier, previous/new version, date, affected sections, reason, evidence, review, and impact on preregistration. Preserve original releases. Distinguish prospective amendments from deviations and retrospective corrections.

### G.4 Proposed Precedence

1. Applicable law and safety obligations.
2. Adopted governing documents and compatible signed agreements.
3. Preregistered protocol and analysis.
4. Accepted qualification records.
5. Versioned whitepaper.
6. Planning documents.
7. Illustrative web content.

Review contracts for research-integrity compatibility before execution. No contract shall be accepted as permission to suppress outcomes or retrospectively rewrite confirmation. This precedence requires adoption.

---

## APPENDIX H. TERMINOLOGY, EVIDENTIARY CLASSIFICATION & ADOPTION CONDITIONS

### H.1 Definitions

| Term | Meaning |
|---|---|
| Selected mode | Frozen artifact resonance for confirmation |
| Primary measurement | Test/reference resonance ratio |
| Location contrast | Normalized adjusted A-minus-B ratio contrast |
| SESOI | Predefined materiality/equivalence threshold |
| Calibration | Measurement relationship and associated uncertainty |
| Verification | Check against specified requirements |
| Qualification | Acceptance of integrated apparatus for the intended experiment |
| Validation | Evidence of suitability for a stated use |
| Computational reproduction | Regeneration from supplied records/code |
| Independent replication | New experimental data collected independently |
| Digital twin | Versioned model compared with identified qualified observations |
| Provenance | Traceable records, configurations, calibration, analysis |
| DAO-lite | Advisory/treasury arrangement without presumed transfer of authority |

### H.2 Evidentiary Labels

Proposed; simulated; qualified within a defined boundary; measured with retained records; reviewed; independently replicated; Speculative Model; Unverified Theory. No category shall imply a stronger evidentiary state than the records support.

### H.3 Unresolved Parameters

| Parameter | Required closure point |
|---|---|
| Artifact geometry and material requirements | Fabrication acceptance |
| Selected mode and excitation | Qualification |
| Reference timing/pairing | Integrated qualification |
| VNA endpoint role | Protocol freeze |
| Thermal metrics and vacuum conditions | Environmental qualification |
| Baseline ratio and uncertainty treatment | Analysis freeze |
| SESOI and power assumptions | Preregistration |
| Model/dependence and control criteria | Preregistration |
| Exclusion, replacement, missingness | Preregistration |
| Quote-based funding scope | Campaign publication |
| Binding operator and governance | Operational adoption |

### H.4 Adoption Versus Authorization

Whitepaper adoption accepts the framework; it does not authorize LOC-1 acquisition. Conditional design parameters may remain open at framework adoption but must close by the specified gate.

- [ ] Responsible operator and governance identified.
- [ ] Funding scope reconciled.
- [ ] Safety responsibilities assigned.
- [ ] Data and license policy adopted.
- [ ] Independent review completed for the applicable stage.
- [ ] Public claims accurately labeled.
- [ ] Qualification accepted before confirmation.
- [ ] Protocol and analysis preregistered before new confirmatory data.
- [ ] Publication and replication obligations preserved.

### H.5 Consolidation Record

This draft consolidates the five main sections and eight appendices developed in the drafting sequence. It incorporates the revised executive summary and the normalized ppb endpoint throughout; distinguishes exact-zero testing from equivalence and threshold inference; separates development from confirmation; limits the VNA role to demonstrated coupling; clarifies budget scope, thermal metrics, timing, blinding, provenance, and adoption gates.

Source citation tokens are retained from the drafting record. They identify the project-file and web evidence used in the conversation and may require rendering support when this Markdown is published outside that environment.
