# Changelog

## 1.0.0

First release.

- `fastslug(input, options?)`: English text, accents, symbols, and 35 currency signs to URL-safe slugs
- Options: `separator`, `lowercase`, `maxLength`, `symbols`, `trim`, `remove`, `replace`, `preserve`
- String shorthand for the separator: `fastslug(input, "_")`
- Decodes common HTML entities, removes invisible characters, normalizes styled Unicode text, drops emoji
- ESM-only, zero dependencies, TypeScript types included
