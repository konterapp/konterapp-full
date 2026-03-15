import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  message: string;
  className?: string;
}

const variantConfig = {
  success: {
    container: 'bg-green-50 border-green-200',
    text: 'text-green-700',
    icon: 'text-green-600',
    Icon: CheckCircle,
  },
  error: {
    container: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600',
    Icon: AlertCircle,
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-700',
    icon: 'text-yellow-600',
    Icon: AlertTriangle,
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    Icon: Info,
  },
};

export default function Alert({ variant, message, className = '' }: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.Icon;

  return (
    <div className={`p-4 border rounded-lg flex items-center gap-3 ${config.container} ${className}`}>
      <Icon className={`w-5 h-5 ${config.icon}`} />
      <span className={config.text}>{message}</span>
    </div>
  );
}
