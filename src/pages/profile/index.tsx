import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useUserStore } from '@/store/useUserStore';
import { useOrderStore } from '@/store/useOrderStore';
import { getUserRoleLabel } from '@/utils/constants';
import styles from './index.module.scss';

const ProfilePage: React.FC = () => {
  const { userInfo, setRole } = useUserStore();
  const { orders, getOrdersByOwner, getOrdersByWorker } = useOrderStore();

  const stats = useMemo(() => {
    if (userInfo.role === 'owner') {
      const myOrders = getOrdersByOwner(userInfo.phone);
      return {
        total: myOrders.length,
        processing: myOrders.filter((o) => ['pending', 'assigned', 'processing'].includes(o.status)).length,
        completed: myOrders.filter((o) => o.status === 'completed').length,
      };
    } else if (userInfo.role === 'worker') {
      const myOrders = getOrdersByWorker('w001');
      return {
        total: myOrders.length,
        processing: myOrders.filter((o) => ['assigned', 'processing'].includes(o.status)).length,
        completed: myOrders.filter((o) => o.status === 'completed').length,
      };
    }
    return { total: 0, processing: 0, completed: 0 };
  }, [userInfo, orders, getOrdersByOwner, getOrdersByWorker]);

  const goToOrders = () => Taro.switchTab({ url: '/pages/orders/index' });
  const goToStatistics = () => Taro.navigateTo({ url: '/pages/statistics/index' });
  const goToRepair = () => Taro.switchTab({ url: '/pages/repair/index' });

  const switchRole = () => {
    const roles: Array<'owner' | 'customer_service' | 'worker' | 'manager'> = ['owner', 'customer_service', 'worker', 'manager'];
    const currentIndex = roles.indexOf(userInfo.role);
    const nextIndex = (currentIndex + 1) % roles.length;
    setRole(roles[nextIndex]);
    Taro.showToast({ title: `已切换为${getUserRoleLabel(roles[nextIndex])}`, icon: 'none' });
  };

  const ownerMenu = [
    { icon: '📋', label: '我的工单', iconClass: styles.iconBlue, onClick: goToOrders },
    { icon: '🛠️', label: '在线报修', iconClass: styles.iconGreen, onClick: goToRepair },
    { icon: '📞', label: '联系客服', iconClass: styles.iconOrange, onClick: () => Taro.showToast({ title: '客服电话: 400-xxx-xxxx', icon: 'none' }) },
  ];

  const staffMenu = [
    { icon: '📋', label: '工单列表', iconClass: styles.iconBlue, onClick: goToOrders },
    { icon: '📊', label: '数据统计', iconClass: styles.iconPurple, onClick: goToStatistics },
    { icon: '🔄', label: '切换角色', iconClass: styles.iconGray, onClick: switchRole },
  ];

  const menuList = userInfo.role === 'owner' ? ownerMenu : staffMenu;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.userCard}>
          <View className={styles.avatar}>
            <Image
              className={styles.avatarImg}
              src={userInfo.avatar || 'https://picsum.photos/id/1025/200/200'}
              mode="aspectFill"
            />
          </View>
          <View className={styles.userInfo}>
            <Text className={styles.userName}>{userInfo.name}</Text>
            <View className={styles.userMeta}>
              <View className={styles.roleBadge}>{getUserRoleLabel(userInfo.role)}</View>
              <Text className={styles.userPhone}>{userInfo.phone}</Text>
            </View>
            {userInfo.building && (
              <View className={styles.userMeta} style={{ marginTop: 8 }}>
                <Text className={styles.userPhone}>
                  {userInfo.building} {userInfo.room}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.statsCard}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>全部工单</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.processing}</Text>
            <Text className={styles.statLabel}>处理中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.completed}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
        </View>

        <View className={styles.menuCard}>
          <Text className={styles.menuGroupTitle}>常用功能</Text>
          {menuList.map((item, idx) => (
            <View key={idx} className={styles.menuItem} onClick={item.onClick}>
              <View className={`${styles.menuIcon} ${item.iconClass}`}>
                <Text>{item.icon}</Text>
              </View>
              <Text className={styles.menuLabel}>{item.label}</Text>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>

        <View className={styles.menuCard}>
          <Text className={styles.menuGroupTitle}>其他</Text>
          <View
            className={styles.menuItem}
            onClick={() => Taro.showToast({ title: '已是最新版本', icon: 'none' })}
          >
            <View className={`${styles.menuIcon} ${styles.iconGray}`}>
              <Text>ℹ️</Text>
            </View>
            <Text className={styles.menuLabel}>关于我们</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>

        <Text className={styles.version}>物业报修管理 v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

export default ProfilePage;
