import React, { useState } from "react";
import { Page } from "@/components";
import apiBlog from "@/services/apiBlog";
import { useMount } from "ahooks";
import { Button, Checkbox, Input } from "antd-mobile";
import styles from "./style.module.less";
import { useNavigate } from "@/hooks";

/** 我的运动 */
const Exercise = () => {
  const [list, setList] = useState<any[]>([]);
  const navigate = useNavigate();

  useMount(() => {
    const init = async () => {
      const data = await apiBlog.getTodoList({
        type: "exercise",
      });
      console.log("data", data);
      setList(data.list);
    };
    init();
  });
  const onClickExercise = () => {
    navigate("/exercise/checkIn");
  };
  return (
    <Page title="我的运动记录">
      <Button className={styles.go_exercise_btn} onClick={onClickExercise}>
        去打卡
      </Button>
      <div className={styles.exercise_list}>
        {list.map(item => (
          <ExerciseItem key={item.id} item={item} />
        ))}
      </div>
    </Page>
  );
};

const ExerciseItem = ({ item }: any) => {
  // const [value, setValue] = useState(item.status);
  // const { id } = item;
  // const onChangeStatus = async () => {
  //   setValue(!value);
  //   await apiBlog.updateTaskTodo({
  //     id,
  //     status: value ? 0 : 1,
  //   });
  // };

  // const onChangeTitle = async (value: string) => {
  //   await apiBlog.updateTaskTodo({
  //     id,
  //     title: value,
  //   });
  // };

  return (
    <div className={styles.exercise_item}>
      <Checkbox checked={item.status} />
      {/* <Input
        placeholder="请输入内容"
        defaultValue={item.title}
        className={styles.title}
        onChange={onChangeTitle}
      /> */}
      <div className={styles.title}>{item.title}</div>
    </div>
  );
};

export default Exercise;
