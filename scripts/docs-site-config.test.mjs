import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { afterEach, test } from "node:test";

const require = createRequire(import.meta.url);
const { getAbsoluteUrl, getSiteUrl } = require("../lib/config.ts");

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalVercelEnv = process.env.VERCEL_ENV;

afterEach(() => {
  for (const [key, value] of [
    ["NEXT_PUBLIC_SITE_URL", originalSiteUrl],
    ["VERCEL_ENV", originalVercelEnv],
  ]) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("local builds have a development origin when no URL is configured", () => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.VERCEL_ENV;
  assert.equal(getSiteUrl().origin, "http://localhost:3000");
});

test("the configured origin is shared by canonical and asset URLs", () => {
  process.env.NEXT_PUBLIC_SITE_URL = " https://docs.example.com/ ";
  process.env.VERCEL_ENV = "production";
  assert.equal(getSiteUrl().origin, "https://docs.example.com");
  assert.equal(
    getAbsoluteUrl("/using-everstrat/referrals"),
    "https://docs.example.com/using-everstrat/referrals",
  );
  assert.equal(
    getAbsoluteUrl("/opengraph-image"),
    "https://docs.example.com/opengraph-image",
  );
});

test("invalid configured origins fail instead of silently publishing localhost metadata", () => {
  delete process.env.VERCEL_ENV;
  for (const value of [
    "docs.example.com",
    "ftp://docs.example.com",
    "https://docs.example.com/subpath",
    "https://docs.example.com/?query=value",
    "https://docs.example.com/#fragment",
    "https://user:password@docs.example.com",
  ]) {
    process.env.NEXT_PUBLIC_SITE_URL = value;
    assert.throws(getSiteUrl, /NEXT_PUBLIC_SITE_URL/);
  }
});

test("Vercel production requires an explicit public HTTPS origin", () => {
  process.env.VERCEL_ENV = "production";
  delete process.env.NEXT_PUBLIC_SITE_URL;
  assert.throws(getSiteUrl, /required for production/);
  for (const value of [
    "http://docs.example.com",
    "https://localhost",
    "https://docs.localhost",
    "https://127.0.0.1",
    "https://[::1]",
  ]) {
    process.env.NEXT_PUBLIC_SITE_URL = value;
    assert.throws(getSiteUrl, /public HTTPS origin/);
  }
});
