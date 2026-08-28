import * as fs from 'fs';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                children: [
                    new TextRun("This is a test with \x08 control char."),
                ],
            }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("test.docx", buffer);
    console.log("Done");
});
