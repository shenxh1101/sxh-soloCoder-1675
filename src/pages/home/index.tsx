import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/useUserStore';
import { useOrderStore } from '@/store/useOrderStore';
import { USER_ROLE_OPTIONS, getUserRoleLabel } from '@/utils/constants';
import { formatDuration } from '@/utils/format';
import OrderCard from '@/components/OrderCard';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const { userInfo, setRole } = useUserStore();
  const { orders, getOrdersByStatus, getOrdersByWorker, getOrdersByOwner } = useOrderStore();

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

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              {userInfo.role === 'owner' ? '我的工单' : userInfo.role === 'worker' ? '我的待办' : '最新工单'}
            </Text>
            <Text className={styles.moreLink} onClick={goToOrders}>
              查看全部 ›
            </Text>
          </View>
          {displayOrders.length > 0 ? (
            displayOrders.map((order) => <OrderCard key={order.id} order={order} />)
          ) : (
            <EmptyState
              title={userInfo.role === 'worker' ? '暂无待办工单' : '暂无工单记录'}
              description={userInfo.role === 'owner' ? '点击上方快速报修提交申请' : '等待新的工单分配'}
            />
          )}
        </View>

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
