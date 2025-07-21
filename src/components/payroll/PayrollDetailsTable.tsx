import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Download, FileText, Mail } from 'lucide-react';
import jsPDF from 'jspdf';

interface PayrollDetail {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  email: string;
  unit_name: string;
  base_salary: number;
  hra_amount: number;
  other_conv_amount: number;
  overtime_amount: number;
  gross_salary: number;
  pf_deduction: number;
  esi_deduction: number;
  advances_deduction: number;
  net_salary: number;
  total_days_present: number;
  total_hours_worked: number;
  month: string;
  preferred_language: string;
}

interface PayrollDetailsTableProps {
  month: string;
  unitId?: string;
}

export const PayrollDetailsTable = ({ month, unitId }: PayrollDetailsTableProps) => {
  const [payrollData, setPayrollData] = useState<PayrollDetail[]>([]);
  const [filteredData, setFilteredData] = useState<PayrollDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    if (month) {
      fetchPayrollDetails();
    }
  }, [month, unitId]);

  useEffect(() => {
    filterData();
  }, [payrollData, searchTerm, languageFilter]);

  const fetchPayrollDetails = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('salary_disbursement')
        .select(`
          *,
          payroll_employees:employee_id (
            name,
            employee_code,
            email,
            preferred_language,
            units:unit_id (unit_name)
          )
        `)
        .eq('month', month)
        .order('employee_id');

      if (unitId && unitId !== 'all') {
        // Filter by unit through the employee relationship
        const { data: employees } = await supabase
          .from('payroll_employees')
          .select('id')
          .eq('unit_id', unitId);
        
        const employeeIds = employees?.map(emp => emp.id) || [];
        if (employeeIds.length > 0) {
          query = query.in('employee_id', employeeIds);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData: PayrollDetail[] = (data || []).map((record: any) => ({
        id: record.id,
        employee_id: record.employee_id,
        employee_name: record.payroll_employees?.name || 'Unknown',
        employee_code: record.payroll_employees?.employee_code || 'N/A',
        email: record.payroll_employees?.email || 'No email',
        unit_name: record.payroll_employees?.units?.unit_name || 'Unknown Unit',
        base_salary: record.base_salary || 0,
        hra_amount: record.hra_amount || 0,
        other_conv_amount: record.other_conv_amount || 0,
        overtime_amount: record.overtime_amount || 0,
        gross_salary: record.gross_salary || 0,
        pf_deduction: record.pf_deduction || 0,
        esi_deduction: record.esi_deduction || 0,
        advances_deduction: record.advances_deduction || 0,
        net_salary: record.net_salary || 0,
        total_days_present: record.total_days_present || 0,
        total_hours_worked: record.total_hours_worked || 0,
        month: record.month,
        preferred_language: record.payroll_employees?.preferred_language || 'english'
      }));

      setPayrollData(formattedData);
    } catch (error) {
      console.error('Error fetching payroll details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payroll details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = payrollData;

    if (searchTerm) {
      filtered = filtered.filter(
        record =>
          record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (languageFilter !== 'all') {
      filtered = filtered.filter(record => record.preferred_language === languageFilter);
    }

    setFilteredData(filtered);
  };

  const generateSalarySlipPDF = (employee: PayrollDetail) => {
    const doc = new jsPDF();
    const isHindi = employee.preferred_language === 'hindi';

    // Company Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DK ENTERPRISES', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Salary Slip', 105, 30, { align: 'center' });
    
    // Employee Details
    doc.setFontSize(10);
    const monthYear = new Date(employee.month + '-01').toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });

    doc.text(`Employee: ${employee.employee_name}`, 20, 50);
    doc.text(`Code: ${employee.employee_code}`, 20, 60);
    doc.text(`Month: ${monthYear}`, 20, 70);
    doc.text(`Unit: ${employee.unit_name}`, 20, 80);

    // Earnings Table
    doc.setFont('helvetica', 'bold');
    doc.text('EARNINGS', 20, 100);
    doc.text('AMOUNT (₹)', 140, 100);
    
    doc.setFont('helvetica', 'normal');
    const earnings = [
      ['Basic Salary', employee.base_salary.toFixed(2)],
      ['HRA', employee.hra_amount.toFixed(2)],
      ['Other/Conveyance', employee.other_conv_amount.toFixed(2)],
      ['Overtime', employee.overtime_amount.toFixed(2)],
    ];

    let yPos = 110;
    earnings.forEach(([label, amount]) => {
      doc.text(label, 20, yPos);
      doc.text(amount, 160, yPos, { align: 'right' });
      yPos += 10;
    });

    // Gross Total
    doc.setFont('helvetica', 'bold');
    doc.text('GROSS TOTAL', 20, yPos + 5);
    doc.text(employee.gross_salary.toFixed(2), 160, yPos + 5, { align: 'right' });

    // Deductions
    yPos += 20;
    doc.text('DEDUCTIONS', 20, yPos);
    doc.text('AMOUNT (₹)', 140, yPos);
    
    doc.setFont('helvetica', 'normal');
    const deductions = [
      ['PF Deduction', employee.pf_deduction.toFixed(2)],
      ['ESI Deduction', employee.esi_deduction.toFixed(2)],
      ['Advances', employee.advances_deduction.toFixed(2)],
    ];

    yPos += 10;
    deductions.forEach(([label, amount]) => {
      doc.text(label, 20, yPos);
      doc.text(amount, 160, yPos, { align: 'right' });
      yPos += 10;
    });

    // Net Salary
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('NET SALARY', 20, yPos);
    doc.text(employee.net_salary.toFixed(2), 160, yPos, { align: 'right' });

    // Attendance Summary
    yPos += 20;
    doc.setFont('helvetica', 'normal');
    doc.text(`Days Present: ${employee.total_days_present}`, 20, yPos);
    doc.text(`Hours Worked: ${employee.total_hours_worked}`, 20, yPos + 10);

    // Save PDF
    const fileName = `salary_slip_${employee.employee_code}_${employee.month}.pdf`;
    doc.save(fileName);

    toast({
      title: "PDF Generated",
      description: `Salary slip for ${employee.employee_name} has been downloaded`,
    });
  };

  const exportAllToPDF = () => {
    filteredData.forEach((employee, index) => {
      setTimeout(() => {
        generateSalarySlipPDF(employee);
      }, index * 500); // Stagger the downloads
    });

    toast({
      title: "Bulk PDF Export Started",
      description: `Generating ${filteredData.length} salary slips. Please wait...`,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-2">Loading payroll details...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Payroll Details - {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </CardTitle>
        <CardDescription>
          Detailed salary breakdown for all employees with downloadable PDF slips
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="hindi">Hindi</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={exportAllToPDF}
            disabled={filteredData.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export All PDFs
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{filteredData.length}</div>
            <div className="text-sm text-blue-600">Employees</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ₹{filteredData.reduce((sum, emp) => sum + emp.gross_salary, 0).toFixed(0)}
            </div>
            <div className="text-sm text-green-600">Total Gross</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              ₹{filteredData.reduce((sum, emp) => sum + emp.pf_deduction + emp.esi_deduction + emp.advances_deduction, 0).toFixed(0)}
            </div>
            <div className="text-sm text-orange-600">Total Deductions</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              ₹{filteredData.reduce((sum, emp) => sum + emp.net_salary, 0).toFixed(0)}
            </div>
            <div className="text-sm text-purple-600">Total Net</div>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">HRA</TableHead>
                <TableHead className="text-right">Other/Conv</TableHead>
                <TableHead className="text-right">Overtime</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No payroll data found for the selected criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.employee_name}</div>
                        <div className="text-sm text-muted-foreground">{employee.employee_code}</div>
                        <div className="text-xs text-muted-foreground">{employee.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.unit_name}</TableCell>
                    <TableCell className="text-right">₹{employee.base_salary.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{employee.hra_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{employee.other_conv_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{employee.overtime_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">₹{employee.gross_salary.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      ₹{(employee.pf_deduction + employee.esi_deduction + employee.advances_deduction).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold">₹{employee.net_salary.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={employee.preferred_language === 'hindi' ? 'secondary' : 'default'}>
                        {employee.preferred_language}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateSalarySlipPDF(employee)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};