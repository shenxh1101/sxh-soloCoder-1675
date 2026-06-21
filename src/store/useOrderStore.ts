import { create } from 'zustand';
import dayjs from 'dayjs';
import Taro from '@tarojs/taro';
import type { RepairOrder, OrderStatus, RepairType, StatisticsData, TypeStatistic, WorkerStatistic, WorkerInfo } from '@/types';
import { ordersData } from '@/data/orders';
import { workersData } from '@/data/workers';
import { REPAIR_TYPE_OPTIONS } from '@/utils/constants';
import { generateOrderNo } from '@/utils/format';

const STORAGE_KEY = 'repair_orders_v1';
const STORAGE_INIT_FLAG = 'repair_orders_initialized_v1';

const loadOrdersFromStorage = (): RepairOrder[] => {
  try {
    const initialized = Taro.getStorageSync(STORAGE_INIT_FLAG);
    if (initialized) {
      const data = Taro.getStorageSync(STORAGE_KEY);
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('[OrderStore] 从本地存储加载工单:', data.length, '条');
        return data;
      }
    }
    console.log('[OrderStore] 使用初始示例数据');
    return ordersData;
  } catch (e) {
    console.error('[OrderStore] 读取本地存储失败:', e);
    return ordersData;
  }
};

const saveOrdersToStorage = (orders: RepairOrder[]) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, orders);
    Taro.setStorageSync(STORAGE_INIT_FLAG, true);
  } catch (e) {
    console.error('[OrderStore] 保存本地存储失败:', e);
  }
};

interface OrderState {
  orders: RepairOrder[];
  getOrderById: (id: string) => RepairOrder | undefined;
  getOrdersByStatus: (status?: OrderStatus) => RepairOrder[];
  getOrdersByWorker: (workerId: string) => RepairOrder[];
  getOrdersByOwner: (phone: string) => RepairOrder[];
  getStatistics: () => StatisticsData;
  getWorkerLoad: () => Array<WorkerInfo & { pendingCount: number; processingCount: number; completedCount: number; totalLoad: number }>;
  getTimeoutOrders: (timeoutMinutes?: { pending: number; processing: number }) => {
    pendingTimeout: RepairOrder[];
    processingTimeout: RepairOrder[];
  };
  searchOrders: (filters: {
    type?: RepairType;
    status?: OrderStatus;
    building?: string;
    workerName?: string;
    keyword?: string;
  }) => RepairOrder[];
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
  resetOrders: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: loadOrdersFromStorage(),

  getOrderById: (id) => get().orders.find((o) => o.id === id),

  getOrdersByStatus: (status) => {
    const all = get().orders;
    if (!status) return all;
    return all.filter((o) => o.status === status);
  },

  getOrdersByWorker: (workerId) => get().orders.filter((o) => o.workerId === workerId),

  getOrdersByOwner: (phone) => get().orders.filter((o) => o.ownerInfo.phone === phone),

