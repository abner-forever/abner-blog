import { useState, FC, useEffect } from "react";
import classNames from "classnames";
import { Button, Form } from "antd-mobile";
import { useAppSelector } from "@/store/reduxHooks";
import PhoneInput from "@/components/AuthForm/PhoneInput";
import AuthCodeInput from "@/components/AuthForm/AuthCodeInput";
import AgreementCheck from "../AgreementCheck";
import { validatePhone } from "@/utils/validator";
import { debounce } from "lodash";
import { isNativeAndroid } from "@/vendor/hybrid-api/util";
import styles from "./style.module.less";

interface AuthCodeFormProps {
  /** 验证码类型 1-验证码登录  3-用户注销 */
  authType: 1 | 3;
  /** 脱敏手机号 */
  maskPhone?: string;
  onSubmit: (params: AuthSubmitParams) => void;
  isJoinInstitution?: boolean;
  sendSparkTrace: SendSparkTraceFunction;
  onPhoneChange?: (val: MobileValue) => void;
  defaultPhone?: string;
}

/**
 * 验证码登录表单
 */
const AuthCodeForm: FC<AuthCodeFormProps> = ({
  authType,
  maskPhone = "",
  onSubmit,
  isJoinInstitution,
  sendSparkTrace,
  onPhoneChange,
  defaultPhone,
}) => {
  const [form] = Form.useForm();
  const [isMobilePassed, setIsMobilePassed] = useState(false);
  const [isAuthCodePassed, setIsAuthCodePassed] = useState(false);
  const [isCheckAgreement, setIsCheckAgreement] = useState(false);
  const { countryCode } = useAppSelector((state) => state.auth);
  const { loginType } = useAppSelector((state) => state.auth);
  const [inputFocus, setInputFocus] = useState(false);
  const checkMobile = async (_: unknown, value: MobileValue) => {
    try {
      if (maskPhone) return Promise.resolve(null);
      await validatePhone(value);
      setIsMobilePassed(true);
    } catch (error) {
      setIsMobilePassed(false);
      return Promise.reject(error);
    }
  };

  useEffect(() => {
    const value = {
      countryCode,
      phone: defaultPhone,
    };
    form.setFieldValue("mobile", value);
    form.setFieldValue("authCode", "");
    setIsAuthCodePassed(false);
    validatePhone(value)
      .then(() => {
        setIsMobilePassed(true);
      })
      .catch(() => {
        setIsMobilePassed(false);
      });
  }, [loginType, countryCode, defaultPhone, form]);

  const onFinish = () => {
    const { authCode, mobile } = form.getFieldsValue();
    onSubmit({ isCheckAgreement, authCode, mobile, loginType: 1 });
  };
  return (
    <Form
      form={form}
      layout="vertical"
      className={classNames(styles.auth_code_form, "auth-form")}
      onFinish={debounce(onFinish, 200)}
      initialValues={{
        mobile: { countryCode, phone: maskPhone || defaultPhone },
        authCode: "",
      }}
    >
      <div className={styles.form_input_wrap}>
        <Form.Item
          name="mobile"
          layout="horizontal"
          rules={[{ validator: checkMobile }]}
          className={styles.form_input}
          messageVariables={{ phone: "" }}
          disabled={maskPhone !== ""}
          validateFirst
        >
          <PhoneInput
            useName="验证码登录"
            onChange={onPhoneChange}
            onFocus={() => setInputFocus(true)}
            onBlur={() => setInputFocus(false)}
          />
        </Form.Item>
        <AuthCodeInput
          className={styles.form_input}
          mobile={form.getFieldValue("mobile")}
          isMobilePassed={isMobilePassed || maskPhone !== ""}
          onAuthCodePassed={setIsAuthCodePassed}
          maskPhone={maskPhone}
          authType={authType}
          isJoinInstitution={isJoinInstitution}
          onFocus={() => setInputFocus(true)}
          onBlur={() => setInputFocus(false)}
        />
        <Button
          className={styles.submit_login}
          size="large"
          disabled={
            !isAuthCodePassed ||
            (isMobilePassed && maskPhone !== "") ||
            (!isMobilePassed && maskPhone === "")
          }
          color="primary"
          type="submit"
        >
          {authType === 3
            ? "确认注销"
            : `${isJoinInstitution ? "登录并加入机构" : "登录"}`}
        </Button>
        {isJoinInstitution && (
          <div className={styles.login_tips}>未注册手机号登录将自动注册</div>
        )}
      </div>
      {authType !== 3 && (
        <AgreementCheck
          className={classNames(styles.agreement, {
            [styles.input_focus]: isNativeAndroid() && inputFocus,
          })}
          checked={isCheckAgreement}
          onCheckChange={setIsCheckAgreement}
          authType={authType}
          sendSparkTrace={sendSparkTrace}
        />
      )}
    </Form>
  );
};

export default AuthCodeForm;
