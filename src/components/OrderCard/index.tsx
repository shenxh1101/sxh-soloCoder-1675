import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import type { RepairOrder } from '@/types';
import { getRepairTypeLabel } from '@/utils/constants';
import { getRelativeTime } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import styles from './index.module.scss';

interface OrderCardProps {
  order: RepairOrder;
  onClick?: () => void;
  className?: string;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick, className }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` });
    }
  };

  return (
    <View className={classnames(styles.card, className)} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <Text className={styles.orderNo}>#{order.orderNo.slice(-8)}</Text>
        <StatusTag status={order.status} />
      </View>

      <Text className={styles.title}>{order.title}</Text>

      <View className={styles.meta}>
        <View className={styles.typeTag}>{getRepairTypeLabel(order.type)}</View>
        {order.workerName && (
          <Text className={styles.metaItem}>维修: {order.workerName}</Text>
        )}
      </View>

      <Text className={styles.description}>{order.description}</Text>

      {order.images.length > 0 && (
        <View className={styles.images}>
          {order.images.slice(0, 3).map((img, idx) => (
            <View className={styles.imageItem} key={idx}>
              <Image className={styles.image} src={img} mode="aspectFill" />
            </View>
          ))}
        </View>
      )}

      <View className={styles.cardFooter}>
        <Text className={styles.location}>
          {order.ownerInfo.building} {order.ownerInfo.room}
        </Text>
        <Text className={styles.time}>{getRelativeTime(order.createTime)}</Text>
      </View>
    </View>
  );
};

export default OrderCard;
