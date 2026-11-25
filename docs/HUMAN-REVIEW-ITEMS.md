# Human-Review Items & Blocked Decisions

Items below require human verification, legal/statistical sign-off, external credentials, or policy authorization before action. None were silently assumed, fabricated, or executed in this PR.

---

## Priority 0 — Verification Required Before Public Release / Merge

1. **Delaware LLC File Number & Public EIN Check (`transparency/index.html` history)**:
   - Commit `74401d71` (2026-10-24) published `File No. 2358393; EIN 43-2602592` on `/transparency/`.
   - **Red flag 1**: `2358393` is identically the first 7 digits of Zenodo DOI `10.5281/zenodo.23583932`, strongly suggesting a copy-paste error rather than an authenticated Delaware Division of Corporations file number.
   - **Red flag 2**: `SPHERE-WP-001-v1.6.docx` explicitly states corporate records were not agency-authenticated and keeps the IRS CP575G EIN private (`AGENTS.md` Rule 5 also bars publishing sensitive identifiers).
   - **Action taken in PR**: Removed the unverified File No. and EIN from public HTML while retaining `SPHERE Research, LLC (Delaware LLC, formed October 23, 2026)`.
   - **Human action needed**: Verify the actual Delaware Certificate of Formation number from the official state filing and confirm whether the LLC prefers to keep the EIN private (recommended).

2. **Public Export of Immutable OSF LOC-1 Protocol Text (`https://osf.io/5b6mj/overview`)**:
   - External reviews (Gemini 11.24, Perplexity 11.26) and `/updates/` (Nov 4, 2026) noted that specific statistical parameters (`α`, power, SESOI, equivalence bounds) could not be directly verified in public OSF registration text.
   - **Human action needed**: Confirm the full immutable LOC-1 specification PDF/markdown is publicly accessible without login on `osf.io/5b6mj`, and verify whether `α = 0.01`, `≥90%` power, and TOST equivalence testing appear in the registered text or belong exclusively in `Draft Amendment LOC-1A`.

3. **Motivating Geometry Decision (`3–4 in` / `76.2–101.6 mm` vs `9.2 mm` Compact Shell) & `LOC-1A` Filing**:
   - Whitepaper v2.0 §7 and `docs/LOC-1A-DRAFT-AMENDMENT.md` reconcile the motivating Bashar parameters (6–10 ft flat table, 3–4 in very thin hollow copper ball → ~20–28 kHz breathing mode / low-kHz flexural modes) with registered LOC-1's compact `9.2 mm` / `>230 kHz` / `0.40 m` baseline.
   - **Human action needed**: Commission analytical + FEM modal modeling and an experimental modal survey during the `$10,000` readiness phase, select the final geometry and mode, freeze qualification-derived thresholds, obtain independent 3-reviewer sign-off (≥2 metrology/physics reviewers + 1 distinct statistician), and submit finalized `LOC-1A` to OSF before confirmatory data collection.

---

## Priority 1 — External Deposits, Repository Settings & Licensing

4. **Zenodo Version 2.0 Deposit**:
   - After merging this PR and checking the Cloudflare preview/production render, export `https://spheredesci.org/whitepaper/` to PDF and deposit as a **new version** linked to `10.5281/zenodo.23583932` (preserving v1.0 unchanged). Then back-fill the minted v2.0 DOI into `data/program-metadata.json`, `CITATION.cff`, and `content/whitepaper.mdx`.

5. **GitHub Repository Description & Topics (`cssofny2/spheredesci.org`)**:
   - Run the `gh repo edit` command in `docs/EXTERNAL-UPDATE-PACKET.md` §1 after PR merge.

6. **SPHEREVL Control Room Repo (`cssofny2/sphere-control-room-v2`) & `lab.spheredesci.org`**:
   - Add an explicit open-source `LICENSE` file (currently absent per `data/vl-repo.json`).
   - Audit and remove any legacy noise-slider message suggesting low simulated noise makes a displayed difference genuine, and ensure visible **"Level 0 Educational Simulation — Not Measurements"** labeling across all Control Room views.
   - Refresh `data/vl-repo.json` via `python3 tools/build-vl.py --snapshot ...`.

7. **Homepage Explainer Video Audio / Visual Re-Cut (`assets/video/locational-variable-explainer-v2.mp4`)**:
   - This PR corrected the `.vtt` caption/transcript framing and added a prominent Scientific Accuracy & Correction Note on `index.html`, because the binary `.mp4` audio track cannot be re-recorded in text.
   - **Human action needed**: Re-record/replace `locational-variable-explainer-v2.mp4` so the spoken narration matches the corrected transcript (mechanical LDV vs EM, bounded isolation, `>230 kHz` test band vs shift, residual ≠ proof of encoded property).

8. **Panton Bros, LLC Off-Domain Migration**:
   - Provision a separate domain for Panton Bros, LLC, move `projects/panton/index.html` and `assets/projects/panton/*`, set a 301 redirect if desired, and then remove `/projects/panton/` and `/projects/` from `spheredesci.org` (per `docs/REDIRECT-AND-MIGRATION-MAP.md`).

---

## Priority 2 — Standards, Legal, Governance & Verification

9. **Clause-Level Metrologist Check of 2026 JCGM Publications**:
   - `JCGM 100:2008/Amd.1:2026` (*Non-linearity in measurement models*) and `JCGM GUM-5:2026` (*Examples*) were verified in BIPM's 2026 publication catalog, but full PDF clause text was not parsed inline. Have the independent metrologist verify exact clause citations before freezing the confirmatory uncertainty spreadsheet.

10. **Legal, Tax & Licensing Counsel Review**:
    - Confirm licensing boundaries across website code (`MIT`), future analysis software (`Apache-2.0`), text/reports (`CC BY 4.0`), datasets (`CC BY 4.0` / `CC0 1.0`), and open hardware (`CERN-OHL-P-2.0`).
    - Confirm compliance terms before opening any `$10,000` / `$50,000` non-equity public funding campaign (explicitly no tax-deductibility claim without fiscal sponsorship or 501(c)(3) status).
    - **Do NOT adopt** any item in Whitepaper Appendix F (DAO, tokens, IP-NFTs, futarchy, Wyoming/Cayman/Marshall Islands entities) without formal securities, tax, IP, and governance counsel review.

11. **Social Profile & `michaelpgoodman.com` Alignment**:
    - Verify whether `https://x.com/spheredesci` is active and owned by SPHERE Research, LLC; if so, update bio per `docs/EXTERNAL-UPDATE-PACKET.md` §7 and add URL to `data/links.json` and `data/entity-profiles.json`.
    - Update `michaelpgoodman.com` S.P.H.E.R.E. case study pages per `docs/EXTERNAL-UPDATE-PACKET.md` §5.

12. **`tools/learn_pages.py` Synchronization**:
    - Remember 10 of 12 `/learn/` guides were hand-expanded directly in HTML on disk (+11.6k words) and have diverged from `tools/learn_pages.py`. Do not run `python3 tools/build-learn.py` unless `tools/learn_pages.py` is first updated or retired.
