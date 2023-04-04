// import the original type declarations
import 'react-i18next';
// import all namespaces (for the default language, only)
import en from './locales/en.json';
import zhcn from './locales/zh.json';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';


// react-i18next versions higher than 11.11.0
declare module 'react-i18next' {
  // and extend them!
  interface CustomTypeOptions {
    // custom namespace type if you changed it
    defaultNS: 'en';
    // custom resources type
    resources: {
      "en": typeof en;
      "zh": typeof zhcn;
    };
  }
};


i18n
	.use(initReactI18next)

	.init({
		resources:{
            "en": {
                translation: en
            },
            "zh": {
                translation: zhcn
            }
        },
		fallbackLng: "zh",
		debug: true,
		interpolation: {
			escapeValue: false, // not needed for react as it escapes by default
		}
	});

export default i18n;