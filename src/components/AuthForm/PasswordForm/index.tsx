import React, { FC, useState } from "react";
import { Button, Form, Input } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { validateNickName, validatePassword } from "@/utils/validator";
import "./style.less";

interface PasswordSubmitParams {
  username: string;
  password: string;
}
interface PasswordFormProps {
  onSubmit: (params: PasswordSubmitParams) => void;
}

const PasswordForm: FC<PasswordFormProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const [formPassed, setFormPassed] = useState<Record<string, boolean>>({
    username: false,
    password: false,
  });

  const checkAccount = async (_: any, value: string) => {
    try {
      await validateNickName(value);
      setFormPassed({
        ...formPassed,
        username: true,
      });
    } catch (error) {
      setFormPassed({
        ...formPassed,
        username: false,
      });
      return Promise.reject(error);
    }
  };
  const checkPassword = async (_: any, value: string) => {
    try {
      await validatePassword(value);
      setFormPassed({
        ...formPassed,
        password: true,
      });
    } catch (error) {
      setFormPassed({
        ...formPassed,
        password: false,
      });
      return Promise.reject(error);
    }
  };
  const onFinish = (e: any) => {
    const { username, password } = form.getFieldsValue();
    onSubmit({ username, password });
  };
  return (
    <Form
      wrapperCol={{ span: 24 }}
      style={{ maxWidth: 600 }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
      autoComplete="off"
      className="login-form"
      form={form}
    >
      <Form.Item
        name="username"
        rules={[{ required: true, validator: checkAccount }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="请输入账号"
          className="input-item"
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, validator: checkPassword }]}
      >
        <Input
          prefix={<LockOutlined />}
          placeholder="请输入密码"
          className="input-item"
        />
      </Form.Item>
      <Button
        type="primary"
        disabled={Object.keys(formPassed).some(
          key => formPassed[key] === false
        )}
        size="large"
        className="button"
        htmlType="submit"
      >
        登录
      </Button>
    </Form>
  );
};

export default PasswordForm;
