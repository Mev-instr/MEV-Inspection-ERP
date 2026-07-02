const fs = require('fs');
let content = fs.readFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', 'utf8');

// Remove from Add Modal
content = content.replace(/<div>\s*<label[^>]*>\s*Tool Name \*\s*<\/label>[\s\S]*?<\/div>\s*(?=<div>\s*<label[^>]*>\s*Sticker Number\s*<\/label>)/g, '');
content = content.replace(/<div>\s*<label[^>]*>\s*Result\s*<\/label>[\s\S]*?<\/div>\s*(?=<div>\s*<label[^>]*>\s*Validity\s*<\/label>)/g, '');
content = content.replace(/<div className="md:col-span-2">\s*<label[^>]*>\s*Recommendation\s*<\/label>[\s\S]*?<\/div>\s*(?=<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<div className="border-t border-slate-100 p-6 flex justify-end gap-3 bg-slate-50">)/g, '');

// Remove from Detail Modal (if any)
content = content.replace(/<div>\s*<label[^>]*>\s*Tool Name\s*<\/label>[\s\S]*?<\/div>\s*(?=<div>\s*<label[^>]*>\s*Sticker Number\s*<\/label>)/g, '');
content = content.replace(/<div>\s*<label[^>]*>\s*Result\s*<\/label>[\s\S]*?<\/div>\s*(?=<div>\s*<label[^>]*>\s*Validity\s*<\/label>)/g, '');
content = content.replace(/<div className="md:col-span-2">\s*<label[^>]*>\s*Recommendation\s*<\/label>[\s\S]*?<\/div>\s*(?=<\/div>\s*<\/div>\s*<\/div>\s*<!-- 2\. Timeline and comments double column layout -->)/g, '');

fs.writeFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', content);
console.log("Replaced fields");
