import fs from 'fs';
import path from 'path';

function copyRecursiveSync(src: string, dest: string) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Remove old src and copy new one
fs.rmSync('./src', { recursive: true, force: true });
copyRecursiveSync('./temp_repo/src', './src');

// Copy config files
['package.json', 'vite.config.ts', 'tsconfig.json', 'index.html', 'server.ts', 'components.json', 'tailwind.config.js', 'tailwind.config.ts'].forEach(file => {
  if (fs.existsSync(path.join('./temp_repo', file))) {
    fs.copyFileSync(path.join('./temp_repo', file), path.join('./', file));
  }
});
