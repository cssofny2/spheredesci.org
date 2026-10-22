(() => {
  if (location.hostname !== "spheredesci.org") return;
  const popularSection = document.querySelector("[data-popular-articles]");
  const popularList = popularSection?.querySelector("[data-popular-results]");
  const trendingSection = document.querySelector("[data-trending-articles]");
  const trendingList = trendingSection?.querySelector("[data-trending-results]");
  if ((!popularSection || !popularList) && (!trendingSection || !trendingList)) return;

  fetch("/api/analytics/dashboard?days=30", { credentials: "same-origin" })
    .then((response) => {
      if (!response.ok) throw new Error(`Content popularity returned ${response.status}.`);
      return response.json();
    })
    .then((data) => {
      const researchCards = [...document.querySelectorAll("#publication-results .publication-result")];
      const titles = new Map(researchCards.map((card) => [
        card.querySelector("h3 a")?.getAttribute("href"),
        card.querySelector("h3 a")?.textContent || "",
      ]));
      function render(target, rows, label) {
        const matches = rows.filter((row) => titles.has(row.label)).slice(0, 5);
        if (!target || !matches.length) return;
        target.replaceChildren(...matches.map((row) => {
          const item = document.createElement("li");
          const link = document.createElement("a");
          link.href = row.label;
          link.textContent = titles.get(row.label);
          const count = document.createElement("span");
          count.textContent = label(row);
          item.append(link, count);
          return item;
        }));
        target.closest("section").hidden = false;
      }
      render(popularList, data.topContent || [], (row) => `${Number(row.views).toLocaleString()} views`);
      render(trendingList, data.trendingContent || [], (row) => `+${Number(row.change).toLocaleString()} views · ${Number(row.views).toLocaleString()} this week`);
    })
    .catch((error) => console.warn("Popular content could not be loaded.", error));
})();
