
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Upload, Download, FileText, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Papa from 'papaparse';

interface LeaveApplication {
  employee_code: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const BulkLeaveApplicationSystem = () => {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [recentApplications, setRecentApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const leaveTypes = [
    { value: 'CASUAL_LEAVE', label: 'Casual Leave' },
    { value: 'EARNED_LEAVE', label: 'Earned Leave' },
    { value: 'SICK_LEAVE', label: 'Sick Leave' },
    { value: 'MATERNITY_LEAVE', label: 'Maternity Leave' },
    { value: 'PATERNITY_LEAVE', label: 'Paternity Leave' },
    { value: 'UNPAID_LEAVE', label: 'Unpaid Leave' }
  ];

  useEffect(() => {
    fetchRecentApplications();
  }, []);

  const fetchRecentApplications = async () => {
    setLoading(true);
    try {
      // Fetch from existing leave_applications table (which was created in the migration)
      const { data, error } = await supabase
        .from('leave_applications')
        .select(`
          *,
          payroll_employees(name, employee_code)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const mappedApplications = data?.map(app => ({
        employee_code: app.payroll_employees?.employee_code || '',
        employee_name: app.payroll_employees?.name || '',
        leave_type: app.leave_type,
        start_date: app.start_date,
        end_date: app.end_date,
        days_requested: app.total_days,
        reason: app.reason || '',
        status: app.status.toLowerCase() as 'pending' | 'approved' | 'rejected'
      })) || [];

      setRecentApplications(mappedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Don't show error toast for empty table - this is expected in development
      console.log('Note: This is expected if no leave applications exist yet');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `employee_code,leave_type,start_date,end_date,reason
EMP-001-0001,CASUAL_LEAVE,2024-01-15,2024-01-17,Personal work
EMP-001-0002,EARNED_LEAVE,2024-01-20,2024-01-25,Family vacation
EMP-001-0003,SICK_LEAVE,2024-01-18,2024-01-19,Medical checkup`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk_leave_applications_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template downloaded",
      description: "Fill in the template with leave application data",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as any[];
        const processedApplications: LeaveApplication[] = data
          .filter(row => row.employee_code && row.leave_type)
          .map(row => ({
            employee_code: row.employee_code,
            employee_name: '', // Will be resolved from database
            leave_type: row.leave_type,
            start_date: row.start_date,
            end_date: row.end_date,
            days_requested: calculateDays(row.start_date, row.end_date),
            reason: row.reason || '',
            status: 'pending' as const
          }));

        setApplications(processedApplications);
        toast({
          title: "CSV parsed successfully",
          description: `${processedApplications.length} leave applications loaded`,
        });
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const submitBulkApplications = async () => {
    if (applications.length === 0) {
      toast({
        title: "No applications",
        description: "Please upload a CSV file with leave applications",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Process each application
      for (const app of applications) {
        try {
          // First, find the employee
          const { data: employees, error: empError } = await supabase
            .from('payroll_employees')
            .select('id, name')
            .eq('employee_code', app.employee_code)
            .single();

          if (empError || !employees) {
            errorCount++;
            continue;
          }

          // Insert the leave application
          const { error: insertError } = await supabase
            .from('leave_applications')
            .insert({
              employee_id: employees.id,
              leave_type: app.leave_type,
              start_date: app.start_date,
              end_date: app.end_date,
              total_days: app.days_requested,
              reason: app.reason,
              status: 'PENDING'
            });

          if (insertError) {
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      toast({
        title: "Bulk submission completed",
        description: `${successCount} applications submitted successfully. ${errorCount} failed.`,
        variant: successCount > 0 ? "default" : "destructive",
      });

      if (successCount > 0) {
        fetchRecentApplications();
        setFile(null);
        setApplications([]);
      }

    } catch (error) {
      console.error('Error submitting applications:', error);
      toast({
        title: "Error",
        description: "Failed to submit bulk leave applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Bulk Leave Application System</h2>
          <p className="text-muted-foreground">
            Submit and manage multiple leave applications efficiently
          </p>
        </div>
      </div>

      {/* Information Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Bulk Leave Application System</h3>
              <p className="text-sm text-blue-700 mt-1">
                This system now uses the existing leave_applications table. 
                Upload CSV files to submit multiple leave applications at once.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Leave Applications
          </CardTitle>
          <CardDescription>
            Upload a CSV file with multiple leave applications for processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          <div>
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-1"
            />
          </div>

          {applications.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {applications.length} applications loaded
                </span>
                <Button onClick={submitBulkApplications} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit All Applications'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications Preview */}
      {applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Applications to Submit</CardTitle>
            <CardDescription>
              Review applications before submitting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications.slice(0, 5).map((app, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{app.employee_code}</span>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {leaveTypes.find(lt => lt.value === app.leave_type)?.label} | 
                        {format(parseISO(app.start_date), 'dd MMM')} - {format(parseISO(app.end_date), 'dd MMM')} |
                        {app.days_requested} days
                      </div>
                      {app.reason && (
                        <div className="text-sm text-muted-foreground">
                          Reason: {app.reason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {applications.length > 5 && (
                <div className="text-sm text-muted-foreground text-center">
                  ... and {applications.length - 5} more applications
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Applications
          </CardTitle>
          <CardDescription>
            Track status of recently submitted leave applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading applications...</div>
          ) : recentApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent applications found
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(app.status)}>
                      {app.status.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="font-medium">{app.employee_code}</div>
                      <div className="text-sm text-muted-foreground">
                        {leaveTypes.find(lt => lt.value === app.leave_type)?.label}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {format(parseISO(app.start_date), 'dd MMM')} - {format(parseISO(app.end_date), 'dd MMM')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
