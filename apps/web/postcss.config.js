export default {
  plugins: {
    'postcss-pxtorem': {
      rootValue: 16, // 基准字体大小，16px = 1rem
      unitPrecision: 5,
      propList: ['*'],
      selectorBlackList: [],
      replace: true,
      mediaQuery: false,
      minPixelValue: 2,
    },
    'postcss-preset-env': {
      autoprefixer: {
        flexbox: 'no-2009'
      },
      stage: 3
    }
  },
}; 
