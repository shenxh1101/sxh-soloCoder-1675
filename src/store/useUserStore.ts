import { create } from 'zustand';
import type { UserInfo, UserRole } from '@/types';

interface UserState {
  userInfo: UserInfo;
  setUserInfo: (info: Partial<UserInfo>) => void;
  setRole: (role: UserRole) => void;
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: {
    id: 'u001',
    name: '张先生',
    phone: '13900139001',
    role: 'owner',
    avatar: 'https://picsum.photos/id/1027/200/200',
    building: '3栋',
    room: '1502',
  },
  setUserInfo: (info) => set((state) => ({ userInfo: { ...state.userInfo, ...info } })),
  setRole: (role) => set((state) => ({
    userInfo: {
      ...state.userInfo,
      role,
      name: role === 'owner' ? '张先生' : role === 'customer_service' ? '李客服' : role === 'worker' ? '张师傅' : '王经理',
      phone: role === 'owner' ? '13900139001' : role === 'customer_service' ? '13800138100' : role === 'worker' ? '13800138001' : '13800138200',
    },
  })),
}));
