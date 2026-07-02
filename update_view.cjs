const fs = require('fs');
let content = fs.readFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', 'utf8');

content = content.replace(
  /status: "Scheduled" as const\n    \/\* loadChartData: \[\] \*\//,
  'status: "Scheduled" as const,\n    colorCode: "",\n    accessoriesData: [] as { no: number, idNo: string, description: string, type: string, swl: string, sizeWidth: string, length: string, color: string, result: string, remark: string }[]'
);

content = content.replace(
  /colorCode: formValues\.colorCode,/,
  ''
);
content = content.replace(
  /accessoriesData: formValues\.accessoriesData,/,
  ''
);

content = content.replace(
  /status: formValues\.status,/,
  'status: formValues.status,\n      colorCode: formValues.colorCode,\n      accessoriesData: formValues.accessoriesData,'
);

fs.writeFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', content);
console.log("Updated view init");
