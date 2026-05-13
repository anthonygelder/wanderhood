import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";

const saved = localStorage.getItem("lang");
const browserLang = navigator.language.startsWith("es") ? "es" : "en";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: saved ?? browserLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
