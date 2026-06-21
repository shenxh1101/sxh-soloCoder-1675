import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useOrderStore } from '@/store/useOrderStore';
import styles from './index.module.scss';

const ratingLabels = ['', '非常差', '较差', '一般', '满意', '非常满意'];

const RatingPage: React.FC = () => {
  const router = useRouter();
  const { getOrderById, rateOrder } = useOrderStore();
  const orderId = router.params.id || '';
  const order = getOrderById(orderId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  if (!order) {
    return (
      <View className={styles.page} style={{ padding: 100, textAlign: 'center' }}>
        <Text style={{ color: '#86909c' }}>工单不存在</Text>
      </View>
    );
  }

  const displayRating = hoverRating || rating;

  const handleSubmit = () => {
    if (rating === 0) {
      Taro.showToast({ title: '请选择评分', icon: 'none' });
      return;
    }
    rateOrder(orderId, rating, comment.trim());
    Taro.showToast({ title: '评价成功', icon: 'success' });
    setTimeout(() => {
      Taro.navigateBack();
    }, 1000);
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.section}>
        <View className={styles.orderInfo}>
          <View className={styles.workerAvatar}>
            <Image
              className={styles.workerAvatarImg}
              src={`https://picsum.photos/id/${100 + parseInt(order.workerId?.slice(1) || '0')}/200/200`}
              mode="aspectFill"
            />
          </View>
          <View className={styles.orderMeta}>
            <Text className={styles.orderTitle}>{order.title}</Text>
            <Text className={styles.workerName}>维修师傅：{order.workerName}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>服务评分</Text>
        <View className={styles.ratingArea}>
          <View className={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Text
                key={idx}
                className={styles.star}
                onTouchStart={() => setHoverRating(idx + 1)}
                onTouchEnd={() => {
                  setRating(idx + 1);
                  setHoverRating(0);
                }}
                onClick={() => setRating(idx + 1)}
              >
                {idx < displayRating ? '⭐' : '☆'}
              </Text>
            ))}
          </View>
          <Text className={styles.ratingText}>{ratingLabels[displayRating] || '点击星星评分'}</Text>
        </View>

        <View className={styles.commentArea}>
          <Textarea
            className={styles.textarea}
            placeholder="请分享您的服务体验（选填）"
            value={comment}
            maxlength={200}
            onInput={(e) => setComment(e.detail.value)}
          />
          <Text className={styles.tip}>{comment.length}/200</Text>
        </View>
      </View>

      <View className={styles.footerBar}>
        <View
          className={classnames(
            styles.btn,
            styles.btnPrimary,
            rating === 0 && styles.btnDisabled,
          )}
          onClick={rating > 0 ? handleSubmit : undefined}
        >
          <Text>提交评价</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default RatingPage;
