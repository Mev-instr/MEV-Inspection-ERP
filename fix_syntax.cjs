const fs = require('fs');
let content = fs.readFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', 'utf8');

content = content.replace(
  'status: "Scheduled" as const,\n    /* loadChartData: [] */,',
  'status: "Scheduled" as const\n    /* loadChartData: [] */'
);
content = content.replace(
  'interface LiftingToolCertsPortfolioProps',
  'interface LiftingToolCertificatesPortfolioProps'
);
content = content.replace(
  'export function LiftingToolCertsPortfolioView({ certificates, onCertificatesChange, inspectionReports = [], onUploadImage }: LiftingToolCertsPortfolioProps)',
  'export function LiftingToolCertificatesPortfolioView({ certificates, onCertificatesChange, inspectionReports = [], onUploadImage }: LiftingToolCertificatesPortfolioProps)'
);

content = content.replace(
  'toolName: report.toolName || report.assetTested || "",',
  'toolName: report.equipmentName || report.assetTested || "",'
);
content = content.replace(
  'issueDate: report.issueDate || report.testDate || "",',
  'issueDate: report.inspectionDate || report.testDate || "",'
);
content = content.replace(
  'expiryDate: report.expiryDate || "",',
  'expiryDate: report.expirationDate || "",'
);
content = content.replace(
  'if (report.expiryDate) {\n      const expDate = new Date(report.expiryDate);',
  'if (report.expirationDate) {\n      const expDate = new Date(report.expirationDate);'
);

content = content.replace(/PrintMachineCertificatePreview/g, 'PrintLiftingToolCertPreview');

fs.writeFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', content);
console.log('Fixed syntax and names');
