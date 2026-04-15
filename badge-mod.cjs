const fs = require('fs');
const filePath = 'D:/wholesale pooja/frontend/src/components/ui/badge.tsx';
let txt = fs.readFileSync(filePath, 'utf8');

txt = txt.replace('value.includes("OVERDUE") || value.includes("CANCELLED")', 'value.includes("OVERDUE") || value.includes("CANCELLED") || value.includes("NOT_DELIVERED")');
txt = txt.replace('value.includes("DONE") || value.includes("DELIVERED")', 'value === "DONE" || value === "DELIVERED"');

fs.writeFileSync(filePath, txt);
