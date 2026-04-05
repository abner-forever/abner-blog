import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zh_CN from "./locales/zh_CN";

i18n.use(initReactI18next).init({
  resources: {
    "zh-CN": {
      translation: zh_CN,
    },
  },
  lng: "zh-CN",
  fallbackLng: "zh-CN",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
