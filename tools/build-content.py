"""Build static public pages and shared navigation. No credentials or backend."""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
FULL = "Spatial Positioning Harmonic Empirical Resonance Experiment"
BASE = "https://spheredesci.org"
DATE = "2026-10-02"
NAV = [("about", "About"), ("protocol", "Protocol"), ("transparency", "Transparency"),
       ("resources", "Resources"), ("faq", "FAQ")]
MORE = [("charter", "Research charter"), ("collaborate", "Collaborate"),
        ("updates", "Project updates"), ("privacy", "Privacy notice")]

def nav(current=""):
    def link(slug, title):
        active = ' aria-current="page"' if slug == current else ''
        return f'<a href="/{slug}/"{active}>{title}</a>'
    menu = ''.join(link(*item) for item in MORE)
    mobile = ''.join(link(*item) for item in NAV) + menu
    return f'''<a class="skip-link" href="#main-content">Skip to content</a>
<nav class="site-nav" aria-label="Main navigation">
<a href="/" aria-label="Project S.P.H.E.R.E. home"><img class="nav-logo" src="/assets/brand/sphere-lockup-compact.svg" alt="S.P.H.E.R.E." width="435" height="136"></a>
<div class="nav-links">{''.join(link(*item) for item in NAV)}
<details class="site-menu"><summary>More</summary><div class="menu-panel">{menu}</div></details>
<a class="nav-join" href="/#join">Get involved</a></div>
<details class="site-menu mobile-only"><summary>Menu</summary><div class="menu-panel"><a href="/">Home</a>{mobile}<a href="/#join">Register interest</a></div></details>
</nav>'''

def footer():
    return f'''<footer class="site-footer"><div class="footer-inner"><div class="footer-grid">
<div><p class="footer-name">Project S.P.H.E.R.E.</p><p>{FULL}</p>
<p>Independent, open experimental research.<br>Proposal stage. No measurement results yet.</p></div>
<div><h3>Research</h3><a href="/protocol/">First experiment</a><a href="/charter/">Research charter</a><a href="/resources/">Research resources</a><a href="/faq/">Questions &amp; answers</a></div>
<div><h3>Project</h3><a href="/transparency/">Budget &amp; transparency</a><a href="/collaborate/">Collaborate</a><a href="/updates/">Updates</a><a href="/privacy/">Privacy notice</a><a href="https://github.com/cssofny2/spheredesci.org">GitHub repository</a></div>
</div><p>Hypotheses are not findings. Contributions do not purchase equity, tokens, royalties, or a financial return.</p>
<p>&copy; 2026 Project S.P.H.E.R.E. Research-page text is offered under CC BY 4.0; third-party materials retain their own terms.</p></div></footer>'''

def note(text):
    return f'<div class="note">{text}</div>'

def section(id, title, body):
    return (id, title, body)

FAQS = [
("What is Project S.P.H.E.R.E.?",
 "S.P.H.E.R.E. stands for Spatial Positioning Harmonic Empirical Resonance Experiment. It is an independent research initiative proposing a controlled test of whether moving a copper sphere produces a reproducible change in its resonant frequency after ordinary environmental effects are accounted for."),
("Has the locational-variable hypothesis been proven?",
 "No. The project has no measurement results, and it does not treat the hypothesis as established physics. An unexpected signal would first need artifact checks, conventional explanations, and independent replication."),
("Where does the idea come from?",
 "The project is inspired by the locational-variable concept in the Bashar material presented by Darryl Anka. That is the origin of the question, not empirical evidence for the answer. Mentioning it does not imply endorsement by Darryl Anka."),
("Why test a copper sphere above 230 kHz?",
 "The proposed protocol uses a hollow copper sphere and a selected mechanical resonance above 230 kHz, following the project's source-inspired measurement proposal. This frequency is a proposed test band, not an experimentally validated threshold. The sphere's dimensions, resonance mode, and achievable sensitivity still require validation."),
("What does a null result mean?",
 "A null result would establish an upper bound on the location-associated effect under the tested conditions, if the uncertainty is sufficiently small. A nonsignificant test alone does not show that the effect is absent. If the system is too noisy to distinguish the proposed effect, the result is inconclusive instead."),
("What is the smallest effect of interest?",
 "It is the minimum frequency difference the study is designed to distinguish from negligible effects. It will be selected and justified after calibration, then frozen before confirmatory data collection. The current draft does not invent a final sensitivity number before the instrument has been qualified."),
("Is this a teleportation or consciousness experiment?",
 "No. The founding phase measures resonance of passive copper artifacts. Teleportation, intention experiments, human subjects, and medical or wellness applications are outside its scope."),
("Is there a DAO, token sale, or investment opportunity?",
 "No DAO or token sale has been launched for this project. The founding phase prioritizes the legal entity, research review, financial controls, and conventional non-investment support. Registering interest does not confer ownership or promise financial returns."),
("Can I donate now?",
 "The website is currently collecting expressions of interest, not payments. Fundraising will be announced only after the operating entity, financial controls, and campaign terms are ready. Do not send money or crypto based on this website's draft budget."),
("Are contributions tax-deductible?",
 "No tax-deductibility representation is currently made. The project has not announced charitable status or a fiscal sponsorship arrangement. Any future campaign must state the legal recipient and applicable terms."),
("Where will data and analysis be published?",
 "The plan is to publish raw measurements, environmental logs, code, deviations, and a report, with stable archival links. No dataset, DOI, or preregistration has been issued yet. The resource library distinguishes available documents from planned outputs."),
("How can I help?",
 "The project needs independent protocol reviewers, precision-measurement and statistics expertise, instrument-access partners, and documentation contributors. Use the collaboration page or the interest form. Funding alone does not grant authorship or influence results.")
]

