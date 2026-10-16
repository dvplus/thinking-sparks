# CLAUDE.md

Thinking Sparks is a static site (plain HTML, CSS and JS, with no build step) deployed by GitHub Pages from the root of `main`: https://dvplus.github.io/thinking-sparks/. Pushing to `main` publishes it. The README covers the files, the analytics events and the credits.

## How we work

- **Show changes before publishing.** Serve the folder locally (`python3 -m http.server 8765 --bind 127.0.0.1`), check it at phone width (402×874 for iPhone 17, 375 and 320 for small phones), and get the owner's OK before pushing. If they're on another device over Remote Control, send screenshots, because they can't open localhost.
- **Ask for feedback before building** when the owner asks for it ("feedback before changes"). Give a recommendation, not a menu.
- **Content is the owner's voice.** Draft new sparks or examples in a review file first, then add them to `js/content.js` only after approval. Use curly quotes and apostrophes (“ ” ’) in rendered text.
- **After each deploy, check the live site.** Wait for the Pages build (`gh api repos/dvplus/thinking-sparks/pages/builds`), then load the page and confirm the new `?v=` files return 200.

## Rules that aren't obvious from the code

- **Bump `?v=N` on all three asset links in `index.html` whenever CSS or JS changes.** Pages caches files for 10 minutes. A stale `index.html` paired with a fresh `app.js` once blanked the whole page. `app.js` also guards optional markup (`if (aboutEl)`) for the same reason.
- **Type scale:** every `font-size` uses a `--text-*` role defined in `:root` in `css/styles.css` (caption, label, ui, body, lead, question, title, display, score). Don't add one-off sizes. The `"opsz" 144` on the big titles is deliberate.
- **Baseline alignment:** the idea's last line (`.source`) shares a baseline with the example card's last line. This depends on `.hscroll .page:first-child { padding-bottom: 24.8px }`, which was measured for body text at 16px/1.5 inside a card with 22px bottom padding. If those change, re-measure: card text baseline above card edge, minus source baseline above its box.
- **The swipe area (`.hscroll`)** has `overflow-y: hidden`, so it only swipes sideways, plus 6px of bottom padding so card borders aren't clipped. The pager's 12px top padding makes up for that padding, keeping the dots 18px below the card.
- **Menu:** Discover · Topics · Quiz. Topics swaps the bar for a scrolling chip row with ✕, and ✕ clears the filter. Highlight pills are positioned from `getBoundingClientRect`, not `offsetLeft`, because the groups animate. The main group's return animation is opacity-only for the same reason.
- **Intro:** the full intro shows on a first visit, and later visits get a brief title only. This is stored in `localStorage` key `ts-intro`. `spark5` stores the last spark position.
- **Analytics:** Umami Cloud, cookieless, website ID `76c79edc-e9f0-48e6-a8e2-d1383f0cc581`. It only counts on `dvplus.github.io` (via `data-domains`). Send events through `track()` in `app.js`, which queues them until Umami loads, and list any new event in the README.
- **Skills:** `.claude/skills/make-interfaces-feel-better` (project) and `better-typography` (installed in `~/.claude/skills`). Both are Jakub Krehel's, MIT licensed, and copied unmodified.

## Ideas parked for later

- An anonymous, country-level quiz scoreboard. GitHub Pages is static, so it needs a free serverless store, and the privacy note in the credits would need updating.
