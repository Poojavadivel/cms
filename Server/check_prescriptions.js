// Query to check PrescriptionDocument collection
const mongoose = require('mongoose');
const PrescriptionDocument = require('./Models/PrescriptionDocument');

mongoose.connect('mongodb://127.0.0.1:27017/GlowHairSalonDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkPrescriptions() {
  try {
    const patientId = '16686d13-3bc9-4609-9dc5-6c9c533339c7';
    
    console.log('Checking prescriptions for patient:', patientId);
    
    const prescriptions = await PrescriptionDocument.find({ patientId: patientId });
    
    console.log('Found prescriptions:', prescriptions.length);
    
    if (prescriptions.length > 0) {
      console.log('Sample prescription:', JSON.stringify(prescriptions[0], null, 2));
    } else {
      console.log('No prescriptions found. Checking all prescriptions...');
      const allPrescriptions = await PrescriptionDocument.find({}).limit(5);
      console.log('Total prescriptions in DB:', await PrescriptionDocument.countDocuments());
      console.log('Sample prescriptions:', JSON.stringify(allPrescriptions, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkPrescriptions();
