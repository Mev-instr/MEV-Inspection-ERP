const fs = require('fs');
let content = fs.readFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', 'utf8');

const colorCodeHtml = `                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Color Code
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.colorCode || "" : certificate.colorCode || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, colorCode: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700 disabled:opacity-85"
                      />
                    </div>`;

// Insert into General & Inspection Report section
content = content.replace(
  /<div>\s*<label className="block text-\[10px\] font-bold text-slate-500 uppercase tracking-widest mb-1\.5">\s*Inspection Report No\s*<\/label>/,
  colorCodeHtml + '\n                    <div>\n                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">\n                        Inspection Report No\n                      </label>'
);

// Remove the Color Code that I added earlier to Equipment Details (if it exists)
content = content.replace(
  /<div>\s*<label className="block text-\[10px\] font-bold text-slate-500 uppercase tracking-widest mb-1\.5">\s*Color Code\s*<\/label>\s*<input\s*type="text"\s*disabled=\{!isEditingInDetail\}\s*value=\{isEditingInDetail && editFormValues \? editFormValues\.colorCode \|\| "" : certificate\.colorCode \|\| ""\}\s*onChange=\{\(e\) => \{\s*if \(editFormValues\) setEditFormValues\(\{ \.\.\.editFormValues, colorCode: e\.target\.value \}\);\s*\}\}\s*className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-\[#683EFF\]\/20 focus:border-\[#683EFF\] bg-slate-50 font-semibold text-slate-700 disabled:opacity-85"\s*\/>\s*<\/div>\n\n\n\s*<div>\s*<label className="block text-\[10px\] font-bold text-slate-500 uppercase tracking-widest mb-1\.5">/,
  `<div>\n                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">`
);

fs.writeFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', content);
console.log("Fixed Color Code location");
