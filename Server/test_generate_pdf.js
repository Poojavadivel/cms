const properPdfGen = require('./utils/properPdfGenerator');
const PdfPrinter = require('pdfmake');
const vfsFonts = require('pdfmake/build/vfs_fonts');
const fs = require('fs');

const mockPatient = {
    _id: '123456789012345678901234',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    age: 34,
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '1234567890',
    email: 'john@example.com',
    address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        pincode: '10001'
    },
    vitals: {
        bp: '120/80',
        pulse: 72,
        temp: 36.6,
        spo2: 98,
        heightCm: 180,
        weightKg: 80,
        bmi: 24.7
    },
    allergies: ['Peanuts'],
    prescriptions: [],
    notes: 'Test notes'
};

const mockDoctor = {
    name: 'Jane Smith',
    specialization: 'Cardiology'
};

const mockAppointments = [];

try {
    const docDefinition = properPdfGen.generatePatientReport(mockPatient, mockDoctor, mockAppointments);

    const printer = new PdfPrinter({
        Roboto: {
            normal: Buffer.from(vfsFonts['Roboto-Regular.ttf'], 'base64'),
            bold: Buffer.from(vfsFonts['Roboto-Medium.ttf'], 'base64'),
            italics: Buffer.from(vfsFonts['Roboto-Italic.ttf'], 'base64'),
            bolditalics: Buffer.from(vfsFonts['Roboto-MediumItalic.ttf'], 'base64')
        }
    });

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const writeStream = fs.createWriteStream('test_report.pdf');
    pdfDoc.pipe(writeStream);
    pdfDoc.end();

    writeStream.on('finish', () => {
        console.log('✅ PDF generated successfully to test_report.pdf');
        process.exit(0);
    });

    writeStream.on('error', (err) => {
        console.error('❌ WriteStream error:', err);
        process.exit(1);
    });

} catch (error) {
    console.error('❌ PDF generation failed:', error);
    process.exit(1);
}
