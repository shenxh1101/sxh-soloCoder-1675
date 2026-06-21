import type { RepairType, OrderStatus, UserRole } from '@/types';

export const REPAIR_TYPE_OPTIONS: { value: RepairType; label: string; color: string }[] = [
  { value: 'water_electric', label: '水电维修', color: '#1677FF' },
  { value: 'access_control', label: '门禁系统', color: '#52C41A' },
  { value: 'elevator', label: '电梯故障', color: '#FAAD14' },
  { value: 'public_facility', label: '公共设施', color: '#722ED1' },
  { value: 'other', label: '其他问题', color: '#8C8C8C' },
];

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string; bgColor: string; textColor: string }[] = [
  { value: 'pending', label: '待派单', bgColor: '#FFF7E6', textColor: '#D46B08' },
  { value: 'assigned', label: '已派单', bgColor: '#E6F4FF', textColor: '#0958D9' },
  { value: 'processing', label: '处理中', bgColor: '#E6F4FF', textColor: '#0958D9' },
  { value: 'completed', label: '已完成', bgColor: '#F6FFED', textColor: '#389E0D' },
  { value: 'cancelled', label: '已取消', bgColor: '#F5F5F5', textColor: '#595959' },
];

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'owner', label: '业主' },
  { value: 'customer_service', label: '客服' },
  { value: 'worker', label: '维修师傅' },
  { value: 'manager', label: '管理员' },
];

export const getRepairTypeLabel = (type: RepairType): string => {
  const found = REPAIR_TYPE_OPTIONS.find(item => item.value === type);
  return found ? found.label : '未知';
};

export const getOrderStatusLabel = (status: OrderStatus): string => {
  const found = ORDER_STATUS_OPTIONS.find(item => item.value === status);
  return found ? found.label : '未知';
};

export const getOrderStatusStyle = (status: OrderStatus): { bgColor: string; textColor: string } => {
  const found = ORDER_STATUS_OPTIONS.find(item => item.value === status);
  return found ? { bgColor: found.bgColor, textColor: found.textColor } : { bgColor: '#F5F5F5', textColor: '#595959' };
};

export const getUserRoleLabel = (role: UserRole): string => {
  const found = USER_ROLE_OPTIONS.find(item => item.value === role);
  return found ? found.label : '未知';
};
