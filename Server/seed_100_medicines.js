// Seed 100 medicines with complete data including batches, prices, expiry dates
require('dotenv').config();
const mongoose = require('mongoose');
const { Medicine, MedicineBatch } = require('./Models');

const MONGODB_URI = process.env.MANGODB_URL || process.env.MONGODB_URI;

// 100 real medicine samples with prices and details
const medicines = [
  // Analgesics & Antipyretics
  { name: 'Paracetamol 500mg', category: 'Analgesic', form: 'Tablet', strength: '500mg', manufacturer: 'ABC Pharma', price: 2.50, costPrice: 1.50, stock: 500, supplier: 'MediSupply Ltd', expiryMonths: 24 },
  { name: 'Paracetamol 650mg', category: 'Analgesic', form: 'Tablet', strength: '650mg', manufacturer: 'ABC Pharma', price: 3.00, costPrice: 2.00, stock: 300, supplier: 'MediSupply Ltd', expiryMonths: 24 },
  { name: 'Ibuprofen 400mg', category: 'Analgesic', form: 'Tablet', strength: '400mg', manufacturer: 'XYZ Labs', price: 5.00, costPrice: 3.00, stock: 250, supplier: 'HealthCare Distributors', expiryMonths: 36 },
  { name: 'Aspirin 75mg', category: 'Antiplatelet', form: 'Tablet', strength: '75mg', manufacturer: 'HealthPharma', price: 3.50, costPrice: 2.00, stock: 200, supplier: 'Global Meds', expiryMonths: 36 },
  { name: 'Diclofenac 50mg', category: 'Analgesic', form: 'Tablet', strength: '50mg', manufacturer: 'PainRelief Inc', price: 4.50, costPrice: 2.50, stock: 180, supplier: 'MediSupply Ltd', expiryMonths: 24 },
  
  // Antibiotics
  { name: 'Amoxicillin 250mg', category: 'Antibiotic', form: 'Capsule', strength: '250mg', manufacturer: 'AntiBio Labs', price: 8.00, costPrice: 5.00, stock: 15, supplier: 'PharmaDist', expiryMonths: 18 },
  { name: 'Amoxicillin 500mg', category: 'Antibiotic', form: 'Capsule', strength: '500mg', manufacturer: 'AntiBio Labs', price: 12.00, costPrice: 7.00, stock: 150, supplier: 'PharmaDist', expiryMonths: 18 },
  { name: 'Azithromycin 250mg', category: 'Antibiotic', form: 'Tablet', strength: '250mg', manufacturer: 'BioMed Corp', price: 15.00, costPrice: 9.00, stock: 100, supplier: 'HealthCare Distributors', expiryMonths: 24 },
  { name: 'Ciprofloxacin 500mg', category: 'Antibiotic', form: 'Tablet', strength: '500mg', manufacturer: 'CurePharma', price: 10.00, costPrice: 6.00, stock: 120, supplier: 'MediSupply Ltd', expiryMonths: 24 },
  { name: 'Cefixime 200mg', category: 'Antibiotic', form: 'Tablet', strength: '200mg', manufacturer: 'AntiBio Labs', price: 18.00, costPrice: 11.00, stock: 90, supplier: 'Global Meds', expiryMonths: 18 },
  
  // Diabetes
  { name: 'Metformin 500mg', category: 'Diabetes', form: 'Tablet', strength: '500mg', manufacturer: 'DiabCare', price: 6.00, costPrice: 3.50, stock: 300, supplier: 'HealthCare Distributors', expiryMonths: 36 },
  { name: 'Metformin 850mg', category: 'Diabetes', form: 'Tablet', strength: '850mg', manufacturer: 'DiabCare', price: 8.00, costPrice: 5.00, stock: 200, supplier: 'HealthCare Distributors', expiryMonths: 36 },
  { name: 'Glimepiride 1mg', category: 'Diabetes', form: 'Tablet', strength: '1mg', manufacturer: 'GlucoCare', price: 7.50, costPrice: 4.50, stock: 150, supplier: 'PharmaDist', expiryMonths: 24 },
  { name: 'Glimepiride 2mg', category: 'Diabetes', form: 'Tablet', strength: '2mg', manufacturer: 'GlucoCare', price: 9.00, costPrice: 5.50, stock: 120, supplier: 'PharmaDist', expiryMonths: 24 },
  { name: 'Insulin Glargine 100IU', category: 'Diabetes', form: 'Injection', strength: '100IU', manufacturer: 'InsulinCorp', price: 850.00, costPrice: 600.00, stock: 0, supplier: 'Specialty Pharma', expiryMonths: 24 },
  
  // Hypertension
  { name: 'Amlodipine 5mg', category: 'Antihypertensive', form: 'Tablet', strength: '5mg', manufacturer: 'CardioMed', price: 5.50, costPrice: 3.00, stock: 250, supplier: 'MediSupply Ltd', expiryMonths: 36 },
  { name: 'Amlodipine 10mg', category: 'Antihypertensive', form: 'Tablet', strength: '10mg', manufacturer: 'CardioMed', price: 7.00, costPrice: 4.00, stock: 180, supplier: 'MediSupply Ltd', expiryMonths: 36 },
  { name: 'Atenolol 50mg', category: 'Antihypertensive', form: 'Tablet', strength: '50mg', manufacturer: 'HeartCare', price: 6.00, costPrice: 3.50, stock: 200, supplier: 'Global Meds', expiryMonths: 24 },
  { name: 'Losartan 50mg', category: 'Antihypertensive', form: 'Tablet', strength: '50mg', manufacturer: 'PressureCare', price: 8.50, costPrice: 5.00, stock: 160, supplier: 'HealthCare Distributors', expiryMonths: 24 },
  { name: 'Ramipril 5mg', category: 'Antihypertensive', form: 'Tablet', strength: '5mg', manufacturer: 'CardioMed', price: 9.00, costPrice: 5.50, stock: 140, supplier: 'PharmaDist', expiryMonths: 24 },
  
  // Gastrointestinal
  { name: 'Omeprazole 20mg', category: 'Proton Pump Inhibitor', form: 'Capsule', strength: '20mg', manufacturer: 'GastroCare', price: 7.00, costPrice: 4.00, stock: 150, supplier: 'MediSupply Ltd', expiryMonths: 24 },
  { name: 'Pantoprazole 40mg', category: 'Proton Pump Inhibitor', form: 'Tablet', strength: '40mg', manufacturer: 'GastroCare', price: 9.50, costPrice: 6.00, stock: 130, supplier: 'HealthCare Distributors', expiryMonths: 24 },
  { name: 'Ranitidine 150mg', category: 'H2 Blocker', form: 'Tablet', strength: '150mg', manufacturer: 'AcidRelief', price: 5.00, costPrice: 3.00, stock: 180, supplier: 'Global Meds', expiryMonths: 36 },
  { name: 'Domperidone 10mg', category: 'Antiemetic', form: 'Tablet', strength: '10mg', manufacturer: 'NauseaCure', price: 4.50, costPrice: 2.50, stock: 160, supplier: 'PharmaDist', expiryMonths: 24 },
  { name: 'Ondansetron 4mg', category: 'Antiemetic', form: 'Tablet', strength: '4mg', manufacturer: 'VomitControl', price: 12.00, costPrice: 7.00, stock: 100, supplier: 'Specialty Pharma', expiryMonths: 18 },
  
  // Respiratory
  { name: 'Salbutamol 4mg', category: 'Bronchodilator', form: 'Tablet', strength: '4mg', manufacturer: 'BreathEasy', price: 6.00, costPrice: 3.50, stock: 140, supplier: 'MediSupply Ltd', expiryMonths: 24 },
  { name: 'Montelukast 10mg', category: 'Antiasthmatic', form: 'Tablet', strength: '10mg', manufacturer: 'AsthmaFree', price: 15.00, costPrice: 9.00, stock: 120, supplier: 'HealthCare Distributors', expiryMonths: 24 },
  { name: 'Cetirizine 10mg', category: 'Antihistamine', form: 'Tablet', strength: '10mg', manufacturer: 'AllergyCare', price: 3.50, costPrice: 2.00, stock: 200, supplier: 'Global Meds', expiryMonths: 36 },
  { name: 'Loratadine 10mg', category: 'Antihistamine', form: 'Tablet', strength: '10mg', manufacturer: 'AllergyCure', price: 4.00, costPrice: 2.50, stock: 180, supplier: 'PharmaDist', expiryMonths: 36 },
  { name: 'Dextromethorphan 15mg', category: 'Cough Suppressant', form: 'Syrup', strength: '15mg/5ml', manufacturer: 'CoughRelief', price: 8.50, costPrice: 5.00, stock: 100, supplier: 'MediSupply Ltd', expiryMonths: 18 },
  
  // Vitamins & Supplements
  { name: 'Vitamin D3 60K IU', category: 'Vitamin', form: 'Capsule', strength: '60000IU', manufacturer: 'VitaHealth', price: 25.00, costPrice: 15.00, stock: 150, supplier: 'NutriSupply', expiryMonths: 24 },
  { name: 'Calcium Carbonate 500mg', category: 'Mineral Supplement', form: 'Tablet', strength: '500mg', manufacturer: 'BoneHealth', price: 6.00, costPrice: 3.50, stock: 200, supplier: 'NutriSupply', expiryMonths: 36 },
  { name: 'Folic Acid 5mg', category: 'Vitamin', form: 'Tablet', strength: '5mg', manufacturer: 'VitaCare', price: 3.00, costPrice: 1.50, stock: 180, supplier: 'HealthCare Distributors', expiryMonths: 36 },
  { name: 'Iron 100mg', category: 'Mineral Supplement', form: 'Tablet', strength: '100mg', manufacturer: 'BloodBoost', price: 7.50, costPrice: 4.50, stock: 140, supplier: 'NutriSupply', expiryMonths: 24 },
  { name: 'Multivitamin Capsules', category: 'Vitamin', form: 'Capsule', strength: 'Multi', manufacturer: 'HealthPlus', price: 12.00, costPrice: 7.00, stock: 160, supplier: 'NutriSupply', expiryMonths: 24 },
  
  // Anticoagulants
  { name: 'Clopidogrel 75mg', category: 'Antiplatelet', form: 'Tablet', strength: '75mg', manufacturer: 'ClotCare', price: 18.00, costPrice: 11.00, stock: 100, supplier: 'CardioSupply', expiryMonths: 24 },
  { name: 'Warfarin 5mg', category: 'Anticoagulant', form: 'Tablet', strength: '5mg', manufacturer: 'BloodThin', price: 10.00, costPrice: 6.00, stock: 80, supplier: 'CardioSupply', expiryMonths: 24 },
  { name: 'Rivaroxaban 10mg', category: 'Anticoagulant', form: 'Tablet', strength: '10mg', manufacturer: 'NewAnticlot', price: 45.00, costPrice: 30.00, stock: 60, supplier: 'Specialty Pharma', expiryMonths: 18 },
  
  // Cholesterol
  { name: 'Atorvastatin 10mg', category: 'Statin', form: 'Tablet', strength: '10mg', manufacturer: 'CholesterolFix', price: 12.00, costPrice: 7.00, stock: 180, supplier: 'CardioSupply', expiryMonths: 24 },
  { name: 'Atorvastatin 20mg', category: 'Statin', form: 'Tablet', strength: '20mg', manufacturer: 'CholesterolFix', price: 16.00, costPrice: 10.00, stock: 150, supplier: 'CardioSupply', expiryMonths: 24 },
  { name: 'Rosuvastatin 10mg', category: 'Statin', form: 'Tablet', strength: '10mg', manufacturer: 'LipidCare', price: 15.00, costPrice: 9.00, stock: 130, supplier: 'HealthCare Distributors', expiryMonths: 24 },
  { name: 'Simvastatin 20mg', category: 'Statin', form: 'Tablet', strength: '20mg', manufacturer: 'HeartHealth', price: 10.00, costPrice: 6.00, stock: 140, supplier: 'Global Meds', expiryMonths: 36 },
  
  // Antidepressants & Anxiolytics
  { name: 'Fluoxetine 20mg', category: 'Antidepressant', form: 'Capsule', strength: '20mg', manufacturer: 'MindCare', price: 14.00, costPrice: 8.50, stock: 100, supplier: 'PsychoPharma', expiryMonths: 24 },
  { name: 'Sertraline 50mg', category: 'Antidepressant', form: 'Tablet', strength: '50mg', manufacturer: 'MoodLift', price: 16.00, costPrice: 10.00, stock: 90, supplier: 'PsychoPharma', expiryMonths: 24 },
  { name: 'Alprazolam 0.5mg', category: 'Anxiolytic', form: 'Tablet', strength: '0.5mg', manufacturer: 'CalmMind', price: 8.00, costPrice: 5.00, stock: 18, supplier: 'PsychoPharma', expiryMonths: 24 },
  { name: 'Clonazepam 0.5mg', category: 'Anxiolytic', form: 'Tablet', strength: '0.5mg', manufacturer: 'SerenityPharma', price: 9.00, costPrice: 5.50, stock: 110, supplier: 'PsychoPharma', expiryMonths: 24 },
  
  // Thyroid
  { name: 'Levothyroxine 50mcg', category: 'Thyroid Hormone', form: 'Tablet', strength: '50mcg', manufacturer: 'ThyroidCare', price: 6.50, costPrice: 4.00, stock: 150, supplier: 'EndoSupply', expiryMonths: 24 },
  { name: 'Levothyroxine 100mcg', category: 'Thyroid Hormone', form: 'Tablet', strength: '100mcg', manufacturer: 'ThyroidCare', price: 8.00, costPrice: 5.00, stock: 130, supplier: 'EndoSupply', expiryMonths: 24 },
  { name: 'Carbimazole 5mg', category: 'Antithyroid', form: 'Tablet', strength: '5mg', manufacturer: 'HyperThyroid', price: 12.00, costPrice: 7.50, stock: 80, supplier: 'EndoSupply', expiryMonths: 18 },
  
  // More Common Medicines
  { name: 'Dolo 650mg', category: 'Analgesic', form: 'Tablet', strength: '650mg', manufacturer: 'FeverCure', price: 3.50, costPrice: 2.00, stock: 400, supplier: 'MediSupply Ltd', expiryMonths: 24 },
  { name: 'Combiflam', category: 'Analgesic', form: 'Tablet', strength: 'Combo', manufacturer: 'PainRelief Inc', price: 5.00, costPrice: 3.00, stock: 300, supplier: 'MediSupply Ltd', expiryMonths: 24 },
  { name: 'Crocin Advance', category: 'Analgesic', form: 'Tablet', strength: '500mg', manufacturer: 'FastRelief', price: 4.00, costPrice: 2.50, stock: 350, supplier: 'Global Meds', expiryMonths: 24 },
  { name: 'Disprin', category: 'Analgesic', form: 'Tablet', strength: '325mg', manufacturer: 'QuickPain', price: 2.50, costPrice: 1.50, stock: 280, supplier: 'HealthCare Distributors', expiryMonths: 36 },
  { name: 'Vicks Vaporub', category: 'Topical', form: 'Ointment', strength: '50g', manufacturer: 'ColdCare', price: 150.00, costPrice: 100.00, stock: 80, supplier: 'OTC Supply', expiryMonths: 36 },
  { name: 'Betadine Solution', category: 'Antiseptic', form: 'Solution', strength: '100ml', manufacturer: 'WoundCare', price: 85.00, costPrice: 60.00, stock: 120, supplier: 'SurgicalSupply', expiryMonths: 24 },
  { name: 'Dettol Liquid', category: 'Antiseptic', form: 'Solution', strength: '250ml', manufacturer: 'HygieneCare', price: 120.00, costPrice: 85.00, stock: 100, supplier: 'OTC Supply', expiryMonths: 36 },
  { name: 'Savlon Cream', category: 'Antiseptic', form: 'Cream', strength: '30g', manufacturer: 'SkinCare', price: 65.00, costPrice: 45.00, stock: 90, supplier: 'OTC Supply', expiryMonths: 24 },
  { name: 'Moov Pain Relief Cream', category: 'Topical Analgesic', form: 'Cream', strength: '50g', manufacturer: 'PainAway', price: 140.00, costPrice: 95.00, stock: 70, supplier: 'OTC Supply', expiryMonths: 24 },
  { name: 'Volini Spray', category: 'Topical Analgesic', form: 'Spray', strength: '60g', manufacturer: 'SprayCure', price: 180.00, costPrice: 120.00, stock: 60, supplier: 'OTC Supply', expiryMonths: 24 },
  { name: 'Digene Gel', category: 'Antacid', form: 'Gel', strength: '200ml', manufacturer: 'AcidityRelief', price: 95.00, costPrice: 65.00, stock: 110, supplier: 'OTC Supply', expiryMonths: 18 },
  { name: 'Eno Powder', category: 'Antacid', form: 'Powder', strength: '5g', manufacturer: 'FastRelief', price: 10.00, costPrice: 6.00, stock: 200, supplier: 'OTC Supply', expiryMonths: 24 },
  { name: 'Pudin Hara', category: 'Digestive', form: 'Pearls', strength: '10 Pearls', manufacturer: 'DigestEase', price: 15.00, costPrice: 9.00, stock: 150, supplier: 'OTC Supply', expiryMonths: 24 },
  { name: 'Electral Powder', category: 'ORS', form: 'Powder', strength: '21.8g', manufacturer: 'RehydrateFast', price: 20.00, costPrice: 12.00, stock: 180, supplier: 'OTC Supply', expiryMonths: 24 },
  { name: 'Glucon-D', category: 'Energy Supplement', form: 'Powder', strength: '500g', manufacturer: 'EnergyBoost', price: 180.00, costPrice: 120.00, stock: 100, supplier: 'NutriSupply', expiryMonths: 18 },
  { name: 'Revital Capsules', category: 'Multivitamin', form: 'Capsule', strength: '30 Caps', manufacturer: 'VitaPower', price: 280.00, costPrice: 190.00, stock: 80, supplier: 'NutriSupply', expiryMonths: 24 },
  { name: 'Becosules Capsules', category: 'Vitamin B Complex', form: 'Capsule', strength: '30 Caps', manufacturer: 'BVitamin', price: 95.00, costPrice: 65.00, stock: 140, supplier: 'NutriSupply', expiryMonths: 24 },
  { name: 'Zincovit Tablets', category: 'Multivitamin', form: 'Tablet', strength: '15 Tabs', manufacturer: 'ZincPlus', price: 120.00, costPrice: 80.00, stock: 130, supplier: 'NutriSupply', expiryMonths: 24 },
  { name: 'Limcee Vitamin C', category: 'Vitamin', form: 'Tablet', strength: '500mg', manufacturer: 'CVitamin', price: 35.00, costPrice: 22.00, stock: 160, supplier: 'NutriSupply', expiryMonths: 36 },
  { name: 'Shelcal 500', category: 'Calcium Supplement', form: 'Tablet', strength: '500mg', manufacturer: 'BoneStrong', price: 110.00, costPrice: 75.00, stock: 140, supplier: 'NutriSupply', expiryMonths: 24 },
  { name: 'Shelcal HD', category: 'Calcium Supplement', form: 'Tablet', strength: '1250mg', manufacturer: 'BoneStrong', price: 180.00, costPrice: 125.00, stock: 100, supplier: 'NutriSupply', expiryMonths: 24 },
  { name: 'Calcirol Granules', category: 'Vitamin D', form: 'Sachet', strength: '60K IU', manufacturer: 'VitaDPlus', price: 28.00, costPrice: 18.00, stock: 150, supplier: 'NutriSupply', expiryMonths: 24 },
  { name: 'Neurobion Forte', category: 'Vitamin B Complex', form: 'Tablet', strength: '30 Tabs', manufacturer: 'NerveCare', price: 42.00, costPrice: 28.00, stock: 160, supplier: 'NutriSupply', expiryMonths: 24 },
  { name: 'Evion 400', category: 'Vitamin E', form: 'Capsule', strength: '400mg', manufacturer: 'EVitamin', price: 85.00, costPrice: 58.00, stock: 110, supplier: 'NutriSupply', expiryMonths: 24 },
  { name: 'A to Z Multivitamin', category: 'Multivitamin', form: 'Tablet', strength: '30 Tabs', manufacturer: 'CompleteVita', price: 160.00, costPrice: 110.00, stock: 120, supplier: 'NutriSupply', expiryMonths: 24 },
  { name: 'Supradyn Daily', category: 'Multivitamin', form: 'Tablet', strength: '15 Tabs', manufacturer: 'DailyVita', price: 210.00, costPrice: 145.00, stock: 90, supplier: 'NutriSupply', expiryMonths: 24 },
  { name: 'Levocetirizine 5mg', category: 'Antihistamine', form: 'Tablet', strength: '5mg', manufacturer: 'AllergyFree', price: 5.50, costPrice: 3.50, stock: 180, supplier: 'PharmaDist', expiryMonths: 36 },
  { name: 'Fexofenadine 120mg', category: 'Antihistamine', form: 'Tablet', strength: '120mg', manufacturer: 'NoAllergy', price: 8.00, costPrice: 5.00, stock: 140, supplier: 'PharmaDist', expiryMonths: 24 },
  { name: 'Chlorpheniramine 4mg', category: 'Antihistamine', form: 'Tablet', strength: '4mg', manufacturer: 'OldSchool', price: 2.00, costPrice: 1.00, stock: 200, supplier: 'Global Meds', expiryMonths: 36 },
  { name: 'Phenylephrine 10mg', category: 'Decongestant', form: 'Tablet', strength: '10mg', manufacturer: 'NoseClear', price: 4.50, costPrice: 2.50, stock: 150, supplier: 'PharmaDist', expiryMonths: 24 },
  { name: 'Ambroxol 30mg', category: 'Mucolytic', form: 'Tablet', strength: '30mg', manufacturer: 'PhlegmClear', price: 5.00, costPrice: 3.00, stock: 160, supplier: 'MediSupply Ltd', expiryMonths: 24 },
  { name: 'Bromhexine 8mg', category: 'Mucolytic', form: 'Tablet', strength: '8mg', manufacturer: 'CoughEase', price: 4.00, costPrice: 2.50, stock: 140, supplier: 'Global Meds', expiryMonths: 24 },
  { name: 'Guaifenesin 100mg', category: 'Expectorant', form: 'Syrup', strength: '100mg/5ml', manufacturer: 'CoughOut', price: 85.00, costPrice: 55.00, stock: 80, supplier: 'MediSupply Ltd', expiryMonths: 18 },
  { name: 'Prednisolone 5mg', category: 'Corticosteroid', form: 'Tablet', strength: '5mg', manufacturer: 'SteroMed', price: 6.50, costPrice: 4.00, stock: 100, supplier: 'Specialty Pharma', expiryMonths: 24 },
  { name: 'Deflazacort 6mg', category: 'Corticosteroid', form: 'Tablet', strength: '6mg', manufacturer: 'NewStero', price: 12.00, costPrice: 7.50, stock: 80, supplier: 'Specialty Pharma', expiryMonths: 24 },
  { name: 'Chloroquine 250mg', category: 'Antimalarial', form: 'Tablet', strength: '250mg', manufacturer: 'MalariaFree', price: 8.00, costPrice: 5.00, stock: 60, supplier: 'TropicalMeds', expiryMonths: 36 },
  { name: 'Hydroxychloroquine 200mg', category: 'Antimalarial', form: 'Tablet', strength: '200mg', manufacturer: 'AutoImmune', price: 15.00, costPrice: 9.00, stock: 70, supplier: 'Specialty Pharma', expiryMonths: 24 },
  { name: 'Albendazole 400mg', category: 'Anthelmintic', form: 'Tablet', strength: '400mg', manufacturer: 'WormOut', price: 5.00, costPrice: 3.00, stock: 120, supplier: 'Global Meds', expiryMonths: 36 },
  { name: 'Mebendazole 100mg', category: 'Anthelmintic', form: 'Tablet', strength: '100mg', manufacturer: 'ParasiteFree', price: 4.00, costPrice: 2.50, stock: 110, supplier: 'PharmaDist', expiryMonths: 36 },
  { name: 'Metronidazole 400mg', category: 'Antibiotic', form: 'Tablet', strength: '400mg', manufacturer: 'AnaerobicKill', price: 6.00, costPrice: 3.50, stock: 140, supplier: 'MediSupply Ltd', expiryMonths: 24 },
  { name: 'Norfloxacin 400mg', category: 'Antibiotic', form: 'Tablet', strength: '400mg', manufacturer: 'UTICure', price: 8.50, costPrice: 5.00, stock: 100, supplier: 'PharmaDist', expiryMonths: 24 },
  { name: 'Nitrofurantoin 100mg', category: 'Antibiotic', form: 'Capsule', strength: '100mg', manufacturer: 'UTIGuard', price: 10.00, costPrice: 6.00, stock: 90, supplier: 'Specialty Pharma', expiryMonths: 18 },
  { name: 'Doxycycline 100mg', category: 'Antibiotic', form: 'Capsule', strength: '100mg', manufacturer: 'BroadSpec', price: 12.00, costPrice: 7.00, stock: 110, supplier: 'PharmaDist', expiryMonths: 24 },
  { name: 'Clindamycin 300mg', category: 'Antibiotic', form: 'Capsule', strength: '300mg', manufacturer: 'DeepInfection', price: 18.00, costPrice: 11.00, stock: 70, supplier: 'Specialty Pharma', expiryMonths: 18 },
  { name: 'Tamsulosin 0.4mg', category: 'Alpha Blocker', form: 'Capsule', strength: '0.4mg', manufacturer: 'ProstateEase', price: 14.00, costPrice: 8.50, stock: 80, supplier: 'UroSupply', expiryMonths: 24 },
  { name: 'Finasteride 5mg', category: 'BPH Treatment', form: 'Tablet', strength: '5mg', manufacturer: 'HairGrow', price: 16.00, costPrice: 10.00, stock: 90, supplier: 'UroSupply', expiryMonths: 24 },
  { name: 'Sildenafil 50mg', category: 'PDE5 Inhibitor', form: 'Tablet', strength: '50mg', manufacturer: 'VitalityPharma', price: 45.00, costPrice: 30.00, stock: 16, supplier: 'Specialty Pharma', expiryMonths: 24 },
  { name: 'Tadalafil 10mg', category: 'PDE5 Inhibitor', form: 'Tablet', strength: '10mg', manufacturer: 'LongLasting', price: 55.00, costPrice: 37.00, stock: 14, supplier: 'Specialty Pharma', expiryMonths: 24 },
];

