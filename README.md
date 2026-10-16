# Thinking Sparks

A swipeable deck of short, research-backed ideas for listening, disagreeing, giving feedback and spotting biases, with a quiz mode.

Live at https://dvplus.github.io/thinking-sparks/

## Structure

| File | What it holds |
| --- | --- |
| `index.html` | Page markup |
| `css/styles.css` | All styles |
| `js/content.js` | Content: topics (`CATS`) and sparks (`sparks`). Edit this to add or change sparks. |
| `js/app.js` | Behavior: feed, drawing, quiz |
| `manifest.webmanifest`, `icons/` | Home Screen name ("Sparks") and app icons, drawn in the same pen style as the in-app illustration |

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Agent skill

`.claude/skills/make-interfaces-feel-better/` is [Make Interfaces Feel Better](https://github.com/jakubkrehel/make-interfaces-feel-better) by Jakub Krehel (MIT), copied unmodified from commit `35545ea`. Claude Code picks it up automatically when working in this folder.

## Analytics

Anonymous, cookieless stats with [Umami Cloud](https://umami.is) (only counted on `dvplus.github.io`, not locally). Events: `spark-view`, `sparks-seen`, `topic-filter`, `examples-open`, `quiz-start`, `quiz-finish` (with `early` when ended before the last question), `missed-spark-open`, `end-card`, `about-open`, `link-click`, `home-screen-launch`. Tracking lives in `track()` in `js/app.js`.

## Deploy

Published with GitHub Pages from the `main` branch root.

When you change CSS or JS, bump the `?v=` number on the links in `index.html` so browsers don't mix cached old files with new ones.

## Credits

Made by Diogo Valério · [diogovalerio.com](https://diogovalerio.com/) · [LinkedIn](https://www.linkedin.com/in/diogovalerio/) · [Instagram](https://www.instagram.com/dvplus/)

Inspired by the illustrations of [Gaia Alari](https://www.instagram.com/gaiaesthermaria/). Built with a little help from Claude.

Each spark credits the research it's based on.