pages = {
"protocol": {
 "title":"Copper Sphere Resonance Experiment: LOC-1 Protocol",
 "description":"Explore S.P.H.E.R.E.'s draft copper sphere resonance experiment: blinded location comparisons, reference artifacts, environmental controls, and null-result criteria.",
 "label":"Research / Draft protocol",
 "h1":"One question. A controlled first experiment.",
 "lede":"LOC-1 is the proposed same-laboratory pilot for the locational-variable hypothesis. This is a reviewable design summary, not a completed experiment or an issued preregistration.",
 "sections":[
 section("question","The question we are testing",f'''<p>Does moving the same hollow copper sphere between two fixed positions produce a repeatable resonance difference that survives controls for temperature, mounting, timing, and other measured conditions?</p>
 {note('<strong>Status: draft, before independent review.</strong> No confirmatory measurements have been collected. Sphere geometry, selected mode, settling criteria, sample size, and final statistical model must be qualified before preregistration.')}'''),
 section("design","The LOC-1 design",'''<p>A test sphere moves between positions A and B in one controlled enclosure. A matched reference sphere remains fixed. The primary observable is the ratio of test-sphere frequency to reference-sphere frequency; its A/B difference is expressed as a fractional frequency shift.</p>
 <div class="table-wrap"><table><thead><tr><th>Design item</th><th>Current recommended default</th></tr></thead><tbody>
 <tr><td>Positions</td><td>0.40 m center-to-center in one enclosure</td></tr>
 <tr><td>Primary readout</td><td>Non-contact optical vibration measurement</td></tr>
 <tr><td>Secondary exploration</td><td>Near-field electromagnetic measurement; not the same observable as mechanical resonance</td></tr>
 <tr><td>Test band</td><td>One identifiable mechanical mode above 230 kHz, subject to feasibility validation</td></tr>
 <tr><td>Placement schedule</td><td>At least 40 placements per position, increased if calibration-based power analysis requires</td></tr>
 <tr><td>Settling</td><td>Initial 30-minute default; calibration may require longer</td></tr>
 <tr><td>Significance threshold</td><td>Two-sided alpha 0.01 for the single preregistered primary test</td></tr>
 <tr><td>Precision target</td><td>To be established experimentally; not a guaranteed instrument specification</td></tr></tbody></table></div>
 <p>The optical and electromagnetic channels measure different properties. An optical signal need not have an electromagnetic counterpart. Their relationship and interpretation will be defined before either is used to support a conclusion.</p>'''),
 section("controls","Controls before conclusions",'''<ul>
 <li><strong>Thermal characterization:</strong> deliberately vary temperature during calibration to measure each artifact's frequency response.</li>
 <li><strong>Mount repeatability:</strong> lift and replace the sphere at one position to quantify handling-induced scatter.</li>
 <li><strong>Shared reference:</strong> track common clock and environmental drift while retaining independent checks for differential effects.</li>
 <li><strong>Blinded labels:</strong> an independent position keeper holds the placement key; the analyst receives coded data.</li>
 <li><strong>Sham moves and rotations:</strong> distinguish a positional signal from handling, orientation, and mounting effects.</li>
 <li><strong>Environmental logs:</strong> preserve temperature, humidity, pressure, magnetic-field, and vibration records alongside measurement data.</li></ul>
 <p>Matched objects are not assumed to be identical, and no enclosure makes every extrinsic variable perfectly equal. Calibration and an uncertainty budget are essential.</p>'''),
 section("analysis","What will count as an outcome?",'''<h3>Null at the tested sensitivity</h3><p>A preregistered equivalence criterion must place the effect within the smallest-effect bounds. That supports a bounded null result for this object, mode, position separation, and uncertainty, not universal disproof of every interpretation of the source idea.</p>
 <h3>Candidate signal for follow-up</h3><p>A signal must exceed the smallest effect of interest, pass the primary test, survive controls and uncertainty checks, and show consistency across independent blocks. This would trigger investigation and replication, not a claim of new physics.</p>
 <h3>Inconclusive</h3><p>If neither equivalence nor the signal criteria are met, or controls fail, report the study as inconclusive. Larger error bars must not be disguised as evidence of no effect.</p>
 <p>Calibration will inform effect bounds and power calculations. Repeated placements are not automatically independent observations: temporal drift and within-block dependence must be addressed in the final model.</p>'''),
 section("preregister","Before data collection",'''<p>The final plan will identify the selected mode, acquisition procedure, independent experimental unit, primary outcome, exclusions, covariates, uncertainty treatment, multiplicity rules, stopping rule, and decision criteria. It will also explain what happens if a fit fails or a sensor goes offline.</p>
 <p>Preregistration creates a time-stamped study plan before data collection or analysis, according to the <a href="https://help.osf.io/article/330-welcome-to-registrations">OSF registration guidance</a>. The <a href="https://www.cos.io/initiatives/prereg">Center for Open Science</a> explains how it separates planned analyses from exploratory work and recommends transparent disclosure of changes.</p>
 <p>There is no public OSF registration for LOC-1 yet. The project will link the actual record here once it has been created.</p>'''),
 section("release","Release and replication",'''<p>The planned release includes raw measurements, environmental logs, metadata, analysis scripts, deviations, and a replication package. Results are to be published within 60 days of unblinding, regardless of outcome.</p><p>Review the <a href="/charter/">research charter</a> for the stage gates, or <a href="/collaborate/">offer protocol-review or replication expertise</a>.</p>''')
 ]},
"transparency":{
 "title":"Research Budget, Funding & Transparency | S.P.H.E.R.E.",
 "description":"Review the draft first-year S.P.H.E.R.E. research budget, spending safeguards, funding readiness, and the distinction between planning estimates and money raised.",
 "label":"Project / Stewardship",
 "h1":"A visible plan for every dollar.",
 "lede":"The first year is scoped around protocol review, measurement-system qualification, a controlled pilot, and public reporting. A budget is a planning estimate, not evidence that funds have been raised.",
 "sections":[
 section("status","Funding readiness",note("<strong>Pre-funding and pre-entity.</strong> The recommended LLC has not been reported as formed. No public payment collection, DAO, token sale, treasury balance, or fundraising total is asserted here. The site currently accepts expressions of interest only.") + '''<p>The proposed entity name is S.P.H.E.R.E. Labs LLC. Its legal existence, final name, bank details, and campaign terms must be confirmed before a public raise. No contribution is represented as tax-deductible.</p>'''),
 section("budget","Draft first-year budget",'''<p>Two scenarios are retained from founding packet version 0.2. Lean assumes founder-heavy work and borrowed or rented instrument access. Standard provides more professional instrument time and paid review. Both exclude salaried staff, dedicated lab rent, DAO formation, token legal work, and liquidity provisioning.</p>
 <div class="table-wrap"><table><thead><tr><th>Category</th><th>Lean (USD)</th><th>Standard (USD)</th></tr></thead><tbody>
 <tr><td>Lab and measurement equipment</td><td class="numeric">$12,900</td><td class="numeric">$37,800</td></tr>
 <tr><td>Website, documentation, and media</td><td class="numeric">$515</td><td class="numeric">$3,255</td></tr>
 <tr><td>Independent review and advisors</td><td class="numeric">$3,500</td><td class="numeric">$12,500</td></tr>
 <tr><td>Legal, accounting, insurance, compliance</td><td class="numeric">$3,559</td><td class="numeric">$9,509</td></tr>
 <tr><td>Community and fundraising</td><td class="numeric">$3,050</td><td class="numeric">$11,850</td></tr>
 <tr><td>Subtotal</td><td class="numeric">$23,524</td><td class="numeric">$74,914</td></tr>
 <tr><td>Contingency (15%, rounded)</td><td class="numeric">$3,529</td><td class="numeric">$11,237</td></tr>
 <tr><td><strong>Total</strong></td><td class="numeric"><strong>$27,053</strong></td><td class="numeric"><strong>$86,151</strong></td></tr></tbody></table></div>
 <p>The approximate public range is $27,000 to $86,000. None of these line items are vendor quotes. The budget needs revision once instrument access, facility arrangements, and current fees are known.</p>
 <p>Fundraising fees in the source plan assumed a $25,000 lean raise or a $75,000 standard raise. Those assumptions are below the respective fully funded totals. Campaign targets and processing fees must therefore be recalculated before launch, or the gap explicitly covered by documented founder capital or in-kind support.</p>'''),
 section("gates","Funding follows readiness",'''<ol class="roadmap">
 <li class="current"><span class="stage-id">G0</span><div><h3>Founding packet</h3><p>Draft published; adoption and independent feedback remain outstanding.</p></div></li>
 <li><span class="stage-id">G1</span><div><h3>Protocol review</h3><p>Two independent reviewers and a statistician review the final experiment plan.</p></div></li>
 <li><span class="stage-id">G2</span><div><h3>Measurement qualification</h3><p>Calibration establishes uncertainty, stability, and detectable-effect bounds.</p></div></li>
 <li><span class="stage-id">G3</span><div><h3>Preregistration</h3><p>The confirmatory design and analysis are frozen before data collection.</p></div></li>
 <li><span class="stage-id">G4</span><div><h3>Pilot and reporting</h3><p>The blinded study and its analysis are released, including null or inconclusive outcomes.</p></div></li>
 <li><span class="stage-id">G5</span><div><h3>Independent replication</h3><p>An independent group tests whether any candidate signal survives repetition.</p></div></li></ol>'''),
 section("controls","Financial and governance commitments",'''<ul><li>Dedicated project accounts and bookkeeping before payment collection.</li><li>Documented founder loans or capital contributions, separate from donor funds.</li><li>Written quotes for equipment purchases above $1,000.</li><li>Quarterly summaries of receipts, spending, commitments, and milestone progress.</li><li>Disclosure of sponsor conflicts, with no sponsor control of scientific conclusions.</li><li>Founder retains legal, financial, and safety accountability during the founding phase; community decisions are advisory.</li></ul>
 <p>These are proposed operating commitments, not a claim that a bank account or bookkeeping system already exists. The governance review triggers are 25 active contributors, a treasury exceeding $50,000, or 12 months, whichever applicable milestone comes first.</p>'''),
 section("reports","Where financial reports will appear",'''<p>No financial report is available yet. Once the operating entity starts receiving project funds, this section will link dated reports and explain restricted funds, outstanding commitments, and changes to the plan. Private donor details and account credentials will never be included in public reporting.</p><p><a href="/#join">Register for launch updates</a> or <a href="/collaborate/">offer in-kind lab access or equipment</a>.</p>''')
 ]},
"resources":{
 "title":"Research Resources: Protocol, Open Data & Replication",
 "description":"Find S.P.H.E.R.E.'s current research charter, draft experiment protocol, FAQs, open-science guidance, and clearly labeled plans for data and replication.",
 "label":"Research / Library",
 "h1":"The evidence starts with an open record.",
 "lede":"A single place to find the documents that exist today and the outputs that are still being prepared. Planned publications are never presented as finished results.",
 "sections":[
 section("available","Available now",'''<div class="resource-card"><small>PUBLIC / DRAFT</small><h3><a href="/protocol/">LOC-1 copper sphere protocol summary</a></h3><p>The research question, reference-artifact design, controls, analysis decisions, and unresolved qualification requirements.</p></div>
 <div class="resource-card"><small>PUBLIC / VERSION 0.2 DRAFT</small><h3><a href="/charter/">Research charter</a></h3><p>Mission, scope, review gates, and commitments to transparent publication.</p></div>
 <div class="resource-card"><small>PUBLIC / PLANNING ESTIMATES</small><h3><a href="/transparency/">Budget and stewardship</a></h3><p>Lean and standard first-year budgets, financial safeguards, and launch-readiness requirements.</p></div>
 <div class="resource-card"><small>PUBLIC / QUESTIONS &amp; ANSWERS</small><h3><a href="/faq/">Project FAQ</a></h3><p>Origins of the hypothesis, what a null result means, funding boundaries, and ways to contribute.</p></div>'''),
 section("planned","Not yet released",'''<ul><li><strong>Full reviewed technical protocol:</strong> requires instrument qualification and external review.</li><li><strong>OSF preregistration:</strong> no record has been issued yet.</li><li><strong>Raw dataset and environmental logs:</strong> no study measurements have been collected.</li><li><strong>Archived analysis release and DOI:</strong> no DOI is currently assigned.</li><li><strong>Results paper:</strong> pending execution and unblinding.</li><li><strong>Replication kit:</strong> pending a stable, tested acquisition workflow.</li></ul><p>Each item will receive a working public link and a version/date when it becomes available. There are no inactive “download” buttons standing in for missing files.</p>'''),
 section("practice","Open-science background",'''<p>The <a href="https://www.cos.io/open-science">Center for Open Science introduction to open science</a> describes sharing plans, data, code, and outcomes so others can scrutinize and build on research. S.P.H.E.R.E. adopts that transparency objective; this is not a claim of institutional partnership.</p>
 <p>For preparing a study plan, read <a href="https://help.osf.io/article/330-welcome-to-registrations">OSF's registration and preregistration guidance</a>. For distinguishing confirmatory and exploratory analyses, see the <a href="https://www.cos.io/initiatives/prereg">Center for Open Science preregistration overview</a>.</p>'''),
 section("versioning","Versioning, corrections, and reuse",'''<p>Website changes are tracked in the <a href="https://github.com/cssofny2/spheredesci.org">public source repository</a>. The <a href="/updates/">update log</a> records major public milestones. Report documentation errors or propose improvements through a GitHub issue, without posting private contact details.</p><p>Research-page text is offered under <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0</a>. Third-party materials and branding may have different terms. Licenses for data and analysis code will be specified on their actual releases.</p>''')
 ]},
"faq":{
 "title":"S.P.H.E.R.E. FAQ: Resonance Research, Null Results & DeSci",
 "description":"Answers about the locational-variable hypothesis, copper sphere resonance testing, experimental controls, null results, research funding, and DeSci.",
 "label":"Research / Questions",
 "h1":"Questions worth asking before the experiment.",
 "lede":"Clear answers about what the project is proposing, what it has not established, and how to evaluate the work.",
 "sections":[section("questions","Project questions",''.join(f'<details class="faq-item"><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>' for q,a in FAQS)),
 section("next","Go one layer deeper",'''<p>Read the <a href="/protocol/">draft protocol</a> for the controls and decision rules, the <a href="/transparency/">transparency page</a> for budget assumptions, or the <a href="/collaborate/">collaboration page</a> to contribute technical review.</p>''')]
 },
"collaborate":{
 "title":"Collaborate on Open Resonance Research | S.P.H.E.R.E.",
 "description":"Help review S.P.H.E.R.E.'s experiment: physics and metrology advisors, statisticians, instrument-access partners, replication teams, and open-source contributors.",
 "label":"Community / Participate",
 "h1":"Build a stronger experiment, not a stronger claim.",
 "lede":"Independent criticism, calibration expertise, and replication matter more than agreement with the hypothesis. We are seeking expressions of interest, not advertising funded positions or named institutional partnerships.",
 "sections":[
 section("review","Independent reviewers",'''<p>We are seeking reviewers in experimental physics, precision metrology, RF/electronics, and statistics. The first task is to identify whether LOC-1 can distinguish a position-associated effect from environmental and measurement artifacts.</p><ul><li>Challenge the selected observable and proposed frequency band.</li><li>Review the uncertainty budget, environmental sensors, and mounting strategy.</li><li>Check blinding, independence of observations, effect bounds, power, and stopping rules.</li><li>Declare financial or intellectual conflicts before review.</li></ul><p>No advisor names or endorsements will be published without permission. Review honoraria are budgeted but are not yet funded or promised.</p>'''),
 section("access","Instrument access and replication partners",'''<p>Useful in-kind support includes calibrated laser vibrometer time, frequency-reference access, environmental monitoring, fixture fabrication, or technical consultation. The project must validate the actual system's capabilities rather than rely on ideal instrument specifications.</p><p>For replication, we are seeking teams willing to work from a versioned protocol, collect data independently, and publish outcomes whether positive, null, or inconclusive. No replication agreement is currently announced.</p>'''),
 section("contribute","Documentation and software contributors",'''<p>Start with a clearly scoped issue in the <a href="https://github.com/cssofny2/spheredesci.org/issues">website repository</a>. Good first contributions include accessibility checks, explanation improvements, source corrections, and data-format proposals.</p><p>Substantial research, paid contractor work, or new analysis software requires an agreed scope and ownership/license terms before work begins. Authorship depends on intellectual contribution, review of the final work, and accountability; funding alone is not authorship.</p>'''),
 section("contact","Introduce yourself",'''<p>Use the <a href="/#join">interest form</a> and select the closest role. In your message, describe your area of expertise, the instrument or review help you can offer, and any relevant constraints.</p><p>The form routes to <a href="mailto:michael@michaelpgoodman.com">michael@michaelpgoodman.com</a> through FormSubmit. Read the <a href="/privacy/">privacy notice</a> before sending information. Do not include passwords, private medical data, proprietary findings, or wallet secrets.</p>''')
 ]},
"updates":{
 "title":"Project Updates & Research Roadmap | S.P.H.E.R.E.",
 "description":"Follow S.P.H.E.R.E.'s documented website and research-planning updates, current proposal status, and the next milestones before measurement and funding.",
 "label":"Project / Field notes",
 "h1":"Progress, with the unfinished work visible.",
 "lede":"Dated notes record what has changed and what still needs to happen. Publishing a website or protocol draft is not the same as completing a research gate.",
 "sections":[
 section("october","October 2, 2026: public research foundation",'''<p>The public description and research charter were added to the website, and the full project name was standardized to Spatial Positioning Harmonic Empirical Resonance Experiment. Homepage language was revised to distinguish the hypothesis from established findings.</p><p>The research library now includes a draft LOC-1 protocol summary, a first-year budget and transparency page, FAQs, collaboration guidance, and this update log. The site no longer displays placeholder funding totals, wallet counts, or token-sale claims.</p><p>These are documentation milestones only. Entity formation, advisor engagement, instrument qualification, preregistration, data collection, and replication remain uncompleted or unconfirmed.</p>'''),
 section("next","Next on the research roadmap",'''<ol><li>Adopt the founding packet and confirm the operating entity.</li><li>Recruit independent reviewers and obtain instrument-access quotes.</li><li>Validate sphere dimensions, selected modes, and the proposed acquisition chain.</li><li>Build the calibration and repeatability dataset needed for an uncertainty budget.</li><li>Complete and preregister the confirmatory design before LOC-1 runs.</li><li>Publish all outcomes and prepare an independently usable replication package.</li></ol><p>No calendar date is promised for the first run. Progress depends on technical feasibility, review, equipment access, and funding readiness.</p>'''),
 section("changes","How to follow changes",'''<p>Major public updates are posted here. The <a href="https://github.com/cssofny2/spheredesci.org/commits/main/">GitHub commit history</a> provides the detailed website change record. For important protocol updates, the project will record the version, reason, and whether the change preceded or followed preregistration.</p><p><a href="/#join">Register interest</a> to request project updates, or <a href="/collaborate/">offer technical review</a>.</p>''')
 ]},
"privacy":{
 "title":"Contact Form Privacy Notice | S.P.H.E.R.E.",
 "description":"How S.P.H.E.R.E.'s interest form handles your name, email, selected role, and message, including FormSubmit delivery and privacy contact information.",
 "label":"Project / Privacy",
 "h1":"What happens when you register interest.",
 "lede":"This notice describes the current website form and its delivery route. It is not a claim that a future legal entity has already been formed.",
 "sections":[
 section("data","Information you choose to submit",'''<p>The interest form asks for your name or alias, email address, selected role, and an optional message. It is used to respond to your inquiry and provide the protocol, review, and funding updates described on the form. Registration is not a purchase, investment, or grant of membership rights.</p><p>Do not submit credentials, seed phrases, sensitive medical information, or confidential third-party material. The form does not request a crypto wallet address.</p>'''),
 section("delivery","Delivery and third-party services",'''<p>The form posts to FormSubmit and is configured to deliver submissions to <a href="mailto:michael@michaelpgoodman.com">michael@michaelpgoodman.com</a>, with an autoresponse to the submitted email. Third-party service availability and email delivery can vary; a delivery configuration is not a guarantee that every message reaches an inbox.</p><p>The website is hosted through Cloudflare. It also loads fonts from Google Fonts and icon styling from cdnjs. Those providers may process technical connection information according to their own policies. The website does not currently include an added analytics or advertising tracker.</p>'''),
 section("storage","Browser storage and publication",'''<p>The website does not store your submitted email in browser storage or build a browser-side analytics profile. The confirmation page does not repeat your email address. Submitted information still passes through the form provider and the project mailbox.</p><p>Form submissions are not published as research data. Names, endorsements, and affiliations must not be posted publicly without permission. Public GitHub issues are different: information posted there is visible to others, so use email for private requests.</p>'''),
 section("requests","Privacy questions and removal requests",'''<p>Contact <a href="mailto:michael@michaelpgoodman.com">michael@michaelpgoodman.com</a> to request correction, removal of your submitted contact information, or cessation of project communications. Identify the email used for the form so the request can be matched; do not send extra identity documents unless specifically required.</p><p>A formal retention schedule and entity-specific policy remain to be adopted. This notice will be revised when the legal operator, form provider, storage practices, or communication workflow changes.</p>''')
 ]}
}

