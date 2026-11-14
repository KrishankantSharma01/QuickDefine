# 📖 QuickDefine — Instant Dictionary Extension

A lightweight browser extension that shows dictionary definitions instantly when you select any word on a webpage. Works on **Chrome**, **Brave**, **Edge**, and all Chromium-based browsers.

![QuickDefine Demo](icons/icon128.png)

## ✨ Features

- **Select-to-Define** — Highlight any word and get its meaning in a clean popup
- **Pronunciation** — Listen to audio pronunciation (when available)
- **Rich Definitions** — See part of speech, multiple definitions, examples, synonyms & antonyms
- **Dark Mode** — Automatically matches your system theme
- **Popup Search** — Click the extension icon to manually look up any word
- **Lightweight** — No background processes, no tracking, no ads
- **Works Offline-First** — Uses the free [Dictionary API](https://dictionaryapi.dev/)

## 🚀 Installation

### Manual Install (Developer Mode)

1. **Download/Clone** this folder to your computer
2. Open your browser and go to:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`
3. Enable **Developer Mode** (toggle in the top-right corner)
4. Click **"Load unpacked"**
5. Select this `Dictionary extention` folder
6. ✅ The extension is now active!

## 📝 How to Use

### On any webpage:
1. **Select/highlight** any English word by double-clicking or dragging
2. A popup appears with the word's definition
3. Click 🔊 to hear pronunciation
4. Press **Esc** or click **✕** to dismiss

### From the extension icon:
1. Click the **QuickDefine** icon in your toolbar
2. Type any word in the search box
3. Press **Enter** or click **Look Up**

## 🛠 Tech Stack

- **Manifest V3** — Latest Chrome extension standard
- **Free Dictionary API** — [dictionaryapi.dev](https://dictionaryapi.dev/)
- **Zero dependencies** — Pure HTML, CSS, and JavaScript

## 📁 Project Structure

```
Dictionary extention/
├── manifest.json     # Extension configuration
├── content.js        # Content script (selection detection + popup)
├── styles.css        # Popup styling (with dark mode)
├── popup.html        # Browser action popup UI
├── popup.js          # Popup search logic
├── icons/
│   ├── icon16.png    # Toolbar icon
│   ├── icon48.png    # Extension page icon
│   └── icon128.png   # Chrome Web Store icon
└── README.md         # This file
```

## 📄 License

MIT — free to use, modify, and distribute.
