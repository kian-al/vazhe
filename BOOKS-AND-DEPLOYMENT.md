# Library and deployment

## What is in the database

`library_books` is an additive catalog, separate from `dictionary_entries` and `guest_vocab`. Run `npm run books:migrate` and `npm run books:seed` manually for a new environment, never as part of the build. The catalog is already seeded in the current production database. These commands do not change guest vocabulary.

The catalog has 10 books and 285 chapter/unit placeholders. Alice (12 chapters) and The Happy Prince (5 stories) each have up to 30 automatically selected words per chapter. The selection consists of exact word forms in the English text, excluding common stopwords, ranked by within-chapter count and intersected with the database dictionary; it is neither a curated nor an official educational list. Public-domain status was checked for the US; status elsewhere may differ. Sources: https://www.gutenberg.org/ebooks/11 and https://www.gutenberg.org/ebooks/902. No full book texts are redistributed. Dictionary entries retain their source and license metadata.

The 504, 1100 and 4000 series list titles and unit structures only. Their unit word lists are empty, not fabricated. Importing book-specific lists needs an appropriate source and redistribution rights. For example, the 4000 book's rights notice explicitly reserves reproduction and storage: https://staff.tiiame.uz/storage/users/247/books/Jr14wtnp63n2mAxTuvUsFRXCjvMkbvLjpMxFVJF2.pdf.

To regenerate the extraction, prepare `alice.txt`, `prince.txt` from the Gutenberg links and `dictionary-index.json` with `{id,norm}` records from the current dictionary. Then run `python scripts/books/create_catalog.py --inputs /path/to/input --output data/books-catalog.json`. Inspect the result before seeding.

## Deploy configuration

Vercel build uses `npm ci` and `npm run build` (`next build`) only. `npm test` and `npm run typecheck` are manual and are **not** added as CI steps. Run both and perform browser checks before opening a PR. The config disables automated deployments on non-main branches and permits `main`; pushes to main (including merges) deploy when the existing Vercel project is actually connected to this repository. Direct pushes to main also trigger production deployments; this is not a merge-only event filter.

Important: repository connection to the existing Vercel project has to be confirmed separately in Vercel project Git settings. `vercel.json` alone cannot establish the integration or its permissions. Keep production branch as `main`, and configure production `DATABASE_URL` through Vercel's existing Neon integration. Never commit environment files or tokens. Free plan quotas are finite.

The design applied to web home and library is adapted from the supplied redesign. Existing guest/CAS sync and FSRS domain code are retained rather than replaced by the handoff's sample/last-write-wins storage. Native iOS is not included; the attached design's iOS prototype is not a production app.
