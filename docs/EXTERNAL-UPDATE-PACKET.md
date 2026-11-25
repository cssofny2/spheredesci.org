# External & Repository-Controlled Systems Update Packet

- **Prepared**: 2026-11-24
- **Rule**: No external profile, Zenodo record, OSF registration, DNS record, or live GitHub repository setting was altered from this environment without explicit authorization. Immutable OSF registrations are **never** overwritten. Every external action below includes exact replacement text, owner, access requirement, and verification procedure.

---

## 1. GitHub Repository Settings (`cssofny2/spheredesci.org`)

- **Target Service**: GitHub Repository Metadata
- **Current URL**: `https://github.com/cssofny2/spheredesci.org`
- **Field(s) to Update**: Description, Topics, Release Tag (`v2.0.0-whitepaper` / `site-v1.6.0` after PR merge)
- **Current Value**:
  - Description: `Official public website and open research materials for Project S.P.H.E.R.E. — Spatial Positioning Harmonic Empirical Resonance Experiment.` *(Missing explicit pre-results status notice per Section 23.8.)*
  - Acronym check: Already uses approved canonical expansion **`Spatial Positioning Harmonic Empirical Resonance Experiment`** (NOT "Energy").
  - Topics: `cloudflare-pages`, `desci`, `experimental-research`, `open-science`, `research-infrastructure`, `scientific-method`, `static-website`, `reproducible-research`
- **Exact Replacement Text**:
  - **Description**: `Official website and open-science specifications for Project S.P.H.E.R.E. (Spatial Positioning Harmonic Empirical Resonance Experiment), operated by SPHERE Research, LLC. Pre-results readiness stage; hypotheses are not established conclusions.`
  - **Recommended Topics**: `open-science`, `desci`, `precision-metrology`, `mechanical-resonance`, `experimental-research`, `reproducible-research`, `scientific-method`, `static-website` (optionally drop `cloudflare-pages` since site deploys via Cloudflare Workers static assets)
- **Exact CLI Command (run after merging PR to `main`)**:
  ```sh
  gh repo edit cssofny2/spheredesci.org \
    --description "Official website and open-science specifications for Project S.P.H.E.R.E. (Spatial Positioning Harmonic Empirical Resonance Experiment), operated by SPHERE Research, LLC. Pre-results readiness stage; hypotheses are not established conclusions." \
    --add-topic precision-metrology --add-topic mechanical-resonance
  ```
- **Supporting Source**: `data/program-metadata.json`, `README.md`, `CITATION.cff`
- **Owner**: Michael P. Goodman (`@cssofny2`)
- **Access Requirement**: GitHub repository admin (`cssofny2/spheredesci.org`)
- **Status**: Pending PR merge and manual execution
- **Verification Procedure**: Run `gh repo view cssofny2/spheredesci.org --json description,repositoryTopics` and confirm GitHub displays the `Cite this repository` button powered by `CITATION.cff`.

---

## 2. GitHub Control Room Repository (`cssofny2/sphere-control-room-v2`) & `lab.spheredesci.org`

- **Target Service**: GitHub Repository + Vercel deployment (`lab.spheredesci.org` → `https://sphere-control-room-v2.vercel.app/#/dashboard`)
- **Current URL**: `https://github.com/cssofny2/sphere-control-room-v2` and `https://lab.spheredesci.org`
- **Fields to Update**:
  1. Repository description & `README.md`
  2. Add an explicit open-source `LICENSE` file (e.g., `MIT` or `Apache-2.0` per Whitepaper v2.0 `G.2` — currently missing per `data/vl-repo.json:68`)
  3. UI banner & prototype noise-slider text remediation (remove any message implying low slider settings eliminate artifacts or make a displayed anomaly genuine; add visible **"Level 0 Educational Simulation — Not Measurements or Scientific Validation"** label)
- **Exact Replacement Text (Repository Description)**:
  `SPHEREVL Control Room: Level 0 educational browser simulation of the proposed Project S.P.H.E.R.E. metrology bench (SPHERE Research, LLC). Displays synthetic model outputs only — not physical measurements, a validated digital twin, or scientific validation.`
- **Supporting Source**: Whitepaper v2.0 §22, `vl/index.html`, `data/vl-repo.json`
- **Owner**: Michael P. Goodman (`@cssofny2`)
- **Access Requirement**: Write access to `cssofny2/sphere-control-room-v2` & Vercel project
- **Status**: External repository not mounted in this VM — manual action required
- **Verification Procedure**: After updating `sphere-control-room-v2`, refresh snapshot in this repo via `python3 tools/build-vl.py --snapshot /path/to/sphere-control-room-v2 && npm run verify`.

