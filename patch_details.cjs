const fs = require('fs');

const code = fs.readFileSync('src/components/MachineCertificatesPortfolioView.tsx', 'utf8');

const targetStr = `                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Recommendation`;

const insertStr = `                    <div className="md:col-span-2">
                      <LoadChartDataEditor
                        data={isEditingInDetail && editFormValues ? (editFormValues.loadChartData || []) : (certificate.loadChartData || [])}
                        onChange={(data) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, loadChartData: data });
                        }}
                        disabled={!isEditingInDetail}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Recommendation`;

let count = 0;
const newCode = code.replace(targetStr, () => {
    count++;
    return insertStr;
});

if (count === 1) {
    fs.writeFileSync('src/components/MachineCertificatesPortfolioView.tsx', newCode);
    console.log("Success Details");
} else {
    console.log("Failed Details", count);
}
