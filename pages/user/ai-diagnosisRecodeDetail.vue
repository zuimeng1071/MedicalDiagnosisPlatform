<template>
  <view class="detail-page">
    <!-- 页面头部 -->
    <view class="page-header">
      <view class="header-left" @click="goBack">
        <text class="back-icon">←</text>
        <text class="back-text">返回</text>
      </view>
      <text class="title">诊断详情</text>
      <view class="header-right"></view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-section">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-section">
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @click="loadDetail">重试</button>
    </view>

    <!-- 详情内容 -->
    <view v-else-if="detail" class="detail-content">
      <scroll-view class="scroll-content" scroll-y>
        <!-- 基本信息 -->
        <view class="section basic-info">
          <text class="section-title">基本信息</text>
          <view class="info-grid">
            <view class="info-item">
              <text class="label">记录ID</text>
              <text class="value">{{ detail.detectionRecordId }}</text>
            </view>
            <view class="info-item">
              <text class="label">诊断时间</text>
              <text class="value">{{ formatTime(detail.createTime) }}</text>
            </view>
            <view class="info-item">
              <text class="label">使用Token</text>
              <text class="value">{{ detail.useToken || 0 }}</text>
            </view>
          </view>
        </view>

        <!-- 原图展示 -->
        <view v-if="detail.imgUrl" class="section image-section">
          <text class="section-title">原图</text>
          <image 
            :src="detail.imgUrl" 
            class="detail-image" 
            mode="aspectFit"
            @click="previewImage(detail.imgUrl)"
          ></image>
        </view>

        <!-- 分类结果 -->
        <view class="section classify-result">
          <text class="section-title">分类结果</text>
          <view class="result-card">
            <text class="main-result">{{ getClassifyResult() }}</text>
            <text class="confidence">置信度: {{ getConfidenceText() }}%</text>
            
            <!-- 置信度图表 -->
            <view v-if="confidences.length > 0" class="confidence-chart">
              <view 
                v-for="item in confidences" 
                :key="item.name"
                class="confidence-item"
              >
                <text class="class-name">{{ item.name }}</text>
                <view class="progress-bar">
                  <view 
                    class="progress-fill" 
                    :style="{ width: item.percentage + '%' }"
                    :class="getConfidenceClass(item.percentage)"
                  ></view>
                </view>
                <text class="percentage">{{ item.percentage.toFixed(1) }}%</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 分割结果 -->
        <view v-if="detail.mergedImageUrl" class="section segmentation-result">
          <text class="section-title">分割结果</text>
          <view class="image-grid">
            <view class="image-item">
              <image 
                :src="detail.mergedImageUrl" 
                class="result-image" 
                mode="aspectFit"
                @click="previewImage(detail.mergedImageUrl)"
              ></image>
              <text class="image-label">分割叠加图</text>
            </view>
            <view v-if="detail.binaryMaskUrl" class="image-item">
              <image 
                :src="detail.binaryMaskUrl" 
                class="result-image" 
                mode="aspectFit"
                @click="previewImage(detail.binaryMaskUrl)"
              ></image>
              <text class="image-label">二值掩码图</text>
            </view>
          </view>
        </view>

        <!-- AI分析报告 -->
        <view v-if="getAnalysisText()" class="section analysis-section">
          <text class="section-title">AI分析报告</text>
          <view class="analysis-card">
            <text class="analysis-text">{{ getAnalysisText() }}</text>
          </view>
        </view>

        <!-- AI思考过程 -->
        <view v-if="getThinkingText()" class="section thinking-section">
          <text class="section-title">AI思考过程</text>
          <view class="thinking-card">
            <text class="thinking-text">{{ getThinkingText() }}</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-section">
          <button class="action-btn share-btn" @click="shareResult">分享结果</button>
          <button class="action-btn save-btn" @click="saveResult">保存报告</button>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from '@/utils/route'
import { aiApi } from '@/api/ai'
import { useUserStore } from '@/stores/userStore'

// 路由和状态
const route = useRoute()
const userStore = useUserStore()
const detail = ref(null)
const loading = ref(false)
const error = ref('')

// 获取路由参数
const recordId = ref(route.query?.id || '')

