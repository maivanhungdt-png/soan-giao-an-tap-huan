import * as fs from 'fs';
import { Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun } from 'docx';

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Table({
                rows: [
                    new TableRow({
                        children: []
                    })
                ]
            })
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("test3.docx", buffer);
    console.log("Done");
});