def structured(slug, title, description):
    url=BASE + ('/' if not slug else f'/{slug}/')
    graph=[
      {"@type":"WebSite","@id":BASE+"/#website","url":BASE+"/","name":"Project S.P.H.E.R.E.","description":FULL},
      {"@type":"WebPage","@id":url+"#webpage","url":url,"name":title,"description":description,
       "isPartOf":{"@id":BASE+"/#website"},"inLanguage":"en","dateModified":DATE}
    ]
    if slug:
        graph.append({"@type":"BreadcrumbList","itemListElement":[
          {"@type":"ListItem","position":1,"name":"Home","item":BASE+"/"},
          {"@type":"ListItem","position":2,"name":title,"item":url}]})
    return '<script type="application/ld+json">'+json.dumps({"@context":"https://schema.org","@graph":graph})+'</script>'

def head(slug, page):
    title=html.escape(page["title"])
    desc=html.escape(page["description"], quote=True)
    return f'''<!DOCTYPE html><html lang="en" class="scroll-smooth"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}">
<meta name="theme-color" content="#05070a"><link rel="canonical" href="{BASE}/{slug}/">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="Project S.P.H.E.R.E.">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">
<meta property="og:url" content="{BASE}/{slug}/"><meta property="og:image" content="{BASE}/assets/brand/og-image.png?v=2">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}"><meta name="twitter:image" content="{BASE}/assets/brand/og-image.png?v=2">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
<link href="/assets/tailwind.css" rel="stylesheet"><link href="/assets/site.css" rel="stylesheet">
<script src="/assets/site.js" defer></script>{structured(slug,page["title"],page["description"])}
</head><body>'''

