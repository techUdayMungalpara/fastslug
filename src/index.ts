export interface FastslugOptions {
  /** String placed between words. Default: `"-"`. */
  separator?: string;
  /** Lowercase the result. Default: `true`. */
  lowercase?: boolean;
  /** Maximum length. Cuts at a word boundary when possible. Default: `0` (no limit). */
  maxLength?: number;
  /** Spell out symbols and currency signs (`&` → `and`, `$` → `dollar`). Default: `true`. */
  symbols?: boolean;
  /** Remove leading and trailing separators. Set `false` for live previews while typing. Default: `true`. */
  trim?: boolean;
  /** Characters to delete before slugging, e.g. `/[.]/g` turns `"Next.js"` into `"nextjs"`. */
  remove?: RegExp;
  /** Custom replacements applied first, each becoming its own word, e.g. `{ "C#": "csharp", "♥": "love" }`. */
  replace?: Record<string, string>;
  /** Extra characters to keep in the output, e.g. `"."` keeps `"report.pdf"`. */
  preserve?: string;
}

const SYMBOLS: Record<string, string> = {
  "&": "and",
  "@": "at",
  "%": "percent",
  "+": "plus",
  "♥": "love",
  "❤": "love",
  "∞": "infinity",
  "∑": "sum",
  "∆": "delta",
  $: "dollar",
  "¢": "cent",
  "¤": "currency",
  "€": "euro",
  "£": "pound",
  "¥": "yen",
  "₹": "rupee",
  "₨": "rupee",
  "₩": "won",
  "₽": "ruble",
  "₺": "lira",
  "₤": "lira",
  "₱": "peso",
  "₪": "shekel",
  "₫": "dong",
  "₦": "naira",
  "฿": "baht",
  "₴": "hryvnia",
  "₿": "bitcoin",
  "₠": "ecu",
  "₢": "cruzeiro",
  "₣": "franc",
  "₥": "mill",
  "₧": "peseta",
  "₭": "kip",
  "₮": "tugrik",
  "₯": "drachma",
  "₰": "penny",
  "₲": "guarani",
  "₳": "austral",
  "₵": "cedi",
  "₸": "tenge",
  "₼": "manat",
  "₾": "lari",
  "﷼": "rial",
};

// Letters that Unicode normalization does not decompose into ASCII.
const LETTERS: Record<string, string> = {
  ß: "ss",
  ẞ: "SS",
  æ: "ae",
  Æ: "AE",
  œ: "oe",
  Œ: "OE",
  ø: "o",
  Ø: "O",
  đ: "d",
  Đ: "D",
  ł: "l",
  Ł: "L",
  þ: "th",
  Þ: "TH",
  ð: "d",
  Ð: "D",
  ı: "i",
  ħ: "h",
  Ħ: "H",
  ŧ: "t",
  Ŧ: "T",
  ŋ: "n",
  Ŋ: "N",
  ĸ: "k",
  ƒ: "f",
  ə: "e",
  Ə: "E",
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
  "#x27": "'",
};

const escape = (s: string) => s.replace(/[\\^$.*+?()[\]{}|/-]/g, "\\$&");
const charClass = (map: Record<string, string>) => new RegExp(`[${escape(Object.keys(map).join(""))}]`, "gu");

