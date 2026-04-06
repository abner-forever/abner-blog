import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { getBlogAdminAPI } from "@/services/generated/admin";
import { setCredentials } from "@/store/authSlice";
import "./index.less";

const api = getBlogAdminAPI();

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await api.adminLogin(values);
      console.log("Login response:", response);

      // 由于生成的 API 类型是 void，需要从响应中提取数据
      // 实际响应在 httpMutator 中通过 res.data 返回
      const result = response as unknown as
        | {
            token?: string;
            user?: { userId?: number; username?: string; role?: string };
          }
        | undefined;

      if (result?.token) {
        dispatch(
          setCredentials({
            token: result.token,
            user: {
              userId: result.user?.userId || 1,
              username: result.user?.username || values.username,
              role: (result.user?.role || "admin") as "admin" | "user",
            },
          }),
        );
        message.success(t("login.loginSuccess"));
        navigate("/dashboard");
      } else {
        message.error(t("login.noToken"));
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      // 尝试从错误响应中提取消息
      const axiosError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMsg =
        axiosError.response?.data?.message ||
        axiosError.message ||
        t("login.loginFail");
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-card__header">
          <h2 className="login-card__title">{t("login.title")}</h2>
          <p className="login-card__subtitle">{t("login.subtitle")}</p>
        </div>
        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: t("login.username") }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t("login.username")}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: t("login.password") }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t("login.password")}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t("login.loginButton")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
