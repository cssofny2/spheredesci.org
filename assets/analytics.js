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
