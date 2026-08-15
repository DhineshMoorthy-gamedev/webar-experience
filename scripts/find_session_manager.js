import fs from 'fs';
import path from 'path';

const xrPath = path.resolve('public/libs/8thwall/xr.js');
let content = fs.readFileSync(xrPath, 'utf8');

// Find f= and S= in session manager runner
const idx = content.indexOf('Session manager');
console.log('Session manager log snippet:\n', content.substring(idx - 200, idx + 400));
