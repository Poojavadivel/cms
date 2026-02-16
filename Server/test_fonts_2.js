const vfsFonts = require('./node_modules/pdfmake/build/vfs_fonts');
const fontKey = 'Roboto-Regular.ttf';
console.log(`Type of ${fontKey}:`, typeof vfsFonts[fontKey]);
if (typeof vfsFonts[fontKey] === 'string') {
    console.log(`First 50 chars of ${fontKey}:`, vfsFonts[fontKey].substring(0, 50));
}
