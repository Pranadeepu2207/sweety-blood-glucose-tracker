import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  reading,
  isDeleting
}) {
  if (!isOpen || !reading) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-lg max-w-sm w-full shadow-xl border border-gray-200 overflow-hidden my-6">
        <div className="p-5 sm:p-6">
          <div className="w-10 h-10 rounded-md bg-red-100 flex items-center justify-center text-brand-primary mx-auto mb-3.5">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <h3 className="text-base font-bold text-center text-brand-dark mb-1.5">
            Delete Reading
          </h3>

          <p className="text-xs sm:text-sm text-center text-gray-600 mb-5">
            Are you sure you want to delete the <span className="font-semibold text-gray-900">{reading.slot}</span> reading of <span className="font-semibold text-gray-900">{reading.value} mg/dl</span> on <span className="font-semibold text-gray-900">{reading.reading_date}</span>?
          </p>

          <div className="flex space-x-2.5 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-3.5 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-3.5 py-2 bg-brand-primary text-white rounded-md text-xs sm:text-sm font-semibold hover:bg-brand-crimson transition-colors shadow-sm disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
