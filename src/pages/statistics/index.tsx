import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { statisticsData } from '@/data/statistics';
import StatCard from '@/components/StatCard';
import { formatDuration } from '@/utils/format';
import styles from './index.module.scss';

const StatisticsPage: React.FC = () => {
  const data = statisticsData;
  const maxTypeCount = Math.max(...data.typeStatistics.map((t) => t.count), 1);

  const handleExport = () => {
    Taro.showModal({
      title: '导出报表',
      content: '确认导出报修工单明细报表？报表将包含工单详情、处理时长、满意度评价等信息。',
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '生成报表中...' });
          setTimeout(() => {
            Taro.hideLoading();
            Taro.showToast({ title: '报表已生成', icon: 'success' });
          }, 1500);
        }
      },
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.statsGrid}>
        <StatCard value={data.totalOrders} label="总工单数" variant="primary" />
        <StatCard value={data.completedOrders} label="已完成" variant="success" />
        <StatCard value={data.pendingOrders} label="待处理" variant="warning" />
        <StatCard value={data.processingOrders} label="处理中" variant="primary" />
      </View>

      <View className={styles.statsGrid} style={{ paddingTop: 0 }}>
        <StatCard
          value={formatDuration(data.avgResponseMinutes)}
          label="平均响应时间"
          variant="default"
        />
        <StatCard
          value={formatDuration(data.avgProcessMinutes)}
          label="平均处理时间"
          variant="default"
        />
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>报修类型统计</Text>
          <View className={styles.exportBtn} onClick={handleExport}>
            <Text>📥 导出报表</Text>
          </View>
        </View>
        {data.typeStatistics.map((item) => (
          <View key={item.type}>
            <View className={styles.typeRow}>
              <Text className={styles.typeName}>{item.typeName}</Text>
              <View className={styles.barWrap}>
                <View
                  className={styles.barFill}
                  style={{ width: `${(item.count / maxTypeCount) * 100}%` }}
                />
              </View>
              <Text className={styles.typeCount}>{item.count}</Text>
            </View>
            <View className={styles.typeMeta}>
              <Text>响应: {formatDuration(item.avgResponseMinutes)}</Text>
              <Text>处理: {formatDuration(item.avgProcessMinutes)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>维修师傅工作量排行</Text>
        </View>
        {data.workerStatistics
          .sort((a, b) => b.completedCount - a.completedCount)
          .map((item, idx) => (
            <View className={styles.workerRow} key={item.workerId}>
              <View
                className={classnames(
                  styles.rank,
                  idx === 0 && styles.rankTop1,
                  idx === 1 && styles.rankTop2,
                  idx === 2 && styles.rankTop3,
                )}
              >
                <Text>{idx + 1}</Text>
              </View>
              <View className={styles.workerInfo}>
                <Text className={styles.workerName}>{item.workerName}</Text>
                <Text className={styles.workerMeta}>
                  完成率: {item.totalCount > 0 ? Math.round((item.completedCount / item.totalCount) * 100) : 0}%
                  {' · '}
                  平均耗时: {formatDuration(item.avgProcessMinutes)}
                </Text>
              </View>
              <View className={styles.workerStats}>
                <Text className={styles.workerCount}>{item.completedCount}</Text>
                <Text className={styles.workerLabel}>已完成</Text>
              </View>
            </View>
          ))}
      </View>
    </ScrollView>
  );
};

export default StatisticsPage;
