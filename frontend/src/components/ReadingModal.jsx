import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

export default function ReadingModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  defaultDate = ''
}) {
  const [readingDate, setReadingDate] = useState('');
  const [slot, setSlot] = useState(SLOTS[0]);
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper for today's date string YYYY-MM-DD
  const getTodayString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = getTodayString();

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialData) {
        setReadingDate(initialData.reading_date || todayStr);
        setSlot(initialData.slot || SLOTS[0]);
        setValue(String(initialData.value || ''));
      } else {
        setReadingDate(defaultDate || todayStr);
        setSlot(initialData?.slot || SLOTS[0]);
        setValue('');
      }
    }
  }, [isOpen, initialData, defaultDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Frontend pre-validation to match assignment rules directly
    if (readingDate > todayStr) {
      setError('Date cannot be in the future.');
      return;
    }

    if (value === undefined || value === null || String(value).trim() === '') {
      setError('Please enter a glucose value.');
      return;
    }

    const num = Number(value);
    if (!Number.isInteger(num) || num < 40 || num > 600) {
      setError('Value must be between 40 and 600 mg/dl.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        reading_date: readingDate,
        slot,
        value: num
      });
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred while saving the reading.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-brand-dark">
            {initialData?.id ? 'Edit Blood Glucose Reading' : 'Log Blood Glucose Reading'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-brand-soft rounded-md flex items-start space-x-2 text-sm text-brand-crimson">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-primary" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Date Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              max={todayStr}
              value={readingDate}
              onChange={(e) => setReadingDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
            />
            <span className="text-xs text-gray-400 mt-1 block">Date cannot be in the future</span>
          </div>

          {/* Time Slot Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Time Slot
            </label>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
            >
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Glucose Value Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Glucose Value (mg/dl)
            </label>
            <div className="relative">
              <input
                type="number"
                min="40"
                max="600"
                step="1"
                placeholder="e.g. 110"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 pr-16"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-medium text-gray-400">
                mg/dl
              </div>
            </div>
            <span className="text-xs text-gray-400 mt-1 block">Whole number between 40 and 600</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-primary text-white rounded-md text-sm font-medium hover:bg-brand-crimson transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialData?.id ? 'Save Changes' : 'Log Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

