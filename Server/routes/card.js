// routes/card.js
// Dedicated route for fetching patient profile card data
const express = require('express');
const { Patient } = require('../Models');
const auth = require('../Middleware/Auth');
const router = express.Router();

/**
 * GET /api/card/:patientId
 * Fetch optimized data for patient profile card display
 * Returns only the fields needed for the profile card component
 */
router.get('/:patientId', auth, async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    console.log('📇 [PROFILE CARD] Fetching data for patient:', patientId);

    // Fetch patient with only required fields for profile card (including age)
    const patient = await Patient.findById(patientId)
      .select('firstName lastName age dateOfBirth gender bloodGroup phone address vitals metadata')
      .lean();

    if (!patient || patient.deleted_at) {
      console.log('❌ [PROFILE CARD] Patient not found:', patientId);
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found', 
        errorCode: 4001 
      });
    }

    console.log('✅ [PROFILE CARD] Patient found:', patient._id);
    console.log('   Has vitals:', !!patient.vitals);
    if (patient.vitals) {
      console.log('   Vitals:', JSON.stringify(patient.vitals));
    }

    // Use stored age if available, otherwise calculate from dateOfBirth
    let age = patient.age || 0;
    if (!age && patient.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(patient.dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      console.log('📅 [PROFILE CARD] Calculated age from DOB:', age);
    } else if (age) {
      console.log('✅ [PROFILE CARD] Using stored age:', age);
    }

    // Extract patientCode from metadata
    const patientCode = patient.metadata?.patientCode || 
                       patient.metadata?.patient_code || 
                       `PAT-${patient._id.slice(-6).toUpperCase()}`;

    // Build optimized response for profile card
    const cardData = {
      patientId: patient._id,
      name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      age: age,
      gender: patient.gender || '',
      bloodGroup: patient.bloodGroup || 'O+',
      phone: patient.phone || '',
      patientCode: patientCode,
      
      // Address - include nested object
      address: patient.address || {},
      
      // For backward compatibility, also send flat address fields
      city: patient.address?.city || '',
      pincode: patient.address?.pincode || '',
      
      // Vitals - extract from vitals object
      vitals: {
        height: patient.vitals?.heightCm || null,
        weight: patient.vitals?.weightKg || null,
        bmi: patient.vitals?.bmi || null,
        spo2: patient.vitals?.spo2 || null,
        bp: patient.vitals?.bp || null,
        temp: patient.vitals?.temp || null,
        pulse: patient.vitals?.pulse || null,
      },
      
      // For backward compatibility, also send flat fields
      height: patient.vitals?.heightCm?.toString() || '',
      weight: patient.vitals?.weightKg?.toString() || '',
      bmi: patient.vitals?.bmi?.toString() || '',
      oxygen: patient.vitals?.spo2?.toString() || '',
    };

    console.log('📤 [PROFILE CARD] Sending card data with vitals:', {
      patientId: cardData.patientId,
      hasVitals: !!(cardData.vitals.height || cardData.vitals.weight),
      height: cardData.vitals.height,
      weight: cardData.vitals.weight,
      bmi: cardData.vitals.bmi,
      spo2: cardData.vitals.spo2,
    });

    return res.status(200).json({
      success: true,
      data: cardData,
    });
  } catch (err) {
    console.error('❌ [PROFILE CARD] Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile card data', 
      errorCode: 5000,
      detail: err.message,
    });
  }
});

module.exports = router;
