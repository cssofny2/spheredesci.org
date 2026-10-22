// Reusable breadcrumb component: one trail definition yields both the visible
// navigation and the matching BreadcrumbList JSON-LD node.
const SITE = "https://spheredesci.org";
const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const absolute = (url) => (/^https?:\/\//i.test(url) ? url : `${SITE}${url.startsWith("/") ? "" : "/"}${url}`);

/** trail: [[name, url], ...]; the last item is the current page. */
export function breadcrumbTrail(trail) {
  if (!Array.isArray(trail) || trail.length < 2) throw new Error("A breadcrumb trail needs at least two items.");
  return trail.map(([name, url]) => ({ name: String(name), url: absolute(url) }));
}

export function breadcrumbHtml(trail) {
  const items = breadcrumbTrail(trail);
  const last = items.length - 1;
  const links = items.map((item, i) => {
    const path = item.url.startsWith(SITE) ? item.url.slice(SITE.length) || "/" : item.url;
    return i === last ? `<span aria-current="page">${esc(item.name)}</span>` : `<a href="${esc(path)}">${esc(item.name)}</a>`;
  });
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${links.join(" / ")}</nav>`;
}

export function breadcrumbSchema(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbTrail(trail).map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: item.url })),
  };
}

export function breadcrumbs(trail) {
  return { html: breadcrumbHtml(trail), schema: breadcrumbSchema(trail) };
}
