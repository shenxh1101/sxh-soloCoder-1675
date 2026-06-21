import type { StatisticsData } from '@/types';

export const statisticsData: StatisticsData = {
  totalOrders: 156,
  pendingOrders: 4,
  processingOrders: 2,
  completedOrders: 148,
  avgResponseMinutes: 18,
  avgProcessMinutes: 52,
  typeStatistics: [
    { type: 'water_electric', typeName: '水电维修', count: 68, avgResponseMinutes: 15, avgProcessMinutes: 45 },
    { type: 'access_control', typeName: '门禁系统', count: 24, avgResponseMinutes: 12, avgProcessMinutes: 38 },
    { type: 'elevator', typeName: '电梯故障', count: 18, avgResponseMinutes: 10, avgProcessMinutes: 85 },
    { type: 'public_facility', typeName: '公共设施', count: 32, avgResponseMinutes: 25, avgProcessMinutes: 65 },
    { type: 'other', typeName: '其他问题', count: 14, avgResponseMinutes: 30, avgProcessMinutes: 40 },
  ],
  workerStatistics: [
    { workerId: 'w001', workerName: '张师傅', totalCount: 35, completedCount: 34, avgProcessMinutes: 42 },
    { workerId: 'w002', workerName: '李师傅', totalCount: 42, completedCount: 40, avgProcessMinutes: 48 },
    { workerId: 'w003', workerName: '王师傅', totalCount: 28, completedCount: 27, avgProcessMinutes: 55 },
    { workerId: 'w004', workerName: '陈师傅', totalCount: 30, completedCount: 29, avgProcessMinutes: 58 },
    { workerId: 'w005', workerName: '赵师傅', totalCount: 21, completedCount: 18, avgProcessMinutes: 62 },
  ],
};
