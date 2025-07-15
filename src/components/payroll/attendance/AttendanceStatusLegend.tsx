
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, UserCheck, Coffee, Plane, Heart, XCircle } from 'lucide-react';

export const AttendanceStatusLegend = () => {
  const statusConfig = [
    {
      status: 'PRESENT',
      label: 'Present',
      color: 'bg-green-100 border-green-300 text-green-800',
      icon: UserCheck,
      description: 'Employee was present and worked'
    },
    {
      status: 'WEEKLY_OFF',
      label: 'Weekly Off',
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      icon: Coffee,
      description: 'Scheduled weekly off day'
    },
    {
      status: 'CASUAL_LEAVE',
      label: 'Casual Leave',
      color: 'bg-purple-100 border-purple-300 text-purple-800',
      icon: Plane,
      description: 'Casual leave taken'
    },
    {
      status: 'EARNED_LEAVE',
      label: 'Earned Leave',
      color: 'bg-amber-100 border-amber-300 text-amber-800',
      icon: Heart,
      description: 'Earned leave taken'
    },
    {
      status: 'UNPAID_LEAVE',
      label: 'Unpaid Leave',
      color: 'bg-red-100 border-red-300 text-red-800',
      icon: XCircle,
      description: 'Unpaid leave taken'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4" />
          Attendance Status Legend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {statusConfig.map(({ status, label, color, icon: Icon, description }) => (
          <div key={status} className="flex items-center gap-3">
            <Badge className={`${color} border flex items-center gap-1 min-w-0`}>
              <Icon className="w-3 h-3" />
              {label}
            </Badge>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
