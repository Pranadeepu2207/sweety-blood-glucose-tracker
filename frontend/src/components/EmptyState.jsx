import React from 'react';
import { Inbox, Plus } from 'lucide-react';

export default function EmptyState({
  title = 'No glucose readings found',
  description = 'No readings have been logged for this period yet.',
  actionLabel,
  onAction
}) {
  return (
    <div className="bg-white border border-dashed border-gray-300 rounded-lg p-6 sm:p-10 text-center max-w-xl mx-auto my-4 sm:my-6">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3 sm:mb-4 text-gray-500">
        <Inbox className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-brand-dark mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mb-5 sm:mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 bg-brand-primary text-white rounded-md text-xs sm:text-sm font-semibold hover:bg-brand-crimson transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
