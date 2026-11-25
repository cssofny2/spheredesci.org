# Project S.P.H.E.R.E. Whitepaper Version-to-Version Change Log

Document ID: `SPHERE-WP-001`  
Canonical HTML URL: `https://spheredesci.org/whitepaper/`

---

## Version 2.0 — Controlled Versioned Specification (2026-11-24)

**Status**: Controlled versioned technical specification — pre-results; proposal and readiness stage.  
**Supersedes**: Version 1.0 (2026-10-22, archived at Zenodo DOI `10.5281/zenodo.23583932`) and unpublished internal working compilation Version 1.6 (2026-10-30).  
**Governing Phase 1 Record**: Does **not** silently amend the immutable OSF Protocol LOC-1 registration (`https://osf.io/5b6mj/overview`, 2026-10-23). All proposed protocol refinements are isolated in Appendix A (`Draft Amendment LOC-1A`).  
**Zenodo Archive Status**: Version 2.0 deposit pending manual Zenodo new-version release (prior Version 1.0 remains permanently preserved at `10.5281/zenodo.23583932`).

### Summary of Substantive Changes from v1.0 (Published) and v1.6 (Internal Compilation)

1. **Document Control & Authority Hierarchy (§§3, 5)**:
   - Added complete Document-Control Block (document ID, version, date, legal operator, ORCID, canonical URL, prior Zenodo DOI, OSF LOC-1 URL, supersedes list, scientific status, licensing, citation format, source repository).
   - Added explicit **"How to read this document"** notice and 7-tier Document & Evidence Precedence table.
   - Adopted verbatim program-level, LOC-1, and ANT-B-01 theory-neutral positioning statements and the 12-Stage Program-Level Evidence Gate.
2. **Motivating Experimental Base & 230 kHz / Low-kHz Reconciliation (§§4, 7)**:
   - Grounded the experimental origin explicitly in the source-inspired motivating parameters: a very flat 6–10 ft (1.83–3.05 m) table and a very thin 3–4 inch (76.2–101.6 mm) hollow copper sphere excited at Position A and Position B, while explicitly quarantining the passage's follow-on actuation, relocation, and ship-bubble extrapolations as out-of-scope speculative conjecture.
   - Added a 20-parameter Artifact & Mode Specification Table directly comparing Motivating-Scale (3–4 in, ~20–28 kHz breathing mode / low-kHz flexural modes) vs Registered Compact-Scale (9.2 mm OD, ~218–229 kHz breathing mode), explicitly stating that `230 kHz` is hypothesis-inherited (not a physical threshold) and final geometry/mode are TBD by FEM, modal survey, and qualification.
   - Explicitly barred transferring GHz / >100 GHz thin-film piezoelectric resonator claims (`Kramer et al. 2025`, `Diamandi et al. 2025`) to macroscopic copper shells.
3. **Primary Endpoint & Measurement Pipeline (§8)**:
   - Replaced v1.0's unnormalized ratio-difference formula `10^9(r̄_A - r̄_B)` with baseline-normalized primary endpoint `θ = (μ_A - μ_B) / μ_B`, `Δ_ppb = 10^9 θ` (preserving log-ratio `z_p = ln(f_{T,p}/f_{R,p})` as prespecified sensitivity analysis) and added the 8-stage raw-to-inference pipeline and block-adjusted linear model.
4. **Operational Placement, Settling, Thermal & Mode-Identity Specifications (§§9–11)**:
   - Added full 28-element operational definition of a single placement and explicit anti-pseudoreplication rule.
   - Replaced elapsed-time-only 30-minute settling with measurable qualification-frozen environmental/signal acceptance criteria (banning "frequency stopped changing" as sole criterion).
   - Restored and hardened quantitative thermal planning analysis (`~10^-4 K^-1` ≈ 23 Hz/K / 100 ppb per mK at 230 kHz; ~2.1 Hz/K at 21 kHz; showing why `±1 mK` enclosure control ≠ ppb residual uncertainty) alongside artifact-specific quadratic calibration `ln f_i(T) = a_i + β_i(T - T_0) + q_i(T - T_0)^2`.
   - Added mandatory deterministic frequency estimator lock + Modal Assurance Criterion (`Allemang 2003`) to address manual modal-ID variance (up to 10 Hz documented on copper shells in `hal-01511297`).
5. **Instrumentation, Synchronization, GUM Uncertainty & Allan Deviation (§§12–14)**:
   - Enforced strict optical-primary / VNA-diagnostic separation, `ISO 16063-41:2011` (0.4 Hz–50 kHz) calibration scope warning, explicit disqualification of sequential scanning LDVs for simultaneous multi-object comparison, and 5-stage uncertainty-driven procurement (moving brand/price estimates to Appendix B).
   - Codified 4-layer synchronization architecture (common 10 MHz reference ≠ synchronized acquisition).
   - Expanded GUM uncertainty model (`JCGM 100:2008`, `101:2008`, `102:2011`, `GUM-1:2023`, `GUM-6:2020`) to 34 explicit contributions (adding fluid-structure gas coupling, electrostatic charging, humidity, patch potentials, actuator back-action, anti-double-counting matrix, and Allan deviation per `NIST SP 1065`).
