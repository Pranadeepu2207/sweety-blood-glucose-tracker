import React from 'react';
import { Check, Clock, Plus } from 'lucide-react';

const ALL_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

export default function SlotProgress({ readingsForDate = [], onAddSlot }) {
  const loggedSlotMap = new Map();
  readingsForDate.forEach((r) => {
    loggedSlotMap.set(r.slot, r);
  });

  const count = loggedSlotMap.size;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-bold text-brand-dark uppercase tracking-wider">
            Daily Slots Tracker
          </h2>
          <p className="text-xs text-gray-500">
            Patients can record up to 4 readings per day across designated slots.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md">
            {count} of 4 logged
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ALL_SLOTS.map((slot) => {
          const reading = loggedSlotMap.get(slot);
          const isLogged = Boolean(reading);

          return (
            <div
              key={slot}
              className={`border rounded-lg p-3 transition-colors ${
                isLogged
                  ? 'border-green-200 bg-green-50/40'
                  : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-500">Slot</span>
                {isLogged ? (
                  <span className="inline-flex items-center space-x-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                    <Check className="w-3 h-3" />
                    <span>Logged</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3" />
                    <span>Pending</span>
                  </span>
                )}
              </div>

              <div className="font-semibold text-sm text-brand-dark mb-1">
                {slot}
              </div>

              {isLogged ? (
                <div className="text-xs text-gray-700 font-medium">
                  Value: <span className="font-bold text-gray-900">{reading.value}</span> mg/dl
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onAddSlot(slot)}
                  className="mt-1 inline-flex items-center space-x-1 text-xs font-medium text-brand-primary hover:text-brand-crimson"
                >
                  <Plus className="w-3 h-3" />
                  <span>Log reading</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
