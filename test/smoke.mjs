import assert from "node:assert/strict";
import fastslug, { fastslug as named } from "../dist/index.js";
assert.equal(fastslug("Café & Crème $1,000 🚀"), "cafe-and-creme-dollar-1000");
assert.equal(named, fastslug);
console.log("import ok");
