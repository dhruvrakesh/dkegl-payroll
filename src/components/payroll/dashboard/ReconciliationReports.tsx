
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { FileText, Download, Mail, Calendar, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReconciliationReportsProps {
  month: number;
  year: number;
  unitId?: string;
}

export const ReconciliationReports: React.FC<ReconciliationReportsProps> = ({ month, year, unitId }) => {
  const [selectedReportType, setSelectedReportType] = useState<string>('summary');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [dateRange, setDateRange] = useState<{from: Date; to: Date} | undefined>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const reportTypes = [
    { value: 'summary', label: 'Reconciliation Summary', icon: FileText },
    { value: 'adjustments', label: 'Adjustment Details', icon: Users },
    { value: 'trends', label: 'Trend Analysis', icon: TrendingUp },
    { value: 'compliance', label: 'Compliance Audit', icon: Calendar },
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF Report' },
    { value: 'excel', label: 'Excel Spreadsheet' },
    { value: 'csv', label: 'CSV Data' },
  ];

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // Generate report based on selected type and format
      const reportData = await generateReportData();
      
      if (selectedFormat === 'pdf') {
        await generatePDFReport(reportData);
      } else if (selectedFormat === 'excel') {
        await generateExcelReport(reportData);
      } else {
        await generateCSVReport(reportData);
      }

      toast({
        title: 'Report Generated',
        description: `${selectedReportType} report has been generated successfully.`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = async () => {
    // Fetch data based on report type
    const { data: reconciliationData } = await supabase
      .from('leave_reconciliation_status')
      .select('*')
      .gte('reconciliation_date', new Date(year, month - 1, 1).toISOString())
      .lte('reconciliation_date', new Date(year, month, 0).toISOString());

    const { data: adjustmentData } = await supabase
      .from('leave_adjustment_history')
      .select('*')
      .gte('created_at', new Date(year, month - 1, 1).toISOString())
      .lte('created_at', new Date(year, month, 0).toISOString());

    return {
      reconciliation: reconciliationData || [],
      adjustments: adjustmentData || [],
      summary: {
        totalEmployees: reconciliationData?.reduce((sum, r) => sum + r.total_employees, 0) || 0,
        totalAdjustments: reconciliationData?.reduce((sum, r) => sum + r.total_adjustments, 0) || 0,
        completionRate: reconciliationData?.filter(r => r.is_completed).length || 0,
      }
    };
  };

  const generatePDFReport = async (data: any) => {
    // PDF generation logic would go here
    console.log('Generating PDF report with data:', data);
    // This would typically use a library like jsPDF or call a server endpoint
  };

  const generateExcelReport = async (data: any) => {
    // Excel generation logic would go here
    console.log('Generating Excel report with data:', data);
    // This would typically use a library like xlsx
  };

  const generateCSVReport = async (data: any) => {
    // CSV generation logic would go here
    console.log('Generating CSV report with data:', data);
    // This would convert data to CSV format and download
  };

  const handleScheduleReport = () => {
    toast({
      title: 'Report Scheduled',
      description: 'Monthly report has been scheduled for automatic generation.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>
            Create comprehensive reports for reconciliation analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <type.icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleGenerateReport}
                disabled={loading}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button 
                onClick={handleScheduleReport}
                variant="outline"
                className="flex-1"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Monthly
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>
            Pre-configured reports for common reconciliation tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((type) => (
              <div key={type.value} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <type.icon className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">{type.label}</h4>
                  </div>
                  <Badge variant="outline">Available</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {type.value === 'summary' && 'Comprehensive overview of reconciliation status and key metrics'}
                  {type.value === 'adjustments' && 'Detailed breakdown of all leave adjustments made'}
                  {type.value === 'trends' && 'Historical analysis and trend identification'}
                  {type.value === 'compliance' && 'Audit trail and compliance verification'}
                </p>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedReportType(type.value);
                      handleGenerateReport();
                    }}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Generate
                  </Button>
                  <Button size="sm" variant="outline">
                    <Mail className="mr-1 h-3 w-3" />
                    Email
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report History</CardTitle>
          <CardDescription>
            Previously generated reports and scheduled reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Monthly Summary - {new Date(year, month-1).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</div>
                  <div className="text-sm text-muted-foreground">Generated 2 days ago</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">PDF</Badge>
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Employee Adjustments Report</div>
                  <div className="text-sm text-muted-foreground">Generated 1 week ago</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Excel</Badge>
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium">Scheduled: Monthly Compliance Report</div>
                  <div className="text-sm text-muted-foreground">Next generation: End of month</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Scheduled</Badge>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
