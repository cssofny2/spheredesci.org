# Project S.P.H.E.R.E. address standard

Effective: October 7, 2026.

- Project S.P.H.E.R.E. main organization website: https://spheredesci.org
- SphereVL overview and Launch Lab page: https://spheredesci.org/vl
- Live Lab, initially opening the S.P.H.E.R.E. Control Room: https://lab.spheredesci.org

SphereVL is the lab initiative's product brand. Project S.P.H.E.R.E. is the parent organization. Use these addresses in new website content, marketing copy, documentation, application metadata, and deployment configuration. Earlier proposed lab addresses are not the official primary addresses.

Implementation requirements:
- Preserve the main organization website at its current address.
- Provide an overview page at /vl with a Launch Lab link to https://lab.spheredesci.org.
- Use https://lab.spheredesci.org as the live application's canonical origin.
- Update canonical tags, social metadata, navigation, and relevant sitemap entries to match the appropriate page.
- Use robots.txt for crawler directives and sitemap.xml for sitemap data; do not introduce robots.xml as a replacement.
- Preserve existing unrelated routes, DNS records, email records, and security settings.
- Review old lab URLs before configuring redirects; do not redirect unrelated projects.
- Clearly identify the Control Room as an educational simulation, not physical measurements or scientific validation.

This document records the approved standard; it does not assert that all implementation tasks or live URL checks are complete.
