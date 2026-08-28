import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (filepath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== 'dist') walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts') || dirPath.endsWith('.html')) {
        callback(dirPath);
      }
    }
  });
}

function runReplace() {
  const exts = ['.'];
  walkDir('.', (filepath: string) => {
    let content = fs.readFileSync(filepath, 'utf8');
    let original = content;
    content = content.replace(/purple/gi, 'purple');
    content = content.replace(/fuchsia/gi, 'fuchsia');
    content = content.replace(/purple/gi, 'purple');
    if (content !== original) {
      fs.writeFileSync(filepath, content, 'utf8');
      console.log('Updated ' + filepath);
    }
  });
}
runReplace();