for slug, page in pages.items():
    body=''.join(f'<section aria-labelledby="{id}"><h2 id="{id}">{title}</h2>{text}</section>' for id,title,text in page["sections"])
    toc=''.join(f'<a href="#{id}">{title}</a>' for id,title,_ in page["sections"])
    content=head(slug,page)+nav(slug)+f'''<main id="main-content" class="content-shell">
<div class="breadcrumbs"><a href="/">Home</a> / {html.escape(page["title"].split('|')[0].strip())}</div>
<div class="eyebrow">{page["label"]}</div><h1 class="page-title">{page["h1"]}</h1>
<p class="page-lede">{page["lede"]}</p><p class="page-meta">Updated October 2, 2026 · Proposal stage</p>
<div class="article-layout"><article class="article-body">{body}</article>
<aside class="article-aside" aria-label="On this page"><h2>On this page</h2>{toc}</aside></div></main>'''+footer()+'</body></html>'
    dest=ROOT/slug/"index.html"
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(content)

# Upgrade the existing pages without replacing their brand or content structure.
for slug in ["","about","charter"]:
    path=ROOT/(slug or ".")/"index.html"
    s=path.read_text()
    s=re.sub(r'<script src="https://cdn.tailwindcss.com"></script>\s*<script>.*?</script>',
             '<link href="/assets/tailwind.css" rel="stylesheet">',s,count=1,flags=re.S)
    if '/assets/site.css' not in s:
        s=s.replace('</head>','<link href="/assets/site.css" rel="stylesheet"><script src="/assets/site.js" defer></script>'+structured(slug,
           re.search(r'<title>(.*?)</title>',s).group(1),html.unescape(re.search(r'name="description" content="([^"]+)"',s).group(1)))+'</head>')
    s=re.sub(r'<nav\b.*?</nav>',nav(slug),s,count=1,flags=re.S)
    if slug:
        s=s.replace('<main class=','<main id="main-content" class=',1)
    else:
        s=s.replace('<!-- Hero Section -->','<main id="main-content">\n<!-- Hero Section -->',1)
        s=s.replace('<!-- Footer -->','</main>\n<!-- Footer -->',1)
    s=re.sub(r'<footer\b.*?</footer>',footer(),s,count=1,flags=re.S)
    path.write_text(s)

