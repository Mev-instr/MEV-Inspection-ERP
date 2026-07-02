const fs = require('fs');
let content = fs.readFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', 'utf8');

// Remove from Grid view
content = content.replace(/<p className="truncate"><strong className="text-slate-500 font-bold">Machine:<\/strong> \{dispMachine\}<\/p>\n/g, '');

fs.writeFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', content);
console.log("Removed dispMachine from Grid view");
