import AdmZip from 'adm-zip';
const zip = new AdmZip('test2.docx');
const zipEntries = zip.getEntries();
zipEntries.forEach(function (zipEntry) {
    if (zipEntry.entryName === "word/document.xml") {
        const data = zipEntry.getData().toString('utf8');
        console.log(data.includes('&lt;') ? "Escaped <" : "Not escaped <");
        console.log(data.includes('&gt;') ? "Escaped >" : "Not escaped >");
        console.log(data.includes('&amp;') ? "Escaped &" : "Not escaped &");
    }
});
