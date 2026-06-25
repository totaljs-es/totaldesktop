# TotalCampus — language packs

TotalCampus ships in **English**, and you can translate the whole experience — both
the **interface** and the **course content** — by importing a single JSON file.

## Files

- **`template.json`** — the English base, ready to translate. It contains:
  - `code` — your language code (e.g. `es`, `fr`, `pt-BR`).
  - `name` — the display name shown in the language menu (e.g. `Español`).
  - `ui` — every interface string, keyed.
  - `tracks` — the full course content (modules and lessons) to translate.

## How to translate

1. Copy `template.json` to e.g. `es.json`.
2. Set `"code": "es"` and `"name": "Español"`.
3. Translate the **values** in `ui` (keep the keys) and the text inside `tracks`
   (titles, summaries, `theory`, challenge prompts/hints). Leave field **keys**,
   code samples and lesson **ids** unchanged.
4. In TotalCampus, open **Language → Import language pack…** and pick your file.

You can also export a fresh template from inside the app: **Language → Export template**.

> Tip: you don't have to translate everything at once — any key you leave out
> falls back to English.

Contributions welcome. 🌍
