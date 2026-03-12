/**
 * scanner/verificationController.js
 * Controllers for verification endpoints
 */

const { ScannedDataVerification, PrescriptionDocument, LabReportDocument, MedicalHistoryDocument } = require('../../Models');

/**
 * GET /verification/:verificationId - Get verification details
 */
async function getVerification(req, res) {
  try {
    const { verificationId } = req.params;
    const verification = await ScannedDataVerification.findById(verificationId).lean();

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }

    return res.json({ success: true, verification });
  } catch (error) {
    console.error('[VERIFICATION] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /verification/patient/:patientId - Get all verifications for patient
 */
async function getPatientVerifications(req, res) {
  try {
    const { patientId } = req.params;
    const verifications = await ScannedDataVerification.find({ patientId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, verifications });
  } catch (error) {
    console.error('[VERIFICATION] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /verification/:verificationId/row/:rowIndex - Update verification row
 */
async function updateVerificationRow(req, res) {
  try {
    const { verificationId, rowIndex } = req.params;
    const { currentValue } = req.body;

    const verification = await ScannedDataVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }

    const index = parseInt(rowIndex);
    if (index < 0 || index >= verification.dataRows.length) {
      return res.status(400).json({ success: false, message: 'Invalid row index' });
    }

    verification.dataRows[index].currentValue = currentValue;
    verification.dataRows[index].isEdited = true;
    await verification.save();

    return res.json({ success: true, message: 'Row updated', dataRows: verification.dataRows });
  } catch (error) {
    console.error('[VERIFICATION] Update error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /verification/:verificationId/row/:rowIndex - Delete verification row
 */
async function deleteVerificationRow(req, res) {
  try {
    const { verificationId, rowIndex } = req.params;

    const verification = await ScannedDataVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }

    const index = parseInt(rowIndex);
    if (index < 0 || index >= verification.dataRows.length) {
      return res.status(400).json({ success: false, message: 'Invalid row index' });
    }

    verification.dataRows.splice(index, 1);
    await verification.save();

    return res.json({ success: true, message: 'Row deleted', dataRows: verification.dataRows });
  } catch (error) {
    console.error('[VERIFICATION] Delete error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /verification/:verificationId/confirm - Confirm and save verified data
 */
async function confirmVerification(req, res) {
  try {
    const { verificationId } = req.params;
    const verification = await ScannedDataVerification.findById(verificationId);

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }

    // Build final data object from rows
    const finalData = {};
    verification.dataRows.forEach(row => {
      finalData[row.fieldName] = row.currentValue;
    });

    // Save to appropriate collection based on document type
    let savedDoc;
    if (verification.documentType === 'PRESCRIPTION') {
      savedDoc = await PrescriptionDocument.create({
        patientId: verification.patientId,
        pdfId: verification.pdfId,
        prescriptionSummary: finalData.prescription_summary,
        dateTime: finalData.date_time,
        hospital: finalData.hospital,
        doctor: finalData.doctor,
        medicalNotes: finalData.medical_notes,
        rawData: verification.extractedData
      });
    } else if (verification.documentType === 'LAB_REPORT') {
      savedDoc = await LabReportDocument.create({
        patientId: verification.patientId,
        pdfId: verification.pdfId,
        testType: finalData.testType,
        testCategory: finalData.testCategory,
        labName: finalData.labName,
        reportDate: finalData.reportDate,
        doctorName: finalData.doctorName,
        results: Object.keys(finalData).filter(k => k.startsWith('labResult_')).map(k => finalData[k]),
        interpretation: finalData.interpretation,
        notes: finalData.notes,
        rawData: verification.extractedData
      });
    } else if (verification.documentType === 'MEDICAL_HISTORY') {
      savedDoc = await MedicalHistoryDocument.create({
        patientId: verification.patientId,
        pdfId: verification.pdfId,
        medicalType: finalData.medical_type,
        medicalHistory: finalData.medical_summary,
        recordDate: finalData.date,
        hospital: finalData.hospital,
        doctor: finalData.doctor,
        rawData: verification.extractedData
      });
    }

    // Mark verification as confirmed
    verification.verificationStatus = 'confirmed';
    verification.confirmedAt = new Date();
    verification.confirmedBy = req.user?._id;
    await verification.save();

    return res.json({
      success: true,
      message: 'Verification confirmed and data saved',
      documentId: savedDoc._id,
      documentType: verification.documentType
    });
  } catch (error) {
    console.error('[VERIFICATION] Confirm error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /verification/:verificationId/reject - Reject verification
 */
async function rejectVerification(req, res) {
  try {
    const { verificationId } = req.params;
    const { reason } = req.body;

    const verification = await ScannedDataVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }

    verification.verificationStatus = 'rejected';
    verification.rejectedAt = new Date();
    verification.rejectedBy = req.user?._id;
    verification.rejectionReason = reason;
    await verification.save();

    return res.json({ success: true, message: 'Verification rejected' });
  } catch (error) {
    console.error('[VERIFICATION] Reject error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getVerification,
  getPatientVerifications,
  updateVerificationRow,
  deleteVerificationRow,
  confirmVerification,
  rejectVerification
};
