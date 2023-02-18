import * as vscode from 'vscode';

const mammoth = require('mammoth');

function renderDocx(docxPath: string) {
	// convert the docx to html
	mammoth.convertToHtml({path: docxPath}).then (function (result: any) {
		var html = result.value; // The generated HTML
		// remove "Test VSCODE" from the html
		html = html.replace("Test VSCODE", "");
		var messages = result.messages; // Any messages, such as warnings during conversion
		// if there are any messages, show the first one
		if (messages.length > 0) {
			vscode.window.showErrorMessage(messages[0].message);
			return null;
			
		}
		// craete a new panel to display the html
		const panel = vscode.window.createWebviewPanel(
			'docxreader',
			'Docx Reader',
			vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true
			}
		);
		// set the html content of the panel
		panel.webview.html = html;
	}
	).done();
}	

export function activate(context: vscode.ExtensionContext) {
	// use command docxreader.docxTohtml to convert docx to html
	let disposable = vscode.commands.registerCommand('docxreader.docxToHtml', (uri: vscode.Uri) => {
		// take the file path from the active editor not the active document
		const editor = uri.fsPath;
		// render the html in a separate panel
		renderDocx(editor);
	}
	);

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}