import React, { useState } from "react";
import { Page } from "@/components";
import {
  Radio,
  Form,
  Rate,
  TextArea,
  Picker,
  Button,
  Toast,
} from "antd-mobile";
import styles from "./style.module.less";
import dayjs from "dayjs";
import apiBlog from "@/services/apiBlog";

const exerCiseTime = [
  [
    { label: "0", value: 0 },
    { label: "10分钟", value: 10 },
    { label: "15分钟", value: 15 },
    { label: "20分钟", value: 20 },
    { label: "25分钟", value: 25 },
    { label: "30分钟", value: 30 },
    { label: "35分钟", value: 35 },
    { label: "40分钟", value: 40 },
    { label: "一小时", value: 60 },
  ],
];

const ExerciseCheckIn = () => {
  const [form] = Form.useForm();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [exerciseTime, setExerciseTime] = useState<any>();
  const [formPassword, setFormPassword] = useState<Record<string, boolean>>({
    status: false,
    spendTime: false,
    rate: false,
  });
  const onSubmit = async () => {
    const value = form.getFieldsValue();
    const params = {
      ...value,
      type: "exercise",
      title: `${dayjs().format("YYYY-MM-DD")}-运动打卡`,
    };
    const data = await apiBlog.addTask(params);
    if (data) Toast.show("恭喜你打卡成功");
  };
  const onFieldsChange = () => {
    const { status, spendTime, rate } = form.getFieldsValue();
    setFormPassword({
      status: status !== undefined,
      spendTime: spendTime !== undefined,
      rate: rate !== undefined,
    });
  };

  return (
    <Page title="运动打卡" bodyClassName={styles.exercise_checkin}>
      <Form
        form={form}
        onFinish={onSubmit}
        onFieldsChange={onFieldsChange}
        className={styles.exercise_form}
      >
        <Form.Header>
          <p className={styles.title}>你今天运动了吗</p>
        </Form.Header>
        <Form.Item
          name="status"
          rules={[{ required: true }]}
          label="1. 是否完成训练"
        >
          <Radio.Group>
            <Radio value={1}>是</Radio>
            <Radio value={2}>否</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          rules={[{ required: true }]}
          name="spendTime"
          label="2. 锻炼时间"
        >
          <div>
            <Button
              onClick={() => {
                setPickerVisible(true);
              }}
            >
              {exerciseTime !== undefined
                ? `已选择${exerciseTime}分钟`
                : "请选择"}
            </Button>
            <Picker
              columns={exerCiseTime}
              visible={pickerVisible}
              onClose={() => {
                setPickerVisible(false);
              }}
              onConfirm={val => {
                form.setFieldValue("spendTime", val[0]);
                console.log("(val[0]", val[0]);

                setExerciseTime(val[0]);
              }}
            />
          </div>
        </Form.Item>
        <Form.Item
          name="rate"
          rules={[{ required: true }]}
          label="3. 今天的表现"
        >
          <Rate allowHalf allowClear={true} defaultValue={0} />
        </Form.Item>
        <Form.Item name="description" label="4. 今天的状态分享">
          <TextArea placeholder="分享下今天锻炼的效果吧~" />
        </Form.Item>
        <div className={styles.submit_btn}>
          <Button
            disabled={Object.keys(formPassword).some(
              key => formPassword[key] === false
            )}
            type="submit"
            color="primary"
          >
            提交
          </Button>
        </div>
      </Form>
    </Page>
  );
};

export default ExerciseCheckIn;
