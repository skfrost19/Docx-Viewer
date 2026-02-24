import * as vscode from 'vscode';
import { DocumentRenderer } from './render';
import { DocxHandler } from './docx_handler';

interface DocumentState {
    zoom: number;
    outlineVisible: boolean;
    currentTheme: string;
    toolbarVisible: boolean;
}

export class DocxEditorProvider implements vscode.CustomEditorProvider {

    private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<vscode.CustomDocument>>();
    public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

    private activeWebviewPanels = new Map<string, vscode.WebviewPanel>();
    private panelsByPath = new Map<string, vscode.WebviewPanel[]>();
    private panelToUri = new Map<vscode.WebviewPanel, string>(); // reverse lookup

    // Per-document state — keyed by URI string so each file has independent zoom/outline/toolbar
    private documentStates = new Map<string, DocumentState>();

    private getOrCreateState(uriString: string): DocumentState {
        if (!this.documentStates.has(uriString)) {
            const config = vscode.workspace.getConfiguration('docxreader');
            this.documentStates.set(uriString, {
                zoom: config.get<number>('zoomLevel', 1.0),
                outlineVisible: config.get<boolean>('showOutline', true),
                currentTheme: config.get<string>('theme', 'auto'),
                toolbarVisible: false
            });
        }
        return this.documentStates.get(uriString)!;
    }

    private getStateForPanel(panel: vscode.WebviewPanel): DocumentState | undefined {
        const uri = this.panelToUri.get(panel);
        return uri ? this.documentStates.get(uri) : undefined;
    }

    private getActiveState(): DocumentState | undefined {
        const panel = this.getActiveWebviewPanel();
        return panel ? this.getStateForPanel(panel) : undefined;
    }

    public async resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
        // Store the webview panel reference
        const uriString = document.uri.toString();
        this.activeWebviewPanels.set(uriString, webviewPanel);
        this.panelToUri.set(webviewPanel, uriString);

        // Initialize fresh per-document state for this URI
        this.getOrCreateState(uriString);

        // Track panels by filesystem path to detect diff views
        const fsPath = document.uri.fsPath;
        let panels = this.panelsByPath.get(fsPath) || [];
        panels.push(webviewPanel);
        this.panelsByPath.set(fsPath, panels);

