import {write} from './lib.mjs';
write('Conversion Notes.md',`# Conversion Notes

How these files were made from \`Daggerheart SRD.pdf\`, what was fixed by hand, and where the SRD itself is odd. Read this before treating any file as a character-sheet data source.

## Method

- Text was pulled from the PDF text layer with pdf.js, then columns were re-flowed into reading order. Each file starts with a \`> Source: Daggerheart SRD 2.0, p. N\` line so a page can be checked against the PDF.
- Wording is the SRD's. Layout, bullets, and headings were rebuilt; bold and italic emphasis from the PDF was not carried over (except field labels in adversary and environment stat blocks).
- The PDF's own table of contents and page footers are not reproduced; [SRD Index.md](SRD Index.md) replaces the contents page.
- Domain cards are grouped by the domain named on each card (the appendix headings sit mid-column, so grouping by heading would misfile cards). Result: 10 domains × 21 cards = 210, levels 1–10, two cards at each level except level 1 (three).

## Data the PDF text layer loses, and how it was recovered

- **Numbers drawn with a special font.** The tier number in every adversary/environment header ("Tier 1 Solo") and the number in Horde and Minion types ("Horde (4/HP)") are stored as private-use glyphs that ordinary text extraction drops. They were mapped back to digits (E541–E549 = 1–9, E53F = 0) and cross-checked against the tier section each stat block sits in.
- **Page 102 (Harpy, Harrier, Jagged Knife Bandit/Hexer/Kneebreaker/Lackey) had its whole font unmapped**, so digits and punctuation were unrecoverable from text. These six stat blocks were transcribed by eye from the rendered page. Worth a second look if any of their numbers look wrong.
- A few punctuation glyphs in the environment pages (hyphens, commas) had the same problem and were mapped.

## Tables rebuilt from page geometry (row counts verified)

Weapons (primary and secondary, tiers 1–4), armor (tiers 1–4), combat wheelchair, items (60 core + 60 expansion), consumables (60 core + 60 expansion), GM difficulty benchmarks, the Fear-by-scene table, adversary stat-block benchmarks, and the Everyday Hero, Western and Monster Hunting equipment tables. Rows are matched to columns by position on the page, not by text order.

## Tables re-typed from a page image

- Feasts (pp. 193–194): the two ingredient tables, the two d20 tables, the special ingredients table, the two small guides.
- Tech-Based Campaigns (p. 196): the Scrap table and Parts Reward table. In the Scrap table, some cells span several result columns in the PDF (for example "Aluminum" spans 1–2). Those ranges are read from the cell widths, so treat them as an interpretation.

## Oddities in the SRD itself (left as written unless noted)

- The class-to-domain list on p. 8 spells "Assassion". Corrected to "Assassin" in [Domains.md](Domains/Domains.md).
- Character Creation Step 2 lists Earthkin, Emberkin, Skykin and Tidekin as separate ancestries; the Ancestries section groups them under "Elemental Kin". Here: an [Elemental Kin](Ancestries/Elemental Kin.md) overview plus four separate files.
- The SRD says the Core Set has 9 classes and 9 domains; this SRD text has 13 classes and 10 domains (Assassin, Brawler, Warlock, Witch, and the Dread domain are in the SRD but not the Core Set).
- Feasts, "Hit Points to Ingredients Guide": rows are 1–4, 5–7, 8–10, then 12+. An 11-HP creature is not covered.
- Feasts, Recording the Recipe: "The dish's name name, description…" (duplicated word in the SRD).
- Tech-Based Campaigns Parts Reward table: "2 Shard, 2 Metals, 1 Component" (singular "Shard").
- The adversary list on p. 96 says "Outer Realms Corruptor"; the stat block says "Outer Realms Corrupter". File uses the stat block spelling.
- Domain card and feature names use straight/curly apostrophes and hyphens inconsistently in the PDF; normalized where obvious.

## Known imperfections (minor)

- Where the PDF lays a bulleted list beside a paragraph in two columns (for example the Colossus stat block lists in [Colossal Adversaries](Supplemental Campaign Mechanics/Colossal Adversaries.md)), two blocks may run together in one paragraph.
- Heading levels are approximate: every all-caps line in the PDF became a heading, whatever its size.
- Numbered lists in a few places keep the number as text at the start of a paragraph rather than as a Markdown list.
- Only these pages were checked against the page image: 101, 102, 193, 194, 196. Everything else was checked by automated counts (cards per domain, class sections present, table row counts, no broken links, no leftover glyph placeholders), not read line by line.
`);