  getStatistics: (): StatisticsData => {
    const { orders } = get();
    const pending = orders.filter((o) => o.status === 'pending').length;
    const processing = orders.filter((o) => ['assigned', 'processing'].includes(o.status)).length;
    const completed = orders.filter((o) => o.status === 'completed').length;

    const completedOrders = orders.filter((o) => o.status === 'completed');

    const ordersWithResponse = orders.filter((o) =>
      ['assigned', 'processing', 'completed'].includes(o.status) && o.responseMinutes !== undefined,
    );
    const responseTimes = ordersWithResponse.map((o) => o.responseMinutes as number);
    const avgResponseMinutes = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    const processTimes = completedOrders
      .filter((o) => o.processMinutes !== undefined)
      .map((o) => o.processMinutes as number);
    const avgProcessMinutes = processTimes.length > 0
      ? Math.round(processTimes.reduce((a, b) => a + b, 0) / processTimes.length)
      : 0;

    const typeStatistics: TypeStatistic[] = REPAIR_TYPE_OPTIONS.map((typeOpt) => {
      const typeOrders = orders.filter((o) => o.type === typeOpt.value);
      const typeCompleted = typeOrders.filter((o) => o.status === 'completed');
      const typeOrdersWithResponse = typeOrders.filter((o) =>
        ['assigned', 'processing', 'completed'].includes(o.status) && o.responseMinutes !== undefined,
      );
      const typeResponseTimes = typeOrdersWithResponse.map((o) => o.responseMinutes as number);
      const typeProcessTimes = typeCompleted
        .filter((o) => o.processMinutes !== undefined)
        .map((o) => o.processMinutes as number);

      return {
        type: typeOpt.value,
        typeName: typeOpt.label,
        count: typeOrders.length,
        avgResponseMinutes: typeResponseTimes.length > 0
          ? Math.round(typeResponseTimes.reduce((a, b) => a + b, 0) / typeResponseTimes.length)
          : 0,
        avgProcessMinutes: typeProcessTimes.length > 0
          ? Math.round(typeProcessTimes.reduce((a, b) => a + b, 0) / typeProcessTimes.length)
          : 0,
      };
    }).filter((t) => t.count > 0 || REPAIR_TYPE_OPTIONS.some((r) => r.value === t.type));

    const workerStatistics: WorkerStatistic[] = workersData.map((worker) => {
      const workerOrders = orders.filter((o) => o.workerId === worker.id);
      const workerCompleted = workerOrders.filter((o) => o.status === 'completed');
      const workerProcessTimes = workerCompleted
        .filter((o) => o.processMinutes !== undefined)
        .map((o) => o.processMinutes as number);

      return {
        workerId: worker.id,
        workerName: worker.name,
        totalCount: workerOrders.length,
        completedCount: workerCompleted.length,
        avgProcessMinutes: workerProcessTimes.length > 0
          ? Math.round(workerProcessTimes.reduce((a, b) => a + b, 0) / workerProcessTimes.length)
          : 0,
      };
    }).filter((w) => w.totalCount > 0);

    if (workerStatistics.length === 0) {
      workerStatistics.push(...workersData.slice(0, 3).map((w) => ({
        workerId: w.id,
        workerName: w.name,
        totalCount: 0,
        completedCount: 0,
        avgProcessMinutes: 0,
      })));
    }

    return {
      totalOrders: orders.length,
      pendingOrders: pending,
      processingOrders: processing,
      completedOrders: completed,
      avgResponseMinutes,
      avgProcessMinutes,
      typeStatistics,
      workerStatistics,
    };
  },

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
    const newOrders = [newOrder, ...get().orders];
    set({ orders: newOrders });
    saveOrdersToStorage(newOrders);
    console.log('[OrderStore] 创建报修单:', newOrder.orderNo);
    return newOrder;
  },

  assignOrder: (orderId, workerId) => {
    const worker = workersData.find((w) => w.id === workerId);
    if (!worker) return;
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const newOrders = get().orders.map((o) => {
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
    });
    set({ orders: newOrders });
    saveOrdersToStorage(newOrders);
    console.log('[OrderStore] 派单成功:', orderId, '->', worker.name);
  },

  startOrder: (orderId) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const newOrders = get().orders.map((o) => {
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
    });
    set({ orders: newOrders });
    saveOrdersToStorage(newOrders);
    console.log('[OrderStore] 开始处理:', orderId);
  },

  completeOrder: (orderId, resultImages, resultDescription) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const newOrders = get().orders.map((o) => {
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
    });
    set({ orders: newOrders });
    saveOrdersToStorage(newOrders);
    console.log('[OrderStore] 完成工单:', orderId);
  },

  rateOrder: (orderId, rating, ratingComment) => {
    const newOrders = get().orders.map((o) => {
      if (o.id !== orderId) return o;
      return { ...o, rating, ratingComment };
    });
    set({ orders: newOrders });
    saveOrdersToStorage(newOrders);
    console.log('[OrderStore] 评价工单:', orderId, rating, '星');
  },

  cancelOrder: (orderId) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const newOrders = get().orders.map((o) => {
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
    });
    set({ orders: newOrders });
    saveOrdersToStorage(newOrders);
    console.log('[OrderStore] 取消工单:', orderId);
  },

  getWorkerLoad: () => {
    const { orders } = get();
    return workersData.map((worker) => {
      const workerOrders = orders.filter((o) => o.workerId === worker.id);
      const pendingCount = workerOrders.filter((o) => o.status === 'assigned').length;
      const processingCount = workerOrders.filter((o) => o.status === 'processing').length;
      const completedCount = workerOrders.filter((o) => o.status === 'completed').length;
      const totalLoad = pendingCount + processingCount;
      return {
        ...worker,
        pendingCount,
        processingCount,
        completedCount,
        totalLoad,
      };
    });
  },

  getTimeoutOrders: (timeoutMinutes = { pending: 60, processing: 240 }) => {
    const { orders } = get();
    const now = dayjs();
    const pendingTimeout = orders.filter((o) => {
      if (o.status !== 'pending') return false;
      const diffMinutes = now.diff(dayjs(o.createTime), 'minute');
      return diffMinutes > timeoutMinutes.pending;
    }).sort((a, b) => dayjs(a.createTime).valueOf() - dayjs(b.createTime).valueOf());

    const processingTimeout = orders.filter((o) => {
      if (o.status !== 'processing' || !o.startTime) return false;
      const diffMinutes = now.diff(dayjs(o.startTime), 'minute');
      return diffMinutes > timeoutMinutes.processing;
    }).sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());

    return { pendingTimeout, processingTimeout };
  },

  searchOrders: (filters) => {
    let { orders } = get();
    if (filters.type) {
      orders = orders.filter((o) => o.type === filters.type);
    }
    if (filters.status) {
      orders = orders.filter((o) => o.status === filters.status);
    }
    if (filters.building) {
      orders = orders.filter((o) => o.ownerInfo.building.includes(filters.building!));
    }
    if (filters.workerName) {
      orders = orders.filter((o) => o.workerName?.includes(filters.workerName!));
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      orders = orders.filter((o) =>
        o.title.toLowerCase().includes(kw) ||
        o.description.toLowerCase().includes(kw) ||
        o.orderNo.toLowerCase().includes(kw) ||
        o.ownerInfo.name.toLowerCase().includes(kw) ||
        o.ownerInfo.room.toLowerCase().includes(kw),
      );
    }
    return orders.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  },

  resetOrders: () => {
    set({ orders: ordersData });
    saveOrdersToStorage(ordersData);
    console.log('[OrderStore] 已重置为初始数据');
  },
}));
