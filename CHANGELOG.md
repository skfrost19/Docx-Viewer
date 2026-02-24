# Changelog

All notable changes to the "Enhanced Docx/ODT Viewer" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.2] - 2026-02-24

### 🐛 Bug Fixes - Toolbar & Per-Document State

### Fixed
- **Duplicate Toolbar** - Removed redundant VSCode editor title bar buttons; only the in-webview toolbar is now shown, which contains all controls including reset zoom and toggle toolbar (was missing from the top bar)
- **Toolbar Collapsed by Default** - The toolbar now starts hidden on document open; click the ⚙️ mini-button to expand it
- **Per-Document State** - Each opened document now has its own independent zoom, outline, and toolbar state; previously opening a second file would inherit the zoom level of the first (e.g. 150%)
- **Renderer State Sync** - The renderer now correctly receives per-document initial state (zoom, outlineVisible, toolbarVisible) instead of using its own stale static fields
- **Config Theme Precedence Preserved** - The `docxreader.theme` config setting continues to always take precedence; the per-document state refactor does not override it

---

## [1.4.1] - 2026-02-24

### 🐛 Bug Fix - Theme Config Takes Precedence Over System Theme

### Fixed
- **Theme Config Precedence** - The `docxreader.theme` setting (configurable via `Ctrl+Shift+P` → "Open Docx Reader Configuration") now correctly takes precedence over VS Code's system theme (Fixes #27, refixes #25)
- **Light Theme in Dark VS Code** - Setting `docxreader.theme` to `light` now correctly renders the document in light mode even when VS Code itself uses a dark theme, and vice-versa for `dark`

### Changed
- **Theme Behavior**:
  - `auto` (default): follows VS Code's system theme automatically
  - `light`: always uses light mode regardless of VS Code theme
  - `dark`: always uses dark mode regardless of VS Code theme
- **Improved theme setting description** in settings UI to clarify precedence rules

### Technical
- Root cause: VS Code's webview runtime automatically injects body classes (e.g. `vscode-dark`) onto `<body>` **after** the HTML loads, silently overriding the configured theme
- Fix: injected a `<style id="docx-theme-override">` block in `<head>` that sets all CSS variables with `!important` directly on `:root` when an explicit theme is configured. `!important` `:root` rules have higher specificity than any `body.vscode-dark` rule and cannot be overridden by VS Code's body-class injections
- For `auto` mode the override block is empty and existing VS Code body-class detection continues to work unchanged
- `applyConfigTheme()` in the webview script updates the `<style id="docx-theme-override">` block so the toolbar theme toggle button also benefits from the same fix
- `MutationObserver` + `setTimeout(0)` re-enforcement retained as a secondary safety net
- Added `_enforcingTheme` flag to prevent infinite MutationObserver feedback loops

---

## [1.4.0] - 2026-02-07

### ✨ New Features - Git Diff Support & Synchronized Scrolling

### Added
- **Git Diff Rendering** - Full support for viewing DOCX files in VS Code's built-in diff view (Fixes #11)
- **Synchronized Scrolling** - When comparing documents side-by-side, scrolling one document automatically scrolls the other (Fixes #9)
- **Change Highlighting** - Added visual diff highlighting with green backgrounds for additions and red for removals
- **Git URI Support** - Implemented native Git integration to read historical document versions using `git show`
- **Multi-panel Tracking** - Extension now tracks multiple panels viewing the same file for diff operations

### Fixed
- **Git Blob Reading** - Fixed corrupted/truncated data when reading documents from Git history via `vscode.workspace.fs`
- **Invalid File Handling** - Added graceful fallbacks for Git LFS pointers, empty files, and corrupted documents
- **ODT URI Support** - Updated ODT handler to support non-file URIs (git:, etc.) with temporary file creation

### Technical
- Added LCS (Longest Common Subsequence) diff algorithm for paragraph-level comparison
- Implemented scroll synchronization via message passing between webview panels
- Enhanced `DocxHandler` with `readFromGit()` method for proper Git object retrieval
- Added CSS styling for `.diff-added` and `.diff-removed` classes with theme-aware colors
- Improved error handling with descriptive informational messages instead of crashes

## [1.3.2] - 2026-02-06

### 🐛 Bug Fix - Light Theme Detection

### Fixed
- **Light Theme Support** - Fixed issue where the extension ignored VS Code's light theme setting and always displayed in dark mode (Fixes #25)
- **Auto Theme Detection** - Implemented automatic theme detection using VS Code CSS variables when theme is set to 'auto'
- **Brightness Calculation** - Added intelligent brightness calculation to determine if the current theme is light or dark
- **Real-time Theme Switching** - Added MutationObserver to detect and respond to VS Code theme changes in real-time

### Changed
- **Theme Toggle Behavior** - Theme toggle now cycles through three states: Dark → Light → Auto
- **Distinct Theme Icons** - Updated theme button with unique emojis for each mode:
  - ☀️ for Dark mode
  - 🌙 for Light mode
  - 🔄 for Auto mode (new)
- **Improved Theme Button Labels** - Better descriptive titles showing current mode and next action

### Technical
- Enhanced `generateEnhancedHtml()` to properly handle 'auto' theme mode
- Added `detectVSCodeTheme()` function for automatic theme detection
- Implemented `initializeTheme()` to apply correct theme on document load
- Added DOM observation for dynamic theme changes
- Updated `updateThemeButton()` with clearer mode indicators

---

## [1.3.1] - 2025-12-19

### 🐛 Bug Fix - Empty Document Handling

### Fixed
- **Empty DOCX/ODT Files** - Opening a 0-byte `.docx`/`.odt` now renders as an empty document instead of throwing a conversion error (Fixes #22)

---

## [1.3.0] - 2025-11-05

### 🎯 Toolbar Toggle Feature

### Added
- **Toolbar Hide/Show Functionality** - Users can now hide the toolbar for a cleaner, distraction-free reading experience (Fixes #19)
- **Hide Toolbar Button** - Added close button (✕) to the main toolbar for easy hiding
- **Mini Toolbar Toggle** - When hidden, a small gear icon (⚙️) appears to restore the toolbar
- **Keyboard Shortcut** - Press `Ctrl+H` to quickly toggle toolbar visibility
- **Smooth Animations** - Added CSS transitions for smooth toolbar hide/show animations
- **VS Code Command Integration** - New `docxreader.toggleToolbar` command available in Command Palette

### Changed
- **Improved User Experience** - Toolbar can now be completely hidden when not needed, addressing user feedback about distraction
- **Enhanced UI Design** - Better visual feedback and intuitive controls for toolbar management
- **Non-intrusive Design** - Mini toggle button is small and positioned out of the way when toolbar is hidden

### Fixed
- **Toolbar Distraction Issue** - Resolved complaint about inability to close the toolbar (Issue #19)
- **Screen Real Estate** - Users can now reclaim toolbar space for better document viewing

### Technical
- Enhanced `DocxEditorProvider` with toolbar visibility state management
- Added toolbar toggle methods and message handling
- Updated HTML structure with conditional toolbar visibility classes
- Implemented `updateToolbarVisibility()` function for seamless state transitions
- Added keyboard event handler for Ctrl+H shortcut

---

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
