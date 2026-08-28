import * as fs from 'fs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } from 'docx';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import AdmZip from 'adm-zip';

async function testDocx(name: string, doc: Document) {
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(name, buffer);
    
    const zip = new AdmZip(buffer);
    const xmlEntry = zip.getEntry("word/document.xml");
    if (xmlEntry) {
        const xmlStr = xmlEntry.getData().toString('utf8');
        const isValid = XMLValidator.validate(xmlStr);
        if (isValid === true) {
            console.log(`${name}: XML is valid`);
        } else {
            console.log(`${name}: XML IS INVALID!`, isValid);
        }
    }
}

async function run() {
    // Test 1: Control characters
    await testDocx("test_control.docx", new Document({
        sections: [{
            children: [new Paragraph({ children: [new TextRun("Test \x08 control")] })]
        }]
    }));

    // Test 2: Empty table row
    await testDocx("test_empty_row.docx", new Document({
        sections: [{
            children: [new Table({
                rows: [new TableRow({ children: [] })]
            })]
        }]
    }));

    // Test 3: Empty table cell
    await testDocx("test_empty_cell.docx", new Document({
        sections: [{
            children: [new Table({
                rows: [new TableRow({ children: [new TableCell({ children: [] })] })]
            })]
        }]
    }));
}

run();
