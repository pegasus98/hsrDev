import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'antd';
import menuList from './menus.config';
import styles from './index.module.css';
import { WithTranslation,withTranslation } from 'react-i18next';

type Props = {
  rightLevel:number
}
class MenuView extends PureComponent<WithTranslation,any> {

  static defaultProps = {
    mode: 'inline',
    rightLevel:0
  };
  renderMenu = (list: any[]) => {
    const {t}= this.props
    const mode = 'inline';
    return list.map((item) => {
      if(this.props.rightLevel<item.level)
        return
      const { path, name, children } = item;
      if (children) {
        const subMenu = this.renderMenu(children);
        return (
          <Menu.SubMenu
            key={name}
            title={
              <span>{mode === 'inline' ? <span>{t(name)}</span> : null}</span>
            }
          >
            {subMenu}
          </Menu.SubMenu>
        );
      } else {
        return (
          <Menu.Item key={path}>
            <Link to={path}>
              <span>{t(name)}</span>
            </Link>
          </Menu.Item>
        );
      }
    });
  };
  render() {

    return (
      <Menu
        defaultSelectedKeys={['/']}
        mode="inline"
        className={styles.menu}
        theme="light"
      >
        {this.renderMenu(menuList)}
      </Menu>
    );
  }
}
export default MenuView;
