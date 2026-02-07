import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

const odt2html = require('odt2html');

export class OdtHandler {
    public static async renderOdt(uri: vscode.Uri): Promise<string> {
        try {
            // odt2html requires a file path, so we might need to write to temp if it's not a file scheme
            let filePath = uri.fsPath;
            let tempFile: string | undefined;

            if (uri.scheme !== 'file') {
                const fileData = await vscode.workspace.fs.readFile(uri);
                if (fileData.byteLength === 0) return '';

                const tempDir = os.tmpdir();
                tempFile = path.join(tempDir, `temp_${Date.now()}.odt`);
                await fs.writeFile(tempFile, Buffer.from(fileData));
                filePath = tempFile;
            } else {
                const stat = await fs.stat(filePath);
                if (stat.size === 0) return '';
            }

            // The odt2html returns promise
            const html = await odt2html.toHTML({
                path: filePath
            });

            if (tempFile) {
                try { await fs.unlink(tempFile); } catch { }
            }

            return html;
        } catch (error) {
            console.error('Error converting ODT:', error);
            throw new Error(`Failed to convert ODT file: ${error}`);
        }
    }
}