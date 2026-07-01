const fs = require('fs');
let code = fs.readFileSync('src/components/PrintMachineCertificatePreview.tsx', 'utf8');

const targetStr = `  const loadChartDataToRender = certificate.loadChartData || dummyLoadChartData;`;
const insertStr = `  const hasLoadChartData = certificate.loadChartData && certificate.loadChartData.length > 0;
  const loadChartDataToRender = hasLoadChartData ? certificate.loadChartData : [{ boom: "N/A", radius: "N/A", swl: "N/A", testLoad: "N/A" }];`;

code = code.replace(targetStr, insertStr);
fs.writeFileSync('src/components/PrintMachineCertificatePreview.tsx', code);
console.log("Success PDF");
