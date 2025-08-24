# Changelog

All notable changes to the "Enhanced Docx/ODT Viewer" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2025-08-24

### 🐛 Bug Fix - Outline Navigation

### Fixed
- **Duplicate Heading Navigation** - Fixed issue #17 where clicking on outline items with duplicate heading names would always navigate to the first occurrence instead of the correct section
- **Unique Heading IDs** - Enhanced heading ID generation to ensure each heading gets a unique identifier, even when multiple headings have identical text
- **Improved Navigation Accuracy** - Outline navigation now correctly jumps to the intended section when multiple subsections share the same name under different parent sections

### Technical
- Refactored `generateHeadingId` function to include heading index for uniqueness
- Created combined `processDocumentHtmlAndExtractOutline` function to ensure HTML processing and outline extraction use consistent ID generation
- Enhanced heading ID algorithm to prevent conflicts in documents with repeated section names

---

## [1.2.1] - 2025-07-29

### 🎨 Theme Enhancement Update

### Added
- **Theme Toggle Button** - New button in the toolbar (🌙/☀️) to switch between light and dark modes
- **Proper Light Mode** - True white background with black text throughout all panels and document content
- **Enhanced Dark Mode** - Consistent dark background with white text across all interface elements
- **Visual Theme Feedback** - Button icon changes to indicate current mode and next action
- **Theme Persistence** - Theme choice is tracked and maintained across the session
- **VS Code Command Integration** - Added `docxreader.toggleTheme` command for theme switching

### Changed
- **Improved CSS Architecture** - Enhanced theme variables for better consistency
- **Better Color Contrast** - Optimized text and background colors for improved readability
- **Document Background** - Now properly adapts to selected theme (white for light, dark for dark)
- **Search Highlights** - Theme-appropriate colors (yellow on light, orange on dark)

### Fixed
- **Theme Inconsistencies** - Resolved cases where some elements didn't follow the selected theme
- **Document Readability** - Better contrast ratios in both light and dark modes

### Technical
- Added theme state management in `DocumentRenderer` class
- Enhanced message passing between webview and extension for theme changes
- Updated package.json with new theme toggle command and menu item

---

## [1.2.0] - 2025-07-25

### 🎉 Major Update - Complete UI Overhaul

### Added
- **Modern Document Viewer UI** with VS Code theme integration
- **Document Outline Panel** - Navigate through headings with interactive sidebar
- **Search Functionality** - Find text within documents with highlighting and navigation
- **Zoom Controls** - Toolbar buttons and keyboard shortcuts (50% - 300% zoom)
- **Print Support** - Direct printing from the viewer
- **Keyboard Shortcuts** for all major functions:
  - `Ctrl+Plus`/`Cmd+Plus` - Zoom In
  - `Ctrl+Minus`/`Cmd+Minus` - Zoom Out
  - `Ctrl+0`/`Cmd+0` - Reset Zoom
  - `Ctrl+F`/`Cmd+F` - Search in Document
  - `Ctrl+P`/`Cmd+P` - Print Document
  - `Escape` - Close Search Panel
- **Status Bar Integration** - Shows current zoom level
- **Enhanced Configuration Options**:
  - `docxreader.theme` - Theme preference (auto/light/dark)
  - `docxreader.zoomLevel` - Default zoom level (0.5 - 3.0)
  - `docxreader.showOutline` - Show document outline by default
- **Loading States** - Better user feedback during document processing
- **Error Handling** - Graceful error messages with helpful information
- **Responsive Design** - Adapts to different panel sizes
- **Command Palette Commands** for zoom and outline control

### Changed
- **Updated Dependencies** to latest stable versions:
  - TypeScript 5.8.3 (from 4.9.4)
  - ESLint 9.25.1 (from 8.33.0) with flat configuration
  - VS Code API 1.90.0 (from 1.75.0)
  - Node.js 20.x (from 16.x)
  - Mammoth 1.8.0 (replacing mammoth-math 0.0.2)
