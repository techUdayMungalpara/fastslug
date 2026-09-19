import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import fastslug, { fastslug as named } from "../src/index.ts";

const cases: [string, string][] = [
  ["Hello World!", "hello-world"],
  ["  --Hello---World--  ", "hello-world"],
  ["Café & Crème Brûlée", "cafe-and-creme-brulee"],
  ["résumé naïve façade", "resume-naive-facade"],
  ["Straße Æsir Øre œuvre", "strasse-aesir-ore-oeuvre"],
  ["Don't stop, it’s fine", "dont-stop-its-fine"],
  ["Price: $1,000,000", "price-dollar-1000000"],
  ["1,2,3", "1-2-3"],
  ["€5 or £4 or ¥300 or ₹99", "euro-5-or-pound-4-or-yen-300-or-rupee-99"],
  ["₿ to the moon", "bitcoin-to-the-moon"],
  ["50% off + free shipping", "50-percent-off-plus-free-shipping"],
  ["me@example.com", "me-at-example-com"],
  ["Ship it 🚀🔥", "ship-it"],
  ["👨‍👩‍👧 family", "family"],
  ["Next.js 15 / React 19", "next-js-15-react-19"],
  ["Acme™ Widget® ©2026", "acme-widget-2026"],
  ["½ price", "1-2-price"],
  ["hy\u00ADphen zero\u200Bwidth \uFEFFbom", "hyphen zerowidth bom".replace(/ /g, "-")],
  ["Tom &amp; Jerry &lt;3 &quot;hi&quot; it&#39;s", "tom-and-jerry-3-hi-its"],
  ["C++ vs C# vs F#", "c-plus-plus-vs-c-sharp-vs-f-sharp"],
  ["C# major", "c-sharp-major"],
  ["#1 Best Seller, issue#5", "1-best-seller-issue-5"],
  ["Işık İstanbul GROẞE ħŧŋ", "isik-istanbul-grosse-htn"],
  ["𝐁𝐨𝐥𝐝 𝕱𝖗𝖆𝖐𝖙𝖚𝖗 ＦＵＬＬ", "bold-fraktur-full"],
  ["m² and x³", "m2-and-x3"],
  ["2026-09-19T10:30:00Z", "2026-09-19t10-30-00z"],
  ["Привет мир", ""],
  ["", ""],
  ["!!!", ""],
  ["🚀", ""],
];

for (const [input, expected] of cases) {
  test(`${JSON.stringify(input)} → ${JSON.stringify(expected)}`, () => {
    assert.equal(fastslug(input), expected);
  });
}

test("default and named exports are the same", () => {
  assert.equal(fastslug, named);
});

test("separator", () => {
  assert.equal(fastslug("Hello World", { separator: "_" }), "hello_world");
  assert.equal(fastslug("Hello World", { separator: "" }), "helloworld");
});

test("lowercase: false", () => {
  assert.equal(fastslug("Hello World", { lowercase: false }), "Hello-World");
});

test("symbols: false drops symbols", () => {
  assert.equal(fastslug("Tom & Jerry $5", { symbols: false }), "tom-jerry-5");
  assert.equal(fastslug("C# rocks", { symbols: false }), "c-rocks");
});

test("maxLength cuts at word boundary", () => {
  assert.equal(fastslug("a long title here", { maxLength: 10 }), "a-long");
  assert.equal(fastslug("a long title here", { maxLength: 12 }), "a-long-title");
  assert.equal(fastslug("supercalifragilistic", { maxLength: 5 }), "super");
  assert.equal(fastslug("hello", { maxLength: 0 }), "hello");
});

test("throws on non-string", () => {
  // @ts-expect-error testing runtime check
  assert.throws(() => fastslug(null), TypeError);
});

test("has zero runtime dependencies", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.peerDependencies, undefined);
  assert.equal(pkg.optionalDependencies, undefined);
});

