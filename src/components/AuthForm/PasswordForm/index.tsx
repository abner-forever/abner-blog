import React, { FC, useState } from "react";
import { Button, Form, Input } from "antd-mobile";
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
  const onFinish = () => {
    const { username, password } = form.getFieldsValue();
    console.log("onFinish", username);
    onSubmit({ username, password });
  };
  return (
    <Form
      style={{ maxWidth: 600 }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
      className="login-form"
      form={form}
    >
      <Form.Item
        name="username"
        rules={[{ required: true, validator: checkAccount }]}
        className="input-item"
      >
        <Input placeholder="请输入账号" clearable />
      </Form.Item>
      <Form.Item
        name="password"
        className="input-item"
        rules={[{ required: true, validator: checkPassword }]}
      >
        <Input placeholder="请输入密码" clearable />
      </Form.Item>
      <Button
        color="primary"
        disabled={Object.keys(formPassed).some(
          key => formPassed[key] === false
        )}
        size="large"
        className="button"
        type="submit"
      >
        登录
      </Button>
    </Form>
  );
};

export default PasswordForm;
