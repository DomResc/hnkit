# HNKit

HNKit is a static web app that blends Hacker News and DEV.to into a single, elegant feed. It is designed for GitHub Pages and focuses on premium typography, refined themes, and smooth infinite scrolling. It is also a vibe coding experiment.

Live site: https://domresc.github.io/hnkit

## Features

- Unified feed combining Hacker News and DEV.to
- Trend-based ranking that balances freshness and engagement
- Infinite scroll with graceful loading states
- Three themes: dark (default), light, and OLED
- Responsive layout with polished cards and micro-interactions

## Tech Stack

- HTML, CSS, JavaScript (no build step)
- Public APIs: Hacker News (Firebase), DEV.to

## Getting Started

Open index.html with a static server (recommended) so fetch requests work correctly. For example, use the Live Server extension in VS Code.

## Deploy to GitHub Pages

1. Push the repository to GitHub.
2. In repository settings, enable GitHub Pages for the root folder on the default branch.
3. Visit the published URL to view the app.

## Notes

- DEV.to has rate limits; if the feed looks empty, wait a moment and refresh.
- Data is fetched live on every session.

## License

MIT
