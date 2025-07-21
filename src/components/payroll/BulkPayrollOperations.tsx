import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Play, Clock, CheckCircle, XCircle, AlertCircle, Users, Mail, Shield } from 'lucide-react';
import { JOB_STATUS, MESSAGE_TYPES } from '@/config/constants';
import { getStatusColor } from '@/config/utils';
import { useUnitsData } from '@/hooks/useUnitsData';
import { useReconciliationStatus } from '@/hooks/useReconciliationStatus';
import { PayrollDetailsTable } from './PayrollDetailsTable';
import { BulkEmailUploader } from './BulkEmailUploader';
import { ReconciliationConfirmationDialog } from './ReconciliationConfirmationDialog';

interface BulkJob {
  id: string;
  month: string;
  status: string;
  total_employees: number;
  processed_employees: number;
  failed_employees: number;
  started_at: string;
  completed_at: string;
  created_at: string;
}

export const BulkPayrollOperations = () => {
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // Current month
  );
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [activeTab, setActiveTab] = useState('operations');
  const [showReconciliationDialog, setShowReconciliationDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const { units, loading: unitsLoading } = useUnitsData();
  const { reconciliationStatus, loading: reconciliationLoading, checkReconciliationStatus } = useReconciliationStatus();

  useEffect(() => {
    fetchBulkJobs();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      setIsAdmin(profile?.role === 'admin');
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchBulkJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_payroll_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching bulk jobs:', error);
      toast({
        title: MESSAGE_TYPES.ERROR,
        description: 'Failed to fetch bulk payroll jobs',
        variant: 'destructive',
      });
    }
  };

  const handlePayrollProcessing = async () => {
    if (!selectedMonth) {
      toast({
        title: MESSAGE_TYPES.ERROR,
        description: 'Please select a month',
        variant: 'destructive',
      });
      return;
    }

    // Check reconciliation status before proceeding
    const monthDate = new Date(selectedMonth + '-01');
    const month = monthDate.getMonth() + 1;
    const year = monthDate.getFullYear();

    try {
      const statusData = await checkReconciliationStatus(
        month,
        year,
        selectedUnit === 'all' ? undefined : selectedUnit
      );

      // Show reconciliation confirmation dialog
      setShowReconciliationDialog(true);
    } catch (error) {
      console.error('Error checking reconciliation status:', error);
      toast({
        title: MESSAGE_TYPES.ERROR,
        description: 'Failed to check reconciliation status',
        variant: 'destructive',
      });
    }
  };

  const proceedWithPayroll = async (withOverride = false) => {
    setShowReconciliationDialog(false);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-monthly-payroll', {
        body: { 
          month: selectedMonth + '-01',
          unit_id: selectedUnit === 'all' ? null : selectedUnit,
          language: selectedLanguage,
          reconciliation_override: withOverride
        }
      });

      if (error) throw error;

      toast({
        title: MESSAGE_TYPES.SUCCESS,
        description: `Monthly payroll processing started successfully${selectedUnit !== 'all' ? ' for selected unit' : ''}`,
      });

      // Refresh jobs list and switch to details tab
      setTimeout(() => {
        fetchBulkJobs();
        setActiveTab('details');
      }, 1000);
    } catch (error) {
      console.error('Error triggering payroll:', error);
      toast({
        title: MESSAGE_TYPES.ERROR,
        description: 'Failed to trigger monthly payroll processing',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case JOB_STATUS.PENDING:
        return <Clock className="h-4 w-4" />;
      case JOB_STATUS.PROCESSING:
        return <AlertCircle className="h-4 w-4 animate-spin" />;
      case JOB_STATUS.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case JOB_STATUS.FAILED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const calculateProgress = (job: BulkJob) => {
    if (job.total_employees === 0) return 0;
    return ((job.processed_employees + job.failed_employees) / job.total_employees) * 100;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Management
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Bulk Payroll Operations
              </CardTitle>
              <CardDescription>
                Process monthly payroll for employees with unit-wise filtering and language preferences.
                Leave reconciliation status will be verified before processing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="month">Select Month</Label>
                  <Input
                    id="month"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    max={new Date().toISOString().slice(0, 7)}
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Select Unit</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Units</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.unit_id} value={unit.unit_id}>
                          {unit.unit_name} ({unit.unit_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Default Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handlePayrollProcessing}
                    disabled={loading || unitsLoading || reconciliationLoading}
                    className="flex items-center gap-2 w-full"
                  >
                    <Play className="h-4 w-4" />
                    {loading ? 'Processing...' : 'Process Payroll'}
                  </Button>
                </div>
              </div>
              
              {selectedUnit !== 'all' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Unit-wise Processing:</strong> Only employees from the selected unit will be processed.
                    Leave reconciliation will be checked for this specific unit.
                  </AlertDescription>
                </Alert>
              )}

              {isAdmin && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Admin Mode:</strong> You can override reconciliation requirements if needed.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <PayrollDetailsTable 
            month={selectedMonth} 
            unitId={selectedUnit === 'all' ? undefined : selectedUnit}
          />
        </TabsContent>

        <TabsContent value="emails" className="space-y-6">
          <BulkEmailUploader />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Bulk Operations
              </CardTitle>
              <CardDescription>
                Track the status of recent bulk payroll processing jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No bulk operations found
                </p>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`${getStatusColor(job.status)} flex items-center gap-1`}
                          >
                            {getStatusIcon(job.status)}
                            {job.status.toUpperCase()}
                          </Badge>
                          <span className="font-medium">
                            {new Date(job.month).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long' 
                            })}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(job.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {job.status === JOB_STATUS.PROCESSING && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>
                              {job.processed_employees + job.failed_employees} / {job.total_employees}
                            </span>
                          </div>
                          <Progress value={calculateProgress(job)} className="h-2" />
                        </div>
                      )}

                      {(job.status === JOB_STATUS.COMPLETED || job.status === JOB_STATUS.FAILED) && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-medium text-blue-600">
                              {job.total_employees}
                            </div>
                            <div className="text-muted-foreground">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-green-600">
                              {job.processed_employees}
                            </div>
                            <div className="text-muted-foreground">Processed</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-red-600">
                              {job.failed_employees}
                            </div>
                            <div className="text-muted-foreground">Failed</div>
                          </div>
                        </div>
                      )}

                      {job.completed_at && (
                        <div className="text-sm text-muted-foreground">
                          Completed: {new Date(job.completed_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReconciliationConfirmationDialog
        open={showReconciliationDialog}
        onClose={() => setShowReconciliationDialog(false)}
        onProceed={() => proceedWithPayroll(false)}
        onProceedWithOverride={() => proceedWithPayroll(true)}
        reconciliationStatus={reconciliationStatus}
        selectedMonth={selectedMonth}
        selectedUnit={selectedUnit}
        isAdmin={isAdmin}
      />
    </div>
  );
};
