/**
 * scanner/documentController.js
 * Controllers for document retrieval endpoints
 */

const { PrescriptionDocument, LabReportDocument, MedicalHistoryDocument, PatientPDF } = require('../../Models');

/**
 * GET /prescriptions/:patientId - Get all prescriptions for patient
 */
async function getPatientPrescriptions(req, res) {
  try {
    const { patientId } = req.params;
    console.log(`[PRESCRIPTIONS] 📋 Fetching prescriptions for patient: ${patientId}`);

    const prescriptions = await PrescriptionDocument.find({ patientId })
      .sort({ dateTime: -1, uploadDate: -1 })
      .lean();

    console.log(`[PRESCRIPTIONS] ✅ Found ${prescriptions.length} prescriptions`);

    return res.json({
      success: true,
      prescriptions: prescriptions
    });
  } catch (error) {
    console.error('[PRESCRIPTIONS] ❌ Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      prescriptions: []
    });
  }
}

/**
 * GET /lab-reports/:patientId - Get all lab reports for patient
 */
async function getPatientLabReports(req, res) {
  try {
    const { patientId } = req.params;
    console.log(`[LAB_REPORTS] 📋 Fetching lab reports for patient: ${patientId}`);

    const labReports = await LabReportDocument.find({ patientId })
      .sort({ reportDate: -1, uploadDate: -1 })
      .lean();

    console.log(`[LAB_REPORTS] ✅ Found ${labReports.length} reports`);

    return res.json({
      success: true,
      reports: labReports,
      labReports: labReports
    });
  } catch (error) {
    console.error('[LAB_REPORTS] ❌ Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      labReports: []
    });
  }
}

/**
 * GET /medical-history/:patientId - Get all medical history for patient
 */
async function getPatientMedicalHistory(req, res) {
  try {
    const { patientId } = req.params;
    console.log(`[MEDICAL_HISTORY] 📋 Fetching medical history for patient: ${patientId}`);

    const medicalHistory = await MedicalHistoryDocument.find({ patientId })
      .sort({ recordDate: -1, uploadDate: -1 })
      .lean();

    console.log(`[MEDICAL_HISTORY] ✅ Found ${medicalHistory.length} records`);

    medicalHistory.forEach((record, idx) => {
      console.log(`[MEDICAL_HISTORY] Record ${idx + 1}:`, {
        _id: record._id,
        title: record.title,
        medicalHistory: record.medicalHistory?.substring(0, 50),
        recordDate: record.recordDate,
        category: record.category,
        pdfId: record.pdfId
      });
    });

    return res.json({
      success: true,
      medicalHistory: medicalHistory
    });
  } catch (error) {
    console.error('[MEDICAL_HISTORY] ❌ Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      medicalHistory: []
    });
  }
}

/**
 * GET /pdf-public/:pdfId - Get PDF document (public access)
 */
async function getPublicPDF(req, res) {
  try {
    const { pdfId } = req.params;
    const pdf = await PatientPDF.findById(pdfId);

    if (!pdf) {
      return res.status(404).json({ success: false, message: 'PDF not found' });
    }

    res.setHeader('Content-Type', pdf.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${pdf.fileName}"`);
    res.send(pdf.data);
  } catch (error) {
    console.error('[PDF] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getPatientPrescriptions,
  getPatientLabReports,
  getPatientMedicalHistory,
  getPublicPDF
};
