(() => {
  const form = document.querySelector("[data-publication-search]");
  const results = document.querySelector("[data-search-results]");
  if (!form || !results) return;

  const input = form.elements.namedItem("q");
  const category = form.elements.namedItem("category");
  const tag = form.elements.namedItem("tag");
  const status = form.querySelector("[data-search-status]");
  const empty = document.querySelector("[data-search-empty]");
  const cards = [...results.querySelectorAll(".publication-result")];
  let indexPromise;
  let searchTimer;
  let failed = false;
  const params = new URLSearchParams(location.search);
  input.value = params.get("q") || "";
  category.value = params.get("category") || "";
  tag.value = params.get("tag") || "";

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch("/assets/publication-search.json")
        .then((response) => {
          if (!response.ok) throw new Error(`Search index returned ${response.status}.`);
          return response.json();
        })
        .then((records) => new Map(records.map((record) => [record.url, record])));
    }
    return indexPromise;
  }

  function updateUrl(query) {
    const next = new URL(location.href);
    for (const [key, value] of [["q", query], ["category", category.value], ["tag", tag.value]]) {
      if (value) next.searchParams.set(key, value);
      else next.searchParams.delete(key);
    }
    history.replaceState(null, "", next);
  }

  async function update() {
    const query = input.value.trim().toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    const categoryValue = category.value;
    const tagValue = tag.value;
    updateUrl(query);
    if (!terms.length && !categoryValue && !tagValue) {
      cards.forEach((card) => { card.hidden = false; });
      results.querySelectorAll(".glossary-group").forEach((group) => { group.hidden = false; });
      if (empty) empty.hidden = true;
      if (status) status.textContent = `${cards.length} items`;
      return;
    }
    if (status) status.textContent = "Filtering…";

    try {
      const index = await loadIndex();
      let visible = 0;
      for (const card of cards) {
        const record = index.get(card.querySelector("a")?.getAttribute("href"));
        const searchable = record ? `${record.title} ${record.description} ${record.text} ${record.tags.join(" ")}`.toLowerCase() : "";
        const matchesText = terms.every((term) => searchable.includes(term));
        const matchesCategory = !categoryValue || card.dataset.category === categoryValue;
        const matchesTag = !tagValue || (card.dataset.tags || "").split("|").includes(tagValue);
        card.hidden = !(matchesText && matchesCategory && matchesTag);
        if (!card.hidden) visible += 1;
      }
      results.querySelectorAll(".glossary-group").forEach((group) => {
        group.hidden = !group.querySelector(".publication-result:not([hidden])");
      });
      if (empty) empty.hidden = visible > 0;
      if (status) status.textContent = `${visible} ${visible === 1 ? "item" : "items"}`;
    } catch (error) {
      failed = true;
      let visible = 0;
      for (const card of cards) {
        const searchable = card.dataset.search || "";
        const matchesText = terms.every((term) => searchable.includes(term));
        const matchesCategory = !categoryValue || card.dataset.category === categoryValue;
        const matchesTag = !tagValue || (card.dataset.tags || "").split("|").includes(tagValue);
        card.hidden = !(matchesText && matchesCategory && matchesTag);
        if (!card.hidden) visible += 1;
      }
      if (empty) empty.hidden = visible > 0;
      if (status) status.textContent = `Search index unavailable; showing title and description matches. ${error.message}`;
    }

    clearTimeout(searchTimer);
    if (query.length >= 2 && !failed) searchTimer = setTimeout(() => window.sphereAnalytics?.search(query), 650);
  }

  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  if (input.value || category.value || tag.value) update();
})();
