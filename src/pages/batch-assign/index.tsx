import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useOrderStore } from '@/store/useOrderStore';
import { getRepairTypeLabel } from '@/utils/constants';
import StatusTag from '@/components/StatusTag';
import WorkerCard from '@/components/WorkerCard';
import styles from './index.module.scss';

const BatchAssignPage: React.FC = () => {
  const router = useRouter();
  const { orders, getWorkerLoad, batchAssignOrders, getOrderById } = useOrderStore();
  const orderIdsStr = router.params.orderIds || '';
  const orderIds = useMemo(() => orderIdsStr.split(',').filter(Boolean), [orderIdsStr]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const selectedOrders = useMemo(() => {
    return orderIds
      .map((id) => getOrderById(id))
      .filter(Boolean)
      .filter((o) => o.status === 'pending');
  }, [orders, orderIds, getOrderById]);

  const workerLoads = useMemo(() => getWorkerLoad(), [orders]);

  useDidShow(() => {
    console.log('[BatchAssign] 页面显示');
  });

  const handleConfirm = () => {
    if (!selectedWorkerId) {
      Taro.showToast({ title: '请选择维修师傅', icon: 'none' });
      return;
    }
    const worker = workerLoads.find((w) => w.id === selectedWorkerId);
    Taro.showModal({
      title: '确认批量派单',
      content: `确定将 ${selectedOrders.length} 条工单批量派给${worker?.name || '该师傅'}吗？\n师傅当前负载：待办${worker?.pendingCount || 0}单，进行中${worker?.processingCount || 0}单`,
      success: (res) => {
        if (res.confirm) {
          const count = batchAssignOrders(orderIds, selectedWorkerId);
          if (count > 0) {
            Taro.showToast({ title: `成功派单${count}单`, icon: 'success' });
            setTimeout(() => {
              Taro.navigateBack();
            }, 1000);
          } else {
            Taro.showToast({ title: '派单失败', icon: 'none' });
          }
        }
      },
    });
  };

  const stats = useMemo(() => {
    const typeMap = new Map<string, number>();
    const buildingMap = new Map<string, number>();
    selectedOrders.forEach((o) => {
      typeMap.set(o.type, (typeMap.get(o.type) || 0) + 1);
      buildingMap.set(o.ownerInfo.building, (buildingMap.get(o.ownerInfo.building) || 0) + 1);
    });
    return {
      typeSummary: Array.from(typeMap.entries())
        .map(([type, count]) => `${getRepairTypeLabel(type as any)} ${count}单`)
        .join('、'),
      buildingSummary: Array.from(buildingMap.entries())
        .map(([b, count]) => `${b} ${count}单`)
        .join('、'),
    };
  }, [selectedOrders]);

  const sortedWorkers = useMemo(() => {
    return [...workerLoads].sort((a, b) => a.totalLoad - b.totalLoad);
  }, [workerLoads]);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.summaryCard}>
        <View className={styles.summaryHeader}>
          <Text className={styles.summaryTitle}>待派工单一览</Text>
          <View className={styles.summaryBadge}>
            <Text>{selectedOrders.length} 单</Text>
          </View>
        </View>
        {stats.typeSummary && (
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>报修类型：</Text>
            <Text className={styles.summaryValue}>{stats.typeSummary}</Text>
          </View>
        )}
        {stats.buildingSummary && (
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>涉及楼栋：</Text>
            <Text className={styles.summaryValue}>{stats.buildingSummary}</Text>
          </View>
        )}

        <View className={styles.orderList}>
          {selectedOrders.map((order) => (
            <View key={order.id} className={styles.orderItem}>
              <View style={{ flex: 1 }}>
                <View className={styles.orderTop}>
                  <Text className={styles.orderNo}>{order.orderNo}</Text>
                  <StatusTag status={order.status} />
                </View>
                <Text className={styles.orderTitle}>{order.title}</Text>
                <Text className={styles.orderMeta}>
                  {getRepairTypeLabel(order.type)} · {order.ownerInfo.building}{order.ownerInfo.room}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.sectionTitle}>
        <Text>选择维修师傅</Text>
        <Text className={styles.sectionHint}>按当前负载从低到高排序</Text>
      </View>

      <View className={styles.workerList}>
        {sortedWorkers.map((worker) => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            selected={selectedWorkerId === worker.id}
            onClick={() => setSelectedWorkerId(worker.id)}
          />
        ))}
      </View>

      <View className={styles.footerBar}>
        <View className={styles.footerInfo}>
          {selectedWorkerId ? (
            <Text>
              已选择：{workerLoads.find((w) => w.id === selectedWorkerId)?.name}
            </Text>
          ) : (
            <Text style={{ color: '#86909c' }}>请选择维修师傅</Text>
          )}
        </View>
        <View
          className={classnames(
            styles.submitBtn,
            !selectedWorkerId && styles.submitBtnDisabled,
          )}
          onClick={selectedWorkerId ? handleConfirm : undefined}
        >
          <Text>确认派单（{selectedOrders.length}单）</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default BatchAssignPage;
