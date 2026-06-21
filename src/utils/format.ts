import dayjs from 'dayjs';

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY-MM-DD');
};

export const formatTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('HH:mm');
};

export const formatDuration = (minutes: number | undefined): string => {
  if (minutes === undefined || minutes === null) return '-';
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours > 0 ? `${days}天${remainHours}小时` : `${days}天`;
};

export const formatPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

export const generateOrderNo = (): string => {
  const now = dayjs();
  const timestamp = now.format('YYYYMMDDHHmmss');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BX${timestamp}${random}`;
};

export const getRelativeTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  const now = dayjs();
  const target = dayjs(dateStr);
  const diffMinutes = now.diff(target, 'minute');
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}天前`;
  return formatDate(dateStr);
};
