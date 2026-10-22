(() => {
  const root = document.getElementById("analytics-dashboard");
  const status = document.getElementById("analytics-status");
  const days = document.getElementById("analytics-days");
  const refresh = document.getElementById("analytics-refresh");
  if (!root || !status || !days || !refresh) return;

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
  const section = (title, rows, valueKey) => `<section class="analytics-panel"><h2>${escapeHtml(title)}</h2>${rows.length
    ? `<ol>${rows.map((row) => `<li><span>${escapeHtml(row.label)}</span><strong>${Number(row[valueKey]).toLocaleString()}</strong></li>`).join("")}</ol>`
    : "<p>No activity recorded in this period.</p>"}</section>`;
  const engagementSection = (rows) => `<section class="analytics-panel"><h2>Reading engagement</h2>${rows.length
    ? `<ol>${rows.map((row) => `<li><span>${escapeHtml(row.label)}<small>${Number(row.averageSeconds).toLocaleString()} s average · ${Number(row.averageScroll).toLocaleString()}% scroll</small></span><strong>${Number(row.visits).toLocaleString()}</strong></li>`).join("")}</ol>`
    : "<p>No engagement data recorded in this period.</p>"}</section>`;

  async function load() {
    status.textContent = "Loading aggregate metrics…";
    refresh.disabled = true;
    try {
      const response = await fetch(`/api/analytics/dashboard?days=${encodeURIComponent(days.value)}`, { credentials: "same-origin" });
      if (!response.ok) throw new Error(response.status === 404 || response.status === 503
        ? "Analytics are not enabled for this deployment."
        : `Analytics request returned ${response.status}.`);
      const data = await response.json();
      root.innerHTML = [
        `<p class="analytics-total"><strong>${Number(data.totalViews).toLocaleString()}</strong><span>article and concept views</span></p>`,
        section("Top content", data.topContent, "views"),
        engagementSection(data.engagement),
        section("Search queries", data.topSearches, "searches"),
        section("Referring pages", data.topReferrers, "visits"),
        section("Link and FAQ interactions", data.interactions || [], "clicks"),
      ].join("");
      status.textContent = `Updated ${new Date(data.generatedAt).toLocaleString()} · ${data.days}-day window`;
    } catch (error) {
      root.replaceChildren();
      status.textContent = `${error.message} Refresh after analytics has been enabled.`;
    } finally {
      refresh.disabled = false;
    }
  }

  refresh.addEventListener("click", load);
  days.addEventListener("change", load);
  load();
})();
