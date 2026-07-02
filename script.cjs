const fs = require('fs');
let content = fs.readFileSync('src/components/MachineCertificatesPortfolioView.tsx', 'utf8');

// Replacements
content = content.replace(/MachineCertificate/g, 'LiftingToolCert');
content = content.replace(/Machine Certificates/g, 'Lifting Tool Certificates');
content = content.replace(/Machine Certificate/g, 'Lifting Tool Certificate');
content = content.replace(/machine certificate/g, 'lifting tool certificate');
content = content.replace(/machine_certificates_export/g, 'lifting_tool_certificates_export');
content = content.replace(/MachineCertificatesPortfolioView/g, 'LiftingToolCertificatesPortfolioView');
content = content.replace(/MachineCertificatesPortfolioProps/g, 'LiftingToolCertificatesPortfolioProps');

content = content.replace(/equipmentName/g, 'toolName');
content = content.replace(/Equipment Name/g, 'Tool Name');
content = content.replace(/inspectionDate/g, 'issueDate');
content = content.replace(/Inspection Date/g, 'Issue Date');
content = content.replace(/expirationDate/g, 'expiryDate');
content = content.replace(/Expiration Date/g, 'Expiry Date');

// Handle PrintMachineCertificatePreview prop
content = content.replace(/certificate=\{selectedCertificateDetail\}/g, 'certificate={selectedCertificateDetail as any}');

// We also need to fix initialFormState which includes loadChartData which we don't have
content = content.replace(/loadChartData: \[\]/g, '/* loadChartData: [] */');

fs.writeFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', content);
console.log('Done');
