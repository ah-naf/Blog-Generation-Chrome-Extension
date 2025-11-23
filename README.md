# AI Content Generator - Chrome Extension

A Chrome extension that transforms course content, YouTube videos, and blogs into AI-generated articles using multi-model AI capabilities with advanced agent patterns.

## Features

- 📚 Extract content from multiple sources (YouTube, Udemy, Coursera, Medium, Dev.to, Hashnode)
- ✨ AI-powered blog generation with customizable prompts
- 💬 Chat-based content refinement
- 🔄 Multi-model AI support (OpenAI, Anthropic, Google, Local)
- 📊 Agent-based workflow patterns
- 🎨 Modern UI with Tailwind CSS
- 🌙 Dark mode support

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite + @crxjs/vite-plugin
- **Styling**: Tailwind CSS v3
- **Code Quality**: ESLint + Prettier
- **Extension API**: Chrome Manifest V3

## Project Structure

```
chrome-extension/
├── src/
│   ├── background/       # Service worker
│   ├── content/          # Content scripts
│   ├── popup/            # Extension popup UI
│   ├── sidepanel/        # Main side panel UI
│   ├── options/          # Settings page
│   └── shared/           # Utilities, types, components
│       ├── types/
│       ├── utils/
│       ├── components/
│       └── styles/
├── public/
│   └── icons/            # Extension icons
├── manifest.json         # Chrome extension manifest
└── package.json          # Dependencies
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Chrome browser

### Installation

1. Clone the repository:
```bash
cd chrome-extension
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist` folder from your project directory

## Development

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

### Development Workflow

1. Make changes to source files in `src/`
2. Vite will automatically rebuild the extension
3. Reload the extension in Chrome to see changes

## Implementation Status

### ✅ BLOG-001: Project Setup & Infrastructure (COMPLETED)
- Modern Chrome extension architecture (Manifest V3)
- Build pipeline with Vite and HMR
- TypeScript with strict mode
- Tailwind CSS configured
- ESLint + Prettier setup
- Complete folder structure
- Basic routing between popup/sidepanel/options

### 🔜 Upcoming Features
- BLOG-002: Multi-Source Content Extraction
- BLOG-003: Context Management System
- BLOG-004: Multi-Model AI Service Layer
- BLOG-005: Deep Agent Pattern Engine
- And more... (See [DEVELOPMENT-PLAN.md](.claude/DEVELOPMENT-PLAN.md))

## Contributing

This project follows a structured development plan with 20 tickets across 7 phases. See [.claude/DEVELOPMENT-PLAN.md](.claude/DEVELOPMENT-PLAN.md) for the complete roadmap.

## License

MIT
