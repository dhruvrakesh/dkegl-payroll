import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, RefreshCw, Users, Calendar, Upload, ChevronDown, Search } from 'lucide-react';
import { LeaveBalanceCsvUploader } from './LeaveBalanceCsvUploader';

interface LeaveBalance {
  id: string;
  employee_id: string;
  year: number;
  casual_leave_balance: number;
  earned_leave_balance: number;
  payroll_employees?: {
    name: string;
    unit_id?: string;
    units?: {
      unit_name: string;
    };
  };
}

interface Employee {
  id: string;
  name: string;
  unit_id?: string;
}

export const LeaveBalanceManagement = () => {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBalance, setEditingBalance] = useState<LeaveBalance | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    year: new Date().getFullYear(),
    casual_leave_balance: 12,
    earned_leave_balance: 0
  });
  const [csvUploaderOpen, setCsvUploaderOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [units, setUnits] = useState<Array<{unit_id: string, unit_name: string}>>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaveBalances();
    fetchEmployees();
    fetchUnits();
  }, []);

  useEffect(() => {
    filterLeaveBalances();
  }, [leaveBalances, searchTerm, selectedYear, selectedUnit]);

  const fetchLeaveBalances = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_leave_balances')
        .select(`
          *,
          payroll_employees (
            name,
            unit_id,
            units (
              unit_name
            )
          )
        `)
        .order('year', { ascending: false });

      if (error) throw error;
      setLeaveBalances(data || []);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leave balances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_employees')
        .select('id, name, unit_id')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('unit_id, unit_name')
        .order('unit_name');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const filterLeaveBalances = () => {
    let filtered = leaveBalances;

    if (searchTerm) {
      filtered = filtered.filter(balance =>
        balance.payroll_employees?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedYear) {
      filtered = filtered.filter(balance => balance.year === selectedYear);
    }

    if (selectedUnit) {
      filtered = filtered.filter(balance => balance.payroll_employees?.unit_id === selectedUnit);
    }

    setFilteredBalances(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        employee_id: formData.employee_id,
        year: formData.year,
        casual_leave_balance: formData.casual_leave_balance,
        earned_leave_balance: formData.earned_leave_balance
      };

      if (editingBalance) {
        const { error } = await supabase
          .from('employee_leave_balances')
          .update(submitData)
          .eq('id', editingBalance.id);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Leave balance updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('employee_leave_balances')
          .insert([submitData]);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Leave balance created successfully",
        });
      }
      
      setDialogOpen(false);
      setEditingBalance(null);
      setFormData({
        employee_id: '',
        year: new Date().getFullYear(),
        casual_leave_balance: 12,
        earned_leave_balance: 0
      });
      fetchLeaveBalances();
    } catch (error) {
      console.error('Error saving leave balance:', error);
      toast({
        title: "Error",
        description: "Failed to save leave balance",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (balance: LeaveBalance) => {
    setEditingBalance(balance);
    setFormData({
      employee_id: balance.employee_id,
      year: balance.year,
      casual_leave_balance: balance.casual_leave_balance,
      earned_leave_balance: balance.earned_leave_balance
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingBalance(null);
    setFormData({
      employee_id: '',
      year: new Date().getFullYear(),
      casual_leave_balance: 12,
      earned_leave_balance: 0
    });
  };

  const initializeAllEmployeeBalances = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const employeesWithoutBalance = employees.filter(emp => 
        !leaveBalances.some(bal => bal.employee_id === emp.id && bal.year === currentYear)
      );

      if (employeesWithoutBalance.length === 0) {
        toast({
          title: "Info",
          description: "All employees already have leave balances for this year",
        });
        return;
      }

      const newBalances = employeesWithoutBalance.map(emp => ({
        employee_id: emp.id,
        year: currentYear,
        casual_leave_balance: 12,
        earned_leave_balance: 0
      }));

      const { error } = await supabase
        .from('employee_leave_balances')
        .insert(newBalances);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Initialized leave balances for ${newBalances.length} employees`,
      });
      fetchLeaveBalances();
    } catch (error) {
      console.error('Error initializing balances:', error);
      toast({
        title: "Error",
        description: "Failed to initialize leave balances",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading leave balances...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Leave Balance Management
          </CardTitle>
          <CardDescription>
            Manage employee leave balances for casual leave and earned leave
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Years</SelectItem>
                {[2023, 2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Units</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.unit_id} value={unit.unit_id}>
                    {unit.unit_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {filteredBalances.length} of {leaveBalances.length} employee balances shown
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={initializeAllEmployeeBalances}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Initialize All
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Balance
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingBalance ? 'Edit Leave Balance' : 'Add Leave Balance'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="employee_id">Employee</Label>
                      <Select 
                        value={formData.employee_id} 
                        onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                        disabled={!!editingBalance}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        min="2020"
                        max="2030"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                        disabled={!!editingBalance}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="casual_leave_balance">Casual Leave Balance</Label>
                      <Input
                        id="casual_leave_balance"
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.casual_leave_balance}
                        onChange={(e) => setFormData({ ...formData, casual_leave_balance: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="earned_leave_balance">Earned Leave Balance</Label>
                      <Input
                        id="earned_leave_balance"
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.earned_leave_balance}
                        onChange={(e) => setFormData({ ...formData, earned_leave_balance: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={!formData.employee_id}>
                        {editingBalance ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Bulk Upload Section */}
          <Collapsible open={csvUploaderOpen} onOpenChange={setCsvUploaderOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between mb-4">
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Bulk Upload via CSV
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${csvUploaderOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mb-6">
              <LeaveBalanceCsvUploader onUploadSuccess={fetchLeaveBalances} />
            </CollapsibleContent>
          </Collapsible>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Casual Leave</TableHead>
                <TableHead>Earned Leave</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBalances.map((balance) => (
                <TableRow key={balance.id}>
                  <TableCell className="font-medium">
                    {balance.payroll_employees?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {balance.payroll_employees?.units?.unit_name || 'N/A'}
                  </TableCell>
                  <TableCell>{balance.year}</TableCell>
                  <TableCell>
                    <span className={balance.casual_leave_balance < 3 ? 'text-red-600 font-medium' : ''}>
                      {balance.casual_leave_balance} days
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={balance.earned_leave_balance < 5 ? 'text-yellow-600 font-medium' : ''}>
                      {balance.earned_leave_balance} days
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(balance)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
