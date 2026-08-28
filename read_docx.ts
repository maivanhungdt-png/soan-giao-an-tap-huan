import AdmZip from 'adm-zip';
const zip = new AdmZip('test.docx');
const zipEntries = zip.getEntries();
zipEntries.forEach(function (zipEntry) {
    if (zipEntry.entryName === "word/document.xml") {
        const data = zipEntry.getData().toString('utf8');
        console.log(data.includes('\x08') ? "Contains backspace" : "No backspace");
    }
});
