# ✅ Minimal ToDo PWA

A minimal, sleek, and powerful ToDo application that works across all platforms.

![Screenshot](https://img.shields.io/badge/PWA-Ready-6366f1?style=for-the-badge)
![Offline](https://img.shields.io/badge/Offline-Supported-22c55e?style=for-the-badge)

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📱 **Cross-Platform** | Works on any device with a browser |
| 📥 **Installable** | Add to home screen like a native app |
| 📴 **Offline Support** | Full functionality without internet |
| 📅 **Date Organization** | Tasks grouped and sorted by date |
| 🔄 **Drag & Drop** | Reorder tasks within date sections |
| 📆 **Move to Date** | Easily reschedule tasks |
| ⏰ **Reminders** | Browser notifications for due tasks |
| 🎨 **Priority Levels** | Low, Medium, High with color coding |
| 🌗 **Dark/Light Mode** | Auto-detects system preference |
| 💾 **Persistent Storage** | Tasks saved locally |
| ↩️ **Undo Delete** | Recover accidentally deleted tasks |

## 🚀 Live Demo

**[https://y-s-21.github.io/todo-app/](https://y-s-21.github.io/todo-app/)**

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | Add new task |
| `Escape` | Close modal |

## 🛠️ Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Y-S-21/todo-app.git
   cd todo-app
   ```

2. Serve with any static server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve
   ```

3. Open `http://localhost:8000` in your browser

## 📁 Project Structure

```
todo-app/
├── index.html          # Main HTML file
├── styles.css          # All styles with theming
├── app.js              # Application logic
├── sw.js               # Service Worker for offline
├── manifest.json       # PWA manifest
├── icons/
│   ├── icon-192.png    # App icon (192x192)
│   └── icon-512.png    # App icon (512x512)
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages deployment
```

## 📄 License

MIT License - feel free to use for any purpose!