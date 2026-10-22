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
})();
