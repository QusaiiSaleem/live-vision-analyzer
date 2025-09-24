# Live Vision Analyzer

A cross-platform desktop application that uses local AI models to analyze live camera feed and provide real-time descriptions. Built with Tauri, React, and embedded Ollama for completely offline operation.

## Features

- **Real-time Camera Analysis**: Captures and analyzes video frames at configurable intervals
- **Fully Offline**: Bundles Ollama and AI models within the app - no internet required
- **Privacy-First**: All processing happens locally on your machine
- **Cross-Platform**: Works on macOS and Windows
- **Lightweight**: ~20MB app size thanks to Tauri (vs 200MB+ with Electron)
- **Embedded AI**: Downloads and manages Ollama + vision models automatically

## System Requirements

- **macOS**: 10.15+ (Intel or Apple Silicon)
- **Windows**: Windows 10/11 64-bit
- **RAM**: Minimum 8GB (16GB recommended for smooth operation)
- **Storage**: ~4GB for the AI model
- **Camera**: Built-in or external webcam

## Development Setup

### Prerequisites

1. **Install Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Install Node.js** (v18 or later):
   - Download from [nodejs.org](https://nodejs.org/)

3. **Install Tauri CLI**:
   ```bash
   npm install -g @tauri-apps/cli
   ```

### Build Instructions

1. **Clone and install dependencies**:
   ```bash
   cd /Users/qusaiabushanap/dev/new/live-vision-analyzer
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run tauri dev
   ```

   Note: On first run, the app will:
   - Download Ollama binary (~50MB)
   - Download the vision model (~4GB)
   - This happens only once and is stored in the app data directory

3. **Build for production**:

   **macOS**:
   ```bash
   npm run tauri build
   ```
   Output: `src-tauri/target/release/bundle/dmg/Live Vision Analyzer_*.dmg`

   **Windows** (from Windows machine):
   ```bash
   npm run tauri build
   ```
   Output: `src-tauri/target/release/bundle/msi/Live Vision Analyzer_*.msi`

## Usage

1. **Launch the app** - Double-click the built application

2. **Wait for initialization** - The app will:
   - Start the embedded Ollama server
   - Download the vision model (first run only)
   - Show "Ready!" when complete

3. **Enable Camera** - Click "Enable Camera" button

4. **Start Analysis** - Click "Start Analysis" to begin real-time descriptions

5. **Adjust Settings**:
   - Use the slider to change analysis frequency (1-10 seconds)
   - Monitor system status in the status panel

## How It Works

1. **Embedded Ollama**: The app bundles Ollama server and starts it automatically
2. **Camera Capture**: Uses WebRTC API to access camera through the browser engine
3. **Frame Processing**: Captures frames at specified intervals
4. **AI Analysis**: Sends frames to local Ollama instance with LLaVA vision model
5. **Real-time Display**: Shows AI-generated descriptions in the UI

## Project Structure

```
live-vision-analyzer/
├── src/                    # React frontend
│   ├── App.tsx            # Main application component
│   └── index.css          # Tailwind CSS styles
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── lib.rs         # Main Tauri application
│   │   └── ollama_manager.rs  # Ollama server management
│   └── Cargo.toml         # Rust dependencies
├── package.json           # Node dependencies
└── README.md             # This file
```

## Distribution

When distributing the app:

1. The app is self-contained - users don't need to install anything else
2. First launch will download the AI model (~4GB)
3. All data is stored in the user's app data directory
4. The app runs completely offline after initial setup

## Troubleshooting

### Camera not working
- Check browser permissions for camera access
- On macOS: System Preferences → Security & Privacy → Camera
- On Windows: Settings → Privacy → Camera

### Model download fails
- Check internet connection for first-time setup
- Check available disk space (need ~4GB)
- Try restarting the app

### Slow performance
- Ensure you have at least 8GB RAM
- Close other heavy applications
- Adjust analysis interval to reduce frequency

## Privacy & Security

- **No data leaves your device** - All processing is local
- **No internet required** after initial model download
- **No telemetry or tracking**
- **Camera access** only when explicitly enabled
- **Model stored locally** in app data directory

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub.