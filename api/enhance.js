import { uploadFile } from '../utils/request'

export const enhanceApi = {
  // PCA增强
  pcaEnhance: (filePath) => uploadFile('/user/enhance/pca', filePath),
  
  // 基本增强
  basicEnhance: (filePath) => uploadFile('/user/enhance/basic', filePath),
  
  // 所有增强
  allEnhance: (filePath) => uploadFile('/user/enhance/applyAll', filePath)
}