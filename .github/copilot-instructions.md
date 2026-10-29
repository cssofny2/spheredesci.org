# Copilot repository instructions

## Read first

Read AGENTS.md before editing. Follow CONTENT_GUIDE.md for publication content, AUTHOR_GUIDE.md for author records, and SPHERE-ADDRESS-STANDARD.md for official addresses. Inspect the current sources and relevant workflow files before making changes. Do not replace newer corrections with historical audit findings. If instructions conflict or evidence is unavailable, identify the conflict rather than inventing a resolution.

## Repository and deployment

This repository contains the public Project S.P.H.E.R.E. website at https://spheredesci.org. It uses static HTML plus generated publication pages, Cloudflare Workers and D1. Consult AGENTS.md for the source-of-truth and generator mapping.

- Work on a branch and submit a pull request. Never commit directly to main.
- A push to main deploys production. Do not merge, enable auto-merge, change deployment settings, or deploy production without separate explicit authorization.
- Edit authoritative MDX, data or generator sources, then rebuild. Do not hand-edit generated publication pages.
- Files not excluded by .assetsignore may be published. Exclude new repository-only planning documents, scripts and configuration as appropriate; do not publish private attachments.
- Never commit credentials, private keys, tokens or personal data.
- Never submit production forms during tests. Intercept requests instead. Do not activate payments, spend money or alter external registrations.

## Runtime and validation

Use Node.js 22 or newer as required by package.json, and Python 3.9 or newer for Python generators. Match the repository's current CI configuration where possible.

From the repository root:

```sh
node --version
python3 --version
npm ci
npm run verify
```

The current verify script builds the publication, checks generated content, lints HTML and runs tests. Read package.json before relying on this description. Run additional generators documented in AGENTS.md for the sources changed. Do not rerun the one-time tools/build-content.py migration.

Check changed routes, internal links, local assets, metadata, canonical URLs and JSON-LD. For visual changes, inspect mobile and desktop layouts and reduced-motion behavior where tools permit. Report any unavailable checks explicitly. Never claim a command passed unless it was executed successfully. Do not change dependency versions or lockfiles merely to bypass a failure.

## Research integrity

- Distinguish hypotheses, proposed procedures, simulations and physical measurements. No physical result, dataset, review, funding total or completed integration exists merely because a plan describes it.
- SPHEREVL and the Control Room are educational simulations, not physical measurements or validation of the underlying hypothesis.
- Preserve transparent hypothesis-origin disclosure. A residual shift does not uniquely establish an intrinsic location effect, and a null result does not settle every variant of a hypothesis.
- Verify registration links and distinguish registration existence from completeness of its numeric analysis commitments. Proposed amendments are not submitted amendments. Never retrospectively alter a locked plan.
- Do not adopt illustrative simulator equivalence margins as physical-study thresholds. Separate pilot and calibration work from confirmatory data.
- Attribute supplied demonstration results as reported, not independently rerun, unless the executable bundle was actually obtained and tested. Hashes and signatures establish consistency relative to trusted inputs, not physical truth, signer independence or independent wall-clock timestamps.
- Keep pending external anchoring, separate key custody and independent review explicitly pending.
- Cite sources that support the specific claim. Do not invent citations, source access, experiment results or successful test runs. Preserve archived releases; date revisions to current sources.
- Use one versioned budget source where established. Keep period, scope, currency, cumulative versus incremental basis, quote status and approval status explicit. Do not invent costs or approvals to reconcile conflicting figures.
- Do not promise equity, tokens, royalties, financial returns or tax deductibility. Proposed roles are not active job offers.

## Completion and pull requests

Before claiming implementation is complete:

1. Inspect the diff against the base branch and confirm actual file changes exist. An empty commit, created PR, passing build or deployed preview is not implementation.
2. Map each requested deliverable to changed files and validation evidence, or mark it unresolved. A nonempty diff alone does not establish scope completion.
3. Inspect the diff for accidental generated churn, unsupported claims, secrets and unrelated changes.
4. Follow the PR template. List changes, tests actually performed, checks not performed, source-access limitations and remaining owner actions.
5. Keep incomplete work clearly marked. Do not claim an agent failure was fixed without a successful execution demonstrating that.

If blocked, preserve useful partial work and report the first actionable error, affected command or step, and what remains undone. Do not create repeated empty PRs or claim success because a task was accepted. These instructions guide behavior; they do not configure branch protection, install dependencies automatically, grant permissions or repair account-level agent access.
