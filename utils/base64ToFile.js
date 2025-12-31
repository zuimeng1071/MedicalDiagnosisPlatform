// base64转文件
export const base64ToFile = (base64, filename) => {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  return new File([u8arr], filename, { type: mime })
}

// 保存base64图片到本地
export const saveBase64Image = (base64) => {
  return new Promise((resolve, reject) => {
    // 这里需要根据实际平台实现保存逻辑
    // 以下为示例代码
    uni.showLoading({ title: '保存中...' })
    
    // 模拟保存过程
    setTimeout(() => {
      uni.hideLoading()
      uni.showToast({ title: '保存成功', icon: 'success' })
      resolve()
    }, 1000)
  })
}