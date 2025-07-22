
# Comprehensive Payroll Management System - User Manual

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Authentication & User Management](#authentication--user-management)
4. [Core Payroll Operations](#core-payroll-operations)
5. [Bulk Operations](#bulk-operations)
6. [Leave Management & Reconciliation](#leave-management--reconciliation)
7. [Salary Slip Generation](#salary-slip-generation)
8. [Advanced Features](#advanced-features)
9. [Troubleshooting & FAQ](#troubleshooting--faq)
10. [Workflow Reference](#workflow-reference)

---

## System Overview

### Main Dashboard Components
The payroll system is organized into several key modules accessible through the main navigation:

- **PayrollDashboard**: Central hub for all payroll operations
- **Employee Management**: Complete employee lifecycle management
- **Attendance Management**: Daily attendance tracking and bulk operations
- **Leave Management**: Leave balance tracking and reconciliation
- **Salary Processing**: Monthly payroll calculation and disbursement
- **Reports & Analytics**: Comprehensive reporting suite

### User Roles & Permissions
- **Admin**: Full system access, user management, system configuration
- **HR Manager**: Employee management, payroll processing, reporting
- **Manager**: Unit-specific operations, employee supervision
- **Employee**: Self-service access to personal data and salary slips

---

## Getting Started

### Quick Start Guide for New Users

#### Step 1: System Login
1. Navigate to the application URL
2. Click "Sign In" button
3. Enter your email and password
4. Wait for profile verification and approval

#### Step 2: Dashboard Navigation
- **Main Tabs**: Payroll, Employees, Attendance, Leave Management
- **Quick Actions**: Located in the top-right corner
- **Status Indicators**: Real-time system status and alerts

#### Step 3: Initial Setup (Admin Only)
1. Go to **System Initializer**
2. Configure basic settings:
   - Units and departments
   - Leave policies
   - Salary components
   - Formula configurations

---

## Authentication & User Management

### Login Process
```
1. Access Application → 2. Enter Credentials → 3. Profile Verification → 4. Dashboard Access
```

### User Account Management
- **Profile Setup**: Complete employee profile with all required fields
- **Role Assignment**: Proper role assignment for access control
- **Organization Mapping**: Users automatically mapped to organization based on email domain

### Security Features
- Row-Level Security (RLS) for data protection
- Role-based access control
- Audit logging for all operations
- Session management and timeout

---

## Core Payroll Operations

### Monthly Payroll Workflow

#### Phase 1: Pre-Processing (Days 1-5 of month)
1. **Attendance Verification**
   - Review attendance data for previous month
   - Handle attendance discrepancies
   - Process bulk attendance updates if needed

2. **Leave Reconciliation**
   - Navigate to **Leave Reconciliation** tab
   - Select month and year
   - Click "Start Reconciliation"
   - Review discrepancies and apply adjustments

3. **Employee Data Validation**
   - Verify active employee list
   - Update salary components if changed
   - Check advance deductions

#### Phase 2: Payroll Calculation (Days 6-10)
1. **Bulk Payroll Processing**
   - Go to **Bulk Payroll Operations**
   - Select processing month
   - Choose processing scope (All units/Specific unit)
   - Click "Start Bulk Processing"
   - Monitor progress in real-time

2. **Individual Payroll Review**
   - Access **Payroll Details Table**
   - Review calculated salaries
   - Handle exceptions and special cases
   - Approve payroll calculations

#### Phase 3: Salary Disbursement (Days 11-15)
1. **Enhanced Salary Disbursement**
   - Navigate to **Salary Disbursement** tab
   - Review disbursement summary
   - Generate bank transfer files
   - Process salary payments

2. **Salary Slip Generation**
   - Select language preference (English/Hindi)
   - Generate individual or bulk salary slips
   - Download PDF files
   - Email distribution (if configured)

### Employee Management Operations

#### Adding New Employees
1. Navigate to **Employees Management**
2. Click "Add New Employee"
3. Fill required information:
   - Personal details
   - Employment information
   - Salary structure
   - Unit assignment
4. Employee code auto-generation
5. Activate employee account

#### Employee Lifecycle Management
- **Onboarding**: Complete profile setup and documentation
- **Transfers**: Unit transfers with proper audit trail
- **Promotions**: Salary structure updates and approvals
- **Terminations**: Proper exit process and final settlements

---

## Bulk Operations

### Attendance Bulk Upload

#### CSV File Format
```csv
employee_code,date,hours_worked,overtime_hours,status
EMP-PAN-0001,2025-06-01,8,0,PRESENT
EMP-PAN-0001,2025-06-02,0,0,CASUAL_LEAVE
EMP-PAN-0001,2025-06-08,0,0,WEEKLY_OFF
```

#### Upload Process
1. Navigate to **Attendance Management**
2. Select "Bulk Upload" option
3. Download template file
4. Fill data according to format
5. Upload file and review validation results
6. Confirm and process valid records

### Bulk Leave Applications
1. Access **Bulk Leave Application System**
2. Select employees and date ranges
3. Specify leave type and reason
4. Submit for approval workflow
5. Track application status

### Monthly Payroll Bulk Processing
1. **Preparation Phase**
   - Ensure all attendance data is complete
   - Complete leave reconciliation
   - Verify employee active status

2. **Processing Phase**
   - Select **Bulk Payroll Operations**
   - Configure processing parameters
   - Monitor real-time progress
   - Handle processing errors

3. **Validation Phase**
   - Review processing results
   - Validate calculations
   - Generate summary reports

---

## Leave Management & Reconciliation

### Leave Balance Management

#### Initial Setup
1. Navigate to **Leave Balance Management**
2. Set annual leave entitlements per employee
3. Configure leave types and policies
4. Set carry-forward rules

#### Monthly Reconciliation Process
1. **Access Reconciliation Module**
   - Go to **Leave Reconciliation Enhanced**
   - Select month, year, and unit
   - Provide reconciliation reason

2. **Reconciliation Execution**
   - Click "Calculate Discrepancies"
   - Review suggested adjustments
   - Use smart filters for bulk selection
   - Apply adjustments with preview

3. **Adjustment Categories**
   - **Excess Leave**: Convert to unpaid leave
   - **Negative Balance**: Adjust from salary
   - **Carry Forward**: Apply organization policies

### Leave Adjustment Workflow
```
Attendance Review → Discrepancy Identification → Adjustment Calculation → Preview & Confirm → Balance Update
```

### Bulk Selection Tools
- **Select by Discrepancy**: Choose employees with adjustments above threshold
- **Select by Type**: Filter by positive/negative adjustments
- **Smart Filters**: Advanced filtering options
- **Preview Mode**: Review before final application

---

## Salary Slip Generation

### Multi-Language Support

#### English Salary Slips
1. Navigate to **Enhanced Salary Disbursement**
2. Select employees for slip generation
3. Choose "English" as language
4. Click "Generate Salary Slips"
5. Download individual or bulk PDF files

#### Hindi Salary Slips (हिंदी वेतन पर्ची)
1. Same process as English
2. Select "Hindi/हिंदी" as language preference
3. System automatically translates:
   - Salary components
   - Deduction categories
   - Employee information
   - Company details

### Salary Slip Components
- **Earnings**: Basic salary, allowances, overtime
- **Deductions**: PF, ESI, TDS, advances
- **Net Salary**: Final take-home amount
- **Leave Summary**: Leave balance and usage
- **Company Information**: Address and registration details

### Bulk Generation Process
1. Select month and processing unit
2. Filter employees if needed
3. Choose output format (PDF/Email)
4. Set language preference
5. Generate and download zip file

---

## Advanced Features

### Formula Management
1. **Access Formula Management Module**
2. **Custom Formula Creation**:
   - Salary calculation formulas
   - Overtime computation
   - Deduction calculations
   - Leave encashment rules

3. **Formula Monitoring**:
   - Performance metrics
   - Error tracking
   - Usage analytics

### Wage Calculator Dashboard
- **Panchkula Wage Calculator**: Specialized wage calculations
- **Multiple wage structures support**
- **Real-time calculation preview**
- **Historical wage data comparison**

### Analytics & Reporting
1. **Reconciliation Dashboard**:
   - Monthly reconciliation status
   - Completion rates and trends
   - Employee analytics
   - Custom reports

2. **Payroll Analytics**:
   - Cost analysis by department
   - Salary distribution reports
   - Year-over-year comparisons
   - Budget vs actual analysis

---

## Troubleshooting & FAQ

### Common Issues & Solutions

#### Issue: Attendance Upload Fails
**Symptoms**: CSV upload errors, validation failures
**Solutions**:
1. Check CSV format matches template exactly
2. Ensure employee codes exist in system
3. Verify date formats (YYYY-MM-DD or DD-MM-YYYY)
4. Check for special characters in data

#### Issue: Leave Reconciliation Discrepancies
**Symptoms**: Unexpected leave adjustments
**Solutions**:
1. Verify attendance data accuracy
2. Check leave balance initialization
3. Review leave policy configurations
4. Cross-reference with manual calculations

#### Issue: Salary Calculation Errors
**Symptoms**: Incorrect salary amounts
**Solutions**:
1. Verify employee salary structure
2. Check formula configurations
3. Review attendance and leave data
4. Validate advance and deduction entries

#### Issue: PDF Generation Fails
**Symptoms**: Salary slip download errors
**Solutions**:
1. Check browser pop-up settings
2. Ensure sufficient system resources
3. Verify employee data completeness
4. Try smaller batch sizes

### Performance Optimization
- **Large Dataset Handling**: Use filters and pagination
- **Bulk Operations**: Process in smaller batches
- **Report Generation**: Schedule during off-peak hours
- **Data Cleanup**: Regular maintenance of old records

### Data Validation Best Practices
1. **Regular Backups**: Automated daily backups
2. **Data Integrity Checks**: Monthly validation routines
3. **Audit Trail**: Complete operation logging
4. **Error Monitoring**: Real-time error notifications

---

## Workflow Reference

### Daily Operations Checklist
- [ ] Review attendance submissions
- [ ] Process leave applications
- [ ] Handle employee queries
- [ ] Update employee information
- [ ] Monitor system alerts

### Weekly Operations Checklist
- [ ] Bulk attendance corrections
- [ ] Leave balance reviews
- [ ] Department-wise reporting
- [ ] System maintenance tasks
- [ ] User access reviews

### Monthly Operations Checklist
- [ ] Complete leave reconciliation
- [ ] Process monthly payroll
- [ ] Generate salary slips
- [ ] Distribute payments
- [ ] Generate monthly reports
- [ ] Archive processed data

### Key Performance Indicators (KPIs)
1. **Processing Time**: Average time for payroll completion
2. **Accuracy Rate**: Percentage of error-free calculations
3. **Employee Satisfaction**: Feedback on salary slip delivery
4. **System Uptime**: Availability during critical periods
5. **Compliance Rate**: Adherence to labor regulations

### Emergency Procedures
1. **System Downtime**: Backup manual processes
2. **Data Corruption**: Recovery procedures
3. **Payment Delays**: Communication protocols
4. **Security Breaches**: Incident response plan

---

## Support & Training

### Getting Help
- **In-App Help**: Context-sensitive help tooltips
- **User Manual**: This comprehensive guide
- **Training Videos**: Step-by-step video tutorials
- **Support Tickets**: Technical support system

### Training Recommendations
1. **New Users**: Complete onboarding program
2. **Role-Specific Training**: Tailored to user responsibilities
3. **Regular Updates**: Monthly feature updates training
4. **Best Practices**: Quarterly best practices sessions

### System Updates
- **Release Notes**: Regular feature announcements
- **Migration Guides**: Upgrade procedures
- **Backup Procedures**: Data protection protocols
- **Rollback Plans**: Emergency recovery procedures

---

## Appendices

### Appendix A: CSV Templates
Available templates for bulk operations:
- Attendance upload template
- Employee master template
- Leave balance template
- Salary structure template

### Appendix B: Formula Examples
Common payroll formulas:
- Basic salary calculations
- Overtime computations
- Leave encashment formulas
- Tax deduction calculations

### Appendix C: Error Codes
Complete list of system error codes and their meanings

### Appendix D: API Documentation
For system integrations and custom development

---

*This manual is updated regularly. Please check for the latest version and feature updates.*

**Version**: 2.0  
**Last Updated**: January 2025  
**Next Review**: April 2025
