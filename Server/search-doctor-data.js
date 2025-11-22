const mongoose = require('mongoose');
const Patient = require('./Models/Patient');
const Appointment = require('./Models/Appointment');
const User = require('./Models/User');
const Staff = require('./Models/Staff');

mongoose.connect('mongodb://localhost:27017/hospital_db', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Get doctor ID from command line argument or use first doctor found
    let doctorId = process.argv[2];
    
    if (!doctorId) {
      console.log('⚠️  No doctor ID provided. Searching for first doctor...\n');
      
      // Try to find a doctor in User collection
      const userDoctor = await User.findOne({ role: 'doctor' }).lean();
      if (userDoctor) {
        doctorId = userDoctor._id.toString();
        console.log(`Found doctor in User collection: ${userDoctor.firstName} ${userDoctor.lastName}`);
        console.log(`Doctor ID: ${doctorId}\n`);
      } else {
        // Try Staff collection
        const staffDoctor = await Staff.findOne().lean();
        if (staffDoctor) {
          doctorId = staffDoctor._id.toString();
          console.log(`Found doctor in Staff collection: ${staffDoctor.name}`);
          console.log(`Doctor ID: ${doctorId}\n`);
        } else {
          console.log('❌ No doctors found in database!');
          process.exit(1);
        }
      }
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🔍 SEARCHING FOR DATA WITH DOCTOR ID: ${doctorId}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Search Patients collection
    console.log('📋 SEARCHING PATIENTS COLLECTION...');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const patients = await Patient.find({ doctorId: doctorId }).lean();
    console.log(`✅ Found ${patients.length} patients with doctorId: ${doctorId}\n`);
    
    if (patients.length > 0) {
      patients.slice(0, 10).forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.firstName} ${p.lastName}`);
        console.log(`   Patient ID: ${p._id}`);
        console.log(`   Age: ${p.age || 'N/A'}, Gender: ${p.gender || 'N/A'}`);
        console.log(`   Blood Group: ${p.bloodGroup || 'N/A'}`);
        console.log(`   Phone: ${p.phone || 'N/A'}`);
        console.log(`   Doctor ID: ${p.doctorId}`);
        console.log('');
      });
      
      if (patients.length > 10) {
        console.log(`... and ${patients.length - 10} more patients\n`);
      }
    } else {
      console.log('⚠️  No patients found with this doctorId\n');
      
      // Check if any patients exist at all
      const totalPatients = await Patient.countDocuments();
      console.log(`   Total patients in database: ${totalPatients}`);
      
      if (totalPatients > 0) {
        console.log('\n   Sample patient doctorId values:');
        const samplePatients = await Patient.find().select('firstName lastName doctorId').limit(5).lean();
        samplePatients.forEach(p => {
          console.log(`   - ${p.firstName} ${p.lastName}: doctorId = ${p.doctorId || 'NULL'}`);
        });
      }
      console.log('');
    }
    
    // 2. Search Appointments collection
    console.log('📅 SEARCHING APPOINTMENTS COLLECTION...');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const appointments = await Appointment.find({ doctorId: doctorId })
      .populate('patientId', 'firstName lastName')
      .lean();
    
    console.log(`✅ Found ${appointments.length} appointments with doctorId: ${doctorId}\n`);
    
    if (appointments.length > 0) {
      appointments.slice(0, 10).forEach((apt, idx) => {
        const patientName = apt.patientId 
          ? `${apt.patientId.firstName} ${apt.patientId.lastName}` 
          : 'Unknown Patient';
        
        console.log(`${idx + 1}. ${apt.appointmentCode || 'No Code'}`);
        console.log(`   Patient: ${patientName}`);
        console.log(`   Date: ${apt.startAt ? new Date(apt.startAt).toLocaleString() : 'N/A'}`);
        console.log(`   Status: ${apt.status || 'N/A'}`);
        console.log(`   Type: ${apt.appointmentType || 'N/A'}`);
        console.log(`   Doctor ID: ${apt.doctorId}`);
        console.log('');
      });
      
      if (appointments.length > 10) {
        console.log(`... and ${appointments.length - 10} more appointments\n`);
      }
      
      // Statistics
      const completed = appointments.filter(a => a.status === 'Completed').length;
      const scheduled = appointments.filter(a => a.status === 'Scheduled').length;
      const cancelled = appointments.filter(a => a.status === 'Cancelled').length;
      
      console.log('📊 APPOINTMENT STATISTICS:');
      console.log(`   Total: ${appointments.length}`);
      console.log(`   Completed: ${completed}`);
      console.log(`   Scheduled: ${scheduled}`);
      console.log(`   Cancelled: ${cancelled}\n`);
    } else {
      console.log('⚠️  No appointments found with this doctorId\n');
      
      // Check if any appointments exist at all
      const totalAppointments = await Appointment.countDocuments();
      console.log(`   Total appointments in database: ${totalAppointments}`);
      
      if (totalAppointments > 0) {
        console.log('\n   Sample appointment doctorId values:');
        const sampleAppointments = await Appointment.find().select('appointmentCode doctorId').limit(5).lean();
        sampleAppointments.forEach(a => {
          console.log(`   - ${a.appointmentCode}: doctorId = ${a.doctorId || 'NULL'}`);
        });
      }
      console.log('');
    }
    
    // 3. Check for data in prescriptions array
    console.log('💊 SEARCHING PRESCRIPTIONS IN PATIENTS...');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const patientsWithPrescriptions = await Patient.find({
      'prescriptions.doctorId': doctorId
    }).lean();
    
    console.log(`✅ Found ${patientsWithPrescriptions.length} patients with prescriptions from this doctor\n`);
    
    if (patientsWithPrescriptions.length > 0) {
      patientsWithPrescriptions.slice(0, 5).forEach((p, idx) => {
        const prescriptions = p.prescriptions.filter(rx => rx.doctorId === doctorId);
        console.log(`${idx + 1}. ${p.firstName} ${p.lastName}`);
        console.log(`   Prescriptions: ${prescriptions.length}`);
        console.log('');
      });
    }
    
    // 4. Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY FOR DOCTOR ID: ' + doctorId);
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`✅ Patients assigned: ${patients.length}`);
    console.log(`✅ Total appointments: ${appointments.length}`);
    console.log(`✅ Patients with prescriptions: ${patientsWithPrescriptions.length}\n`);
    
    if (patients.length === 0 && appointments.length === 0) {
      console.log('❌ NO DATA FOUND FOR THIS DOCTOR ID!');
      console.log('\nPossible reasons:');
      console.log('1. Wrong doctor ID is being used');
      console.log('2. Patients/appointments not linked to this doctor');
      console.log('3. Data exists but uses different doctor ID');
      console.log('\n💡 TIP: Check frontend to see which doctor ID is being sent\n');
    } else {
      console.log('✅ DATA FOUND! Report should generate successfully.\n');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database Error:', err.message);
    process.exit(1);
  });