        // Configure webview options
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(require('path').dirname(__dirname))]
        };

        // Set up message handling
        webviewPanel.webview.onDidReceiveMessage(
            message => this.handleWebviewMessage(message, webviewPanel),
            undefined,
            []
        );

        // Clean up on dispose
        webviewPanel.onDidDispose(() => {
            this.activeWebviewPanels.delete(uriString);
            this.panelToUri.delete(webviewPanel);
            this.documentStates.delete(uriString);

            const panels = this.panelsByPath.get(fsPath) || [];
            const idx = panels.indexOf(webviewPanel);
            if (idx !== -1) {
                panels.splice(idx, 1);
                if (panels.length === 0) {
                    this.panelsByPath.delete(fsPath);
                } else {
                    this.panelsByPath.set(fsPath, panels);
                }
            }
        });

        // Render the initial content — pass per-document state so the renderer
        // uses the correct state for this specific file
        const state = this.getOrCreateState(uriString);
        await DocumentRenderer.renderDocument(document.uri, webviewPanel, {
            zoom: state.zoom,
            outlineVisible: state.outlineVisible,
            toolbarVisible: state.toolbarVisible
        });

        // Check if we need to show diffs (more than 1 panel for same file)
        if (panels.length >= 2) {
            this.triggerDiffUpdate(fsPath);
        }
    }

    private async handleWebviewMessage(message: any, webviewPanel: vscode.WebviewPanel) {
        const uri = this.panelToUri.get(webviewPanel);
        const state = uri ? this.documentStates.get(uri) : undefined;

        switch (message.command) {
            case 'scroll':
                this.syncScroll(webviewPanel, message.scrollPercent);
                break;
            case 'zoomChanged':
                if (state) { state.zoom = message.zoom; }
                DocumentRenderer.updateZoom(message.zoom);
                // Notify extension about zoom change for status bar update
                vscode.commands.executeCommand('docxreader.updateStatusBar');
                break;
            case 'outlineToggled':
                if (state) { state.outlineVisible = message.visible; }
                DocumentRenderer.toggleOutline();
                break;
            case 'themeChanged':
                if (state) { state.currentTheme = message.theme; }
                DocumentRenderer.updateTheme(message.theme);
                break;
            case 'toolbarToggled':
                if (state) { state.toolbarVisible = message.visible; }
                DocumentRenderer.toggleToolbar();
                break;
            case 'error':
                vscode.window.showErrorMessage(`Document Viewer Error: ${message.message}`);
                break;
            case 'info':
                vscode.window.showInformationMessage(message.message);
                break;
        }
    }

    private syncScroll(sourcePanel: vscode.WebviewPanel, scrollPercent: number) {
        let targetPath: string | undefined;
        for (const [path, panels] of this.panelsByPath) {
            if (panels.includes(sourcePanel)) {
                targetPath = path;
                break;
            }
        }

        if (targetPath) {
            const panels = this.panelsByPath.get(targetPath);
            if (panels) {
                panels.forEach(p => {
                    if (p !== sourcePanel) {
                        p.webview.postMessage({ command: 'syncScroll', scrollPercent });
                    }
                });
            }
        }
    }

    private async triggerDiffUpdate(fsPath: string) {
        const panels = this.panelsByPath.get(fsPath);
        if (!panels || panels.length < 2) return;

        const panelUris: vscode.Uri[] = [];
        const orderedPanels: vscode.WebviewPanel[] = [];

        for (const p of panels) {
            for (const [uriStr, activeP] of this.activeWebviewPanels) {
                if (activeP === p) {
                    panelUris.push(vscode.Uri.parse(uriStr));
                    orderedPanels.push(p);
                    break;
                }
            }
        }

        if (panelUris.length < 2) return;

        try {
            const html1 = await DocxHandler.renderDocx(panelUris[0]);
            const html2 = await DocxHandler.renderDocx(panelUris[1]);

            const paras1 = this.extractParagraphText(html1);
            const paras2 = this.extractParagraphText(html2);

            const diff = this.diffArrays(paras1, paras2);

            const p1Removals: number[] = [];
            const p2Additions: number[] = [];

            let idx1 = 0;
            let idx2 = 0;

            diff.forEach(part => {
                if (part.added) {
                    for (let i = 0; i < part.count; i++) p2Additions.push(idx2 + i);
                    idx2 += part.count;
                } else if (part.removed) {
                    for (let i = 0; i < part.count; i++) p1Removals.push(idx1 + i);
                    idx1 += part.count;
                } else {
                    idx1 += part.count;
                    idx2 += part.count;
                }
            });

            orderedPanels[0].webview.postMessage({ command: 'highlight', diffs: { removed: p1Removals, added: [] } });
            orderedPanels[1].webview.postMessage({ command: 'highlight', diffs: { removed: [], added: p2Additions } });

        } catch (error) {
            console.error('Error computing diff:', error);
        }
    }

    private extractParagraphText(html: string): string[] {
        const matches = html.matchAll(/<(p|h[1-6]|li|div|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi);
        const results: string[] = [];
        for (const match of matches) {
            results.push(match[2].replace(/<[^>]+>/g, '').trim());
        }
        return results;
    }

    private diffArrays(arr1: string[], arr2: string[]): { count: number, added?: boolean, removed?: boolean }[] {
        const n = arr1.length;
        const m = arr2.length;
        const matrix: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
                if (arr1[i] === arr2[j]) {
                    matrix[i + 1][j + 1] = matrix[i][j] + 1;
                } else {
                    matrix[i + 1][j + 1] = Math.max(matrix[i + 1][j], matrix[i][j + 1]);
                }
            }
        }

        const parts: { count: number, added?: boolean, removed?: boolean }[] = [];
        let i = n;
        let j = m;

        const stack: { count: number, added?: boolean, removed?: boolean }[] = [];

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && arr1[i - 1] === arr2[j - 1]) {
                stack.push({ count: 1 });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
                stack.push({ count: 1, added: true });
                j--;
            } else {
                stack.push({ count: 1, removed: true });
                i--;
            }
        }

        stack.reverse();
        if (stack.length > 0) {
            let current = stack[0];
            for (let k = 1; k < stack.length; k++) {
                const next = stack[k];
                if ((current.added === next.added) && (current.removed === next.removed)) {
                    current.count += next.count;
                } else {
                    parts.push(current);
                    current = next;
                }
            }
            parts.push(current);
        }

        return parts;
    }

    public async handleZoomIn(webviewPanel?: vscode.WebviewPanel) {
        const panel = webviewPanel || this.getActiveWebviewPanel();
        const state = panel ? this.getStateForPanel(panel) : undefined;
        if (state && state.zoom < 3.0) {
            state.zoom = Math.min(3.0, parseFloat((state.zoom + 0.1).toFixed(1)));
            await this.sendZoomUpdate(panel, state.zoom);
            vscode.commands.executeCommand('docxreader.updateStatusBar');
        }
    }

    public async handleZoomOut(webviewPanel?: vscode.WebviewPanel) {
        const panel = webviewPanel || this.getActiveWebviewPanel();
        const state = panel ? this.getStateForPanel(panel) : undefined;
        if (state && state.zoom > 0.5) {
            state.zoom = Math.max(0.5, parseFloat((state.zoom - 0.1).toFixed(1)));
            await this.sendZoomUpdate(panel, state.zoom);
            vscode.commands.executeCommand('docxreader.updateStatusBar');
        }
    }

    public async handleResetZoom(webviewPanel?: vscode.WebviewPanel) {
        const panel = webviewPanel || this.getActiveWebviewPanel();
        const state = panel ? this.getStateForPanel(panel) : undefined;
        if (state) {
            state.zoom = 1.0;
            await this.sendZoomUpdate(panel, state.zoom);
            vscode.commands.executeCommand('docxreader.updateStatusBar');
        }
    }

    public async handleToggleOutline(webviewPanel?: vscode.WebviewPanel) {
        const panel = webviewPanel || this.getActiveWebviewPanel();
        const state = panel ? this.getStateForPanel(panel) : undefined;
        if (state) {
            state.outlineVisible = !state.outlineVisible;
            await this.sendOutlineUpdate(panel, state.outlineVisible);
        }
    }

    public async handleToggleTheme(webviewPanel?: vscode.WebviewPanel) {
        const panel = webviewPanel || this.getActiveWebviewPanel();
        const state = panel ? this.getStateForPanel(panel) : undefined;
        if (state) {
            // Cycle through themes: auto -> light -> dark -> auto
            if (state.currentTheme === 'auto') { state.currentTheme = 'light'; }
            else if (state.currentTheme === 'light') { state.currentTheme = 'dark'; }
            else { state.currentTheme = 'auto'; }
            await this.sendThemeUpdate(panel, state.currentTheme);
        }
    }

    public async handleToggleToolbar(webviewPanel?: vscode.WebviewPanel) {
        const panel = webviewPanel || this.getActiveWebviewPanel();
        const state = panel ? this.getStateForPanel(panel) : undefined;
        if (state) {
            state.toolbarVisible = !state.toolbarVisible;
            await this.sendToolbarUpdate(panel, state.toolbarVisible);
        }
    }

    private async sendZoomUpdate(panel: vscode.WebviewPanel | undefined, zoom: number) {
        if (panel) {
            await panel.webview.postMessage({ command: 'updateZoom', zoom });
            DocumentRenderer.updateZoom(zoom);
        }
    }

    private async sendOutlineUpdate(panel: vscode.WebviewPanel | undefined, visible: boolean) {
        if (panel) {
            await panel.webview.postMessage({ command: 'toggleOutline', visible });
            DocumentRenderer.toggleOutline();
        }
    }

    private async sendThemeUpdate(panel: vscode.WebviewPanel | undefined, theme: string) {
        if (panel) {
            await panel.webview.postMessage({ command: 'updateTheme', theme });
            DocumentRenderer.updateTheme(theme);
        }
    }

    private async sendToolbarUpdate(panel: vscode.WebviewPanel | undefined, visible: boolean) {
        if (panel) {
            await panel.webview.postMessage({ command: 'toggleToolbar', visible });
            DocumentRenderer.toggleToolbar();
        }
    }

    private getActiveWebviewPanel(): vscode.WebviewPanel | undefined {
        // Return the first active panel (in a real scenario, you might want to track the focused one)
        const panels = Array.from(this.activeWebviewPanels.values());
        return panels.length > 0 ? panels[0] : undefined;
    }

    public getCurrentZoom(): number {
        return this.getActiveState()?.zoom ?? 1.0;
    }

    public isOutlineVisible(): boolean {
        return this.getActiveState()?.outlineVisible ?? true;
    }

    public isToolbarVisible(): boolean {
        return this.getActiveState()?.toolbarVisible ?? false;
    }

    public hasActiveWebviewPanels(): boolean {
        return this.activeWebviewPanels.size > 0;
    }

    public saveCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Thenable<void> {
        // Document viewing is read-only, no save needed
        return Promise.resolve();
    }

    public saveCustomDocumentAs(document: vscode.CustomDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
        // Could implement export functionality here in the future
        throw new Error('Save As not supported for document viewing');
    }

    public revertCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Thenable<void> {
        // No changes to revert for read-only viewer
        return Promise.resolve();
    }

    public backupCustomDocument(document: vscode.CustomDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
        // No backup needed for read-only viewer
        return Promise.resolve({
            id: context.destination.toString(),
            delete: async () => { }
        });
    }

    public openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
        return {
            uri,
            dispose() { }
        };
    }
}