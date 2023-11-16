import { render } from 'react-dom';
import {TransApp} from './App';
import 'antd/dist/antd.less';
import i18n from '../../config/i18next.config.render';
import { I18nextProvider } from 'react-i18next';
import { ConfigProvider } from 'antd';

// let initialI18nStore = window.jsBridge.sendSync('get-initial-translations');
window.jsBridge.on('language-changed', (message:{language:string,namespace:string,resource:any} )=> {
    if (!i18n.hasResourceBundle(message.language, message.namespace)) {
      i18n.addResourceBundle(message.language, message.namespace, message.resource);
    }
    i18n.changeLanguage(message.language);
  });

render(
  <I18nextProvider i18n={i18n}>
    <ConfigProvider>
      <TransApp />
    </ConfigProvider>
  </I18nextProvider>,
  document.getElementById('root')
);