home=ROOT/"index.html"
s=home.read_text()
if 'id="research-library"' not in s:
    s=s.replace('<!-- Join Section (Interested Parties) -->','''<section id="research-library" class="home-extra"><div class="inner">
<div class="eyebrow">Read before you support</div><h2>The open research foundation</h2>
<p class="intro">Explore the design, challenge the controls, and see what still needs to be done. These are planning documents, not evidence of a completed experiment.</p>
<div class="home-resource-grid">
<a href="/protocol/"><span class="label">01 / Method</span><h3>Inside LOC-1</h3><p>How the copper sphere, stationary reference, blinding, and null tests fit together.</p></a>
<a href="/transparency/"><span class="label">02 / Stewardship</span><h3>The first-year plan</h3><p>Budget assumptions, funding readiness, and safeguards before a campaign opens.</p></a>
<a href="/collaborate/"><span class="label">03 / Participation</span><h3>Help improve the test</h3><p>Independent review, instrument access, and documentation contributions.</p></a>
</div></div></section>
<section id="questions" class="home-extra"><div class="inner"><div class="eyebrow">A careful starting point</div>
<h2>What has been demonstrated?</h2><p class="intro">Nothing yet. The project's value depends on a test that can report “nothing found” as honestly as a candidate signal.</p>
<details class="faq-item"><summary>Is this established physics?</summary><p>The locational-variable idea is an unverified, source-inspired hypothesis. S.P.H.E.R.E. is preparing a controlled measurement, not announcing a discovery.</p></details>
<details class="faq-item"><summary>Does supporting the project buy a token or ownership?</summary><p>No. The founding phase has no token sale or financial-return promise, and the interest form collects no payments.</p></details>
<p style="margin-top:1.5rem"><a class="related-link" href="/faq/">Read all project questions</a> · <a class="related-link" href="/updates/">Follow the roadmap</a></p>
</div></section>
<!-- Join Section (Interested Parties) -->''')

