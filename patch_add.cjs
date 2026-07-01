const fs = require('fs');

const code = fs.readFileSync('src/components/MachineCertificatesPortfolioView.tsx', 'utf8');

const targetStr = `                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Recommendation`;

const insertStr = `                  <div className="md:col-span-2">
                    <LoadChartDataEditor
                      data={formValues.loadChartData || []}
                      onChange={(data) => setFormValues({ ...formValues, loadChartData: data })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Recommendation`;

let count = 0;
const newCode = code.replace(targetStr, () => {
    count++;
    return insertStr;
});

if (count === 1) {
    fs.writeFileSync('src/components/MachineCertificatesPortfolioView.tsx', newCode);
    console.log("Success Add");
} else {
    console.log("Failed Add", count);
}
