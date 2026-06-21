import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { OrderStatus } from '@/types';
import { getOrderStatusLabel, getOrderStatusStyle } from '@/utils/constants';
import styles from './index.module.scss';

interface StatusTagProps {
  status: OrderStatus;
  className?: string;
}

const StatusTag: React.FC<StatusTagProps> = ({ status, className }) => {
  const style = getOrderStatusStyle(status);
  return (
    <View
      className={classnames(styles.statusTag, className)}
      style={{ backgroundColor: style.bgColor, color: style.textColor }}
    >
      <Text>{getOrderStatusLabel(status)}</Text>
    </View>
  );
};

export default StatusTag;