---

## 3. Zenodo Record — Create New Version (`Version 2.0`) Linked to `10.5281/zenodo.23583932`

- **Target Service**: Zenodo
- **Current URL**: `https://doi.org/10.5281/zenodo.23583932` (Version 1.0, archived 2026-10-22)
- **Rule**: **Do NOT overwrite or delete Version 1.0.** Use Zenodo's **"New version"** workflow so the concept DOI groups v1.0 and v2.0, Version 1.0 remains permanently citable, and Zenodo issues a new version-specific DOI for Version 2.0.
- **Files to Upload for Version 2.0**:
  1. Print-to-PDF export of `https://spheredesci.org/whitepaper/` (`SPHERE-WP-001-v2.0.pdf`)
  2. `assets/whitepaper/SPHERE-WP-001-v2.0.md`
  3. `docs/LOC-1A-DRAFT-AMENDMENT.md` (labeled Draft — Not Yet Registered)
  4. `CITATION.cff`
- **Exact Metadata Fields**:
  - **Title**: `Project S.P.H.E.R.E. Whitepaper (Version 2.0): Open Resonance Metrology, Experimental Controls, and Accountable Research Infrastructure`
  - **Version**: `2.0`
  - **Publication Date**: `2026-11-24` (or actual Zenodo deposit date)
  - **Creator**: `Goodman, Michael P.` | Affiliation: `SPHERE Research, LLC` | ORCID: `0009-0008-3796-5857`
  - **Resource Type**: `Publication / Technical note` (or `Preprint`)
  - **License**: `Creative Commons Attribution 4.0 International (CC BY 4.0)`
  - **Description**:
    > Controlled Version 2.0 technical whitepaper (`SPHERE-WP-001`) for Project S.P.H.E.R.E. (Spatial Positioning Harmonic Empirical Resonance Experiment), operated by SPHERE Research, LLC. Project S.P.H.E.R.E. is a staged experimental research program designed to subject unconventional or source-inspired hypotheses to conventional scientific measurement, metrology, uncertainty analysis, adversarial controls, preregistration, reproducible analysis, fresh confirmation, and independent replication. Supersedes Version 1.0 (`10.5281/zenodo.23583932`). Does not silently amend the immutable OSF Protocol LOC-1 registration (`https://osf.io/5b6mj/overview`); proposed pre-confirmatory refinements are explicitly separated as Draft Amendment LOC-1A. Pre-results; no physical measurements, datasets, or confirmed effects are reported.
  - **Related Identifiers**:
    - `isPreviousVersionOf` / Zenodo automatic versioning link to `10.5281/zenodo.23583932`
    - `references`: `https://osf.io/5b6mj/overview` (Protocol LOC-1 Preregistration)
    - `isIdenticalTo` / `isSupplementedBy`: `https://spheredesci.org/whitepaper/`
    - `isDerivedFrom`: `https://github.com/cssofny2/spheredesci.org`
- **Owner**: Michael P. Goodman
- **Access Requirement**: Zenodo account owning record `23583932`
- **Status**: Pending PR merge and PDF generation
- **Verification Procedure**: Once Zenodo assigns the v2.0 DOI, record it in `data/program-metadata.json` (`whitepaper.v2Doi`), `CITATION.cff`, `content/whitepaper.mdx`, and `tools/build-whitepaper.mjs`, then rebuild and re-verify.

---

## 4. OSF Project & Immutable Protocol LOC-1 Registration

- **Target Service**: Open Science Framework (OSF)
- **Current URLs**:
  - Registration: `https://osf.io/5b6mj/overview` (immutable)
  - Project/Profile: `https://osf.io/qwp5n`
- **Rule**: **NEVER alter or attempt to overwrite the immutable 2026-10-23 LOC-1 registration.**
- **Recommended Manual Actions**:
  1. **Verify public readability of immutable LOC-1 export**: Ensure the full text/PDF of the registered 2026-10-23 Protocol LOC-1 (including exact registered `α`, power, equivalence bounds, and sampling details) is publicly downloadable on `osf.io/5b6mj` so independent reviewers can verify the November 4 `/updates/` caveat.
  2. **Project Description Update (non-registration OSF project page only)**:
     > Project S.P.H.E.R.E. (Spatial Positioning Harmonic Empirical Resonance Experiment), operated by SPHERE Research, LLC. Protocol LOC-1 (`https://osf.io/5b6mj/overview`) is a theory-neutral differential mechanical-resonance experiment testing for a reproducible position-associated residual under controlled conditions. Current status: pre-results readiness and qualification stage. Whitepaper Version 2.0 is published at `https://spheredesci.org/whitepaper/`. Any refinement to LOC-1 will be filed as a dated, versioned pre-confirmatory amendment before confirmatory data collection.
  3. **Pre-Confirmatory Amendment Filing (ONLY after qualification & independent 3-reviewer sign-off)**: File finalized `LOC-1A` as a dated OSF registration update/amendment linked to `https://osf.io/5b6mj/overview` prior to confirmatory acquisition.
