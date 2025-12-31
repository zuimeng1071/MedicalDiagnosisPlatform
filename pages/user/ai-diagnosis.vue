<template>
  <view class="diagnosis-page">
    <!-- 页面头部 -->
    <view class="page-header">
      <text class="title">AI诊断</text>
      <!-- 新增：诊断记录按钮 -->
      <button class="history-btn" @click="goToDiagnosisRecords">
        <text class="btn-text">诊断记录</text>
      </button>
    </view>

    <!-- 图片上传区域 -->
    <view class="upload-section">
      <UploadImage ref="uploadRef" @imageSelected="onImageChange" />
    </view>

    <!-- 诊断方法选择 -->
    <view class="diagnosis-methods">
      <text class="section-title">诊断方法</text>
      <radio-group @change="onMethodChange" class="radio-group">
        <label
          v-for="method in diagnosisMethods"
          :key="method.value"
          class="radio-item"
        >
          <radio
            :value="method.value"
            :checked="selectedMethod === method.value"
          />
          <text>{{ method.label }}</text>
        </label>
      </radio-group>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section">
      <button
        class="btn-primary"
        :disabled="!selectedImage || !selectedMethod || loading"
        @click="handleDiagnosis"
      >
        {{ loading ? '诊断中...' : '开始诊断' }}
      </button>
    </view>

    <!-- 诊断结果展示 -->
    <view v-if="result" class="result-section">
      <text class="section-title">诊断结果</text>

      <!-- 分类结果卡片 -->
      <view class="result-card">
        <text class="result-title">分类结果</text>
        <text class="classify-result">{{ getClassifyResult() }}</text>
        <text class="confidence">置信度: {{ getConfidenceText() }}%</text>
      </view>

      <!-- AI分析报告 -->
      <view v-if="getAnalysisText()" class="analysis-result">
        <text class="result-title">AI分析</text>
        <text class="analysis-text">{{ getAnalysisText() }}</text>
      </view>

		<!-- 分割叠加图展示 -->
		<view v-if="result.data.mergedImage" class="image-results">
		  <image
			:src="'data:image/png;base64,' + result.data.mergedImage"
			class="result-image"
			mode="aspectFit"
		  ></image>
		  <text class="image-label">分割叠加图</text>
		</view>

		<!-- 二值掩码图（可选） -->
		<view v-if="result.data.binaryMask" class="image-results">
		  <image
			:src="'data:image/png;base64,' + result.data.binaryMask"
			class="result-image"
			mode="aspectFit"
		  ></image>
		  <text class="image-label">二值掩码图</text>
		</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import UploadImage from '@/components/UploadImage.vue'
import { aiApi } from '@/api/ai'
import { useUserStore } from '@/stores/userStore'

// 引用组件和状态
const uploadRef = ref(null)
const selectedImage = ref('')
const selectedMethod = ref('diagnosis')
const result = ref(null)
const loading = ref(false)

// 用户存储（用于token管理）
const userStore = useUserStore()

// 诊断方法选项
const diagnosisMethods = [
  { label: '一键诊断', value: 'diagnosis' },
  { label: '图像分类', value: 'classify' },
  { label: '图像分割', value: 'segment' }
]

// 新增：跳转到诊断记录页面
const goToDiagnosisRecords = () => {
  uni.navigateTo({
    url: '/pages/user/ai-diagnosisRecode'
  })
}

// 获取分类结果文本
const getClassifyResult = () => {
  if (!result.value?.data) return '未知'
  
  // 优先使用 classifyDataForJson 中的 max_class_name
  if (result.value.data.classifyDataForJson) {
    try {
      const classifyData = JSON.parse(result.value.data.classifyDataForJson)
      return classifyData.max_class_name || classifyData.classify || '未识别'
    } catch (e) {
      console.warn('解析分类数据失败:', e)
    }
  }
  
  // 兜底从 data 直接取
  return result.value.data.classify || result.value.data.max_class_name || '未识别'
}

// 获取置信度文本
const getConfidenceText = () => {
  let confidence = 0
  
  if (result.value?.data?.classifyDataForJson) {
    try {
      const classifyData = JSON.parse(result.value.data.classifyDataForJson)
      confidence = classifyData.max_confidence || 0
    } catch (e) {
      console.warn('解析置信度数据失败:', e)
    }
  } else if (result.value?.data?.max_confidence !== undefined) {
    confidence = result.value.data.max_confidence
  }
  
  return (confidence * 100).toFixed(2)
}

