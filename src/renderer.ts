import * as vscode from 'vscode';
import { DocxHandler } from './docx_handler';
import { OdtHandler } from './odt_handler';


export async function renderDocuments(docxPath: string, panel: vscode.WebviewPanel) {
    // get font from docxreader.font setting
    const font = vscode.workspace.getConfiguration().get('docxreader.font') as string;

    if (docxPath.endsWith(".docx")) {
        const html = await DocxHandler.renderDocx(docxPath) + `<style>body { font-family: ${font}; }</style>`;
        panel.webview.html = html;
    } else if (docxPath.endsWith(".odt")) {
        const html = await OdtHandler.renderOdt(docxPath) + `<style>body { font-family: ${font}; }</style>`;
        panel.webview.html = html;
    } else {
        vscode.window.showErrorMessage("File is not a docx or odt file");
    }
}