
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Upload, Download, Users, FileText } from 'lucide-react';
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
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
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
    fetchUnits();
    fetchPendingApplications();
  }, []);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('unit_name');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const fetchPendingApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bulk_leave_applications')
        .select(`
          *,
          payroll_employees(name, employee_code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedApplications = data?.map(app => ({
        employee_code: app.payroll_employees?.employee_code || '',
        employee_name: app.payroll_employees?.name || '',
        leave_type: app.leave_type,
        start_date: app.start_date,
        end_date: app.end_date,
        days_requested: app.days_requested,
        reason: app.reason,
        status: app.status
      })) || [];

      setApplications(mappedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leave applications",
        variant: "destructive",
      });
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
            employee_name: '', // Will be filled from database
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
      // Process applications through Supabase function
      const { data, error } = await supabase.functions.invoke('process-bulk-leave-applications', {
        body: { applications }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${data.successCount} leave applications submitted successfully`,
      });

      if (data.errorCount > 0) {
        toast({
          title: "Partial success",
          description: `${data.errorCount} applications had errors`,
          variant: "destructive",
        });
      }

      fetchPendingApplications();
      setFile(null);
      setApplications([]);
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

  const updateApplicationStatus = async (index: number, status: 'approved' | 'rejected') => {
    try {
      const application = applications[index];
      
      const { error } = await supabase
        .from('bulk_leave_applications')
        .update({ status })
        .eq('employee_code', application.employee_code)
        .eq('start_date', application.start_date);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Leave application ${status}`,
      });

      fetchPendingApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
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

      {/* Applications Review */}
      {applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Applications</CardTitle>
            <CardDescription>
              Review and approve/reject leave applications before final submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications.map((app, index) => (
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
                    
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateApplicationStatus(index, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateApplicationStatus(index, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Applications */}
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
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent applications found
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 10).map((app, index) => (
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
