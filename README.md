# Enhanced Docx/ODT Viewer for VS Code

![Docx Viewer](assets/icons/icon.png)

![Installs](https://img.shields.io/visual-studio-marketplace/i/ShahilKumar.docxreader)
![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ShahilKumar.docxreader.svg)
![Rating](https://img.shields.io/visual-studio-marketplace/r/ShahilKumar.docxreader.svg)
![LICENSE](https://img.shields.io/github/license/skfrost19/Docx-Viewer.svg)
[![GitHub Release](https://img.shields.io/github/release/skfrost19/Docx-Viewer.svg)](https://github.com/skfrost19/Docx-Viewer/releases)
![Open Issues](https://img.shields.io/github/issues-raw/skfrost19/Docx-Viewer.svg)
![Closed Issues](https://img.shields.io/github/issues-closed-raw/skfrost19/Docx-Viewer.svg)

A modern, feature-rich document viewer for Microsoft Word (.docx) and OpenDocument Text (.odt) files in Visual Studio Code.

## ✨ Features

### 📄 Document Support
- **Microsoft Word Documents (.docx)** - Full support with proper formatting
- **OpenDocument Text (.odt)** - Complete compatibility with LibreOffice/OpenOffice documents

### 🎨 Modern UI & Experience
- **VS Code Theme Integration** - Automatically adapts to your VS Code theme (dark/light/high contrast)
- **Document Outline** - Navigate through headings with an interactive sidebar
- **Search Functionality** - Find text within documents with highlighting
- **Zoom Controls** - Zoom in/out with keyboard shortcuts or toolbar buttons
- **Print Support** - Print documents directly from the viewer

### 🔧 Enhanced Functionality
- **Responsive Design** - Adapts to different panel sizes
- **Keyboard Shortcuts** - Full keyboard navigation support
- **Status Bar Integration** - Shows current zoom level
- **Error Handling** - Graceful error messages and loading states
- **Performance Optimized** - Fast rendering with modern CSS techniques

### ⌨️ Keyboard Shortcuts
- `Ctrl+Plus` / `Cmd+Plus` - Zoom In
- `Ctrl+Minus` / `Cmd+Minus` - Zoom Out  
- `Ctrl+0` / `Cmd+0` - Reset Zoom
- `Ctrl+F` / `Cmd+F` - Search in Document
- `Ctrl+P` / `Cmd+P` - Print Document
- `Escape` - Close Search Panel

### 🛠️ Toolbar Features
- **Zoom Controls** - Precise zoom adjustment (50% to 300%)
- **Outline Toggle** - Show/hide document structure
- **Search** - Quick text search with navigation
- **Print** - Direct printing capability

## 🚀 Installation

1. Install from the VS Code Marketplace
2. Open any `.docx` or `.odt` file
3. The document will automatically open in the enhanced viewer

## ⚙️ Configuration

Access settings via `Ctrl+Shift+P` → "Open Docx Reader Configuration" or go to File → Preferences → Settings and search for "Docx Reader".

### Available Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `docxreader.font` | Font family for document rendering | `Arial` |
| `docxreader.theme` | Theme preference (auto/light/dark) | `auto` |
| `docxreader.zoomLevel` | Default zoom level (0.5 - 3.0) | `1.0` |
| `docxreader.showOutline` | Show document outline by default | `true` |

### Example Configuration
```json
{
    "docxreader.font": "Georgia",
    "docxreader.theme": "auto",
    "docxreader.zoomLevel": 1.2,
    "docxreader.showOutline": true
}
```

## 🎯 Usage

### Opening Documents
1. **Right-click** any `.docx` or `.odt` file → "Open With" → "Docx Reader"
2. **Double-click** the file (if set as default viewer)
3. Use **Command Palette** (`Ctrl+Shift+P`) → "View: Reopen Editor With" → "Docx Reader"

### Navigation
- **Outline Panel**: Click headings to jump to sections
- **Search**: Use toolbar search or `Ctrl+F` to find text
- **Zoom**: Use toolbar buttons or keyboard shortcuts

### Document Structure
The viewer automatically extracts and displays:
- Headings (H1-H6) in the outline
- Formatted text with proper styling  
- Tables with borders and styling
- Images with responsive sizing
- Lists (numbered and bulleted)
- Block quotes and code blocks

## 🛠️ Development

### Building from Source
```bash
# Clone repository
git clone https://github.com/skfrost19/Docx-Viewer.git
cd Docx-Viewer

# Install dependencies  
npm install

# Compile TypeScript
npm run compile

# Run tests
npm test

# Launch development version
code --extensionDevelopmentPath=. --new-window
```

### Technology Stack
- **TypeScript 5.8+** - Modern JavaScript with strong typing
- **VS Code API 1.90+** - Latest VS Code extension capabilities
- **Mammoth.js** - DOCX to HTML conversion
- **ODT2HTML** - ODT file processing
- **Modern CSS** - Responsive design with CSS Grid/Flexbox

## 🐛 Troubleshooting

### Common Issues

**Document not loading:**
- Ensure the file isn't corrupted
- Try opening with another application first
- Check file permissions

**Styling issues:**
- Verify VS Code theme compatibility
- Reset zoom to 100%
- Check font settings in configuration

**Performance problems:**
- Close other heavy extensions
- Reduce zoom level for large documents
- Enable hardware acceleration in VS Code

### Getting Help
1. Check existing [Issues](https://github.com/skfrost19/Docx-Viewer/issues)
2. Create a new issue with:
   - VS Code version
   - Extension version
   - Sample document (if possible)
   - Error messages

## 📝 Changelog

### Version 1.2.0 (Latest)
- ✨ **New**: Modern UI with VS Code theme integration
- ✨ **New**: Document outline with navigation
- ✨ **New**: In-document search functionality
- ✨ **New**: Zoom controls (50% - 300%)
- ✨ **New**: Print support
- ✨ **New**: Keyboard shortcuts
- ✨ **New**: Status bar integration
- 🔧 **Improved**: Error handling and loading states
- 🔧 **Improved**: Performance optimization
- 🔧 **Updated**: Latest dependencies and security fixes
- 🔧 **Updated**: TypeScript 5.8+ and ESLint 9+

### Version 1.1.3 (Previous)
- Basic DOCX and ODT viewing
- Simple font configuration
- Basic VS Code integration

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

### Areas for Contribution
- Additional file format support
- UI/UX improvements  
- Performance optimizations
- Documentation improvements
- Bug fixes and testing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.txt) file for details.

## 🙏 Acknowledgments

- [Mammoth.js](https://github.com/mwilliamson/mammoth.js/) for DOCX conversion
- [ODT2HTML](https://github.com/odt2html/odt2html) for ODT processing
- VS Code team for the excellent extension API
- Contributors and users for feedback and suggestions

---

**Made with ❤️ for the VS Code community**
