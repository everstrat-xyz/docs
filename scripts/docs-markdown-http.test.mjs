import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { dirname, join, relative } from "node:path";
import { after, before, test } from "node:test";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import config from "../next.config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const contentRoot = join(root, "content/docs");
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
const routes = walk(contentRoot)
  .filter((path) => path.endsWith(".mdx"))
  .map((path) => {
    const slug = relative(contentRoot, path).replace(/\.mdx$/, "");
    return slug === "index" ? "/" : `/${slug.replace(/\/index$/, "")}`;
  });
async function each(items, check) {
  let next = 0;
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (next < items.length) await check(items[next++]);
    }),
  );
}
let server;
let baseUrl;
let logs = "";

before(async () => {
  assert.ok(
    existsSync(join(root, ".next/BUILD_ID")),
    "Run bun run build first.",
  );
  const listener = createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout.on("data", (chunk) => {
    logs += chunk;
  });
  server.stderr.on("data", (chunk) => {
    logs += chunk;
  });
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline && server.exitCode === null) {
    try {
      const response = await fetch(baseUrl, {
        signal: AbortSignal.timeout(1000),
      });
      await response.arrayBuffer();
      if (response.ok) return;
    } catch {
      // Wait until the production server accepts requests.
    }
    await setTimeout(50);
  }
  throw new Error(`Production server did not start:\n${logs}`);
});

after(async () => {
  if (!server || server.exitCode !== null) return;
  const exited = once(server, "exit");
  server.kill("SIGTERM");
  await exited;
});

const page = "/introduction/what-is-everstrat";
const nestedPage = "/how-everstrat-works/redemption-queue";
for (const [name, path, canonical, accept] of [
  ["page suffix", `${page}.mdx`, page, "text/html"],
  ["nested page suffix", `${nestedPage}.mdx`, nestedPage, "text/html"],
  ["Markdown Accept header", page, page, "text/markdown"],
  ["plain-text Accept header", page, page, "text/plain"],
  ["home Accept header", "/", "", "text/markdown"],
  ["home suffix", "/.mdx", "", "text/html"],
  ["legacy page suffix", `/docs${page}.mdx`, page, "text/html"],
  ["legacy page Accept header", `/docs${page}`, page, "text/markdown"],
  ["legacy home Accept header", "/docs", "", "text/markdown"],
]) {
  test(`${name} returns the canonical Markdown content`, async () => {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { Accept: accept },
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^text\/markdown\b/);
    const expected = await fetch(
      `${baseUrl}/llms.mdx/docs${canonical}/content.md`,
    );
    assert.equal(expected.status, 200);
    assert.equal(await response.text(), await expected.text());
  });
}

test("normal and HTML-preferred page requests still return HTML", async () => {
  for (const accept of ["text/html", "text/html;q=1, text/markdown;q=0.5"]) {
    const response = await fetch(`${baseUrl}${page}`, {
      headers: { Accept: accept },
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^text\/html\b/);
    assert.match(await response.text(), /What is Everstrat/);
  }
});

test("legacy HTML requests retain their canonical redirect", async () => {
  const response = await fetch(`${baseUrl}/docs${page}`, {
    headers: { Accept: "text/html" },
    redirect: "manual",
  });
  assert.equal(response.status, 307);
  assert.equal(
    new URL(response.headers.get("location"), baseUrl).pathname,
    page,
  );
});

test("missing Markdown pages remain 404", async () => {
  const response = await fetch(`${baseUrl}/not-a-docs-page.mdx`);
  assert.equal(response.status, 404);
});

test("search and document discovery endpoints remain excluded from negotiation", async () => {
  for (const [path, type] of [
    ["/api/search?query=redemption", /^application\/json\b/],
    ["/llms.txt", /^text\/plain\b/],
    ["/llms-full.txt", /^text\/plain\b/],
    ["/sitemap.xml", /^application\/xml\b/],
    ["/robots.txt", /^text\/plain\b/],
  ]) {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { Accept: "text/markdown" },
    });
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), type, path);
    await response.arrayBuffer();
  }
});

