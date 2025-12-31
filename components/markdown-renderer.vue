<!-- components/markdown-renderer.vue -->
<template>
  <view class="markdown-content" v-html="htmlContent"></view>
</template>

<script>
import { parseMarkdown } from '@/utils/markdown-parser.js'

export default {
  name: 'MarkdownRenderer',
  props: {
    content: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      htmlContent: ''
    }
  },
  watch: {
    content: {
      immediate: true,
      handler(newVal) {
        this.renderMarkdown(newVal)
      }
    }
  },
  methods: {
    renderMarkdown(content) {
      if (!content) {
        this.htmlContent = ''
        return
      }
      
      try {
        this.htmlContent = parseMarkdown(content)
      } catch (error) {
        console.error('Markdown 渲染失败:', error)
        this.htmlContent = content
      }
    }
  }
}
</script>

<style scoped>
.markdown-content {
  line-height: 1.6;
}
</style>