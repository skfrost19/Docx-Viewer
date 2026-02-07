import * as mammoth from 'mammoth';
import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class DocxHandler {
    public static async renderDocx(uri: vscode.Uri): Promise<string> {
        try {
            console.log('DocxHandler: Rendering URI:', uri.toString(), 'Scheme:', uri.scheme);

            let buffer: Buffer;

            // Handle git: scheme specially
            if (uri.scheme === 'git') {
                try {
                    buffer = await this.readFromGit(uri);
                    console.log('DocxHandler: Read from git, size:', buffer.length);
                } catch (gitError) {
                    console.error('DocxHandler: Git read failed:', gitError);
                    // Fallback to workspace.fs
                    const fileData = await vscode.workspace.fs.readFile(uri);
                    buffer = Buffer.from(fileData);
                    console.log('DocxHandler: Fallback to workspace.fs, size:', buffer.length);
                }
            } else if (uri.scheme === 'file') {
                // For file scheme, read directly from filesystem
                try {
                    const fileBuffer = await fs.readFile(uri.fsPath);
                    buffer = fileBuffer;
                    console.log('DocxHandler: Read from filesystem, size:', buffer.length);
                } catch (fsError) {
                    console.error('DocxHandler: Filesystem read failed, trying workspace.fs:', fsError);
                    const fileData = await vscode.workspace.fs.readFile(uri);
                    buffer = Buffer.from(fileData);
                }
            } else {
                // For other schemes, use workspace.fs
                console.log('DocxHandler: Non-file/non-git scheme, using workspace.fs');
                const fileData = await vscode.workspace.fs.readFile(uri);
                buffer = Buffer.from(fileData);
                console.log('DocxHandler: Read from workspace.fs, size:', buffer.length);
            }

            if (buffer.length === 0) {
                return '<section style="padding: 20px; color: var(--vscode-descriptionForeground);">Empty Document</section>';
            }

            // Check for Git LFS signature (only check if it looks like text)
            if (buffer.length < 1000) {
                try {
                    const header = buffer.toString('utf8');
                    if (header.startsWith('version https://git-lfs')) {
                        return '<section style="padding: 20px; color: var(--vscode-descriptionForeground); font-style: italic;">Git LFS Pointer File - Original content not available</section>';
                    }
                } catch (e) {
                    // Not UTF-8 text, continue with binary processing
                }
            }

            // Try to convert - let mammoth handle validation
            console.log('DocxHandler: Converting with mammoth');
            const result = await mammoth.convertToHtml({ buffer: buffer });
            console.log('DocxHandler: Conversion successful, HTML length:', result.value?.length || 0);
            return result.value ?? ''; // The generated HTML
        } catch (error) {
            console.error('DocxHandler: Error converting DOCX:', error);
            console.error('DocxHandler: URI was:', uri.toString());
            // Return a graceful fallback instead of throwing
            return '<section style="padding: 20px; color: var(--vscode-descriptionForeground);">Unable to render document content (may be corrupted or incompatible format)</section>';
        }
    }

    private static async readFromGit(uri: vscode.Uri): Promise<Buffer> {
        // Parse the git URI query string to extract path and ref
        const query = uri.query;
        if (!query) {
            throw new Error('Git URI missing query parameters');
        }

        let gitInfo: { path: string; ref: string };
        try {
            gitInfo = JSON.parse(decodeURIComponent(query));
        } catch (e) {
            throw new Error('Failed to parse git URI query: ' + e);
        }

        const filePath = gitInfo.path;
        const ref = gitInfo.ref || 'HEAD';

        // Get the git repository root
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
        if (!workspaceFolder) {
            throw new Error('File not in workspace');
        }

        // Convert ref "~" to "HEAD"
        const gitRef = ref === '~' ? 'HEAD' : ref;

        // Get relative path from workspace root
        const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);

        console.log('DocxHandler: Reading from git - ref:', gitRef, 'path:', relativePath, 'cwd:', workspaceFolder.uri.fsPath);

        // Use git show to get the content
        try {
            const { stdout } = await execFileAsync('git', ['show', `${gitRef}:${relativePath}`], {
                cwd: workspaceFolder.uri.fsPath,
                encoding: 'buffer',
                maxBuffer: 50 * 1024 * 1024 // 50MB max
            });

            return stdout as Buffer;
        } catch (error: any) {
            // If git show fails, it might be a new file - return empty
            if (error.code === 128 || error.stderr?.includes('does not exist')) {
                console.log('DocxHandler: File does not exist in ref', gitRef, '- treating as new file');
                return Buffer.alloc(0);
            }
            throw error;
        }
    }
}