// 获取AI分析文本
const getAnalysisText = () => {
  if (!result.value?.data?.analysisResult) return ''
  
  try {
    const parsed = JSON.parse(result.value.data.analysisResult)
    if (parsed.aiMessage && typeof parsed.aiMessage.text === 'string') {
      return parsed.aiMessage.text.trim()
    }
  } catch (e) {
    console.warn('解析AI分析结果失败:', e)
    // 如果无法解析JSON，尝试提取纯文本
    return String(result.value.data.analysisResult).replace(/```json[\s\S]*?```/g, '').trim()
  }
  
  return ''
}

// 图像变更处理
const onImageChange = (filePath) => {
  selectedImage.value = filePath
  result.value = null // 清空上一次结果
}

// 方法变更处理
const onMethodChange = (e) => {
  selectedMethod.value = e.detail.value
}

// 开始诊断处理
const handleDiagnosis = async () => {
  // 校验登录状态
  if (!userStore.token) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/user/login' })
    }, 1500)
    return
  }

  // 校验图片
  if (!selectedImage.value) {
    uni.showToast({ title: '请选择皮肤病变图片', icon: 'none' })
    return
  }

  loading.value = true
  try {
    let apiResponse

    switch (selectedMethod.value) {
      case 'diagnosis':
        apiResponse = await aiApi.diagnosis(selectedImage.value)
        break
      case 'classify':
        apiResponse = await aiApi.classify(selectedImage.value)
        break
      case 'segment':
        apiResponse = await aiApi.segment(selectedImage.value)
        break
      default:
        throw new Error('不支持的诊断方法')
    }

    // 成功响应处理
    if (apiResponse.code === '1' || apiResponse.code === 200) {
      result.value = apiResponse
      uni.showToast({ title: '诊断完成', icon: 'success', duration: 1500 })
    } else {
      throw new Error(apiResponse.message || '诊断请求失败')
    }
  } catch (error) {
    console.error('诊断失败:', error)
    uni.showToast({
      title: error.message || '诊断失败',
      icon: 'none',
      duration: 3000
    })
  } finally {
    loading.value = false
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

.diagnosis-page {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;
  position: relative;

  @media (min-width: 768px) {
    margin-bottom: $pc-spacing-xl;
  }

  .title {
    font-size: 38rpx;
    font-weight: 700;
    color: $primary-color;
    flex: 1;
    text-align: center;
    letter-spacing: -0.5rpx;
    background: linear-gradient(135deg, $primary-color, $primary-light);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @media (min-width: 768px) {
      font-size: 32px;
    }
  }

  .history-btn {
    background: linear-gradient(135deg, $primary-color, $primary-light);
    border: none;
    color: white;
    font-size: 24rpx;
    font-weight: 600;
    padding: $spacing-sm $spacing-md;
    border-radius: 50rpx;
    line-height: 1;
    transition: all $animation-duration $animation-timing;
    box-shadow: $shadow-light;
    position: relative;
    overflow: hidden;
    cursor: pointer;

    @media (min-width: 768px) {
      padding: 12px 20px;
      font-size: 14px;
      border-radius: 25px;
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      transition: left $animation-duration * 2 $animation-timing;
    }
    
    .btn-text {
      color: white;
      position: relative;
      z-index: 1;
    }
    
    &::after {
      border: none;
    }
    
    &:active {
      transform: scale(0.95);
      box-shadow: $shadow-medium;
      
      &::before {
        left: 100%;
      }
    }

    @media (min-width: 768px) {
      &:hover {
        transform: translateY(-2px);
        box-shadow: $shadow-hover;
        
        &::before {
          left: 100%;
        }
      }
    }
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

  &:active {
    border-color: $primary-color;
    background: rgba(26, 147, 114, 0.05);
  }

  @media (min-width: 768px) {
    &:hover {
      border-color: $primary-light;
      box-shadow: $shadow-hover;
      transform: translateY(-2px);
      cursor: pointer;
    }
  }

  ::v-deep .upload-tip {
    color: $text-gray;
    font-size: 28rpx;
    font-weight: 500;

    @media (min-width: 768px) {
      font-size: 16px;
    }
  }
}

.diagnosis-methods {
  margin-bottom: $spacing-xl;
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
}

.action-section {
  margin: $spacing-xl 0;
  padding: 0 $spacing-xs;

  @media (min-width: 768px) {
    margin: $pc-spacing-xl auto;
    padding: 0;
    max-width: 600px;
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
}

.result-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba($primary-color,0.02) 100%);
  padding: $spacing-xl;
  border-radius: $border-radius;
  margin: $spacing-lg 0;
  border-left: 8rpx solid $primary-color;
  box-shadow: $shadow-light;
  animation: slideInLeft $animation-duration $animation-timing;
  backdrop-filter: blur(10rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.8);

  @media (min-width: 768px) {
    padding: $pc-spacing-lg;
    border-radius: $pc-border-radius;
    border-left-width: 6px;
  }

  .result-title {
    font-size: 30rpx;
    font-weight: 700;
    color: $text-dark;
    display: block;
    margin-bottom: $spacing-md;
    letter-spacing: -0.5rpx;

    @media (min-width: 768px) {
      font-size: 18px;
    }
  }

  .classify-result {
    font-size: 36rpx;
    color: $primary-color;
    font-weight: 800;
    display: block;
    margin-bottom: $spacing-sm;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);

    @media (min-width: 768px) {
      font-size: 24px;
    }
  }

  .confidence {
    font-size: 26rpx;
    color: $text-gray;
    font-weight: 500;
    display: block;
    padding: $spacing-xs $spacing-sm;
    background: rgba($secondary-color, 0.1);
    border-radius: $border-radius-sm;
    width: fit-content;

    @media (min-width: 768px) {
      font-size: 16px;
      padding: 8px 12px;
    }
  }
}

