import React from 'react';

/**
 * A reusable NumberInput component that enforces strict numerical rules:
 * - Prevents typing negative signs, 'e', or '+' characters.
 * - Prevents typing multiple decimals.
 * - Applies HTML min/max attributes for browser-level validation.
 */
const NumberInput = ({
    value,
    onChange,
    min,
    max,
    step = 'any',
    placeholder,
    className,
    id,
    readOnly,
    onBlur
}) => {

    const handleKeyDown = (e) => {
        // Prevent negative sign, 'e' for exponent, '+' sign
        if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
            e.preventDefault();
        }

        // Prevent multiple decimals
        if (e.key === '.' && value && String(value).includes('.')) {
            e.preventDefault();
        }
    };

    const handleChange = (e) => {
        let val = e.target.value;

        // Strip any accidental negatives that might have bypassed keydown (e.g. paste)
        if (val.includes('-')) {
            val = val.replace(/-/g, '');
        }

        // Pass sanitized value up
        onChange(val);
    };

    return (
        <input
            id={id}
            type="number"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            className={className}
            readOnly={readOnly}
        />
    );
};

export default NumberInput;
