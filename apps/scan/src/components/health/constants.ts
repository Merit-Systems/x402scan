import { Circle, CircleAlert, CircleCheck, CircleX } from 'lucide-react';
import { HealthStatus } from './types';

export const TOTAL_REQUESTS_THRESHOLD = 10;

export const HEALTH_THRESHOLDS = {
  healthy: {
    uptime: 95,
    errorRate: 5,
    serverErrorRate: 1,
  },
  unhealthy: {
    uptime: 85,
    errorRate: 15,
    serverErrorRate: 5,
  },
};

export const HEALTH_CONFIG = {
  [HealthStatus.Healthy]: {
    Icon: CircleCheck,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    label: 'Healthy',
  },
  [HealthStatus.Degraded]: {
    Icon: CircleAlert,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    label: 'Degraded',
  },
  [HealthStatus.Unhealthy]: {
    Icon: CircleX,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'Unhealthy',
  },
  [HealthStatus.Unknown]: {
    Icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    borderColor: 'border-gray-400/20',
    label: 'Unknown',
  },
} as const;
