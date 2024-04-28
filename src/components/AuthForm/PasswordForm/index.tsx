import React, { FC, useEffect, useRef, useState } from "react";
import { Button, Form, Input, InputRef } from "antd-mobile";
import { validateEmail, validatePassword } from "@/utils/validator";
import styles from "./style.module.less";

interface PasswordSubmitParams {
  email: string;
  password: string;
  loginType: number;
}
interface PasswordFormProps {
  onSubmit: (params: PasswordSubmitParams) => void;
}

const PasswordForm: FC<PasswordFormProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const ref = useRef<InputRef>(null);
  useEffect(() => {
    ref.current?.nativeElement?.addEventListener("blur", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }, []);
  const [formPassed, setFormPassed] = useState<Record<string, boolean>>({
    email: false,
    password: false,
  });

  const checkEmail = async (_: any, value: string) => {
    try {
      await validateEmail(value);
      setFormPassed({
        ...formPassed,
        email: true,
      });
    } catch (error) {
      setFormPassed({
        ...formPassed,
        email: false,
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
    const { email, password } = form.getFieldsValue();
    onSubmit({ email, password, loginType: 2 });
  };
  return (
    <Form
      style={{ maxWidth: 600 }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
      className={styles.form}
      form={form}
      footer={
        <Button
          color="primary"
          disabled={Object.keys(formPassed).some(
            key => formPassed[key] === false
          )}
          size="large"
          className={styles.submit}
          type="submit"
        >
          登录
        </Button>
      }
    >
      <Form.Item
        name="email"
        rules={[{ required: true, validator: checkEmail }]}
        className={styles.item}
      >
        <Input autoFocus placeholder="请输入邮箱账号" clearable />
      </Form.Item>
      <Form.Item
        name="password"
        className={styles.item}
        rules={[{ required: true, validator: checkPassword }]}
      >
        <Input ref={ref} type="password" placeholder="请输入密码" clearable />
      </Form.Item>
    </Form>
  );
};

export default PasswordForm;
