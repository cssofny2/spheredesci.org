(() => {
  const toc = document.querySelector(".publication-toc");
  if (!toc) return;

  const details = toc.querySelector("details");
  const links = [...toc.querySelectorAll('a[href^="#"]')];
  const headings = links.map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1)))).filter(Boolean);
  const mobile = window.matchMedia("(max-width: 850px)");

  function setViewportMode() {
    if (mobile.matches) details?.removeAttribute("open");
    else details?.setAttribute("open", "");
  }

  setViewportMode();
  mobile.addEventListener("change", setViewportMode);
  links.forEach((link) => link.addEventListener("click", () => {
    if (mobile.matches) details?.removeAttribute("open");
  }));

  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach((link) => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
  }, { rootMargin: "-12% 0px -72% 0px" });
  headings.forEach((heading) => observer.observe(heading));
})();
