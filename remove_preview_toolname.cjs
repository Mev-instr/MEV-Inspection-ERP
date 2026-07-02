const fs = require('fs');
let content = fs.readFileSync('src/components/PrintLiftingToolCertPreview.tsx', 'utf8');

// Remove from DetailRow
content = content.replace(/<DetailRow compact label="Tool Name" value=\{certificate\.toolName\} \/>\n/g, '');

// Remove from CheckList page
content = content.replace(/<div className="col-span-2 mb-2">[\s\S]*?<\/div>\s*<div className="col-span-2 h-px bg-slate-200 mb-2"><\/div>\n/g, '');

fs.writeFileSync('src/components/PrintLiftingToolCertPreview.tsx', content);
console.log("Removed Tool Name from preview");
