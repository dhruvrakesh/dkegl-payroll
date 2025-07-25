
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceTableView } from './attendance/AttendanceTableView';
import { AttendanceCalendarView } from './attendance/AttendanceCalendarView';
import { AttendanceEmployeeView } from './attendance/AttendanceEmployeeView';
import { AttendanceSummaryView } from './attendance/AttendanceSummaryView';
import { AttendanceFilters } from './attendance/AttendanceFilters';
import { AttendanceCsvUploader } from '../AttendanceCsvUploader';
import { AttendanceBulkUpdater } from '../AttendanceBulkUpdater';
import { AttendanceBulkUpdateHistory } from './AttendanceBulkUpdateHistory';
import { AttendanceDataFixSummary } from './AttendanceDataFixSummary';
import { useAttendanceData } from '@/hooks/useAttendanceData';
import { getDefaultAttendanceFilters } from '@/config/utils';
import { AttendanceFilters as AttendanceFiltersType, Employee } from '@/config/types';
import { Calendar, Users, BarChart3, Table, Upload, Edit, History, CheckCircle } from 'lucide-react';

export const AttendanceManagement = () => {
  const [activeView, setActiveView] = useState('summary');
  const [filters, setFilters] = useState<AttendanceFiltersType>(getDefaultAttendanceFilters());

  const { 
    attendanceRecords, 
    employees, 
    loading, 
    refreshAttendance,
    aggregatedData 
  } = useAttendanceData(filters);

  const handleCsvUploadSuccess = () => {
    // Refresh data after successful CSV upload
    refreshAttendance();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Attendance Management</h3>
      </div>

      <AttendanceFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        employees={employees}
      />

      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="employee" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            By Employee
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table className="w-4 h-4" />
            Detailed Table
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Bulk Upload
          </TabsTrigger>
          <TabsTrigger value="bulk-update" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Bulk Update
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="data-fix" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Data Fix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <AttendanceSummaryView 
            data={aggregatedData}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <AttendanceCalendarView 
            attendanceRecords={attendanceRecords}
            employees={employees}
            loading={loading}
            onRefresh={refreshAttendance}
            filters={filters}
          />
        </TabsContent>

        <TabsContent value="employee">
          <AttendanceEmployeeView 
            attendanceRecords={attendanceRecords}
            employees={employees}
            loading={loading}
            onRefresh={refreshAttendance}
          />
        </TabsContent>

        <TabsContent value="table">
          <AttendanceTableView 
            attendanceRecords={attendanceRecords}
            employees={employees}
            loading={loading}
            onRefresh={refreshAttendance}
          />
        </TabsContent>

        <TabsContent value="upload">
          <AttendanceCsvUploader onUploadSuccess={handleCsvUploadSuccess} />
        </TabsContent>

        <TabsContent value="bulk-update">
          <AttendanceBulkUpdater onUpdateSuccess={handleCsvUploadSuccess} />
        </TabsContent>

        <TabsContent value="history">
          <AttendanceBulkUpdateHistory />
        </TabsContent>

        <TabsContent value="data-fix">
          <AttendanceDataFixSummary />
        </TabsContent>
      </Tabs>
    </div>
  );
};
