
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Clock, TrendingUp, Calendar, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface UnitWiseData {
  unitId: string;
  unitName: string;
  totalEmployees: number;
  employeesWithAttendance: number;
  totalHours: number;
  totalOvertimeHours: number;
  averageHours: number;
  utilizationRate: number;
}

interface AggregatedData {
  totalEmployees: number;
  totalActiveEmployees: number;
  employeesWithAttendance: number;
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
  unitWiseStats: UnitWiseData[];
}

interface AttendanceSummaryViewProps {
  data: AggregatedData;
  loading: boolean;
}

export const AttendanceSummaryView: React.FC<AttendanceSummaryViewProps> = ({
  data,
  loading
}) => {
  const [isUnitDetailsOpen, setIsUnitDetailsOpen] = useState(false);

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
    },
    utilizationRate: {
      label: "Utilization Rate",
      color: "hsl(var(--chart-3))"
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {data.totalActiveEmployees} active • {data.employeesWithAttendance} with attendance
            </p>
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
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.attendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Employee participation</p>
          </CardContent>
        </Card>
      </div>

      {/* Unit-wise Summary Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Unit-wise Performance
              </CardTitle>
              <CardDescription>Breakdown by organizational units</CardDescription>
            </div>
            <Collapsible open={isUnitDetailsOpen} onOpenChange={setIsUnitDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isUnitDetailsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {isUnitDetailsOpen ? 'Hide Details' : 'Show Details'}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Unit</th>
                  <th className="text-right p-2">Total Employees</th>
                  <th className="text-right p-2">With Attendance</th>
                  <th className="text-right p-2">Utilization</th>
                  <th className="text-right p-2">Total Hours</th>
                  <th className="text-right p-2">Avg Hours</th>
                </tr>
              </thead>
              <tbody>
                {data.unitWiseStats.map((unit) => (
                  <tr key={unit.unitId} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{unit.unitName}</td>
                    <td className="p-2 text-right">{unit.totalEmployees}</td>
                    <td className="p-2 text-right">{unit.employeesWithAttendance}</td>
                    <td className="p-2 text-right">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        unit.utilizationRate >= 80 ? 'bg-green-100 text-green-800' :
                        unit.utilizationRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {unit.utilizationRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right">{unit.totalHours.toFixed(1)}</td>
                    <td className="p-2 text-right">{unit.averageHours.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Collapsible open={isUnitDetailsOpen} onOpenChange={setIsUnitDetailsOpen}>
            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Unit Utilization Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Unit Utilization Rates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.unitWiseStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="unitName" angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="utilizationRate" fill="var(--color-utilizationRate)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Unit Hours Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Unit Hours Comparison</CardTitle>  
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.unitWiseStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="unitName" angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="totalHours" fill="var(--color-totalHours)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

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
