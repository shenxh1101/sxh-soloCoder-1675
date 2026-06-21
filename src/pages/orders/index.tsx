import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import type { OrderStatus, RepairType, RepairOrder } from '@/types';
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
  const { orders, searchOrders, getOrdersByOwner, getOrdersByWorker, getWorkersWithOrders, getBuildingsWithOrders } = useOrderStore();
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<RepairType | ''>('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterWorker, setFilterWorker] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useDidShow(() => {
    console.log('[Orders] 页面显示');
  });

  const isStaff = userInfo.role === 'customer_service' || userInfo.role === 'manager';

  const workerNames = useMemo(() => getWorkersWithOrders(), [orders]);
  const buildingNames = useMemo(() => getBuildingsWithOrders(), [orders]);

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

    if (isStaff && (searchKeyword || filterType || filterBuilding || filterWorker)) {
      list = searchOrders({
        type: filterType || undefined,
        keyword: searchKeyword || undefined,
        building: filterBuilding || undefined,
        workerName: filterWorker || undefined,
      });
      if (userInfo.role === 'worker') {
        list = list.filter((o) => o.workerId === 'w001');
      }
    }

    if (activeFilter !== 'all') {
      list = list.filter((o) => o.status === activeFilter);
    }

    return list.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  }, [userInfo, activeFilter, orders, searchKeyword, filterType, filterBuilding, filterWorker, isStaff, searchOrders, getOrdersByOwner, getOrdersByWorker]);

  const pendingOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'pending'),
    [filteredOrders],
  );

  const hasActiveFilters = isStaff && (filterType || filterBuilding || filterWorker || searchKeyword);

  const resetFilters = () => {
    setFilterType('');
    setFilterBuilding('');
    setFilterWorker('');
    setSearchKeyword('');
  };

  const toggleSelect = (orderId: string) => {
    setSelectedIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    );
  };

  const selectAllPending = () => {
    const pendingIds = pendingOrders.map((o) => o.id);
    if (selectedIds.length === pendingIds.length && selectedIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  const exitBatchMode = () => {
    setBatchMode(false);
    setSelectedIds([]);
  };

  const goBatchAssign = () => {
    if (selectedIds.length === 0) {
      Taro.showToast({ title: '请先选择工单', icon: 'none' });
      return;
    }
    Taro.navigateTo({
      url: `/pages/batch-assign/index?orderIds=${selectedIds.join(',')}`,
    });
  };

  const goToDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${id}` });
  };

  const renderOrderItem = (order: RepairOrder) => {
    if (batchMode && order.status === 'pending') {
      const isSelected = selectedIds.includes(order.id);
      return (
        <View key={order.id} className={styles.batchOrderItem} onClick={() => toggleSelect(order.id)}>
          <View className={classnames(styles.checkbox, isSelected && styles.checkboxChecked)}>
            {isSelected && <Text className={styles.checkIcon}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <OrderCard order={order} />
          </View>
        </View>
      );
    }
    return (
      <View key={order.id} onClick={() => goToDetail(order.id)}>
        <OrderCard order={order} />
      </View>
    );
  };

  return (
    <ScrollView className={styles.page} scrollY refresherEnabled onRefresh={() => setTimeout(() => Taro.stopPullDownRefresh(), 1000)}>
      {isStaff && !batchMode && (
        <View className={styles.searchBar}>
          <Input
            className={styles.searchInput}
            placeholder="搜索工单号、标题、业主、楼栋、房号、师傅..."
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
            confirmType="search"
          />
          <View className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
            <Text className={styles.filterIcon}>⚙️</Text>
            {hasActiveFilters && <View className={styles.filterBadge} />}
          </View>
        </View>
      )}

      {isStaff && !batchMode && showFilters && (
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
              {buildingNames.map((b) => (
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
              {workerNames.map((w) => (
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

      {batchMode && (
        <View className={styles.batchHeader}>
          <View className={styles.batchTitle}>
            <Text>批量派单</Text>
            <Text className={styles.batchCount}>已选 {selectedIds.length} 单</Text>
          </View>
          <View className={styles.batchActions}>
            <View className={styles.batchBtnSecondary} onClick={exitBatchMode}>
              <Text>取消</Text>
            </View>
            <View
              className={classnames(styles.batchBtnPrimary, selectedIds.length === 0 && styles.batchBtnDisabled)}
              onClick={selectedIds.length > 0 ? goBatchAssign : undefined}
            >
              <Text>下一步</Text>
            </View>
          </View>
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

      {batchMode && (
        <View className={styles.selectAllRow}>
          <View className={styles.selectAllLeft} onClick={selectAllPending}>
            <View className={classnames(styles.checkbox, selectedIds.length === pendingOrders.length && pendingOrders.length > 0 && styles.checkboxChecked)}>
              {selectedIds.length === pendingOrders.length && pendingOrders.length > 0 && <Text className={styles.checkIcon}>✓</Text>}
            </View>
            <Text className={styles.selectAllText}>全选待派单工单</Text>
          </View>
          <Text className={styles.selectAllHint}>仅可选择待派单工单进行批量派单</Text>
        </View>
      )}

      {hasActiveFilters && !batchMode && (
        <View className={styles.resultInfo}>
          <Text>筛选结果：共 {filteredOrders.length} 条工单</Text>
        </View>
      )}

      {isStaff && !batchMode && activeFilter === 'pending' && pendingOrders.length > 0 && (
        <View className={styles.batchEntry} onClick={() => setBatchMode(true)}>
          <Text className={styles.batchEntryIcon}>📋</Text>
          <Text className={styles.batchEntryText}>批量派单模式（当前 {pendingOrders.length} 单待派）</Text>
          <Text className={styles.batchEntryArrow}>›</Text>
        </View>
      )}

      <View className={styles.orderList}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => renderOrderItem(order))
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
