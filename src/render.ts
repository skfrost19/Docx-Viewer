import * as vscode from 'vscode';
import * as path from 'path';
import { DocxHandler } from './docx_handler';
import { OdtHandler } from './odt_handler';

export class DocumentRenderer {
    private static currentZoom: number = 1.0;
    private static outlineVisible: boolean = true;
    private static currentTheme: string = 'auto';
    private static toolbarVisible: boolean = true;

    public static async renderDocument(uri: vscode.Uri, panel: vscode.WebviewPanel) {
        const docxPath = uri.fsPath;
        try {
            // Show loading state
            panel.webview.html = this.getLoadingHtml();

            // Get configuration
            const config = vscode.workspace.getConfiguration('docxreader');
            const font = config.get('font', 'Arial');
            const theme = config.get('theme', 'auto');
            this.currentZoom = config.get('zoomLevel', 1.0);
            this.outlineVisible = config.get('showOutline', true);
            this.currentTheme = theme;

            let documentHtml = '';
            let processedData: { html: string; outline: OutlineItem[] };

            if (docxPath.toLowerCase().endsWith('.docx')) {
                documentHtml = await DocxHandler.renderDocx(uri);
                processedData = this.processDocumentHtmlAndExtractOutline(documentHtml);
            } else if (docxPath.toLowerCase().endsWith('.odt')) {
                documentHtml = await OdtHandler.renderOdt(uri);
                processedData = this.processDocumentHtmlAndExtractOutline(documentHtml);
            } else {
                panel.webview.html = this.getErrorHtml('Unsupported file format', 'Only .docx and .odt files are supported.');
                return;
            }

            // Generate enhanced HTML with modern UI
            panel.webview.html = this.generateEnhancedHtml(processedData.html, processedData.outline, font, theme, docxPath);

        } catch (error) {
            console.error('Error rendering document:', error);
            panel.webview.html = this.getErrorHtml('Failed to load document', error instanceof Error ? error.message : String(error));
        }
    }

    private static generateEnhancedHtml(documentHtml: string, outline: OutlineItem[], font: string, theme: string, filePath: string): string {
        const fileName = path.basename(filePath);

        // Determine theme class
        let themeClass = '';
        if (this.currentTheme === 'dark') {
            themeClass = 'vscode-dark';
        } else if (this.currentTheme === 'light') {
            themeClass = 'vscode-light';
        } else {
            // 'auto' - detect VS Code theme based on CSS variables
            themeClass = 'vscode-theme-auto';
        }

        const outlineHtml = this.generateOutlineHtml(outline);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName} - Docx Viewer</title>
    <style>
        ${this.getInlineCSS()}
    </style>
</head>
<body class="${themeClass}" style="font-family: ${font};">
    <div class="docx-viewer-container">
        <!-- Toolbar -->
        <div class="docx-toolbar ${this.toolbarVisible ? '' : 'hidden'}" id="mainToolbar">
            <button id="zoomOut" title="Zoom Out">🔍-</button>
            <span id="zoomLevel">${Math.round(this.currentZoom * 100)}%</span>
            <button id="zoomIn" title="Zoom In">🔍+</button>
            <button id="resetZoom" title="Reset Zoom">⚊</button>
            <button id="toggleOutline" title="Toggle Outline">${this.outlineVisible ? '◧' : '◨'}</button>
            <button id="themeToggle" title="Toggle Theme">${this.currentTheme === 'dark' ? '☀️' : this.currentTheme === 'light' ? '🌙' : '🔄'}</button>
            <button id="searchBtn" title="Search">🔍</button>
            <button id="hideToolbar" title="Hide Toolbar">✕</button>
        </div>
        
        <!-- Mini Toolbar Toggle (visible when main toolbar is hidden) -->
        <div class="docx-mini-toolbar ${this.toolbarVisible ? 'hidden' : ''}" id="miniToolbar">
            <button id="showToolbar" title="Show Toolbar">⚙️</button>
        </div>
        
        <!-- Search Panel -->
        <div class="docx-search" id="searchPanel">
            <input type="text" id="searchInput" placeholder="Search in document...">
            <button id="searchPrev" title="Previous">↑</button>
            <button id="searchNext" title="Next">↓</button>
            <button id="closeSearch" title="Close">✕</button>
        </div>
        
