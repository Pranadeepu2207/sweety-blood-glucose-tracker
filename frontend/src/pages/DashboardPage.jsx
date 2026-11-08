import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import SlotProgress from '../components/SlotProgress';
import ReadingModal from '../components/ReadingModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import EmptyState from '../components/EmptyState';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const getTodayDateStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = getTodayDateStr();

  // State
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dateFilterActive, setDateFilterActive] = useState(true);
  const [readings, setReadings] = useState([]);
  const [todayReadings, setTodayReadings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generalError, setGeneralError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [preselectedSlot, setPreselectedSlot] = useState(null);

  // Delete State
  const [readingToDelete, setReadingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch readings for slot progress bar (always for selectedDate)
  const fetchSelectedDateReadings = useCallback(async () => {
    try {
      const data = await api.get(`/readings?date=${selectedDate}&limit=10`);
      setTodayReadings(data.readings || []);
    } catch (err) {
      console.error('Failed to load slots for date:', err);
    }
  }, [selectedDate]);

  // Fetch readings list (either for selectedDate or all paginated)
  const fetchReadingsList = useCallback(async () => {
    setLoading(true);
    setGeneralError(null);
    try {
      const dateParam = dateFilterActive ? `&date=${selectedDate}` : '';
      const data = await api.get(`/readings?page=${currentPage}&limit=20${dateParam}`);
      setReadings(data.readings || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setGeneralError(err.message || 'Failed to fetch readings.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, dateFilterActive, currentPage]);

  useEffect(() => {
    fetchSelectedDateReadings();
    fetchReadingsList();
  }, [fetchSelectedDateReadings, fetchReadingsList]);

  const handleOpenAdd = (slot = null) => {
    setEditingReading(null);
    setPreselectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reading) => {
    setEditingReading(reading);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    if (editingReading) {
      await api.put(`/readings/${editingReading.id}`, formData);
    } else {
      await api.post('/readings', formData);
    }
    await Promise.all([fetchSelectedDateReadings(), fetchReadingsList()]);
  };

  const handleDeleteConfirm = async () => {
    if (!readingToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/readings/${readingToDelete.id}`);
      setReadingToDelete(null);
      await Promise.all([fetchSelectedDateReadings(), fetchReadingsList()]);
    } catch (err) {
      setGeneralError(err.message || 'Failed to delete reading.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getLevelBadge = (val) => {
    if (val < 70) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
          Low (&lt;70)
        </span>
      );
    }
    if (val > 140) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-brand-crimson">
          Elevated (&gt;140)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
        In Range
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-brand-dark">
            Blood Glucose Readings
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Record and review your daily blood sugar entries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Date Picker */}
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-md px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              type="date"
              max={todayStr}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs sm:text-sm text-gray-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Add Reading Button */}
          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 bg-brand-primary text-white rounded-md text-xs sm:text-sm font-semibold hover:bg-brand-crimson transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reading</span>
          </button>
        </div>
      </div>

      {generalError && (
        <div className="mb-6 p-3.5 bg-red-50 border border-brand-soft rounded-md flex items-center space-x-2 text-xs sm:text-sm text-brand-crimson">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-brand-primary" />
          <span>{generalError}</span>
        </div>
      )}

      {/* 4 Daily Slots Tracker Component */}
      <SlotProgress
        readingsForDate={todayReadings}
        onAddSlot={(slot) => handleOpenAdd(slot)}
      />

      {/* Readings Table / Cards Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Table Filter Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <h2 className="text-sm sm:text-base font-bold text-brand-dark">
              Logged Readings
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              {pagination.total} total
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
            <button
              onClick={() => {
                setDateFilterActive(!dateFilterActive);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-md border transition-colors ${
                dateFilterActive
                  ? 'border-brand-primary bg-red-50 text-brand-crimson font-semibold'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{dateFilterActive ? `Filtered: ${selectedDate}` : 'Show All Dates'}</span>
            </button>

            <button
              onClick={() => {
                fetchSelectedDateReadings();
                fetchReadingsList();
              }}
              title="Refresh readings"
              className="p-1.5 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-14 text-center text-xs sm:text-sm text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-primary" />
            Loading readings...
          </div>
        ) : readings.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              title={
                dateFilterActive
                  ? `No readings recorded for ${selectedDate}`
                  : 'No readings found'
              }
              description="Record your blood glucose levels across Morning, After breakfast, After lunch, or After dinner."
              actionLabel="Log a Reading"
              onAction={() => handleOpenAdd()}
            />
          </div>
        ) : (
          <div>
            {/* Desktop / Tablet Table View (hidden on small phones) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Time Slot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Glucose Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {readings.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {r.reading_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="font-semibold text-brand-dark">{r.slot}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-base font-bold text-gray-900">{r.value}</span>
                        <span className="text-xs text-gray-500 ml-1">mg/dl</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getLevelBadge(r.value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 text-gray-500 hover:text-brand-crimson hover:bg-gray-100 rounded-md transition-colors"
                            title="Edit reading"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setReadingToDelete(r)}
                            className="p-1.5 text-gray-500 hover:text-brand-primary hover:bg-gray-100 rounded-md transition-colors"
                            title="Delete reading"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View (shown on phones < sm) */}
            <div className="block sm:hidden divide-y divide-gray-200">
              {readings.map((r) => (
                <div key={r.id} className="p-4 hover:bg-gray-50/80 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-brand-dark">{r.slot}</span>
                    <span className="text-xs text-gray-500">{r.reading_date}</span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xl font-bold text-gray-900">{r.value}</span>
                      <span className="text-xs text-gray-500">mg/dl</span>
                      <div className="ml-1">{getLevelBadge(r.value)}</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="p-1.5 text-gray-600 hover:text-brand-crimson border border-gray-200 rounded-md bg-white"
                        title="Edit reading"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setReadingToDelete(r)}
                        className="p-1.5 text-gray-600 hover:text-brand-primary border border-gray-200 rounded-md bg-white"
                        title="Delete reading"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Bar (?page=1&limit=20) */}
        {pagination.totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-gray-600 text-center sm:text-left">
              Page <span className="font-semibold text-gray-900">{pagination.page}</span> of{' '}
              <span className="font-semibold text-gray-900">{pagination.totalPages}</span> ({pagination.total} readings)
            </div>

            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="inline-flex items-center space-x-1 px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex items-center space-x-1 px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Reading Modal */}
      <ReadingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReading(null);
          setPreselectedSlot(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={
          editingReading ||
          (preselectedSlot ? { slot: preselectedSlot, reading_date: selectedDate } : null)
        }
        defaultDate={selectedDate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(readingToDelete)}
        reading={readingToDelete}
        isDeleting={isDeleting}
        onClose={() => setReadingToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
