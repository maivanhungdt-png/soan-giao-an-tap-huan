import * as fs from 'fs';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                children: [
                    new TextRun("This is a test with < and > and &."),
                ],
            }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("test2.docx", buffer);
    console.log("Done");
});