// 计算置信度数据
const confidences = computed(() => {
  if (!detail.value?.classifyDataForJson) return []
  
  try {
    const data = JSON.parse(detail.value.classifyDataForJson)
    if (data.all_confidences && typeof data.all_confidences === 'object') {
      return Object.entries(data.all_confidences)
        .map(([name, confidence]) => ({
          name,
          confidence: Number(confidence),
          percentage: Number(confidence) * 100
        }))
        .sort((a, b) => b.confidence - a.confidence)
    }
  } catch (e) {
    console.warn('解析置信度数据失败:', e)
  }
  return []
})

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 获取分类结果
const getClassifyResult = () => {
  if (!detail.value) return '未知'
  
  if (detail.value.classifyDataForJson) {
    try {
      const data = JSON.parse(detail.value.classifyDataForJson)
      return data.max_class_name || data.classify || '未识别'
    } catch (e) {
      console.warn('解析分类数据失败:', e)
    }
  }
  
  return detail.value.classify || '未识别'
}

// 获取置信度文本
const getConfidenceText = () => {
  if (!detail.value) return '0.00'
  
  if (detail.value.classifyDataForJson) {
    try {
      const data = JSON.parse(detail.value.classifyDataForJson)
      return (data.max_confidence * 100).toFixed(2)
    } catch (e) {
      console.warn('解析置信度失败:', e)
    }
  }
  
  return '0.00'
}

// 获取AI分析文本
const getAnalysisText = () => {
  if (!detail.value?.analysisResult) return ''
  
  try {
    const parsed = JSON.parse(detail.value.analysisResult)
    if (parsed.aiMessage && typeof parsed.aiMessage.text === 'string') {
      return parsed.aiMessage.text.trim()
    }
  } catch (e) {
    console.warn('解析AI分析结果失败:', e)
    return String(detail.value.analysisResult).replace(/```json[\s\S]*?```/g, '').trim()
  }
  
  return ''
}

// 获取思考过程文本
const getThinkingText = () => {
  if (!detail.value?.thinking) return ''
  
  try {
    if (detail.value.analysisResult) {
      const parsed = JSON.parse(detail.value.analysisResult)
      if (parsed.aiMessage && parsed.aiMessage.thinking) {
        return parsed.aiMessage.thinking.trim()
      }
    }
    return detail.value.thinking.trim()
  } catch (e) {
    return detail.value.thinking.trim()
  }
}

// 获取置信度样式类
const getConfidenceClass = (percentage) => {
  if (percentage > 70) return 'high'
  if (percentage > 30) return 'medium'
  return 'low'
}

