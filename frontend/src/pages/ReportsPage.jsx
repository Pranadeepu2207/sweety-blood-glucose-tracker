import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import SummaryCard from '../components/SummaryCard';
import EmptyState from '../components/EmptyState';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Clock,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function ReportsPage() {
  // Helper for today's date YYYY-MM-DD
  const getTodayString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = getTodayString();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeReportTab, setActiveReportTab] = useState('daily'); // 'daily', 'mtd', 'monthly'
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/reports/summary?date=${selectedDate}`);
      setReportsData(data);
    } catch (err) {
      setError(err.message || 'Failed to load glucose reports.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Format date helper (e.g. "15 Oct 2026")
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Date Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-dark">
            Glucose Reports
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Clinical summaries across daily, month-to-date, and previous-month timeframes.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-md px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              max={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm text-gray-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
            />
          </div>

          <button
            onClick={fetchReports}
            title="Refresh reports"
            className="p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-600 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-brand-soft rounded-md flex items-center space-x-2 text-sm text-brand-crimson">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-brand-primary" />
          <span>{error}</span>
        </div>
      )}

      {/* Report Navigation Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 p-2 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveReportTab('daily')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-md text-sm font-semibold transition-colors ${
            activeReportTab === 'daily'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Daily Report
        </button>

        <button
          onClick={() => setActiveReportTab('mtd')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-md text-sm font-semibold transition-colors ${
            activeReportTab === 'mtd'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Month-to-Date
        </button>

        <button
          onClick={() => setActiveReportTab('monthly')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-md text-sm font-semibold transition-colors ${
            activeReportTab === 'monthly'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Monthly (Previous Month)
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-16 text-center text-sm text-gray-500 shadow-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-primary" />
          Calculating report metrics...
        </div>
      ) : !reportsData ? null : (
        <div>
          {/* TAB 1: DAILY REPORT */}
          {activeReportTab === 'daily' && (
            <div className="space-y-6">
              {/* Report Header Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Report Type
                    </span>
                    <h2 className="text-lg font-bold text-brand-dark">Daily Report</h2>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Date Range
                    </span>
                    <div className="text-sm font-bold text-gray-900">
                      {formatDateDisplay(reportsData.daily.range.startDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                  title="Highest Reading"
                  value={reportsData.daily.highest}
                  icon={TrendingUp}
                  subtitle={reportsData.daily.count > 0 ? 'Peak glucose level' : 'No records'}
                />
                <SummaryCard
                  title="Lowest Reading"
                  value={reportsData.daily.lowest}
                  icon={TrendingDown}
                  subtitle={reportsData.daily.count > 0 ? 'Minimum glucose level' : 'No records'}
                />
                <SummaryCard
                  title="Average Reading"
                  value={reportsData.daily.average}
                  icon={Activity}
                  subtitle={reportsData.daily.count > 0 ? 'Rounded to 1 decimal' : 'No records'}
                />
                <SummaryCard
                  title="Total Readings"
                  value={reportsData.daily.count}
                  unit="readings"
                  icon={Layers}
                  subtitle="Recorded on this date"
                />
              </div>

              {/* Requirement: The daily report also lists each reading with its slot */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider">
                    Daily Readings Breakdown
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Individual blood sugar recordings by assigned time slot for {formatDateDisplay(selectedDate)}.
                  </p>
                </div>

                {reportsData.daily.count === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title="No readings on this date"
                      description={`No glucose readings were recorded on ${formatDateDisplay(selectedDate)}.`}
                    />
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {reportsData.daily.readings.map((reading) => (
                      <div
                        key={reading.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-600">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-brand-dark block">
                              {reading.slot}
                            </span>
                            <span className="text-xs text-gray-500">
                              Logged on {reading.reading_date}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {reading.value}{' '}
                            <span className="text-xs font-normal text-gray-500">mg/dl</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MONTH-TO-DATE (MTD) REPORT */}
          {activeReportTab === 'mtd' && (
            <div className="space-y-6">
              {/* Report Header Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Report Type
                    </span>
                    <h2 className="text-lg font-bold text-brand-dark">Month-to-Date Report</h2>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Date Range
                    </span>
                    <div className="text-sm font-bold text-gray-900">
                      {formatDateDisplay(reportsData.monthToDate.range.startDate)} - {formatDateDisplay(reportsData.monthToDate.range.endDate)}
                    </div>
                  </div>
                </div>
              </div>

              {reportsData.monthToDate.count === 0 ? (
                <EmptyState
                  title="No readings recorded for this month to date"
                  description="Start logging your daily glucose slots to view aggregated metrics."
                />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <SummaryCard
                    title="Highest Reading"
                    value={reportsData.monthToDate.highest}
                    icon={TrendingUp}
                    subtitle="Peak value this month"
                  />
                  <SummaryCard
                    title="Lowest Reading"
                    value={reportsData.monthToDate.lowest}
                    icon={TrendingDown}
                    subtitle="Lowest value this month"
                  />
                  <SummaryCard
                    title="Average Reading"
                    value={reportsData.monthToDate.average}
                    icon={Activity}
                    subtitle="Rounded to 1 decimal"
                  />
                  <SummaryCard
                    title="Total Readings"
                    value={reportsData.monthToDate.count}
                    unit="readings"
                    icon={Layers}
                    subtitle="Month-to-date entries"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MONTHLY (PREVIOUS MONTH) REPORT */}
          {activeReportTab === 'monthly' && (
            <div className="space-y-6">
              {/* Report Header Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Report Type
                    </span>
                    <h2 className="text-lg font-bold text-brand-dark">
                      Monthly Report (Previous Month)
                    </h2>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Date Range
                    </span>
                    <div className="text-sm font-bold text-gray-900">
                      {formatDateDisplay(reportsData.monthly.range.startDate)} - {formatDateDisplay(reportsData.monthly.range.endDate)}
                    </div>
                  </div>
                </div>
              </div>

              {reportsData.monthly.count === 0 ? (
                <EmptyState
                  title="No readings found for the previous month"
                  description={`No glucose entries were recorded between ${formatDateDisplay(reportsData.monthly.range.startDate)} and ${formatDateDisplay(reportsData.monthly.range.endDate)}.`}
                />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <SummaryCard
                    title="Highest Reading"
                    value={reportsData.monthly.highest}
                    icon={TrendingUp}
                    subtitle="Peak value previous month"
                  />
                  <SummaryCard
                    title="Lowest Reading"
                    value={reportsData.monthly.lowest}
                    icon={TrendingDown}
                    subtitle="Lowest value previous month"
                  />
                  <SummaryCard
                    title="Average Reading"
                    value={reportsData.monthly.average}
                    icon={Activity}
                    subtitle="Rounded to 1 decimal"
                  />
                  <SummaryCard
                    title="Total Readings"
                    value={reportsData.monthly.count}
                    unit="readings"
                    icon={Layers}
                    subtitle="Whole previous month"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
