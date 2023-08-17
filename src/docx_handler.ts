import * as mammoth from 'mammoth';

export class DocxHandler {
    public static async renderDocx(docxPath: string): Promise<string> {
        const result = await mammoth.convertToHtml({path: docxPath});
        var html = result.value; // The generated HTML
        return html;
    }
}