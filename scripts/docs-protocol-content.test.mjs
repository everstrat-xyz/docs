import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../content/docs/${path}`, import.meta.url), "utf8");
const compact = (path) => read(path).replace(/\s+/g, " ");

test("the deployment snapshot records the executed upgrade and strategy migration", () => {
  const snapshot = read("operations/current-deployments.mdx");
  assert.match(snapshot, /block \*\*[\d,]+\*\*[\s\S]*?UTC/);
  assert.match(snapshot, /018: Controller 1\.1\.0[^\n]+\*\*Done\*\*/);
  assert.match(snapshot, /019: register v2[^\n]+\*\*Done\*\*/);
  assert.match(snapshot, /020: drain and remove v1[^\n]+\*\*Done\*\*/);
  assert.match(
    snapshot,
    /021: drain and remove UNI\/WETH v2[^\n]+\*\*Done\*\*/,
  );
  assert.match(snapshot, /Retired v1 address/);
  assert.match(snapshot, /### Retired UNI\/WETH v2 strategy/);
  const migration = compact("risk-and-trust/trust-and-governance.mdx");
  assert.match(migration, /Controller 1\.1\.0 is active/);
  assert.match(migration, /019 and 020 executed on October 19, 2026/);
  assert.match(migration, /021 executed on October 28, 2026/);
  assert.match(
    migration,
    /\/operations\/current-deployments#strategy-migration/,
  );
  assert.match(
    compact("developers/contracts/controller.mdx"),
    /withdrawFromStrategy.*?ADMIN or KEEPER/,
  );
});

test("the role snapshot retains both verified Converter role assignments", () => {
  const snapshot = read("operations/current-deployments.mdx");
  assert.match(
    snapshot,
    /\| `CONVERTER_CALLER_ROLE` \| Three registered v2 strategies \[listed above\]\(#registered-strategies\) \|/,
  );
  assert.match(
    snapshot,
    /\| `CONVERTER_CALLER_MANAGER_ROLE` \| \[Converter\]\(\/reference\/contract-addresses#core-contracts-and-keeper-executors\) \|/,
  );
  assert.match(
    compact("operations/current-deployments.mdx"),
    /getRoleMemberCount\(\).*?getRoleMember\(\).*?snapshot block: three caller holders and one manager holder/,
  );
  const strategies = snapshot
    .split("## Registered strategies")[1]
    .split("## Role holders")[0]
    .match(/^\| [^|]+ \| [\d.]+% \| `0x[0-9a-fA-F]{40}` \|/gm);
  assert.equal(strategies.length, 3);
});

test("audit status uses the agreed wording and names the dated preliminary report", () => {
  const security = compact("risk-and-trust/security-and-audits.mdx");
  assert.match(security, /audited internally and by a third party/i);
  assert.match(security, /Team Omega/);
  assert.match(security, /preliminary/i);
  assert.match(security, /157129b7c7f3db06275ecc6697ff0acfab3d9dbe/);
  assert.match(security, /0 high, 2 medium, 7 low, 1 informational/);
  for (const path of [
    "index.mdx",
    "introduction/what-is-everstrat.mdx",
    "get-started/overview.mdx",
    "get-started/connect-wallet-and-supported-network.mdx",
    "using-everstrat/depositing-and-minting.mdx",
    "using-everstrat/exiting-and-redeeming.mdx",
    "using-everstrat/fees-and-costs.mdx",
    "legal/privacy.mdx",
    "legal/risk-disclosure.mdx",
    "reference/faq.mdx",
    "risk-and-trust/key-risks.mdx",
  ]) {
    assert.doesNotMatch(read(path), /unaudited|not audited/i, path);
  }
});

test("documented exit availability agrees with the pinned AMM liquidity reads", () => {
  const snapshot = read("operations/current-deployments.mdx");
  const balance = BigInt(snapshot.match(/\| AMM ETH balance \| `(\d+)`/)[1]);
  const locked = BigInt(
    snapshot.match(/\| `AMM.lockedForClaims\(\)` \| `(\d+)`/)[1],
  );
  const free = BigInt(snapshot.match(/\| `AMM.freeBalance\(\)` \| `(\d+)`/)[1]);
  assert.equal(free, balance - locked);
  if (free === 0n) {
    for (const path of [
      "index.mdx",
      "reference/faq.mdx",
      "how-everstrat-works/redemption-queue.mdx",
      "using-everstrat/exiting-and-redeeming.mdx",
      "get-started/burn-and-redeem.mdx",
    ]) {
      assert.match(
        read(path),
        /\/operations\/current-deployments#exit-liquidity-at-this-block/,
        path,
      );
      assert.match(read(path), /queue/i, path);
    }
  }
});

test("expiry closes processing, not already credited claims", () => {
  for (const path of [
    "reference/faq.mdx",
    "how-everstrat-works/redemption-queue.mdx",
    "developers/protocol/queued-redemption-lifecycle.mdx",
    "developers/contracts/exit-queue.mdx",
  ]) {
    const text = compact(path);
    assert.match(
      text,
      /(?:cannot|can no longer) be (?:processed|settled|paid)|cannot make.*?payable/,
      path,
    );
    assert.match(
      text,
      /credited ETH remains claimable|ETH remains claimable/,
      path,
    );
  }
  const keepers = compact("developers/contracts/keepers-and-automation.mdx");
  assert.match(keepers, /measured from batch creation/);
  assert.match(keepers, /\/how-everstrat-works\/redemption-queue/);
});

test("authority, fee basis, and wallet access retain their important boundaries", () => {
  const permissions = compact("risk-and-trust/roles-and-permissions.mdx");
  assert.match(
    permissions,
    /Whitelist\.removeSigner.*?ADMIN or SECURITY.*?enabled/,
  );
  assert.match(
    permissions,
    /SECURITY cannot add signers or disable the Whitelist/,
  );
  assert.match(permissions, /StrategyManager\.removeSupportedERC20/);
  for (const path of [
    "risk-and-trust/trust-and-governance.mdx",
    "risk-and-trust/security-and-audits.mdx",
  ]) {
    assert.match(
      read(path),
      /\/risk-and-trust\/roles-and-permissions#emergency-authority/,
      path,
    );
  }
  assert.match(read("developers/contracts/overview.mdx"), /per contract/);
  assert.match(
    read("developers/contracts/interfaces-and-libraries.mdx"),
    /ADMIN or SECURITY.*paused strategy/,
  );
  assert.match(read("reference/glossary.mdx"), /accrued Uniswap V3 LP fees/);
  assert.match(
    read("reference/glossary.mdx"),
    /maxTokensToBurn[^\n]+queued escrow/,
  );
  assert.match(read("developers/app/mint-ui.mdx"), /enterWithInvite/);
  assert.doesNotMatch(read("developers/app/mint-ui.mdx"), /US person/);
  assert.match(
    read("get-started/connect-wallet-and-supported-network.mdx"),
    /Accept invite/,
  );
  assert.match(
    read("get-started/connect-wallet-and-supported-network.mdx"),
    /\*\*Wrong network\*\*/,
  );
});
