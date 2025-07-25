import * as vscode from 'vscode';
import { DocxEditorProvider } from './custom_editor';

export function activate(context: vscode.ExtensionContext) {
    // Create the custom editor provider instance
    const editorProvider = new DocxEditorProvider();

    // Register the custom editor provider
    context.subscriptions.push(vscode.window.registerCustomEditorProvider('docxreader.docxEditor', editorProvider, {
        webviewOptions: {
            retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
    }));

    // Register configuration command
    context.subscriptions.push(vscode.commands.registerCommand('docxreader.openConfig', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:shahilkumar.docxreader');
    }));

    // Register zoom commands
    context.subscriptions.push(vscode.commands.registerCommand('docxreader.zoomIn', () => {
        editorProvider.handleZoomIn();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('docxreader.zoomOut', () => {
        editorProvider.handleZoomOut();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('docxreader.resetZoom', () => {
        editorProvider.handleResetZoom();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('docxreader.toggleOutline', () => {
        editorProvider.handleToggleOutline();
    }));

    // Register status bar update command
    context.subscriptions.push(vscode.commands.registerCommand('docxreader.updateStatusBar', () => {
        updateStatusBar();
    }));

    // Register status bar item to show current zoom level
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'docxreader.resetZoom';
    statusBarItem.tooltip = 'Click to reset zoom';

    // Function to update status bar
    function updateStatusBar() {
        const activeEditor = vscode.window.activeTextEditor;
        const isDocxEditor = activeEditor &&
            (activeEditor.document.uri.scheme === 'vscode-webview' ||
                activeEditor.document.fileName.endsWith('.docx') ||
                activeEditor.document.fileName.endsWith('.odt'));

        if (isDocxEditor || editorProvider.hasActiveWebviewPanels()) {
            const zoom = Math.round(editorProvider.getCurrentZoom() * 100);
            statusBarItem.text = `$(zoom-in) ${zoom}%`;
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    }

    // Update status bar when active editor changes
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
        updateStatusBar();
    }));

    // Update status bar when webview panel becomes active
    context.subscriptions.push(vscode.window.onDidChangeActiveColorTheme(() => {
        updateStatusBar();
    }));

    context.subscriptions.push(statusBarItem);

    // Show welcome message for first-time users
    const hasShownWelcome = context.globalState.get('hasShownWelcome', false);

    if (!hasShownWelcome) {
        vscode.window.showInformationMessage(
            'Welcome to Enhanced Docx Viewer! 🎉 Use Ctrl+Plus/Minus to zoom, Ctrl+F to search, and click the outline button to navigate.',
            'Learn More',
            'Don\'t Show Again'
        ).then(selection => {
            if (selection === 'Learn More') {
                vscode.commands.executeCommand('docxreader.openConfig');
            } else if (selection === 'Don\'t Show Again') {
                context.globalState.update('hasShownWelcome', true);
            }
        });
    }

    console.log('Enhanced Docx Viewer activated successfully!');
}

export function deactivate() {
    console.log('Enhanced Docx Viewer deactivated');
}