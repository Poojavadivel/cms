const vfsFonts = require('./node_modules/pdfmake/build/vfs_fonts');
console.log('Keys in vfsFonts:', Object.keys(vfsFonts || {}));
console.log('Type of vfsFonts:', typeof vfsFonts);
if (vfsFonts && vfsFonts.pdfMake) {
    console.log('Keys in vfsFonts.pdfMake.vfs:', Object.keys(vfsFonts.pdfMake.vfs || {}));
}
