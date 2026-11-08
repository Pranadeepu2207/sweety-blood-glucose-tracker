import React from 'react';

export default function SummaryCard({
  title,
  value,
  unit = 'mg/dl',
  subtitle,
  icon: Icon,
  variant = 'default'
}) {
  const isAvailable = value !== null && value !== undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center text-gray-600">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-dark">
          {isAvailable ? value : '-'}
        </span>
        {isAvailable && unit && (
          <span className="text-xs font-medium text-gray-500">{unit}</span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-gray-500 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
