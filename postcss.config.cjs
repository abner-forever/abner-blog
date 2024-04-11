module.exports = {
  plugins: {
    "stylelint":{
      fix: true,
    },
    "postcss-pxtorem": {
      propList: ["*"],
    },
    autoprefixer: {
      // 添加浏览器前缀 详细配置生效范围 https://browserslist.dev/?q=bGFzdCAyIHZlcnNpb25z
      overrideBrowserslist: [
        "last 5 versions", // 所有主流浏览器最近5个版本
      ],
    },
  },
};
