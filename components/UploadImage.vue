<template>
  <view class="upload-container">
    <view v-if="!imageUrl" class="upload-area" @click="chooseImage">
      <text class="upload-icon">📁</text>
      <text class="upload-text">点击选择图片</text>
    </view>
    
    <view v-else class="image-preview">
      <image :src="imageUrl" class="preview-image" mode="aspectFit"></image>
      <view class="preview-actions">
        <button class="action-btn" @click="chooseImage">重新选择</button>
        <button class="action-btn" @click="removeImage">删除</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['imageSelected'])
const imageUrl = ref('')

// 选择图片
const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      imageUrl.value = tempFilePath
      emit('imageSelected', tempFilePath)
    }
  })
}

// 删除图片
const removeImage = () => {
  imageUrl.value = ''
  emit('imageSelected', '')
}

// 暴露方法给父组件
defineExpose({
  clearImage: removeImage
})
</script>

<style scoped>
.upload-container {
  margin: 30rpx 0;
}

.upload-area {
  border: 2rpx dashed #ccc;
  border-radius: 20rpx;
  padding: 100rpx 40rpx;
  text-align: center;
  background: #fafafa;
  transition: all 0.3s;
}

.upload-area:active {
  background: #f0f0f0;
}

.upload-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.upload-text {
  font-size: 28rpx;
  color: #666;
}

.image-preview {
  text-align: center;
}

.preview-image {
  width: 100%;
  height: 400rpx;
  border-radius: 15rpx;
}

.preview-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
  justify-content: center;
}

.action-btn {
  background: #007AFF;
  color: white;
  border: none;
  padding: 20rpx 40rpx;
  border-radius: 10rpx;
  font-size: 26rpx;
}

.action-btn:active {
  background: #0056CC;
}
</style>