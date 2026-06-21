import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  value: string | number;
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  variant = 'default',
  className,
}) => {
  return (
    <View
      className={classnames(
        styles.statCard,
        variant !== 'default' && styles[variant],
        className,
      )}
    >
      <Text className={styles.statValue}>{value}</Text>
      <Text className={styles.statLabel}>{label}</Text>
    </View>
  );
};

export default StatCard;
