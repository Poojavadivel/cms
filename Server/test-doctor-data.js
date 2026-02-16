const mongoose = require('mongoose');
const User = require('./Models/User');
const Staff = require('./Models/Staff');
const Patient = require('./Models/Patient');
const Appointment = require('./Models/Appointment');

mongoose.connect('mongodb://localhost:27017/hospital_db', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ Connected to DB\n');
    
    // Find all doctors
    const doctors = await User.find({ role: 'doctor' }).select('_id firstName lastName email').lean();
    const staffDoctors = await Staff.find().select('_id name designation').lean();
    
    console.log('=== DOCTORS IN USER COLLECTION ===');
    if (doctors.length === 0) {
      console.log('⚠️  NO DOCTORS FOUND IN USER COLLECTION');
    } else {
      doctors.forEach(d => {
        console.log(`ID: ${d._id}`);
        console.log(`Name: ${d.firstName} ${d.lastName}`);
        console.log(`Email: ${d.email}\n`);
      });
    }
    
    console.log('=== DOCTORS IN STAFF COLLECTION ===');
    if (staffDoctors.length === 0) {
      console.log('⚠️  NO DOCTORS FOUND IN STAFF COLLECTION');
    } else {
      staffDoctors.forEach(d => {
        console.log(`ID: ${d._id}`);
        console.log(`Name: ${d.name}`);
        console.log(`Designation: ${d.designation}\n`);
      });
    }
    
    // Check patients
    console.log('=== CHECKING PATIENTS ===');
    const totalPatients = await Patient.countDocuments();
    console.log(`Total Patients in DB: ${totalPatients}`);
    
    const allPatients = await Patient.find().select('_id firstName lastName doctorId').limit(10).lean();
    allPatients.forEach(p => {
      console.log(`Patient: ${p.firstName} ${p.lastName}, DoctorID: ${p.doctorId || 'NULL'}`);
    });
    
    // Check appointments
    console.log('\n=== CHECKING APPOINTMENTS ===');
    const totalAppointments = await Appointment.countDocuments();
    console.log(`Total Appointments in DB: ${totalAppointments}`);
    
    const allAppointments = await Appointment.find().select('_id appointmentCode doctorId patientId status startAt').limit(10).lean();
    allAppointments.forEach(a => {
      console.log(`Appt: ${a.appointmentCode}, DoctorID: ${a.doctorId}, PatientID: ${a.patientId}, Status: ${a.status}`);
    });
    
    // Test with first doctor from User collection
    if (doctors.length > 0) {
      const testDoctorId = doctors[0]._id;
      console.log(`\n=== TESTING WITH USER DOCTOR ID: ${testDoctorId} ===`);
      
      const patientCount = await Patient.countDocuments({ doctorId: testDoctorId });
      const appointmentCount = await Appointment.countDocuments({ doctorId: testDoctorId });
      
      console.log(`✅ Patients for this doctor: ${patientCount}`);
      console.log(`✅ Appointments for this doctor: ${appointmentCount}`);
      
      if (patientCount > 0) {
        const samplePatients = await Patient.find({ doctorId: testDoctorId }).limit(3).lean();
        samplePatients.forEach(p => console.log(`   - ${p.firstName} ${p.lastName}`));
      }
    }
    
    // Test with first doctor from Staff collection
    if (staffDoctors.length > 0) {
      const testStaffId = staffDoctors[0]._id;
      console.log(`\n=== TESTING WITH STAFF DOCTOR ID: ${testStaffId} ===`);
      
      const patientCount = await Patient.countDocuments({ doctorId: testStaffId });
      const appointmentCount = await Appointment.countDocuments({ doctorId: testStaffId });
      
      console.log(`✅ Patients for this staff: ${patientCount}`);
      console.log(`✅ Appointments for this staff: ${appointmentCount}`);
      
      if (patientCount > 0) {
        const samplePatients = await Patient.find({ doctorId: testStaffId }).limit(3).lean();
        samplePatients.forEach(p => console.log(`   - ${p.firstName} ${p.lastName}`));
      }
    }
    
    // Check for orphaned data
    console.log('\n=== CHECKING FOR ORPHANED DATA ===');
    const patientsWithoutDoctor = await Patient.countDocuments({ $or: [{ doctorId: null }, { doctorId: '' }] });
    console.log(`Patients without doctor: ${patientsWithoutDoctor}`);
    
    const appointmentsWithoutDoctor = await Appointment.countDocuments({ $or: [{ doctorId: null }, { doctorId: '' }] });
    console.log(`Appointments without doctor: ${appointmentsWithoutDoctor}`);
    
    // Check unique doctorIds in Patients
    console.log('\n=== UNIQUE DOCTOR IDs IN PATIENTS ===');
    const uniqueDoctorIds = await Patient.distinct('doctorId');
    console.log(`Unique Doctor IDs: ${uniqueDoctorIds.length}`);
    uniqueDoctorIds.slice(0, 5).forEach(id => console.log(`  - ${id}`));
    
    // Check unique doctorIds in Appointments
    console.log('\n=== UNIQUE DOCTOR IDs IN APPOINTMENTS ===');
    const uniqueApptDoctorIds = await Appointment.distinct('doctorId');
    console.log(`Unique Doctor IDs: ${uniqueApptDoctorIds.length}`);
    uniqueApptDoctorIds.slice(0, 5).forEach(id => console.log(`  - ${id}`));
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
