# Clear Thinking Spark

A swipeable deck of short, research-backed ideas for listening, disagreeing, giving feedback and spotting biases, with a quiz mode.

## Structure

| File | What it holds |
| --- | --- |
| `index.html` | Page markup |
| `css/styles.css` | All styles |
| `js/content.js` | Content: topics (`CATS`) and sparks (`sparks`). Edit this to add or change sparks. |
| `js/app.js` | Behavior: feed, drawing, quiz |

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Agent skill

`.claude/skills/make-interfaces-feel-better/` is [Make Interfaces Feel Better](https://github.com/jakubkrehel/make-interfaces-feel-better) by Jakub Krehel (MIT), copied unmodified from commit `35545ea`. Claude Code picks it up automatically when working in this folder.

## Deploy

Published with GitHub Pages from the `main` branch root.

## Credits

Made by Diogo Valério · [diogovalerio.com](https://diogovalerio.com/) · [LinkedIn](https://www.linkedin.com/in/diogovalerio/)

Each spark credits the research it's based on.
