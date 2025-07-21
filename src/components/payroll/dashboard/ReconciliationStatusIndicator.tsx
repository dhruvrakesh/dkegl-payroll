
import React from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReconciliationStatusIndicatorProps {
  status?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ReconciliationStatusIndicator: React.FC<ReconciliationStatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = true
}) => {
  const getStatusConfig = () => {
    if (status === true) {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'Completed',
        variant: 'default' as const
      };
    } else if (status === false) {
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: 'Pending',
        variant: 'destructive' as const
      };
    } else {
      return {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        label: 'Unknown',
        variant: 'secondary' as const
      };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (showLabel) {
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={sizeClasses[size]} />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className={`rounded-full p-1 ${config.bgColor}`}>
      <Icon className={`${sizeClasses[size]} ${config.color}`} />
    </div>
  );
};
