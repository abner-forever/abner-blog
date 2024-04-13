import React, { FC, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { useInterval } from "ahooks";
import { Input, Button, Form, Toast, InputRef } from "antd-mobile";
import { compileCryptoBase64Str } from "@/utils";
import { services } from "@/services";
import visparkTools from "@huohua/vispark-tools";
import { CheckCaptchaResponse } from "@huohua/vispark-tools/dist/lib/captcha/type";
import { useAppSelector } from "@/store/reduxHooks";
import { COMMON, LOGIN } from "@/vendor/sparktrace";
import { AUTH_TYPE_MAP } from "@/config/constants";
import useSparktrace from "@/hooks/useSparktrace";
import styles from "./style.module.less";
import handleInputFocus from "@/utils/handleInputFocus";

interface CheckCaptchaParams {
  businessId: number;
  captchaAppId: number;
  randStr: string;
  ticket: string;
  password: string;
}
interface AuthCodeInputProps {
  isMobilePassed: boolean;
  mobile: MobileValue;
  className?: string;
  onAuthCodePassed: (value: boolean) => void;
  /** 脱敏手机号 */
  maskPhone?: string;
  /** 验证码类型 1验证码登录 2忘记修改密码 3用户注销 */
  authType: 1 | 2 | 3;
  /** 是否为加入机构场景 */
  isJoinInstitution?: boolean;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}
/** 短信验证码输入框 */
const AuthCodeInput: FC<AuthCodeInputProps> = ({
  isMobilePassed,
  mobile,
  className,
  onAuthCodePassed,
  maskPhone,
  authType,
  isJoinInstitution,
  onFocus,
  onBlur,
}) => {
  const [isShowCutDownTime, setIsShowCutDownTime] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [cutDownTime, setCutDownTime] = useState(0);
  const { countryCode } = useAppSelector((state) => state.auth);
  const { isLogin } = useAppSelector((state) => state.user);
  const [sendSparkTrace] = useSparktrace(AUTH_TYPE_MAP[authType]);
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    handleInputFocus(inputRef.current?.nativeElement, 80);
  }, []);

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

  const checkAuthCode = (_: unknown, value: string) => {
    sendSparkTrace(COMMON.TEXT_INPUT, {
      use_name: "验证码输入",
      input_type: "验证码",
    });
    if (value.length === 6) {
      onAuthCodePassed(true);
      return Promise.resolve();
    }
    onAuthCodePassed(false);
    return Promise.reject(new Error(""));
  };

  // 发送验证码
  const onSendAuthCode = async (captchaToken?: string) => {
    if (!captchaToken) {
      sendSparkTrace(COMMON.BUTTON_CLICK, {
        button_name: "获取验证码",
        use_name: AUTH_TYPE_MAP[authType],
      });
    }
    try {
      if (!mobile?.phone && maskPhone === "") return;
      setBtnLoading(true);
      const bodyParams: SparkGoApi.AuthCodeParam = {
        authType,
        /** 国家码 */
        countryCode: mobile?.countryCode || countryCode,
        isLogin: isJoinInstitution ? false : isLogin,
        /** 手机号(加密) */
        phone: compileCryptoBase64Str(mobile?.phone || ""), // 有登录态设置密码 不传手机号报错
        /** 平台(1APP 2机构) */
        platform: 1,
        /**  校验的appId(1app 2机构) */
        verifyAppId: 1,
        captchaToken,
      };
      if (maskPhone) {
        delete bodyParams.phone;
      }
      const { data, message, success } =
        await services.sparkGoApi.userAuthApi.sendAuthCode({
          bodyParams,
          noCheck: true,
        });
      if (!data) throw Error(message);
      if (
        data?.captchaType === 2 &&
        data.businessId &&
        data.captchaAppId &&
        data.verifyAppId
      ) {
        visparkTools.captcha.sliderCaptchaV2({
          captchaTypeInfo: {
            businessId: data.businessId,
            captchaAppId: data.captchaAppId,
            verifyAppId: data.verifyAppId,
          },
          supportRecovery: true,
          checkCaptcha: async (
            params: CheckCaptchaParams
          ): Promise<CheckCaptchaResponse> => {
            if (!data.captchaAppId) return {};
            const { data: captchaData } =
              await services.sparkGoApi.userAuthApi.tencentCaptchaToken({
                bodyParams: params,
              });
            return { token: captchaData?.token };
          },
          onSuccess: function (token: string): void {
            onSendAuthCode(token);
          },
          onClose: () => {
            setBtnLoading(false);
          },
          onFail: function (error: string | Error): void {
            setBtnLoading(false);
            console.error("checkCaptcha error", error);
            Toast.show("验证失败，请稍后再试");
          },
          options: {
            userLanguage: "zh-CN",
          },
        });
      } else {
        Toast.show(
          success ? "验证码已发送" : message || "验证码发送失败，请稍后再试"
        );
        setBtnLoading(false);
        setIsShowCutDownTime(true);
        const _cutDownTime = data?.expiredTime
          ? data?.expiredTime - Date.now()
          : 60 * 1000;
        setCutDownTime(Math.floor(_cutDownTime / 1000));
        sendSparkTrace(LOGIN.GET_AUTH_CODE, {
          use_name: AUTH_TYPE_MAP[authType],
          result_is_success: true,
        });
      }
    } catch (error: unknown) {
      setBtnLoading(false);
      Toast.show((error as Error).message || "网络异常，请稍后再试");
      sendSparkTrace(LOGIN.GET_AUTH_CODE, {
        use_name: AUTH_TYPE_MAP[authType],
        result_is_success: false,
        fail_reason: (error as Error).message,
      });
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
          disabled={!isMobilePassed || isShowCutDownTime}
          onClick={() => onSendAuthCode()}
          loading={btnLoading}
        >
          {cutDownTime ? `${cutDownTime} S` : "获取验证码"}
        </Button>
      }
    >
      <Input
        ref={inputRef}
        type="text"
        placeholder="请输入验证码"
        maxLength={6}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </Form.Item>
  );
};

export default AuthCodeInput;
