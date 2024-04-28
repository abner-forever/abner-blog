import React, { useState } from "react";
import styles from "./style.module.less";
import {
  Button,
  Form,
  Input,
  Picker,
  Switch,
  TextArea,
  Toast,
  DatePicker,
  Popup,
} from "antd-mobile";
import apiBlog from "@/services/apiBlog";
interface AddTodoFormProps {
  popVisible?: boolean;
  onClose: () => void;
}

/**
 * 添加待办弹窗
 */
const AddTodoPop = ({ popVisible, onClose }: AddTodoFormProps) => {
  const [form] = Form.useForm();
  const emailNotification = Form.useWatch("emailNotification", form);
  const title = Form.useWatch("title", form);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const onSubmit = async () => {
    const forms = form.getFieldsValue();
    if(emailNotification && !forms.notificationTime){
      return Toast.show('请选择提醒时间')
    }
    const params = {
      ...forms,
      type: "todo",
    };
    const data = await apiBlog.addTask(params);
    if (data) {
      Toast.show("添加成功");
      togglePopVisible();
    }
  };
  const toggleDatePickerVisible = () => {
    setDatePickerVisible(!datePickerVisible);
  };
  const togglePopVisible = () => {
    onClose();
    form.resetFields();
  };
  return (
    <Popup
      visible={popVisible}
      onMaskClick={togglePopVisible}
      onClose={togglePopVisible}
      position="bottom"
      showCloseButton
      className={styles.pop_modal}
    >
      <div className={styles.add_todo_container}>
        <Form
          onFinish={onSubmit}
          form={form}
          footer={
            <Button disabled={!title} color="primary" type="submit">
              提交
            </Button>
          }
        >
          <Form.Header>
            <p className={styles.title}>添加待办</p>
          </Form.Header>
          <Form.Item
            name="title"
            rules={[{ required: true, message: "请输入待办事项" }]}
          >
            <Input placeholder="请输入待办事项" />
          </Form.Item>
          <Form.Item name="description">
            <TextArea placeholder="事项描述" />
          </Form.Item>
          <Form.Item label="是否邮件提醒" name="emailNotification">
            <Switch />
          </Form.Item>
          {emailNotification && (
            <Form.Item label="提醒时间" name="notificationTime">
              <Button onClick={toggleDatePickerVisible}>选择时间</Button>
              <DatePicker
                visible={datePickerVisible}
                precision="minute"
                min={new Date()}
                onClose={toggleDatePickerVisible}
                onConfirm={val => {
                  form.setFieldValue("notificationTime", val.getTime());
                }}
              />
            </Form.Item>
          )}
        </Form>
      </div>
    </Popup>
  );
};

export default AddTodoPop;
