import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import type { RepairType } from '@/types';
import { useOrderStore } from '@/store/useOrderStore';
import { REPAIR_TYPE_OPTIONS } from '@/utils/constants';
import WorkerCard from '@/components/WorkerCard';
import styles from './index.module.scss';

const WorkerSelectPage: React.FC = () => {
  const router = useRouter();
  const { orders, getWorkerLoad, assignOrder } = useOrderStore();
  const orderId = router.params.orderId || '';
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [skillFilter, setSkillFilter] = useState<RepairType | 'all'>('all');

  const workerLoads = useMemo(() => getWorkerLoad(), [orders]);

  const filteredWorkers = skillFilter === 'all'
    ? workerLoads
    : workerLoads.filter((w) => w.skills.includes(skillFilter));

  const sortedWorkers = [...filteredWorkers].sort((a, b) => a.totalLoad - b.totalLoad);

  useDidShow(() => {
    console.log('[WorkerSelect] 页面显示，刷新师傅负载数据');
  });

  const handleAssign = () => {
    if (!selectedWorkerId) {
      Taro.showToast({ title: '请选择维修师傅', icon: 'none' });
      return;
    }
    const worker = workerLoads.find((w) => w.id === selectedWorkerId);
    Taro.showModal({
      title: '确认派单',
      content: `确定将工单派给${worker?.name || '该师傅'}吗？\n当前负载：待办${worker?.pendingCount || 0}单，进行中${worker?.processingCount || 0}单`,
      success: (res) => {
        if (res.confirm) {
          assignOrder(orderId, selectedWorkerId);
          Taro.showToast({ title: '派单成功', icon: 'success' });
          setTimeout(() => {
            Taro.navigateBack();
          }, 1000);
        }
      },
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.tip}>
        <Text>💡 已按当前负载从低到高排序，建议选择负载较低、技能匹配的维修师傅</Text>
      </View>

      <View className={styles.skillFilter}>
        <View
          className={classnames(
            styles.filterChip,
            skillFilter === 'all' && styles.filterChipActive,
          )}
          onClick={() => setSkillFilter('all')}
        >
          <Text>全部技能</Text>
        </View>
        {REPAIR_TYPE_OPTIONS.map((opt) => (
          <View
            key={opt.value}
            className={classnames(
              styles.filterChip,
              skillFilter === opt.value && styles.filterChipActive,
            )}
            onClick={() => setSkillFilter(opt.value)}
          >
            <Text>{opt.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.workerList}>
        {sortedWorkers.map((worker) => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            selected={selectedWorkerId === worker.id}
            onClick={() => setSelectedWorkerId(worker.id)}
          />
        ))}
        {sortedWorkers.length === 0 && (
          <View style={{ padding: 64, textAlign: 'center' }}>
            <Text style={{ color: '#86909c' }}>暂无符合条件的维修师傅</Text>
          </View>
        )}
      </View>

      <View className={styles.footerBar}>
        <View
          className={classnames(
            styles.btn,
            styles.btnPrimary,
            !selectedWorkerId && styles.btnDisabled,
          )}
          onClick={selectedWorkerId ? handleAssign : undefined}
        >
          <Text>{selectedWorkerId ? '确认派单' : '请选择师傅'}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default WorkerSelectPage;
