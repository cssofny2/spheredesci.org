(() => {
  if (location.hostname !== "spheredesci.org") return;
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;

  function send(type, data = {}) {
    const payload = { type, path: location.pathname, ...data };
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "same-origin",
    }).catch((error) => console.warn("Aggregate analytics event could not be recorded.", error));
  }

  window.sphereAnalytics = {
    search(query) {
      send("search", { query });
    },
  };

  send("page-view", { referrer: document.referrer });

  const INTERACTIONS = new Set(["whitepaper-click", "repository-click", "lab-click", "outbound-click"]);

  // Returns { name, target } for a link, or null. data-track overrides the classification.
  function classifyLink(link) {
    let url;
    try { url = new URL(link.href, location.href); } catch { return null; }
    if (!/^https?:$/.test(url.protocol)) return null;
    const external = url.hostname !== location.hostname;
    const override = (link.getAttribute("data-track") || "").trim().toLowerCase();
    const target = external ? url.hostname.toLowerCase() : url.pathname.toLowerCase();
    if (INTERACTIONS.has(override)) return { name: override, target };
    if (external) {
      if (url.hostname === "github.com" && url.pathname.toLowerCase().startsWith("/cssofny2/spheredesci.org")) {
        return { name: "repository-click", target };
      }
      if (url.hostname === "lab.spheredesci.org") return { name: "lab-click", target };
      if (/(^|\.)spheredesci\.org$/.test(url.hostname)) return null;
      return { name: "outbound-click", target };
    }
    if (/^\/whitepaper(\/|$)/.test(target)) return { name: "whitepaper-click", target };
    if (/^\/vl(\/|$)/.test(target)) return { name: "lab-click", target };
    return null;
  }

  function sendInteraction(name, target) {
    if (!target) return;
    const body = JSON.stringify({ type: "interaction", name, target });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/analytics/event", blob)) send("interaction", { name, target });
  }

  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    const hit = link && classifyLink(link);
    if (hit) sendInteraction(hit.name, hit.target);
  });

  // toggle does not bubble, so listen in the capture phase.
  document.addEventListener("toggle", (event) => {
    const details = event.target;
    if (details instanceof HTMLDetailsElement && details.open && details.classList.contains("faq-item")) {
      sendInteraction("faq-open", location.pathname.toLowerCase());
    }
  }, true);

  let activeStartedAt = document.visibilityState === "visible" ? performance.now() : null;
  let activeDuration = 0;
  let maximumScroll = 0;
  let sentEngagement = false;

  function measureScroll() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable > 0) maximumScroll = Math.max(maximumScroll, Math.min(100, Math.round((window.scrollY / scrollable) * 100)));
  }

  function recordEngagement() {
    if (sentEngagement) return;
    sentEngagement = true;
    if (activeStartedAt !== null) activeDuration += performance.now() - activeStartedAt;
    const seconds = Math.floor(activeDuration / 1000);
    if (seconds < 1) return;
    const payload = JSON.stringify({ type: "engagement", path: location.pathname, seconds, scrollDepth: maximumScroll });
    const body = new Blob([payload], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/analytics/event", body)) {
      send("engagement", { seconds, scrollDepth: maximumScroll });
    }
  }

  window.addEventListener("scroll", measureScroll, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && activeStartedAt !== null) {
      activeDuration += performance.now() - activeStartedAt;
      activeStartedAt = null;
    } else if (document.visibilityState === "visible" && activeStartedAt === null) {
      activeStartedAt = performance.now();
    }
  });
  window.addEventListener("pagehide", recordEngagement, { once: true });
})();
