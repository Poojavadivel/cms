/**
 * SkeletonLoader.jsx — Reusable skeleton blocks for loading states.
 * Usage: <SkeletonLoader variant="kpi" />   (shows 4 kpi card skeletons)
 *        <SkeletonLoader variant="list" count={5} />
 *        <SkeletonLoader variant="text" lines={3} />
 */
import React from 'react';
import './SkeletonLoader.css';

const SkeletonBlock = ({ width = '100%', height = 16, className = "", style = {} }) => (
    <div
        className={`bg-slate-200 animate-pulse rounded-md ${className}`}
        style={{ width, height, ...style }}
        aria-hidden="true"
    />
);

const SkeletonLoader = ({ variant = 'text', count = 3, lines = 2 }) => {
    switch (variant) {
        case 'kpi':
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white border border-slate-200 rounded-[1.25rem] p-5 shadow-sm flex items-center justify-between">
                            <div className="flex flex-col gap-2 w-full">
                                <SkeletonBlock width="40%" height={28} className="rounded-lg" />
                                <SkeletonBlock width="60%" height={12} />
                            </div>
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse shrink-0 ml-4" />
                        </div>
                    ))}
                </div>
            );

        case 'queue':
            return (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: count }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-100 bg-white">
                            <SkeletonBlock width={32} height={32} className="rounded-xl shrink-0" />
                            <div className="flex-1 flex flex-col gap-2">
                                <SkeletonBlock width="60%" height={12} />
                                <SkeletonBlock width="40%" height={10} />
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <SkeletonBlock width={40} height={12} />
                                <SkeletonBlock width={60} height={18} className="rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            );

        case 'vitals':
            return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
                            <SkeletonBlock width="50%" height={12} />
                            <SkeletonBlock width="80%" height={20} className="rounded-md" />
                            <SkeletonBlock width="30%" height={10} />
                        </div>
                    ))}
                </div>
            );

        case 'text':
        default:
            return (
                <div className="flex flex-col gap-2 py-1">
                    {Array.from({ length: lines }).map((_, i) => (
                        <SkeletonBlock
                            key={i}
                            width={i === lines - 1 ? '70%' : '100%'}
                            height={12}
                        />
                    ))}
                </div>
            );
    }
};

export default SkeletonLoader;
