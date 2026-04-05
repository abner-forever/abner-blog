import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Layout, Menu, Avatar, Dropdown, Space } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  LogoutOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { logout } from "@/store/authSlice";
import "./index.less";

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const userMenu = {
    items: [
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: t("adminLayout.logout"),
        onClick: handleLogout,
      },
    ],
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith("/moments/topics")) {
      return ["/moments/topics"];
    }
    if (path.startsWith("/moments")) {
      return ["/moments"];
    }
    return [path];
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith("/moments")) {
      return ["moments"];
    }
    return [];
  };

  return (
    <Layout className="admin-layout">
      <Sider width={220} theme="light" className="admin-layout__sider">
        <div className="admin-layout__logo">
          <span>{t("login.title")}</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          className="admin-layout__menu"
          items={[
            {
              key: "/dashboard",
              icon: <DashboardOutlined />,
              label: t("adminLayout.dashboard"),
            },
            {
              key: "/users",
              icon: <UserOutlined />,
              label: t("adminLayout.userManage"),
            },
            {
              key: "/blogs",
              icon: <FileTextOutlined />,
              label: t("adminLayout.articleManage"),
            },
            {
              key: "/system-announcements",
              icon: <NotificationOutlined />,
              label: t("adminLayout.systemAnnouncement"),
            },
            {
              key: "moments",
              icon: <MessageOutlined />,
              label: t("adminLayout.momentManage"),
              children: [
                { key: "/moments", label: t("adminLayout.momentList") },
                { key: "/moments/topics", label: t("adminLayout.topicManage") },
              ],
            },
          ]}
          onClick={({ key }) => handleMenuClick(key)}
        />
      </Sider>
      <Layout>
        <Header className="admin-layout__header">
          <Dropdown menu={userMenu}>
            <Space className="admin-layout__user">
              <Avatar
                icon={<UserOutlined />}
                className="admin-layout__avatar"
              />
              <span>{t("adminLayout.admin")}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content className="admin-layout__content">
          <div className="admin-layout__content-inner">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
