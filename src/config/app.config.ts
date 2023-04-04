export default {
    platform: process.platform,
    port: process.env.PORT ? process.env.PORT : 3000,
    title: 'PhraseApp Electron i18n',
    languages: ['zh', 'en'],
    fallbackLng: 'zh',
    namespace: 'translation'
  };