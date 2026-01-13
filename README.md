# HackerNews Modern Client

A modern, fast, and professional Hacker News client built with vanilla JavaScript with the support of **opencode**. This project focuses on performance and clean architecture using native web technologies.

[**Site**](https://domresc.github.io/hnkit)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

### UI and UX

- Clean interface with smooth animations
- Dark and Light theme support with system detection
- Fully responsive design for mobile, tablet, and desktop
- Accessibility compliant with ARIA support and keyboard navigation

### Performance

- Fast loading via native ES modules
- Efficient API response caching
- Performant infinite scrolling using Intersection Observer
- Progressive Web App (PWA) support for offline capabilities

### Functionality

- Real-time story filtering
- Access to multiple feeds (Top, New, Best, Ask, Show, and Jobs)
- Threaded comments with modal view
- Keyboard shortcuts for power users

## Technical Architecture

- **Vanilla JavaScript**: Built without heavy frameworks to ensure maximum performance and minimal bundle size.
- **ES6 Modules**: Modular codebase for better maintainability.
- **State Management**: Centralized state handling with persistence in localStorage.
- **Security**: Content sanitization using DOMPurify via CDN.
- **No Build Step**: Leverages modern browser capabilities, requiring no compilation.

## Project Structure

```
.
├── index.html              # Entry point
├── manifest.json           # PWA configuration
├── sw.js                   # Service Worker for offline support
├── simple-api.js           # API interaction layer
├── simple-app.js           # Main application logic
├── package.json            # Project metadata and development scripts
├── .eslintrc.json          # Linting configuration
├── src/
│   └── css/
│       ├── variables.css   # Theme variables
│       ├── base.css        # Global styles
│       ├── components.css  # UI components
│       └── animations.css  # Animation definitions
└── assets/                 # Static assets and icons
```

## Getting Started

### Local Development

To run the project locally, it is recommended to use a local server to properly handle ES modules and Service Workers.

```bash
# Install development dependencies
npm install

# Start the development server
npm start
```

## License

This project is licensed under the MIT License.

## Acknowledgments

- Hacker News API for the data source.
- DOMPurify for security.
- opencode for development support.
