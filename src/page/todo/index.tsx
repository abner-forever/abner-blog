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
    await apiBlog.updateTaskTodo({
      id,
      status: value ? 1 : 0,
    });
  };
  const onChangeTitle = async (id: number, value: string) => {
    await apiBlog.updateTaskTodo({
      id,
      title: value,
    });
  };
  return (
    <Page hideHeader>
      <div className={styles.todolist}>
        {list.map(item => (
          <TodoItem key={item.id} item={item} />
        ))}
      </div>
    </Page>
  );
};

const TodoItem = ({ item }: any) => {
  const [value, setValue] = useState(item.status);
  const { id } = item;
  const onChangeStatus = async () => {
    setValue(!value);
    await apiBlog.updateTaskTodo({
      id,
      status: value ? 0 : 1,
    });
  };

  const onChangeTitle = async (value: string) => {
    await apiBlog.updateTaskTodo({
      id,
      title: value,
    });
  };

  return (
    <div className={styles.todo_item}>
      <Checkbox onChange={onChangeStatus} defaultChecked={item.status} />
      <div className={styles.item_right}>
        <Input
          placeholder="请输入内容"
          defaultValue={item.title}
          className={styles.title}
          onChange={onChangeTitle}
        />
         <span>{item.description}</span>
      </div>
      {/* <div className={styles.title}>{item.title}</div> */}
    </div>
  );
};
export default Todo;
