import React from "react";
import { useStore } from "@/hooks";
import { Page } from "@/components";
import styles from "./style.module.less";
import { DEFAULT_HEAD } from "@/constant";
import apiBlog from "@/services/apiBlog";
import config from "@/config";
import { Button, Form, Input, Toast } from "antd-mobile";
import { observer } from "mobx-react";

const Account = () => {
  const { global } = useStore();
  const [form] = Form.useForm();

  const handleAvatorChange = async (event: any) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    const { url } = await apiBlog.uploadAvator(formData);
    const urls = config.imageServer + url;
    const data = await apiBlog.updateUserInfo({
      avator: urls,
    });
    if (data) {
      global.updateUserInfo({
        avator: urls,
      });
      Toast.show("头像更新成功");
    }
  };

  const onSubmit = async () => {
    const params = form.getFieldsValue();
    const data = await apiBlog.updateUserInfo(params);
    if (data) {
      global.updateUserInfo({
        ...global?.userInfo,
        ...params,
      });
      Toast.show("信息更新成功");
    }
  };

  return (
    <Page title="账号信息" bodyClassName={styles.account}>
      <div className={styles["avator-container"]}>
        <img
          className={styles.avator}
          src={global?.userInfo?.avator || DEFAULT_HEAD}
          alt="avator"
        />
        <input type="file" onChange={handleAvatorChange} />
      </div>
      <span>更换头像</span>
      <Form
        className={styles.user_form}
        name="form"
        form={form}
        onFinish={onSubmit}
        initialValues={{
          username: global?.userInfo?.username || "",
          sign: global?.userInfo?.sign || "",
        }}
        footer={
          <Button block type="submit" color="primary" size="large">
            保存
          </Button>
        }
      >
        <Form.Item name="username" label="昵称" rules={[{ required: true }]}>
          <Input maxLength={20} minLength={2} placeholder="请输入昵称" clearable />
        </Form.Item>
        <Form.Item name="sign" label="签名">
          <Input placeholder="请输入个性签名" clearable />
        </Form.Item>
      </Form>
    </Page>
  );
};

export default observer(Account);
