// MongoDB Fix Script for Scanner Documents
// Purpose: Link temporary patient ID documents to real patient ID
// Run this in MongoDB shell or MongoDB Compass

// ============================================================================
// STEP 1: VERIFY CURRENT STATE
// ============================================================================


print("\n📊 CURRENT STATE CHECK\n" + "=".repeat(50));

// Check for temp documents
print("\n🔍 Finding temp patient documents...");
const tempPatientId = "temp-586286";
const realPatientId = "12daa140-b4eb-4df6-a0d1-206fc49cbb60";

print(`\n1. PatientPDF documents with temp ID (${tempPatientId}):`);
db.patientpdfs.find({ patientId: tempPatientId }).forEach(doc => {
  print(`   - PDF ID: ${doc._id}, Title: ${doc.title || 'N/A'}`);
});

print(`\n2. PrescriptionDocument with temp ID (${tempPatientId}):`);
db.prescriptiondocuments.find({ patientId: tempPatientId }).forEach(doc => {
  print(`   - Doc ID: ${doc._id}, Date: ${doc.prescriptionDate || 'N/A'}`);
});

print(`\n3. LabReportDocument with temp ID (${tempPatientId}):`);
db.labreportdocuments.find({ patientId: tempPatientId }).forEach(doc => {
  print(`   - Doc ID: ${doc._id}, Test Type: ${doc.testType || 'N/A'}`);
});

// Check real patient exists
print(`\n4. Verify real patient exists (${realPatientId}):`);
const patient = db.patients.findOne({ _id: realPatientId });
if (patient) {
  print(`   ✅ Patient found: ${patient.firstName} ${patient.lastName}`);
} else {
  print(`   ❌ ERROR: Patient ${realPatientId} not found!`);
  print(`   STOP: Cannot link documents to non-existent patient`);
  quit();
}

// ============================================================================
// STEP 2: UPDATE DOCUMENTS
// ============================================================================

print("\n🔧 UPDATING DOCUMENTS\n" + "=".repeat(50));

// Update PatientPDF
print("\n1. Updating PatientPDF documents...");
const pdfUpdate = db.patientpdfs.updateMany(
  { patientId: tempPatientId },
  { $set: { patientId: realPatientId } }
);
print(`   ✅ Modified ${pdfUpdate.modifiedCount} PatientPDF documents`);

// Update PrescriptionDocument
print("\n2. Updating PrescriptionDocument...");
const prescUpdate = db.prescriptiondocuments.updateMany(
  { patientId: tempPatientId },
  { $set: { patientId: realPatientId } }
);
print(`   ✅ Modified ${prescUpdate.modifiedCount} PrescriptionDocument documents`);

// Update LabReportDocument
print("\n3. Updating LabReportDocument...");
const labUpdate = db.labreportdocuments.updateMany(
  { patientId: tempPatientId },
  { $set: { patientId: realPatientId } }
);
print(`   ✅ Modified ${labUpdate.modifiedCount} LabReportDocument documents`);

// Update legacy LabReport (if exists)
print("\n4. Updating legacy LabReport (if exists)...");
const legacyUpdate = db.labreports.updateMany(
  { patientId: tempPatientId },
  { $set: { patientId: realPatientId } }
);
if (legacyUpdate.modifiedCount > 0) {
  print(`   ✅ Modified ${legacyUpdate.modifiedCount} legacy LabReport documents`);
} else {
  print(`   ℹ️ No legacy LabReport documents found`);
}

// ============================================================================
// STEP 3: VERIFY UPDATE
// ============================================================================

print("\n✅ VERIFICATION\n" + "=".repeat(50));

print(`\n1. PatientPDF with real ID (${realPatientId}):`);
const pdfCount = db.patientpdfs.countDocuments({ patientId: realPatientId });
db.patientpdfs.find({ patientId: realPatientId }).forEach(doc => {
  print(`   - PDF ID: ${doc._id}, Title: ${doc.title || 'N/A'}`);
});
print(`   Total: ${pdfCount} documents`);

print(`\n2. PrescriptionDocument with real ID (${realPatientId}):`);
const prescCount = db.prescriptiondocuments.countDocuments({ patientId: realPatientId });
db.prescriptiondocuments.find({ patientId: realPatientId }).forEach(doc => {
  print(`   - Doc ID: ${doc._id}, Medicines: ${doc.medicines?.length || 0}`);
});
print(`   Total: ${prescCount} documents`);

print(`\n3. LabReportDocument with real ID (${realPatientId}):`);
const labCount = db.labreportdocuments.countDocuments({ patientId: realPatientId });
db.labreportdocuments.find({ patientId: realPatientId }).forEach(doc => {
  print(`   - Doc ID: ${doc._id}, Test: ${doc.testType || 'N/A'}, Results: ${doc.results?.length || 0}`);
});
print(`   Total: ${labCount} documents`);

print(`\n4. Check for remaining temp documents:`);
const remainingTemp = db.patientpdfs.countDocuments({ patientId: /^temp-/ }) +
                      db.prescriptiondocuments.countDocuments({ patientId: /^temp-/ }) +
                      db.labreportdocuments.countDocuments({ patientId: /^temp-/ });
if (remainingTemp === 0) {
  print(`   ✅ No temp documents remaining`);
} else {
  print(`   ⚠️ WARNING: ${remainingTemp} temp documents still exist`);
}

// ============================================================================
// SUMMARY
// ============================================================================

print("\n📊 SUMMARY\n" + "=".repeat(50));
print(`Temp Patient ID: ${tempPatientId}`);
print(`Real Patient ID: ${realPatientId}`);
print(`Documents updated:`);
print(`  - PatientPDF: ${pdfUpdate.modifiedCount}`);
print(`  - PrescriptionDocument: ${prescUpdate.modifiedCount}`);
print(`  - LabReportDocument: ${labUpdate.modifiedCount}`);
print(`  - Legacy LabReport: ${legacyUpdate.modifiedCount}`);
print(`\nDocuments now linked to real patient:`);
print(`  - PatientPDF: ${pdfCount}`);
print(`  - PrescriptionDocument: ${prescCount}`);
print(`  - LabReportDocument: ${labCount}`);
print(`\n✅ FIX COMPLETE!`);
print(`\nNext steps:`);
print(`1. Restart backend server`);
print(`2. Test in frontend:`);
print(`   - Open patient appointment preview`);
print(`   - Go to Medical Records tab`);
print(`   - Verify prescriptions and lab reports are visible`);
print("\n" + "=".repeat(50) + "\n");
