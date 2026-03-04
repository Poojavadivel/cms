/**
 * Service Routes
 * API endpoints for managing hospital services/items
 */

const express = require('express');
const router = express.Router();
const Service = require('../Models/Service');
const auth = require('../Middleware/auth');

/**
 * @route   GET /api/services
 * @desc    Get all services (with filters)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { category, isActive, search } = req.query;

    const query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by active status (default to active only)
    query.isActive = isActive === 'false' ? false : true;

    // Search by name
    if (search) {
      query.$text = { $search: search };
    }

    const services = await Service.find(query)
      .sort({ category: 1, name: 1 })
      .lean();

    // Group by category
    const grouped = services.reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    }, {});

    res.json({
      services,
      grouped,
      total: services.length
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/services/categories
 * @desc    Get all service categories with counts
 * @access  Private
 */
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Service.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/services/:id
 * @desc    Get service by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).lean();

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({ service });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/services
 * @desc    Create new service
 * @access  Private (Admin only)
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, price, description, code, taxable } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: 'Name, category, and price are required' });
    }

    const service = new Service({
      name,
      category,
      price,
      description,
      code,
      taxable,
    });

    await service.save();

    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/services/:id
 * @desc    Update service
 * @access  Private (Admin only)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const allowedUpdates = ['name', 'category', 'price', 'description', 'isActive', 'taxable'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        service[field] = req.body[field];
      }
    });

    await service.save();

    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete (deactivate) service
 * @access  Private (Admin only)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Soft delete - mark as inactive
    service.isActive = false;
    await service.save();

    res.json({
      message: 'Service deactivated successfully',
      service
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/services/seed
 * @desc    Seed initial services (for setup)
 * @access  Private (Admin only)
 */
router.post('/seed/initial', auth, async (req, res) => {
  try {
    const existingCount = await Service.countDocuments();
    
    if (existingCount > 0) {
      return res.status(400).json({ message: 'Services already exist. Use regular create endpoint.' });
    }

    // Comprehensive hospital services based on industry standards
    const initialServices = [
      // ========== CONSULTATIONS (Doctor Fees) ==========
      { name: 'General Physician Consultation', category: 'Consultation', price: 500, description: 'Basic consultation with general physician', taxable: true },
      { name: 'Specialist Doctor Consultation', category: 'Consultation', price: 1000, description: 'Consultation with specialist (Cardiologist, Neurologist, etc.)', taxable: true },
      { name: 'Senior Consultant Consultation', category: 'Consultation', price: 1500, description: 'Senior consultant with 15+ years experience', taxable: true },
      { name: 'Emergency Consultation', category: 'Consultation', price: 2000, description: 'Emergency doctor consultation 24/7', taxable: true },
      { name: 'Follow-up Consultation', category: 'Consultation', price: 300, description: 'Follow-up visit within 15 days', taxable: true },
      { name: 'Pediatric Consultation', category: 'Consultation', price: 800, description: 'Child specialist consultation', taxable: true },
      { name: 'Gynecology Consultation', category: 'Consultation', price: 900, description: 'Women health specialist', taxable: true },
      { name: 'Dental Consultation', category: 'Consultation', price: 600, description: 'Dentist consultation', taxable: true },
      { name: 'Orthopedic Consultation', category: 'Consultation', price: 1000, description: 'Bone and joint specialist', taxable: true },
      { name: 'Dermatology Consultation', category: 'Consultation', price: 800, description: 'Skin specialist consultation', taxable: true },
      { name: 'Ophthalmology Consultation', category: 'Consultation', price: 700, description: 'Eye specialist consultation', taxable: true },
      { name: 'ENT Consultation', category: 'Consultation', price: 700, description: 'Ear, Nose, Throat specialist', taxable: true },
      { name: 'Psychiatrist Consultation', category: 'Consultation', price: 1200, description: 'Mental health specialist', taxable: true },
      { name: 'Physiotherapy Consultation', category: 'Consultation', price: 600, description: 'Physical therapy specialist', taxable: true },
      { name: 'Dietitian Consultation', category: 'Consultation', price: 500, description: 'Nutrition and diet planning', taxable: true },
      { name: 'Video Consultation', category: 'Consultation', price: 400, description: 'Online doctor consultation', taxable: true },

      // ========== PROCEDURES (Diagnostic & Treatment) ==========
      { name: 'ECG (Electrocardiogram)', category: 'Procedures', price: 300, description: 'Heart electrical activity test', taxable: false },
      { name: 'EEG (Electroencephalogram)', category: 'Procedures', price: 1500, description: 'Brain activity test', taxable: false },
      { name: 'X-Ray - Chest PA View', category: 'Procedures', price: 800, description: 'Chest X-ray scan', taxable: false },
      { name: 'X-Ray - Abdomen', category: 'Procedures', price: 900, description: 'Abdominal X-ray', taxable: false },
      { name: 'X-Ray - Spine', category: 'Procedures', price: 1000, description: 'Spinal column X-ray', taxable: false },
      { name: 'X-Ray - Knee/Joint', category: 'Procedures', price: 700, description: 'Joint X-ray imaging', taxable: false },
      { name: 'Ultrasound - Abdomen', category: 'Procedures', price: 1500, description: 'Abdominal ultrasound scan', taxable: false },
      { name: 'Ultrasound - Pelvis', category: 'Procedures', price: 1500, description: 'Pelvic ultrasound scan', taxable: false },
      { name: 'Ultrasound - Pregnancy', category: 'Procedures', price: 1800, description: 'Prenatal ultrasound', taxable: false },
      { name: 'Ultrasound - Whole Abdomen', category: 'Procedures', price: 2000, description: 'Complete abdominal scan', taxable: false },
      { name: 'CT Scan - Head', category: 'Procedures', price: 5000, description: 'Brain CT scan', taxable: false },
      { name: 'CT Scan - Chest', category: 'Procedures', price: 5500, description: 'Thoracic CT scan', taxable: false },
      { name: 'CT Scan - Abdomen', category: 'Procedures', price: 6000, description: 'Abdominal CT scan', taxable: false },
      { name: 'MRI Scan - Brain', category: 'Procedures', price: 8000, description: 'Brain MRI imaging', taxable: false },
      { name: 'MRI Scan - Spine', category: 'Procedures', price: 8500, description: 'Spinal MRI imaging', taxable: false },
      { name: 'MRI Scan - Joints', category: 'Procedures', price: 7500, description: 'Joint MRI imaging', taxable: false },
      { name: 'Endoscopy - Upper GI', category: 'Procedures', price: 5000, description: 'Upper gastrointestinal endoscopy', taxable: false },
      { name: 'Colonoscopy', category: 'Procedures', price: 6000, description: 'Large intestine examination', taxable: false },
      { name: 'Bronchoscopy', category: 'Procedures', price: 7000, description: 'Airway examination', taxable: false },
      { name: 'Echocardiography (2D Echo)', category: 'Procedures', price: 2500, description: 'Heart ultrasound', taxable: false },
      { name: 'Stress Test (TMT)', category: 'Procedures', price: 2000, description: 'Treadmill test for heart', taxable: false },
      { name: 'Holter Monitoring - 24hr', category: 'Procedures', price: 3000, description: '24-hour heart monitoring', taxable: false },
      { name: 'Spirometry (PFT)', category: 'Procedures', price: 1000, description: 'Lung function test', taxable: false },
      { name: 'Mammography', category: 'Procedures', price: 2500, description: 'Breast cancer screening', taxable: false },
      { name: 'Bone Density Scan (DEXA)', category: 'Procedures', price: 2000, description: 'Osteoporosis screening', taxable: false },
      { name: 'Nebulization', category: 'Procedures', price: 150, description: 'Breathing treatment', taxable: true },
      { name: 'Oxygen Therapy - Per Hour', category: 'Procedures', price: 100, description: 'Oxygen support', taxable: true },
      { name: 'IV Cannulation', category: 'Procedures', price: 200, description: 'Intravenous line insertion', taxable: true },
      { name: 'Catheterization - Urinary', category: 'Procedures', price: 500, description: 'Bladder catheter insertion', taxable: true },
      { name: 'Ryles Tube Insertion', category: 'Procedures', price: 600, description: 'Nasogastric tube insertion', taxable: true },
      { name: 'Wound Dressing - Simple', category: 'Procedures', price: 200, description: 'Basic wound care', taxable: true },
      { name: 'Wound Dressing - Complex', category: 'Procedures', price: 500, description: 'Advanced wound care', taxable: true },
      { name: 'Suture Removal', category: 'Procedures', price: 300, description: 'Stitch removal', taxable: true },
      { name: 'Injection - Intramuscular', category: 'Procedures', price: 100, description: 'IM injection administration', taxable: true },
      { name: 'Injection - Intravenous', category: 'Procedures', price: 150, description: 'IV injection administration', taxable: true },
      { name: 'Blood Transfusion - Per Unit', category: 'Procedures', price: 1500, description: 'Blood unit transfusion', taxable: true },
      { name: 'Dialysis - Hemodialysis', category: 'Procedures', price: 3000, description: 'Kidney dialysis session', taxable: false },
      { name: 'Dialysis - Peritoneal', category: 'Procedures', price: 2500, description: 'Peritoneal dialysis', taxable: false },
      { name: 'Minor Surgery - Excision', category: 'Procedures', price: 10000, description: 'Small tissue removal', taxable: false },
      { name: 'Minor Surgery - Incision & Drainage', category: 'Procedures', price: 8000, description: 'Abscess drainage', taxable: false },
      { name: 'Biopsy - Tissue', category: 'Procedures', price: 5000, description: 'Tissue sample collection', taxable: false },
      { name: 'Ear Syringing', category: 'Procedures', price: 500, description: 'Ear wax removal', taxable: true },
      { name: 'Foreign Body Removal', category: 'Procedures', price: 1000, description: 'Remove foreign objects', taxable: true },

      // ========== MEDICATIONS (Common Drugs & Supplies) ==========
      { name: 'Paracetamol 500mg - Strip (10 tablets)', category: 'Medication', price: 20, description: 'Pain & fever relief', taxable: false },
      { name: 'Paracetamol 650mg - Strip (10 tablets)', category: 'Medication', price: 25, description: 'High dose pain relief', taxable: false },
      { name: 'Ibuprofen 400mg - Strip (10 tablets)', category: 'Medication', price: 30, description: 'Anti-inflammatory', taxable: false },
      { name: 'Amoxicillin 500mg - Strip (10 capsules)', category: 'Medication', price: 80, description: 'Antibiotic', taxable: false },
      { name: 'Azithromycin 500mg - Strip (5 tablets)', category: 'Medication', price: 120, description: 'Antibiotic', taxable: false },
      { name: 'Ciprofloxacin 500mg - Strip (10 tablets)', category: 'Medication', price: 100, description: 'Antibiotic', taxable: false },
      { name: 'Cefixime 200mg - Strip (10 tablets)', category: 'Medication', price: 150, description: 'Antibiotic', taxable: false },
      { name: 'Omeprazole 20mg - Strip (10 capsules)', category: 'Medication', price: 60, description: 'Acid reducer', taxable: false },
      { name: 'Pantoprazole 40mg - Strip (10 tablets)', category: 'Medication', price: 80, description: 'Acid reducer', taxable: false },
      { name: 'Ranitidine 150mg - Strip (10 tablets)', category: 'Medication', price: 40, description: 'Antacid', taxable: false },
      { name: 'Cetirizine 10mg - Strip (10 tablets)', category: 'Medication', price: 30, description: 'Antihistamine', taxable: false },
      { name: 'Levocetirizine 5mg - Strip (10 tablets)', category: 'Medication', price: 50, description: 'Antihistamine', taxable: false },
      { name: 'Montelukast 10mg - Strip (10 tablets)', category: 'Medication', price: 120, description: 'Asthma medication', taxable: false },
      { name: 'Salbutamol Inhaler', category: 'Medication', price: 200, description: 'Asthma inhaler', taxable: false },
      { name: 'Cough Syrup - 100ml', category: 'Medication', price: 90, description: 'Cough suppressant', taxable: false },
      { name: 'Multivitamin - Strip (10 tablets)', category: 'Medication', price: 150, description: 'Daily vitamins', taxable: false },
      { name: 'Vitamin D3 - Strip (10 capsules)', category: 'Medication', price: 200, description: 'Vitamin D supplement', taxable: false },
      { name: 'Calcium Tablets - Strip (10)', category: 'Medication', price: 100, description: 'Calcium supplement', taxable: false },
      { name: 'Iron Tablets - Strip (10)', category: 'Medication', price: 80, description: 'Iron supplement', taxable: false },
      { name: 'IV Fluids - Normal Saline 500ml', category: 'Medication', price: 150, description: 'IV fluid bottle', taxable: false },
      { name: 'IV Fluids - DNS 500ml', category: 'Medication', price: 160, description: 'Dextrose saline IV', taxable: false },
      { name: 'IV Fluids - RL 500ml', category: 'Medication', price: 170, description: 'Ringers lactate IV', taxable: false },
      { name: 'Insulin - Actrapid 10ml Vial', category: 'Medication', price: 500, description: 'Short-acting insulin', taxable: false },
      { name: 'Insulin - Mixtard 10ml Vial', category: 'Medication', price: 550, description: 'Mixed insulin', taxable: false },
      { name: 'Metformin 500mg - Strip (10 tablets)', category: 'Medication', price: 40, description: 'Diabetes medication', taxable: false },
      { name: 'Glimepiride 1mg - Strip (10 tablets)', category: 'Medication', price: 60, description: 'Diabetes medication', taxable: false },
      { name: 'Amlodipine 5mg - Strip (10 tablets)', category: 'Medication', price: 50, description: 'Blood pressure medication', taxable: false },
      { name: 'Atenolol 50mg - Strip (10 tablets)', category: 'Medication', price: 45, description: 'Blood pressure medication', taxable: false },
      { name: 'Losartan 50mg - Strip (10 tablets)', category: 'Medication', price: 80, description: 'Blood pressure medication', taxable: false },
      { name: 'Aspirin 75mg - Strip (14 tablets)', category: 'Medication', price: 30, description: 'Blood thinner', taxable: false },
      { name: 'Clopidogrel 75mg - Strip (10 tablets)', category: 'Medication', price: 100, description: 'Blood thinner', taxable: false },
      { name: 'Atorvastatin 10mg - Strip (10 tablets)', category: 'Medication', price: 90, description: 'Cholesterol medication', taxable: false },
      { name: 'Prednisolone 5mg - Strip (10 tablets)', category: 'Medication', price: 50, description: 'Steroid', taxable: false },
      { name: 'Diclofenac 50mg - Strip (10 tablets)', category: 'Medication', price: 40, description: 'Pain relief', taxable: false },
      { name: 'Tramadol 50mg - Strip (10 tablets)', category: 'Medication', price: 120, description: 'Strong pain relief', taxable: false },
      { name: 'Oral Rehydration Salts (ORS) - Sachet', category: 'Medication', price: 10, description: 'Electrolyte solution', taxable: false },
      { name: 'Antacid Syrup - 200ml', category: 'Medication', price: 80, description: 'Stomach acid relief', taxable: false },
      { name: 'Eye Drops - Antibiotic', category: 'Medication', price: 120, description: 'Eye infection drops', taxable: false },
      { name: 'Ear Drops - Antibiotic', category: 'Medication', price: 100, description: 'Ear infection drops', taxable: false },

      // ========== LAB TESTS (Pathology & Diagnostics) ==========
      { name: 'Complete Blood Count (CBC)', category: 'Lab Tests', price: 400, description: 'Full blood analysis', taxable: false },
      { name: 'Hemoglobin (Hb)', category: 'Lab Tests', price: 100, description: 'Hemoglobin level test', taxable: false },
      { name: 'Blood Sugar - Fasting (FBS)', category: 'Lab Tests', price: 100, description: 'Fasting glucose test', taxable: false },
      { name: 'Blood Sugar - Random (RBS)', category: 'Lab Tests', price: 100, description: 'Random glucose test', taxable: false },
      { name: 'Blood Sugar - Post Prandial (PPBS)', category: 'Lab Tests', price: 120, description: 'Post-meal glucose', taxable: false },
      { name: 'HbA1c (Glycated Hemoglobin)', category: 'Lab Tests', price: 600, description: '3-month diabetes control', taxable: false },
      { name: 'Lipid Profile', category: 'Lab Tests', price: 600, description: 'Cholesterol & triglycerides', taxable: false },
      { name: 'Liver Function Test (LFT)', category: 'Lab Tests', price: 800, description: 'Liver enzymes panel', taxable: false },
      { name: 'Kidney Function Test (KFT)', category: 'Lab Tests', price: 800, description: 'Kidney function panel', taxable: false },
      { name: 'Thyroid Profile - T3, T4, TSH', category: 'Lab Tests', price: 600, description: 'Thyroid function test', taxable: false },
      { name: 'TSH - Single Test', category: 'Lab Tests', price: 250, description: 'Thyroid stimulating hormone', taxable: false },
      { name: 'Vitamin D - 25-OH', category: 'Lab Tests', price: 1200, description: 'Vitamin D level', taxable: false },
      { name: 'Vitamin B12', category: 'Lab Tests', price: 800, description: 'B12 level test', taxable: false },
      { name: 'Serum Calcium', category: 'Lab Tests', price: 300, description: 'Calcium level test', taxable: false },
      { name: 'Serum Creatinine', category: 'Lab Tests', price: 200, description: 'Kidney function marker', taxable: false },
      { name: 'Blood Urea Nitrogen (BUN)', category: 'Lab Tests', price: 200, description: 'Kidney function test', taxable: false },
      { name: 'Uric Acid', category: 'Lab Tests', price: 250, description: 'Gout screening test', taxable: false },
      { name: 'Electrolytes (Na, K, Cl)', category: 'Lab Tests', price: 500, description: 'Electrolyte panel', taxable: false },
      { name: 'C-Reactive Protein (CRP)', category: 'Lab Tests', price: 500, description: 'Inflammation marker', taxable: false },
      { name: 'ESR (Erythrocyte Sedimentation Rate)', category: 'Lab Tests', price: 150, description: 'Inflammation test', taxable: false },
      { name: 'Prothrombin Time (PT/INR)', category: 'Lab Tests', price: 400, description: 'Blood clotting test', taxable: false },
      { name: 'Dengue NS1 Antigen', category: 'Lab Tests', price: 800, description: 'Dengue early detection', taxable: false },
      { name: 'Dengue IgG/IgM', category: 'Lab Tests', price: 1000, description: 'Dengue antibody test', taxable: false },
      { name: 'Malaria Antigen Test', category: 'Lab Tests', price: 400, description: 'Malaria rapid test', taxable: false },
      { name: 'Typhoid (Widal Test)', category: 'Lab Tests', price: 300, description: 'Typhoid fever test', taxable: false },
      { name: 'COVID-19 RT-PCR', category: 'Lab Tests', price: 1500, description: 'COVID molecular test', taxable: false },
      { name: 'COVID-19 Rapid Antigen', category: 'Lab Tests', price: 500, description: 'COVID quick test', taxable: false },
      { name: 'HIV Test (ELISA)', category: 'Lab Tests', price: 800, description: 'HIV screening', taxable: false },
      { name: 'Hepatitis B (HBsAg)', category: 'Lab Tests', price: 500, description: 'Hepatitis B screening', taxable: false },
      { name: 'Hepatitis C (HCV)', category: 'Lab Tests', price: 800, description: 'Hepatitis C screening', taxable: false },
      { name: 'VDRL/RPR (Syphilis)', category: 'Lab Tests', price: 400, description: 'Syphilis screening', taxable: false },
      { name: 'Pregnancy Test (Urine)', category: 'Lab Tests', price: 200, description: 'Pregnancy detection', taxable: false },
      { name: 'Beta HCG (Blood)', category: 'Lab Tests', price: 600, description: 'Pregnancy hormone test', taxable: false },
      { name: 'Urine Analysis (Routine)', category: 'Lab Tests', price: 200, description: 'Complete urine test', taxable: false },
      { name: 'Urine Culture & Sensitivity', category: 'Lab Tests', price: 800, description: 'Urine infection test', taxable: false },
      { name: 'Stool Analysis (Routine)', category: 'Lab Tests', price: 200, description: 'Stool examination', taxable: false },
      { name: 'Stool Culture', category: 'Lab Tests', price: 700, description: 'Stool infection test', taxable: false },
      { name: 'Blood Culture', category: 'Lab Tests', price: 1200, description: 'Blood infection test', taxable: false },
      { name: 'Sputum Culture', category: 'Lab Tests', price: 800, description: 'Respiratory infection test', taxable: false },
      { name: 'Pap Smear', category: 'Lab Tests', price: 1000, description: 'Cervical cancer screening', taxable: false },
      { name: 'Semen Analysis', category: 'Lab Tests', price: 800, description: 'Male fertility test', taxable: false },
      { name: 'PSA (Prostate Specific Antigen)', category: 'Lab Tests', price: 1000, description: 'Prostate cancer screening', taxable: false },
      { name: 'CA 125 (Ovarian Cancer Marker)', category: 'Lab Tests', price: 1500, description: 'Ovarian cancer screening', taxable: false },
      { name: 'CEA (Cancer Marker)', category: 'Lab Tests', price: 1500, description: 'Cancer screening marker', taxable: false },
      { name: 'AFP (Alpha Fetoprotein)', category: 'Lab Tests', price: 1200, description: 'Liver cancer marker', taxable: false },
      { name: 'Ferritin', category: 'Lab Tests', price: 800, description: 'Iron storage test', taxable: false },
      { name: 'Troponin I/T', category: 'Lab Tests', price: 1500, description: 'Heart attack marker', taxable: false },
      { name: 'D-Dimer', category: 'Lab Tests', price: 1200, description: 'Blood clot screening', taxable: false },
      { name: 'Rheumatoid Factor (RF)', category: 'Lab Tests', price: 600, description: 'Arthritis screening', taxable: false },
      { name: 'ANA (Antinuclear Antibody)', category: 'Lab Tests', price: 1000, description: 'Autoimmune screening', taxable: false },

      // ========== ROOM CHARGES (Accommodation) ==========
      { name: 'General Ward - Per Day', category: 'Room Charges', price: 1000, description: 'Shared room accommodation', taxable: false },
      { name: 'Semi-Private Room - Per Day', category: 'Room Charges', price: 2000, description: '2-bed room', taxable: false },
      { name: 'Private Room (Deluxe) - Per Day', category: 'Room Charges', price: 3500, description: 'Single room with AC', taxable: false },
      { name: 'Private Suite - Per Day', category: 'Room Charges', price: 5000, description: 'Suite with attendant bed', taxable: false },
      { name: 'ICU (General) - Per Day', category: 'Room Charges', price: 5000, description: 'Intensive care unit', taxable: false },
      { name: 'ICU (Ventilator) - Per Day', category: 'Room Charges', price: 8000, description: 'ICU with ventilator', taxable: false },
      { name: 'ICCU (Cardiac ICU) - Per Day', category: 'Room Charges', price: 7000, description: 'Cardiac intensive care', taxable: false },
      { name: 'NICU (Neonatal ICU) - Per Day', category: 'Room Charges', price: 6000, description: 'Newborn intensive care', taxable: false },
      { name: 'PICU (Pediatric ICU) - Per Day', category: 'Room Charges', price: 6500, description: 'Child intensive care', taxable: false },
      { name: 'Emergency Observation Bed - Per Day', category: 'Room Charges', price: 1500, description: 'Emergency monitoring', taxable: false },
      { name: 'Day Care Bed - Per Session', category: 'Room Charges', price: 1000, description: 'Short procedure room', taxable: false },
      { name: 'Labor Room - Normal Delivery', category: 'Room Charges', price: 15000, description: 'Normal delivery charges', taxable: false },
      { name: 'Labor Room - C-Section', category: 'Room Charges', price: 35000, description: 'Cesarean delivery', taxable: false },
      { name: 'Operation Theater - Minor', category: 'Room Charges', price: 10000, description: 'Minor surgery OT charges', taxable: false },
      { name: 'Operation Theater - Major', category: 'Room Charges', price: 25000, description: 'Major surgery OT charges', taxable: false },
      { name: 'Recovery Room - Per Hour', category: 'Room Charges', price: 500, description: 'Post-op recovery', taxable: false },
      { name: 'Isolation Room - Per Day', category: 'Room Charges', price: 4000, description: 'Infection isolation room', taxable: false },
      { name: 'Attendant Charges - Per Day', category: 'Room Charges', price: 300, description: 'Patient attendant bed', taxable: true },
      { name: 'AC Charges - Per Day', category: 'Room Charges', price: 500, description: 'Air conditioning charges', taxable: true },
    ];

    const services = await Service.insertMany(initialServices);

    res.status(201).json({
      message: `${services.length} comprehensive hospital services seeded successfully`,
      count: services.length,
      breakdown: {
        'Consultation': services.filter(s => s.category === 'Consultation').length,
        'Procedures': services.filter(s => s.category === 'Procedures').length,
        'Medication': services.filter(s => s.category === 'Medication').length,
        'Lab Tests': services.filter(s => s.category === 'Lab Tests').length,
        'Room Charges': services.filter(s => s.category === 'Room Charges').length,
      }
    });
  } catch (error) {
    console.error('Error seeding services:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
