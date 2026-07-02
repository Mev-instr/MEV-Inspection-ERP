const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

// The replacement was done on the first match of "operators?: any[];". Let's put it correctly in LiftingToolCert.
// First remove what was added:
content = content.replace(/colorCode\?: string;\n  accessoriesData\?: \{ no: number, idNo: string, description: string, type: string, swl: string, sizeWidth: string, length: string, color: string, result: string, remark: string \}\[\];/g, '');

// Now replace ONLY inside LiftingToolCert:
const startIndex = content.indexOf('export interface LiftingToolCert {');
const endIndex = content.indexOf('}', startIndex);
const section = content.substring(startIndex, endIndex);

const newSection = section.replace(/operators\?: any\[\];/, `operators?: any[];\n  colorCode?: string;\n  accessoriesData?: { no: number, idNo: string, description: string, type: string, swl: string, sizeWidth: string, length: string, color: string, result: string, remark: string }[];`);

content = content.substring(0, startIndex) + newSection + content.substring(endIndex);

fs.writeFileSync('src/types.ts', content);
console.log("Fixed types.ts");
