const fs = require('fs');
let content = fs.readFileSync('src/components/PrintLiftingToolCertPreview.tsx', 'utf8');

// Remove Recommendation Box
content = content.replace(/\{\/\* Recommendation Box \*\/\}[\s\S]*?<\/div>\s*<\/div>/g, '');

fs.writeFileSync('src/components/PrintLiftingToolCertPreview.tsx', content);
console.log("Removed Recommendation Box");
