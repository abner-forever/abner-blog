import React, { useEffect, useState } from "react";
import { Page } from "@/components";
import apiBlog from "@/services/apiBlog";
import { Checkbox, Input } from "antd-mobile";
import styles from "./style.module.less";

const Todo = () => {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    const init = async () => {
      const data = await apiBlog.getTodoList();
      setList(data.list);
    };
    init();
  }, []);
  const onChangeStatus = async (id: number, value: boolean) => {
    console.log("value", value);
    await apiBlog.updateTaskTodo({
      id,
      status: value ? 1 : 0,
    });
  };
  const onChangeTitle = async (id: number, value: string) => {
    console.log("value", value);
    await apiBlog.updateTaskTodo({
      id,
      title: value,
    });
  };
  return (
    <Page hideHeader>
      <div className={styles.todolist}>
        {list.map(item => {
          return (
            <div className={styles.todo_item} key={item.id}>
              <Checkbox
                onChange={value => onChangeStatus(item.id, value)}
                defaultChecked={item.status}
              />
              <div className={styles.item_right}>
                <Input
                  placeholder="请输入内容"
                  defaultValue={item.title}
                  onChange={val => {
                    onChangeTitle(item.id, val);
                  }}
                />
                <span>{item.description}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

export default Todo;
