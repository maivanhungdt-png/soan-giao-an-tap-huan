import * as fs from 'fs';
import { Document, Packer, Table } from 'docx';

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Table({
                rows: []
            })
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("test5.docx", buffer);
    console.log("Done");
});
