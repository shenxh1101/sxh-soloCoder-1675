import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, Textarea, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/useUserStore';
import { useOrderStore } from '@/store/useOrderStore';
import { getRepairTypeLabel } from '@/utils/constants';
import { formatDateTime, formatDuration, formatPhone } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import Timeline from '@/components/Timeline';
import styles from './index.module.scss';

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const { userInfo } = useUserStore();
  const { getOrderById, startOrder, completeOrder, cancelOrder } = useOrderStore();
  const [order, setOrder] = useState(getOrderById(router.params.id || ''));
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [resultDescription, setResultDescription] = useState('');
  const [resultImages, setResultImages] = useState<string[]>([]);

  useEffect(() => {
    const id = router.params.id || '';
    setOrder(getOrderById(id));
  }, [router.params.id, getOrderById]);

  if (!order) {
    return (
      <View className={styles.page} style={{ padding: 100, textAlign: 'center' }}>
        <Text style={{ color: '#86909c' }}>工单不存在</Text>
      </View>
    );
  }

  const handleAssign = () => {
    Taro.navigateTo({ url: `/pages/worker-select/index?orderId=${order.id}` });
  };

  const handleStart = () => {
    Taro.showModal({
      title: '确认开始处理',
      content: '确认开始处理此工单吗？开始后将计时。',
      success: (res) => {
        if (res.confirm) {
          startOrder(order.id);
          setOrder(getOrderById(order.id));
          Taro.showToast({ title: '已开始处理', icon: 'success' });
        }
      },
    });
  };

  const handleComplete = () => {
    setShowCompleteForm(true);
  };

  const chooseResultImages = () => {
    if (resultImages.length >= 6) {
      Taro.showToast({ title: '最多上传6张图片', icon: 'none' });
      return;
    }
    Taro.chooseImage({
      count: 6 - resultImages.length,
      sizeType: ['compressed'],
      success: (res) => {
        setResultImages([...resultImages, ...res.tempFilePaths.slice(0, 6 - resultImages.length)]);
      },
    });
  };

  const submitComplete = () => {
    if (!resultDescription.trim()) {
      Taro.showToast({ title: '请填写维修说明', icon: 'none' });
      return;
    }
    const mockImages = resultImages.length > 0
      ? resultImages
      : [`https://picsum.photos/id/${Math.floor(Math.random() * 100)}/600/400`];
    completeOrder(order.id, mockImages, resultDescription.trim());
    setOrder(getOrderById(order.id));
    setShowCompleteForm(false);
    Taro.showToast({ title: '工单已完成', icon: 'success' });
  };

  const handleCancel = () => {
    Taro.showModal({
      title: '确认取消工单',
      content: '确定要取消此工单吗？',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          cancelOrder(order.id);
          setOrder(getOrderById(order.id));
          Taro.showToast({ title: '工单已取消', icon: 'none' });
        }
      },
    });
  };

  const handleRate = () => {
    Taro.navigateTo({ url: `/pages/rating/index?id=${order.id}` });
  };

  const renderFooterButtons = () => {
    if (userInfo.role === 'customer_service') {
      if (order.status === 'pending') {
        return (
          <View className={styles.footerBar}>
            <View
              className={classnames(styles.btn, styles.btnPrimary)}
              onClick={handleAssign}
            >
              <Text>立即派单</Text>
            </View>
          </View>
        );
      }
    }
    if (userInfo.role === 'worker') {
      if (order.status === 'assigned') {
        return (
          <View className={styles.footerBar}>
            <View
              className={classnames(styles.btn, styles.btnPrimary)}
              onClick={handleStart}
            >
              <Text>开始处理</Text>
            </View>
          </View>
        );
      }
      if (order.status === 'processing') {
        return (
          <View className={styles.footerBar}>
            <View
              className={classnames(styles.btn, styles.btnSuccess)}
              onClick={handleComplete}
            >
              <Text>完成维修</Text>
            </View>
          </View>
        );
      }
    }
    if (userInfo.role === 'owner') {
      if (order.status === 'pending') {
        return (
          <View className={styles.footerBar}>
            <View
              className={classnames(styles.btn, styles.btnDanger, styles.btnHalf)}
              onClick={handleCancel}
            >
              <Text>取消工单</Text>
            </View>
            <View
              className={classnames(styles.btn, styles.btnPrimary, styles.btnHalf)}
              onClick={() => Taro.switchTab({ url: '/pages/repair/index' })}
            >
              <Text>再次报修</Text>
            </View>
          </View>
        );
      }
      if (order.status === 'completed' && !order.rating) {
        return (
          <View className={styles.footerBar}>
            <View
              className={classnames(styles.btn, styles.btnPrimary)}
              onClick={handleRate}
            >
              <Text>去评价</Text>
            </View>
          </View>
        );
      }
    }
    return null;
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.section}>
        <View className={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text className={styles.orderNo}>工单号：{order.orderNo}</Text>
            <Text className={styles.title}>{order.title}</Text>
          </View>
          <StatusTag status={order.status} />
        </View>
        <View className={styles.metaRow}>
          <View className={styles.typeTag}>{getRepairTypeLabel(order.type)}</View>
          <Text className={styles.metaItem}>📍 {order.ownerInfo.building} {order.ownerInfo.room}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>问题描述</Text>
        <Text className={styles.description}>{order.description}</Text>
        {order.images.length > 0 && (
          <View className={styles.imageList}>
            {order.images.map((img, idx) => (
              <View className={styles.imageItem} key={idx}>
                <Image className={styles.image} src={img} mode="aspectFill" />
              </View>
            ))}
          </View>
        )}
      </View>

      {order.status === 'completed' && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>维修结果</Text>
          <Text className={styles.description}>{order.resultDescription || '无'}</Text>
          {order.resultImages.length > 0 && (
            <View className={styles.imageList}>
              {order.resultImages.map((img, idx) => (
                <View className={styles.imageItem} key={idx}>
                  <Image className={styles.image} src={img} mode="aspectFill" />
                </View>
              ))}
            </View>
          )}
          {order.rating && (
            <View className={styles.ratingBox} style={{ marginTop: 24 }}>
              <View className={styles.ratingStars}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Text key={idx} className={styles.star}>
                    {idx < (order.rating || 0) ? '⭐' : '☆'}
                  </Text>
                ))}
              </View>
              {order.ratingComment && (
                <Text className={styles.ratingComment}>{order.ratingComment}</Text>
              )}
            </View>
          )}
        </View>
      )}

      {showCompleteForm && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>填写维修结果</Text>
          <View style={{ marginBottom: 16 }}>
            <Text className={styles.infoLabel} style={{ display: 'block', marginBottom: 8 }}>维修说明 *</Text>
            <Textarea
              className={styles.description}
              placeholder="请描述维修过程和结果..."
              value={resultDescription}
              maxlength={500}
              onInput={(e) => setResultDescription(e.detail.value)}
            />
          </View>
          <View>
            <Text className={styles.infoLabel} style={{ display: 'block', marginBottom: 8 }}>维修后照片</Text>
            <View className={styles.imageList}>
              {resultImages.map((img, idx) => (
                <View className={styles.imageItem} key={idx}>
                  <Image className={styles.image} src={img} mode="aspectFill" />
                </View>
              ))}
              {resultImages.length < 6 && (
                <View
                  className={styles.imageItem}
                  onClick={chooseResultImages}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2rpx dashed #E5E6EB',
                    backgroundColor: '#F5F6F7',
                  }}
                >
                  <Text style={{ fontSize: 40, color: '#86909C' }}>+</Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ display: 'flex', gap: 16, marginTop: 24 }}>
            <View
              className={classnames(styles.btn, styles.btnHalf, styles.btnSecondary)}
              onClick={() => setShowCompleteForm(false)}
            >
              <Text>取消</Text>
            </View>
            <View
              className={classnames(styles.btn, styles.btnHalf, styles.btnSuccess)}
              onClick={submitComplete}
            >
              <Text>提交完成</Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>业主信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>姓名</Text>
          <Text className={styles.infoValue}>{order.ownerInfo.name}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>联系电话</Text>
          <Text className={styles.infoValue}>{formatPhone(order.ownerInfo.phone)}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>房屋信息</Text>
          <Text className={styles.infoValue}>{order.ownerInfo.building} {order.ownerInfo.room}</Text>
        </View>
      </View>

      {order.workerName && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>维修师傅</Text>
          <View className={styles.workerCard}>
            <View className={styles.workerAvatar}>
              <Image
                className={styles.workerAvatarImg}
                src={`https://picsum.photos/id/${100 + parseInt(order.workerId?.slice(1) || '0')}/200/200`}
                mode="aspectFill"
              />
            </View>
            <View className={styles.workerInfo}>
              <Text className={styles.workerName}>{order.workerName}</Text>
              <Text className={styles.workerPhone}>{order.workerPhone ? formatPhone(order.workerPhone) : ''}</Text>
            </View>
          </View>
        </View>
      )}

      {(order.responseMinutes || order.processMinutes) && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>处理时效</Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>响应时间</Text>
            <Text className={styles.infoValue}>{formatDuration(order.responseMinutes)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>处理时间</Text>
            <Text className={styles.infoValue}>{formatDuration(order.processMinutes)}</Text>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>处理进度</Text>
        <Timeline items={order.timeline} />
      </View>

      {renderFooterButtons()}
    </ScrollView>
  );
};

export default OrderDetailPage;