test("more symbols and currencies", () => {
  assert.equal(fastslug("I ♥ NY, I ❤️ LA"), "i-love-ny-i-love-la");
  assert.equal(fastslug("∞ loop ∑ ∆"), "infinity-loop-sum-delta");
  assert.equal(fastslug("₨500 ₣10 ₤5 ₸1 ₵2 ₼3 ₾4 ﷼9"), "rupee-500-franc-10-lira-5-tenge-1-cedi-2-manat-3-lari-4-rial-9");
  assert.equal(fastslug("＄５ fullwidth"), "dollar-5-fullwidth");
  assert.equal(fastslug("Home | My Site"), "home-my-site");
  assert.equal(fastslug("Əli ə"), "eli-e");
});

test("string shorthand sets the separator", () => {
  assert.equal(fastslug("Hello World", "_"), "hello_world");
  assert.equal(fastslug("Hello World", ""), "helloworld");
});

test("trim: false keeps edge separators", () => {
  assert.equal(fastslug("Hello ", { trim: false }), "hello-");
  assert.equal(fastslug("  Hello World!  ", { trim: false }), "-hello-world-");
  assert.equal(fastslug("Hello wor", { trim: false }), "hello-wor");
  assert.equal(fastslug("a long title here ", { trim: false, maxLength: 10 }), "a-long");
});

test("remove", () => {
  assert.equal(fastslug("Next.js & Vue.js", { remove: /[.]/g }), "nextjs-and-vuejs");
  assert.equal(fastslug("a.b.c", { remove: /\./ }), "abc");
  assert.equal(fastslug("Hello (World)", { remove: /\(world\)/gi }), "hello");
});

test("replace", () => {
  const opts = { replace: { "C#": "csharp", "C++": "cpp", "&": "n", "☢": "radioactive" } };
  assert.equal(fastslug("C# vs C++", opts), "csharp-vs-cpp");
  assert.equal(fastslug("Rock & Roll ☢", opts), "rock-n-roll-radioactive");
  assert.equal(fastslug("unchanged", { replace: {} }), "unchanged");
});

test("preserve", () => {
  assert.equal(fastslug("My Report.PDF", { preserve: "." }), "my-report.pdf");
  assert.equal(fastslug("v1.2.3 ~ beta_4", { preserve: "._~" }), "v1.2.3-~-beta_4");
  assert.equal(fastslug("Tom & Jerry", { preserve: "&" }), "tom-&-jerry");
  assert.equal(fastslug("it's", { preserve: "'" }), "it's");
});

test("null and undefined options use defaults", () => {
  assert.equal(fastslug("Hello World", null), "hello-world");
  assert.equal(fastslug("Hello World", undefined), "hello-world");
  // @ts-expect-error testing runtime check
  assert.throws(() => fastslug(undefined), /expected a string, got undefined/);
  // @ts-expect-error testing runtime check
  assert.throws(() => fastslug(null), /expected a string, got null/);
});

test("replace picks up changes to the same object", () => {
  const map: Record<string, string> = { a: "x" };
  assert.equal(fastslug("a b", { replace: map }), "x-b");
  map.b = "y";
  assert.equal(fastslug("a b", { replace: map }), "x-y");
});

test("replace prefers the longest key", () => {
  assert.equal(fastslug("C++ and C", { replace: { C: "see", "C++": "cpp" } }), "cpp-and-see");
});

test("trim: false respects maxLength", () => {
  assert.equal(fastslug(" hello ", { trim: false, maxLength: 5 }), "hello");
  assert.equal(fastslug(" hello ", { trim: false, maxLength: 6 }), "-hello");
});

test("preserve keeps file names clean", () => {
  assert.equal(fastslug("Q3 Report (Final).PDF", { preserve: "." }), "q3-report-final.pdf");
  assert.equal(fastslug("photo (1).jpg", { preserve: "." }), "photo-1.jpg");
  assert.equal(fastslug("archive.tar.gz", { preserve: "." }), "archive.tar.gz");
  assert.equal(fastslug("notes - draft.txt", { preserve: "." }), "notes-draft.txt");
  assert.equal(fastslug("café", { preserve: "é" }), "cafe"); // only ASCII characters can be preserved
});

test("option order: remove, then replace, then symbols", () => {
  assert.equal(fastslug("a.b", { remove: /[.]/g, replace: { ab: "X" } }), "x");
  assert.equal(fastslug("x&y", { symbols: false, replace: { "&": "and" } }), "x-and-y");
});
