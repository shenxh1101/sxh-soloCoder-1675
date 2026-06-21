import React, { useState, useEffect } from 'react';
import { View, Text, Input, Textarea, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import type { RepairType } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useOrderStore } from '@/store/useOrderStore';
import { REPAIR_TYPE_OPTIONS } from '@/utils/constants';
import styles from './index.module.scss';

const typeIcons: Record<RepairType, string> = {
  water_electric: '💧',
  access_control: '🔐',
  elevator: '🛗',
  public_facility: '🏟️',
  other: '🔧',
};

const RepairPage: React.FC = () => {
  const router = useRouter();
  const { userInfo } = useUserStore();
  const { createOrder } = useOrderStore();

  const [type, setType] = useState<RepairType>('water_electric');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const typeParam = router.params.type as RepairType;
    if (typeParam && REPAIR_TYPE_OPTIONS.some((opt) => opt.value === typeParam)) {
      setType(typeParam);
    }
  }, [router.params.type]);

  const canSubmit = title.trim() && description.trim();

  const chooseImages = () => {
    if (images.length >= 6) {
      Taro.showToast({ title: '最多上传6张图片', icon: 'none' });
      return;
    }
    Taro.chooseImage({
      count: 6 - images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFilePaths.slice(0, 6 - images.length);
        setImages([...images, ...newImages]);
      },
      fail: (err) => {
        console.error('[Repair] 选择图片失败:', err);
      },
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!userInfo.building || !userInfo.room) {
      Taro.showToast({ title: '请先完善房屋信息', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      const mockImages = images.length > 0
        ? images
        : [`https://picsum.photos/id/${Math.floor(Math.random() * 100)}/600/400`];

      createOrder({
        title: title.trim(),
        description: description.trim(),
        type,
        images: mockImages,
        ownerInfo: {
          name: userInfo.name,
          phone: userInfo.phone,
          building: userInfo.building,
          room: userInfo.room,
        },
      });

      Taro.showToast({ title: '提交成功', icon: 'success' });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/orders/index' });
      }, 1500);
    } catch (err) {
      console.error('[Repair] 提交失败:', err);
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.form}>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>选择报修类型</Text>
          <View className={styles.typeGrid}>
            {REPAIR_TYPE_OPTIONS.map((opt) => (
              <View
                key={opt.value}
                className={classnames(
                  styles.typeCard,
                  type === opt.value && styles.typeCardActive,
                )}
                onClick={() => setType(opt.value)}
              >
                <Text className={styles.typeIcon}>{typeIcons[opt.value]}</Text>
                <Text className={styles.typeLabel}>{opt.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.formGroup}>
            <Text className={classnames(styles.label, styles.labelRequired)}>报修标题</Text>
            <Input
              className={styles.input}
              placeholder="请简要描述问题（如：客厅灯不亮）"
              value={title}
              maxlength={50}
              onInput={(e) => setTitle(e.detail.value)}
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={classnames(styles.label, styles.labelRequired)}>详细描述</Text>
            <Textarea
              className={styles.textarea}
              placeholder="请详细描述问题情况，方便维修师傅提前准备..."
              value={description}
              maxlength={500}
              onInput={(e) => setDescription(e.detail.value)}
            />
            <Text className={styles.tip}>已输入 {description.length}/500 字</Text>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>上传图片（最多6张）</Text>
            <View className={styles.imagesGrid}>
              {images.map((img, idx) => (
                <View className={styles.imageItem} key={idx}>
                  <Image className={styles.image} src={img} mode="aspectFill" />
                  <View className={styles.imageDelete} onClick={() => removeImage(idx)}>
                    <Text>×</Text>
                  </View>
                </View>
              ))}
              {images.length < 6 && (
                <View className={styles.imageItem}>
                  <View className={styles.imageAdd} onClick={chooseImages}>
                    <Text className={styles.addIcon}>+</Text>
                    <Text>添加图片</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>联系信息</Text>
          <View className={styles.formGroup}>
            <Text className={styles.label}>报修人</Text>
            <Input className={styles.input} value={userInfo.name} disabled />
          </View>
          <View className={styles.formGroup}>
            <Text className={styles.label}>联系电话</Text>
            <Input className={styles.input} value={userInfo.phone} disabled />
          </View>
          <View className={styles.formGroup}>
            <Text className={styles.label}>房屋信息</Text>
            <Input
              className={styles.input}
              value={`${userInfo.building || ''} ${userInfo.room || ''}`}
              disabled
            />
          </View>
        </View>
      </View>

      <View className={styles.footerBar}>
        <View
          className={classnames(
            styles.submitBtn,
            (!canSubmit || submitting) && styles.submitBtnDisabled,
          )}
          onClick={canSubmit && !submitting ? handleSubmit : undefined}
        >
          <Text>{submitting ? '提交中...' : '提交报修'}</Text>
        </View>
      </View>
    </View>
  );
};

export default RepairPage;
