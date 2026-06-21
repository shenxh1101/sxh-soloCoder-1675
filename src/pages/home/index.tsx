import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/useUserStore';
import { useOrderStore } from '@/store/useOrderStore';
import { USER_ROLE_OPTIONS, getUserRoleLabel, getRepairTypeLabel } from '@/utils/constants';
import { formatDuration } from '@/utils/format';
import OrderCard from '@/components/OrderCard';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const PROCESS_TIMEOUT_MINUTES = 240;
const NEAR_TIMEOUT_MINUTES = 180;

const HomePage: React.FC = () => {
  const { userInfo, setRole } = useUserStore();
  const { orders, getOrdersByStatus, getOrdersByWorker, getOrdersByOwner, startOrder } = useOrderStore();

  const workerTasks = useMemo(() => {
    if (userInfo.role !== 'worker') return null;
    const myOrders = getOrdersByWorker('w001');
    const pending = myOrders.filter((o) => o.status === 'assigned');
    const processing = myOrders.filter((o) => o.status === 'processing');
    const now = dayjs();
    const nearTimeout = processing.filter((o) => {
      if (!o.startTime) return false;
      const diff = now.diff(dayjs(o.startTime), 'minute');
      return diff >= NEAR_TIMEOUT_MINUTES && diff < PROCESS_TIMEOUT_MINUTES;
    });
    const urgent = processing.filter((o) => {
      if (!o.startTime) return false;
      return now.diff(dayjs(o.startTime), 'minute') >= PROCESS_TIMEOUT_MINUTES;
    });
    return {
      pending,
      processing,
      nearTimeout,
      urgent,
      totalToday: myOrders.filter((o) => {
        if (!o.completeTime) return false;
        return dayjs(o.completeTime).isSame(dayjs(), 'day');
      }).length,
    };
  }, [userInfo.role, orders, getOrdersByWorker]);

  const displayOrders = useMemo(() => {
    if (userInfo.role === 'owner') {
      return getOrdersByOwner(userInfo.phone).slice(0, 3);
    } else if (userInfo.role === 'worker') {
      return getOrdersByWorker('w001').filter((o) => o.status !== 'completed').slice(0, 3);
    }
    return orders.slice(0, 3);
  }, [userInfo, orders, getOrdersByOwner, getOrdersByWorker]);

  const stats = useMemo(() => {
    const pending = getOrdersByStatus('pending').length;
    const processing = getOrdersByStatus('processing').length + getOrdersByStatus('assigned').length;
    const completed = getOrdersByStatus('completed').length;
    return { pending, processing, completed, total: orders.length };
  }, [orders, getOrdersByStatus]);

  const managerStats = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const responseTimes = completedOrders
      .filter((o) => o.responseMinutes !== undefined)
      .map((o) => o.responseMinutes as number);
    const processTimes = completedOrders
      .filter((o) => o.processMinutes !== undefined)
      .map((o) => o.processMinutes as number);
    return {
      avgResponseMinutes: responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0,
      avgProcessMinutes: processTimes.length > 0
        ? Math.round(processTimes.reduce((a, b) => a + b, 0) / processTimes.length)
        : 0,
    };
  }, [orders]);

  const goToRepair = (type?: string) => {
    const url = type ? `/pages/repair/index?type=${type}` : '/pages/repair/index';
    Taro.switchTab({ url: '/pages/repair/index' }).catch(() => {
      Taro.navigateTo({ url });
    });
  };

  const goToOrders = () => {
    Taro.switchTab({ url: '/pages/orders/index' });
  };

  const goToTimeout = () => {
    Taro.navigateTo({ url: '/pages/timeout/index' });
  };

  const goToStatistics = () => {
    Taro.navigateTo({ url: '/pages/statistics/index' });
  };

  const handleStartOrder = (orderId: string) => {
    Taro.showModal({
      title: '确认开始处理',
      content: '确认开始处理此工单吗？开始后将计时。',
      success: (res) => {
        if (res.confirm) {
          startOrder(orderId);
          Taro.showToast({ title: '已开始处理', icon: 'success' });
        }
      },
    });
  };

  const goToOrderDetail = (orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  };

  const quickActions = [
    { icon: '💧', label: '水电维修', type: 'water_electric', className: styles.iconWater },
    { icon: '🔐', label: '门禁系统', type: 'access_control', className: styles.iconAccess },
    { icon: '🛗', label: '电梯故障', type: 'elevator', className: styles.iconElevator },
    { icon: '🏟️', label: '公共设施', type: 'public_facility', className: styles.iconPublic },
  ];

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      onRefresh={() => {
        setTimeout(() => Taro.stopPullDownRefresh(), 1000);
      }}
    >
      <View className={styles.header}>
        <View className={styles.greeting}>
          <View className={styles.userInfo}>
            <View className={styles.avatar}>
              <Image
                className={styles.avatarImg}
                src={userInfo.avatar || 'https://picsum.photos/id/1025/200/200'}
                mode="aspectFill"
              />
            </View>
            <View className={styles.greetingText}>
              <Text className={styles.hello}>您好，欢迎回来</Text>
              <Text className={styles.userName}>{userInfo.name}</Text>
            </View>
          </View>
          <View className={styles.roleBadge}>{getUserRoleLabel(userInfo.role)}</View>
        </View>

        {(userInfo.role === 'manager' || userInfo.role === 'customer_service') && (
          <View className={styles.banner}>
            <Text className={styles.bannerTitle}>今日工单概览</Text>
            <Text className={styles.bannerDesc}>
              待处理 {stats.pending} 单 · 处理中 {stats.processing} 单 · 已完成 {stats.completed} 单
            </Text>
          </View>
        )}
      </View>

      <View style={{ padding: `0 ${32}rpx` }}>
        {userInfo.role === 'owner' && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>快速报修</Text>
            <View style={{ height: 16 }} />
            <View className={styles.quickActions}>
              {quickActions.map((action) => (
                <View
                  key={action.type}
                  className={styles.actionItem}
                  onClick={() => goToRepair(action.type)}
                >
                  <View className={classnames(styles.actionIcon, action.className)}>
                    <Text>{action.icon}</Text>
                  </View>
                  <Text className={styles.actionLabel}>{action.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {(userInfo.role === 'manager' || userInfo.role === 'customer_service' || userInfo.role === 'worker') && (
          <View className={styles.section}>
            <View className={styles.statsRow}>
              <StatCard value={stats.pending} label="待派单" variant="warning" />
              <StatCard value={stats.processing} label="处理中" variant="primary" />
              <StatCard value={stats.completed} label="已完成" variant="success" />
            </View>
            {userInfo.role === 'manager' && (
              <View className={styles.statsRow}>
                <StatCard value={formatDuration(managerStats.avgResponseMinutes)} label="平均响应" variant="primary" />
                <StatCard value={formatDuration(managerStats.avgProcessMinutes)} label="平均处理" variant="success" />
              </View>
            )}
          </View>
        )}

        {userInfo.role === 'worker' && workerTasks && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>今日任务看板</Text>
              <Text className={styles.todayBadge}>今日完成 {workerTasks.totalToday} 单</Text>
            </View>

            {workerTasks.urgent.length > 0 && (
              <View className={styles.taskGroup}>
                <View className={styles.taskGroupHeader}>
                  <Text className={classnames(styles.taskGroupTitle, styles.taskUrgent)}>
                    🔴 超时预警
                  </Text>
                  <Text className={styles.taskGroupCount}>{workerTasks.urgent.length}单</Text>
                </View>
                {workerTasks.urgent.slice(0, 3).map((order) => (
                  <View key={order.id} className={styles.taskCard} onClick={() => goToOrderDetail(order.id)}>
                    <View style={{ flex: 1 }}>
                      <View className={styles.taskTop}>
                        <Text className={styles.taskTitle}>{order.title}</Text>
                        <View className={styles.urgentBadge}>
                          <Text>超时</Text>
                        </View>
                      </View>
                      <Text className={styles.taskMeta}>
                        {getRepairTypeLabel(order.type)} · {order.ownerInfo.building}{order.ownerInfo.room}
                      </Text>
                    </View>
                    <View
                      className={classnames(styles.taskBtn, styles.taskBtnPrimary)}
                      onClick={(e) => { e.stopPropagation(); handleStartOrder(order.id); }}
                    >
                      <Text>继续</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {workerTasks.nearTimeout.length > 0 && (
              <View className={styles.taskGroup}>
                <View className={styles.taskGroupHeader}>
                  <Text className={classnames(styles.taskGroupTitle, styles.taskWarning)}>
                    🟡 即将超时
                  </Text>
                  <Text className={styles.taskGroupCount}>{workerTasks.nearTimeout.length}单</Text>
                </View>
                {workerTasks.nearTimeout.slice(0, 3).map((order) => (
                  <View key={order.id} className={styles.taskCard} onClick={() => goToOrderDetail(order.id)}>
                    <View style={{ flex: 1 }}>
                      <View className={styles.taskTop}>
                        <Text className={styles.taskTitle}>{order.title}</Text>
                        <View className={styles.warningBadge}>
                          <Text>快超时</Text>
                        </View>
                      </View>
                      <Text className={styles.taskMeta}>
                        {getRepairTypeLabel(order.type)} · {order.ownerInfo.building}{order.ownerInfo.room}
                      </Text>
                    </View>
                    <View
                      className={classnames(styles.taskBtn, styles.taskBtnPrimary)}
                      onClick={(e) => { e.stopPropagation(); handleStartOrder(order.id); }}
                    >
                      <Text>继续</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {workerTasks.processing.filter((o) => {
              if (!o.startTime) return true;
              const diff = dayjs().diff(dayjs(o.startTime), 'minute');
              return diff < NEAR_TIMEOUT_MINUTES;
            }).length > 0 && (
              <View className={styles.taskGroup}>
                <View className={styles.taskGroupHeader}>
                  <Text className={classnames(styles.taskGroupTitle, styles.taskProcessing)}>
                    🔵 处理中
                  </Text>
                  <Text className={styles.taskGroupCount}>
                    {workerTasks.processing.filter((o) => {
                      if (!o.startTime) return true;
                      return dayjs().diff(dayjs(o.startTime), 'minute') < NEAR_TIMEOUT_MINUTES;
                    }).length}单
                  </Text>
                </View>
                {workerTasks.processing
                  .filter((o) => {
                    if (!o.startTime) return true;
                    return dayjs().diff(dayjs(o.startTime), 'minute') < NEAR_TIMEOUT_MINUTES;
                  })
                  .slice(0, 3)
                  .map((order) => (
                    <View key={order.id} className={styles.taskCard} onClick={() => goToOrderDetail(order.id)}>
                      <View style={{ flex: 1 }}>
                        <Text className={styles.taskTitle}>{order.title}</Text>
                        <Text className={styles.taskMeta}>
                          {getRepairTypeLabel(order.type)} · {order.ownerInfo.building}{order.ownerInfo.room}
                        </Text>
                      </View>
                      <View
                        className={classnames(styles.taskBtn, styles.taskBtnPrimary)}
                        onClick={(e) => { e.stopPropagation(); handleStartOrder(order.id); }}
                      >
                        <Text>继续</Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            {workerTasks.pending.length > 0 && (
              <View className={styles.taskGroup}>
                <View className={styles.taskGroupHeader}>
                  <Text className={classnames(styles.taskGroupTitle, styles.taskPending)}>
                    📋 待处理
                  </Text>
                  <Text className={styles.taskGroupCount}>{workerTasks.pending.length}单</Text>
                </View>
                {workerTasks.pending.slice(0, 5).map((order) => (
                  <View key={order.id} className={styles.taskCard} onClick={() => goToOrderDetail(order.id)}>
                    <View style={{ flex: 1 }}>
                      <Text className={styles.taskTitle}>{order.title}</Text>
                      <Text className={styles.taskMeta}>
                        {getRepairTypeLabel(order.type)} · {order.ownerInfo.building}{order.ownerInfo.room}
                      </Text>
                    </View>
                    <View
                      className={classnames(styles.taskBtn, styles.taskBtnPrimary)}
                      onClick={(e) => { e.stopPropagation(); handleStartOrder(order.id); }}
                    >
                      <Text>开始</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {workerTasks.pending.length === 0 && workerTasks.processing.length === 0 && (
              <EmptyState
                title="今日暂无任务"
                description="休息一下，等待新的工单分配"
              />
            )}

            <View className={styles.viewAllBtn} onClick={goToOrders}>
              <Text>查看全部工单 ›</Text>
            </View>
          </View>
        )}

        {userInfo.role !== 'worker' && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                {userInfo.role === 'owner' ? '我的工单' : '最新工单'}
              </Text>
              <Text className={styles.moreLink} onClick={goToOrders}>
                查看全部 ›
              </Text>
            </View>
            {displayOrders.length > 0 ? (
              displayOrders.map((order) => <OrderCard key={order.id} order={order} />)
            ) : (
              <EmptyState
                title="暂无工单记录"
                description={userInfo.role === 'owner' ? '点击上方快速报修提交申请' : '等待新的工单分配'}
              />
            )}
          </View>
        )}

        {(userInfo.role === 'manager' || userInfo.role === 'customer_service') && (
          <View className={styles.section} onClick={goToTimeout}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>超时提醒</Text>
              <Text className={styles.moreLink}>
                查看详情 ›
              </Text>
            </View>
            <View className={styles.timeoutTip}>
              <Text className={styles.timeoutTipText}>⏰ 查看超时未派单和处理超时的工单，及时处理避免投诉</Text>
            </View>
          </View>
        )}

        {userInfo.role === 'manager' && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>数据统计</Text>
              <Text className={styles.moreLink} onClick={goToStatistics}>
                查看详情 ›
              </Text>
            </View>
            <View className={styles.emptyTip} onClick={goToStatistics}>
              <Text className={styles.emptyTipText}>📊 点击查看完整报表数据</Text>
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.roleSwitcher}>
            <Text className={styles.switcherTitle}>切换角色体验</Text>
            <View className={styles.roleOptions}>
              {USER_ROLE_OPTIONS.map((role) => (
                <View
                  key={role.value}
                  className={classnames(
                    styles.roleOption,
                    userInfo.role === role.value && styles.roleOptionActive,
                  )}
                  onClick={() => setRole(role.value)}
                >
                  <Text>{role.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
