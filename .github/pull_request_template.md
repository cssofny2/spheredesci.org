## Purpose

Improve repository security, protect the production branch, and
standardize the publishing workflow for cssofny2/spheredesci.org.

GitHub hosts the source repository; Cloudflare Pages publishes the website.

## Scope

This PR documents the intended settings and any related repository files.

Repository settings must be applied separately through GitHub's
administration interface or API. Merging this PR does not apply them.

## Settings checklist

Check each item only after the setting has been applied and verified.
Leave deferred items unchecked and explain them below.

### Critical: Credential protection

- [ ] Verify that secret scanning is active.
- [ ] Enable repository push protection if available.
- [ ] Review any existing secret-scanning alerts.
- [ ] Confirm that no credentials are included in this PR.

### Critical: Production branch protection

- [ ] Create an active branch ruleset targeting `main`.
- [ ] Block force pushes to `main`.
- [ ] Block deletion of `main`.
- [ ] Document any narrowly scoped emergency administrator bypass.

### High: Publishing workflow

- [ ] Require pull requests before merging into `main`.
- [ ] Initially require zero approving reviews.
- [ ] Verify that the maintainer can complete the normal PR workflow.
- [ ] Identify the exact Cloudflare deployment check name before
      making it a required status check.

### Medium: Merge hygiene

- [ ] Enable squash merging as the preferred merge method.
- [ ] Keep other merge methods available initially.
- [ ] Enable automatic deletion of merged head branches.

### Low: Repository metadata

- [ ] Replace `reporoducible-research` with `reproducible-research`.
- [ ] Preserve all other existing topics.
- [ ] Disable the Wiki only after confirming it contains no
      documentation that needs to be retained or migrated.

## Repository files changed

List actual file changes, or write “None — settings documentation only.”

- 

## Applied settings

Record the setting, date applied, and verification evidence.
Do not include tokens, credentials, or sensitive screenshots.

| Setting | Date applied | Verification |
|---------|--------------|--------------|
|         |              |              |

## Deferred settings

List anything not applied and explain why.

- Required Cloudflare status check: deferred until the exact check
  name and successful PR behavior have been verified.
- Required signed commits: deferred until contributor and automation
  compatibility have been tested.
- Mandatory external approval: deferred while the project uses a
  single-maintainer workflow.

## Settings preserved

- Public repository visibility.
- Repository name and `main` default branch.
- Website URL: https://spheredesci.org.
- Issues enabled.
- GitHub Pages disabled.
- Projects and Discussions unchanged.
- Existing MIT license and project description.
- Cloudflare integration and deployment configuration.

## Validation

- [ ] Confirm this PR contains only the intended changes.
- [ ] Verify branch protection without force-pushing to or deleting
      the production branch.
- [ ] Verify that an ordinary feature-branch PR can be merged.
- [ ] If deployment-affecting changes are included, confirm the
      Cloudflare Pages deployment succeeds.
- [ ] If the website is deployed, check the homepage and key routes.
- [ ] Record any verification that could not be completed.

## Recovery plan

If a new rule unexpectedly prevents normal publishing:

1. Identify the specific rule or required check causing the problem.
2. Use the documented administrator recovery path.
3. Correct only the problematic requirement.
4. Re-test the normal pull-request workflow.
5. Record the adjustment here.

Reverting this PR does not revert GitHub repository settings.
Settings must be restored separately.

## Deployment impact

Select one:

- [ ] Documentation only; no intended website change.
- [ ] Repository settings only; no intended website-content change.
- [ ] Includes website or workflow files; deployment impact described below.

Details:

## Reviewer notes

Outstanding decisions, exceptions, and verification limitations:

-