test("all canonical pages and Markdown exports respond with their expected type", async () => {
  await each(routes, async (path) => {
    const html = await fetch(`${baseUrl}${path}`, {
      redirect: "manual",
      headers: { Accept: "text/html" },
    });
    assert.equal(html.status, 200, path);
    assert.match(html.headers.get("content-type"), /^text\/html\b/, path);
    await html.arrayBuffer();
    const markdown = await fetch(
      `${baseUrl}/llms.mdx/docs${path === "/" ? "" : path}/content.md`,
      { redirect: "manual" },
    );
    assert.equal(markdown.status, 200, path);
    assert.match(
      markdown.headers.get("content-type"),
      /^text\/markdown\b/,
      path,
    );
    assert.ok((await markdown.text()).startsWith("# "), path);
  });
});

test("changelog disclosures keep evidence and screenshot captions in Markdown exports", async () => {
  const html = await fetch(`${baseUrl}/changelog/app`).then((r) => r.text());
  assert.match(html, /aria-label="Filter changelog by component"/);
  assert.equal([...html.matchAll(/id="2026-10-14"/g)].length, 1);
  assert.match(html, /<details class="change-details">/);
  assert.doesNotMatch(html, /<details[^>]*\bopen(?:=|\s|>)/);
  assert.match(html, /class="change-screenshot-mark"/);

  const markdown = await fetch(`${baseUrl}/changelog/app.mdx`).then((r) =>
    r.text(),
  );
  assert.match(markdown, /2026-10-14/);
  assert.match(markdown, /https:\/\/github\.com\/everstrat-xyz\/app\/pull\/15/);
  assert.match(markdown, /7062176549/);
  assert.match(markdown, /historical snapshot/);
  assert.match(markdown, /example data/);
  for (const asset of [
    "metrics-earnings.png",
    "portfolio-history.png",
    "snapshot-sharing.png",
    "admin-snapshot.png",
    "public-snapshot.png",
    "wallet-connection.png",
    "invite-access.png",
  ]) {
    const response = await fetch(`${baseUrl}/changelog/${asset}`);
    assert.equal(response.status, 200, asset);
    assert.match(response.headers.get("content-type"), /^image\/png\b/, asset);
    await response.arrayBuffer();
  }
});

test("the GitHub sidebar link is named and its decorative SVG is hidden from accessibility", async () => {
  const html = await fetch(`${baseUrl}/changelog/app`).then((r) => r.text());
  const link = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)]
    .map(([anchor]) => anchor)
    .find((anchor) =>
      anchor.includes('href="https://github.com/everstrat-xyz"'),
    );
  assert.ok(link, "GitHub organization link is present");
  assert.match(link, /aria-label="GitHub"/);
  assert.match(link, /<svg[^>]*aria-hidden="true"/);
  assert.doesNotMatch(link, /<svg[^>]*role="img"/);
});

