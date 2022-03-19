import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'antd';
import menuList from './menus.config';
import styles from './index.module.css';
class MenuView extends PureComponent {
  static defaultProps = {
    mode: 'inline',
  };
  renderMenu = (list: any[]) => {
    const mode = 'inline';
    return list.map((item) => {
      const { path, name, children } = item;
      if (children) {
        const subMenu = this.renderMenu(children);
        return (
          <Menu.SubMenu
            key={name}
            title={
              <span>{mode === 'inline' ? <span>{name}</span> : null}</span>
            }
          >
            {subMenu}
          </Menu.SubMenu>
        );
      } else {
        return (
          <Menu.Item key={path}>
            <Link to={path}>
              <span>{name}</span>
            </Link>
          </Menu.Item>
        );
      }
    });
  };
  render() {
    return (
      <Menu
        defaultSelectedKeys={['/home']}
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
