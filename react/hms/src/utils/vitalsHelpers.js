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
 * Calculates the WHO clinical category and color-coding for a given BMI.
 * CRITICAL: Adult WHO categories are invalid for pediatrics (<18 yrs).
 * For patients under 18, this returns a neutral pediatric label.
 * 
 * @param {number|string} bmi - The calculated BMI
 * @param {number} age - Patient age in years
 * @returns {object} - { label: string, colorClass: string, isNeutral: boolean }
 */
export const getBMICategory = (bmi, age) => {
    if (!bmi || isNaN(parseFloat(bmi))) return { label: 'BMI', colorClass: 'bg-white border-slate-200 text-slate-900', isNeutral: true };
    const num = parseFloat(bmi);

    // Pediatric Fallback (<18 yrs)
    if (age != null && age < 18) {
        return {
            label: 'Pediatric BMI',
            colorClass: 'bg-slate-50 border-slate-200 text-slate-700', // Neutral Gray/Blue
            isNeutral: true,
            tooltip: 'Pediatric BMI requires CDC growth chart percentiles for clinical categorization.'
        };
    }

    // Standard Adult WHO Categorization (>=18 yrs or unknown age)
    let colorClass = 'bg-green-50 border-green-200 text-green-900'; // Normal Weight (18.5 - 24.9)
    let label = 'BMI (Normal)';

    if (num < 18.5) {
        colorClass = 'bg-amber-50 border-amber-200 text-amber-900';
        label = 'BMI (Underweight)';
    } else if (num >= 25 && num < 30) {
        colorClass = 'bg-amber-50 border-amber-200 text-amber-900';
        label = 'BMI (Overweight)';
    } else if (num >= 30) {
        colorClass = 'bg-red-50 border-red-200 text-red-900';
        label = 'BMI (Obese)';
    }

    return { label, colorClass, isNeutral: false };
};

/**
 * Comprehensive Validation Schema for Biological Vitals Limits
 * Enforces logical min/max limits to prevent physical impossibilities (Bug 30).
 */
export const VitalsSchema = {
    validate: (vitals, age) => {
        const errors = {};

        // 1. Weight Constraints (kg): Age-Aware
        if (vitals.weightKg !== undefined && vitals.weightKg !== '') {
            const w = parseFloat(vitals.weightKg);
            if (isNaN(w) || w < 0.5 || w > 400) {
                errors.weightKg = 'Value exceeds absolute biological limits (Min: 0.5kg, Max: 400kg).';
            } else if (age !== null && age !== undefined) {
                if (age < 1 && w > 15) {
                    errors.weightKg = `Weight of ${w}kg is medically implausible for an infant (<1 yr). Max: 15kg.`;
                } else if (age >= 1 && age <= 5 && w > 35) {
                    errors.weightKg = `Weight of ${w}kg is medically implausible for a toddler (1-5 yrs). Max: 35kg.`;
                } else if (age >= 6 && age <= 12 && w > 70) {
                    errors.weightKg = `Weight of ${w}kg is medically implausible for a child (6-12 yrs). Max: 70kg.`;
                }
            }
        }

        // 2. Height Constraints (cm): Age-Aware
        if (vitals.heightCm !== undefined && vitals.heightCm !== '') {
            const h = parseFloat(vitals.heightCm);
            if (isNaN(h) || h < 20 || h > 300) {
                errors.heightCm = 'Value exceeds absolute biological limits (Min: 20cm, Max: 300cm).';
            } else if (age !== null && age !== undefined) {
                if (age < 1 && h > 100) {
                    errors.heightCm = `Height of ${h}cm is medically implausible for an infant (<1 yr). Max: 100cm.`;
                } else if (age >= 1 && age <= 5 && h > 150) {
                    errors.heightCm = `Height of ${h}cm is medically implausible for a toddler (1-5 yrs). Max: 150cm.`;
                } else if (age >= 6 && age <= 12 && h > 180) {
                    errors.heightCm = `Height of ${h}cm is medically implausible for a child (6-12 yrs). Max: 180cm.`;
                }
            }
        }

        // 3. SpO2 Constraints (%): Min 0, Max 100
        if (vitals.spO2 !== undefined && vitals.spO2 !== null && vitals.spO2 !== '') {
            const spo2 = parseFloat(vitals.spO2);
            if (isNaN(spo2) || spo2 < 0 || spo2 > 100) {
                errors.spO2 = 'SpO₂ percentage must be between 0 and 100.';
            } else if (spo2 < 90) {
                errors.spO2Warning = '⚠️ Hypoxemia Warning: SpO₂ is critically low (<90%).';
            }
        } else if (vitals.spO2 === '') {
            errors.spO2Required = 'SpO₂ is highly recommended.';
        }

        // 4. Temperature Constraints (°C): Min 30, Max 45
        if (vitals.temp !== undefined && vitals.temp !== '') {
            const temp = parseFloat(vitals.temp);
            if (isNaN(temp) || temp < 30 || temp > 45) {
                errors.temp = 'Value exceeds biological limits (Min: 30°C, Max: 45°C).';
            }
        }

        // 5. Heart Rate (Pulse) Constraints (bpm): Min 0, Max 300
        if (vitals.pulse !== undefined && vitals.pulse !== '') {
            const pulse = parseFloat(vitals.pulse);
            if (isNaN(pulse) || pulse < 0 || pulse > 300) {
                errors.pulse = 'Value exceeds biological limits (Min: 0 bpm, Max: 300 bpm).';
            }
        }

        // 6. Blood Pressure (BP) Constraints (Systolic/Diastolic)
        // Systolic: Min 50, Max 250 | Diastolic: Min 30, Max 150
        if (vitals.bp && typeof vitals.bp === 'string' && vitals.bp.trim() !== '') {
            const parts = vitals.bp.split('/');
            if (parts.length === 2) {
                const sys = parseInt(parts[0].trim(), 10);
                const dia = parseInt(parts[1].trim(), 10);

                if (isNaN(sys) || isNaN(dia)) {
                    errors.bp = 'Blood pressure must be numeric (e.g. 120/80).';
                } else {
                    if (sys < 50 || sys > 250) {
                        errors.bpSys = 'Systolic BP exceeds biological limits (50-250 mmHg).';
                    }
                    if (dia < 30 || dia > 150) {
                        errors.bpDia = 'Diastolic BP exceeds biological limits (30-150 mmHg).';
                    }
                }
            } else {
                errors.bpFormat = 'Invalid BP format. Use Systolic/Diastolic (e.g. 120/80).';
            }
        }

        // 7. Check calculated BMI for extreme values
        if (vitals.weightKg && vitals.heightCm && (age == null || age >= 18)) {
            const bmiStr = calculateBMI(vitals.weightKg, vitals.heightCm, age);
            if (typeof bmiStr === 'number') {
                if (bmiStr > 150 || bmiStr < 8) {
                    errors.bmi = `Calculated BMI (${bmiStr}) is extreme. Please verify Weight and Height for typos.`;
                }
            }
        }

        return {
            isValid: Object.keys(errors).filter(k => !k.includes('Warning') && !k.includes('Required')).length === 0,
            errors
        };
    }
};
