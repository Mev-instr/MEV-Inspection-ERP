const fs = require('fs');
let content = fs.readFileSync('src/components/PrintLiftingToolCertPreview.tsx', 'utf8');

// Add Color Code to Equipment Details in both templates
content = content.replace(
  /<DetailRow compact label="Reference Standard" value=\{certificate\.referenceStandard \|\| "ASME B30\.5"\} \/>/g,
  '<DetailRow compact label="Reference Standard" value={certificate.referenceStandard || "ASME B30.5"} />\n                              <DetailRow compact label="Color Code" value={certificate.colorCode} />'
);

fs.writeFileSync('src/components/PrintLiftingToolCertPreview.tsx', content);
console.log("Updated print preview");
