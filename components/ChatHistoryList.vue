<!-- components/ChatHistoryList.vue -->
<template>
  <scroll-view class="history-list" scroll-y>
    <view
      v-for="item in records"
      :key="item.chatRecodeId"
      class="history-item"
      :class="{ active: item.memoryId === selectedId }"
      @click="selectChat(item)"
    >
      {{ item.firstQuestion || '新对话' }}
    </view>
  </scroll-view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getChatRecords } from '@/api/chat'

const records = ref([])
const selectedId = ref('')
const emit = defineEmits(['select'])

const loadHistory = async () => {
  try {
    const data = await getChatRecords({ page: 0, pageSize: 10 })
    records.value = data?.records || []
  } catch (e) {}
}

const selectChat = (item) => {
  selectedId.value = item.memoryId
  emit('select', item)
}

defineExpose({ loadHistory, selectedId })

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-list {
  height: 100%;
  background-color: #f5f5f5;
}
.history-item {
  padding: 20rpx 30rpx;
  border-bottom: 1px solid #eee;
  font-size: 28rpx;
}
.history-item.active {
  background-color: #d0eaff;
}
</style>