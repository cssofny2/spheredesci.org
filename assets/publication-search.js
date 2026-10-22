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

  const editDistanceAtMostOne = (left, right) => {
    if (Math.abs(left.length - right.length) > 1) return false;
    let i = 0;
    let j = 0;
    let edits = 0;
    while (i < left.length && j < right.length) {
      if (left[i] === right[j]) {
        i += 1;
        j += 1;
      } else {
        edits += 1;
        if (edits > 1) return false;
        if (left.length > right.length) i += 1;
        else if (right.length > left.length) j += 1;
        else { i += 1; j += 1; }
      }
    }
    return edits + (i < left.length || j < right.length ? 1 : 0) <= 1;
  };

  function fieldScore(value, term, weight) {
    const text = String(value || "").toLowerCase();
    if (text.includes(term)) return weight;
    if (term.length < 5) return 0;
    const match = text.split(/[^\p{L}\p{N}]+/u).some((word) => editDistanceAtMostOne(term, word));
    return match ? Math.ceil(weight / 2) : 0;
  }

  function scoreRecord(record, terms) {
    let score = record.featured ? 1 : 0;
    for (const term of terms) {
      const termScore = Math.max(
        fieldScore(record.title, term, 12),
        fieldScore(record.tags.join(" "), term, 9),
        fieldScore(record.authors.join(" "), term, 8),
        fieldScore(record.category, term, 6),
        fieldScore(record.description, term, 4),
        fieldScore(record.text, term, 1),
      );
      if (!termScore) return 0;
      score += termScore;
    }
    return score;
  }

  function highlight(element, terms) {
    element.querySelectorAll("mark.search-highlight").forEach((mark) => mark.replaceWith(document.createTextNode(mark.textContent)));
    element.normalize();
    const exactTerms = terms.filter((term) => term.length > 1);
    if (!exactTerms.length) return;
    const matcher = new RegExp(`(${exactTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "giu");
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (!matcher.test(node.nodeValue)) { matcher.lastIndex = 0; continue; }
      matcher.lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let cursor = 0;
      for (const match of node.nodeValue.matchAll(matcher)) {
        if (match.index > cursor) fragment.append(document.createTextNode(node.nodeValue.slice(cursor, match.index)));
        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.textContent = match[0];
        fragment.append(mark);
        cursor = match.index + match[0].length;
      }
      if (cursor < node.nodeValue.length) fragment.append(document.createTextNode(node.nodeValue.slice(cursor)));
      node.replaceWith(fragment);
    }
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
      cards.forEach((card) => {
        card.style.order = "";
        card.querySelectorAll("mark.search-highlight").forEach((mark) => mark.replaceWith(document.createTextNode(mark.textContent)));
        card.normalize();
      });
      if (empty) empty.hidden = true;
      if (status) status.textContent = `${cards.length} items`;
      return;
    }
    if (status) status.textContent = "Filtering…";

    let index;
    let indexError;
    try { index = await loadIndex(); } catch (error) { indexError = error; }
    const ranked = [];
    for (const card of cards) {
      const href = card.querySelector("h3 a, h2 a")?.getAttribute("href");
      const record = index?.get(href);
      const searchable = record || {
        title: card.querySelector("h3, h2")?.textContent || "",
        description: card.querySelector("h3 + p, h2 + p")?.textContent || "",
        text: card.dataset.search || "",
        tags: (card.dataset.tags || "").split("|"),
        authors: (card.dataset.authors || "").split("|"),
        category: card.dataset.category || "",
        featured: card.dataset.featured === "true",
      };
      const score = terms.length ? scoreRecord(searchable, terms) : 1;
      const matchesCategory = !categoryValue || card.dataset.category === categoryValue;
      const matchesTag = !tagValue || (card.dataset.tags || "").split("|").includes(tagValue);
      const visible = score > 0 && matchesCategory && matchesTag;
      card.hidden = !visible;
      card.style.order = visible ? String(-score) : "";
      const title = card.querySelector("h3 a, h2 a");
      const description = card.querySelector("h3 + p, h2 + p");
      if (title) highlight(title, visible ? terms : []);
      if (description) highlight(description, visible ? terms : []);
      if (visible) ranked.push({ card, score, date: record?.published || card.dataset.published || "" });
    }
    results.querySelectorAll(".glossary-group").forEach((group) => {
      const visibleCards = [...group.querySelectorAll(".publication-result:not([hidden])")];
      group.hidden = !visibleCards.length;
      group.style.order = String(-Math.max(0, ...visibleCards.map((card) => Number(card.style.order) * -1)));
    });
    ranked.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
    if (empty) empty.hidden = ranked.length > 0;
    if (status) status.textContent = `${indexError ? "Search index unavailable; using page summaries. " : ""}${ranked.length} ${ranked.length === 1 ? "item" : "items"}`;

    clearTimeout(searchTimer);
    if (query.length >= 2 && !indexError) searchTimer = setTimeout(() => window.sphereAnalytics?.search(query), 650);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    results.querySelector(".publication-result:not([hidden]) h3 a, .publication-result:not([hidden]) h2 a")?.focus();
  });
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      const first = results.querySelector(".publication-result:not([hidden]) h3 a, .publication-result:not([hidden]) h2 a");
      if (first) { event.preventDefault(); first.focus(); }
    } else if (event.key === "Escape") {
      input.value = "";
      update();
    }
  });
  results.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp", "Escape"].includes(event.key)) return;
    const links = [...results.querySelectorAll(".publication-result:not([hidden]) h3 a, .publication-result:not([hidden]) h2 a")];
    const index = links.indexOf(document.activeElement);
    if (event.key === "Escape") { event.preventDefault(); input.focus(); return; }
    const next = event.key === "ArrowDown" ? links[Math.min(index + 1, links.length - 1)] : links[Math.max(index - 1, 0)];
    if (next) { event.preventDefault(); next.focus(); }
  });
  if (input.value || category.value || tag.value) update();
})();
