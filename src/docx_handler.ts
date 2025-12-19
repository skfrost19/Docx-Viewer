import * as mammoth from 'mammoth';
import * as fs from 'fs/promises';

export class DocxHandler {
    public static async renderDocx(docxPath: string): Promise<string> {
        try {
            const stat = await fs.stat(docxPath);
            if (stat.size === 0) {
                return '';
            }
            const result = await mammoth.convertToHtml({ path: docxPath });
            return result.value ?? ''; // The generated HTML
        } catch (error) {
            console.error('Error converting DOCX:', error);
            throw new Error(`Failed to convert DOCX file: ${error}`);
        }
    }
}