- **Owner**: Michael P. Goodman
- **Access Requirement**: OSF administrator for project/registration `5b6mj` / `qwp5n`
- **Status**: Manual review & action required
- **Verification Procedure**: Open `https://osf.io/5b6mj/overview` in an unauthenticated browser window and confirm full protocol PDF/text downloads without login.

---

## 5. Personal Portfolio & Commercial Site (`michaelpgoodman.com`)

- **Target Service**: External website (`michaelpgoodman.com`)
- **Current URLs**:
  - `https://michaelpgoodman.com/`
  - `https://michaelpgoodman.com/projects/sphere-desci-ai-infrastructure`
  - `https://michaelpgoodman.com/projects/sphere-virtual-lab`
- **Field(s) to Update**: Project S.P.H.E.R.E. summary copy, AI-infrastructure case study wording, and entity-separation disclosure
- **Exact Replacement Notice to Include on Project S.P.H.E.R.E. Pages**:
  > **Scientific Status & Entity Separation Notice:** Project S.P.H.E.R.E. (Spatial Positioning Harmonic Empirical Resonance Experiment) is operated by SPHERE Research, LLC as a staged, pre-results experimental research program (`https://spheredesci.org/`). No physical measurements or results exist yet. Local AI tooling and browser simulations (SPHEREVL, Level 0 educational simulator) support software engineering, documentation, and education only; under Project S.P.H.E.R.E.'s AI Governance Firewall, AI systems do not control raw data, exclusions, peak fitting, or confirmatory statistical inference, and local AI infrastructure does not make research scientifically validated. Consulting services offered on `michaelpgoodman.com` are operated independently of Project S.P.H.E.R.E.
- **Supporting Source**: Whitepaper v2.0 §§22, 25, 26 & Appendix E
- **Owner**: Michael P. Goodman
- **Access Requirement**: CMS / host access for `michaelpgoodman.com`
- **Status**: External domain — manual update required
- **Verification Procedure**: Inspect live pages on `michaelpgoodman.com` for canonical acronym expansion, pre-results disclaimer, AI-firewall alignment, and absence of "validated digital twin" or "sovereign AI validates science" claims.

---

## 6. ORCID Profile (`0009-0008-3796-5857`)

- **Target Service**: ORCID
- **Current URL**: `https://orcid.org/0009-0008-3796-5857`
- **Field(s) to Update**: Employment/Affiliation (`SPHERE Research, LLC`, Rochester, NY, start 2026-10-23) and Works list (link Zenodo v1.0 `10.5281/zenodo.23583932`, OSF LOC-1 `https://osf.io/5b6mj/overview`, and Zenodo v2.0 once minted).
- **Owner**: Michael P. Goodman
- **Access Requirement**: ORCID account login
- **Status**: Manual update required
- **Verification Procedure**: View public ORCID record at `https://orcid.org/0009-0008-3796-5857`.

---

## 7. Social Profiles (`x.com/spheredesci` and any future social accounts)

- **Target Service**: X (`https://x.com/spheredesci`) and any active official social profiles
- **Note**: `data/links.json` currently omits `x.com/spheredesci` (left blank); `data/entity-profiles.json` has been updated to exclude unverified social handles from `Organization.sameAs` until verified.
- **Exact Bio Replacement Text (if active)**:
  `Project S.P.H.E.R.E. (SPHERE Research, LLC) — Open resonance metrology testing source-inspired hypotheses under conventional controls, GUM uncertainty & preregistration. Pre-results; no tokens/DAO. https://spheredesci.org`
- **Owner**: Michael P. Goodman
- **Access Requirement**: Account owner credentials
- **Status**: Verify account ownership/activity first; then update bio and add URL back to `data/links.json` & `data/entity-profiles.json`.

---

## 8. Off-Domain Commercial Migration (`Panton Bros, LLC`)

- **Target Service**: External domain / hosting for Panton Bros, LLC (currently staged at `https://spheredesci.org/projects/panton/`)
- **Action Required**: See [`docs/REDIRECT-AND-MIGRATION-MAP.md`](REDIRECT-AND-MIGRATION-MAP.md) for the complete migration record, asset list, and post-migration redirect / archival removal checklist.
