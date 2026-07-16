import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf8');

// Remove duplicate hasAccount
content = content.replace(/\n\s*hasAccount\?: boolean;/g, '');

// Put back exactly one hasAccount for each
content = content.replace(
  /export interface EmployeeDetail \{/,
  'export interface EmployeeDetail {\n  hasAccount?: boolean;'
);
content = content.replace(
  /export interface CustomerDetail \{/,
  'export interface CustomerDetail {\n  hasAccount?: boolean;'
);

fs.writeFileSync('src/types.ts', content);
