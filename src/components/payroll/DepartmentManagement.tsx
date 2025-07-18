
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Users, Building2, BarChart3, History, Upload, Download } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: string;
  name: string;
  employee_code?: string;
  uan_number: string;
  department_id?: string;
  department_name?: string;
  unit_name?: string;
  plant_location?: string;
}

interface DepartmentStats {
  department_name: string;
  department_code: string;
  employee_count: number;
  avg_years_service: number;
  locations: string[];
}

export const DepartmentManagement = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [bulkDepartment, setBulkDepartment] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
    fetchDepartmentStats();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive",
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_employees')
        .select(`
          id,
          name,
          employee_code,
          uan_number,
          department_id,
          departments (
            name
          ),
          units (
            unit_name,
            location
          )
        `)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      
      const employeesWithDept = data?.map(emp => ({
        id: emp.id,
        name: emp.name,
        employee_code: emp.employee_code,
        uan_number: emp.uan_number,
        department_id: emp.department_id,
        department_name: emp.departments?.name || 'Unassigned',
        unit_name: emp.units?.unit_name || '-',
        plant_location: emp.units?.location || '-'
      })) || [];

      setEmployees(employeesWithDept);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDepartmentStats = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_details_enhanced')
        .select('department_name, department_code, plant_location, years_of_service');

      if (error) throw error;

      // Process stats
      const statsMap = new Map<string, {
        department_name: string;
        department_code: string;
        employee_count: number;
        total_years: number;
        locations: Set<string>;
      }>();

      data?.forEach(emp => {
        const deptKey = emp.department_name || 'Unassigned';
        if (!statsMap.has(deptKey)) {
          statsMap.set(deptKey, {
            department_name: emp.department_name || 'Unassigned',
            department_code: emp.department_code || 'N/A',
            employee_count: 0,
            total_years: 0,
            locations: new Set()
          });
        }
        
        const stat = statsMap.get(deptKey)!;
        stat.employee_count++;
        stat.total_years += emp.years_of_service || 0;
        if (emp.plant_location) {
          stat.locations.add(emp.plant_location);
        }
      });

      const stats = Array.from(statsMap.values()).map(stat => ({
        department_name: stat.department_name,
        department_code: stat.department_code,
        employee_count: stat.employee_count,
        avg_years_service: stat.employee_count > 0 ? stat.total_years / stat.employee_count : 0,
        locations: Array.from(stat.locations)
      }));

      setDepartmentStats(stats);
    } catch (error) {
      console.error('Error fetching department stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDepartment) {
        const { error } = await supabase
          .from('departments')
          .update(formData)
          .eq('id', editingDepartment.id);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Department updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('departments')
          .insert([formData]);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Department created successfully",
        });
      }
      
      setDialogOpen(false);
      setEditingDepartment(null);
      resetForm();
      fetchDepartments();
      fetchDepartmentStats();
    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        title: "Error",
        description: "Failed to save department",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true
    });
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      is_active: department.is_active
    });
    setDialogOpen(true);
  };

  const handleBulkAssign = async () => {
    if (!bulkDepartment || selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Please select employees and a department",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('payroll_employees')
        .update({ department_id: bulkDepartment })
        .in('id', selectedEmployees);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully assigned ${selectedEmployees.length} employees to department`,
      });

      setBulkAssignOpen(false);
      setSelectedEmployees([]);
      setBulkDepartment('');
      fetchEmployees();
      fetchDepartmentStats();
    } catch (error) {
      console.error('Error bulk assigning:', error);
      toast({
        title: "Error",
        description: "Failed to assign employees to department",
        variant: "destructive",
      });
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const exportDepartmentData = async () => {
    try {
      const csvHeaders = [
        'Department Name',
        'Department Code', 
        'Employee Count',
        'Average Years of Service',
        'Locations'
      ];

      const csvRows = departmentStats.map(stat => [
        stat.department_name,
        stat.department_code,
        stat.employee_count.toString(),
        stat.avg_years_service.toFixed(1),
        stat.locations.join('; ')
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `department_analytics_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Success",
        description: "Department analytics exported successfully",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export department data",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading department management...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Department Management</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportDepartmentData}>
            <Download className="w-4 h-4 mr-2" />
            Export Analytics
          </Button>
          <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Bulk Assign
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingDepartment(null);
                resetForm();
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="assignments">Employee Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{departments.length}</div>
                <p className="text-xs text-muted-foreground">
                  {departments.filter(d => d.is_active).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employees.length}</div>
                <p className="text-xs text-muted-foreground">
                  {employees.filter(e => e.department_id).length} assigned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employees.filter(e => !e.department_id).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Need department assignment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Years Service</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {departmentStats.reduce((acc, stat) => acc + stat.avg_years_service, 0) / departmentStats.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all departments
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Employee Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => {
                const stats = departmentStats.find(s => s.department_name === department.name);
                return (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{department.code}</Badge>
                    </TableCell>
                    <TableCell>{department.description || '-'}</TableCell>
                    <TableCell>{stats?.employee_count || 0}</TableCell>
                    <TableCell>
                      <Badge variant={department.is_active ? "default" : "secondary"}>
                        {department.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(department)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedEmployees.length} employee(s) selected
            </div>
            <Button 
              onClick={() => setBulkAssignOpen(true)}
              disabled={selectedEmployees.length === 0}
            >
              Assign Selected to Department
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmployees(employees.map(emp => emp.id));
                      } else {
                        setSelectedEmployees([]);
                      }
                    }}
                    checked={selectedEmployees.length === employees.length && employees.length > 0}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Current Department</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => toggleEmployeeSelection(employee.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {employee.employee_code || employee.uan_number}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.department_id ? "default" : "secondary"}>
                      {employee.department_name}
                    </Badge>
                  </TableCell>
                  <TableCell>{employee.unit_name}</TableCell>
                  <TableCell>{employee.plant_location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Analytics</CardTitle>
              <CardDescription>
                Employee distribution and performance metrics by department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Employee Count</TableHead>
                    <TableHead>Avg Years Service</TableHead>
                    <TableHead>Locations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentStats.map((stat) => (
                    <TableRow key={stat.department_name}>
                      <TableCell className="font-medium">{stat.department_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{stat.department_code}</Badge>
                      </TableCell>
                      <TableCell>{stat.employee_count}</TableCell>
                      <TableCell>{stat.avg_years_service.toFixed(1)} years</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {stat.locations.map(location => (
                            <Badge key={location} variant="secondary" className="text-xs">
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Department Form Dialog */}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingDepartment ? 'Edit Department' : 'Add New Department'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Department Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="code">Department Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingDepartment ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Bulk Assignment Dialog */}
      <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Department Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selected Employees: {selectedEmployees.length}</Label>
            </div>
            <div>
              <Label htmlFor="bulk-department">Assign to Department</Label>
              <Select value={bulkDepartment} onValueChange={setBulkDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.filter(d => d.is_active).map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setBulkAssignOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAssign}>
                Assign {selectedEmployees.length} Employee(s)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
