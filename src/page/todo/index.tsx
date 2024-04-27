import React, { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { Empty, Page, Iconfont } from "@/components";
import apiBlog from "@/services/apiBlog";
import {
  Popup,
  Checkbox,
  Dialog,
  Input,
  List,
  SwipeAction,
  Toast,
} from "antd-mobile";
import { Action, SwipeActionRef } from "antd-mobile/es/components/swipe-action";

import styles from "./style.module.less";
import AddTodoForm from "./AddTodoForm";
import AddTodoPop from "./AddTodoForm";

const Todo = () => {
  const [list, setList] = useState<any[]>();
  const [popVisible, setPopVisible] = useState(false);
  useEffect(() => {
    const init = async () => {
      const data = await apiBlog.getTaskList({ type: "todo" });
      setList(data.list);
    };
    if (popVisible) return;
    init();
  }, [popVisible]);
  const ref = useRef<SwipeActionRef>(null);

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
  const rightActions: Action[] = [
    {
      key: "pin",
      text: "置顶",
      color: "primary",
    },
    {
      key: "delete",
      text: "删除",
      color: "danger",
    },
  ];
  const onAction = (action: Action, id: number) => {
    switch (action.key) {
      case "delete":
        Dialog.confirm({
          content: "确定删除吗",
          onConfirm: async () => {
            const data = await apiBlog.removeTodo({
              id,
            });
            if (data) {
              const _newList = list?.filter(item => item.id !== id);
              setList(_newList);
              Toast.show("删除成功");
            }
          },
        });
    }
  };
  const togglePopVisible = () => {
    setPopVisible(!popVisible);
  };
  return (
    <Page hideHeader bodyClassName={styles.todo_page}>
      <div
        className={classNames(styles.todolist, {
          [styles.no_data]: list?.length === 0,
        })}
      >
        {!!list?.length && (
          <List>
            {list.map(item => (
              <SwipeAction
                ref={ref}
                key={item.id}
                tabIndex={item.id}
                rightActions={rightActions}
                onAction={action => onAction(action, item.id)}
              >
                <List.Item>
                  <TodoItem item={item} />
                </List.Item>
              </SwipeAction>
            ))}
          </List>
        )}
        {list?.length === 0 && <Empty title="暂无待办" />}
      </div>
      <div className={styles.add_todo} onClick={togglePopVisible}>
        <Iconfont type="icon-jiahao" size={28} color="#fff" />
      </div>
      <AddTodoPop popVisible={popVisible} onClose={togglePopVisible} />
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
