const fs = require('fs');
let content = fs.readFileSync('src/components/PrintLiftingToolCertPreview.tsx', 'utf8');

// Replace standard load chart data with accessories data handling
content = content.replace(
  /const hasLoadChartData = certificate\.loadChartData && certificate\.loadChartData\.length > 0;\n  const loadChartDataToRender = hasLoadChartData \? certificate\.loadChartData : \[\{ boom: "N\/A", radius: "N\/A", swl: "N\/A", testLoad: "N\/A" \}\];/g,
  `const hasAccessoriesData = certificate.accessoriesData && certificate.accessoriesData.length > 0;\n  const accessoriesDataToRender = hasAccessoriesData ? certificate.accessoriesData : [{ no: 1, idNo: "N/A", description: "N/A", type: "N/A", swl: "N/A", sizeWidth: "N/A", length: "N/A", color: "N/A", result: "N/A", remark: "N/A" }];`
);

// We need to replace both occurrences of the load chart tables
const accessoriesTableHtml = `
                              <div className="flex bg-[#001c3d] text-white text-[10px] font-bold text-center uppercase">
                                 <div className="py-2 px-1 border-r border-white/20 w-6">No</div>
                                 <div className="flex-1 py-2 px-1 border-r border-white/20">ID No/TAG</div>
                                 <div className="flex-[2] py-2 px-1 border-r border-white/20">Description</div>
                                 <div className="flex-[1] py-2 px-1 border-r border-white/20">Type</div>
                                 <div className="flex-[1] py-2 px-1 border-r border-white/20">S.W.L</div>
                                 <div className="flex-[1] py-2 px-1 border-r border-white/20">Size/Width</div>
                                 <div className="flex-[1] py-2 px-1 border-r border-white/20">Length</div>
                                 <div className="flex-[1] py-2 px-1 border-r border-white/20">Color</div>
                                 <div className="flex-[1] py-2 px-1 border-r border-white/20">Result</div>
                                 <div className="flex-[1] py-2 px-1">Remark</div>
                              </div>
                              {accessoriesDataToRender.map((row, i) => (
                                <div key={i} className="flex border-b border-slate-200 last:border-0 text-[10px] text-slate-700 text-center font-medium bg-slate-50 break-words">
                                   <div className="py-1.5 px-1 border-r border-slate-200 w-6 flex items-center justify-center">{row.no}</div>
                                   <div className="flex-1 py-1.5 px-1 border-r border-slate-200 flex items-center justify-center break-all">{row.idNo}</div>
                                   <div className="flex-[2] py-1.5 px-1 border-r border-slate-200 flex items-center justify-center">{row.description}</div>
                                   <div className="flex-[1] py-1.5 px-1 border-r border-slate-200 flex items-center justify-center">{row.type}</div>
                                   <div className="flex-[1] py-1.5 px-1 border-r border-slate-200 flex items-center justify-center">{row.swl}</div>
                                   <div className="flex-[1] py-1.5 px-1 border-r border-slate-200 flex items-center justify-center">{row.sizeWidth}</div>
                                   <div className="flex-[1] py-1.5 px-1 border-r border-slate-200 flex items-center justify-center">{row.length}</div>
                                   <div className="flex-[1] py-1.5 px-1 border-r border-slate-200 flex items-center justify-center">{row.color}</div>
                                   <div className="flex-[1] py-1.5 px-1 border-r border-slate-200 flex items-center justify-center">{row.result}</div>
                                   <div className="flex-[1] py-1.5 px-1 flex items-center justify-center">{row.remark}</div>
                                </div>
                              ))}
`;

content = content.replace(
  /<div className="flex bg-\[#001c3d\] text-white text-\[10px\] font-bold text-center uppercase">[\s\S]*?<\/div>[\s]*?\{loadChartDataToRender\.map\(\(row, i\) => \([\s\S]*?<\/div>\)[\s]*?\)\}/g,
  accessoriesTableHtml
);

fs.writeFileSync('src/components/PrintLiftingToolCertPreview.tsx', content);
console.log("Updated print preview");
