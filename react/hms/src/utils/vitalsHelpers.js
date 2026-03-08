/**
 * vitalsHelpers.js
 * Utility functions for calculating and validating patient vitals,
 * specifically age-aware BMI calculation and biological limits.
 */

/**
 * Calculates BMI based on weight, height, and patient age.
 * Returns null or a warning string if the patient is under 18,
 * as standard BMI formulas are not clinically accurate for pediatrics.
 * 
 * @param {number|string} weightKg - Weight in kilograms
 * @param {number|string} heightCm - Height in centimeters
 * @param {number} age - Patient age in years
 * @returns {number|string|null} - Calculated BMI or warning string
 */
export const calculateBMI = (weightKg, heightCm, age) => {
    if (!weightKg || !heightCm) return null;

    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return null;

    // Age-Aware Calculation: Pediatric limit
    // Standard adult BMI is not valid for children under 18
    if (age != null && age < 18) {
        return 'Adult BMI Formula (Not clinically valid for <18)';
    }

    const bmi = (w / Math.pow(h / 100, 2)).toFixed(1);
    return parseFloat(bmi);
};

/**
 * Mock Zod/Yup Validation Schema for Biological Vitals Limits
 * Enforces logical min/max limits to prevent garbage data entry.
 */
export const VitalsSchema = {
    validate: (vitals, age) => {
        const errors = {};

        if (vitals.weightKg) {
            const w = parseFloat(vitals.weightKg);
            // Hard limits for pediatric (age < 18)
            if (age != null && age < 18) {
                if (w > 120) { // e.g. 150kg for a 4-year-old is impossible
                    errors.weightKg = 'Weight is outside biological limits for this pediatric age.';
                }
                if (w < 2) {
                    errors.weightKg = 'Weight is below biological limits.';
                }
            } else {
                // Adult Limits
                if (w > 400 || w < 25) {
                    errors.weightKg = 'Weight is outside plausible adult biological limits.';
                }
            }
        }

        if (vitals.heightCm) {
            const h = parseFloat(vitals.heightCm);
            // Pediatric height limits
            if (age != null && age < 18) {
                if (h > 210) {
                    errors.heightCm = 'Height is outside biological limits for this pediatric age.';
                }
                if (h < 30) {
                    errors.heightCm = 'Height is below biological limits.';
                }
            } else {
                // Adult Limits
                if (h > 250 || h < 100) {
                    errors.heightCm = 'Height is outside plausible adult biological limits.';
                }
            }
        }

        // Check calculated BMI for extreme values
        if (vitals.weightKg && vitals.heightCm && (age == null || age >= 18)) {
            const bmiStr = calculateBMI(vitals.weightKg, vitals.heightCm, age);
            if (typeof bmiStr === 'number') {
                if (bmiStr > 40 || bmiStr < 10) {
                    errors.bmi = `Calculated BMI (${bmiStr}) is extreme (>40 or <10). Please verify Weight and Height for typos.`;
                }
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};
