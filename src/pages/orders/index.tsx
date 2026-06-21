import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import type { OrderStatus, RepairType } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useOrderStore } from '@/store/useOrderStore';
import { ORDER_STATUS_OPTIONS, REPAIR_TYPE_OPTIONS } from '@/utils/constants';
import OrderCard from '@/components/OrderCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

interface FilterTab {
  value: OrderStatus | 'all';
  label: string;
}

const OrdersPage: React.FC = () => {
  const { userInfo } = useUserStore();
  const { orders, searchOrders, getOrdersByOwner, getOrdersByWorker } = useOrderStore();
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<RepairType | ''>('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterWorker, setFilterWorker] = useState('');

  const isStaff = userInfo.role === 'customer_service' || userInfo.role === 'manager';

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

    if (isStaff && (searchKeyword || filterType || filterBuilding || filterWorker)) {
      list = searchOrders({
        type: filterType || undefined,
        keyword: searchKeyword || undefined,
        building: filterBuilding || undefined,
        workerName: filterWorker || undefined,
      });
      if (activeFilter !== 'all') {
        list = list.filter((o) => o.status === activeFilter);
      }
      if (userInfo.role === 'worker') {
        list = list.filter((o) => o.workerId === 'w001');
      }
    }

    return list.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  }, [userInfo, activeFilter, orders, searchKeyword, filterType, filterBuilding, filterWorker, isStaff, searchOrders, getOrdersByOwner, getOrdersByWorker]);

  const hasActiveFilters = isStaff && (filterType || filterBuilding || filterWorker || searchKeyword);

  const resetFilters = () => {
    setFilterType('');
    setFilterBuilding('');
    setFilterWorker('');
    setSearchKeyword('');
  };

  const buildings = ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋'];
  const workers = ['李师傅', '王师傅', '张师傅', '陈师傅', '刘师傅'];

  return (
    <ScrollView className={styles.page} scrollY refresherEnabled onRefresh={() => setTimeout(() => Taro.stopPullDownRefresh(), 1000)}>
      {isStaff && (
        <View className={styles.searchBar}>
          <Input
            className={styles.searchInput}
            placeholder="搜索工单号、标题、业主、房号..."
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
            confirmType="search"
          />
          <View className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
            <Text className={styles.filterIcon}>🔍</Text>
            {hasActiveFilters && <View className={styles.filterBadge} />}
          </View>
        </View>
      )}

      {isStaff && showFilters && (
        <View className={styles.filterPanel}>
          <View className={styles.filterGroup}>
            <Text className={styles.filterLabel}>报修类型</Text>
            <View className={styles.chipRow}>
              <View
                className={classnames(styles.chip, !filterType && styles.chipActive)}
                onClick={() => setFilterType('')}
              >
                <Text>全部</Text>
              </View>
              {REPAIR_TYPE_OPTIONS.map((opt) => (
                <View
                  key={opt.value}
                  className={classnames(styles.chip, filterType === opt.value && styles.chipActive)}
                  onClick={() => setFilterType(opt.value)}
                >
                  <Text>{opt.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.filterGroup}>
            <Text className={styles.filterLabel}>楼栋</Text>
            <View className={styles.chipRow}>
              <View
                className={classnames(styles.chip, !filterBuilding && styles.chipActive)}
                onClick={() => setFilterBuilding('')}
              >
                <Text>全部</Text>
              </View>
              {buildings.map((b) => (
                <View
                  key={b}
                  className={classnames(styles.chip, filterBuilding === b && styles.chipActive)}
                  onClick={() => setFilterBuilding(b)}
                >
                  <Text>{b}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.filterGroup}>
            <Text className={styles.filterLabel}>维修师傅</Text>
            <View className={styles.chipRow}>
              <View
                className={classnames(styles.chip, !filterWorker && styles.chipActive)}
                onClick={() => setFilterWorker('')}
              >
                <Text>全部</Text>
              </View>
              {workers.map((w) => (
                <View
                  key={w}
                  className={classnames(styles.chip, filterWorker === w && styles.chipActive)}
                  onClick={() => setFilterWorker(w)}
                >
                  <Text>{w}</Text>
                </View>
              ))}
            </View>
          </View>

          {hasActiveFilters && (
            <View className={styles.filterActions}>
              <View className={styles.resetBtn} onClick={resetFilters}>
                <Text>重置筛选</Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View className={styles.filterBar}>
        {filterTabs.map((tab) => {
          const count = filteredOrders.filter((o) => tab.value === 'all' || o.status === tab.value).length;
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

      {hasActiveFilters && (
        <View className={styles.resultInfo}>
          <Text>筛选结果：共 {filteredOrders.length} 条工单</Text>
        </View>
      )}

      <View className={styles.orderList}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)
        ) : (
          <EmptyState
            title="暂无工单"
            description={hasActiveFilters ? '没有符合筛选条件的工单' : activeFilter === 'all' ? '还没有任何工单记录' : '当前状态下没有工单'}
          />
        )}
      </View>
    </ScrollView>
  );
};

export default OrdersPage;
