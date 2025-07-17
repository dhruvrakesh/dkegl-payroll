import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator } from 'lucide-react';

const PanchkulaTestCalculation: React.FC = () => {
  const [result, setResult] = useState<any>(null);

  const calculateSandeepExample = () => {
    // Sandeep's data as per Panchkula example
    const basicSalary = 13500;
    const hra = 7500;
    const totalSalary = basicSalary + hra; // 21000

    // June attendance as per example
    const presentDays = 21;
    const weeklyOffs = 5; // Sundays
    const casualLeave = 1;
    const totalPaidDays = presentDays + weeklyOffs + casualLeave; // 27 days

    // Panchkula 30-day calculation
    const basicEarned = (basicSalary / 30) * totalPaidDays; // 13500/30*27 = 12150
    const hraEarned = (hra / 30) * totalPaidDays; // 7500/30*27 = 6750
    const grossSalary = basicEarned + hraEarned; // 18900

    // Deductions as per corrected rates
    const epfDeduction = basicEarned * 0.12; // 12% on basic = 1458
    const esiDeduction = grossSalary * 0.0075; // 0.75% on gross = 141.75
    const lwfDeduction = 31; // Fixed

    const totalDeductions = epfDeduction + esiDeduction + lwfDeduction;
    const netSalary = grossSalary - totalDeductions;

    setResult({
      basicSalary,
      hra,
      totalSalary,
      presentDays,
      weeklyOffs,
      casualLeave,
      totalPaidDays,
      basicEarned: Math.round(basicEarned),
      hraEarned: Math.round(hraEarned),
      grossSalary: Math.round(grossSalary),
      epfDeduction: Math.round(epfDeduction),
      esiDeduction: Math.round(esiDeduction * 100) / 100, // Round to 2 decimals
      lwfDeduction,
      totalDeductions: Math.round(totalDeductions),
      netSalary: Math.round(netSalary)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Panchkula Method Verification - Sandeep Example
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Given Data (as per requirement):</h4>
            <ul className="text-sm space-y-1">
              <li>• Basic Salary: ₹13,500</li>
              <li>• HRA: ₹7,500</li>
              <li>• Total: ₹21,000</li>
              <li>• Present Days: 21</li>
              <li>• Weekly Offs (Sundays): 5</li>
              <li>• Casual Leave: 1</li>
              <li>• Total Paid Days: 27</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Panchkula Method Rules:</h4>
            <ul className="text-sm space-y-1">
              <li>• 30-day uniform base calculation</li>
              <li>• Sundays are paid weekly offs</li>
              <li>• EPF: 12% on basic salary only</li>
              <li>• ESI: 0.75% on gross salary</li>
              <li>• LWF: ₹31 fixed</li>
              <li>• CL: 1 per month accrual</li>
            </ul>
          </div>
        </div>

        <Button onClick={calculateSandeepExample} className="w-full">
          Calculate Sandeep's Salary (Panchkula Method)
        </Button>

        {result && (
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-lg">Calculation Results:</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Earnings */}
              <div className="border rounded-lg p-4">
                <h5 className="font-medium text-green-600 mb-2">EARNINGS</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Basic (₹{result.basicSalary}/30*{result.totalPaidDays}):</span>
                    <span className="font-medium">₹{result.basicEarned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HRA (₹{result.hra}/30*{result.totalPaidDays}):</span>
                    <span className="font-medium">₹{result.hraEarned}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>TOTAL SALARY:</span>
                    <span>₹{result.grossSalary}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border rounded-lg p-4">
                <h5 className="font-medium text-red-600 mb-2">DEDUCTIONS</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>EPF (Basic × 12%):</span>
                    <span className="font-medium">₹{result.epfDeduction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ESI (Gross × 0.75%):</span>
                    <span className="font-medium">₹{result.esiDeduction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LWF (Fixed):</span>
                    <span className="font-medium">₹{result.lwfDeduction}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total Deductions:</span>
                    <span>₹{result.totalDeductions}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="border rounded-lg p-4">
                <h5 className="font-medium text-blue-600 mb-2">NET SALARY</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Gross Salary:</span>
                    <span>₹{result.grossSalary}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>(-) Deductions:</span>
                    <span>₹{result.totalDeductions}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold text-lg">
                    <span>Net Credited:</span>
                    <span className="text-green-600">₹{result.netSalary}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-medium text-green-800 mb-2">✅ Verification Against Expected:</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Badge variant={result.basicEarned === 12150 ? "default" : "destructive"}>
                    Basic: ₹{result.basicEarned} {result.basicEarned === 12150 ? "✓" : "✗"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Expected: ₹12,150</p>
                </div>
                <div>
                  <Badge variant={result.hraEarned === 6750 ? "default" : "destructive"}>
                    HRA: ₹{result.hraEarned} {result.hraEarned === 6750 ? "✓" : "✗"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Expected: ₹6,750</p>
                </div>
                <div>
                  <Badge variant={result.grossSalary === 18900 ? "default" : "destructive"}>
                    Gross: ₹{result.grossSalary} {result.grossSalary === 18900 ? "✓" : "✗"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Expected: ₹18,900</p>
                </div>
                <div>
                  <Badge variant={Math.abs(result.netSalary - 17269) <= 10 ? "default" : "destructive"}>
                    Net: ₹{result.netSalary} {Math.abs(result.netSalary - 17269) <= 10 ? "✓" : "✗"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Expected: ₹17,269</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-800 mb-2">📊 Attendance Breakdown:</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{result.presentDays}</p>
                  <p className="text-xs">Present Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{result.weeklyOffs}</p>
                  <p className="text-xs">Weekly Offs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{result.casualLeave}</p>
                  <p className="text-xs">Casual Leave</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{result.totalPaidDays}</p>
                  <p className="text-xs">Total Paid Days</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PanchkulaTestCalculation;