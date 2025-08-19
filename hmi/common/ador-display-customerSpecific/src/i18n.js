import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

console.log('initReactI18next', initReactI18next);
i18n
  .use(HttpBackend)
  .use(initReactI18next) // passing i18n to react-i18next
  .init({
    lng: "en",
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: `${process.env.PUBLIC_URL}/locales/{{lng}}.json`,
    },
  });

export default i18n;
