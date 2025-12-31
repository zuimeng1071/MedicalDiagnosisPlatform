<template>
  <view class="enhance-page">
    <view class="page-header">
      <text class="page-title">图像增强</text>
    </view>
    
    <view class="upload-section">
      <UploadImage ref="uploadRef" @imageSelected="handleImageSelected" />
    </view>
    
    <view class="enhance-options">
      <text class="section-title">增强方法</text>
      <radio-group @change="onMethodChange" class="radio-group">
        <label
          v-for="option in enhanceOptions"
          :key="option.value"
          class="radio-item"
        >
          <radio
            :value="option.value"
            :checked="selectedOption === option.value"
          />
          <text>{{ option.label }}</text>
        </label>
      </radio-group>
    </view>
    
    <view class="action-section">
      <button class="btn-primary" :disabled="!canProcess" @click="processImage">
        {{ processing ? '处理中...' : '开始增强' }}
      </button>
    </view>
    
    <view v-if="resultImage" class="result-section">
      <text class="section-title">增强结果</text>
      <image :src="resultImage" class="result-image" mode="aspectFit"></image>
      <button class="save-btn" @click="saveImage">保存到相册</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import UploadImage from '../../components/UploadImage.vue'
import { enhanceApi } from '../../api/enhance'
import { saveBase64Image } from '../../utils/base64ToFile'

const uploadRef = ref()
const selectedImage = ref('')
const selectedOption = ref('pca')
const processing = ref(false)
const resultImage = ref('')

const enhanceOptions = [
  { label: 'PCA增强', value: 'pca' },
  { label: '基本增强', value: 'basic' },
  { label: '全部增强', value: 'all' }
]

// 计算属性：是否可以处理
const canProcess = computed(() => {
  return selectedImage.value && !processing.value
})

// 处理图片选择
const handleImageSelected = (imagePath) => {
  selectedImage.value = imagePath
  resultImage.value = '' // 清除之前的结果
}

// 方法变更处理
const onMethodChange = (e) => {
  selectedOption.value = e.detail.value
}

// 处理图像
const processImage = async () => {
  if (!selectedImage.value) return
  
  processing.value = true
  try {
    let response
    switch (selectedOption.value) {
      case 'pca':
        response = await enhanceApi.pcaEnhance(selectedImage.value)
        break
      case 'basic':
        response = await enhanceApi.basicEnhance(selectedImage.value)
        break
      case 'all':
        response = await enhanceApi.allEnhance(selectedImage.value)
        break
    }
    
    if (response.code === '1') {
      resultImage.value = 'data:image/png;base64,' + response.data
      uni.showToast({ title: '增强成功', icon: 'success', duration: 1500 })
    } else {
      throw new Error(response.message)
    }
  } catch (error) {
    uni.showToast({ 
      title: '处理失败: ' + error.message, 
      icon: 'none', 
      duration: 3000 
    })
  } finally {
    processing.value = false
  }
}

