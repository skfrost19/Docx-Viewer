const odt2html = require('odt2html');

export class OdtHandler {
    public static async renderOdt(odtPath: string): Promise<string> {
        try {
            // The odt2html returns promise
            const html = await odt2html.toHTML({
                path: odtPath
            });
            return html;
        } catch (error) {
            console.error('Error converting ODT:', error);
            throw new Error(`Failed to convert ODT file: ${error}`);
        }
    }
}