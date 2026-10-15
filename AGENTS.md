# AGENTS.md

This file defines how agents should work at the root of the `everstrat-xyz/docs` repository.
This is a standalone repository, extracted from the historical hackerhouse monorepo.
Protocol, app, website, keepers, and governance sources now live in separate
`everstrat-xyz` repositories. Resolve their actual checkout locations before reading them;
historical monorepo paths are not directories in this repository.

It is specific to the Everstrat Docs application.

## Mission

This workspace is the documentation delivery app for the Everstrat project.

Agents working here should optimize for:

- accurate documentation of shipped behavior
- clean Fumadocs and Next.js integration
- consistent visual alignment with the application and Everstrat brand
- safe updates to content, search, metadata, and LLM export routes

This is not a generic starter Fumadocs app anymore. Treat it as a product-facing docs surface.

## What This Workspace Owns

This app owns:

- the public docs UI
- MDX content rendering from `content/docs`
- root-routed docs pages
- search API
- docs metadata, structured data, icons, OG/Twitter assets, sitemap, robots, manifest, and LLM export routes

This app does not own:

- protocol implementation
- web3 client business logic
- landing page product copy

But it must stay aligned with all of them.

## Key Paths

- `app/(docs)/[[...slug]]/page.tsx`: main docs page route
- `app/(docs)/layout.tsx`: shared docs shell
- `app/docs/[[...slug]]/page.tsx`: legacy `/docs/*` redirect
- `app/api/search/route.ts`: Fumadocs search endpoint
- `app/robots.ts`: crawl directives
- `app/sitemap.ts`: sitemap generation
- `app/opengraph-image.tsx`: default social preview image
- `app/twitter-image.tsx`: Twitter/X social preview image
- `content/docs`: primary documentation source
- `lib/config.ts`: typed site, route, repo, and SEO config
- `lib/source.ts`: Fumadocs loader and page access
- `lib/metadata.ts`: shared Next metadata helpers
- `lib/structured-data.tsx`: JSON-LD helpers for home and docs pages
- `lib/layout.shared.tsx`: shared layout options
- `app/global.css`: docs theme

## Routing Rules

The docs app is root-routed.

- `/` is the docs home page
- `/<slug>` is a docs page
- `/docs/*` exists only as a compatibility redirect

Do not reintroduce a separate landing route inside this app unless explicitly requested.

## Content Rules

Documentation content lives in `content/docs`.

Agents should:

- write in technical English
- document current behavior, not speculative future behavior
- use `everstrat-xyz/contracts` for protocol implementation, `everstrat-xyz/app` for UI behavior,
  `everstrat-xyz/keepers` for automation, and `everstrat-xyz/governance` for proposal payloads
- prefer explicit constraints, edge cases, and operational details over marketing phrasing

For deployment claims, pin a chain block and distinguish proposed, scheduled, Ready, and Done.
Keep contract addresses in `content/docs/reference/contract-addresses.mdx` and dated settings,
strategy registration, and migration state in `content/docs/operations/current-deployments.mdx`.
Link explanatory pages to those references. Check deployed versions as well as source main.
Document code capabilities separately from the funded/configured user path.

For content moves or consolidation, follow the section ownership in
`content/docs/contributing/how-docs-should-be-maintained.mdx`. Remove superseded pages from the
source collection, update internal links, and preserve page, legacy, Markdown, and image URLs
with direct redirects in `next.config.mjs`.

Keep local audit reports, scratch evidence, endpoint inventories, and machine-specific paths
outside publishable content and commits. Publish the corrected docs, not the local audit note.

## Design Rules

This workspace should visually align with the Everstrat application, especially
the Portfolio (Dashboard) and Metrics (Stats) screens. The landing page remains a
secondary brand reference. In the `everstrat-xyz/app` checkout, consult
`src/components/ui/analytics-layout.ts`, `src/features/Header/components/AppHeader.tsx`,
and the Dashboard and Stats components before changing the docs theme.

Current expectations:

