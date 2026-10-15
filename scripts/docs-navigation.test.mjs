import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import config from "../next.config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = join(root, "content/docs");
const read = (path) => readFileSync(join(contentRoot, path), "utf8");
const meta = (path) => JSON.parse(read(path));
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
const pages = walk(contentRoot).filter((path) => path.endsWith(".mdx"));
const routes = new Set(
  pages.map((path) => {
    const slug = relative(contentRoot, path).replace(/\.mdx$/, "");
    return slug === "index" ? "/" : `/${slug.replace(/\/index$/, "")}`;
  }),
);
const aliases = [
  ["/using-everstrat/what-is-everstrat", "/introduction/what-is-everstrat"],
  ["/introduction/monorepo-map", "/contributing/repository-map"],
  ["/engineering/monorepo-structure", "/contributing/repository-map"],
  [
    "/introduction/how-the-system-is-organized",
    "/contributing/system-and-responsibilities",
  ],
  [
    "/engineering/workspace-responsibilities",
    "/contributing/system-and-responsibilities",
  ],
  [
    "/engineering/cross-workspace-sync-rules",
    "/contributing/cross-workspace-sync-rules",
  ],
  [
    "/engineering/how-docs-should-be-maintained",
    "/contributing/how-docs-should-be-maintained",
  ],
];

test("shared page tree and home cards put Introduction before Get Started", () => {
  assert.deepEqual(meta("meta.json").pages.slice(0, 3), [
    "index",
    "introduction",
    "get-started",
  ]);
  assert.deepEqual(meta("introduction/meta.json").pages, [
    "what-is-everstrat",
    "core-concepts-glossary",
  ]);
  const cards = [...read("index.mdx").matchAll(/<Card title="([^"]+)"/g)];
  assert.deepEqual(
    cards.slice(0, 3).map((match) => match[1]),
    ["Introduction", "Get Started", "Using Everstrat"],
  );
});

test("onboarding keeps existing URLs and names the four first-use steps", () => {
  const slugs = meta("get-started/meta.json").pages;
  assert.deepEqual(slugs, [
    "overview",
    "connect-wallet-and-supported-network",
    "first-mint",
    "burn-and-redeem",
  ]);
  assert.deepEqual(
    slugs.map(
      (slug) => read(`get-started/${slug}.mdx`).match(/^title: (.+)$/m)[1],
    ),
    [
      "Before you start",
      "Connect your wallet",
      "Your first deposit",
      "Your first exit",
    ],
  );
  const prerequisites = read("get-started/overview.mdx");
  for (const required of [
    "chain id **1**",
    "invite",
    "gas",
    "/reference/contract-addresses",
    "/using-everstrat/fees-and-costs",
    "/legal/risk-disclosure",
  ]) {
    assert.ok(prerequisites.includes(required), required);
  }
  assert.ok(
    read("get-started/first-mint.mdx").includes("I accept — continue to mint"),
  );
  const exit = read("get-started/burn-and-redeem.mdx");
  assert.ok(
    exit.indexOf("**Approve EVE if requested") < exit.indexOf("**Click Burn"),
  );
  assert.ok(exit.includes("confirm the separate transaction"));
});

test("consolidated pages leave only one product introduction in the collection", () => {
  const introductions = pages.filter((path) =>
    /^title: What is Everstrat\?$/m.test(readFileSync(path, "utf8")),
  );
  assert.equal(introductions.length, 1);
  for (const [source, destination] of aliases) {
    assert.ok(!routes.has(source), `Duplicate source remains: ${source}`);
    assert.ok(
      routes.has(destination),
      `Missing canonical page: ${destination}`,
    );
  }
  assert.ok(!existsSync(join(contentRoot, "engineering/meta.json")));
  assert.equal(meta("contributing/meta.json").title, "Contributing");
});

