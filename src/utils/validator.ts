const countryRules: { [key: string]: RegExp } = {
  "86": /^1\d{10}$/, // 中国大陆
  "65": /^\d{8}$/, // 新加坡
  "1": /^\d{10}$/, // 美国和加拿大
  "852": /^\d{8}$/, // 中国香港
  "81": /^1\d{10,11}$/, // 日本
  "84": /^(0\d{10}|[1-9]\d{8,10})$/, // 越南
  "44": /^\d{10,11}$/, // 英国
  "64": /^\d{8,11}$/, // 新西兰
  "61": /^(9\d{8}|10\d{9})$/, // 澳大利亚
  default: /^\d{5,11}$/, // 其他国家
};

export const validatePhone = (value: MobileValue) => {
  if (value.phone) {
    const countryCode = value.countryCode.toString();
    const regex = countryRules[countryCode] || countryRules["default"];
    if (!regex.test(value.phone)) {
      return Promise.reject(new Error("手机号格式不正确"));
    }
    return Promise.resolve();
  }
  return Promise.reject(new Error("手机号不能为空"));
};

export const validatePassword = (value: string) => {
  if (value) {
    if (!/^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(value)) {
      return Promise.reject(new Error("密码格式不正确"));
    }
    return Promise.resolve();
  }
  return Promise.reject(new Error("密码不能为空"));
};

export const validateNickName = (value: string) => {
  if (value) {
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9\-_]{2,12}$/.test(value)) {
      return Promise.reject(new Error("账号格式不正确"));
    }
    return Promise.resolve();
  }
  return Promise.reject(new Error("请输入账号"));
};
