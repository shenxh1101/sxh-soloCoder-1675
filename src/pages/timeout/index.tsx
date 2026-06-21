import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useOrderStore } from '@/store/useOrderStore';
import { getRepairTypeLabel } from '@/utils/constants';
import StatusTag from '@/components/StatusTag';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

type TimeoutTab = 'pending' | 'processing';

const TimeoutPage: React.FC = () => {
  const { orders, getTimeoutOrders, assignOrder } = useOrderStore();
  const [activeTab, setActiveTab] = useState<TimeoutTab>('pending');
  const [timeoutSettings, setTimeoutSettings] = useState({ pending: 60, processing: 240 });

  const timeoutOrders = useMemo(
    () => getTimeoutOrders(timeoutSettings),
    [orders, timeoutSettings],
  );

  useDidShow(() => {
    console.log('[Timeout] 页面显示，刷新超时数据');
  });

  const displayOrders = activeTab === 'pending'
    ? timeoutOrders.pendingTimeout
    : timeoutOrders.processingTimeout;

  const getWaitTime = (order: typeof displayOrders[0]) => {
    const baseTime = activeTab === 'pending' ? order.createTime : order.startTime;
    if (!baseTime) return '';
    const diffMinutes = dayjs().diff(dayjs(baseTime), 'minute');
    if (diffMinutes < 60) return `${diffMinutes}分钟`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}小时${mins > 0 ? mins + '分' : ''}`;
  };

  const goToDetail = (orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  };

  const handleReassign = (order: typeof displayOrders[0]) => {
    Taro.showModal({
      title: '重新派单',
      content: `确定要重新派单「${order.title}」吗？`,
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({ url: `/pages/worker-select/index?orderId=${order.id}` });
        }
      },
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>超时提醒</Text>
        <Text className={styles.subtitle}>及时响应，提升服务质量</Text>
      </View>

      <View className={styles.settingsCard}>
        <Text className={styles.settingsLabel}>超时阈值设置</Text>
        <View className={styles.settingsRow}>
          <View className={styles.settingItem}>
            <Text className={styles.settingLabel}>未派单超时</Text>
            <View className={styles.settingBtns}>
              <View
                className={classnames(styles.settingBtn, timeoutSettings.pending === 30 && styles.settingBtnActive)}
                onClick={() => setTimeoutSettings((s) => ({ ...s, pending: 30 }))}
              >
                <Text>30分钟</Text>
              </View>
              <View
                className={classnames(styles.settingBtn, timeoutSettings.pending === 60 && styles.settingBtnActive)}
                onClick={() => setTimeoutSettings((s) => ({ ...s, pending: 60 }))}
              >
                <Text>1小时</Text>
              </View>
              <View
                className={classnames(styles.settingBtn, timeoutSettings.pending === 120 && styles.settingBtnActive)}
                onClick={() => setTimeoutSettings((s) => ({ ...s, pending: 120 }))}
              >
                <Text>2小时</Text>
              </View>
            </View>
          </View>
          <View className={styles.settingItem}>
            <Text className={styles.settingLabel}>处理超时</Text>
            <View className={styles.settingBtns}>
              <View
                className={classnames(styles.settingBtn, timeoutSettings.processing === 120 && styles.settingBtnActive)}
                onClick={() => setTimeoutSettings((s) => ({ ...s, processing: 120 }))}
              >
                <Text>2小时</Text>
              </View>
              <View
                className={classnames(styles.settingBtn, timeoutSettings.processing === 240 && styles.settingBtnActive)}
                onClick={() => setTimeoutSettings((s) => ({ ...s, processing: 240 }))}
              >
                <Text>4小时</Text>
              </View>
              <View
                className={classnames(styles.settingBtn, timeoutSettings.processing === 480 && styles.settingBtnActive)}
                onClick={() => setTimeoutSettings((s) => ({ ...s, processing: 480 }))}
              >
                <Text>8小时</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, activeTab === 'pending' && styles.tabItemActive)}
          onClick={() => setActiveTab('pending')}
        >
          <Text className={styles.tabIcon}>⏰</Text>
          <Text className={styles.tabText}>未派单超时</Text>
          {timeoutOrders.pendingTimeout.length > 0 && (
            <View className={styles.tabBadge}>
              <Text>{timeoutOrders.pendingTimeout.length}</Text>
            </View>
          )}
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'processing' && styles.tabItemActive)}
          onClick={() => setActiveTab('processing')}
        >
          <Text className={styles.tabIcon}>⚠️</Text>
          <Text className={styles.tabText}>处理超时</Text>
          {timeoutOrders.processingTimeout.length > 0 && (
            <View className={styles.tabBadge}>
              <Text>{timeoutOrders.processingTimeout.length}</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.orderList}>
        {displayOrders.length > 0 ? (
          displayOrders.map((order) => (
            <View key={order.id} className={styles.orderCard}>
              <View className={styles.orderHeader} onClick={() => goToDetail(order.id)}>
                <View style={{ flex: 1 }}>
                  <View className={styles.orderTopRow}>
                    <Text className={styles.orderNo}>{order.orderNo}</Text>
                    <StatusTag status={order.status} />
                  </View>
                  <Text className={styles.orderTitle}>{order.title}</Text>
                  <Text className={styles.orderType}>{getRepairTypeLabel(order.type)}</Text>
                </View>
                <View className={styles.timeoutBadge}>
                  <Text className={styles.timeoutBadgeText}>{getWaitTime(order)}</Text>
                </View>
              </View>

              <View className={styles.orderInfo}>
                <Text className={styles.infoItem}>📍 {order.ownerInfo.building} {order.ownerInfo.room}</Text>
                <Text className={styles.infoItem}>👤 {order.ownerInfo.name}</Text>
              </View>

              {order.workerName && (
                <View className={styles.workerRow}>
                  <Text className={styles.workerLabel}>维修师傅：</Text>
                  <Text className={styles.workerName}>{order.workerName}</Text>
                </View>
              )}

              <View className={styles.orderActions}>
                <View
                  className={classnames(styles.actionBtn, styles.btnSecondary)}
                  onClick={() => goToDetail(order.id)}
                >
                  <Text>查看详情</Text>
                </View>
                <View
                  className={classnames(styles.actionBtn, styles.btnPrimary)}
                  onClick={() => activeTab === 'processing' ? handleReassign(order) : goToDetail(order.id)}
                >
                  <Text>{activeTab === 'processing' ? '重新派单' : '立即派单'}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            title={`暂无${activeTab === 'pending' ? '未派单' : '处理'}超时工单`}
            description="当前没有超时工单，继续保持！"
          />
        )}
      </View>
    </ScrollView>
  );
};

export default TimeoutPage;