- use the application palette: warm `#F5F4F3` canvas, white panels, soft neutral surfaces, and `#AAFF92` active navigation
- match the application's restrained borders, 20–24 px panel radii, and muted sage, blue, and sand section accents
- preserve the existing Inter / Swiss grotesk typography direction and translucent controls
- keep reading widths comfortable, page headers compact, and navigation cards clearly actionable; avoid decorative motion and redundant home-page pagination
- maintain corresponding dark theme tokens with readable foregrounds and semantic callouts; the black brand mark must invert to white in dark mode, including the mobile header
- avoid introducing unrelated design systems or off-brand palettes

Use Fumadocs primitives, but theme them to match the product brand.

## Fumadocs Rules

Agents should work with the existing Fumadocs setup rather than fighting it.

- prefer updating `content/docs` over hardcoding page content in React
- keep cross-app constants in `lib/config.ts` when they are reused by multiple routes or layers
- keep `lib/source.ts` as the content access layer
- keep `lib/metadata.ts` as the metadata composition layer
- keep `lib/structured-data.tsx` as the JSON-LD composition layer
- use `source.config.ts` for MDX collection behavior, including the Fumadocs `lastModified` plugin
- do not hand-edit generated output under `.source`

If routing or layout changes are needed, preserve:

- root-routed docs behavior
- working page tree generation
- valid search indexing
- valid canonical metadata, sitemap output, robots output, and JSON-LD output
- valid `llms.txt` and `llms-full.txt` routes

## Environment Variables

Common variables used by this workspace:

- `NEXT_PUBLIC_SITE_URL`: absolute URL base for metadata
- `GOOGLE_SITE_VERIFICATION`: optional Google Search Console verification
- `BING_SITE_VERIFICATION`: optional Bing Webmaster verification
- `YANDEX_VERIFICATION`: optional Yandex verification
- `YAHOO_SITE_VERIFICATION`: optional Yahoo verification
- `VERCEL_DEEP_CLONE`: set to `true` on Vercel when Git-based last-modified timestamps must reflect full history

Do not hardcode production URLs or secrets into source files.

## Validation

Run validation from this repository's root:

```bash
bun run docs:gen
bun run diagrams:gen
bun run test:content
bun run test:docs
bun run lint
bun run types:check
bun run build
bun run test:markdown
```

Important:

- `bun run lint` checks Biome without changing files; `bun run lint:fix` applies safe fixes
- `bun run docs:gen` refreshes generated `.source` files when docs collections change
- `bun run types:check` regenerates Next route types before TypeScript checking
- `bun run test:markdown` checks real HTTP responses on a temporary production server; build first

At minimum, agents touching this workspace should run `bun run lint` unless blocked.

## Safe Editing Rules

- do not edit `.next/`
- do not edit `node_modules/`
- do not edit generated `.source/` files manually
- do not replace MDX content with hardcoded JSX unless the page truly requires a custom implementation
- do not break root routing or legacy `/docs/*` redirects
- do not scatter site-level strings or SEO defaults across routes when they belong in `lib/config.ts`

## Cross-Workspace Awareness

Changes in these locations often require docs updates:

- `everstrat-xyz/contracts`: `src/contracts`, `src/interfaces`, `src/libraries`, `script`, `mermaid`
- `everstrat-xyz/app`: `src/config`, `src/features`, `src/proxy.ts`, `subgraph`
- `everstrat-xyz/keepers`: `mimic-functions` and operational runbooks
- `everstrat-xyz/governance`: proposal payloads and operation IDs, checked against chain receipts
- `everstrat-xyz/website`: public copy and official community links

If a task touches protocol behavior or frontend behavior outside this workspace, agents should check whether docs now drift from reality.

## Preferred Change Style

- make focused edits
- keep the docs app understandable
- avoid unnecessary refactors
- preserve the current architecture unless the task requires structural changes
- prefer extending existing patterns over introducing parallel systems

## Handoff Expectations

Final handoff for this workspace should include:

- what changed
- whether docs content, docs UI, or docs infrastructure changed
- which validation commands were run
- any unverified runtime assumptions, especially around search, metadata, LLM exports, or environment variables

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
