import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { lintPage } from "../lint-html.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("data/changelog.json has valid semantic version and chronological release ordering", async () => {
  const data = JSON.parse(await readFile(path.join(ROOT, "data/changelog.json"), "utf8"));
  assert.match(data.current_version, /^\d+\.\d+\.\d+$/);
  assert.ok(Array.isArray(data.releases) && data.releases.length > 0);
  assert.equal(data.releases[0].version, data.current_version);
  assert.equal(data.releases[0].date, data.released);

  for (let i = 0; i < data.releases.length; i += 1) {
    const rel = data.releases[i];
    assert.match(rel.version, /^\d+\.\d+\.\d+$/);
    assert.match(rel.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Array.isArray(rel.changes) && rel.changes.length > 0);
    if (i > 0) {
      assert.ok(
        rel.date <= data.releases[i - 1].date,
        `Expected chronological descending dates: ${data.releases[i - 1].date} >= ${rel.date}`,
      );
    }
  }
});

test("generated /changelog/ page passes HTML lint, lists all releases, and resolves local links", async () => {
  const data = JSON.parse(await readFile(path.join(ROOT, "data/changelog.json"), "utf8"));
  const html = await readFile(path.join(ROOT, "changelog/index.html"), "utf8");
  assert.deepEqual(lintPage(html, "changelog/index.html"), []);
  assert.match(html, new RegExp(`v${data.current_version.replaceAll(".", "\\.")}`));
  assert.match(html, /class="footer-version"/);

  let prevIndex = -1;
  for (const rel of data.releases) {
    const token = `data-version="${rel.version}"`;
    const idx = html.indexOf(token);
    assert.ok(idx > prevIndex, `Expected release ${rel.version} in chronological order`);
    prevIndex = idx;
  }

  for (const rel of data.releases) {
    for (const change of rel.changes) {
      if (!change.href || !change.href.startsWith("/")) continue;
      const pathname = change.href.split("#")[0];
      const target = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
      await access(path.join(ROOT, target.slice(1)));
    }
  }
});

test("homepage displays current site version, #changelog section, and footer version badge", async () => {
  const data = JSON.parse(await readFile(path.join(ROOT, "data/changelog.json"), "utf8"));
  const html = await readFile(path.join(ROOT, "index.html"), "utf8");
  assert.match(html, /id="changelog"/);
  assert.match(html, new RegExp(`>v${data.current_version.replaceAll(".", "\\.")}<`));
  assert.match(html, new RegExp(`SITE v${data.current_version.replaceAll(".", "\\.")}`));
  assert.match(html, /href="\/changelog\/"/);
});