test("every navigation entry and internal content link resolves canonically", () => {
  for (const path of walk(contentRoot).filter((path) =>
    path.endsWith("meta.json"),
  )) {
    const dir = dirname(path);
    for (const entry of JSON.parse(readFileSync(path, "utf8")).pages ?? []) {
      assert.ok(
        existsSync(join(dir, `${entry}.mdx`)) ||
          existsSync(join(dir, entry, "meta.json")),
        `Missing navigation entry: ${path} -> ${entry}`,
      );
    }
  }
  for (const path of pages) {
    const owner = join(dirname(path), "meta.json");
    assert.ok(existsSync(owner), `Page has no section metadata: ${path}`);
    const slug = relative(dirname(path), path).replace(/\.mdx$/, "");
    assert.ok(
      JSON.parse(readFileSync(owner, "utf8")).pages.includes(slug),
      `Unlisted page remains in search/export collection: ${path}`,
    );
    const text = readFileSync(path, "utf8");
    const links = [
      ...text.matchAll(/\]\((\/[^)\s]+)\)/g),
      ...text.matchAll(/href="(\/[^"\s]+)"/g),
    ];
    for (const [, href] of links) {
      const route = href.split(/[?#]/)[0];
      assert.ok(
        routes.has(route),
        `Missing or noncanonical link: ${path} -> ${href}`,
      );
    }
  }
});

test("old page, legacy, Markdown, and image URLs redirect directly to canonical paths", async () => {
  const redirects = await config.redirects();
  assert.ok(redirects.length >= aliases.length * 6);
  assert.equal(
    new Set(redirects.map((rule) => rule.source)).size,
    redirects.length,
  );
  for (const [source, destination] of aliases) {
    for (const [oldPath, newPath] of [
      [source, destination],
      [`/docs${source}`, destination],
      [`${source}.mdx`, `/llms.mdx/docs${destination}/content.md`],
      [`/docs${source}.mdx`, `/llms.mdx/docs${destination}/content.md`],
      [
        `/llms.mdx/docs${source}/content.md`,
        `/llms.mdx/docs${destination}/content.md`,
      ],
      [`/og/docs${source}/image.webp`, `/og/docs${destination}/image.webp`],
    ]) {
      assert.deepEqual(
        redirects.find((rule) => rule.source === oldPath),
        {
          source: oldPath,
          destination: newPath,
          permanent: true,
        },
      );
    }
  }
});

test("all seven diagram embeds and direct figure links survive consolidation", () => {
  const text = pages.map((path) => readFileSync(path, "utf8")).join("\n");
  const names = [...text.matchAll(/<DocsDiagram name="([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(names.sort(), [
    "architecture",
    "data",
    "exit",
    "mint",
    "nav",
    "queue",
    "strategies",
  ]);
  for (const name of names)
    assert.ok(text.includes(`#everstrat-${name}-diagram`));
});

