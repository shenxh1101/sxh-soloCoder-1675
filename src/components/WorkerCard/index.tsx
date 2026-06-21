import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import type { WorkerInfo } from '@/types';
import { getRepairTypeLabel } from '@/utils/constants';
import { formatPhone } from '@/utils/format';
import styles from './index.module.scss';

interface WorkerCardProps {
  worker: WorkerInfo & { pendingCount?: number; processingCount?: number; completedCount?: number; completedToday?: number; totalLoad?: number };
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  selected = false,
  onClick,
  className,
}) => {
  const pendingCount = worker.pendingCount ?? 0;
  const processingCount = worker.processingCount ?? 0;
  const completedCount = worker.completedToday ?? worker.completedCount ?? 0;
  const totalLoad = worker.totalLoad ?? pendingCount + processingCount;
  const loadPercent = Math.min((totalLoad / 6) * 100, 100);
  const isHighLoad = loadPercent >= 60;

  return (
    <View
      className={classnames(
        styles.card,
        selected && styles.selected,
        className,
      )}
      onClick={onClick}
    >
      <View className={styles.avatar}>
        <Image
          className={styles.avatarImg}
          src={worker.avatar || 'https://picsum.photos/id/1005/200/200'}
          mode="aspectFill"
        />
      </View>

      <View className={styles.info}>
        <View className={styles.header}>
          <Text className={styles.name}>{worker.name}</Text>
          {totalLoad >= 4 && (
            <View className={styles.loadBadge}>
              <Text className={styles.loadBadgeText}>高负载</Text>
            </View>
          )}
        </View>
        <Text className={styles.phone}>{formatPhone(worker.phone)}</Text>

        <View className={styles.skills}>
          {worker.skills.map((skill) => (
            <View className={styles.skillTag} key={skill}>
              <Text>{getRepairTypeLabel(skill)}</Text>
            </View>
          ))}
        </View>

        <View className={styles.stats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{pendingCount}</Text>
            <Text className={styles.statLabel}>待办</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{processingCount}</Text>
            <Text className={styles.statLabel}>进行中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{completedCount}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
        </View>

        <View className={styles.loadBar}>
          <View
            className={classnames(styles.loadFill, isHighLoad && styles.loadHigh)}
            style={{ width: `${loadPercent}%` }}
          />
        </View>
      </View>
    </View>
  );
};

export default WorkerCard;
