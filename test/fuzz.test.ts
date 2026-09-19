import { test } from "node:test";
import assert from "node:assert/strict";
import fastslug from "../src/index.ts";

// Deterministic PRNG so failures are reproducible.
let seed = 42;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;

const POOLS = [
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  "    \t\n-_.,;:!?'\"`()[]{}<>/\\|#*^~=&@%+$",
  "éèêëàâäåáãçñöôóòõøüûúùïîíìÿýßæœÆŒØÅĐđŁłİıĦħŊŋƏə",
  "€£¥₹₨₩₽₺₿¢¤₣₸﷼♥∞∑∆™®©…—–“”‘’«»•§¶°±×÷",
  "🚀🔥❤️👍🏽🇮🇳👨‍👩‍👧1️⃣",
  "你好Приветمرحباשלוםπλ",
  "­​‍﻿ ⁠",
  "𝐁𝐨𝐥𝐝ＦＵＬＬ²³½ﬁⅫⓐ",
];

function randomString(): string {
  const len = Math.floor(rand() * 40);
  let s = "";
  for (let i = 0; i < len; i++) s += pick([...pick(POOLS)]);
  return s;
}

const inputs = Array.from({ length: 20_000 }, randomString);

test("output is always a clean slug", () => {
  for (const input of inputs) {
    const out = fastslug(input);
    assert.match(out, /^([a-z0-9]+(-[a-z0-9]+)*)?$/, `input ${JSON.stringify(input)} → ${JSON.stringify(out)}`);
  }
});

test("slugging a slug changes nothing", () => {
  for (const input of inputs) {
    const once = fastslug(input);
    assert.equal(fastslug(once), once, `input ${JSON.stringify(input)}`);
  }
});

test("maxLength is never exceeded", () => {
  for (const input of inputs.slice(0, 5000)) {
    for (const maxLength of [1, 5, 12]) {
      assert.ok(fastslug(input, { maxLength }).length <= maxLength);
      assert.ok(fastslug(input, { maxLength, trim: false }).length <= maxLength);
    }
  }
});

test("custom separator never doubles or dangles", () => {
  for (const input of inputs.slice(0, 5000)) {
    const out = fastslug(input, "__");
    assert.ok(!out.includes("____") && !out.startsWith("__") && !out.endsWith("__"), JSON.stringify(input));
  }
});

test("large input is fast", () => {
  const big = "Café & Crème $1,000 🚀 ".repeat(50_000); // ~1.1 MB
  const t = performance.now();
  const out = fastslug(big);
  assert.ok(out.startsWith("cafe-and-creme-dollar-1000-cafe"));
  assert.ok(performance.now() - t < 2000);
});
