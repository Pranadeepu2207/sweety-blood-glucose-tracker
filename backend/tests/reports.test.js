const { calculateMetrics, getReportDateRanges } = require('../src/controllers/reportController');

describe('Report Metrics & Date Range Logic', () => {
  describe('calculateMetrics()', () => {
    test('returns correct metrics for valid readings and rounds average to 1 decimal', () => {
      const readings = [
        { slot: 'Morning (fasting)', value: 95 },
        { slot: 'After breakfast', value: 140 },
        { slot: 'After lunch', value: 125 },
        { slot: 'After dinner', value: 162 }
      ];

      const metrics = calculateMetrics(readings);

      expect(metrics.count).toBe(4);
      expect(metrics.highest).toBe(162);
      expect(metrics.lowest).toBe(95);
      // Average: (95 + 140 + 125 + 162) / 4 = 522 / 4 = 130.5
      expect(metrics.average).toBe(130.5);
    });

    test('rounds average to exactly 1 decimal place with periodic decimals', () => {
      // (100 + 101 + 103) / 3 = 304 / 3 = 101.33333... -> 101.3
      const readings = [
        { value: 100 },
        { value: 101 },
        { value: 103 }
      ];

      const metrics = calculateMetrics(readings);
      expect(metrics.count).toBe(3);
      expect(metrics.average).toBe(101.3);
    });

    test('returns friendly empty state metrics when readings array is empty', () => {
      const emptyMetrics = calculateMetrics([]);

      expect(emptyMetrics).toEqual({
        count: 0,
        highest: null,
        lowest: null,
        average: null
      });
    });

    test('handles single reading correctly', () => {
      const single = [{ value: 110 }];
      const metrics = calculateMetrics(single);

      expect(metrics.count).toBe(1);
      expect(metrics.highest).toBe(110);
      expect(metrics.lowest).toBe(110);
      expect(metrics.average).toBe(110);
    });
  });

  describe('getReportDateRanges()', () => {
    test('computes Daily, Month-to-date and Previous Month ranges accurately (October)', () => {
      const ranges = getReportDateRanges('2026-10-15');

      // Daily: The selected date
      expect(ranges.daily).toEqual({
        startDate: '2026-10-15',
        endDate: '2026-10-15'
      });

      // Month-to-date: 1st of month to selected date
      expect(ranges.mtd).toEqual({
        startDate: '2026-10-01',
        endDate: '2026-10-15'
      });

      // Monthly: Whole previous month (1 Sep - 30 Sep 2026)
      expect(ranges.monthly).toEqual({
        startDate: '2026-09-01',
        endDate: '2026-09-30'
      });
    });

    test('handles January rollover to previous year December correctly', () => {
      const ranges = getReportDateRanges('2026-01-10');

      expect(ranges.daily).toEqual({
        startDate: '2026-01-10',
        endDate: '2026-01-10'
      });

      expect(ranges.mtd).toEqual({
        startDate: '2026-01-01',
        endDate: '2026-01-10'
      });

      // Whole previous month is December of previous year (2025-12-01 to 2025-12-31)
      expect(ranges.monthly).toEqual({
        startDate: '2025-12-01',
        endDate: '2025-12-31'
      });
    });

    test('handles March previous month (February leap year / non-leap year)', () => {
      // 2024 is leap year, Feb has 29 days
      const ranges2024 = getReportDateRanges('2024-03-05');
      expect(ranges2024.monthly).toEqual({
        startDate: '2024-02-01',
        endDate: '2024-02-29'
      });

      // 2026 is non-leap year, Feb has 28 days
      const ranges2026 = getReportDateRanges('2026-03-12');
      expect(ranges2026.monthly).toEqual({
        startDate: '2026-02-01',
        endDate: '2026-02-28'
      });
    });
  });
});

