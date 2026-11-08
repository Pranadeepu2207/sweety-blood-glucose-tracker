import React from 'react';

export default function SummaryCard({
  title,
  value,
  unit = 'mg/dl',
  subtitle,
  icon: Icon
}) {
  const isAvailable = value !== null && value !== undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3.5 sm:p-5 shadow-sm hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 truncate mr-1">
          {title}
        </span>
        {Icon && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-gray-50 flex items-center justify-center text-gray-600 flex-shrink-0">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-1.5">
        <span className="text-xl sm:text-2xl font-bold tracking-tight text-brand-dark">
          {isAvailable ? value : '-'}
        </span>
        {isAvailable && unit && (
          <span className="text-[10px] sm:text-xs font-medium text-gray-500">{unit}</span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-gray-500 font-medium truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
