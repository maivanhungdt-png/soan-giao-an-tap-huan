import AdmZip from 'adm-zip';

const zip = new AdmZip('test_control.docx');
const xmlStr = zip.getEntry("word/document.xml")!.getData().toString('utf8');

const invalidChars = xmlStr.match(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g);
if (invalidChars) {
    console.log("Found invalid XML 1.0 characters:", invalidChars.map(c => c.charCodeAt(0).toString(16)));
} else {
    console.log("No invalid characters.");
}
