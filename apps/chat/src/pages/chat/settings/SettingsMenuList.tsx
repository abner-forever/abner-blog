import React from 'react';
import { RightOutlined } from '@ant-design/icons';

export interface SettingsMenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  /** 如果是导航类型菜单项，点击时 navigate 到该路径 */
  route?: string;
  /** 如果是拖拽 Sheet 类型，指定其 sheetKey */
  sheetKey?: string;
  /** 是否危险操作（退出登录） */
  isDanger?: boolean;
}

export interface SettingsMenuGroup {
  title: string;
  items: SettingsMenuItem[];
}

interface SettingsMenuListProps {
  groups: SettingsMenuGroup[];
  onItemClick: (item: SettingsMenuItem) => void;
}

const SettingsMenuList: React.FC<SettingsMenuListProps> = ({ groups, onItemClick }) => {
  return (
    <>
      {groups.map((group, groupIdx) => (
        <div className="settings-page__group" key={groupIdx}>
          <div className="settings-page__group-title">{group.title}</div>
          {group.items.map((item) => {
            const isDanger = item.isDanger;
            return (
              <div
                key={item.key}
                className={`settings-page__menu-item ${isDanger ? 'settings-page__menu-item--logout' : ''}`}
                onClick={() => onItemClick(item)}
              >
                <span className="settings-page__menu-item-icon">{item.icon}</span>
                <span className="settings-page__menu-item-label">{item.label}</span>
                <RightOutlined className="settings-page__menu-item-arrow" />
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
};

export default SettingsMenuList;
