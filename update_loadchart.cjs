const fs = require('fs');
let content = fs.readFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', 'utf8');

content = content.replace(/import \{ LoadChartDataEditor \} from "\.\/LoadChartDataEditor";/, 'import { AccessoriesDataEditor } from "./AccessoriesDataEditor";');

// Replace in detail view
content = content.replace(
  /<LoadChartDataEditor\n                        data=\{isEditingInDetail && editFormValues \? \(editFormValues\.loadChartData \|\| \[\]\) : \(certificate\.loadChartData \|\| \[\]\)\}\n                        onChange=\{\(data\) => \{\n                          if \(editFormValues\) setEditFormValues\(\{ \.\.\.editFormValues, loadChartData: data \}\);\n                        \}\}\n                        disabled=\{!isEditingInDetail\}\n                      \/>/g,
  `<AccessoriesDataEditor\n                        data={isEditingInDetail && editFormValues ? (editFormValues.accessoriesData || []) : (certificate.accessoriesData || [])}\n                        onChange={(data) => {\n                          if (editFormValues) setEditFormValues({ ...editFormValues, accessoriesData: data });\n                        }}\n                        disabled={!isEditingInDetail}\n                      />`
);

// Replace in Add modal view
content = content.replace(
  /<LoadChartDataEditor\n                      data=\{formValues\.loadChartData \|\| \[\]\}\n                      onChange=\{\(data\) => setFormValues\(\{ \.\.\.formValues, loadChartData: data \}\)\}\n                    \/>/g,
  `<AccessoriesDataEditor\n                      data={formValues.accessoriesData || []}\n                      onChange={(data) => setFormValues({ ...formValues, accessoriesData: data })}\n                    />`
);

fs.writeFileSync('src/components/LiftingToolCertificatesPortfolioView.tsx', content);
console.log("Replaced LoadChartDataEditor");
