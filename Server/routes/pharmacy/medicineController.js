/**
 * pharmacy/medicineController.js
 * Controller for medicine CRUD operations
 */

const { Medicine } = require('../../Models');
const { requireAdminOrPharmacist, ensureModel } = require('./middleware');
const { toNumberOrNull, maybeNull, buildMedicineSearchQuery } = require('./utils');
const config = require('./config');

/**
 * POST /medicines
 * Create a new medicine
 */
async function createMedicine(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;

    const { name, genericName, category, manufacturer, dosageForm, strength, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Medicine name is required', 
        errorCode: config.ERROR_CODES.VALIDATION_ERROR 
      });
    }

    const medicine = new Medicine({
      name: name.trim(),
      genericName: maybeNull(genericName),
      category: maybeNull(category),
      manufacturer: maybeNull(manufacturer),
      dosageForm: maybeNull(dosageForm),
      strength: maybeNull(strength),
      description: maybeNull(description),
    });

    await medicine.save();
    console.log('✅ [MEDICINE CREATE] Medicine created:', medicine._id);

    return res.status(201).json({ success: true, medicine });
  } catch (err) {
    console.error('❌ [MEDICINE CREATE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create medicine' });
  }
}

/**
 * GET /medicines
 * List all medicines with optional search
 */
async function getMedicines(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;

    const { search } = req.query;
    let query = {};

    if (search && search.trim()) {
      query = buildMedicineSearchQuery(search);
    }

    const medicines = await Medicine.find(query).sort({ name: 1 }).lean();
    return res.status(200).json({ success: true, medicines });
  } catch (err) {
    console.error('❌ [MEDICINE LIST] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch medicines' });
  }
}

/**
 * GET /medicines/:id
 * Get single medicine by ID
 */
async function getMedicineById(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;

    const { id } = req.params;
    const medicine = await Medicine.findById(id).lean();

    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found', 
        errorCode: config.ERROR_CODES.NOT_FOUND 
      });
    }

    return res.status(200).json({ success: true, medicine });
  } catch (err) {
    console.error('❌ [MEDICINE GET] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch medicine' });
  }
}

/**
 * PUT /medicines/:id
 * Update medicine
 */
async function updateMedicine(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;

    const { id } = req.params;
    const { name, genericName, category, manufacturer, dosageForm, strength, description } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (genericName !== undefined) updateData.genericName = maybeNull(genericName);
    if (category !== undefined) updateData.category = maybeNull(category);
    if (manufacturer !== undefined) updateData.manufacturer = maybeNull(manufacturer);
    if (dosageForm !== undefined) updateData.dosageForm = maybeNull(dosageForm);
    if (strength !== undefined) updateData.strength = maybeNull(strength);
    if (description !== undefined) updateData.description = maybeNull(description);

    const medicine = await Medicine.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found', 
        errorCode: config.ERROR_CODES.NOT_FOUND 
      });
    }

    console.log('✅ [MEDICINE UPDATE] Updated:', id);
    return res.status(200).json({ success: true, medicine });
  } catch (err) {
    console.error('❌ [MEDICINE UPDATE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update medicine' });
  }
}

/**
 * DELETE /medicines/:id
 * Delete medicine
 */
async function deleteMedicine(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;

    const { id } = req.params;
    const medicine = await Medicine.findByIdAndDelete(id);

    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found', 
        errorCode: config.ERROR_CODES.NOT_FOUND 
      });
    }

    console.log('✅ [MEDICINE DELETE] Deleted:', id);
    return res.status(200).json({ success: true, message: 'Medicine deleted successfully' });
  } catch (err) {
    console.error('❌ [MEDICINE DELETE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete medicine' });
  }
}

module.exports = {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine
};
