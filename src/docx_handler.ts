import * as mammoth from 'mammoth';

export class DocxHandler {
    public static async renderDocx(docxPath: string): Promise<string> {
        try {
            const result = await mammoth.convertToHtml({ path: docxPath });
            return result.value; // The generated HTML
        } catch (error) {
            console.error('Error converting DOCX:', error);
            throw new Error(`Failed to convert DOCX file: ${error}`);
        }
    }
}