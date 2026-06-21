import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useOrderStore } from '@/store/useOrderStore';
import StatCard from '@/components/StatCard';
import { getRepairTypeLabel, getOrderStatusLabel } from '@/utils/constants';
import { formatDuration, formatDateTime } from '@/utils/format';
import styles from './index.module.scss';

const StatisticsPage: React.FC = () => {
  const { orders, getStatistics } = useOrderStore();
  const data = useMemo(() => getStatistics(), [orders]);
  const maxTypeCount = Math.max(...data.typeStatistics.map((t) => t.count), 1);

  const generateCSV = (): string => {
    const headers = [
      '工单号',
      '报修类型',
      '报修标题',
      '报修描述',
      '工单状态',
      '业主姓名',
      '联系电话',
      '房屋信息',
      '提交时间',
      '派单时间',
      '开始处理时间',
      '完成时间',
      '响应时长(分钟)',
      '处理时长(分钟)',
      '维修师傅',
      '维修说明',
      '满意度评分',
      '评价内容',
    ];

    const rows = orders.map((order) => [
      order.orderNo,
      getRepairTypeLabel(order.type),
      order.title || '',
      (order.description || '').replace(/[\r\n]/g, ' '),
      getOrderStatusLabel(order.status),
      order.ownerInfo?.name || '',
      order.ownerInfo?.phone || '',
      `${order.ownerInfo?.building || ''}${order.ownerInfo?.room || ''}`,
      order.createTime || '',
      order.assignTime || '',
      order.startTime || '',
      order.completeTime || '',
      order.responseMinutes ?? '',
      order.processMinutes ?? '',
      order.workerName || '',
      (order.resultDescription || '').replace(/[\r\n]/g, ' '),
      order.rating || '',
      (order.ratingComment || '').replace(/[\r\n]/g, ' '),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => {
          const str = String(cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      ),
    ].join('\n');

    return '\uFEFF' + csvContent;
  };

  const handleExport = () => {
    Taro.showModal({
      title: '导出报表',
      content: `确认导出 ${orders.length} 条报修工单明细报表？\n报表包含工单详情、处理时长、满意度评价等信息。`,
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '生成报表中...' });
          setTimeout(() => {
            try {
              const csvContent = generateCSV();
              const fileName = `报修工单明细_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;

              const fs = Taro.getFileSystemManager();
              const filePath = `${Taro.env.USER_DATA_PATH}/${fileName}`;

              fs.writeFile({
                filePath,
                data: csvContent,
                encoding: 'utf8',
                success: () => {
                  Taro.hideLoading();
                  Taro.showModal({
                    title: '导出成功',
                    content: `报表已生成：${fileName}\n共 ${orders.length} 条记录\n是否打开文件？`,
                    confirmText: '打开',
                    cancelText: '知道了',
                    success: (modalRes) => {
                      if (modalRes.confirm) {
                        Taro.openDocument({
                          filePath,
                          showMenu: true,
                          fail: (err) => {
                            console.error('打开文档失败:', err);
                            Taro.showToast({ title: '打开失败', icon: 'none' });
                          },
                        });
                      }
                    },
                  });
                },
                fail: (err) => {
                  console.error('写入文件失败:', err);
                  Taro.hideLoading();
                  Taro.showToast({ title: '生成失败', icon: 'none' });
                },
              });
            } catch (e) {
              console.error('导出异常:', e);
              Taro.hideLoading();
              Taro.showToast({ title: '导出失败', icon: 'none' });
            }
          }, 800);
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

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>数据说明</Text>
        </View>
        <Text className={styles.noteText}>
          · 数据基于已完成的工单自动计算
        </Text>
        <Text className={styles.noteText}>
          · 响应时间 = 派单时间 - 提交时间
        </Text>
        <Text className={styles.noteText}>
          · 处理时间 = 完成时间 - 开始处理时间
        </Text>
        <Text className={styles.noteText}>
          · 统计数据随工单状态实时更新
        </Text>
      </View>
    </ScrollView>
  );
};

export default StatisticsPage;