// 保存图片
const saveImage = async () => {
  if (!resultImage.value) return
  
  try {
    await saveBase64Image(resultImage.value)
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
</script>

<style scoped lang="scss">
/* 主题变量配置 */
$primary-color: #1a9372;
$primary-dark: #147a5f;
$primary-light: #2bb892;
$secondary-color: #34c759;
$secondary-dark: #2aa64a;
$accent-color: #2ecc71;
$text-dark: #333333;
$text-gray: #666666;
$text-light: #999999;
$bg-light: #f5f5f5;
$bg-lighter: #fafafa;
$border-color: #e0e0e0;
$border-radius: 16rpx;
$border-radius-sm: 8rpx;
$spacing-xs: 8rpx;
$spacing-sm: 16rpx;
$spacing-md: 24rpx;
$spacing-lg: 32rpx;
$spacing-xl: 40rpx;
$shadow-light: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
$shadow-medium: 0 4rpx 20rpx rgba(0, 0, 0, 0.12);
$shadow-hover: 0 6rpx 24rpx rgba(26, 147, 114, 0.15);

/* PC端专用变量 */
$pc-border-radius: 12px;
$pc-spacing-sm: 12px;
$pc-spacing-md: 20px;
$pc-spacing-lg: 28px;
$pc-spacing-xl: 36px;

/* 交互规范变量 */
$animation-duration: 0.3s;
$animation-timing: cubic-bezier(0.4, 0, 0.2, 1);

.enhance-page {
  padding: $spacing-lg;
  min-height: 100vh;
  background: linear-gradient(135deg, $bg-lighter 0%, #ffffff 100%);
  box-sizing: border-box;
  
  /* PC端适配 */
  @media (min-width: 768px) {
    padding: $pc-spacing-xl;
    max-width: 1200px;
    margin: 0 auto;
  }
}

.page-header {
  margin-bottom: $spacing-xl;
  text-align: center;
  padding: $spacing-md 0;

  @media (min-width: 768px) {
    margin-bottom: $pc-spacing-xl;
    padding: $pc-spacing-lg 0;
  }
}

.page-title {
  font-size: 38rpx;
  font-weight: 700;
  color: $primary-color;
  display: block;
  letter-spacing: -0.5rpx;
  background: linear-gradient(135deg, $primary-color, $primary-light);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (min-width: 768px) {
    font-size: 32px;
    margin-bottom: 8px;
  }
}

.upload-section {
  margin-bottom: $spacing-xl;
  border: 3rpx dashed lighten($border-color, 5%);
  border-radius: $border-radius;
  padding: $spacing-xl $spacing-lg;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  transition: all $animation-duration $animation-timing;
  position: relative;
  overflow: hidden;

  @media (min-width: 768px) {
    margin-bottom: $pc-spacing-xl;
    border-width: 2px;
    border-radius: $pc-border-radius;
    padding: $pc-spacing-xl;
    margin: 0 auto $pc-spacing-xl;
    max-width: 600px;
  }

  /* 手势反馈 */
  &:active {
    border-color: $primary-color;
    background: rgba(26, 147, 114, 0.05);
  }

  /* PC端悬停效果 */
  @media (min-width: 768px) {
    &:hover {
      border-color: $primary-light;
      box-shadow: $shadow-hover;
      transform: translateY(-2px);
      cursor: pointer;
    }
  }
}

.enhance-options {
  margin: $spacing-xl 0;
  background: rgba(255, 255, 255, 0.95);
  padding: $spacing-xl $spacing-lg;
  border-radius: $border-radius;
  box-shadow: $shadow-light;
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  transition: all $animation-duration $animation-timing;

  @media (min-width: 768px) {
    margin: $pc-spacing-xl auto;
    padding: $pc-spacing-xl $pc-spacing-lg;
    border-radius: $pc-border-radius;
    max-width: 600px;
    border-width: 1px;
  }

  @media (min-width: 768px) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-hover;
    }
  }
}

.section-title {
  font-size: 34rpx;
  font-weight: 650;
  color: $text-dark;
  margin-bottom: $spacing-lg;
  display: block;
  letter-spacing: -0.3rpx;

  @media (min-width: 768px) {
    font-size: 20px;
    margin-bottom: $pc-spacing-md;
  }
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  @media (min-width: 768px) {
    gap: $pc-spacing-sm;
  }
}

.radio-item {
  display: flex;
  align-items: center;
  font-size: 30rpx;
  color: $text-dark;
  padding: $spacing-md $spacing-sm;
  border-radius: $border-radius-sm;
  transition: all $animation-duration $animation-timing;
  background: transparent;
  min-height: 96rpx;
  cursor: pointer;

  @media (min-width: 768px) {
    font-size: 16px;
    padding: $pc-spacing-md $pc-spacing-sm;
    border-radius: 8px;
    min-height: 56px;
  }

  &:active {
    background: rgba(26, 147, 114, 0.08);
    color: $primary-color;
  }

  @media (min-width: 768px) {
    &:hover {
      background: rgba(26, 147, 114, 0.05);
      color: $primary-color;
      transform: translateX(4px);
    }
  }

  radio {
    margin-right: $spacing-md;
    transform: scale(1);

    @media (min-width: 768px) {
      margin-right: $pc-spacing-sm;
      transform: scale(1.1);
    }
  }
}

.action-section {
  margin: $spacing-xl 0;
  padding: 0 $spacing-xs;

  @media (min-width: 768px) {
    margin: $pc-spacing-xl auto;
    padding: 0;
    max-width: 600px;
  }
}

.btn-primary {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
  color: white;
  font-size: 34rpx;
  font-weight: 650;
  border: none;
  border-radius: $border-radius;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all $animation-duration $animation-timing;
  box-shadow: $shadow-medium;
  position: relative;
  overflow: hidden;
  min-height: 96rpx;
  cursor: pointer;

  @media (min-width: 768px) {
    height: 56px;
    line-height: 56px;
    font-size: 18px;
    border-radius: $pc-border-radius;
    min-height: 56px;
    max-width: 400px;
    margin: 0 auto;
  }

  &:active:not(:disabled) {
    transform: translateY(2rpx);
    box-shadow: $shadow-light;
  }

  @media (min-width: 768px) {
    &:active:not(:disabled) {
      transform: translateY(1px);
    }

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: $shadow-hover;
      background: linear-gradient(135deg, $primary-dark 0%, $secondary-dark 100%);
    }
  }

  &:disabled {
    background: linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%);
    color: rgba(255, 255, 255, 0.7);
    box-shadow: none;
    transform: none;
    cursor: not-allowed;
  }
}

