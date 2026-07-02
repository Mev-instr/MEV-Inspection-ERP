const fs = require('fs');
let content = fs.readFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', 'utf8');

content = content.replace(
  /<\/select>\n                  <\/div>\n                <\/div>\n              <\/div>/,
  `</select>\n                  </div>\n                  <div>\n                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">\n                      Color Code\n                    </label>\n                    <input\n                      type="text"\n                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"\n                      value={formValues.colorCode || ""}\n                      onChange={(e) => setFormValues({ ...formValues, colorCode: e.target.value })}\n                    />\n                  </div>\n                </div>\n              </div>`
);

fs.writeFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', content);
console.log("Added color code");
