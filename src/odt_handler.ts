const odt2html = require('odt2html');

export class OdtHandler {
    public static async renderOdt(odtPath: string): Promise<string> {
        // the odt2html returns promise
        return await odt2html.toHTML({
            path: odtPath
        });
    }
}