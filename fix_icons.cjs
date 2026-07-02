const fs = require('fs');
let content = fs.readFileSync('src/components/AccessoriesDataEditor.tsx', 'utf8');

content = content.replace(/import \{ Icons \} from "\.\/Icons";/, 'import * as Icons from "lucide-react";');

fs.writeFileSync('src/components/AccessoriesDataEditor.tsx', content);
console.log("Fixed Icons import");
