import * as fs from 'fs';
import { Document, Packer, Paragraph } from 'docx';

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                children: []
            })
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("test4.docx", buffer);
    console.log("Done");
});