.analysis-result {
  background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba($secondary-color,0.02) 100%);
  padding: $spacing-xl;
  border-radius: $border-radius;
  margin: $spacing-lg 0;
  border-left: 8rpx solid $secondary-color;
  box-shadow: $shadow-light;
  animation: slideInRight $animation-duration $animation-timing;
  backdrop-filter: blur(10rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.8);

  @media (min-width: 768px) {
    padding: $pc-spacing-lg;
    border-radius: $pc-border-radius;
    border-left-width: 6px;
  }

  .result-title {
    font-size: 30rpx;
    font-weight: 700;
    color: $text-dark;
    display: block;
    margin-bottom: $spacing-md;
    letter-spacing: -0.5rpx;

    @media (min-width: 768px) {
      font-size: 18px;
    }
  }

  .analysis-text {
    font-size: 28rpx;
    color: $text-dark;
    line-height: 1.8;
    word-break: break-word;
    letter-spacing: 0.5rpx;

    @media (min-width: 768px) {
      font-size: 16px;
      line-height: 1.6;
    }
  }
}

.image-results {
  margin: $spacing-lg 0;
  background: rgba(255, 255, 255, 0.95);
  padding: $spacing-xl;
  border-radius: $border-radius;
  box-shadow: $shadow-light;
  animation: fadeIn $animation-duration * 1.5 $animation-timing;
  backdrop-filter: blur(10rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.8);

  @media (min-width: 768px) {
    margin: $pc-spacing-lg 0;
    padding: $pc-spacing-lg;
    border-radius: $pc-border-radius;
    border-width: 1px;
  }

  .result-image {
    width: 100%;
    height: 420rpx;
    border-radius: $border-radius;
    object-fit: contain;
    border: 1rpx solid rgba(224, 224, 224, 0.6);
    background: $bg-light;
    transition: all $animation-duration $animation-timing;

    @media (min-width: 768px) {
      height: 400px;
      border-radius: $pc-border-radius;
      border-width: 1px;
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

  .image-label {
    font-size: 26rpx;
    color: $text-gray;
    text-align: center;
    display: block;
    margin-top: $spacing-md;
    font-weight: 600;
    letter-spacing: 0.5rpx;

    @media (min-width: 768px) {
      font-size: 16px;
      margin-top: $pc-spacing-md;
    }
  }
}

/* PC端网格布局 */
@media (min-width: 1024px) {
  .diagnosis-page {
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

  .diagnosis-methods {
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
  .diagnosis-page {
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

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-40rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(40rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .diagnosis-page {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }
  
  .section-title,
  .radio-item,
  .result-title,
  .analysis-text {
    color: #ffffff;
  }
  
  .upload-section,
  .diagnosis-methods,
  .result-section,
  .result-card,
  .analysis-result,
  .image-results {
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
  .diagnosis-page * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 响应式设计补充 */
@media (max-width: 768px) {
  .diagnosis-page {
    padding: $spacing-md;
  }

  .page-header {
    .history-btn {
      padding: $spacing-sm $spacing-md;
      font-size: 22rpx;
    }
  }

  .upload-section {
    padding: $spacing-lg $spacing-md;
  }
}
</style>