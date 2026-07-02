const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

// Update LiftingToolCert
content = content.replace(
  /operators\?: any\[\];/,
  `operators?: any[];\n  colorCode?: string;\n  accessoriesData?: { no: number, idNo: string, description: string, type: string, swl: string, sizeWidth: string, length: string, color: string, result: string, remark: string }[];`
);

fs.writeFileSync('src/types.ts', content);
console.log("Updated types.ts");