const SYMBOL_RE = charClass(SYMBOLS);
const LETTER_RE = charClass(LETTERS);
const NON_ASCII_RE = /[^\x00-\x7F]/;
const INVISIBLE_RE = /\p{Cf}/gu;
const DROP_RE = /[™®©℠]/g;
const MARK_RE = /\p{M}/gu;
const ENTITY_RE = /&(amp|lt|gt|quot|apos|nbsp|#39|#x27);/g;
const SHARP_RE = /(^|[^a-zA-Z0-9])([a-zA-Z])#(?![a-zA-Z0-9])/g;
const APOSTROPHE_RE = /['’ʼ`]/g;
const THOUSANDS_RE = /(\d),(?=\d{3}(?!\d))/g;
const WORD_RE = /[a-zA-Z0-9]+/g;

const wordPatterns = new Map<string, RegExp>();
const replacePatterns = new WeakMap<Record<string, string>, { sig: string; re: RegExp }>();

function wordPattern(preserve: string): RegExp {
  let re = wordPatterns.get(preserve);
  if (!re) {
    re = new RegExp(`[a-zA-Z0-9${escape(preserve)}]+`, "g");
    wordPatterns.set(preserve, re);
  }
  return re;
}

// A preserved character touching punctuation (no whitespace between) stays attached
// to its neighbor: "(Final).PDF" → "final.pdf", not "final-.pdf".
function preservedWords(s: string, preserve: string): string[] | null {
  const words: string[] = [];
  let prevEnd = -1;
  for (const m of s.matchAll(wordPattern(preserve))) {
    const word = m[0];
    const prev = words[words.length - 1];
    const tight = prev !== undefined && !/\s/.test(s.slice(prevEnd, m.index));
    if (tight && (preserve.includes(word[0]!) || preserve.includes(prev[prev.length - 1]!))) {
      words[words.length - 1] = prev + word;
    } else {
      words.push(word);
    }
    prevEnd = m.index + word.length;
  }
  return words.length ? words : null;
}

function replacePattern(map: Record<string, string>): RegExp {
  const keys = Object.keys(map).filter(Boolean);
  const sig = keys.join("\0");
  const cached = replacePatterns.get(map);
  if (cached?.sig === sig) return cached.re;
  keys.sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map(escape).join("|") || "(?!)", "g");
  replacePatterns.set(map, { sig, re });
  return re;
}

/**
 * Convert a string into a URL-safe slug. English text, symbols, and currency signs.
 * Output contains only `a-z`, `0-9`, and the separator. Emoji and other characters are dropped.
 * Pass a string as the second argument as a shorthand for `{ separator }`.
 *
 * @example
 * fastslug("Hello World!")                          // "hello-world"
 * fastslug("Café & Crème Brûlée")                   // "cafe-and-creme-brulee"
 * fastslug("Don't pay $1,000")                      // "dont-pay-dollar-1000"
 * fastslug("I ♥ C# 🚀")                             // "i-love-c-sharp"
 * fastslug("Hello World", "_")                      // "hello_world"
 * fastslug("a long title here", { maxLength: 10 })  // "a-long"
 * fastslug("Next.js", { remove: /[.]/g })           // "nextjs"
 * fastslug("report.pdf", { preserve: "." })         // "report.pdf"
 * fastslug("Hello wor", { trim: false })            // "hello-wor"
 * fastslug("Hello ", { trim: false })               // "hello-"
 */
export function fastslug(input: string, options?: FastslugOptions | string | null): string {
  if (typeof input !== "string") {
    throw new TypeError(`fastslug: expected a string, got ${input === null ? "null" : typeof input}`);
  }
  if (typeof options === "string") options = { separator: options };
  else if (options == null) options = {};
  const {
    separator = "-",
    lowercase = true,
    maxLength = 0,
    symbols = true,
    trim = true,
    remove,
    replace,
    preserve = "",
  } = options;

  let s = input;
  if (s.includes("&")) s = s.replace(ENTITY_RE, (_, e: string) => ENTITIES[e]!);
  if (remove) s = s.replace(remove.global ? remove : new RegExp(remove.source, remove.flags + "g"), "");
  if (replace) s = s.replace(replacePattern(replace), (m) => ` ${replace[m] ?? ""} `);

  const keep = (c: string) => preserve.includes(c);
  const spell = (text: string) => {
    if (text.includes("#") && !keep("#")) text = text.replace(SHARP_RE, "$1$2 sharp");
    return text.replace(SYMBOL_RE, (c) => (keep(c) ? c : ` ${SYMBOLS[c]} `));
  };
  // Symbols go before normalization, which would turn "₨" into "Rs".
  if (symbols) s = spell(s);
  // Plain ASCII input skips the Unicode work.
  if (NON_ASCII_RE.test(s)) {
    s = s
      .replace(INVISIBLE_RE, "")
      .replace(DROP_RE, " ")
      .normalize("NFKD")
      .replace(MARK_RE, "")
      .replace(LETTER_RE, (c) => LETTERS[c]!);
    // Normalization can reveal new symbols, e.g. fullwidth "＄" → "$".
    if (symbols) s = spell(s);
  }
  s = s.replace(APOSTROPHE_RE, (c) => (keep(c) ? c : "")).replace(THOUSANDS_RE, "$1");
  if (lowercase) s = s.toLowerCase();

  const words = preserve ? preservedWords(s, preserve) : s.match(WORD_RE);
  if (!words) return "";

  let out = "";
  let cut = false;
  if (maxLength > 0) {
    for (const word of words) {
      const next = out ? out + separator + word : word;
      if (next.length > maxLength) {
        out ||= word.slice(0, maxLength);
        cut = true;
        break;
      }
      out = next;
    }
  } else {
    out = words.join(separator);
  }

  if (!trim) {
    const fits = () => maxLength <= 0 || out.length + separator.length <= maxLength;
    if (!s.startsWith(words[0]!) && fits()) out = separator + out;
    if (!cut && !s.endsWith(words[words.length - 1]!) && fits()) out += separator;
  }
  return out;
}

export default fastslug;