- **Improved Document Rendering** with better typography and spacing
- **Enhanced Font Configuration** with better description
- **Modern CSS Architecture** with CSS custom properties for theming
- **Better Performance** with optimized rendering and caching

### Fixed
- **Security Vulnerabilities** - Updated packages to resolve 9 out of 11 security issues
- **Type Safety** - Improved TypeScript configuration and error handling
- **Memory Leaks** - Better cleanup of webview panels and event listeners
- **Theme Compatibility** - Proper support for all VS Code themes

### Removed
- Unused dependencies (`docx-to-html`, `html`)
- Legacy ESLint configuration
- Deprecated type definitions

### Technical Improvements
- **Modern ESLint Configuration** with flat config system
- **Enhanced TypeScript Configuration** for better development experience
- **Improved Build Process** with better error reporting
- **Code Quality** improvements with stricter linting rules
- **Better Documentation** with comprehensive README and inline comments

### UI/UX Enhancements
- **Professional Document Layout** resembling modern document viewers
- **Interactive Elements** with hover states and smooth transitions
- **Accessibility Support** with proper focus management and ARIA labels
- **Print-Optimized CSS** for clean printing output
- **Mobile-Responsive Design** (for future VS Code mobile support)

### Developer Experience
- **Hot Reload Support** during development
- **Better Error Messages** for debugging
- **Comprehensive Type Definitions** for better IntelliSense
- **Modular Architecture** with separated concerns
- **Extension Development Best Practices** implementation

---

## [1.1.3] - Previous Version

### Features
- Basic DOCX file viewing
- Basic ODT file viewing  
- Simple font family configuration
- Custom editor integration

### Known Limitations (Resolved in 1.2.0)
- No zoom controls
- No search functionality
- Basic styling without theme integration
- No document navigation
- Limited error handling
- Security vulnerabilities in dependencies
- Outdated TypeScript and tooling

---

## Migration Guide from 1.1.3 to 1.2.0

### Configuration Changes
Your existing `docxreader.font` setting will continue to work. New optional settings:

```json
{
    "docxreader.font": "Arial",           // Existing setting
    "docxreader.theme": "auto",           // New: Theme preference  
    "docxreader.zoomLevel": 1.0,          // New: Default zoom level
    "docxreader.showOutline": true        // New: Show outline by default
}
```

### New Features Available
- Use the toolbar buttons or keyboard shortcuts for zoom control
- Toggle the outline panel to navigate through document headings
- Use Ctrl+F to search within documents
- Print documents directly from VS Code

### Breaking Changes
- None! All existing functionality is preserved and enhanced.

---

## Upcoming Features (Future Releases)

### 1.3.0 (Planned)
- Export to PDF functionality
- Advanced search with regex support
- Document comparison view
- Table of contents extraction
- Bookmark support

### 1.4.0 (Planned)
- Multiple document tabs
- Collaborative annotations
- Real-time document updates
- Integration with cloud storage services

---

## Support

If you encounter any issues after updating:

1. **Restart VS Code** completely
2. **Check Settings** - Review your configuration in VS Code settings
3. **Clear Cache** - Reload the VS Code window (`Ctrl+Shift+P` → "Developer: Reload Window")
4. **Report Issues** - Create a GitHub issue with your VS Code version and extension version

## Feedback

We'd love to hear your feedback on the new features! Please:
- ⭐ Rate the extension on the VS Code Marketplace
- 🐛 Report bugs on [GitHub Issues](https://github.com/skfrost19/Docx-Viewer/issues)
- 💡 Suggest features through GitHub Discussions
- 📧 Contact the maintainer for questions

---

## Version History Summary

- **v1.2.1** - Theme toggle enhancement with proper light/dark mode support
- **v1.2.0** - Major UI overhaul with modern viewer, search, zoom, and outline features  
- **v1.1.3** - Custom font support
- **v1.1.2** - VS Code font integration
- **v1.1.0** - ODT file support
- **v1.0.0** - Initial DOCX viewer functionality
