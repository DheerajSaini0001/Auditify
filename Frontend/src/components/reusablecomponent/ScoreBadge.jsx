import React from 'react';
import { statusBadge } from '../../utils/statusColors';

const ScoreBadge = ({ status, value, darkMode, className = "" }) => {
    return (
        <span className={`text-xs font-black px-3 py-1 rounded-lg border ${statusBadge(status, darkMode)} ${className}`}>
            {value}
        </span>
    );
};

export default ScoreBadge;
