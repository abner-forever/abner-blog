import React, { FC, useRef } from "react";
import classNames from "classnames";
import { Input, InputRef } from "antd-mobile";
import Iconfont from "@/components/Iconfont";
import styles from "./style.module.less";
import { useNavigate } from "react-router";

interface PhoneInputProps {
  className?: string;
  value?: MobileValue;
  onChange?: (value: MobileValue) => void;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}
/** 手机号输入框 */
const PhoneInput: FC<PhoneInputProps> = ({
  value = { countryCode: 86, phone: "" },
  onChange,
  onFocus,
  onBlur,
  className,
}) => {
  const searchParams = new URLSearchParams(location.search);
  const navigate = useNavigate();
  const { phone } = value;
  const inputRef = useRef<InputRef>(null);
  const onPhoneChange = (value: string) => {
    onChange?.({ phone: value, countryCode: 86 });
  };

  return (
    <div className={classNames(styles.phone_input, className)}>
      <div className={styles.country_code}>
        +{86}
        <Iconfont
          className={styles.arrow_down}
          type="icon-arrow"
          color="#804F46"
          size={24}
        />
      </div>
      <Input
        placeholder="请输入手机号"
        value={phone}
        type="tel"
        onChange={onPhoneChange}
        autoComplete="username"
        maxLength={11}
        ref={inputRef}
        clearable
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
};

export default PhoneInput;
