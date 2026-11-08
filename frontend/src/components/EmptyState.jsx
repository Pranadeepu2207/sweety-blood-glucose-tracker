import React from 'react';
import { Inbox, Plus } from 'lucide-react';

export default function EmptyState({
  title = 'No glucose readings found',
  description = 'No readings have been logged for this period yet.',
  actionLabel,
  onAction
}) {
  return (
    <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 sm:p-12 text-center max-w-xl mx-auto my-6">
      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-500">
        <Inbox className="w-6 h-6 stroke-[1.8]" />
      </div>
      <h3 className="text-base font-semibold text-brand-dark mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-primary text-white rounded-md text-sm font-medium hover:bg-brand-crimson transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

