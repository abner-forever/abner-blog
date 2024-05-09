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
  Collapse,
} from "antd-mobile";
import { Action, SwipeActionRef } from "antd-mobile/es/components/swipe-action";
import AddTodoPop from "./AddTodoForm";
import dayjs from "dayjs";
import styles from "./style.module.less";

interface TodoData {
  undoneList?: any[];
  doneList?: any[];
}

const Todo = () => {
  const [todoData, setTodoData] = useState<TodoData>();
  const [popVisible, setPopVisible] = useState(false);
  useEffect(() => {
    const init = async () => {
      const data = await apiBlog.getTaskList({ type: "todo" });
      const undoneList = data.list.filter((item: any) => item.status === 0);
      const doneList = data.list.filter((item: any) => item.status === 1);
      setTodoData({
        undoneList,
        doneList,
      });
    };
    if (popVisible) return;
    init();
  }, [popVisible]);
  const ref = useRef<SwipeActionRef>(null);

  const rightActions: Action[] = [
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
          title: "确定删除吗",
          onConfirm: async () => {
            const data = await apiBlog.removeTodo({
              id,
            });
            if (data) {
              setTodoData({
                doneList: todoData?.doneList?.filter(item => item.id !== id),
              });
              Toast.show("删除成功");
            }
          },
        });
    }
  };
  const togglePopVisible = () => {
    setPopVisible(!popVisible);
  };
  const onChangeStatus = async (current: any) => {
    await apiBlog.updateTaskTodo({
      id: current.id,
      status: current.status ? 0 : 1,
    });
    if (current.status === 0) {
      setTodoData({
        undoneList: todoData?.undoneList?.filter(
          item => item.id !== current.id
        ),
        doneList: todoData?.doneList?.concat([
          {
            ...current,
            status: 1,
          },
        ]),
      });
    } else {
      setTodoData({
        undoneList: todoData?.undoneList?.concat([
          {
            ...current,
            status: 0,
          },
        ]),
        doneList: todoData?.doneList?.filter(item => item.id !== current.id),
      });
    }
  };

  return (
    <Page hideHeader bodyClassName={styles.todo_page}>
      <Collapse defaultActiveKey={["1"]}>
        <Collapse.Panel key="1" title="未完成">
          <List>
            {todoData?.undoneList?.map(item => (
              <List.Item>
                <TodoItem item={item} onChangeStatus={onChangeStatus} />
              </List.Item>
            ))}
            {todoData?.undoneList?.length === 0 && (
              <Empty title="暂无未完成待办，快去添加吧" />
            )}
          </List>
        </Collapse.Panel>
        <Collapse.Panel key="2" title="已完成">
          <List>
            {todoData?.doneList?.map(item => (
              <SwipeAction
                ref={ref}
                key={item.id}
                tabIndex={item.id}
                rightActions={rightActions}
                onAction={action => onAction(action, item.id)}
              >
                <List.Item>
                  <TodoItem item={item} onChangeStatus={onChangeStatus} />
                </List.Item>
              </SwipeAction>
            ))}
            {todoData?.doneList?.length === 0 && (
              <Empty title="暂无完成待办，快去完成吧" />
            )}
          </List>
        </Collapse.Panel>
      </Collapse>
      <div className={styles.add_todo} onClick={togglePopVisible}>
        <Iconfont type="icon-jiahao" size={28} color="#fff" />
      </div>
      <AddTodoPop popVisible={popVisible} onClose={togglePopVisible} />
    </Page>
  );
};

const TodoItem = ({ item, onChangeStatus }: any) => {
  const { id } = item;

  const onChangeTitle = async (value: string) => {
    await apiBlog.updateTaskTodo({
      id,
      title: value,
    });
  };

  return (
    <div className={styles.todo_item}>
      <Checkbox
        onChange={() => onChangeStatus(item)}
        defaultChecked={item.status}
      />
      <div className={styles.item_right}>
        <Input
          placeholder="请输入内容"
          defaultValue={item.title}
          className={styles.title}
          onChange={onChangeTitle}
        />
        <span>{item.description}</span>
        {item.notificationTime && (
          <div className={styles.notification}>
            截止时间：{dayjs(+item.notificationTime).format("YYYY-MM-DD HH:MM")}
          </div>
        )}
      </div>
    </div>
  );
};
export default Todo;
