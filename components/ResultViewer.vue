<template>
  <view class="result-container">
    <view class="result-section" v-if="resultData">
      <text class="section-title">分析结果</text>
      
      <!-- 分类结果 -->
      <view v-if="resultData.max_class_name" class="result-item">
        <text class="result-label">诊断分类:</text>
        <text class="result-value">{{ resultData.max_class_name }}</text>
        <text class="confidence">置信度: {{ (resultData.max_confidence * 100).toFixed(2) }}%</text>
      </view>
      
      <!-- 分割结果 -->
      <view v-if="resultData.mergedImage" class="image-results">
        <text class="result-label">分割结果:</text>
        <view class="image-grid">
          <view class="image-item">
            <text class="image-title">原始图像</text>
            <image :src="originalImage" class="result-image" mode="aspectFit"></image>
          </view>
          <view class="image-item">
            <text class="image-title">分割掩码</text>
            <image :src="resultData.binaryMask" class="result-image" mode="aspectFit"></image>
          </view>
          <view class="image-item">
            <text class="image-title">叠加结果</text>
            <image :src="resultData.mergedImage" class="result-image" mode="aspectFit"></image>
          </view>
        </view>
      </view>
      
      <!-- AI分析结果 -->
      <view v-if="resultData.analysisResult" class="analysis-result">
        <text class="result-label">AI分析:</text>
        <view class="analysis-content">
          <text>{{ parseAnalysisResult(resultData.analysisResult) }}</text>
        </view>
      </view>
    </view>
    
    <view v-else class="no-result">
      <text>暂无分析结果</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  resultData: Object,
  originalImage: String
})

// 解析AI分析结果
const parseAnalysisResult = (analysisResult) => {
  try {
    const parsed = JSON.parse(analysisResult)
    return parsed.aiMessage?.text || analysisResult
  } catch {
    return analysisResult
  }
}

// 置信度分布（如果存在）
const confidenceDistribution = computed(() => {
  if (props.resultData.all_confidences) {
    return Object.entries(props.resultData.all_confidences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // 显示前5个
  }
  return []
})
</script>

<style scoped>
.result-container {
  margin-top: 40rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  display: block;
}

.result-item {
  background: #f8f9fa;
  padding: 30rpx;
  border-radius: 15rpx;
  margin-bottom: 20rpx;
}

.result-label {
  font-weight: bold;
  color: #333;
  margin-right: 20rpx;
}

.result-value {
  color: #007AFF;
  font-weight: bold;
}

.confidence {
  color: #28a745;
  margin-left: 20rpx;
  font-size: 24rpx;
}

.image-results {
  margin-top: 40rpx;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200rpx, 1fr));
  gap: 20rpx;
  margin-top: 20rpx;
}

.image-item {
  text-align: center;
}

.image-title {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.result-image {
  width: 100%;
  height: 200rpx;
  border-radius: 10rpx;
  border: 1rpx solid #ddd;
}

.analysis-result {
  margin-top: 40rpx;
}

.analysis-content {
  background: #f8f9fa;
  padding: 30rpx;
  border-radius: 15rpx;
  margin-top: 15rpx;
  line-height: 1.6;
}

.no-result {
  text-align: center;
  color: #999;
  padding: 100rpx 0;
}
</style>