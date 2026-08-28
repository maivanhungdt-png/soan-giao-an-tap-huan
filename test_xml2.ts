import * as fs from 'fs';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { XMLValidator } from 'fast-xml-parser';
import AdmZip from 'adm-zip';

async function testDocx(name: string, text: string) {
    const doc = new Document({
        sections: [{
            children: [new Paragraph({ children: [new TextRun(text)] })]
        }]
    });
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
    await testDocx("test_lt_gt.docx", "This is < and > and &.");
    await testDocx("test_html.docx", "This is <sub>sub</sub> and <sup>sup</sup>.");
    await testDocx("test_math.docx", "Math $x < y$ and $a > b$.");
}

run();
