import React from 'react';
import './SkeletonLoaders.css';

export const Skeleton = ({ variant = 'text', width, height, className = '' }) => {
    const style = { width, height };
    return <div className={`skeleton ${variant} ${className}`} style={style} />;
};

export const SkeletonCard = ({ children, className = '' }) => {
    return (
        <div className={`skeleton-card ${className}`}>
            {children}
        </div>
    );
};