test("Phase 2 has ten sections, matching home cards and four technical subsections", () => {
  const expected = [
    "introduction",
    "get-started",
    "using-everstrat",
    "how-everstrat-works",
    "risk-and-trust",
    "reference",
    "developers",
    "operations",
    "contributing",
    "legal",
  ];
  assert.deepEqual(meta("meta.json").pages, ["index", ...expected]);
  assert.deepEqual(meta("developers/meta.json").pages, [
    "protocol",
    "contracts",
    "app",
    "data",
  ]);
  const titles = expected.map((section) => meta(`${section}/meta.json`).title);
  const cards = [...read("index.mdx").matchAll(/<Card title="([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(cards, titles);
  for (const old of [
    "protocol",
    "contracts",
    "app",
    "data",
    "risk",
    "security",
    "governance",
  ])
    assert.ok(!existsSync(join(contentRoot, old, "meta.json")), old);
});

test("every previously published Phase 1 page survives or redirects directly", async () => {
  const legacy = JSON.parse(
    readFileSync(
      join(root, "scripts/fixtures/docs-phase1-routes.json"),
      "utf8",
    ),
  );
  assert.equal(legacy.length, 77);
  const redirects = await config.redirects();
  const pageRules = redirects.filter((rule) => routes.has(rule.destination));
  for (const rule of pageRules)
    assert.ok(
      !routes.has(rule.source),
      `Superseded source remains indexed: ${rule.source}`,
    );
  for (const old of legacy) {
    if (routes.has(old)) continue;
    const rule = pageRules.find((rule) => rule.source === old);
    assert.ok(rule, `Lost published page: ${old}`);
    assert.ok(!routes.has(old), `Duplicate remains: ${old}`);
  }
  for (const rule of redirects) {
    assert.ok(
      !redirects.some((other) => other.source === rule.destination),
      `Redirect chain: ${rule.source}`,
    );
    const target = rule.destination.startsWith("/llms.mdx/docs")
      ? rule.destination
          .replace("/llms.mdx/docs", "")
          .replace(/\/content\.md$/, "") || "/"
      : rule.destination.startsWith("/og/docs")
        ? rule.destination
            .replace("/og/docs", "")
            .replace(/\/image\.webp$/, "") || "/"
        : rule.destination;
    assert.ok(
      routes.has(target),
      `Missing redirect target: ${rule.source} -> ${target}`,
    );
  }
});

test("technical integration pages and their diagram are inside Developers / Data", () => {
  const data = meta("developers/data/meta.json").pages;
  assert.ok(data.includes("events-entities-and-integrations"));
  assert.ok(data.includes("subgraph-and-data-access"));
  assert.ok(
    read("developers/data/subgraph-and-data-access.mdx").includes(
      '<DocsDiagram name="data" />',
    ),
  );
  assert.ok(
    !existsSync(
      join(contentRoot, "developers/contract-addresses-and-deployments.mdx"),
    ),
  );
});

test("risk and governance retain one permission reference and recovery lives in Operations", () => {
  assert.deepEqual(meta("risk-and-trust/meta.json").pages, [
    "key-risks",
    "trust-and-governance",
    "roles-and-permissions",
    "security-and-audits",
  ]);
  const roles = read("risk-and-trust/roles-and-permissions.mdx");
  for (const required of [
    "DEFAULT_ADMIN_ROLE",
    "self-administered",
    "CANCELLER",
    "onlyAuthContract",
    "CONVERTER_CALLER_MANAGER_ROLE",
    "removeSupportedERC20",
    "removeSigner",
    "emergencyExit",
    "allowlisted",
  ])
    assert.ok(roles.includes(required), required);
  assert.ok(
    meta("operations/meta.json").pages.includes(
      "failure-and-recovery-scenarios",
    ),
  );
  const recovery = read("operations/failure-and-recovery-scenarios.mdx");
  for (const required of [
    "three days",
    "slippage",
    "Subgraph",
    "RPC",
    "Operational Recovery",
  ])
    assert.ok(recovery.includes(required), required);
});

test("the address inventory, complete glossary, and release policy each have one owner", () => {
  const addresses = read("reference/contract-addresses.mdx");
  assert.equal(
    [
      ...addresses
        .split("## Verification")[0]
        .matchAll(/^\| [^|]+ \| `0x[a-fA-F0-9]{40}` \|$/gm),
    ].length,
    12,
  );
  assert.ok(addresses.includes("sync-config.mjs"));
  const snapshot = read("operations/current-deployments.mdx");
  assert.ok(
    snapshot.includes(
      "/reference/contract-addresses#core-contracts-and-keeper-executors",
    ),
  );
  assert.ok(snapshot.includes("It does not refresh automatically"));
  assert.match(
    snapshot,
    /10 registered addresses returned by `Registry\.getContractsAndKeys\(\)`/,
  );
  assert.match(snapshot, /12 addresses in total/);
  assert.ok(
    !existsSync(join(contentRoot, "operations/smart-contract-addresses.mdx")),
  );
  assert.equal(
    pages.filter((path) =>
      /^title: Glossary$/m.test(readFileSync(path, "utf8")),
    ).length,
    1,
  );
  assert.ok(
    meta("contributing/meta.json").pages.includes(
      "changelog-or-release-notes-strategy",
    ),
  );
  assert.ok(
    !existsSync(
      join(contentRoot, "reference/changelog-or-release-notes-strategy.mdx"),
    ),
  );
  assert.ok(
    read("contributing/changelog-or-release-notes-strategy.mdx").includes(
      "It is not a release history",
    ),
  );
});
