# 🚀 HackerNews Modern Client

A modern, fast, and beautiful Hacker News client built with **vanilla JavaScript** - no frameworks, just pure web technologies.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🎨 Modern UI/UX
- **Beautiful Design** - Clean, modern interface with smooth animations
- **Dark/Light Themes** - Automatic theme switching with manual override
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Accessibility** - Full ARIA support and keyboard navigation

### ⚡ Performance
- **Fast Loading** - Optimized with lazy loading and code splitting
- **Smart Caching** - Intelligent API response caching (5 min TTL)
- **Infinite Scroll** - Smooth, performant infinite scrolling
- **PWA Support** - Works offline with service worker caching

### 🔍 Features
- **Real-time Search** - Filter stories as you type
- **Multiple Feeds** - Top, New, Best, Ask, Show, and Jobs
- **Sorting Options** - Sort by score, comments, or time
- **Comments Modal** - Threaded comments with nested replies
- **Share & Bookmark** - Share stories and save favorites
- **Keyboard Shortcuts** - Power user-friendly shortcuts

### 🛠️ Technical Highlights
- **ES6 Modules** - Clean, modular architecture
- **State Management** - Centralized state with localStorage persistence
- **Progressive Enhancement** - Works without JavaScript (basic functionality)
- **No Build Step** - Pure vanilla JS, no compilation needed
- **CSS Variables** - Dynamic theming with CSS custom properties

## 🚀 Quick Start

### Online
Simply open `index.html` in a modern browser. That's it!

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd Test

# Start a local server (recommended)
npm start

# Or use Python
python -m http.server 8080

# Or use PHP
php -S localhost:8080
```

Visit `http://localhost:8080` in your browser.

### GitHub Pages
1. Push to GitHub
2. Go to Settings → Pages
3. Select main branch and root folder
4. Save and visit your URL

## 📁 Project Structure

```
Test/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── package.json            # Project metadata
├── README.md              # This file
├── src/
│   ├── js/
│   │   ├── app.js         # Main application logic
│   │   ├── api.js         # HN API wrapper
│   │   ├── state.js       # State management
│   │   ├── ui.js          # UI management
│   │   ├── utils.js       # Utility functions
│   │   └── comments.js    # Comments handling
│   └── css/
│       ├── variables.css  # CSS custom properties
│       ├── base.css       # Base styles & reset
│       ├── components.css # Component styles
│       └── animations.css # Animation definitions
└── assets/                # (Optional) Images, icons, etc.
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Refresh feed |
| `/` | Focus search |
| `T` | Toggle theme |
| `?` | Show all shortcuts |
| `Esc` | Close modal / Clear focus |

## 🎯 Features Breakdown

### Architecture
- **Modular ES6** - Each module has a single responsibility
- **State Management** - Centralized state with pub/sub pattern
- **API Layer** - Clean separation of API calls with caching
- **UI Layer** - DOM manipulation isolated from business logic

### Performance Optimizations
- **API Caching** - 5-minute cache for API responses
- **Intersection Observer** - Efficient infinite scroll
- **Debouncing** - Search input debounced at 500ms
- **Lazy Loading** - Images and content loaded on demand
- **Service Worker** - Offline support and asset caching

### User Preferences
All preferences are saved to localStorage:
- Theme preference (dark/light)
- Items per page (10/20/30/50)
- Compact mode
- Open links in new tab

### Accessibility
- **ARIA Labels** - All interactive elements labeled
- **Keyboard Navigation** - Full keyboard support
- **Focus Management** - Proper focus trapping in modals
- **Screen Reader Support** - Semantic HTML and ARIA live regions
- **Reduced Motion** - Respects `prefers-reduced-motion`

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## 📱 PWA Features

The app works as a Progressive Web App with:
- **Install Prompt** - Add to home screen
- **Offline Support** - Works without internet (cached content)
- **Background Sync** - Updates content in background (if supported)
- **App Shortcuts** - Quick access to different feeds

## 🎨 Theming

The app supports two themes:
- **Dark Theme** - Default, optimized for low-light
- **Light Theme** - Clean, high-contrast alternative

Theme is automatically detected from system preferences and can be manually toggled.

### Custom Theming
Edit `src/css/variables.css` to customize colors:
```css
:root {
  --color-primary: #ff6600;
  --color-background: #0a0e14;
  /* ... more variables */
}
```

## 🔧 Configuration

### Items Per Page
Change in settings modal or directly in code:
```javascript
// In state.js
itemsPerPage: 20  // 10, 20, 30, or 50
```

### Cache Duration
Modify API cache duration:
```javascript
// In api.js
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

## 🐛 Known Issues

- Service worker may not work on `file://` protocol - use a local server
- Some older browsers may not support ES6 modules
- API rate limiting may occur with excessive requests

## 🚧 Future Enhancements

- [ ] User profiles view
- [ ] Advanced filtering (by domain, score range, etc.)
- [ ] Saved searches
- [ ] Reading progress tracking
- [ ] Custom feeds
- [ ] Comment replies (if HN API supports it)
- [ ] Export bookmarks

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🙏 Acknowledgments

- **Hacker News** - For the excellent API
- **DOMPurify** - For safe HTML sanitization
- **Community** - For feedback and suggestions

## 📞 Support

For issues or questions:
1. Check the [Known Issues](#-known-issues) section
2. Search existing issues on GitHub
3. Create a new issue with detailed information

---

**Made with ❤️ using vanilla JavaScript**

No frameworks. No build tools. Just modern web standards.
