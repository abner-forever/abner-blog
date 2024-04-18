import React, { useState, FC } from "react";
import classNames from "classnames";
import { Button, Form, Input } from "antd-mobile";
import { validateEmail } from "@/utils/validator";
import AuthCodeInput from "../AuthCodeInput";
import { debounce } from "lodash";
import styles from "./style.module.less";

interface AuthCodeFormProps {
  onSubmit: (params: any) => void;
}

/**
 * 验证码登录表单
 */
const AuthCodeForm: FC<AuthCodeFormProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const [formPassed, setFormPassed] = useState<Record<string, boolean>>({
    email: false,
    authCode: false,
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

  const onFinish = () => {
    const { authCode, email } = form.getFieldsValue();
    onSubmit({ authCode, email, loginType: 1 });
  };
  return (
    <Form
      form={form}
      layout="vertical"
      className={classNames(styles.auth_code_form, "auth-form")}
      onFinish={debounce(onFinish, 200)}
    >
      <Form.Item
        name="email"
        rules={[{ required: true, validator: checkEmail }]}
        className="input-item"
      >
        <Input autoFocus placeholder="请输入邮箱账号" clearable />
      </Form.Item>
      <AuthCodeInput
        className={styles.form_input}
        email={form.getFieldValue("email")}
        isEmailPassed={formPassed.email}
        onAuthCodePassed={() => {
          setFormPassed({
            ...formPassed,
            authCode: true,
          });
        }}
      />
      <div className={styles.submit_login}>
        <Button
          size="large"
          disabled={Object.keys(formPassed).some(
            key => formPassed[key] === false
          )}
          color="primary"
          type="submit"
        >
          登录
        </Button>
      </div>
      <div className={styles.login_tips}>未注册邮箱登录将自动注册</div>
    </Form>
  );
};

export default AuthCodeForm;
