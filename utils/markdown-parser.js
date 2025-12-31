// utils/markdown-parser.js
import MarkdownIt from 'markdown-it'

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
})

/**
 * 解析 Markdown 为 HTML
 */
export function parseMarkdown(markdown) {
  if (!markdown) return ''
  try {
    return md.render(markdown)
  } catch (error) {
    console.error('Markdown 解析错误:', error)
    return markdown // 解析失败时返回原文本
  }
}