.result-section {
  margin-top: $spacing-xl;
  background: rgba(255, 255, 255, 0.95);
  padding: $spacing-xl;
  border-radius: $border-radius;
  box-shadow: $shadow-light;
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  animation: fadeInUp 0.5s $animation-timing;

  @media (min-width: 768px) {
    margin-top: $pc-spacing-xl;
    padding: $pc-spacing-xl;
    border-radius: $pc-border-radius;
    border-width: 1px;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
}

.result-image {
  width: 100%;
  height: 420rpx;
  border-radius: $border-radius;
  object-fit: contain;
  border: 1rpx solid rgba(224, 224, 224, 0.6);
  margin: $spacing-lg 0;
  background: $bg-light;
  transition: all $animation-duration $animation-timing;

  @media (min-width: 768px) {
    height: 400px;
    border-radius: $pc-border-radius;
    border-width: 1px;
    margin: $pc-spacing-lg 0;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  @media (min-width: 768px) {
    &:hover {
      transform: scale(1.01);
      box-shadow: $shadow-medium;
    }
  }
}

.save-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, $secondary-color 0%, $accent-color 100%);
  color: white;
  border: none;
  border-radius: $border-radius;
  font-size: 30rpx;
  font-weight: 600;
  transition: all $animation-duration $animation-timing;
  box-shadow: $shadow-light;
  position: relative;
  overflow: hidden;
  min-height: 88rpx;
  cursor: pointer;

  @media (min-width: 768px) {
    height: 52px;
    line-height: 52px;
    font-size: 16px;
    border-radius: $pc-border-radius;
    min-height: 52px;
    max-width: 300px;
    margin: 0 auto;
    display: block;
  }

  &:active {
    background: linear-gradient(135deg, $secondary-dark 0%, darken($accent-color, 8%) 100%);
    transform: translateY(1rpx);
    box-shadow: $shadow-light;
  }

  @media (min-width: 768px) {
    &:active {
      transform: translateY(1px);
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-medium;
      background: linear-gradient(135deg, $secondary-dark 0%, darken($accent-color, 4%) 100%);
    }
  }
}

/* PC端网格布局 */
@media (min-width: 1024px) {
  .enhance-page {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto 1fr auto;
    gap: $pc-spacing-xl;
    grid-template-areas: 
      "header header"
      "upload options"
      "action result";
    align-items: start;
    max-width: 1400px;
  }

  .page-header {
    grid-area: header;
    margin-bottom: 0;
  }

  .upload-section {
    grid-area: upload;
    margin: 0;
    max-width: none;
    height: fit-content;
  }

  .enhance-options {
    grid-area: options;
    margin: 0;
    max-width: none;
    height: fit-content;
  }

  .action-section {
    grid-area: action;
    margin: 0;
    max-width: none;
    align-self: end;
  }

  .result-section {
    grid-area: result;
    margin: 0;
    max-width: none;
    align-self: end;
  }

  .btn-primary {
    max-width: none;
    margin: 0;
  }
}

/* 大屏幕PC优化 */
@media (min-width: 1440px) {
  .enhance-page {
    gap: $pc-spacing-xl * 1.5;
    padding: $pc-spacing-xl * 1.5;
  }
}

/* 动画定义 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .enhance-page {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }
  
  .section-title,
  .radio-item {
    color: #ffffff;
  }
  
  .upload-section,
  .enhance-options,
  .result-section {
    background: rgba(40, 40, 40, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .result-image {
    background: #2d2d2d;
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* 减少动画设置支持 */
@media (prefers-reduced-motion: reduce) {
  .enhance-page * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>