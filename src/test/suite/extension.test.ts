import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { DocxHandler } from '../../docx_handler';
import { OdtHandler } from '../../odt_handler';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });

    test('Empty DOCX renders as empty HTML', async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'docx-viewer-'));
        const emptyDocxPath = path.join(tempDir, 'empty.docx');
        await fs.writeFile(emptyDocxPath, Buffer.alloc(0));

        const html = await DocxHandler.renderDocx(vscode.Uri.file(emptyDocxPath));
        assert.strictEqual(html, '');
    });

    test('Empty ODT renders as empty HTML', async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'docx-viewer-'));
        const emptyOdtPath = path.join(tempDir, 'empty.odt');
        await fs.writeFile(emptyOdtPath, Buffer.alloc(0));

        const html = await OdtHandler.renderOdt(vscode.Uri.file(emptyOdtPath));
        assert.strictEqual(html, '');
    });
});
