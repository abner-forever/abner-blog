import React, { FC, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { useInterval } from "ahooks";
import { Input, Button, Form, Toast, InputRef } from "antd-mobile";
import styles from "./style.module.less";
import apiBlog from "@/services/apiBlog";

interface AuthCodeInputProps {
  isEmailPassed: boolean;
  email: MobileValue;
  className?: string;
  onAuthCodePassed: (value: boolean) => void;
}
/** 短信验证码输入框 */
const AuthCodeInput: FC<AuthCodeInputProps> = ({
  isEmailPassed,
  email,
  className,
  onAuthCodePassed,
}) => {
  const [isShowCutDownTime, setIsShowCutDownTime] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [cutDownTime, setCutDownTime] = useState(0);
  const ref = useRef<InputRef>(null);
  useInterval(
    () => {
      const _cutDownTime = cutDownTime - 1;
      const _time = _cutDownTime > 0 ? _cutDownTime : 0;
      if (_time === 0) {
        setIsShowCutDownTime(false);
      }
      setCutDownTime(_time);
    },
    1000,
    {
      immediate: isShowCutDownTime,
    }
  );
  useEffect(()=>{
    ref.current?.nativeElement?.addEventListener('blur',()=>{
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    })
  },[])
  const checkAuthCode = (_: unknown, value: string) => {
    if (value.length === 6) {
      onAuthCodePassed(true);
      return Promise.resolve();
    }
    onAuthCodePassed(false);
    return Promise.reject(new Error(""));
  };

  // 发送验证码
  const onSendAuthCode = async () => {
    try {
      setBtnLoading(true);
      const params = {
        email,
      };
      const data = await apiBlog.authCode({ email });
      Toast.show("验证码已发送");
      setBtnLoading(false);
      setIsShowCutDownTime(true);
      const _cutDownTime = data?.expiredTime
        ? new Date(data?.expiredTime).getTime() - Date.now()
        : 60 * 1000;
      setCutDownTime(Math.floor(_cutDownTime / 1000));
    } catch (error: unknown) {
      setBtnLoading(false);
      Toast.show((error as Error).message || "网络异常，请稍后再试");
      console.error("onSendAuthCode error", error);
    }
  };
  return (
    <Form.Item
      name="authCode"
      className={classNames(styles.auth_code_input, className)}
      rules={[{ validator: checkAuthCode }]}
      extra={
        <Button
          color="primary"
          disabled={!isEmailPassed || isShowCutDownTime}
          onClick={() => onSendAuthCode()}
          loading={btnLoading}
          className={styles.get_auth_code}
        >
          {cutDownTime ? `${cutDownTime} S` : "获取验证码"}
        </Button>
      }
    >
      <Input ref={ref} type="text" placeholder="请输入验证码" maxLength={6} />
    </Form.Item>
  );
};

export default AuthCodeInput;
