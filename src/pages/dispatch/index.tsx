import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import type { RepairType, RepairOrder } from '@/types';
import { useOrderStore } from '@/store/useOrderStore';
import { REPAIR_TYPE_OPTIONS, getRepairTypeLabel } from '@/utils/constants';
import styles from './index.module.scss';

const PENDING_TIMEOUT_MINUTES = 60;

const DispatchPage: React.FC = () => {
  const { orders, getWorkerLoad, batchAssignOrders } = useOrderStore();
  const [selectedType, setSelectedType] = useState<RepairType | 'all'>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  const workerLoads = useMemo(() => getWorkerLoad(), [orders]);

  const pendingOrders = useMemo(() => {
    let list = orders.filter((o) => o.status === 'pending');
    if (selectedType !== 'all') {
      list = list.filter((o) => o.type === selectedType);
    }
    if (selectedBuilding !== 'all') {
      list = list.filter((o) => o.ownerInfo.building === selectedBuilding);
    }
    return list.sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());
  }, [orders, selectedType, selectedBuilding]);

  const timeoutOrders = useMemo(() => {
    const now = dayjs();
    return pendingOrders.filter((o) => now.diff(dayjs(o.createTime), 'minute') > PENDING_TIMEOUT_MINUTES);
  }, [pendingOrders]);

  const buildings = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => set.add(o.ownerInfo.building));
    return Array.from(set).sort();
  }, [orders]);

  useDidShow(() => {
    console.log('[Dispatch] 页面显示');
  });

  const toggleOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    );
  };

  const selectAllFiltered = () => {
    if (selectedOrderIds.length === pendingOrders.length && pendingOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(pendingOrders.map((o) => o.id));
    }
  };

  const selectedOrders = useMemo(
    () => pendingOrders.filter((o) => selectedOrderIds.includes(o.id)),
    [pendingOrders, selectedOrderIds],
  );

  const selectedWorker = useMemo(
    () => workerLoads.find((w) => w.id === selectedWorkerId),
    [workerLoads, selectedWorkerId],
  );

  const expectedLoad = useMemo(() => {
    if (!selectedWorker) return null;
    return {
      before: selectedWorker.totalLoad,
      after: selectedWorker.totalLoad + selectedOrders.length,
      add: selectedOrders.length,
    };
  }, [selectedWorker, selectedOrders.length]);

  const handleBatchAssign = () => {
    if (selectedOrderIds.length === 0) {
      Taro.showToast({ title: '请选择工单', icon: 'none' });
      return;
    }
    if (!selectedWorkerId) {
      Taro.showToast({ title: '请选择师傅', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认批量派单',
      content: `确定将 ${selectedOrders.length} 条工单派给${selectedWorker?.name}吗？\n\n师傅当前负载：${selectedWorker?.totalLoad}单\n派单后负载：${(selectedWorker?.totalLoad || 0) + selectedOrders.length}单`,
      success: (res) => {
        if (res.confirm) {
          const count = batchAssignOrders(selectedOrderIds, selectedWorkerId);
          if (count > 0) {
            Taro.showToast({ title: `成功派单${count}单`, icon: 'success' });
            setSelectedOrderIds([]);
            setSelectedWorkerId(null);
          } else {
            Taro.showToast({ title: '派单失败', icon: 'none' });
          }
        }
      },
    });
  };

  const isTimeout = (order: RepairOrder) => {
    return dayjs().diff(dayjs(order.createTime), 'minute') > PENDING_TIMEOUT_MINUTES;
  };

  const getWaitTime = (order: RepairOrder) => {
    const diff = dayjs().diff(dayjs(order.createTime), 'minute');
    if (diff < 60) return `${diff}分钟`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}小时${mins > 0 ? mins + '分' : ''}`;
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>派单调度中心</Text>
        <Text className={styles.subtitle}>待派 {pendingOrders.length} 单 · 超时 {timeoutOrders.length} 单</Text>
      </View>

      <View className={styles.filterBar}>
        <ScrollView scrollX className={styles.filterScroll}>
          <View
            className={classnames(styles.filterChip, selectedType === 'all' && styles.filterChipActive)}
            onClick={() => setSelectedType('all')}
          >
            <Text>全部类型</Text>
          </View>
          {REPAIR_TYPE_OPTIONS.map((opt) => (
            <View
              key={opt.value}
              className={classnames(styles.filterChip, selectedType === opt.value && styles.filterChipActive)}
              onClick={() => setSelectedType(opt.value)}
            >
              <Text>{opt.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.filterBar} style={{ paddingTop: 0 }}>
        <ScrollView scrollX className={styles.filterScroll}>
          <View
            className={classnames(styles.filterChip, styles.chipOutline, selectedBuilding === 'all' && styles.chipOutlineActive)}
            onClick={() => setSelectedBuilding('all')}
          >
            <Text>全部楼栋</Text>
          </View>
          {buildings.map((b) => (
            <View
              key={b}
              className={classnames(styles.filterChip, styles.chipOutline, selectedBuilding === b && styles.chipOutlineActive)}
              onClick={() => setSelectedBuilding(b)}
            >
              <Text>{b}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>待派工单</Text>
          <View className={styles.selectAll} onClick={selectAllFiltered}>
            <View
              className={classnames(
                styles.checkbox,
                selectedOrderIds.length === pendingOrders.length && pendingOrders.length > 0 && styles.checkboxChecked,
              )}
            >
              {selectedOrderIds.length === pendingOrders.length && pendingOrders.length > 0 && (
                <Text className={styles.checkIcon}>✓</Text>
              )}
            </View>
            <Text className={styles.selectAllText}>
              {selectedOrderIds.length > 0 ? `已选${selectedOrderIds.length}单` : '全选'}
            </Text>
          </View>
        </View>

        <View className={styles.orderList}>
          {pendingOrders.length > 0 ? (
            pendingOrders.map((order) => {
              const timeout = isTimeout(order);
              const selected = selectedOrderIds.includes(order.id);
              return (
                <View
                  key={order.id}
                  className={classnames(
                    styles.orderCard,
                    timeout && styles.orderCardTimeout,
                    selected && styles.orderCardSelected,
                  )}
                  onClick={() => toggleOrder(order.id)}
                >
                  <View
                    className={classnames(
                      styles.checkbox,
                      selected && styles.checkboxChecked,
                    )}
                  >
                    {selected && <Text className={styles.checkIcon}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View className={styles.orderTop}>
                      <Text className={styles.orderNo}>{order.orderNo}</Text>
                      {timeout && (
                        <View className={styles.timeoutBadge}>
                          <Text>超时 {getWaitTime(order)}</Text>
                        </View>
                      )}
                    </View>
                    <Text className={styles.orderTitle}>{order.title}</Text>
                    <View className={styles.orderMeta}>
                      <Text className={styles.typeTag}>{getRepairTypeLabel(order.type)}</Text>
                      <Text className={styles.location}>
                        📍 {order.ownerInfo.building} {order.ownerInfo.room}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View className={styles.empty}>
              <Text>暂无待派工单</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>维修师傅负载</Text>
          {selectedOrders.length > 0 && (
            <Text className={styles.sectionHint}>选择派单师傅</Text>
          )}
        </View>

        <View className={styles.workerList}>
          {workerLoads.map((worker) => {
            const isSelected = selectedWorkerId === worker.id;
            const isHighLoad = worker.totalLoad >= 4;
            return (
              <View
                key={worker.id}
                className={classnames(
                  styles.workerCard,
                  isSelected && styles.workerCardSelected,
                  isHighLoad && styles.workerCardHighLoad,
                )}
                onClick={() => selectedOrders.length > 0 && setSelectedWorkerId(worker.id)}
              >
                <View className={styles.workerInfo}>
                  <Text className={styles.workerName}>{worker.name}</Text>
                  <View className={styles.workerSkills}>
                    {worker.skills.slice(0, 2).map((s) => (
                      <Text key={s} className={styles.skillTag}>{getRepairTypeLabel(s)}</Text>
                    ))}
                  </View>
                </View>
                <View className={styles.workerStats}>
                  <View className={styles.loadBarWrap}>
                    <View
                      className={classnames(styles.loadBarFill, isHighLoad && styles.loadBarHigh)}
                      style={{ width: `${Math.min((worker.totalLoad / 6) * 100, 100)}%` }}
                    />
                  </View>
                  <View className={styles.loadNumbers}>
                    <Text className={styles.loadText}>
                      待办 {worker.pendingCount} · 进行中 {worker.processingCount}
                    </Text>
                    {isSelected && expectedLoad && (
                      <Text className={styles.loadAdd}>
                        +{expectedLoad.add} → {expectedLoad.after}
                      </Text>
                    )}
                  </View>
                </View>
                {isSelected && <View className={styles.selectedMark}>✓</View>}
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ height: 160 }} />

      {selectedOrders.length > 0 && (
        <View className={styles.footerBar}>
          <View className={styles.footerInfo}>
            <Text className={styles.footerCount}>已选 {selectedOrders.length} 单</Text>
            {selectedWorker && (
              <Text className={styles.footerWorker}>
                派给：{selectedWorker.name}
              </Text>
            )}
          </View>
          <View
            className={classnames(
              styles.submitBtn,
              !selectedWorkerId && styles.submitBtnDisabled,
            )}
            onClick={selectedWorkerId ? handleBatchAssign : undefined}
          >
            <Text>确认派单</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default DispatchPage;
