/**
 * SectionCard.jsx
 * Collapsible section card matching Flutter's _SectionCard design
 * Used in intake form for organizing different sections
 */

import React, { useState } from 'react';
import { MdExpandMore, MdExpandLess } from 'react-icons/md';
import './SectionCard.css';

const SectionCard = ({ 
  icon, 
  title, 
  description, 
  children, 
  initiallyExpanded = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  return (
    <div className="section-card">
      <div 
        className="section-card-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="section-card-header-left">
          <div className="section-card-icon">
            {icon}
          </div>
          <div className="section-card-title-group">
            <h3 className="section-card-title">{title}</h3>
            {description && (
              <p className="section-card-description">{description}</p>
            )}
          </div>
        </div>
        <button 
          className="section-card-expand-btn"
          type="button"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
        </button>
      </div>

      {isExpanded && (
        <div className="section-card-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default SectionCard;
