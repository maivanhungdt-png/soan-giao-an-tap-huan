import AdmZip from 'adm-zip';
const zip = new AdmZip('test3.docx');
const zipEntries = zip.getEntries();
zipEntries.forEach(function (zipEntry) {
    if (zipEntry.entryName === "word/document.xml") {
        console.log(zipEntry.getData().toString('utf8'));
    }
});
