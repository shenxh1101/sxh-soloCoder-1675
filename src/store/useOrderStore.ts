import { create } from 'zustand';
import dayjs from 'dayjs';
import type { RepairOrder, OrderStatus, RepairType } from '@/types';
import { ordersData } from '@/data/orders';
import { workersData } from '@/data/workers';
import { generateOrderNo } from '@/utils/format';

interface OrderState {
  orders: RepairOrder[];
  getOrderById: (id: string) => RepairOrder | undefined;
  getOrdersByStatus: (status?: OrderStatus) => RepairOrder[];
  getOrdersByWorker: (workerId: string) => RepairOrder[];
  getOrdersByOwner: (phone: string) => RepairOrder[];
  createOrder: (data: {
    title: string;
    description: string;
    type: RepairType;
    images: string[];
    ownerInfo: { name: string; phone: string; building: string; room: string };
  }) => RepairOrder;
  assignOrder: (orderId: string, workerId: string) => void;
  startOrder: (orderId: string) => void;
  completeOrder: (orderId: string, resultImages: string[], resultDescription: string) => void;
  rateOrder: (orderId: string, rating: number, ratingComment: string) => void;
  cancelOrder: (orderId: string) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: ordersData,

  getOrderById: (id) => get().orders.find((o) => o.id === id),

  getOrdersByStatus: (status) => {
    const all = get().orders;
    if (!status) return all;
    return all.filter((o) => o.status === status);
  },

  getOrdersByWorker: (workerId) => get().orders.filter((o) => o.workerId === workerId),

  getOrdersByOwner: (phone) => get().orders.filter((o) => o.ownerInfo.phone === phone),

  createOrder: (data) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const newOrder: RepairOrder = {
      id: `o${Date.now()}`,
      orderNo: generateOrderNo(),
      title: data.title,
      description: data.description,
      type: data.type,
      status: 'pending',
      images: data.images,
      resultImages: [],
      ownerInfo: data.ownerInfo,
      createTime: now,
      timeline: [
        {
          status: 'pending',
          time: now,
          description: '业主提交报修单',
          operatorName: data.ownerInfo.name,
        },
      ],
    };
    set((state) => ({ orders: [newOrder, ...state.orders] }));
    console.log('[OrderStore] 创建报修单:', newOrder.orderNo);
    return newOrder;
  },

  assignOrder: (orderId, workerId) => {
    const worker = workersData.find((w) => w.id === workerId);
    if (!worker) return;
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'assigned' as OrderStatus,
          workerId: worker.id,
          workerName: worker.name,
          workerPhone: worker.phone,
          assignTime: now,
          responseMinutes: dayjs(now).diff(dayjs(o.createTime), 'minute'),
          timeline: [
            ...o.timeline,
            {
              status: 'assigned' as OrderStatus,
              time: now,
              description: `客服派单给${worker.name}`,
              operatorName: '客服',
            },
          ],
        };
      }),
    }));
    console.log('[OrderStore] 派单成功:', orderId, '->', worker.name);
  },

  startOrder: (orderId) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'processing' as OrderStatus,
          startTime: now,
          timeline: [
            ...o.timeline,
            {
              status: 'processing' as OrderStatus,
              time: now,
              description: `${o.workerName}开始处理`,
              operatorName: o.workerName,
            },
          ],
        };
      }),
    }));
    console.log('[OrderStore] 开始处理:', orderId);
  },

  completeOrder: (orderId, resultImages, resultDescription) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id !== orderId) return o;
        const processMinutes = o.startTime ? dayjs(now).diff(dayjs(o.startTime), 'minute') : undefined;
        return {
          ...o,
          status: 'completed' as OrderStatus,
          resultImages,
          resultDescription,
          completeTime: now,
          processMinutes,
          timeline: [
            ...o.timeline,
            {
              status: 'completed' as OrderStatus,
              time: now,
              description: '维修完成',
              operatorName: o.workerName,
            },
          ],
        };
      }),
    }));
    console.log('[OrderStore] 完成工单:', orderId);
  },

  rateOrder: (orderId, rating, ratingComment) => {
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id !== orderId) return o;
        return { ...o, rating, ratingComment };
      }),
    }));
    console.log('[OrderStore] 评价工单:', orderId, rating, '星');
  },

  cancelOrder: (orderId) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'cancelled' as OrderStatus,
          cancelTime: now,
          timeline: [
            ...o.timeline,
            {
              status: 'cancelled' as OrderStatus,
              time: now,
              description: '工单已取消',
              operatorName: o.ownerInfo.name,
            },
          ],
        };
      }),
    }));
    console.log('[OrderStore] 取消工单:', orderId);
  },
}));
