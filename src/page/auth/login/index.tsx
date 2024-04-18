import React from "react";
import ApiBlog from "@/services/apiBlog";
import { Tabs, Toast } from "antd-mobile";
import { useNavigate } from "@/hooks";
import PasswordForm from "@/components/AuthForm/PasswordForm";
import useStore from "@/hooks/useStore";
import { Page } from "@/components";
import "./styles.less";
import AuthCodeForm from "@/components/AuthForm/AuthCodeForm";

/**
 * 登录页面
 * @param props
 * @returns
 */
const Login = () => {
  const { global } = useStore();
  const navigate = useNavigate();
  const onLogin = async ({ email, password, authCode, loginType }: any) => {
    try {
      let res: any = await ApiBlog.login({
        email,
        password,
        authCode,
        loginType, // 密码登录
      });
      if (res && res.token) {
        Toast.show("登录成功");
        global.isLogin = true;
        navigate("/userCenter", {
          replace: true,
        });
      }
    } catch (error: any) {
      Toast.show(error.message);
    }
  };
  const handleBack = () => {
    navigate("/", { replace: true });
  };
  return (
    <Page onBack={handleBack} title="登录" bodyClassName="login-page">
      <Tabs>
        <Tabs.Tab title="验证码登录" key="authCode">
          <AuthCodeForm onSubmit={onLogin} />
        </Tabs.Tab>
        <Tabs.Tab title="密码登录" key="password">
          <PasswordForm onSubmit={onLogin} />
        </Tabs.Tab>
      </Tabs>
    </Page>
  );
};
export default Login;
