# fastslug

Tiny, zero-dependency slug generator for English text, symbols, and currency signs.

```js
import fastslug from "fastslug";

fastslug("Café & Crème Brûlée");          // "cafe-and-creme-brulee"
fastslug("Don't pay $1,000 for this 🚀");  // "dont-pay-dollar-1000-for-this"
fastslug("50% off — € prices");           // "50-percent-off-euro-prices"
```

- **Zero dependencies**: nothing else gets installed
- **2.8 KB** gzipped, TypeScript types included
- **Predictable**: output only ever contains `a-z`, `0-9`, and the separator
- **ESM-only**: Node ≥ 20, Bun, Deno, browsers, edge runtimes

**Use it for** URL slugs, permalinks, file names, IDs, and handles from English text.
**Not for** non-Latin scripts (Cyrillic, Chinese, Arabic, …): those characters are dropped.

## Install

```sh
npm install fastslug
```

## Usage

**JavaScript**

```js
import fastslug from "fastslug"; // or: import { fastslug } from "fastslug"

fastslug("Hello World!"); // "hello-world"
```

**TypeScript**: types are included, no `@types` package needed.

```ts
import fastslug, { type FastslugOptions } from "fastslug";

const options: FastslugOptions = { maxLength: 60, separator: "_" };
const slug: string = fastslug("Hello World!", options); // "hello_world"
```

### `fastslug(input, options?) → string`

| Option      | Type                     | Default | Description                                                          |
| ----------- | ------------------------ | ------- | -------------------------------------------------------------------- |
| `separator` | `string`                 | `"-"`   | Placed between words.                                                |
| `lowercase` | `boolean`                | `true`  | Lowercase the result.                                                |
| `maxLength` | `number`                 | `0`     | Max length, cut at a word boundary. `0` means no limit.              |
| `symbols`   | `boolean`                | `true`  | Spell out symbols and currency (`&` → `and`). `false` drops them.    |
| `trim`      | `boolean`                | `true`  | Remove separators at the start and end. `false` for live previews.   |
| `remove`    | `RegExp`                 | —       | Characters to delete first, e.g. `/[.]/g`.                           |
| `replace`   | `Record<string, string>` | —       | Your own replacements, applied first. Each becomes its own word.    |
| `preserve`  | `string`                 | `""`    | Extra ASCII characters to keep in the output, e.g. `"."`.           |

Pass a string instead of an options object to set only the separator: `fastslug("Hello World", "_")`.

```js
fastslug("Hello World", "_");                           // "hello_world"
fastslug("Hello World", { lowercase: false });          // "Hello-World"
fastslug("Tom & Jerry $5", { symbols: false });         // "tom-jerry-5"
fastslug("a long title here", { maxLength: 10 });       // "a-long"
fastslug("Next.js & Vue.js", { remove: /[.]/g });       // "nextjs-and-vuejs"
fastslug("C# vs C++", { replace: { "C#": "csharp", "C++": "cpp" } }); // "csharp-vs-cpp"
fastslug("My Report.PDF", { preserve: "." });           // "my-report.pdf"
fastslug("Hello ", { trim: false });                    // "hello-"  (live preview while typing)
```

Options run in this order: HTML entities decoded → `remove` → `replace` → symbols spelled out → accents and Unicode cleaned → words joined with `separator` → `maxLength`.

### Recipes

```js
fastslug("How to Build a REST API in 2026");                       // "how-to-build-a-rest-api-in-2026"
fastslug("Q3 Report (Final).PDF", { preserve: "." });              // "q3-report-final.pdf"
fastslug("John O'Brien", "_");                                     // "john_obrien"
fastslug("A very long article title that goes on and on forever", { maxLength: 30 }); // "a-very-long-article-title-that"
```

For unique slugs (`hello-world-2`), check your own data and append a number: that needs your database, so it is not built in.

### Guarantees

- With default options, output always matches `/^([a-z0-9]+(-[a-z0-9]+)*)?$/`.
- Running it twice changes nothing: `fastslug(fastslug(x)) === fastslug(x)`.
- Pure function: no global state, same input always gives the same output.
- Never exceeds `maxLength`.

### Edge cases

Input with nothing usable left returns an empty string, so add a fallback:

```js
fastslug("🚀🔥");                        // ""
fastslug("!!!");                         // ""
const slug = fastslug(title) || "untitled";
```

Input that is not a string throws a `TypeError`, so a missing value never becomes a slug like `"undefined"`:

```js
fastslug(undefined); // TypeError: fastslug: expected a string, got undefined
fastslug(String(123)); // "123"
```

## What it does

| Input                   | Output                                   | Rule                               |
| ----------------------- | ---------------------------------------- | ---------------------------------- |
| `Hello World!`          | `hello-world`                            | Punctuation and spaces become `-`  |
| `résumé naïve façade`   | `resume-naive-facade`                    | Accents removed                    |
| `Straße Æsir Øre`       | `strasse-aesir-ore`                      | Special Latin letters spelled out  |
| `Don't stop, it's fine` | `dont-stop-its-fine`                     | Apostrophes removed, not split     |
| `$1,000,000`            | `dollar-1000000`                         | Thousands separators removed       |
| `50% off + more`        | `50-percent-off-plus-more`               | `& @ % +` spelled out              |
| `€5 £4 ¥3 ₹2 ₿1`        | `euro-5-pound-4-yen-3-rupee-2-bitcoin-1` | Currency signs spelled out         |
| `C++ vs C# vs F#`       | `c-plus-plus-vs-c-sharp-vs-f-sharp`      | `C#`, `F#` become `c-sharp`, `f-sharp` |
| `Tom &amp; Jerry`       | `tom-and-jerry`                          | Common HTML entities decoded       |
| `𝐁𝐨𝐥𝐝 ＦＵＬＬ m²`         | `bold-full-m2`                           | Fancy, fullwidth, superscript text normalized |
| `hy­phen` (soft hyphen) | `hyphen`                                 | Invisible characters removed       |
| `Next.js 15 / React 19` | `next-js-15-react-19`                    | Dots and slashes split words       |
| `I ♥ NY ∞`              | `i-love-ny-infinity`                     | `♥ ❤ ∞ ∑ ∆` spelled out            |
| `Ship it 🚀🔥`          | `ship-it`                                | Other emoji dropped                |
| `Home \| My Site`       | `home-my-site`                           | `< > \|` and punctuation dropped    |
| `Acme™ Widget®`         | `acme-widget`                            | `™ ® ©` dropped                    |

Currency signs (all 35): `$ ¢ ¤ € £ ¥ ₹ ₨ ₩ ₽ ₺ ₤ ₱ ₪ ₫ ₦ ฿ ₴ ₿ ₠ ₢ ₣ ₥ ₧ ₭ ₮ ₯ ₰ ₲ ₳ ₵ ₸ ₼ ₾ ﷼`, including fullwidth forms like `＄`.

Built for English: characters from non-Latin scripts are dropped.

## License

MIT
