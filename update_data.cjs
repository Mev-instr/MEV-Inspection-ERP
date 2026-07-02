const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

content = content.replace(/loadChartData: \[[\s\S]*?\]/g, `accessoriesData: [\n      { no: 1, idNo: "WRS-01", description: "Wire Rope Sling", type: "2-Leg", swl: "5.0", sizeWidth: "12mm", length: "3.0m", color: "Red", result: "Pass", remark: "Good condition" },\n      { no: 2, idNo: "WS-02", description: "Webbing Sling", type: "Flat", swl: "3.0", sizeWidth: "90mm", length: "4.0m", color: "Yellow", result: "Pass", remark: "New" }\n    ]`);

fs.writeFileSync('src/data.ts', content);
console.log("Updated data.ts");