6. **Stage Separation, Statistics, 17-Row Control Matrix & Blinding (§§15–19)**:
   - Separated Qualification, Pilot, Confirmation, and Independent Replication with 10 explicit requalification triggers and no silent data pooling.
   - Repaired statistical decision rules into 3 distinct questions and a 4-outcome difference/equivalence matrix (`Schuirmann 1987`, `Lakens 2017`, `Simmons et al. 2011`), labeling `α=0.01` / `90%` power honestly as v1.2 proposed planning values pending OSF reconciliation & independent statistical freeze.
   - Converted all 17 controls into scheduled experiments with explicit metrics, acceptance rules (`TBD by qualification`), and binding failure consequences.
7. **Phase 2 Roadmap, Independent Track ANT-B-01, Digital Twin Ladder, AI Firewall, DeSci Governance & Domain Hygiene (§§20–27, Appendices A–G)**:
   - Partitioned Phase 2 extensions (6–10 ft bench / 3–4 in campaign, 4-object synchronized array, environmental replay, MOD-1 / A1–B–A2, Appendix K celestial metadata) cleanly away from registered LOC-1.
   - Added scientifically and inferentially independent **Track ANT-B-01** (*Draft / Proposed / Unregistered*) with complete energy-accounting requirements (*"Resonance and stored energy are not energy generation"*).
   - Replaced broad "digital twin" claims with a 5-level VVUQ capability ladder (`ASME VVUQ`, `10.1080/27525783.2026.2668886`), placing SPHEREVL explicitly at **Level 0: Educational Simulator**.
   - Added an explicit **AI Governance Firewall** (`Shilina 2025`), barring autonomous AI control of raw data, exclusions, peak fitting, or confirmatory inference.
   - Removed active `DAO-lite` / `Formal DAO` / on-chain commitments from the main text; established accountable non-token **SPHERE Research, LLC** governance, reconciled the `$10,000` readiness / `$50,000` staged budget against historical tiers, quarantined exploratory Web3/DAO/IP-NFT options strictly to Appendix F, and documented entity/domain separation (Appendix E).
   - Replaced broken v1.0 citations and PNG-only v1.6 equations with KaTeX/MathML equations, 10 original accessible SVG diagrams, a 30+ entry verified claim-matched bibliography (§32), and a clean downloadable Markdown export (`/assets/whitepaper/SPHERE-WP-001-v2.0.md`).

---

## Version 1.6 — Internal Editorial Compilation (2026-10-30, Unpublished on Website)

- Internal `.docx` compilation (`SPHERE-WP-001-v1.6.docx`) consolidating v1.2, v1.4 (MOD-1), v1.5 (Celestial Motion / Appendix K), and Oct 23/30 SPHERE Research, LLC entity/readiness defaults (`$10,000` readiness within `$50,000` target, non-equity-first LLC accountability, baseline-normalized endpoint `/r_0`, 3-person distinct review rule, `Apache-2.0` / `CC BY 4.0` / `CERN-OHL-P-2.0` licenses).
- Never published to `spheredesci.org` or Zenodo; lacked OSF/Zenodo identifiers, ANT-B-01, quantitative `10^-4 K^-1` thermal calculation, Allan deviation, operational placement/settling/control acceptance rules, AI governance firewall, COI/domain-hygiene appendix, and formal bibliography; equations were embedded as PNG images. Superseded and consolidated by Version 2.0.

---

## Version 1.1 — Unbuilt Consolidated Technical Draft (`content/whitepaper-v1.1-full.md`, 2026-10-10)

- Orphaned repository draft with Appendices A–H and baseline-normalized contrast formula (`r_0`); contained raw `[file:17]`/`[web:76]` citation placeholders and was never compiled into `whitepaper/index.html`. Retained only in repository history as an archival source; superseded by Version 2.0.

---

## Version 1.0 — Initial Public Whitepaper (2026-10-22; Archived at Zenodo DOI `10.5281/zenodo.23583932`)

- First publicly rendered edition on `spheredesci.org/whitepaper/` (5 sections, no appendices).
- Retained Oct 2 pre-entity baseline, unnormalized ratio-difference formula `10^9(r̄_A - r̄_B)`, `$350k–$520k` MVP and `$969k–$1,732k` turnkey budgets, 4-stage `Founding → DAO-lite → Formal DAO` ladder, and mislinked citation URLs. Permanently preserved on Zenodo at `10.5281/zenodo.23583932`; superseded by Version 2.0.
