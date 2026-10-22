# Author guide

Every article author links to a generated page at `/research/authors/<slug>/`. The directory and individual profiles are built from research MDX plus `content/authors.json`.

## Add or update a profile

Edit `content/authors.json`:

```json
[
  {
    "name": "Project S.P.H.E.R.E.",
    "slug": "project-sphere",
    "type": "Organization",
    "bio": "A factual biography that distinguishes the proposed research from completed work.",
    "interests": ["Metrology", "Experimental design"],
    "links": [
      { "label": "Project website", "url": "https://spheredesci.org" }
    ]
  }
]
```

`name` must exactly match the `author` value in article frontmatter. `slug` is lowercase hyphenated text. Use `type: "Organization"` for an organizational author; other profiles are treated as people. Links must use HTTPS or a site-relative URL. Add only links appropriate for public attribution and with the author's permission.

Author pages show the biography, research interests, links, publication count, and article list. The publication count and author/article structured data are generated at build time. If a name appears in frontmatter without a profile, the build creates a minimal profile with an explicit “not provided yet” message; add a reviewed bio before promoting it as a complete profile.

Use real names only with consent. Do not invent credentials, affiliations, review roles, endorsements, or publication histories. The default Project S.P.H.E.R.E. profile identifies the project as pre-launch and makes no claim of measurement results.
