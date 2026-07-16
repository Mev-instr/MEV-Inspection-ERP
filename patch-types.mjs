import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf8');
content = content.replace(
  /export interface EmployeeDetail \{/,
  'export interface EmployeeDetail {\n  firebaseUid?: string;\n  hasAccount?: boolean;\n  portalEmail?: string;'
);
content = content.replace(
  /export interface CustomerDetail \{/,
  'export interface CustomerDetail {\n  firebaseUid?: string;\n  hasAccount?: boolean;\n  portalEmail?: string;'
);
fs.writeFileSync('src/types.ts', content);
