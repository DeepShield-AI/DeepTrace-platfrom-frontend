// src/utils/encryption.js

/**
 * 使用SHA-256加密密码
 * @param {string} password 明文密码
 * @returns {Promise<string>} 加密后的十六进制字符串
 */
export async function sha256Encrypt(password) {
  try {
    // 将字符串编码为Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // 使用Web Crypto API进行SHA-256加密
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // 将ArrayBuffer转换为十六进制字符串
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('加密失败:', error);
    throw new Error('密码加密失败');
  }
}

/**
 * 替代方案：使用crypto-js库（如果需要兼容老浏览器）
 * 首先安装：npm install crypto-js
 */
// import CryptoJS from 'crypto-js';
// export function sha256Encrypt(password) {
//   return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
// }