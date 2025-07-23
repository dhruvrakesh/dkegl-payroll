import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calculator, Download, FileSpreadsheet, Upload, Filter, Search, Calendar, Users, Building2, FileText, Mail, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BulkEmployeeUploader } from './BulkEmployeeUploader';

interface Employee {
  id: string;
  name: string;
  uan_number: string;
  employee_code?: string;
  unit_id: string;
  joining_date: string;
  date_of_birth?: string;
  department_id?: string;
  id_proof_file_path?: string;
  base_salary: number;
  hra_amount: number;
  other_conv_amount: number;
  overtime_rate_per_hour?: number;
  pan_number: string;
  aadhaar_number: string;
  email?: string;
  preferred_language?: string;
  active: boolean;
  units?: { unit_name: string; unit_code: string; location: string };
  departments?: { name: string; code: string };
}

interface Unit {
  unit_id: string;
  unit_name: string;
  location: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface EmployeeEnhanced {
  id: string;
  name: string;
  uan_number: string;
  employee_code?: string;
  joining_date: string;
  date_of_birth?: string;
  department_name?: string;
  department_code?: string;
  unit_name?: string;
  unit_code?: string;
  plant_location?: string;
  years_of_service?: number;
  age_years?: number;
  base_salary: number;
  id_proof_file_path?: string;
  active: boolean;
}

export const EmployeesManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [enhancedEmployees, setEnhancedEmployees] = useState<EmployeeEnhanced[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    uan_number: '',
    unit_id: '',
    department_id: '',
    joining_date: '',
    date_of_birth: '',
    base_salary: '',
    hra_amount: '',
    other_conv_amount: '',
    overtime_rate_per_hour: '',
    pan_number: '',
    aadhaar_number: '',
    email: '',
    preferred_language: 'english',
    id_proof_file_path: '',
    active: true
  });

  const [filters, setFilters] = useState({
    search: '',
    department_id: '',
    unit_id: '',
    plant_location: '',
    min_years_service: '',
    max_years_service: '',
    show_inactive: false
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchUnits();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (filters.search || filters.department_id || filters.unit_id || filters.plant_location || filters.min_years_service || filters.max_years_service) {
      fetchEnhancedEmployees();
    } else {
      setEnhancedEmployees([]);
    }
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_employees')
        .select(`
          *,
          units (
            unit_name,
            unit_code,
            location
          ),
          departments (
            name,
            code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnhancedEmployees = async () => {
    try {
      // Build filter parameters
      const params: any = {};
      if (filters.search) params.p_search_term = filters.search;
      if (filters.department_id && filters.department_id !== 'ALL_DEPARTMENTS') params.p_department_ids = [filters.department_id];
      if (filters.unit_id && filters.unit_id !== 'ALL_UNITS') params.p_unit_ids = [filters.unit_id];
      if (filters.plant_location && filters.plant_location !== 'ALL_LOCATIONS') params.p_plant_location = filters.plant_location;
      if (filters.min_years_service) params.p_min_years_service = parseFloat(filters.min_years_service);
      if (filters.max_years_service) params.p_max_years_service = parseFloat(filters.max_years_service);

      const { data, error } = await supabase.rpc('search_employees', params);
      
      if (error) throw error;
      setEnhancedEmployees(data || []);
    } catch (error) {
      console.error('Error fetching enhanced employees:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('unit_id, unit_name, location')
        .order('unit_name');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const validatePAN = (pan: string) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const validateAadhaar = (aadhaar: string) => {
    const aadhaarRegex = /^[0-9]{12}$/;
    return aadhaarRegex.test(aadhaar);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const calculateTotalSalary = () => {
    const base = parseFloat(formData.base_salary) || 0;
    const hra = parseFloat(formData.hra_amount) || 0;
    const other = parseFloat(formData.other_conv_amount) || 0;
    return base + hra + other;
  };

  const calculateYearsOfService = (joiningDate: string) => {
    if (!joiningDate) return null;
    const today = new Date();
    const joining = new Date(joiningDate);
    const diffTime = Math.abs(today.getTime() - joining.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25) * 10) / 10;
  };

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file only",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingFile(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `employee-documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setFormData({ ...formData, id_proof_file_path: filePath });
      toast({
        title: "Success",
        description: "ID proof uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload ID proof",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate PAN if provided
    if (formData.pan_number && !validatePAN(formData.pan_number)) {
      toast({
        title: "Validation Error",
        description: "PAN number must be in format: ABCDE1234F",
        variant: "destructive",
      });
      return;
    }

    // Validate Aadhaar if provided
    if (formData.aadhaar_number && !validateAadhaar(formData.aadhaar_number)) {
      toast({
        title: "Validation Error",
        description: "Aadhaar number must be 12 digits",
        variant: "destructive",
      });
      return;
    }

    // Validate email if provided
    if (formData.email && !validateEmail(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Validate age if DOB is provided
    if (formData.date_of_birth) {
      const age = calculateAge(formData.date_of_birth);
      if (age !== null && (age < 18 || age > 65)) {
        toast({
          title: "Validation Error",
          description: "Employee age must be between 18 and 65 years",
          variant: "destructive",
        });
        return;
      }
    }
    
    try {
      const submitData = {
        ...formData,
        base_salary: parseFloat(formData.base_salary),
        hra_amount: parseFloat(formData.hra_amount) || 0,
        other_conv_amount: parseFloat(formData.other_conv_amount) || 0,
        overtime_rate_per_hour: formData.overtime_rate_per_hour ? parseFloat(formData.overtime_rate_per_hour) : null,
        unit_id: formData.unit_id || null,
        department_id: formData.department_id || null,
        date_of_birth: formData.date_of_birth || null,
        pan_number: formData.pan_number || null,
        aadhaar_number: formData.aadhaar_number || null,
        email: formData.email || null,
        preferred_language: formData.preferred_language || 'english',
        id_proof_file_path: formData.id_proof_file_path || null
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from('payroll_employees')
          .update(submitData)
          .eq('id', editingEmployee.id);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Employee updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('payroll_employees')
          .insert([submitData]);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Employee created successfully",
        });
      }
      
      setDialogOpen(false);
      setEditingEmployee(null);
      resetForm();
      fetchEmployees();
      if (showFilters) fetchEnhancedEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        title: "Error",
        description: "Failed to save employee",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      uan_number: '',
      unit_id: '',
      department_id: '',
      joining_date: '',
      date_of_birth: '',
      base_salary: '',
      hra_amount: '',
      other_conv_amount: '',
      overtime_rate_per_hour: '',
      pan_number: '',
      aadhaar_number: '',
      email: '',
      preferred_language: 'english',
      id_proof_file_path: '',
      active: true
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      uan_number: employee.uan_number,
      unit_id: employee.unit_id || '',
      department_id: employee.department_id || '',
      joining_date: employee.joining_date,
      date_of_birth: employee.date_of_birth || '',
      base_salary: employee.base_salary.toString(),
      hra_amount: (employee.hra_amount || 0).toString(),
      other_conv_amount: (employee.other_conv_amount || 0).toString(),
      overtime_rate_per_hour: (employee.overtime_rate_per_hour || '').toString(),
      pan_number: employee.pan_number || '',
      aadhaar_number: employee.aadhaar_number || '',
      email: employee.email || '',
      preferred_language: employee.preferred_language || 'english',
      id_proof_file_path: employee.id_proof_file_path || '',
      active: employee.active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      const { error } = await supabase
        .from('payroll_employees')
        .delete()
        .eq('id', employeeId);
      
      if (error) throw error;
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
      fetchEmployees();
      if (showFilters) fetchEnhancedEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  const downloadEmployeeMaster = async () => {
    try {
      const { data, error } = await supabase.rpc('export_employee_master_enhanced');
      
      if (error) throw error;

      // Convert to CSV
      const csvHeaders = [
        'Employee Code',
        'Employee Name', 
        'UAN Number',
        'Unit Code',
        'Unit Name',
        'Plant Location',
        'Department',
        'Joining Date',
        'Date of Birth',
        'Years of Service',
        'Age (Years)',
        'Base Salary',
        'Active'
      ];

      const csvRows = data.map((emp: any) => [
        emp.employee_code || '',
        emp.employee_name || '',
        emp.uan_number || '',
        emp.unit_code || '',
        emp.unit_name || '',
        emp.plant_location || '',
        emp.department_name || '',
        emp.joining_date || '',
        emp.date_of_birth || '',
        emp.years_of_service ? emp.years_of_service.toFixed(1) : '',
        emp.age_years || '',
        emp.base_salary || '',
        emp.active ? 'Yes' : 'No'
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `employee_master_enhanced_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Success",
        description: "Enhanced employee master downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading employee master:', error);
      toast({
        title: "Error",
        description: "Failed to download employee master",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      department_id: '',
      unit_id: '',
      plant_location: '',
      min_years_service: '',
      max_years_service: '',
      show_inactive: false
    });
  };

  if (loading) {
    return <div>Loading employees...</div>;
  }

  const totalSalary = calculateTotalSalary();
  const displayEmployees = showFilters && enhancedEmployees.length > 0 ? enhancedEmployees : employees;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Enhanced Employee Management</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button 
            variant="outline" 
            onClick={downloadEmployeeMaster}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Master
          </Button>
        </div>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">Manage Employees</TabsTrigger>
          <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingEmployee(null);
                resetForm();
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="uan_number">UAN Number *</Label>
                      <Input
                        id="uan_number"
                        value={formData.uan_number}
                        onChange={(e) => setFormData({ ...formData, uan_number: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="joining_date">Joining Date *</Label>
                      <Input
                        id="joining_date"
                        type="date"
                        value={formData.joining_date}
                        onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organization Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Organization Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unit_id">Unit/Plant</Label>
                      <Select 
                        value={formData.unit_id} 
                        onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.unit_id} value={unit.unit_id}>
                              {unit.unit_name} - {unit.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department_id">Department</Label>
                      <Select 
                        value={formData.department_id} 
                        onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Communication Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Communication Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="employee@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferred_language">Preferred Language</Label>
                      <Select 
                        value={formData.preferred_language} 
                        onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="hindi">Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Identity Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Identity Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pan_number">PAN Number</Label>
                      <Input
                        id="pan_number"
                        placeholder="ABCDE1234F"
                        value={formData.pan_number}
                        onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                      <Input
                        id="aadhaar_number"
                        placeholder="123456789012"
                        value={formData.aadhaar_number}
                        onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="id_proof">ID Proof (PDF)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                      {uploadingFile && (
                        <Badge variant="secondary">Uploading...</Badge>
                      )}
                      {formData.id_proof_file_path && (
                        <Badge variant="default">Uploaded</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload PDF file (max 5MB). Supported documents: Aadhaar, PAN, Passport, etc.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Salary Components */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Salary Components
                  </CardTitle>
                  <CardDescription>
                    Enter the different components of the employee's salary
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="base_salary">Base Salary *</Label>
                      <Input
                        id="base_salary"
                        type="number"
                        step="0.01"
                        value={formData.base_salary}
                        onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hra_amount">HRA Amount</Label>
                      <Input
                        id="hra_amount"
                        type="number"
                        step="0.01"
                        value={formData.hra_amount}
                        onChange={(e) => setFormData({ ...formData, hra_amount: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="other_conv_amount">Other/Conveyance</Label>
                      <Input
                        id="other_conv_amount"
                        type="number"
                        step="0.01"
                        value={formData.other_conv_amount}
                        onChange={(e) => setFormData({ ...formData, other_conv_amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="overtime_rate_per_hour">Overtime Rate (₹/hour)</Label>
                      <Input
                        id="overtime_rate_per_hour"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 50.00"
                        value={formData.overtime_rate_per_hour}
                        onChange={(e) => setFormData({ ...formData, overtime_rate_per_hour: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Leave empty to use formula-based calculation
                      </p>
                    </div>
                  </div>
                  {totalSalary > 0 && (
                    <div className="bg-primary/5 p-3 rounded-lg border">
                      <div className="text-sm font-medium">
                        Total Fixed Salary: ₹{totalSalary.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Note: Overtime will be calculated separately based on base salary
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEmployee ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Advanced Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search Employee</Label>
                <Input
                  id="search"
                  placeholder="Name, UAN, or Employee Code"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="filter_department">Department</Label>
                <Select 
                  value={filters.department_id} 
                  onValueChange={(value) => setFilters({ ...filters, department_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_DEPARTMENTS">All departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter_unit">Unit/Plant</Label>
                <Select 
                  value={filters.unit_id} 
                  onValueChange={(value) => setFilters({ ...filters, unit_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_UNITS">All units</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.unit_id} value={unit.unit_id}>
                        {unit.unit_name} - {unit.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="min_years">Min Years of Service</Label>
                <Input
                  id="min_years"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={filters.min_years_service}
                  onChange={(e) => setFilters({ ...filters, min_years_service: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="max_years">Max Years of Service</Label>
                <Input
                  id="max_years"
                  type="number"
                  step="0.1"
                  placeholder="50"
                  value={filters.max_years_service}
                  onChange={(e) => setFilters({ ...filters, max_years_service: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="plant_location">Plant Location</Label>
                <Select 
                  value={filters.plant_location} 
                  onValueChange={(value) => setFilters({ ...filters, plant_location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_LOCATIONS">All locations</SelectItem>
                    <SelectItem value="Panchkula">Panchkula</SelectItem>
                    <SelectItem value="Vadodara">Vadodara</SelectItem>
                    <SelectItem value="Baddi">Baddi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
          )}

          {/* Results Summary */}
          {showFilters && enhancedEmployees.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing {enhancedEmployees.length} filtered employee(s)
            </div>
          )}

          {/* Employee Table */}
          <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>UAN Number</TableHead>
            <TableHead>Unit/Department</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Service & Age</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Salary Components</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayEmployees.map((employee: any) => {
            const totalSal = employee.base_salary + (employee.hra_amount || 0) + (employee.other_conv_amount || 0);
            const yearsOfService = showFilters ? employee.years_of_service : calculateYearsOfService(employee.joining_date);
            const age = showFilters ? employee.age_years : calculateAge(employee.date_of_birth);
            
            return (
              <TableRow key={employee.id}>
                <TableCell>
                  <div className="font-mono text-sm">
                    {employee.employee_code || (
                      <Badge variant="secondary">Generating...</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.uan_number}</TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    <div className="font-medium">
                      {showFilters ? employee.unit_name : employee.units?.unit_name || '-'}
                    </div>
                    <div className="text-muted-foreground">
                      {showFilters ? employee.plant_location : employee.units?.location || '-'}
                    </div>
                    {(showFilters ? employee.department_name : employee.departments?.name) && (
                      <Badge variant="outline" className="text-xs">
                        {showFilters ? employee.department_name : employee.departments?.name}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    {employee.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-24">{employee.email}</span>
                      </div>
                    )}
                    {employee.preferred_language && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span className="capitalize">{employee.preferred_language}</span>
                      </div>
                    )}
                    {!employee.email && !employee.preferred_language && '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    {yearsOfService && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {yearsOfService.toFixed(1)} years
                      </div>
                    )}
                    {age && (
                      <div className="text-muted-foreground">
                        Age: {age} years
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    {employee.pan_number && <div>PAN: {employee.pan_number}</div>}
                    {employee.aadhaar_number && <div>Aadhaar: {employee.aadhaar_number}</div>}
                    {employee.id_proof_file_path && (
                      <Badge variant="outline" className="text-xs">
                        ID Proof ✓
                      </Badge>
                    )}
                    {!employee.pan_number && !employee.aadhaar_number && !employee.id_proof_file_path && '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    <div>Base: ₹{employee.base_salary.toLocaleString()}</div>
                    {employee.hra_amount > 0 && <div>HRA: ₹{employee.hra_amount.toLocaleString()}</div>}
                    {employee.other_conv_amount > 0 && <div>Other: ₹{employee.other_conv_amount.toLocaleString()}</div>}
                    <div className="font-semibold">Total: ₹{totalSal.toLocaleString()}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={employee.active ? "default" : "secondary"}>
                    {employee.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(employee)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="bulk-upload">
          <BulkEmployeeUploader 
            onUploadComplete={() => {
              fetchEmployees();
              if (showFilters) fetchEnhancedEmployees();
            }} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
