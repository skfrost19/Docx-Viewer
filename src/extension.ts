import * as vscode from 'vscode';
import { DocxEditorProvider } from './custom_editor';

export function activate(context: vscode.ExtensionContext) {
    // Register the custom editor provider
    context.subscriptions.push(vscode.window.registerCustomEditorProvider('docxreader.docxEditor', new DocxEditorProvider(), {
        webviewOptions: {
            retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false
    }));

    // Add a command to open the user's configuration
    context.subscriptions.push(vscode.commands.registerCommand('docxreader.openConfig', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:shahilkumar.docxreader');
    }));
}