        <!-- Outline Panel -->
        <div class="docx-outline ${this.outlineVisible ? '' : 'hidden'}" id="outlinePanel">
            <h3>📋 Document Outline</h3>
            ${outlineHtml}
        </div>
        
        <!-- Document Content -->
        <div class="docx-content" id="documentContent">
            <div class="docx-document" id="document" style="transform: scale(${this.currentZoom});">
                ${documentHtml}
            </div>
        </div>
    </div>
    
    <script>
        ${this.getViewerScript()}
    </script>
</body>
</html>`;
    }

    private static processDocumentHtmlAndExtractOutline(html: string): { html: string; outline: OutlineItem[] } {
        const outline: OutlineItem[] = [];
        let headingCounter = 0;

        // Process HTML and extract outline in a single pass to ensure matching IDs
        const processedHtml = html.replace(/<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (match, tag, content) => {
            const level = parseInt(tag.charAt(1));
            const text = content.replace(/<[^>]*>/g, '').trim();
            const id = this.generateHeadingId(text, headingCounter++);

            if (text) {
                outline.push({
                    level,
                    text,
                    id
                });
            }

            return `<${tag} id="${id}">${content}</${tag}>`;
        });

        return { html: processedHtml, outline };
    }

    private static generateHeadingId(text: string, index: number): string {
        const baseId = text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);

        // Make ID unique by adding index
        return `${baseId}-${index}`;
    }

    private static generateOutlineHtml(outline: OutlineItem[]): string {
        if (outline.length === 0) {
            return '<p style="opacity: 0.7; font-style: italic;">No headings found</p>';
        }

        return outline.map(item =>
            `<div class="docx-outline-item level-${item.level}" data-target="${item.id}">
                ${item.text}
            </div>`
        ).join('');
    }

    private static getLoadingHtml(): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: var(--vscode-font-family); 
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .docx-loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-size: 14px;
        }
        .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid var(--vscode-input-border);
            border-top: 2px solid var(--vscode-button-background);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-left: 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="docx-loading">
        Loading document...
        <div class="spinner"></div>
    </div>
</body>
</html>`;
    }

    private static getErrorHtml(title: string, message: string): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: var(--vscode-font-family); 
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .docx-error {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 80vh;
            text-align: center;
        }
        .error-icon { font-size: 48px; margin-bottom: 20px; }
        h2 { color: var(--vscode-errorForeground); margin: 0 0 10px 0; }
        p { opacity: 0.8; margin: 0; }
    </style>
</head>
<body>
    <div class="docx-error">
        <div class="error-icon">⚠️</div>
        <h2>${title}</h2>
        <p>${message}</p>
    </div>