for field in ["name","email","role","message"]:
    s=re.sub(rf'<(input|select|textarea)([^>]*\bname="{field}")',
             lambda m:f'<{m.group(1)} id="contact-{field}"'+m.group(2),s,count=1)
labels={"Full Name / Alias":"name","Email Address":"email","Primary Interest Role":"role","Brief Message (Optional)":"message"}
for label,field in labels.items():
    s=re.sub(r'<label([^>]*)>'+re.escape(label)+r'</label>',rf'<label for="contact-{field}"\1>{label}</label>',s,count=1)
s=s.replace('name="name" required','name="name" autocomplete="name" required',1)
s=s.replace('name="email" required','name="email" autocomplete="email" required',1)
if 'id="privacy-form-note"' not in s:
    s=s.replace('<button type="submit" id="submitBtn"', '''<p id="privacy-form-note" class="text-sm text-slate-400">This form sends your inquiry through FormSubmit to the project contact. <a href="/privacy/" class="text-copper-400 underline">Read the privacy notice</a>. Please do not include sensitive or confidential information.</p>
                    <button type="submit" id="submitBtn"''')
    s=s.replace('id="interestForm" action=', 'id="interestForm" aria-describedby="privacy-form-note" action=',1)
s=s.replace('id="formSuccess" class=', 'id="formSuccess" role="status" aria-live="polite" class=',1)
s=s.replace('        // Start animation\n        draw();', '''        // Respect reduced-motion settings and pause canvas work in hidden tabs.
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) draw();
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) draw();
        });''')