// 加载详情
const loadDetail = async () => {
  if (!recordId.value) {
    error.value = '记录ID不存在'
    return
  }

  if (!userStore.token) {
    error.value = '请先登录'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await aiApi.getDetectionRecordDetail(recordId.value)
    
    if (response.code === '1' && response.data) {
      detail.value = response.data
    } else {
      throw new Error(response.message || '获取详情失败')
    }
  } catch (err) {
    console.error('加载详情失败:', err)
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

// 图片预览
const previewImage = (url) => {
  if (!url) return
  
  const images = []
  if (detail.value.imgUrl) images.push(detail.value.imgUrl)
  if (detail.value.mergedImageUrl) images.push(detail.value.mergedImageUrl)
  if (detail.value.binaryMaskUrl) images.push(detail.value.binaryMaskUrl)
  
  const currentIndex = images.indexOf(url)
  uni.previewImage({
    urls: images,
    current: currentIndex >= 0 ? currentIndex : 0
  })
}

// 分享结果
const shareResult = () => {
  const shareText = `AI皮肤诊断结果：${getClassifyResult()}，置信度：${getConfidenceText()}%`
  uni.share({
    title: '皮肤诊断报告',
    summary: shareText,
    href: window.location.href,
    success: () => {
      uni.showToast({ title: '分享成功', icon: 'success' })
    },
    fail: () => {
      uni.showToast({ title: '分享失败', icon: 'none' })
    }
  })
}

// 保存报告
const saveResult = async () => {
  try {
    // 这里可以实现保存报告到本地的逻辑
    uni.showToast({ title: '报告保存成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 页面加载
onMounted(() => {
  loadDetail()
})
</script>

<style scoped lang="scss">
/* 诊断详情页面样式 */
/* 主题变量配置 */
$primary-color: #1a9372;
$primary-dark: #147a5f;
$primary-light: #2bb892;
$secondary-color: #34c759;
$secondary-dark: #2aa64a;
$accent-color: #2ecc71;
$danger-color: #e74c3c;
$warning-color: #f39c12;
$success-color: #27ae60;
$info-color: #3498db;
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

.detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, $bg-lighter 0%, #ffffff 100%);
  box-sizing: border-box;

  @media (min-width: 768px) {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1rpx solid $border-color;
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10rpx);

  @media (min-width: 768px) {
    padding: $pc-spacing-lg $pc-spacing-xl;
    border-bottom-width: 1px;
    margin-bottom: 0;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    color: $primary-color;
    cursor: pointer;
    transition: all $animation-duration $animation-timing;
    padding: 8rpx 16rpx;
    border-radius: $border-radius-sm;
    
    &:active {
      background: rgba($primary-color, 0.1);
      transform: scale(0.95);
    }

    @media (min-width: 768px) {
      padding: 8px 12px;
      border-radius: 6px;
      
      &:hover {
        color: $primary-light;
        background: rgba($primary-color, 0.08);
        transform: translateX(-4px);
      }
    }
    
    .back-icon {
      font-size: 32rpx;
      margin-right: 10rpx;
      font-weight: bold;

      @media (min-width: 768px) {
        font-size: 18px;
      }
    }
    
    .back-text {
      font-size: 28rpx;
      font-weight: 600;

      @media (min-width: 768px) {
        font-size: 16px;
      }
    }
  }
  
  .title {
    font-size: 32rpx;
    font-weight: bold;
    color: $text-dark;
    background: linear-gradient(135deg, $primary-color, $primary-light);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @media (min-width: 768px) {
      font-size: 24px;
    }
  }
  
  .header-right {
    width: 80rpx;

    @media (min-width: 768px) {
      width: 100px;
    }
  }
}

.loading-section, .error-section {
  text-align: center;
  padding: 100rpx 30rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: $border-radius;
  margin: $spacing-lg;

  @media (min-width: 768px) {
    padding: 80px $pc-spacing-xl;
    border-radius: $pc-border-radius;
    margin: $pc-spacing-xl;
  }
}

.loading-text, .error-text {
  font-size: 28rpx;
  color: $text-gray;
  display: block;
  margin-bottom: 30rpx;

  @media (min-width: 768px) {
    font-size: 18px;
    margin-bottom: $pc-spacing-md;
  }
}

.retry-btn {
  background: linear-gradient(135deg, $primary-color, $primary-light);
  color: white;
  padding: 20rpx 40rpx;
  border-radius: $border-radius-sm;
  font-size: 26rpx;
  font-weight: 600;
  border: none;
  transition: all $animation-duration $animation-timing;
  box-shadow: $shadow-light;
  cursor: pointer;

  @media (min-width: 768px) {
    padding: 12px 24px;
    font-size: 14px;
    border-radius: 6px;
  }

  &:active {
    transform: translateY(2rpx);
    box-shadow: $shadow-light;
  }

  @media (min-width: 768px) {
    &:active {
      transform: translateY(1px);
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-hover;
      background: linear-gradient(135deg, $primary-dark, $primary-color);
    }
  }
}

.detail-content {
  height: calc(100vh - 120rpx);

  @media (min-width: 768px) {
    height: calc(100vh - 80px);
  }
}

.scroll-content {
  height: 100%;
  padding: 0 $spacing-lg $spacing-lg;

  @media (min-width: 768px) {
    padding: $pc-spacing-xl;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto 1fr auto;
    gap: $pc-spacing-lg;
    grid-template-areas: 
      "basic image"
      "classify image"
      "segmentation segmentation"
      "analysis thinking"
      "actions actions";
    align-items: start;
  }

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-areas: 
      "basic image image"
      "classify segmentation segmentation"
      "analysis thinking thinking"
      "actions actions actions";
    gap: $pc-spacing-xl;
  }
}

.section {
  margin-bottom: $spacing-xl;
  background: rgba(255, 255, 255, 0.95);
  border-radius: $border-radius;
  padding: $spacing-lg;
  box-shadow: $shadow-light;
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10rpx);
  transition: all $animation-duration $animation-timing;

  @media (min-width: 768px) {
    margin-bottom: 0;
    padding: $pc-spacing-lg;
    border-radius: $pc-border-radius;
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
  font-size: 30rpx;
  font-weight: bold;
  color: $text-dark;
  display: block;
  margin-bottom: 20rpx;
  padding-left: 10rpx;
  border-left: 4rpx solid $primary-color;

  @media (min-width: 768px) {
    font-size: 18px;
    margin-bottom: $pc-spacing-md;
    padding-left: 12px;
    border-left-width: 4px;
  }
}

/* 网格区域分配 */
.basic-info {
  @media (min-width: 768px) {
    grid-area: basic;
  }
}

.image-section {
  @media (min-width: 768px) {
    grid-area: image;
  }
}

.classify-result {
  @media (min-width: 768px) {
    grid-area: classify;
  }
}

.segmentation-result {
  @media (min-width: 768px) {
    grid-area: segmentation;
  }
}

.analysis-section {
  @media (min-width: 768px) {
    grid-area: analysis;
  }
}

.thinking-section {
  @media (min-width: 768px) {
    grid-area: thinking;
  }
}

.action-section {
  @media (min-width: 768px) {
    grid-area: actions;
    margin-top: 0;
  }
}

.basic-info {
  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: $spacing-md;

    @media (min-width: 768px) {
      grid-template-columns: 1fr;
      gap: $pc-spacing-sm;
    }
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-sm 0;
    border-bottom: 1rpx solid $border-color;

    &:last-child {
      border-bottom: none;
    }

    @media (min-width: 768px) {
      padding: 12px 0;
      border-bottom-width: 1px;
    }
    
    .label {
      font-size: 26rpx;
      color: $text-gray;
      font-weight: 600;

      @media (min-width: 768px) {
        font-size: 14px;
      }
    }
    
    .value {
      font-size: 26rpx;
      color: $text-dark;
      font-weight: 500;

      @media (min-width: 768px) {
        font-size: 14px;
      }
    }
  }
}

.image-section, .segmentation-result {
  .detail-image, .result-image {
    width: 100%;
    height: 400rpx;
    border-radius: $border-radius;
    object-fit: contain;
    border: 1rpx solid #eee;
    background: $bg-light;
    transition: all $animation-duration $animation-timing;
    cursor: pointer;

    @media (min-width: 768px) {
      height: 300px;
      border-radius: $pc-border-radius;
      border-width: 1px;
    }

    @media (min-width: 1024px) {
      height: 350px;
    }

    &:active {
      transform: scale(0.98);
    }

    @media (min-width: 768px) {
      &:hover {
        transform: scale(1.02);
        box-shadow: $shadow-medium;
      }
    }
  }
}

.segmentation-result {
  .image-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20rpx;

    @media (min-width: 768px) {
      grid-template-columns: 1fr 1fr;
      gap: $pc-spacing-lg;
    }
  }
  
  .image-item {
    text-align: center;
    
    .image-label {
      font-size: 24rpx;
      color: $text-gray;
      display: block;
      margin-top: 10rpx;
      font-weight: 600;

      @media (min-width: 768px) {
        font-size: 14px;
        margin-top: $pc-spacing-sm;
      }
    }
  }
}

.classify-result {
  .result-card {
    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba($primary-color,0.03) 100%);
    border-radius: $border-radius-sm;
    padding: $spacing-xl;
    text-align: center;

    @media (min-width: 768px) {
      padding: $pc-spacing-xl;
      border-radius: 10px;
    }
  }
  
  .main-result {
    font-size: 32rpx;
    font-weight: bold;
    color: $primary-color;
    display: block;
    margin-bottom: 10rpx;

    @media (min-width: 768px) {
      font-size: 20px;
      margin-bottom: 8px;
    }
  }
  
  .confidence {
    font-size: 24rpx;
    color: $text-gray;
    display: block;
    margin-bottom: 30rpx;

    @media (min-width: 768px) {
      font-size: 14px;
      margin-bottom: $pc-spacing-lg;
    }
  }
}

.confidence-chart {
  .confidence-item {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    @media (min-width: 768px) {
      margin-bottom: 16px;
    }

    .class-name {
      font-size: 24rpx;
      color: $text-dark;
      width: 200rpx;
      min-width: 200rpx;
      text-align: left;
      font-weight: 600;

      @media (min-width: 768px) {
        font-size: 14px;
        width: 150px;
        min-width: 150px;
      }
    }
    
    .progress-bar {
      flex: 1;
      height: 20rpx;
      background: #eee;
      border-radius: 10rpx;
      margin: 0 15rpx;
      overflow: hidden;
      box-shadow: inset 0 1rpx 3rpx rgba(0,0,0,0.1);

      @media (min-width: 768px) {
        height: 12px;
        border-radius: 6px;
        margin: 0 $pc-spacing-sm;
      }
    }
    
    .progress-fill {
      height: 100%;
      border-radius: 10rpx;
      transition: width 0.5s $animation-timing;
      
      &.high { 
        background: linear-gradient(90deg, $success-color, #2ecc71); 
      }
      &.medium { 
        background: linear-gradient(90deg, $warning-color, #f1c40f); 
      }
      &.low { 
        background: linear-gradient(90deg, $danger-color, #e74c3c); 
      }

      @media (min-width: 768px) {
        border-radius: 6px;
      }
    }
    
    .percentage {
      font-size: 22rpx;
      color: $text-gray;
      width: 60rpx;
      text-align: right;
      font-weight: 600;

      @media (min-width: 768px) {
        font-size: 14px;
        width: 50px;
      }
    }
  }
}

.analysis-section, .thinking-section {
  .analysis-card, .thinking-card {
    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba($secondary-color,0.03) 100%);
    border-radius: $border-radius-sm;
    padding: $spacing-xl;
    max-height: 400rpx;
    overflow-y: auto;

    @media (min-width: 768px) {
      padding: $pc-spacing-lg;
      border-radius: 10px;
      max-height: 200px;
    }

    @media (min-width: 1024px) {
      max-height: 250px;
    }
  }
  
  .analysis-text, .thinking-text {
    font-size: 26rpx;
    color: $text-dark;
    line-height: 1.6;
    word-break: break-word;

    @media (min-width: 768px) {
      font-size: 14px;
      line-height: 1.7;
    }
  }
}

.action-section {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
    gap: $pc-spacing-lg;
    margin-top: 0;
  }
  
  .action-btn {
    flex: 1;
    height: 80rpx;
    line-height: 80rpx;
    border-radius: $border-radius;
    font-size: 28rpx;
    font-weight: 600;
    border: none;
    transition: all $animation-duration $animation-timing;
    box-shadow: $shadow-light;
    cursor: pointer;

    @media (min-width: 768px) {
      height: 56px;
      line-height: 56px;
      font-size: 16px;
      border-radius: $pc-border-radius;
    }
    
    &.share-btn {
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;

      @media (min-width: 768px) {
        &:hover {
          transform: translateY(-2px);
          box-shadow: $shadow-hover;
          background: linear-gradient(135deg, #2980b9, #3498db);
        }
      }
    }
    
    &.save-btn {
      background: linear-gradient(135deg, $primary-color, $primary-light);
      color: white;

      @media (min-width: 768px) {
        &:hover {
          transform: translateY(-2px);
          box-shadow: $shadow-hover;
          background: linear-gradient(135deg, $primary-dark, $primary-color);
        }
      }
    }

    &:active {
      transform: translateY(2rpx);
      box-shadow: $shadow-light;
    }

    @media (min-width: 768px) {
      &:active {
        transform: translateY(1px);
      }
    }
  }
}

/* 大屏幕PC优化 */
@media (min-width: 1440px) {
  .detail-page {
    max-width: 1400px;
  }
  
  .scroll-content {
    gap: $pc-spacing-xl;
    padding: $pc-spacing-xl * 1.5;
  }
}

/* 平板端优化 */
@media (min-width: 768px) and (max-width: 1024px) {
  .detail-page {
    max-width: 800px;
  }
  
  .scroll-content {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "basic"
      "image"
      "classify"
      "segmentation"
      "analysis"
      "thinking"
      "actions";
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .detail-page {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }
  
  .page-header {
    background: rgba(40, 40, 40, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .section {
    background: rgba(40, 40, 40, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .section-title,
  .basic-info .value,
  .main-result,
  .analysis-text,
  .thinking-text,
  .confidence-item .class-name {
    color: #ffffff;
  }
  
  .basic-info .label,
  .confidence,
  .image-label,
  .confidence-item .percentage {
    color: #cccccc;
  }
  
  .detail-image,
  .result-image {
    background: #2d2d2d;
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .classify-result .result-card,
  .analysis-card,
  .thinking-card {
    background: linear-gradient(135deg, rgba(40, 40, 40, 0.9) 0%, rgba($primary-color, 0.1) 100%);
  }
  
  .progress-bar {
    background: #3d3d3d !important;
  }
}

/* 减少动画设置支持 */
@media (prefers-reduced-motion: reduce) {
  .detail-page * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 移动端优化 */
@media (max-width: 767px) {
  .detail-page {
    padding: 0;
  }
  
  .page-header {
    padding: $spacing-md;
  }
  
  .scroll-content {
    padding: $spacing-md;
  }
  
  .section {
    margin-bottom: $spacing-md;
    padding: $spacing-md;
  }
}
</style>