</body>
</html>`;
    }

    private static getInlineCSS(): string {
        return `
        /* Embedded CSS for the document viewer */
        :root {
            --viewer-bg: var(--vscode-editor-background, #ffffff);
            --viewer-fg: var(--vscode-editor-foreground, #000000);
            --viewer-border: var(--vscode-panel-border, #cccccc);
            --viewer-hover: var(--vscode-list-hoverBackground, #f0f0f0);
            --viewer-active: var(--vscode-list-activeSelectionBackground, #0078d4);
            --viewer-shadow: rgba(0, 0, 0, 0.1);
            --outline-width: 250px;
            --document-bg: #ffffff;
        }
        
        body.vscode-light {
            --viewer-bg: #ffffff;
            --viewer-fg: #000000;
            --viewer-border: #cccccc;
            --viewer-hover: #f0f0f0;
            --viewer-active: #0078d4;
            --viewer-shadow: rgba(0, 0, 0, 0.1);
            --document-bg: #ffffff;
        }
        
        body.vscode-dark {
            --viewer-bg: #1e1e1e;
            --viewer-fg: #ffffff;
            --viewer-border: #3c3c3c;
            --viewer-hover: #2a2d2e;
            --viewer-active: #0078d4;
            --viewer-shadow: rgba(255, 255, 255, 0.1);
            --document-bg: #2d2d30;
        }
        
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; overflow: hidden; }
        
        .docx-viewer-container {
            display: flex;
            height: 100vh;
            background: var(--viewer-bg);
            color: var(--viewer-fg);
        }
        
        .docx-toolbar {
            position: fixed;
            top: 0;
            right: 0;
            z-index: 1000;
            display: flex;
            gap: 8px;
            padding: 8px;
            background: var(--viewer-bg);
            border-bottom: 1px solid var(--viewer-border);
            border-left: 1px solid var(--viewer-border);
            border-radius: 0 0 0 4px;
            box-shadow: 0 2px 8px var(--viewer-shadow);
        }
        
        .docx-toolbar button {
            background: transparent;
            border: 1px solid var(--viewer-border);
            color: var(--viewer-fg);
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        }
        
        .docx-toolbar button:hover { background: var(--viewer-hover); }
        .docx-toolbar button:active { background: var(--viewer-active); color: white; }
        
        .docx-toolbar.hidden {
            transform: translateY(-100%);
            opacity: 0;
            pointer-events: none;
        }
        
        .docx-mini-toolbar {
            position: fixed;
            top: 8px;
            right: 8px;
            z-index: 1001;
            background: var(--viewer-bg);
            border: 1px solid var(--viewer-border);
            border-radius: 4px;
            padding: 4px;
            box-shadow: 0 2px 8px var(--viewer-shadow);
            transition: all 0.3s ease;
        }
        
        .docx-mini-toolbar.hidden {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.8);
        }
        
        .docx-mini-toolbar button {
            background: transparent;
            border: 1px solid var(--viewer-border);
            color: var(--viewer-fg);
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
        }
        
        .docx-mini-toolbar button:hover { background: var(--viewer-hover); }
        .docx-mini-toolbar button:active { background: var(--viewer-active); color: white; }
        
        #zoomLevel {
            padding: 6px 8px;
            font-size: 12px;
            min-width: 45px;
            text-align: center;
        }
        
        .docx-outline {
            width: var(--outline-width);
            background: var(--viewer-bg);
            border-right: 1px solid var(--viewer-border);
            overflow-y: auto;
            padding: 16px;
            transition: margin-left 0.3s ease;
        }
        
        .docx-outline.hidden { margin-left: calc(-1 * var(--outline-width)); }
        
        .docx-outline h3 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            border-bottom: 1px solid var(--viewer-border);
            padding-bottom: 8px;
        }
        
        .docx-outline-item {
            padding: 4px 8px;
            cursor: pointer;
            border-radius: 4px;
            font-size: 12px;
            margin: 2px 0;
            transition: background 0.2s ease;
        }
        
        .docx-outline-item:hover { background: var(--viewer-hover); }
        .docx-outline-item.active { background: var(--viewer-active); color: white; }
        
        .docx-outline-item.level-1 { padding-left: 8px; font-weight: 600; }
        .docx-outline-item.level-2 { padding-left: 20px; }
        .docx-outline-item.level-3 { padding-left: 32px; }
        .docx-outline-item.level-4 { padding-left: 44px; }
        .docx-outline-item.level-5 { padding-left: 56px; }
        .docx-outline-item.level-6 { padding-left: 68px; }
        
        .docx-content {
            flex: 1;
            overflow: auto;
            padding: 16px;
            scroll-behavior: smooth;
        }
        
        .docx-document {
            max-width: 210mm;
            margin: 0 auto;
            background: var(--document-bg);
            color: var(--viewer-fg);
            box-shadow: 0 0 20px var(--viewer-shadow);
            border-radius: 4px;
            padding: 40px;
            line-height: 1.6;
            transform-origin: top center;
            transition: transform 0.2s ease;
        }
        
        .docx-document h1, .docx-document h2, .docx-document h3,
        .docx-document h4, .docx-document h5, .docx-document h6 {
            margin: 1.5em 0 0.5em 0;
            line-height: 1.4;
        }
        
        .docx-document p { margin: 0.8em 0; }
        .docx-document img { max-width: 100%; height: auto; margin: 1em 0; }
        
        .docx-document table {
            border-collapse: collapse;
            margin: 1em 0;
            width: 100%;
        }
        
        .docx-document table td, .docx-document table th {
            border: 1px solid var(--viewer-border);
            padding: 8px 12px;
        }
        
        .docx-document table th {
            background: var(--viewer-hover);
            font-weight: 600;
        }
        
        .zoom-50 { transform: scale(0.5); }
        .zoom-75 { transform: scale(0.75); }
        .zoom-90 { transform: scale(0.9); }
        .zoom-100 { transform: scale(1.0); }
        .zoom-110 { transform: scale(1.1); }
        .zoom-125 { transform: scale(1.25); }
        .zoom-150 { transform: scale(1.5); }
        .zoom-200 { transform: scale(2.0); }
        .zoom-300 { transform: scale(3.0); }
        
        .docx-search {
            position: fixed;
            top: 50px;
            right: 10px;
            z-index: 999;
            display: none;
            background: var(--viewer-bg);
            border: 1px solid var(--viewer-border);
            border-radius: 4px;
            padding: 8px;
            box-shadow: 0 4px 12px var(--viewer-shadow);
            gap: 4px;
        }
        
        .docx-search.visible { display: flex; }
        
        .docx-search input {
            background: var(--viewer-bg);
            border: 1px solid var(--viewer-border);
            color: var(--viewer-fg);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            width: 200px;
        }
        
        .docx-search button {
            background: transparent;
            border: 1px solid var(--viewer-border);
            color: var(--viewer-fg);
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .docx-search button:hover { background: var(--viewer-hover); }
        
        .search-highlight {
            background: yellow;
            color: black;
            padding: 1px 2px;
            border-radius: 2px;
        }
        
        body.vscode-dark .search-highlight {
            background: #ff6600;
            color: white;
        }

        .diff-added {
            background-color: #e6ffec;
            border-left: 4px solid #2ea043;
        }
        body.vscode-dark .diff-added {
            background-color: rgba(46, 160, 67, 0.15);
            border-left: 4px solid #2ea043;
        }

        .diff-removed {
            background-color: #ffebe9;
            border-left: 4px solid #ff0000;
        }
        body.vscode-dark .diff-removed {
            background-color: rgba(255, 0, 0, 0.15);
            border-left: 4px solid #ff0000;
        }
        `;
    }

    private static getViewerScript(): string {
        return `
        (function() {
            let currentZoom = ${this.currentZoom};
            let outlineVisible = ${this.outlineVisible};
            let currentTheme = '${this.currentTheme}';
            let toolbarVisible = ${this.toolbarVisible};
            let searchResults = [];
            let currentSearchIndex = -1;
            
            // Get VS Code API for messaging
            const vscode = acquireVsCodeApi();
            
            // Auto-detect VS Code theme when 'auto' is selected
            function detectVSCodeTheme() {
                if (currentTheme === 'auto') {
                    // Get computed style from body to read VS Code CSS variables
                    const computedStyle = getComputedStyle(document.body);
                    const bgColor = computedStyle.getPropertyValue('--vscode-editor-background').trim();
                    
                    // If we can't detect, try to determine from the background color
                    if (!bgColor) {
                        // Fallback: check body background color
                        const bodyBg = computedStyle.backgroundColor;
                        const rgb = bodyBg.match(/\d+/g);
                        if (rgb && rgb.length >= 3) {
                            const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
                            return brightness > 128 ? 'vscode-light' : 'vscode-dark';
                        }
                    }
                    
                    // Parse the background color to determine if it's dark or light
                    if (bgColor.startsWith('#')) {
                        // Hex color
                        const hex = bgColor.substring(1);
                        const r = parseInt(hex.substring(0, 2), 16);
                        const g = parseInt(hex.substring(2, 4), 16);
                        const b = parseInt(hex.substring(4, 6), 16);
                        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                        return brightness > 128 ? 'vscode-light' : 'vscode-dark';
                    } else if (bgColor.startsWith('rgb')) {
                        // RGB color
                        const rgb = bgColor.match(/\d+/g);
                        if (rgb && rgb.length >= 3) {
                            const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
                            return brightness > 128 ? 'vscode-light' : 'vscode-dark';
                        }
                    }
                    
                    // Default to light if we can't determine
                    return 'vscode-light';
                }
                return null;
            }
            
            // Initialize theme
            function initializeTheme() {
                const detectedTheme = detectVSCodeTheme();
                if (detectedTheme) {
                    document.body.classList.remove('vscode-theme-auto');
                    document.body.classList.add(detectedTheme);
                    updateThemeButton();
                }
            }
            
            // Initialize theme on load
            initializeTheme();
            
            // Also watch for theme changes from VS Code
            const observer = new MutationObserver(() => {
                if (currentTheme === 'auto') {
                    const detectedTheme = detectVSCodeTheme();
                    if (detectedTheme) {
                        document.body.classList.remove('vscode-light', 'vscode-dark', 'vscode-theme-auto');
                        document.body.classList.add(detectedTheme);
                        updateThemeButton();
                    }
                }
            });
            
            // Observe changes to the body's style attribute (VS Code updates CSS variables)
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
            
            function updateThemeButton() {
                const button = document.getElementById('themeToggle');
                if (currentTheme === 'auto') {
                    button.textContent = '🔄';
                    button.title = 'Theme: Auto (Click for Dark)';
                } else if (currentTheme === 'light') {
                    button.textContent = '🌙';
                    button.title = 'Theme: Light (Click for Auto)';
                } else {
                    button.textContent = '☀️';
                    button.title = 'Theme: Dark (Click for Light)';
                }
            }
            
            // Zoom controls
            document.getElementById('zoomIn').addEventListener('click', () => {
                if (currentZoom < 3.0) {
                    currentZoom = Math.min(3.0, currentZoom + 0.25);
                    updateZoom();
                    // Send message back to extension
                    vscode.postMessage({
                        command: 'zoomChanged',
                        zoom: currentZoom
                    });
                }
            });
            
            document.getElementById('zoomOut').addEventListener('click', () => {
                if (currentZoom > 0.5) {
                    currentZoom = Math.max(0.5, currentZoom - 0.25);
                    updateZoom();
                    // Send message back to extension
                    vscode.postMessage({
                        command: 'zoomChanged',
                        zoom: currentZoom
                    });
                }
            });
            
            document.getElementById('resetZoom').addEventListener('click', () => {
                currentZoom = 1.0;
                updateZoom();
                // Send message back to extension
                vscode.postMessage({
                    command: 'zoomChanged',
                    zoom: currentZoom
                });
            });
            
            function updateZoom() {
                const doc = document.getElementById('document');
                const zoomLevel = document.getElementById('zoomLevel');
                
                // Apply zoom using CSS transform directly
                doc.style.transform = 'scale(' + currentZoom + ')';
                
                const zoomPercent = Math.round(currentZoom * 100);
                zoomLevel.textContent = zoomPercent + '%';
            }
            
            // Outline toggle
            document.getElementById('toggleOutline').addEventListener('click', () => {
                outlineVisible = !outlineVisible;
                const outline = document.getElementById('outlinePanel');
                const button = document.getElementById('toggleOutline');
                
                outline.classList.toggle('hidden', !outlineVisible);
                button.textContent = outlineVisible ? '◧' : '◨';
                
                // Send message back to extension
                vscode.postMessage({
                    command: 'outlineToggled',
                    visible: outlineVisible
                });
            });
            
            // Theme toggle
            document.getElementById('themeToggle').addEventListener('click', () => {
                if (currentTheme === 'dark') {
                    currentTheme = 'light';
                } else if (currentTheme === 'light') {
                    currentTheme = 'auto';
                } else {
                    // If auto, switch to dark
                    currentTheme = 'dark';
                }
                
                updateTheme();
                
                // Send message back to extension
                vscode.postMessage({
                    command: 'themeChanged',
                    theme: currentTheme
                });
            });
            
            function updateTheme() {
                const body = document.body;
                
                // Remove existing theme classes
                body.classList.remove('vscode-light', 'vscode-dark', 'vscode-theme-auto');
                
                // Apply new theme
                if (currentTheme === 'light') {
                    body.classList.add('vscode-light');
                } else if (currentTheme === 'dark') {
                    body.classList.add('vscode-dark');
                } else if (currentTheme === 'auto') {
                    body.classList.add('vscode-theme-auto');
                    // Re-detect and apply the appropriate theme
                    const detectedTheme = detectVSCodeTheme();
                    if (detectedTheme) {
                        body.classList.remove('vscode-theme-auto');
                        body.classList.add(detectedTheme);
                    }
                }
                
                updateThemeButton();
            }
            
            // Toolbar toggle
            document.getElementById('hideToolbar').addEventListener('click', () => {
                toolbarVisible = false;
                updateToolbarVisibility();
                
                // Send message back to extension
                vscode.postMessage({
                    command: 'toolbarToggled',
                    visible: toolbarVisible
                });
            });
            
            document.getElementById('showToolbar').addEventListener('click', () => {
                toolbarVisible = true;
                updateToolbarVisibility();
                
                // Send message back to extension
                vscode.postMessage({
                    command: 'toolbarToggled',
                    visible: toolbarVisible
                });
            });
            
            function updateToolbarVisibility() {
                const mainToolbar = document.getElementById('mainToolbar');
                const miniToolbar = document.getElementById('miniToolbar');
                
                if (toolbarVisible) {
                    mainToolbar.classList.remove('hidden');
                    miniToolbar.classList.add('hidden');
                } else {
                    mainToolbar.classList.add('hidden');
                    miniToolbar.classList.remove('hidden');
                }
            }
            
            // Outline navigation
            document.querySelectorAll('.docx-outline-item').forEach(item => {
                item.addEventListener('click', () => {
                    const targetId = item.getAttribute('data-target');
                    const target = document.getElementById(targetId);
                    
                    if (target) {
                        // Remove active class from all outline items
                        document.querySelectorAll('.docx-outline-item').forEach(i => i.classList.remove('active'));
                        
                        // Add active class to clicked item
                        item.classList.add('active');
                        
                        // Scroll to target
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
            
            // Search functionality
            document.getElementById('searchBtn').addEventListener('click', () => {
                const searchPanel = document.getElementById('searchPanel');
                searchPanel.classList.toggle('visible');
                if (searchPanel.classList.contains('visible')) {
                    document.getElementById('searchInput').focus();
                }
            });
            
            document.getElementById('closeSearch').addEventListener('click', () => {
                document.getElementById('searchPanel').classList.remove('visible');
                clearSearchResults();
            });
            
            document.getElementById('searchInput').addEventListener('input', performSearch);
            document.getElementById('searchNext').addEventListener('click', () => navigateSearch(1));
            document.getElementById('searchPrev').addEventListener('click', () => navigateSearch(-1));
            
            function performSearch() {
                const searchTerm = document.getElementById('searchInput').value.trim();
                clearSearchResults();
                
                if (searchTerm.length < 2) return;
                
                const content = document.getElementById('document');
                const walker = document.createTreeWalker(
                    content,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                const textNodes = [];
                let node;
                while (node = walker.nextNode()) {
                    textNodes.push(node);
                }
                
                searchResults = [];
                textNodes.forEach(textNode => {
                    const text = textNode.textContent;
                    const regex = new RegExp(searchTerm, 'gi');
                    let match;
                    
                    while ((match = regex.exec(text)) !== null) {
                        searchResults.push({
                            node: textNode,
                            start: match.index,
                            length: match[0].length
                        });
                    }
                });
                
                highlightSearchResults();
                if (searchResults.length > 0) {
                    currentSearchIndex = 0;
                    navigateToSearchResult(0);
                }
            }
            
            function highlightSearchResults() {
                searchResults.forEach(result => {
                    const textNode = result.node;
                    const parent = textNode.parentNode;
                    const text = textNode.textContent;
                    
                    const before = text.substring(0, result.start);
                    const match = text.substring(result.start, result.start + result.length);
                    const after = text.substring(result.start + result.length);
                    
                    const highlightSpan = document.createElement('span');
                    highlightSpan.className = 'search-highlight';
                    highlightSpan.textContent = match;
                    
                    const beforeNode = document.createTextNode(before);
                    const afterNode = document.createTextNode(after);
                    
                    parent.insertBefore(beforeNode, textNode);
                    parent.insertBefore(highlightSpan, textNode);
                    parent.insertBefore(afterNode, textNode);
                    parent.removeChild(textNode);
                    
                    result.element = highlightSpan;
                });
            }
            
            function clearSearchResults() {
                document.querySelectorAll('.search-highlight').forEach(highlight => {
                    const parent = highlight.parentNode;
                    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
                    parent.normalize();
                });
                searchResults = [];
                currentSearchIndex = -1;
            }
            
            function navigateSearch(direction) {
                if (searchResults.length === 0) return;
                
                currentSearchIndex += direction;
                if (currentSearchIndex >= searchResults.length) currentSearchIndex = 0;
                if (currentSearchIndex < 0) currentSearchIndex = searchResults.length - 1;
                
                navigateToSearchResult(currentSearchIndex);
            }
            
            function navigateToSearchResult(index) {
                if (index < 0 || index >= searchResults.length) return;
                
                const result = searchResults[index];
                if (result.element) {
                    result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Temporarily highlight current result
                    result.element.style.background = '#ff0000';
                    setTimeout(() => {
                        if (document.body.classList.contains('vscode-dark')) {
                            result.element.style.background = '#ff6600';
                        } else {
                            result.element.style.background = 'yellow';
                        }
                    }, 500);
                }
            }
            
            // Sync Scroll
            const docContent = document.getElementById('documentContent');
            let isSyncing = false;
            
            if (docContent) {
                docContent.addEventListener('scroll', () => {
                    if (!isSyncing) {
                        const maxScroll = docContent.scrollHeight - docContent.clientHeight;
                        if (maxScroll > 0) {
                            const pct = docContent.scrollTop / maxScroll;
                            vscode.postMessage({ command: 'scroll', scrollPercent: pct });
                        }
                    }
                    isSyncing = false;
                });
            }

            // Handle messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'updateZoom':
                        currentZoom = message.zoom;
                        updateZoom();
                        break;
                    case 'toggleOutline':
                        outlineVisible = message.visible;
                        const outline = document.getElementById('outlinePanel');
                        const button = document.getElementById('toggleOutline');
                        outline.classList.toggle('hidden', !outlineVisible);
                        button.textContent = outlineVisible ? '◧' : '◨';
                        break;
                    case 'updateTheme':
                        currentTheme = message.theme;
                        updateTheme();
                        break;
                    case 'toggleToolbar':
                        toolbarVisible = message.visible;
                        updateToolbarVisibility();
                        break;
                    case 'syncScroll':
                        if (docContent) {
                            isSyncing = true;
                            const maxScroll = docContent.scrollHeight - docContent.clientHeight;
                            docContent.scrollTop = message.scrollPercent * maxScroll;
                        }
                        break;
                    case 'highlight':
                        highlightDiffs(message.diffs);
                        break;
                }
            });

            function highlightDiffs(diffs) {
                const doc = document.getElementById('document');
                if (!doc) return;
                
                doc.querySelectorAll('.diff-added, .diff-removed').forEach(el => {
                    el.classList.remove('diff-added', 'diff-removed');
                });

                const elements = Array.from(doc.children);
                
                if (diffs.added) {
                    diffs.added.forEach(idx => {
                        if (elements[idx]) elements[idx].classList.add('diff-added');
                    });
                }
                if (diffs.removed) {
                    diffs.removed.forEach(idx => {
                        if (elements[idx]) elements[idx].classList.add('diff-removed');
                    });
                }
            }
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case '+':
                        case '=':
                            e.preventDefault();
                            document.getElementById('zoomIn').click();
                            break;
                        case '-':
                            e.preventDefault();
                            document.getElementById('zoomOut').click();
                            break;
                        case '0':
                            e.preventDefault();
                            document.getElementById('resetZoom').click();
                            break;
                        case 'f':
                            e.preventDefault();
                            document.getElementById('searchBtn').click();
                            break;
                        case 'h':
                            e.preventDefault();
                            if (toolbarVisible) {
                                document.getElementById('hideToolbar').click();
                            } else {
                                document.getElementById('showToolbar').click();
                            }
                            break;
                    }
                }
                
                if (e.key === 'Escape') {
                    document.getElementById('closeSearch').click();
                }
            });
        })();
        `;
    }

    public static updateZoom(zoom: number) {
        this.currentZoom = zoom;
    }

    public static toggleOutline() {
        this.outlineVisible = !this.outlineVisible;
    }

    public static updateTheme(theme: string) {
        this.currentTheme = theme;
    }

    public static toggleToolbar() {
        this.toolbarVisible = !this.toolbarVisible;
    }
}

interface OutlineItem {
    level: number;
    text: string;
    id: string;
}

// Legacy function for backward compatibility
export async function renderDocuments(docxPath: string, panel: vscode.WebviewPanel) {
    return DocumentRenderer.renderDocument(vscode.Uri.file(docxPath), panel);
}