test("All updates renders and exports the complete category history in date order", async () => {
  const categories = JSON.parse(
    readFileSync(join(contentRoot, "changelog/meta.json"), "utf8"),
  ).pages.filter((slug) => slug !== "index");
  const expected = categories.flatMap((slug) => {
    const content = readFileSync(
      join(contentRoot, `changelog/${slug}.mdx`),
      "utf8",
    );
    return [...content.matchAll(/^## (\d{4}-\d{2}-\d{2})$/gm)].map(
      (match) => match[1],
    );
  });
  const html = await fetch(`${baseUrl}/changelog`).then((r) => r.text());
  assert.deepEqual(
    [...html.matchAll(/datetime="(\d{4}-\d{2}-\d{2})"/gi)].map(
      (match) => match[1],
    ),
    expected.sort().reverse(),
  );
  assert.equal(
    [...html.matchAll(/<figure class="change-screenshot">/g)].length,
    7,
  );
  const markdown = await fetch(`${baseUrl}/changelog.mdx`).then((r) =>
    r.text(),
  );
  for (const slug of categories) {
    const content = readFileSync(
      join(contentRoot, `changelog/${slug}.mdx`),
      "utf8",
    );
    for (const [entry] of content.matchAll(
      /<ChangeEntry\b[^>]*>[\s\S]*?<\/ChangeEntry>/g,
    )) {
      if (!/^## \d{4}-\d{2}-\d{2}$/m.test(entry)) continue;
      const title = entry.match(/^### (.+)$/m)[1];
      assert.ok(markdown.includes(title), `Missing ${slug} entry: ${title}`);
    }
  }
  assert.match(markdown, /UniCL v2 migration executed/);
  assert.match(markdown, /\/changelog\/strategies#2026-10-19/);
  assert.doesNotMatch(markdown, /Strategy migration pending/);
});

test("migration refresh preserves published sections and distinguishes historical state", async () => {
  for (const [path, fragments] of [
    [
      "/operations/current-deployments",
      [
        "pending-migration",
        "strategy-migration",
        "migration-recheck-october-15-2026",
        "retired-v1-strategies",
      ],
    ],
    [
      "/risk-and-trust/trust-and-governance",
      ["current-migration", "strategy-migration"],
    ],
    [
      "/changelog/strategies",
      ["pending-migration", "unicl-v2-is-waiting-for-execution", "2026-10-19"],
    ],
  ]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    for (const fragment of fragments) {
      assert.ok(html.includes(`id="${fragment}"`), `${path}#${fragment}`);
    }
  }
  const snapshot = await fetch(
    `${baseUrl}/operations/current-deployments.mdx`,
  ).then((r) => r.text());
  assert.match(
    snapshot,
    /four addresses now listed under \[Retired v1 strategies\]\(#retired-v1-strategies\)/,
  );
  assert.doesNotMatch(snapshot, /retain the October 12 verification boundary/);
});

test("all historical aliases return a direct 308 with working targets and preserved queries", async () => {
  const redirects = await config.redirects();
  await each(redirects, async (rule) => {
    const response = await fetch(`${baseUrl}${rule.source}?compat=kept`, {
      redirect: "manual",
    });
    assert.equal(response.status, 308, rule.source);
    const location = new URL(response.headers.get("location"), baseUrl);
    assert.equal(location.pathname, rule.destination, rule.source);
    assert.equal(location.searchParams.get("compat"), "kept", rule.source);
    const target = await fetch(location, { redirect: "manual" });
    assert.equal(target.status, 200, `${rule.source} target`);
    const expected = rule.destination.startsWith("/og/")
      ? /^image\//
      : rule.destination.startsWith("/llms.mdx/")
        ? /^text\/markdown\b/
        : /^text\/html\b/;
    assert.match(target.headers.get("content-type"), expected, rule.source);
    await target.arrayBuffer();
  });
});

test("Phase 2 redirects preserve every published heading and diagram fragment", async () => {
  // Snapshot of heading IDs and diagram anchors before Phase 2 (336e7312).
  // Fragments are handled by the browser, so checking a redirect's status alone
  // cannot detect a destination that no longer contains the bookmarked section.
  const historical = JSON.parse(
    readFileSync(
      join(root, "scripts/fixtures/docs-phase2-anchors.json"),
      "utf8",
    ),
  );
  assert.equal(historical.length, 40);
  assert.equal(
    historical.reduce((total, page) => total + page.fragments.length, 0),
    107,
  );
  await each(historical, async ({ source, destination, fragments }) => {
    for (const prefix of ["", "/docs"]) {
      const response = await fetch(`${baseUrl}${prefix}${source}`, {
        redirect: "manual",
        headers: { Accept: "text/html" },
      });
      assert.equal(response.status, 308, `${prefix}${source}`);
      const location = new URL(response.headers.get("location"), baseUrl);
      assert.equal(location.pathname, destination, source);
      // A fragment-free Location lets browsers inherit the original fragment.
      assert.equal(location.hash, "", source);
      const target = await fetch(location, { redirect: "manual" });
      assert.equal(target.status, 200, destination);
      assert.match(target.headers.get("content-type"), /^text\/html\b/);
      const ids = [
        ...(await target.text()).matchAll(/<[^>]+\sid="([^"]+)"/g),
      ].map((match) => match[1]);
      for (const fragment of fragments) {
        assert.equal(
          ids.filter((id) => id === fragment).length,
          1,
          `${prefix}${source}#${fragment} must have exactly one target on ${destination}`,
        );
      }
    }
  });
});

test("moved pages negotiate canonical Markdown and technical search breadcrumbs are nested", async () => {
  for (const old of [
    "/contracts/controller",
    "/data/entities",
    "/security/roles-and-permissions",
    "/governance/roles-permissions-and-admin-powers",
  ]) {
    const response = await fetch(`${baseUrl}${old}`, {
      headers: { Accept: "text/markdown" },
    });
    assert.equal(response.status, 200, old);
    assert.match(
      response.headers.get("content-type"),
      /^text\/markdown\b/,
      old,
    );
    const alias = (await config.redirects()).find(
      (rule) => rule.source === old,
    );
    assert.ok(
      (await response.text()).split("\n")[0].includes(`(${alias.destination})`),
      old,
    );
  }
  const results = await fetch(`${baseUrl}/api/search?query=Controller`).then(
    (response) => response.json(),
  );
  const controllers = results.filter(
    (item) => item.type === "page" && item.content === "Controller",
  );
  assert.equal(controllers.length, 1);
  assert.equal(controllers[0].url, "/developers/contracts/controller");
  assert.ok(controllers[0].breadcrumbs.includes("Developers"));
  assert.ok(controllers[0].breadcrumbs.includes("Contracts"));
  const roles = await fetch(
    `${baseUrl}/api/search?query=Roles%20and%20permissions`,
  ).then((response) => response.json());
  assert.equal(
    roles.filter(
      (item) =>
        item.type === "page" && item.content === "Roles and permissions",
    ).length,
    1,
  );
});

test("sitemap and LLM exports contain canonical pages without superseded copies or local audit notes", async () => {
  const sitemap = await fetch(`${baseUrl}/sitemap.xml`).then((response) =>
    response.text(),
  );
  const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1]).pathname,
  );
  assert.deepEqual(listed.sort(), [...routes].sort());
  const index = await fetch(`${baseUrl}/llms.txt`).then((response) =>
    response.text(),
  );
  const full = await fetch(`${baseUrl}/llms-full.txt`).then((response) =>
    response.text(),
  );
  for (const rule of (await config.redirects()).filter((rule) =>
    routes.includes(rule.destination),
  )) {
    assert.ok(!index.includes(`](${rule.source})`), rule.source);
    assert.ok(!full.includes(`(${rule.source})\n`), rule.source);
  }
  for (const [label, pattern] of [
    [
      "local home-folder paths",
      /(?:\/(?:Users|home)\/[^/\s"'<>]+\/|[a-z]:[\\/]Users[\\/])/i,
    ],
    ["local file links", /\bfile:\/\//i],
    [
      "dated local audit report names",
      /\b[\w.-]*audit(?:[-_.](?:report|notes?))?[-_.]\d{4}[-_.]\d{2}[-_.]\d{2}\b/i,
    ],
    [
      "local audit report filenames",
      /\b(?:local|internal|private)[-_.][\w.-]*audit[\w.-]*\.mdx?\b/i,
    ],
    ["RPC endpoint URLs", /\bhttps?:\/\/[^/\s"'<>]*rpc[^/\s"'<>]*/i],
  ]) {
    for (const exported of [sitemap, index, full]) {
      assert.doesNotMatch(exported, pattern, label);
    }
  }
  for (const name of [
    "architecture",
    "data",
    "exit",
    "mint",
    "nav",
    "queue",
    "strategies",
  ]) {
    const response = await fetch(`${baseUrl}/diagrams/${name}.html`);
    assert.equal(response.status, 200, name);
    await response.arrayBuffer();
  }
});
