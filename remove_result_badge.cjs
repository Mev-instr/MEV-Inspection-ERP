const fs = require('fs');
let content = fs.readFileSync('src/components/PrintLiftingToolCertPreview.tsx', 'utf8');

// Remove Result Badge
content = content.replace(/\{\/\* Result Badge \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* Other Badges \*\/\}/g, '{/* Other Badges */}');

fs.writeFileSync('src/components/PrintLiftingToolCertPreview.tsx', content);
console.log("Removed Result Badge");
