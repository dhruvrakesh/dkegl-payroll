
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Save, AlertTriangle, FileText, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WageCalculatorDashboard } from './WageCalculatorDashboard';

interface SalaryBatch {
  id: string;
  batch_name: string;
  period_type: 'monthly' | 'custom';
  period_start: string;
  period_end: string;
  status: 'draft' | 'processing' | 'completed' | 'archived';
  total_employees: number;
  total_gross_amount: number;
  total_net_amount: number;
  total_deductions: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface SalaryRecord {
  salary_id: string;
  employee_id: string;
  month: string;
  net_salary: number;
  batch_id?: string;
  employee?: {
    name: string;
    uan_number: string;
  };
}

export function EnhancedSalaryDisbursement() {
  const [batches, setBatches] = useState<SalaryBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<SalaryBatch | null>(null);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [conflictingBatch, setConflictingBatch] = useState<SalaryBatch | null>(null);
  const [newBatchData, setNewBatchData] = useState({
    batchName: '',
    periodType: 'monthly' as 'monthly' | 'custom',
    periodStart: '',
    periodEnd: ''
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('salary_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch salary batches');
    }
  };

  const fetchBatchRecords = async (batchId: string) => {
    try {
      const { data, error } = await supabase
        .from('salary_disbursement')
        .select(`
          *,
          employee:payroll_employees(name, uan_number)
        `)
        .eq('batch_id', batchId);

      if (error) throw error;
      setSalaryRecords(data || []);
    } catch (error) {
      console.error('Error fetching batch records:', error);
      toast.error('Failed to fetch batch records');
    }
  };

  const checkForConflictingBatch = async (periodStart: string, periodEnd: string) => {
    try {
      const { data, error } = await supabase
        .from('salary_batches')
        .select('*')
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .neq('status', 'archived')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return null;
    }
  };

  const createNewBatch = async (overwriteExisting = false) => {
    setIsLoading(true);
    try {
      let batchToCreate = newBatchData;
      
      if (!overwriteExisting) {
        const conflict = await checkForConflictingBatch(
          newBatchData.periodStart,
          newBatchData.periodEnd
        );
        
        if (conflict) {
          setConflictingBatch(conflict);
          setShowOverwriteDialog(true);
          setIsLoading(false);
          return;
        }
      }

      // If overwriting, archive the existing batch
      if (overwriteExisting && conflictingBatch) {
        await supabase
          .from('salary_batches')
          .update({ status: 'archived' })
          .eq('id', conflictingBatch.id);
      }

      // Create new batch
      const { data: batch, error } = await supabase
        .from('salary_batches')
        .insert({
          batch_name: batchToCreate.batchName,
          period_type: batchToCreate.periodType,
          period_start: batchToCreate.periodStart,
          period_end: batchToCreate.periodEnd,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Salary batch created successfully');
      setNewBatchData({
        batchName: '',
        periodType: 'monthly',
        periodStart: '',
        periodEnd: ''
      });
      setShowOverwriteDialog(false);
      setConflictingBatch(null);
      await fetchBatches();
      setSelectedBatch(batch);
    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error('Failed to create salary batch');
    }
    setIsLoading(false);
  };

  const generateMonthlyBatch = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const periodStart = new Date(year, month, 1);
    const periodEnd = new Date(year, month + 1, 0);
    
    setNewBatchData({
      batchName: `Salary - ${periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      periodType: 'monthly',
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0]
    });
  };

  const handleBatchSelect = (batch: SalaryBatch) => {
    setSelectedBatch(batch);
    fetchBatchRecords(batch.id);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      processing: 'default',
      completed: 'default',
      archived: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleSalaryGenerated = async (salaryData: any, batchId?: string) => {
    if (batchId && selectedBatch) {
      // Update batch totals
      const totalNet = salaryData.reduce((sum: number, record: any) => sum + record.net_salary, 0);
      const totalGross = salaryData.reduce((sum: number, record: any) => sum + record.gross_salary, 0);
      const totalDeductions = totalGross - totalNet;

      await supabase
        .from('salary_batches')
        .update({
          total_employees: salaryData.length,
          total_gross_amount: totalGross,
          total_net_amount: totalNet,
          total_deductions: totalDeductions,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', batchId);

      await fetchBatches();
      await fetchBatchRecords(batchId);
      toast.success('Batch updated with salary calculations');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Enhanced Salary Management</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <CalendarDays className="w-4 h-4 mr-2" />
              Create New Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Salary Batch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="batchName">Batch Name</Label>
                <Input
                  id="batchName"
                  value={newBatchData.batchName}
                  onChange={(e) => setNewBatchData(prev => ({ ...prev, batchName: e.target.value }))}
                  placeholder="Enter batch name"
                />
              </div>
              
              <div>
                <Label htmlFor="periodType">Period Type</Label>
                <Select
                  value={newBatchData.periodType}
                  onValueChange={(value: 'monthly' | 'custom') => setNewBatchData(prev => ({ ...prev, periodType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="periodStart">Start Date</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={newBatchData.periodStart}
                    onChange={(e) => setNewBatchData(prev => ({ ...prev, periodStart: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="periodEnd">End Date</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={newBatchData.periodEnd}
                    onChange={(e) => setNewBatchData(prev => ({ ...prev, periodEnd: e.target.value }))}
                  />
                </div>
              </div>

              <Button
                onClick={generateMonthlyBatch}
                variant="outline"
                className="w-full"
              >
                Generate Current Month
              </Button>

              <Button
                onClick={() => createNewBatch(false)}
                disabled={isLoading || !newBatchData.batchName || !newBatchData.periodStart || !newBatchData.periodEnd}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create Batch'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="batches" className="w-full">
        <TabsList>
          <TabsTrigger value="batches">Salary Batches</TabsTrigger>
          <TabsTrigger value="calculator">Wage Calculator</TabsTrigger>
          {selectedBatch && <TabsTrigger value="records">Batch Records</TabsTrigger>}
        </TabsList>

        <TabsContent value="batches">
          <div className="grid gap-4">
            {batches.map((batch) => (
              <Card key={batch.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleBatchSelect(batch)}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{batch.batch_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(batch.period_start).toLocaleDateString()} - {new Date(batch.period_end).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(batch.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Employees</p>
                      <p className="font-medium">{batch.total_employees}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Net Amount</p>
                      <p className="font-medium">₹{batch.total_net_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{new Date(batch.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calculator">
          <WageCalculatorDashboard 
            selectedBatchId={selectedBatch?.id}
            onSalaryGenerated={handleSalaryGenerated}
          />
        </TabsContent>

        <TabsContent value="records">
          {selectedBatch && (
            <Card>
              <CardHeader>
                <CardTitle>Batch Records: {selectedBatch.batch_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salaryRecords.map((record) => (
                    <div key={record.salary_id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{record.employee?.name}</p>
                        <p className="text-sm text-muted-foreground">UAN: {record.employee?.uan_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{record.net_salary.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{record.month}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Overwrite Confirmation Dialog */}
      <Dialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Existing Batch Found
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                A salary batch already exists for this period: <strong>{conflictingBatch?.batch_name}</strong>
                <br />
                Period: {conflictingBatch && new Date(conflictingBatch.period_start).toLocaleDateString()} - {conflictingBatch && new Date(conflictingBatch.period_end).toLocaleDateString()}
              </AlertDescription>
            </Alert>
            
            <p className="text-sm text-muted-foreground">
              Creating a new batch will archive the existing one. This action cannot be undone.
            </p>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowOverwriteDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => createNewBatch(true)}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Archive & Create New'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
