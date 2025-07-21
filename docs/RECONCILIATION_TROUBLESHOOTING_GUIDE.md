
# Leave Reconciliation System - Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. "No Data Found" Error

**Symptoms:**
- Empty reconciliation table
- "No records to display" message
- Zero employee count

**Possible Causes & Solutions:**

✅ **Check Date Range**
```
Problem: Wrong month/year selected
Solution: Verify current period selection
Action: Select correct month/year from dropdowns
```

✅ **Verify Employee Data**
```
Problem: No employees in selected unit
Solution: Check if employees exist in system
Action: Go to Employees tab → verify active employees
```

✅ **Unit Selection Issues**
```
Problem: Selected unit has no employees
Solution: Try "All Units" option first
Action: Set Unit dropdown to "All Units"
```

### 2. Reconciliation Calculation Fails

**Symptoms:**
- "Calculation failed" error
- Infinite loading spinner
- Partial results only

**Troubleshooting Steps:**

1. **Check Required Fields**
   - Adjustment reason is mandatory
   - Month/year must be selected
   - Unit selection (if any) must be valid

2. **Reduce Scope**
   - Select single unit instead of all
   - Try previous month first
   - Limit to smaller date range

3. **System Resources**
   - Wait for current operations to complete
   - Refresh page and try again
   - Contact admin if persistent

### 3. Permission Denied Errors

**Symptoms:**
- "Access denied" messages
- Missing menu options
- Read-only mode when edit needed

**Resolution Steps:**

```
1. Check User Role
   - Admin: Full access
   - Payroll Staff: Standard operations
   - Viewer: Read-only access
   - Unit Manager: Limited to specific unit

2. Verify Organization
   - Must be member of DKEGL organization
   - Account must be approved
   - Contact admin for role assignment

3. Session Issues
   - Log out and log back in
   - Clear browser cache
   - Try incognito/private mode
```

### 4. Performance Issues

**Symptoms:**
- Slow loading times
- Browser freezing
- Timeout errors

**Performance Optimization:**

✅ **Reduce Data Load**
- Filter by specific unit
- Select shorter date ranges
- Use smart filters to limit results

✅ **Browser Optimization**
- Close unnecessary tabs
- Clear browser cache
- Use Chrome/Firefox (recommended)
- Disable browser extensions

✅ **System Resources**
- Check internet connection
- Avoid peak usage hours
- Process smaller batches

### 5. Data Inconsistencies

**Symptoms:**
- Incorrect leave balances
- Missing employee records
- Duplicate entries

**Data Validation:**

1. **Employee Master Data**
   ```
   Check: Employee exists and is active
   Verify: UAN numbers are correct
   Confirm: Unit assignments are valid
   ```

2. **Leave Balance Verification**
   ```
   Compare: Current vs. expected balances
   Review: Recent adjustments history
   Validate: Attendance records match
   ```

3. **Attendance Data**
   ```
   Ensure: Attendance is uploaded for the period
   Check: No duplicate attendance records
   Verify: Leave applications are processed
   ```

### 6. Preview Dialog Issues

**Symptoms:**
- Preview won't open
- Incorrect data in preview
- Can't confirm changes

**Solutions:**

✅ **Selection Problems**
- Ensure at least one employee is selected
- Check if employees have adjustments needed
- Verify selection filters are correct

✅ **Dialog Not Opening**
- Check browser popup blockers
- Try different browser
- Refresh page and retry

✅ **Confirmation Fails**
- Verify all required fields are filled
- Check adjustment reasons are provided
- Ensure proper permissions

### 7. Report Generation Failures

**Symptoms:**
- Reports won't generate
- Empty report files
- Download failures

**Report Troubleshooting:**

1. **Data Requirements**
   - Ensure reconciliation is completed
   - Check if data exists for selected period
   - Verify unit has processed employees

2. **Technical Issues**
   - Allow pop-ups in browser
   - Check download folder permissions
   - Try different file formats

3. **Timing Issues**
   - Wait for reconciliation to complete
   - Don't generate reports during processing
   - Allow time for large datasets

---

## 🔧 Advanced Troubleshooting

### System Logs Analysis

**Access Logs:**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for error messages
4. Share with support team

**Common Log Errors:**
- `PostgreSQL error`: Database connection issues
- `RLS policy violation`: Permission problems
- `Timeout error`: Performance issues
- `Invalid data`: Data validation failures

### Database Connectivity

**Check Connection:**
```
1. Verify internet connection
2. Check Supabase service status
3. Try accessing other system features
4. Contact IT if persistent
```

**Connection Issues:**
- Firewall blocking requests
- Network proxy problems
- DNS resolution issues
- Service maintenance

### Browser-Specific Issues

**Chrome/Edge:**
- Clear site data: Settings → Privacy → Clear browsing data
- Disable extensions temporarily
- Try incognito mode

**Firefox:**
- Clear cache and cookies
- Disable tracking protection
- Check privacy settings

**Safari:**
- Enable JavaScript
- Clear website data
- Check content blockers

---

## 📞 Getting Help

### Before Contacting Support

**Gather Information:**
- [ ] Current browser and version
- [ ] Error messages (screenshots helpful)
- [ ] Steps that led to the issue
- [ ] User role and permissions
- [ ] Time when issue occurred

### Self-Help Resources

1. **Documentation**
   - Full User Manual
   - Quick Reference Guide
   - Video tutorials

2. **System Status**
   - Check system status page
   - Review maintenance notifications
   - Verify service availability

3. **Community Support**
   - Internal FAQ
   - User forums
   - Knowledge base

### Contact Information

**IT Support:**
- Email: support@yourcompany.com
- Phone: Extension 1234
- Ticket System: [Support Portal URL]

**Emergency Support:**
- On-call administrator
- Emergency hotline
- System status updates

---

## 🔄 Preventive Measures

### Regular Maintenance

**Monthly Tasks:**
- [ ] Verify all employees are active
- [ ] Check attendance data completeness
- [ ] Review leave balance accuracy
- [ ] Update employee master data

**Weekly Tasks:**
- [ ] Monitor system performance
- [ ] Review error logs
- [ ] Check user access permissions
- [ ] Backup important data

### Best Practices

1. **Data Entry**
   - Always provide clear adjustment reasons
   - Double-check employee selections
   - Verify data before applying changes

2. **System Usage**
   - Process during off-peak hours
   - Use filters to limit data load
   - Review changes before confirming

3. **User Training**
   - Regular training sessions
   - Updated documentation
   - Best practice sharing

---

*For immediate assistance, contact your system administrator*
*Last Updated: [Current Date] | Version: 3.0*