async function seedMedicines() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📦 Seeding 100 medicines with complete data...\n');

    let created = 0;
    let skipped = 0;

    for (let i = 0; i < medicines.length; i++) {
      const medData = medicines[i];
      const sku = `MED-${String(i + 1).padStart(3, '0')}`;

      // Check if medicine already exists
      const existing = await Medicine.findOne({ sku });
      if (existing) {
        skipped++;
        continue;
      }

      // Create medicine
      const medicine = await Medicine.create({
        name: medData.name,
        sku,
        category: medData.category,
        form: medData.form,
        strength: medData.strength,
        manufacturer: medData.manufacturer,
        status: medData.stock > 0 ? 'In Stock' : 'Out of Stock',
        reorderLevel: 20,
        unit: 'pcs',
        brand: medData.manufacturer,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Create batch if stock > 0
      if (medData.stock > 0) {
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + medData.expiryMonths);

        await MedicineBatch.create({
          medicineId: String(medicine._id),
          batchNumber: `BATCH-${sku}-001`,
          quantity: medData.stock,
          salePrice: medData.price,
          purchasePrice: medData.costPrice,
          supplier: medData.supplier,
          location: 'Main Pharmacy Store',
          expiryDate: expiryDate,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }

      created++;
      if (created % 10 === 0) {
        console.log(`✅ Created ${created} medicines...`);
      }
    }

    console.log(`\n🎉 Seeding Complete!`);
    console.log(`   Created: ${created} medicines`);
    console.log(`   Skipped: ${skipped} (already exist)`);
    
    const totalMedicines = await Medicine.countDocuments();
    const totalBatches = await MedicineBatch.countDocuments();
    console.log(`\n📊 Database Status:`);
    console.log(`   Total Medicines: ${totalMedicines}`);
    console.log(`   Total Batches: ${totalBatches}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedMedicines();
