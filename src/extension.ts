import * as vscode from 'vscode';
import * as mammoth from 'mammoth';
const odt2html = require('odt2html');


async function renderDocx(docxPath: string, panel: vscode.WebviewPanel) {
	// convert the docx to html

    if (docxPath.endsWith(".odt")){
        odt2html.toHTML({
            path: docxPath,
        })
        .then(function (html: string) {
            panel.webview.html = html;
        })
        .catch(function (err: any) {
            console.error(err);
        }
        );
    }

    else {
        const result = await mammoth.convertToHtml({path: docxPath});
        const html = result.value; // The generated HTML
        panel.webview.html = html;
    }
}

// create a custom editor panel for docx files and register the command docxreader.docxToHtml

class DocxEditorProvider implements vscode.CustomEditorProvider {
    
    private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<vscode.CustomDocument>>();
    public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

    public async resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
        // Render the initial content for the webview
        renderDocx(document.uri.fsPath, webviewPanel);

    }

    public saveCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Thenable<void> {
        throw new Error('Not Supported');
    }

    public saveCustomDocumentAs(document: vscode.CustomDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
        throw new Error('Not Supported');
    }

    public revertCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Thenable<void> {
        throw new Error('Not Supported');
    }

    public backupCustomDocument(document: vscode.CustomDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
        throw new Error('Not Supported');
    }

    public openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
        return {
            uri,
            dispose() { }
        };
    }
  
}

export function activate(context: vscode.ExtensionContext) {
    // Register the custom editor provider
    context.subscriptions.push(vscode.window.registerCustomEditorProvider('docxreader.docxEditor', new DocxEditorProvider(), {
        webviewOptions: {
            retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false
    }));
}
