
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Clock, TrendingUp, Calendar } from 'lucide-react';

interface AggregatedData {
  totalEmployees: number;
  totalHours: number;
  totalOvertimeHours: number;
  averageHoursPerDay: number;
  attendanceRate: number;
  dailyStats: Array<{
    date: string;
    totalHours: number;
    employeeCount: number;
  }>;
  employeeStats: Array<{
    employeeId: string;
    employeeName: string;
    totalHours: number;
    totalDays: number;
    averageHours: number;
  }>;
}

interface AttendanceSummaryViewProps {
  data: AggregatedData;
  loading: boolean;
}

export const AttendanceSummaryView: React.FC<AttendanceSummaryViewProps> = ({
  data,
  loading
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const chartConfig = {
    totalHours: {
      label: "Total Hours",
      color: "hsl(var(--chart-1))"
    },
    employeeCount: {
      label: "Employee Count",
      color: "hsl(var(--chart-2))"
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active in selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              +{data.totalOvertimeHours.toFixed(1)} overtime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Hours/Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageHoursPerDay.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Across all employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.dailyStats.length}</div>
            <p className="text-xs text-muted-foreground">Days with attendance</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Hours Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Hours Trend</CardTitle>
            <CardDescription>Total hours worked per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dailyStats.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="totalHours" 
                    stroke="var(--color-totalHours)" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Employees by Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Top Employees by Hours</CardTitle>
            <CardDescription>Total hours worked in selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.employeeStats.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="employeeName" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="totalHours" 
                    fill="var(--color-totalHours)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Performance Summary</CardTitle>
          <CardDescription>Detailed breakdown by employee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Employee</th>
                  <th className="text-right p-2">Total Days</th>
                  <th className="text-right p-2">Total Hours</th>
                  <th className="text-right p-2">Avg Hours/Day</th>
                </tr>
              </thead>
              <tbody>
                {data.employeeStats.map((emp) => (
                  <tr key={emp.employeeId} className="border-b">
                    <td className="p-2 font-medium">{emp.employeeName}</td>
                    <td className="p-2 text-right">{emp.totalDays}</td>
                    <td className="p-2 text-right">{emp.totalHours.toFixed(1)}</td>
                    <td className="p-2 text-right">{emp.averageHours.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
