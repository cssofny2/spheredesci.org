# Website QA inventory

Scope: the existing homepage, About, and Charter; new Protocol, Transparency,
Resources, FAQ, Collaborate, Updates, and Privacy pages. No form is to be
submitted during QA because it would send an external email.

- Verify each page loads, has exactly one H1, a unique title/description, canonical
  URL, parseable WebPage/WebSite schema, and valid local navigation.
- Inspect desktop (1440px) and mobile (390px) screenshots of every page.
- Verify the menu opens and closes, links navigate, and Escape restores focus.
- Verify FAQ questions expand and collapse with normal user input.
- Verify anchor links lead to readable headings not covered by the header.
- Verify interest-form labels, input validity, role selection, and privacy link.
  Do not submit or verify actual email delivery.
- Verify reduced-motion mode hides the animated canvas, and readable content
  remains available without JavaScript.
- Verify sitemap lists all ten public content pages; robots.txt references it.
- Verify no horizontal page overflow on mobile; budget tables scroll inside
  their own region rather than clipping.
- Check local asset and internal-document links for missing destinations.
- Off-happy-path: empty required fields reject input, a menu closes via Escape,
  and the 404 page offers a real route back to the research library.
- Intentional exclusions: actual FormSubmit/email delivery, independent research
  review, instrument specifications, formal SEO indexing/ranking, legal-policy
  validation, and any payment processing.
