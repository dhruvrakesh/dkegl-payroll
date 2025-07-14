
import { useState, useEffect, useMemo } from 'react';
import { useAttendanceData } from './useAttendanceData';

export interface GraphFilters {
  unitIds: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  chartType: 'line' | 'bar' | 'stacked' | 'comparison';
  period: 'daily' | 'weekly' | 'monthly';
}

export interface GraphData {
  unitComparison: Array<{
    unitName: string;
    totalHours: number;
    employeeCount: number;
    utilizationRate: number;
  }>;
  trendData: Array<{
    date: string;
    [unitName: string]: number | string;
  }>;
  distributionData: Array<{
    employeeName: string;
    hours: number;
    unit: string;
  }>;
}

export const useGraphData = (filters: GraphFilters) => {
  const [graphData, setGraphData] = useState<GraphData>({
    unitComparison: [],
    trendData: [],
    distributionData: []
  });

  const attendanceFilters = useMemo(() => ({
    dateRange: filters.dateRange,
    employeeIds: [],
    unitIds: filters.unitIds
  }), [filters.dateRange, filters.unitIds]);

  const { aggregatedData, attendanceRecords, loading } = useAttendanceData(attendanceFilters);

  useEffect(() => {
    if (loading || !aggregatedData) return;

    // Process unit comparison data
    const unitComparison = aggregatedData.unitWiseStats.map(unit => ({
      unitName: unit.unitName,
      totalHours: unit.totalHours,
      employeeCount: unit.employeesWithAttendance,
      utilizationRate: unit.utilizationRate
    }));

    // Process trend data based on period
    let trendData = [];
    if (filters.period === 'daily') {
      trendData = aggregatedData.dailyStats.map(day => ({
        date: new Date(day.date).toLocaleDateString(),
        totalHours: day.totalHours,
        employeeCount: day.employeeCount
      }));
    }

    // Process distribution data
    const distributionData = aggregatedData.employeeStats.map(emp => ({
      employeeName: emp.employeeName,
      hours: emp.totalHours,
      unit: 'Unknown' // Will be enhanced with proper unit mapping
    }));

    setGraphData({
      unitComparison,
      trendData,
      distributionData
    });
  }, [aggregatedData, loading, filters.period]);

  return {
    graphData,
    loading,
    rawData: aggregatedData
  };
};
