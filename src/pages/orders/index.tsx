import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import type { OrderStatus } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useOrderStore } from '@/store/useOrderStore';
import { ORDER_STATUS_OPTIONS } from '@/utils/constants';
import OrderCard from '@/components/OrderCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

interface FilterTab {
  value: OrderStatus | 'all';
  label: string;
}

const OrdersPage: React.FC = () => {
  const { userInfo } = useUserStore();
  const { orders, getOrdersByStatus, getOrdersByWorker, getOrdersByOwner } = useOrderStore();
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');

  const filterTabs: FilterTab[] = useMemo(() => {
    const tabs: FilterTab[] = [{ value: 'all', label: '全部' }];
    ORDER_STATUS_OPTIONS.forEach((opt) => {
      if (userInfo.role === 'owner' && opt.value === 'pending') return;
      if (userInfo.role === 'worker' && (opt.value === 'pending')) return;
      tabs.push({ value: opt.value, label: opt.label });
    });
    return tabs;
  }, [userInfo.role]);

  const filteredOrders = useMemo(() => {
    let list = orders;

    if (userInfo.role === 'owner') {
      list = getOrdersByOwner(userInfo.phone);
    } else if (userInfo.role === 'worker') {
      list = getOrdersByWorker('w001');
    }

    if (activeFilter !== 'all') {
      list = list.filter((o) => o.status === activeFilter);
    }

    return list.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  }, [userInfo, activeFilter, orders, getOrdersByOwner, getOrdersByWorker]);

  const handleRefresh = () => {
    setTimeout(() => Taro.stopPullDownRefresh(), 1000);
  };

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      onRefresh={handleRefresh}
    >
      <View className={styles.filterBar}>
        {filterTabs.map((tab) => {
          const count = tab.value === 'all'
            ? filteredOrders.length
            : getOrdersByStatus(tab.value as OrderStatus).length;
          return (
            <View
              key={tab.value}
              className={classnames(
                styles.filterItem,
                activeFilter === tab.value && styles.filterItemActive,
              )}
              onClick={() => setActiveFilter(tab.value)}
            >
              <Text>{tab.label}{count > 0 ? `(${count})` : ''}</Text>
            </View>
          );
        })}
      </View>

      <View className={styles.orderList}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)
        ) : (
          <EmptyState
            title="暂无工单"
            description={activeFilter === 'all' ? '还没有任何工单记录' : '当前状态下没有工单'}
          />
        )}
      </View>
    </ScrollView>
  );
};

export default OrdersPage;
