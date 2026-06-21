import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { TimelineItem } from '@/types';
import { formatDateTime } from '@/utils/format';
import styles from './index.module.scss';

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
  return (
    <View className={classnames(styles.timeline, className)}>
      {items.map((item, idx) => (
        <View
          className={classnames(styles.timelineItem, 'timeline-item')}
          key={idx}
        >
          <View className={styles.dot} />
          <View className={styles.line} />
          <View className={styles.content}>
            <Text className={styles.description}>{item.description}</Text>
            <View className={styles.meta}>
              <Text className={styles.time}>{formatDateTime(item.time)}</Text>
              {item.operatorName && (
                <Text className={styles.operator}>— {item.operatorName}</Text>
              )}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

export default Timeline;
