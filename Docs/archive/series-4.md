## Series 4: PDF output
Status: done
Decisions (owner): Letter, 0.5" margins; Source Sans 3 body + Cinzel headings; squares for primary trackers, circles for domain/class/subclass trackers; gold as fill-in circles (10 handfuls, 10 bags, 1 chest; Tech keeps a Credits box); page 1 front, page 2 back (rest + campaign rules), domain cards on their own sheet; class-hope/subclass and class-features columns sized to equal height. Layout record: `Docs/sheet-layout.md`.
1. [x] Sheet layout design (owner approves)
2. [x] `pdf-lib` renderer, fonts, page layout (`src/pdf/`)
3. [x] Layout refinement rounds (owner feedback on sample PDFs)
4. [x] Print checks: automated (`tests/sheet-print.test.ts`) and owner printed samples, looked good
Left over: rules-math pass (its own series, after level-up); markdown tables in campaign rules print as raw text (`long-term-to-do.md`).
