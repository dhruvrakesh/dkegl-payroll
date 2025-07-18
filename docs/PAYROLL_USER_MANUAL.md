
# Complete Payroll Management System - User Manual

## Table of Contents

1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Employee Management](#employee-management)
4. [Attendance Data Entry](#attendance-data-entry)
5. [Leave Management](#leave-management)
6. [Formula Management & Validation](#formula-management--validation)
7. [Payroll Processing](#payroll-processing)
8. [Weekly Off & Holiday Management](#weekly-off--holiday-management)
9. [Bulk Operations & CSV Management](#bulk-operations--csv-management)
10. [Reports & Analytics](#reports--analytics)
11. [System Administration](#system-administration)
12. [Troubleshooting & Best Practices](#troubleshooting--best-practices)

---

## System Overview

### What is the Payroll Management System?

The Enhanced Payroll Management System is a comprehensive web-based application designed to streamline all aspects of payroll processing, from employee onboarding to salary disbursement. The system provides automated calculations, bulk data processing, leave management, and comprehensive audit trails.

### Key Features

- **Employee Management**: Complete employee lifecycle management
- **Attendance Tracking**: Individual and bulk attendance data entry with validation
- **Leave Management**: Comprehensive leave balance tracking and application processing
- **Formula Management**: Configurable salary calculation formulas with real-time monitoring
- **Payroll Processing**: Automated salary calculations with audit trails
- **Bulk Operations**: CSV-based bulk data entry and processing
- **Reports & Analytics**: Comprehensive reporting with visual dashboards
- **Audit & Compliance**: Complete audit trails and compliance reporting

### System Architecture

The system is built on:
- **Frontend**: React with TypeScript for type safety
- **Backend**: Supabase for database and authentication
- **Real-time Updates**: Live data synchronization
- **Security**: Row-level security and role-based access control

---

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Valid user account with appropriate permissions

### Logging In

1. Navigate to the application URL
2. Enter your email and password
3. Click "Sign In"
4. If this is your first login, wait for admin approval

### Navigation Overview

The system uses a tabbed interface with the following main sections:

- **Salary Management**: Main payroll processing dashboard
- **Employees**: Employee data management
- **Departments**: Department and unit management
- **Attendance**: Attendance tracking and management
- **Leave Balance**: Leave management system
- **Sunday Overtime**: Special overtime calculations
- **Formulas**: Salary calculation formula management
- **Bulk Operations**: Mass data processing tools
- **Audit & Logs**: System audit trails and monitoring

---

## Employee Management

### Adding New Employees

#### Individual Employee Entry

1. Navigate to **Employees** tab
2. Click **"Add New Employee"**
3. Fill in required information:
   - **Basic Information**: Name, email, phone
   - **Employment Details**: Department, unit, position
   - **Salary Information**: Basic salary, allowances
   - **Leave Entitlements**: Annual leave quotas
   - **Bank Details**: Account information for salary transfer

4. Click **"Save Employee"**

#### Required Fields
- Employee Name (Full legal name)
- Employee Code (Auto-generated or manual)
- UAN Number (Unique Identification)
- Department/Unit
- Basic Salary
- Date of Joining

#### Optional Fields
- Email address
- Phone number
- Address details
- Emergency contact
- Bank account details
- PF/ESI numbers

### Employee Code Management

The system automatically generates employee codes in the format: `EMP-{UNIT_CODE}-{SEQUENCE}`

Example: `EMP-MFG-0001` for the first employee in Manufacturing unit

### Bulk Employee Import

1. Navigate to **Employees** tab
2. Click **"Bulk Import"**
3. Download the employee template CSV
4. Fill in employee data following the template format
5. Upload the completed CSV file
6. Review validation results
7. Confirm import

#### CSV Template Format
```csv
name,email,phone,department_code,unit_code,basic_salary,date_of_joining,uan_number
John Doe,john@company.com,9876543210,HR,HRU,50000,2024-01-15,123456789012
Jane Smith,jane@company.com,9876543211,IT,ITU,60000,2024-01-20,123456789013
```

### Employee Status Management

- **Active**: Employee is currently working
- **Inactive**: Employee is temporarily inactive
- **Terminated**: Employee has left the organization

### Employee Data Validation

The system validates:
- Unique employee codes
- Valid UAN numbers (12 digits)
- Email format validation
- Phone number format
- Salary amount validation
- Department/unit existence

---

## Attendance Data Entry

### Individual Attendance Entry

1. Navigate to **Attendance** tab
2. Select **"Individual Entry"** view
3. Choose employee from dropdown
4. Select attendance date
5. Enter attendance details:
   - **Hours Worked**: Regular working hours (0-24)
   - **Overtime Hours**: Additional hours beyond regular time
   - **Status**: Present, Leave, Weekly Off, etc.
   - **Unit**: Override default unit if needed

6. Click **"Save Attendance"**

### Attendance Status Types

- **PRESENT**: Employee was present and worked
- **CASUAL_LEAVE**: Casual leave taken
- **EARNED_LEAVE**: Earned leave taken
- **SICK_LEAVE**: Sick leave taken
- **UNPAID_LEAVE**: Leave without pay
- **WEEKLY_OFF**: Scheduled weekly off day
- **HOLIDAY**: Public holiday

### Bulk Attendance Entry

#### CSV Upload Process

1. Navigate to **Attendance** tab → **Bulk Upload**
2. Click **"Download Template"**
3. Fill in the CSV template with attendance data
4. Upload the completed file
5. Review validation results
6. Confirm upload

#### CSV Template Format
```csv
employee_code,date,hours_worked,overtime_hours,unit_code
EMP-MFG-0001,2024-01-15,8,0,MFG
EMP-MFG-0002,2024-01-15,9,1,MFG
EMP-HR-0001,2024-01-15,8,0,HR
```

#### Validation Rules

- **Hours Worked**: Must be between 0-24
- **Overtime Hours**: Must be ≥ 0
- **Date Format**: YYYY-MM-DD or DD-MM-YYYY
- **Employee Code**: Must exist in system
- **No Future Dates**: Attendance cannot be future-dated
- **No Duplicates**: One record per employee per date

### Bulk Attendance Updates

For correcting existing attendance records:

1. Navigate to **Attendance** tab → **Bulk Update**
2. Enter update reason (required for audit)
3. Download update template
4. Fill in corrections
5. Upload file
6. Review changes
7. Confirm updates

### Sunday Overtime Handling

The system automatically handles Sunday overtime:
- All Sunday working hours are treated as overtime
- Regular hours are still recorded for calculation purposes
- Special overtime rates may apply (configurable)

### Attendance Calendar View

- Visual calendar showing attendance status
- Color-coded status indicators
- Quick daily summary
- Monthly overview
- Filter by employee, unit, or department

---

## Leave Management

### Leave Types

The system supports multiple leave types:

- **Casual Leave**: Short-term personal leaves
- **Earned Leave**: Annual vacation entitlement
- **Sick Leave**: Medical leave
- **Maternity Leave**: Maternity benefit
- **Paternity Leave**: Paternity benefit
- **Unpaid Leave**: Leave without pay

### Leave Balance Management

#### Individual Leave Balance Entry

1. Navigate to **Leave Balance** tab
2. Select employee
3. Choose year
4. Enter opening balances:
   - Casual Leave balance
   - Earned Leave balance
   - Other leave types as applicable
5. Save balances

#### Bulk Leave Balance Import

1. Click **"Bulk Import"** in Leave Balance section
2. Download leave balance template
3. Fill in employee leave balances
4. Upload CSV file
5. Review and confirm

#### CSV Template Format
```csv
employee_code,year,casual_leave_balance,earned_leave_balance
EMP-MFG-0001,2024,12,21
EMP-MFG-0002,2024,10,18
```

### Leave Application Process

#### Individual Leave Application

1. Navigate to **Leave Balance** tab
2. Click **"Apply Leave"**
3. Select employee and leave type
4. Choose start and end dates
5. Enter reason
6. Submit application

#### Bulk Leave Applications

1. Navigate to **Leave Balance** tab → **Bulk Applications**
2. Download bulk application template
3. Fill in multiple leave applications
4. Upload CSV file
5. Review applications
6. Approve/reject in bulk

#### Bulk Application Template
```csv
employee_code,leave_type,start_date,end_date,reason
EMP-MFG-0001,CASUAL_LEAVE,2024-01-15,2024-01-17,Personal work
EMP-MFG-0002,EARNED_LEAVE,2024-01-20,2024-01-25,Family vacation
```

### Leave Validation System

The system validates:
- Sufficient leave balance
- No overlapping leave applications
- Maximum consecutive days (configurable)
- Advance notice requirements
- Department-specific rules

### Leave Balance Tracking

- Real-time balance calculations
- Automatic deduction on approval
- Balance carry-forward rules
- Encashment calculations
- Prorated balances for new joiners

### Leave Calendar Integration

- Visual leave calendar
- Team leave overview
- Conflict detection
- Resource planning assistance

---

## Formula Management & Validation

### Understanding Salary Formulas

The system uses configurable formulas for salary calculations:

#### Basic Salary Components
- **Basic Salary**: Base salary amount
- **HRA**: House Rent Allowance
- **Transport Allowance**: Travel allowance
- **Medical Allowance**: Medical benefits
- **Other Allowances**: Miscellaneous allowances

#### Deductions
- **PF**: Provident Fund
- **ESI**: Employee State Insurance
- **TDS**: Tax Deducted at Source
- **Loan Deductions**: Advance recoveries
- **Other Deductions**: Miscellaneous deductions

### Formula Creation and Editing

1. Navigate to **Formulas** tab
2. Click **"Create New Formula"**
3. Define formula components:
   - Formula name and description
   - Calculation logic
   - Variables and constants
   - Conditional rules

4. Test formula with sample data
5. Save and activate

### Formula Validation Process

#### Automatic Validation
- Real-time syntax checking
- Variable validation
- Calculation accuracy verification
- Performance monitoring

#### Manual Testing
1. Navigate to **Formulas** tab → **Testing**
2. Select formula to test
3. Input test employee data
4. Run calculation
5. Verify results
6. Compare with expected values

### Formula Performance Monitoring

The system continuously monitors:
- **Execution Time**: Formula calculation speed
- **Success Rate**: Percentage of successful calculations
- **Error Rate**: Failed calculation frequency
- **Resource Usage**: System resource consumption

### Formula Dashboard

Access real-time formula performance:
1. Navigate to **Formulas** tab → **Monitoring**
2. View performance metrics:
   - Active formulas status
   - Recent execution history
   - Error logs and alerts
   - Performance trends

### Overtime Calculation Rules

#### Regular Overtime
- Standard multiplier: 1.5x or 2x base rate
- Calculation period: Daily or weekly
- Maximum overtime limits
- Holiday overtime rates

#### Sunday Overtime
Special handling for Sunday work:
1. Navigate to **Sunday Overtime** tab
2. Configure Sunday overtime rules:
   - Overtime rate multiplier
   - Minimum hours for overtime
   - Unit-specific rules
   - Holiday integration

### Formula Audit and Compliance

- Complete calculation audit trails
- Regulatory compliance checks
- Formula change history
- Impact analysis for formula updates

---

## Payroll Processing

### Monthly Payroll Workflow

#### Preparation Phase
1. Ensure all attendance data is complete
2. Verify leave balances are updated
3. Check advance and deduction entries
4. Validate employee master data

#### Processing Phase
1. Navigate to **Salary Management** tab
2. Select processing month
3. Choose employees/units to process
4. Click **"Generate Payroll"**
5. Review calculations
6. Approve for processing

#### Verification Phase
1. Review salary calculations
2. Check for anomalies or errors
3. Verify statutory deductions
4. Cross-check with previous months
5. Generate payroll reports

### Salary Calculation Engine

The system calculates:
- **Gross Salary**: All earnings combined
- **Statutory Deductions**: PF, ESI, TDS
- **Other Deductions**: Advances, loans
- **Net Salary**: Final payable amount
- **Total Paid Days**: Working days calculation

### Bulk Payroll Operations

1. Navigate to **Bulk Operations** tab
2. Select **"Process Monthly Payroll"**
3. Choose processing month
4. Set processing parameters
5. Start bulk processing
6. Monitor progress
7. Review results

### Salary Disbursement

#### Bank Transfer Integration
1. Generate bank transfer file
2. Review transfer details
3. Upload to bank portal
4. Update payment status
5. Generate payment confirmations

#### Payslip Generation
1. Automatic payslip creation
2. Digital payslip distribution
3. Email notifications
4. Physical printing options

### Payroll Audit Trail

Complete tracking of:
- Calculation steps
- Formula applications
- Manual adjustments
- Approval workflows
- Payment confirmations

---

## Weekly Off & Holiday Management

### Weekly Off Scheduler

#### Setting Up Weekly Off Rules

1. Navigate to **Weekly Off** management (under Bulk Operations)
2. Click **"Create Weekly Off Rule"**
3. Configure rule parameters:
   - **Unit/Department**: Select applicable unit
   - **Day of Week**: Choose weekly off day
   - **Effective Date Range**: Start and end dates
   - **Override Rules**: Special exceptions

4. Save rule configuration

#### Unit-Specific Weekly Offs
- Different units can have different weekly off days
- Flexible scheduling for shift workers
- Seasonal adjustments
- Holiday integration

### Holiday Calendar Management

1. Navigate to **Settings** → **Holiday Calendar**
2. Add public holidays:
   - Holiday name and description
   - Date and duration
   - Applicable units/departments
   - Pay rules (paid/unpaid)

3. Import holiday calendars from CSV
4. Set regional holiday variations

### Weekly Off Validation

The system ensures:
- No conflicts with attendance entries
- Proper overtime calculations
- Leave application validations
- Payroll calculation accuracy

---

## Bulk Operations & CSV Management

### CSV Upload Best Practices

#### File Preparation
- Use UTF-8 encoding
- Follow exact column headers
- Remove empty rows
- Validate data before upload
- Keep backup copies

#### Common CSV Operations

1. **Employee Master Upload**
   - Download template
   - Fill employee details
   - Validate format
   - Upload and review

2. **Attendance Bulk Upload**
   - Daily/monthly attendance data
   - Validation checks
   - Error handling
   - Duplicate prevention

3. **Leave Balance Import**
   - Annual leave balance setup
   - Mid-year adjustments
   - New joiner balances
   - Carry-forward processing

### Error Handling in Bulk Operations

#### Error Categories
- **Validation Errors**: Data format issues
- **Business Rule Violations**: Policy conflicts
- **Duplicate Data**: Existing record conflicts
- **Missing References**: Invalid employee codes

#### Error Resolution Process
1. Review error report
2. Correct source data
3. Re-upload corrected file
4. Verify successful processing

### Bulk Update Operations

#### Attendance Corrections
1. Navigate to **Attendance** → **Bulk Update**
2. Provide update reason
3. Upload correction file
4. Review changes
5. Approve updates

#### Salary Adjustments
1. Navigate to **Salary Management** → **Bulk Adjustments**
2. Upload adjustment file
3. Verify calculations
4. Process adjustments

### CSV Template Management

The system provides templates for:
- Employee master data
- Attendance records
- Leave balances
- Salary adjustments
- Advance entries
- Deduction entries

---

## Reports & Analytics

### Standard Reports

#### Employee Reports
- Employee master list
- Department-wise employee count
- New joiners and exits
- Employee demographics

#### Attendance Reports
- Monthly attendance summary
- Overtime analysis
- Leave utilization
- Absenteeism patterns

#### Payroll Reports
- Salary register
- Statutory compliance reports
- Bank transfer files
- Tax reports

#### Leave Reports
- Leave balance summary
- Leave utilization trends
- Department-wise leave analysis

### Custom Report Builder

1. Navigate to **Reports** section
2. Select **"Custom Report Builder"**
3. Choose data sources
4. Define filters and parameters
5. Select output format
6. Generate report

### Dashboard Analytics

#### Management Dashboard
- Key performance indicators
- Attendance trends
- Cost analysis
- Compliance status

#### HR Dashboard
- Employee metrics
- Leave patterns
- Overtime trends
- Department comparisons

### Data Export Options

- **PDF**: Formatted reports
- **Excel**: Data analysis
- **CSV**: Data exchange
- **API**: System integration

---

## System Administration

### User Management

#### User Roles
- **Admin**: Full system access
- **HR Manager**: Employee and payroll management
- **Unit Manager**: Unit-specific access
- **Employee**: Self-service access

#### User Access Control
1. Navigate to **Users** tab (Admin only)
2. Manage user accounts:
   - Create new users
   - Assign roles
   - Set permissions
   - Manage approval status

### System Configuration

#### Organization Setup
- Company information
- Multiple unit management
- Department structure
- Approval workflows

#### System Parameters
- Default values
- Validation rules
- Calculation parameters
- Integration settings

### Data Backup and Security

#### Automatic Backups
- Daily data backups
- Version control
- Recovery procedures
- Data integrity checks

#### Security Features
- Role-based access control
- Audit trail logging
- Data encryption
- Session management

### Integration Management

#### External System Integration
- Bank file formats
- Government reporting
- Third-party HR systems
- API management

---

## Troubleshooting & Best Practices

### Common Issues and Solutions

#### Attendance Entry Issues

**Problem**: CSV upload fails with validation errors
**Solution**:
1. Check date format (YYYY-MM-DD)
2. Verify employee codes exist
3. Ensure hours are within valid range (0-24)
4. Remove duplicate entries

**Problem**: Overtime not calculating correctly
**Solution**:
1. Check formula configuration
2. Verify Sunday overtime rules
3. Review unit-specific settings
4. Test with manual calculation

#### Leave Management Issues

**Problem**: Leave balance not updating
**Solution**:
1. Check leave application status
2. Verify approval workflow
3. Review leave type configuration
4. Check for system errors

**Problem**: Insufficient leave balance error
**Solution**:
1. Verify current leave balance
2. Check leave policy rules
3. Review previous applications
4. Update balance if needed

#### Formula and Calculation Issues

**Problem**: Salary calculation errors
**Solution**:
1. Review formula syntax
2. Check variable definitions
3. Test with sample data
4. Verify input data accuracy

**Problem**: Performance issues with large datasets
**Solution**:
1. Process in smaller batches
2. Check system resources
3. Optimize formula logic
4. Contact system administrator

### Data Quality Best Practices

#### Data Entry Guidelines
- Always validate data before bulk upload
- Use standardized formats
- Maintain data consistency
- Regular data audits

#### System Maintenance
- Regular backup verification
- Performance monitoring
- User access reviews
- System updates

### Performance Optimization

#### Bulk Operations
- Process data in optimal batch sizes
- Schedule heavy operations during off-hours
- Monitor system resources
- Use incremental updates when possible

#### Report Generation
- Use filters to limit data scope
- Schedule large reports during low usage
- Cache frequently accessed reports
- Optimize query parameters

### Emergency Procedures

#### System Downtime
1. Check system status
2. Contact administrator
3. Use backup procedures
4. Document issues

#### Data Recovery
1. Identify affected data
2. Use backup restoration
3. Verify data integrity
4. Update stakeholders

### Best Practices Summary

1. **Regular Data Validation**: Implement checks at every stage
2. **Backup Procedures**: Maintain regular backups
3. **User Training**: Ensure proper user education
4. **Documentation**: Keep processes documented
5. **Audit Trails**: Maintain complete audit logs
6. **Performance Monitoring**: Regular system health checks
7. **Security Compliance**: Follow security protocols
8. **Change Management**: Proper change control procedures

---

## Quick Reference Guide

### Essential Navigation Shortcuts

- **Ctrl + 1**: Navigate to Salary Management
- **Ctrl + 2**: Navigate to Employees
- **Ctrl + 3**: Navigate to Attendance
- **Ctrl + 4**: Navigate to Leave Management
- **F5**: Refresh current view
- **Ctrl + S**: Save current form (when applicable)

### Critical Contact Information

- **System Administrator**: Contact for technical issues
- **HR Help Desk**: Contact for process questions
- **IT Support**: Contact for access issues

### Emergency Contacts

Maintain updated contact information for:
- System administrator
- Database administrator
- Network support
- Vendor support

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Next Review**: [Review Date]  

For additional support or questions not covered in this manual, please contact your system administrator or HR department.