s=s.replace('            requestAnimationFrame(draw);','            if (!document.hidden) requestAnimationFrame(draw);')
# Precompute connections once instead of doing a quadratic neighbor search every frame.
start=s.index('            ctx.beginPath();\n            for(let i=0; i<projectedPoints.length; i++) {')
end=s.index('            ctx.stroke();',start)
s=s[:start]+'''            ctx.beginPath();
            for (const [i,j] of connections) {
                ctx.moveTo(projectedPoints[i].x, projectedPoints[i].y);
                ctx.lineTo(projectedPoints[j].x, projectedPoints[j].y);
            }
'''+s[end:]
before='        function draw() {'
s=s.replace(before,'''        const connections = [];
        for (let i=0; i<points.length; i++) for (let j=i+1; j<points.length; j++) {
            if (Math.hypot(points[i].x-points[j].x, points[i].y-points[j].y, points[i].z-points[j].z)<0.25) connections.push([i,j]);
        }
'''+before,1)
home.write_text(s)

slugs=["","about","charter"]+list(pages)
sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
sitemap+=''.join(f'<url><loc>{BASE}/{slug+"/" if slug else ""}</loc><lastmod>{DATE}</lastmod></url>\n' for slug in slugs)
sitemap+='</urlset>\n'
(ROOT/"sitemap.xml").write_text(sitemap)
(ROOT/"robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n")
(ROOT/"404.html").write_text(head("404",{"title":"Page Not Found | S.P.H.E.R.E.","description":"Return to the S.P.H.E.R.E. research pages."}).replace('</head>','<meta name="robots" content="noindex"></head>')+nav()+'''<main id="main-content" class="content-shell"><div class="eyebrow">404 / Not found</div><h1 class="page-title">That page is not in the research record.</h1><p class="page-lede">The address may have changed. Start with the resource library or return to the homepage.</p><a class="related-link" href="/resources/">Open the research library</a></main>'''+footer()+'</body></html>')
print("Built",len(slugs),"public pages, sitemap, and shared navigation.")
