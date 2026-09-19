// Every example in README.md and llms.txt must match real output.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import fastslug from "../src/index.ts";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

// Lines like: fastslug("input", { ...options })  // "expected"
const CALL_RE = /^(?:const \w+(?:: \w+)? = )?(fastslug\(.*\));?\s*\/\/\s*"([^"]*)"/;

// src/index.ts holds the JSDoc examples shown on hover in editors.
for (const file of ["README.md", "llms.txt", "src/index.ts"]) {
  const lines = read(file)
    .split("\n")
    .map((l) => l.replace(/^\s*\* /, ""));

  test(`${file}: code examples`, () => {
    let checked = 0;
    for (const line of lines) {
      const m = CALL_RE.exec(line.trim());
      if (!m) continue;
      const call = m[1]!.replace(/\boptions\b/, '{ maxLength: 60, separator: "_" }');
      const actual = new Function("fastslug", `return ${call}`)(fastslug);
      assert.equal(actual, m[2], `${file}: ${line.trim()}`);
      checked++;
    }
    assert.ok(checked >= 10, `only ${checked} examples found in ${file}`);
  });
}

test("README.md: 'What it does' table", () => {
  const readme = read("README.md");
  const section = readme.slice(readme.indexOf("## What it does"), readme.indexOf("Currency signs (all"));
  const rows = section
    .split("\n")
    .filter((l) => /^\| `/.test(l))
    .map((l) => l.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|")));
  assert.ok(rows.length >= 15);
  for (const [, input, output] of rows) {
    const strip = (c: string) => c.replace(/^`|`.*$/g, "").replace(/ \(.*\)$/, "");
    const inp = input!.match(/^`([^`]*)`/)![1]!;
    assert.equal(fastslug(inp), strip(output!), `row: ${input}`);
  }
});

test("README.md: currency list is complete", () => {
  const line = read("README.md").split("\n").find((l) => l.startsWith("Currency signs (all"))!;
  const signs = line.match(/`([^`]+)`/)![1]!.split(" ");
  const count = Number(line.match(/all (\d+)/)![1]);
  assert.equal(signs.length, count);
  for (const c of signs) assert.notEqual(fastslug(`a${c}b`), "a-b", `${c} is not spelled out`);
});
