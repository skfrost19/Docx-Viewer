import * as vscode from 'vscode';
import { DocumentRenderer } from './render';

export class DocxEditorProvider implements vscode.CustomEditorProvider {

    private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<vscode.CustomDocument>>();
    public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

    private activeWebviewPanels = new Map<string, vscode.WebviewPanel>();
    private currentZoom = 1.0;
    private outlineVisible = true;
    private currentTheme = 'auto';

    public async resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
        // Store the webview panel reference
        this.activeWebviewPanels.set(document.uri.toString(), webviewPanel);

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
            this.activeWebviewPanels.delete(document.uri.toString());
        });

        // Render the initial content
        await DocumentRenderer.renderDocument(document.uri.fsPath, webviewPanel);
    }

    private async handleWebviewMessage(message: any, _webviewPanel: vscode.WebviewPanel) {
        switch (message.command) {
            case 'zoomChanged':
                this.currentZoom = message.zoom;
                DocumentRenderer.updateZoom(this.currentZoom);
                // Notify extension about zoom change for status bar update
                vscode.commands.executeCommand('docxreader.updateStatusBar');
                break;
            case 'outlineToggled':
                this.outlineVisible = message.visible;
                DocumentRenderer.toggleOutline();
                break;
            case 'themeChanged':
                this.currentTheme = message.theme;
                DocumentRenderer.updateTheme(this.currentTheme);
                break;
            case 'error':
                vscode.window.showErrorMessage(`Document Viewer Error: ${message.message}`);
                break;
            case 'info':
                vscode.window.showInformationMessage(message.message);
                break;
        }
    }

    public async handleZoomIn(webviewPanel?: vscode.WebviewPanel) {
        if (this.currentZoom < 3.0) {
            this.currentZoom = Math.min(3.0, this.currentZoom + 0.1);
            await this.sendZoomUpdate(webviewPanel);
            // Notify extension about zoom change for status bar update
            vscode.commands.executeCommand('docxreader.updateStatusBar');
        }
    }

    public async handleZoomOut(webviewPanel?: vscode.WebviewPanel) {
        if (this.currentZoom > 0.5) {
            this.currentZoom = Math.max(0.5, this.currentZoom - 0.1);
            await this.sendZoomUpdate(webviewPanel);
            // Notify extension about zoom change for status bar update
            vscode.commands.executeCommand('docxreader.updateStatusBar');
        }
    }

    public async handleResetZoom(webviewPanel?: vscode.WebviewPanel) {
        this.currentZoom = 1.0;
        await this.sendZoomUpdate(webviewPanel);
        // Notify extension about zoom change for status bar update
        vscode.commands.executeCommand('docxreader.updateStatusBar');
    }

    public async handleToggleOutline(webviewPanel?: vscode.WebviewPanel) {
        this.outlineVisible = !this.outlineVisible;
        await this.sendOutlineUpdate(webviewPanel);
    }

    public async handleToggleTheme(webviewPanel?: vscode.WebviewPanel) {
        // Cycle through themes: auto -> light -> dark -> auto
        if (this.currentTheme === 'auto') {
            this.currentTheme = 'light';
        } else if (this.currentTheme === 'light') {
            this.currentTheme = 'dark';
        } else {
            this.currentTheme = 'auto';
        }
        await this.sendThemeUpdate(webviewPanel);
    }

    private async sendZoomUpdate(webviewPanel?: vscode.WebviewPanel) {
        const panel = webviewPanel || this.getActiveWebviewPanel();
        if (panel) {
            await panel.webview.postMessage({
                command: 'updateZoom',
                zoom: this.currentZoom
            });
            DocumentRenderer.updateZoom(this.currentZoom);
        }
    }

    private async sendOutlineUpdate(webviewPanel?: vscode.WebviewPanel) {
        const panel = webviewPanel || this.getActiveWebviewPanel();
        if (panel) {
            await panel.webview.postMessage({
                command: 'toggleOutline',
                visible: this.outlineVisible
            });
            DocumentRenderer.toggleOutline();
        }
    }

    private async sendThemeUpdate(webviewPanel?: vscode.WebviewPanel) {
        const panel = webviewPanel || this.getActiveWebviewPanel();
        if (panel) {
            await panel.webview.postMessage({
                command: 'updateTheme',
                theme: this.currentTheme
            });
            DocumentRenderer.updateTheme(this.currentTheme);
        }
    }

    private getActiveWebviewPanel(): vscode.WebviewPanel | undefined {
        // Return the first active panel (in a real scenario, you might want to track the focused one)
        const panels = Array.from(this.activeWebviewPanels.values());
        return panels.length > 0 ? panels[0] : undefined;
    }

    public getCurrentZoom(): number {
        return this.currentZoom;
    }

    public isOutlineVisible(): boolean {
        return this.outlineVisible;
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