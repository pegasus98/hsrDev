import i18n, { InitOptions } from "i18next"
import i18nextBackend from "i18next-node-fs-backend"


import AppConfig from "./app.config"
const i18nextOptions:InitOptions = {
  backend:{
    // path where resources get loaded from
    loadPath: './src/config/locales/{{lng}}.json',
    // path to post missing resources
    addPath: './src/config/locales/{{lng}}.missing.json',
    // jsonIndent to use when storing json files
    jsonIndent: 2,
  },
  interpolation: {
    escapeValue: false
  },
  saveMissing: true,
  fallbackLng: AppConfig.fallbackLng,
  
  debug:true,
};
i18n
  .use(i18nextBackend);
// initialize if not already initialized
if (!i18n.isInitialized) {
  i18n
    .init(i18nextOptions);
}
export default i18n;