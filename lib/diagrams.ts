/** Shared by the MDX renderer and the standalone HTML generator. Coordinates
 * use Diagram Design's `fit` preset, with a 4px grid and 40px safe area. */
export type Point = readonly [number, number];

export type DiagramNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string | readonly string[];
  detail?: string | readonly string[];
  tag?: string;
  treatment?: "focal" | "external" | "state" | "decision" | "terminal";
};

export type DiagramEdge = {
  id: string;
  points: readonly Point[];
  tone?: "accent" | "link";
  dashed?: boolean;
  label?: { text: string; x: number; y: number };
};

export type DiagramSpec = {
  number: string;
  kind: string;
  title: string;
  description: string;
  caption: string;
  width: number;
  height: number;
  nodes: readonly DiagramNode[];
  edges: readonly DiagramEdge[];
  notes?: readonly { x: number; y: number; title: string; detail: string }[];
  lifelines?: readonly { x: number; from: number; to: number }[];
  legend: readonly {
    treatment: "solid" | "dashed" | "focal" | "external";
    text: string;
  }[];
};

export const diagrams = {
  architecture: {
    number: "01",
    kind: "Architecture",
    title: "One registry. A connected protocol.",
    description:
      "Registry supplies peer addresses and roles to the AMM, EVE, Controller, ExitQueue, StrategyManager, UniCLStrat, Converter, and Oracle.",
    caption:
      "The Registry is the shared address and role authority. The main path moves ETH from AMM to Controller to StrategyManager; token, queue, swap, and valuation paths branch from it. Keeper operations and individual role checks are omitted here.",
    width: 680,
    height: 640,
    nodes: [
      {
        id: "registry",
        x: 40,
        y: 40,
        w: 600,
        h: 80,
        title: "Registry",
        detail: "Shared peer resolution + role checks for every contract",
        tag: "IMMUTABLE ANCHOR",
      },
      {
        id: "amm",
        x: 40,
        y: 184,
        w: 160,
        h: 80,
        title: "AMM",
        detail: "User entry + exit",
        tag: "IMMUTABLE",
        treatment: "focal",
      },
      {
        id: "controller",
        x: 260,
        y: 184,
        w: 160,
        h: 80,
        title: "Controller",
        detail: "Keeper operations",
        tag: "UUPS",
      },
      {
        id: "manager",
        x: 480,
        y: 184,
        w: 160,
        h: 80,
        title: "StrategyManager",
        detail: "Allocation + NAV",
        tag: "UUPS",
      },
      {
        id: "eve",
        x: 40,
        y: 352,
        w: 160,
        h: 80,
        title: "EVE",
        detail: "Protocol share token",
        tag: "IMMUTABLE",
      },
      {
        id: "queue",
        x: 260,
        y: 352,
        w: 160,
        h: 80,
        title: "ExitQueue",
        detail: "Requests + batches",
        tag: "UUPS",
      },
      {
        id: "strategy",
        x: 480,
        y: 352,
        w: 160,
        h: 80,
        title: "UniCLStrat",
        detail: "Uniswap V3 strategy",
        tag: "IMMUTABLE",
      },
      {
        id: "converter",
        x: 260,
        y: 520,
        w: 160,
        h: 80,
        title: "Converter",
        detail: "Wrap + swap",
        tag: "UUPS",
      },
      {
        id: "oracle",
        x: 480,
        y: 520,
        w: 160,
        h: 80,
        title: "Oracle",
        detail: "Asset valuation",
        tag: "UUPS",
      },
    ],
    edges: [
      {
        id: "deposit",
        points: [
          [200, 224],
          [260, 224],
        ],
        label: { text: "ETH", x: 230, y: 200 },
      },
      {
        id: "route",
        points: [
          [420, 224],
          [480, 224],
        ],
        label: { text: "ETH", x: 450, y: 200 },
      },
      {
        id: "token",
        points: [
          [88, 264],
          [88, 352],
        ],
      },
      {
        id: "queue",
        points: [
          [160, 264],
          [160, 312],
          [340, 312],
          [340, 352],
        ],
        label: { text: "QUEUE", x: 250, y: 288 },
      },
      {
        id: "allocate",
        points: [
          [560, 264],
          [560, 352],
        ],
        label: { text: "DEPLOY", x: 598, y: 296 },
      },
      {
        id: "convert",
        points: [
          [528, 432],
          [528, 476],
          [340, 476],
          [340, 520],
        ],
        label: { text: "SWAPS", x: 434, y: 452 },
      },
      {
        id: "value",
        points: [
          [608, 520],
          [608, 432],
        ],
        dashed: true,
      },
    ],
    legend: [
      { treatment: "solid", text: "Contract interaction" },
      { treatment: "dashed", text: "Valuation support" },
    ],
  },
  mint: {
    number: "02",
    kind: "Sequence",
    title: "ETH in. EVE to your wallet.",
    description:
      "For a regular deposit, the wallet sends ETH to AMM, AMM checks the minimum output, mints EVE to the wallet, then forwards ETH to Controller.",
    caption:
      "Normal deposit after bootstrap. AMM validates access, pause state, and the minimum EVE output at the premium price. EVE is minted before ETH is forwarded to Controller; strategy deployment is a later keeper action.",
    width: 680,
    height: 500,
    nodes: [
      {
        id: "wallet",
        x: 40,
        y: 40,
        w: 128,
        h: 72,
        title: "Your wallet",
        tag: "USER",
      },
      {
        id: "amm",
        x: 208,
        y: 40,
        w: 128,
        h: 72,
        title: "AMM",
        tag: "ENTRY POINT",
      },
      { id: "eve", x: 376, y: 40, w: 128, h: 72, title: "EVE", tag: "TOKEN" },
      {
        id: "controller",
        x: 544,
        y: 40,
        w: 96,
        h: 72,
        title: "Controller",
        tag: "CUSTODY",
      },
    ],
    lifelines: [104, 272, 440, 592].map((x) => ({ x, from: 112, to: 440 })),
    edges: [
      {
        id: "enter",
        points: [
          [104, 172],
          [272, 172],
        ],
        label: { text: "ENTER + ETH", x: 188, y: 148 },
      },
      {
        id: "mint",
        points: [
          [272, 256],
          [440, 256],
        ],
        label: { text: "MINT", x: 356, y: 232 },
      },
      {
        id: "credit",
        points: [
          [440, 328],
          [104, 328],
        ],
        tone: "accent",
        label: { text: "EVE TO WALLET", x: 188, y: 304 },
      },
      {
        id: "custody",
        points: [
          [272, 408],
          [592, 408],
        ],
        label: { text: "FORWARD ETH", x: 356, y: 384 },
      },
    ],
    notes: [
      {
        x: 288,
        y: 200,
        title: "PREMIUM PRICE",
        detail: "Check minTokensToMint",
      },
    ],
    legend: [
      { treatment: "solid", text: "Time flows from top to bottom" },
      { treatment: "focal", text: "EVE credited" },
    ],
  },
  exit: {
    number: "03",
    kind: "Flowchart",
    title: "One exit request. Two liquidity paths.",
    description:
      "AMM pays ETH immediately when free liquidity covers the exit; otherwise EVE is escrowed on AMM and the request is recorded in ExitQueue for later settlement and claim.",
    caption:
      "Free ETH excludes lockedForClaims. Immediate exits burn EVE and pay ETH in the same transaction. Queued exits escrow EVE on AMM, then require keeper settlement and a separate user claim.",
    width: 680,
    height: 528,
    nodes: [
      {
        id: "request",
        x: 240,
        y: 40,
        w: 200,
        h: 80,
        title: "Request ETH",
        detail: "AMM.exit(...)",
        treatment: "terminal",
      },
      {
        id: "liquidity",
        x: 244,
        y: 176,
        w: 192,
        h: 112,
        title: ["Free ETH", "covers exit?"],
        treatment: "decision",
      },
      {
        id: "queue",
        x: 40,
        y: 352,
        w: 224,
        h: 88,
        title: "Queued exit",
        detail: ["Escrow EVE on AMM", "Settle batch → claim()"],
        tag: "LATER",
      },
      {
        id: "immediate",
        x: 456,
        y: 352,
        w: 184,
        h: 88,
        title: "Immediate exit",
        detail: ["Burn EVE", "Send ETH to wallet"],
        tag: "SAME TRANSACTION",
        treatment: "focal",
      },
    ],
    edges: [
      {
        id: "check",
        points: [
          [340, 120],
          [340, 176],
        ],
      },
      {
        id: "no",
        points: [
          [244, 232],
          [152, 232],
          [152, 352],
        ],
        label: { text: "NO", x: 198, y: 208 },
      },
      {
        id: "yes",
        points: [
          [436, 232],
          [548, 232],
          [548, 352],
        ],
        label: { text: "YES", x: 492, y: 208 },
      },
    ],
    notes: [
      {
        x: 40,
        y: 476,
        title: "QUEUED PROTECTION",
        detail: "maxTokensToBurn + priceTolerance",
      },
    ],
    legend: [{ treatment: "solid", text: "Liquidity determines the path" }],
  },
  queue: {
    number: "04",
    kind: "State machine · lifecycle",
    title: "A queued exit, from escrow to claim.",
    description:
      "A queued request is priced by the keeper, processed into claimable ETH, and claimed by the user, with EVE returned on slippage or eligible cancellation.",
    caption:
      "EVE stays on AMM until processing or cancellation. The keeper must process within 3 days of pricedAt; the user then claims ETH. Strictly after 3 days, an unprocessed request cannot settle and must be cancelled to recover EVE. Unpriced requests can be cancelled at any time; already credited ETH remains claimable.",
    width: 816,
    height: 520,
    nodes: [
      {
        id: "queued",
        x: 28,
        y: 88,
        w: 136,
        h: 80,
        title: "Queued",
        detail: "EVE escrowed",
        tag: "USER REQUEST",
        treatment: "state",
      },
      {
        id: "priced",
        x: 236,
        y: 88,
        w: 136,
        h: 80,
        title: "Priced",
        detail: "Batch price locked",
        tag: "KEEPER",
        treatment: "state",
      },
      {
        id: "claimable",
        x: 444,
        y: 88,
        w: 136,
        h: 80,
        title: "Claimable",
        detail: "ETH reserved",
        tag: "KEEPER",
        treatment: "state",
      },
      {
        id: "claimed",
        x: 652,
        y: 88,
        w: 136,
        h: 80,
        title: "Claimed",
        detail: "ETH in wallet",
        tag: "USER",
        treatment: "focal",
      },
      {
        id: "cancelled",
        x: 200,
        y: 360,
        w: 192,
        h: 80,
        title: "Cancelled",
        detail: "EVE returned",
        tag: "USER",
        treatment: "terminal",
      },
      {
        id: "slippage",
        x: 448,
        y: 360,
        w: 192,
        h: 80,
        title: "Closed for slippage",
        detail: "EVE returned",
        tag: "PROCESSING",
        treatment: "terminal",
      },
    ],
    edges: [
      {
        id: "price",
        points: [
          [164, 128],
          [236, 128],
        ],
        label: { text: "PRICE", x: 200, y: 104 },
      },
      {
        id: "process",
        points: [
          [372, 128],
          [444, 128],
        ],
        label: { text: "≤ 3D", x: 408, y: 104 },
      },
      {
        id: "claim",
        points: [
          [580, 128],
          [652, 128],
        ],
        label: { text: "CLAIM()", x: 616, y: 104 },
      },
      {
        id: "cancel",
        points: [
          [96, 168],
          [96, 400],
          [200, 400],
        ],
        dashed: true,
        label: { text: "BEFORE PRICING", x: 166, y: 264 },
      },
      {
        id: "timeout",
        points: [
          [288, 168],
          [288, 248],
          [244, 248],
          [244, 360],
        ],
        dashed: true,
        label: { text: "> 3D EXPIRED", x: 296, y: 304 },
      },
      {
        id: "slippage",
        points: [
          [332, 168],
          [332, 296],
          [544, 296],
          [544, 360],
        ],
        label: { text: "SLIPPAGE", x: 438, y: 272 },
      },
    ],
    notes: [
      { x: 28, y: 52, title: "PRIMARY PHASES", detail: "" },
      {
        x: 448,
        y: 216,
        title: "WAIT FOR KEEPER",
        detail: "No guaranteed settlement time",
      },
    ],
    legend: [
      { treatment: "solid", text: "Settlement path" },
      { treatment: "dashed", text: "User cancellation" },
      { treatment: "focal", text: "Completed payout" },
    ],
  },
  nav: {
    number: "05",
    kind: "Accounting architecture",
    title: "Account in ETH. Then price EVE.",
    description:
      "StrategyManager sums strategy NAV, idle protocol ETH, and supported-token value, subtracts live priced redemption liability, and supplies ETH NAV to AMM entry and exit pricing.",
    caption:
      "Idle ETH includes StrategyManager, Controller, and AMM free balances. Supported ERC-20s are valued through Oracle. In-window priced redemption liabilities are deducted; locked claim ETH is already excluded from AMM free balance. Pricing also adjusts the live EVE supply.",
    width: 680,
    height: 520,
    nodes: [
      {
        id: "strategies",
        x: 40,
        y: 40,
        w: 200,
        h: 88,
        title: "Strategy NAV",
        detail: "Σ navInETH()",
        tag: "ASSETS",
      },
      {
        id: "idle",
        x: 40,
        y: 208,
        w: 200,
        h: 88,
        title: "Idle protocol ETH",
        detail: "Free + in-flight ETH",
        tag: "ASSETS",
      },
      {
        id: "tokens",
        x: 40,
        y: 376,
        w: 200,
        h: 80,
        title: "Supported tokens",
        detail: "Oracle value in ETH",
        tag: "ASSETS",
      },
      {
        id: "liability",
        x: 368,
        y: 40,
        w: 272,
        h: 88,
        title: "Priced exit liabilities",
        detail: "In-window batches only",
        tag: "SUBTRACT",
      },
      {
        id: "nav",
        x: 336,
        y: 208,
        w: 304,
        h: 88,
        title: "Total NAV in ETH",
        detail: "StrategyManager.totalNAVInETH()",
        tag: "NET ASSET VALUE",
        treatment: "focal",
      },
      {
        id: "base",
        x: 336,
        y: 376,
        w: 144,
        h: 80,
        title: "Base price",
        detail: "Exit pricing",
        tag: "AMM",
      },
      {
        id: "premium",
        x: 496,
        y: 376,
        w: 144,
        h: 80,
        title: "Premium price",
        detail: "Entry pricing · cw",
        tag: "AMM",
      },
    ],
    edges: [
      {
        id: "strategy-nav",
        points: [
          [240, 84],
          [280, 84],
          [280, 232],
          [336, 232],
        ],
      },
      {
        id: "idle-nav",
        points: [
          [240, 252],
          [336, 252],
        ],
      },
      {
        id: "tokens-nav",
        points: [
          [240, 416],
          [304, 416],
          [304, 272],
          [336, 272],
        ],
      },
      {
        id: "liability-nav",
        points: [
          [504, 128],
          [504, 208],
        ],
        label: { text: "−", x: 524, y: 160 },
      },
      {
        id: "base",
        points: [
          [408, 296],
          [408, 376],
        ],
      },
      {
        id: "premium",
        points: [
          [568, 296],
          [568, 376],
        ],
      },
    ],
    legend: [
      { treatment: "solid", text: "ETH-denominated accounting" },
      { treatment: "focal", text: "Net value used for pricing" },
    ],
  },
  strategies: {
    number: "06",
    kind: "Strategy architecture",
    title: "A keeper deploys the pooled capital.",
    description:
      "Keeper calls Controller, which routes operations through StrategyManager to UniCLStrat; the strategy uses Converter for swaps, maintains a Uniswap V3 LP position, and reports NAV.",
    caption:
      "One UniCLStrat instance is shown; registered instances share pooled exposure. Converter handles wrap and swap operations, while the strategy manages its LP position. Performance fees are settled separately by minting EVE to the DAO treasury.",
    width: 680,
    height: 456,
    nodes: [
      {
        id: "keeper",
        x: 40,
        y: 40,
        w: 160,
        h: 80,
        title: "Keeper",
        detail: "Operational caller",
        tag: "KEEPER_ROLE",
      },
      {
        id: "controller",
        x: 260,
        y: 40,
        w: 160,
        h: 80,
        title: "Controller",
        detail: "Routes operations",
        tag: "UUPS",
      },
      {
        id: "manager",
        x: 480,
        y: 40,
        w: 160,
        h: 80,
        title: "StrategyManager",
        detail: "Allocates capital",
        tag: "UUPS",
      },
      {
        id: "pool",
        x: 40,
        y: 264,
        w: 160,
        h: 80,
        title: "Uniswap V3",
        detail: "Concentrated LP",
        tag: "EXTERNAL",
        treatment: "external",
      },
      {
        id: "converter",
        x: 260,
        y: 264,
        w: 160,
        h: 80,
        title: "Converter",
        detail: "Wrap + swap",
        tag: "UUPS",
      },
      {
        id: "strategy",
        x: 480,
        y: 264,
        w: 160,
        h: 80,
        title: "UniCLStrat",
        detail: "Manages LP position",
        tag: "IMMUTABLE",
        treatment: "focal",
      },
    ],
    edges: [
      {
        id: "call",
        points: [
          [200, 80],
          [260, 80],
        ],
      },
      {
        id: "route",
        points: [
          [420, 80],
          [480, 80],
        ],
      },
      {
        id: "deposit",
        points: [
          [528, 120],
          [528, 264],
        ],
        label: { text: "DEPLOY ETH", x: 478, y: 168 },
      },
      {
        id: "nav",
        points: [
          [592, 264],
          [592, 120],
        ],
        dashed: true,
        label: { text: "NAV", x: 618, y: 200 },
      },
      {
        id: "swap",
        points: [
          [480, 304],
          [420, 304],
        ],
      },
      {
        id: "position",
        points: [
          [560, 344],
          [560, 408],
          [120, 408],
          [120, 344],
        ],
        tone: "link",
        label: { text: "LP POSITION", x: 340, y: 384 },
      },
    ],
    legend: [
      { treatment: "solid", text: "Keeper / contract call" },
      { treatment: "dashed", text: "NAV read" },
      { treatment: "external", text: "External protocol" },
    ],
  },
  referrals: {
    number: "08",
    kind: "Flowchart · referral registration",
    title: "A referral starts with a verified signature.",
    description:
      "A member shares a personal invite link, a new wallet accepts and signs, and the app records the direct referral and opens Portfolio before any optional on-chain deposit.",
    caption:
      "After the app verifies the signature, the friend appears in the inviter's direct-referral list and receives a personal code. Registration fixes attribution without a deposit. Minting EVE is a separate on-chain action; referral rewards and payouts are not implemented.",
    width: 680,
    height: 504,
    nodes: [
      {
        id: "share",
        x: 40,
        y: 40,
        w: 240,
        h: 88,
        title: "Copy invite link",
        detail: "/invite/<CODE>",
        tag: "INVITER · PORTFOLIO",
      },
      {
        id: "open",
        x: 400,
        y: 40,
        w: 240,
        h: 88,
        title: "Open invite + connect",
        detail: "New wallet · Ethereum mainnet",
        tag: "FRIEND",
      },
      {
        id: "sign",
        x: 400,
        y: 208,
        w: 240,
        h: 88,
        title: "Accept invite + sign",
        detail: "Message signature · no gas",
        tag: "FRIEND",
      },
      {
        id: "register",
        x: 40,
        y: 208,
        w: 264,
        h: 88,
        title: "Record direct referral",
        detail: [
          "Fix referrer + allocate code",
          "Create private access session",
        ],
        tag: "APP · OFF-CHAIN",
        treatment: "focal",
      },
      {
        id: "portfolio",
        x: 40,
        y: 376,
        w: 264,
        h: 88,
        title: "Portfolio opens",
        detail: "Personal code ready to share",
        tag: "FRIEND",
      },
      {
        id: "deposit",
        x: 400,
        y: 376,
        w: 240,
        h: 88,
        title: "First deposit",
        detail: "Mint EVE + pay transaction gas",
        tag: "SEPARATE · ON-CHAIN",
      },
    ],
    edges: [
      {
        id: "share",
        points: [
          [280, 84],
          [400, 84],
        ],
        label: { text: "SHARE", x: 340, y: 60 },
      },
      {
        id: "accept",
        points: [
          [520, 128],
          [520, 208],
        ],
      },
      {
        id: "verify",
        points: [
          [400, 252],
          [304, 252],
        ],
        label: { text: "VERIFY", x: 352, y: 228 },
      },
      {
        id: "open-portfolio",
        points: [
          [172, 296],
          [172, 376],
        ],
      },
      {
        id: "optional-deposit",
        points: [
          [304, 420],
          [400, 420],
        ],
        dashed: true,
        label: { text: "OPTIONAL", x: 352, y: 396 },
      },
    ],
    legend: [
      { treatment: "solid", text: "Invitation and registration" },
      { treatment: "focal", text: "Attribution recorded" },
      { treatment: "dashed", text: "Separate optional deposit" },
    ],
  },
  data: {
    number: "07",
    kind: "Data architecture",
    title: "History from the subgraph. State from RPC.",
    description:
      "AMM, ExitQueue, and EVE events feed GoldSky history, while direct Ethereum RPC reads supply current state to the app and integrations.",
    caption:
      "Use GoldSky for activity, user aggregates, and batch or request history. Use direct RPC for balances, allowances, paused state, live prices, and current-batch request gating. Indexed history can lag the chain.",
    width: 680,
    height: 424,
    nodes: [
      {
        id: "contracts",
        x: 40,
        y: 40,
        w: 200,
        h: 80,
        title: "On-chain contracts",
        detail: "AMM · ExitQueue · EVE",
        tag: "ETHEREUM",
      },
      {
        id: "rpc",
        x: 360,
        y: 40,
        w: 280,
        h: 80,
        title: "Ethereum RPC",
        detail: "Direct contract reads",
        tag: "LIVE STATE",
        treatment: "external",
      },
      {
        id: "subgraph",
        x: 40,
        y: 224,
        w: 200,
        h: 80,
        title: "GoldSky subgraph",
        detail: "Indexed events + entities",
        tag: "HISTORY",
        treatment: "focal",
      },
      {
        id: "consumers",
        x: 360,
        y: 224,
        w: 280,
        h: 80,
        title: "App & integrations",
        detail: "Choose the source by need",
        tag: "CONSUMERS",
      },
    ],
    edges: [
      {
        id: "reads",
        points: [
          [360, 80],
          [240, 80],
        ],
        tone: "link",
        label: { text: "READ", x: 300, y: 56 },
      },
      {
        id: "index",
        points: [
          [140, 120],
          [140, 224],
        ],
        dashed: true,
        label: { text: "EVENTS", x: 180, y: 160 },
      },
      {
        id: "history",
        points: [
          [240, 264],
          [360, 264],
        ],
        tone: "link",
        label: { text: "GRAPHQL", x: 300, y: 240 },
      },
      {
        id: "state",
        points: [
          [500, 120],
          [500, 224],
        ],
        tone: "link",
        label: { text: "LIVE READS", x: 550, y: 160 },
      },
    ],
    notes: [
      {
        x: 40,
        y: 360,
        title: "INDEXED HISTORY",
        detail: "Activity · requests · batches",
      },
      {
        x: 360,
        y: 360,
        title: "CURRENT STATE",
        detail: "Balances · prices · allowances",
      },
    ],
    legend: [
      { treatment: "external", text: "API / RPC read" },
      { treatment: "dashed", text: "Event indexing" },
    ],
  },
} satisfies Record<string, DiagramSpec>;

export type DiagramName = keyof typeof diagrams;
