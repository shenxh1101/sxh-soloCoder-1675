export type UserRole = 'owner' | 'customer_service' | 'worker' | 'manager';

export type RepairType = 'water_electric' | 'access_control' | 'elevator' | 'public_facility' | 'other';

export type OrderStatus = 'pending' | 'assigned' | 'processing' | 'completed' | 'cancelled';

export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  building?: string;
  room?: string;
}

export interface WorkerInfo {
  id: string;
  name: string;
  phone: string;
  skills: RepairType[];
  pendingCount: number;
  processingCount: number;
  completedToday: number;
  avatar?: string;
}

export interface TimelineItem {
  status: OrderStatus;
  time: string;
  description: string;
  operatorName?: string;
}

export interface RepairOrder {
  id: string;
  orderNo: string;
  title: string;
  description: string;
  type: RepairType;
  status: OrderStatus;
  images: string[];
  resultImages: string[];
  resultDescription?: string;
  ownerInfo: {
    name: string;
    phone: string;
    building: string;
    room: string;
  };
  workerId?: string;
  workerName?: string;
  workerPhone?: string;
  createTime: string;
  assignTime?: string;
  startTime?: string;
  completeTime?: string;
  cancelTime?: string;
  responseMinutes?: number;
  processMinutes?: number;
  rating?: number;
  ratingComment?: string;
  timeline: TimelineItem[];
}

export interface TypeStatistic {
  type: RepairType;
  typeName: string;
  count: number;
  avgResponseMinutes: number;
  avgProcessMinutes: number;
}

export interface WorkerStatistic {
  workerId: string;
  workerName: string;
  totalCount: number;
  completedCount: number;
  avgProcessMinutes: number;
}

export interface StatisticsData {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  avgResponseMinutes: number;
  avgProcessMinutes: number;
  typeStatistics: TypeStatistic[];
  workerStatistics: WorkerStatistic[];
}
