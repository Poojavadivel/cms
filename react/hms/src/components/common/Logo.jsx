import React from 'react';

/**
 * MoviLogo Component (Image Based)
 * Displays the chatbotimg.png as the main application logo.
 */
const MoviLogo = ({ size = 32, className = '' }) => {
    return (
        <div className={`movi-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
                src="/assets/chatbotimg.png"
                alt="Movi Hospital Logo"
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    objectFit: 'contain',
                    borderRadius: '50%' // Optional: if circular look is desired
                }}
            />
        </div>
    );
};

export default MoviLogo;
