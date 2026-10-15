import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: [
    "@takumi-rs/image-response",
    "@takumi-rs/core",
    "takumi-js",
  ],
  reactStrictMode: true,
  redirects() {
    // Remove consolidated copies from the content collection, while preserving
    // published page, legacy /docs, Markdown export, and social image URLs.
    const aliases = [
      ["/using-everstrat/what-is-everstrat", "/introduction/what-is-everstrat"],
      [
        "/introduction/how-the-system-is-organized",
        "/contributing/system-and-responsibilities",
      ],
      ["/introduction/monorepo-map", "/contributing/repository-map"],
      ["/engineering/monorepo-structure", "/contributing/repository-map"],
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
      [
        "/protocol/burn-and-redemption-flow",
        "/developers/protocol/burn-and-redemption-flow",
      ],
      [
        "/protocol/high-level-architecture",
        "/developers/protocol/high-level-architecture",
      ],
      ["/protocol/mint-flow", "/developers/protocol/mint-flow"],
      [
        "/protocol/queued-redemption-lifecycle",
        "/developers/protocol/queued-redemption-lifecycle",
      ],
      [
        "/protocol/strategy-and-nav-model",
        "/developers/protocol/strategy-and-nav-model",
      ],
      ["/protocol/user-lifecycle", "/developers/protocol/user-lifecycle"],
      ["/contracts/amm", "/developers/contracts/amm"],
      ["/contracts/controller", "/developers/contracts/controller"],
      ["/contracts/eve", "/developers/contracts/eve"],
      ["/contracts/exit-queue", "/developers/contracts/exit-queue"],
      [
        "/contracts/interfaces-and-libraries",
        "/developers/contracts/interfaces-and-libraries",
      ],
      [
        "/contracts/keepers-and-automation",
        "/developers/contracts/keepers-and-automation",
      ],
      ["/contracts/oracle", "/developers/contracts/oracle"],
      ["/contracts/overview", "/developers/contracts/overview"],
      ["/contracts/strategy-manager", "/developers/contracts/strategy-manager"],
      [
        "/app/account-details-and-activity-feed",
        "/developers/app/account-details-and-activity-feed",
      ],
      ["/app/burn-ui", "/developers/app/burn-ui"],
      ["/app/mint-ui", "/developers/app/mint-ui"],
      ["/app/overview", "/developers/app/overview"],
      ["/app/slippage-model", "/developers/app/slippage-model"],
      [
        "/app/transaction-modal-and-status-ux",
        "/developers/app/transaction-modal-and-status-ux",
      ],
      [
        "/app/wallet-connection-and-supported-chain",
        "/developers/app/wallet-connection-and-supported-chain",
      ],
      ["/data/activity-feed-mapping", "/developers/data/activity-feed-mapping"],
      ["/data/entities", "/developers/data/entities"],
      [
        "/data/indexed-contracts-and-events",
        "/developers/data/indexed-contracts-and-events",
      ],
      ["/data/query-examples", "/developers/data/query-examples"],
      ["/data/subgraph-overview", "/developers/data/subgraph-overview"],
      [
        "/developers/events-entities-and-integrations",
        "/developers/data/events-entities-and-integrations",
      ],
      [
        "/developers/subgraph-and-data-access",
        "/developers/data/subgraph-and-data-access",
      ],
      [
        "/security/roles-and-permissions",
        "/risk-and-trust/roles-and-permissions",
      ],
      [
        "/security/failure-and-recovery-scenarios",
        "/operations/failure-and-recovery-scenarios",
      ],
      [
        "/reference/changelog-or-release-notes-strategy",
        "/contributing/changelog-or-release-notes-strategy",
      ],
      [
        "/developers/contract-addresses-and-deployments",
        "/reference/contract-addresses",
      ],
      ["/operations/smart-contract-addresses", "/reference/contract-addresses"],
      ["/risk/key-risks-and-assumptions", "/risk-and-trust/key-risks"],
      [
        "/risk/smart-contract-and-operational-trust-model",
        "/risk-and-trust/trust-and-governance",
      ],
      [
        "/security/immutable-vs-upgradeable-components",
        "/risk-and-trust/trust-and-governance",
      ],
      ["/security/trust-assumptions", "/risk-and-trust/trust-and-governance"],
      [
        "/security/audits-reviews-and-known-limitations",
        "/risk-and-trust/security-and-audits",
      ],
      [
        "/governance/roles-permissions-and-admin-powers",
        "/risk-and-trust/roles-and-permissions",
      ],
    ];

    return aliases.flatMap(([source, destination]) => [
      { source, destination, permanent: true },
      { source: `/docs${source}`, destination, permanent: true },
      {
        source: `${source}.mdx`,
        destination: `/llms.mdx/docs${destination}/content.md`,
        permanent: true,
      },
      {
        source: `/docs${source}.mdx`,
        destination: `/llms.mdx/docs${destination}/content.md`,
        permanent: true,
      },
      {
        source: `/llms.mdx/docs${source}/content.md`,
        destination: `/llms.mdx/docs${destination}/content.md`,
        permanent: true,
      },
      {
        source: `/og/docs${source}/image.webp`,
        destination: `/og/docs${destination}/image.webp`,
        permanent: true,
      },
    ]);
  },
};

export default withMDX(config);
