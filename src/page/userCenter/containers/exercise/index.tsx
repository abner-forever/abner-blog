import React, { useEffect, useRef, useState } from "react";
import { Page } from "@/components";
import apiBlog from "@/services/apiBlog";
import { useMount } from "ahooks";
import { Calendar, CalendarRef, Checkbox } from "antd-mobile";
import styles from "./style.module.less";
import { useNavigate } from "@/hooks";
import Iconfont from "@/components/Iconfont";
import dayjs from "dayjs";
import classNames from "classnames";

/** 我的运动 */
const Exercise = () => {
  const [dateList, setdateList] = useState<any[]>([]);
  const [exerciseList, setExerciseList] = useState<any[]>([]);
  const [currentList, setCurrentList] = useState<any[]>();
  const [hasToday, setHasTody] = useState(false);
  const [isShowToday, setIshowToday] = useState(false);
  const [date, setDate] = useState({
    year: dayjs().year(),
    month: dayjs().month() + 1,
  });

  const calendarRef = useRef<CalendarRef>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const data = await apiBlog.getTodoListByMonth(date);
      const _hasToday = data.find((item: any) => {
        return dayjs().isSame(item.createTime, "day");
      });
      setHasTody(!!_hasToday);
      const newdate = data.map((item: any) => {
        return dayjs(item.createTime).format("YYYY-MM-DD");
      });
      const _currentList = data.filter((item: any) =>
        dayjs(item.createTime).isSame(new Date(), "day")
      );
      setCurrentList(_currentList);
      setdateList(newdate);
      setExerciseList(data);
    };
    init();
  }, [date]);

  const onClickExercise = () => {
    navigate("/user/exercise/checkIn");
  };
  const onDayChange = (val: any) => {
    const _currentList = exerciseList.filter(item =>
      dayjs(item.createTime).isSame(val, "day")
    );
    setIshowToday(!dayjs().isSame(val, "day"));
    setCurrentList(_currentList);
  };
  const onPageChange = (year: number, month: number) => {
    console.log(
      "dayjs().format('YYYY-MM')",
      dayjs(`${year}-${month}`).format("YYYY-MM")
    );

    setIshowToday(
      dayjs(`${year}-${month}`).format("YYYY-MM") !== dayjs().format("YYYY-MM")
    );
    setDate({ year, month });
  };
  const backToday = () => {
    calendarRef.current?.jumpToToday();
  };
  return (
    <Page title="我的运动记录" className={styles.exercise_page}>
      {hasToday && (
        <div className={styles.exercise_header}>
          <div className={styles.tody_exercise}>今日已打卡</div>
        </div>
      )}
      <Calendar
        ref={calendarRef}
        selectionMode="single"
        onChange={onDayChange}
        className={styles.calendar}
        renderDate={date => {
          return (
            <div
              className={classNames(styles.cell, {
                [styles.cell_active]: dateList.includes(
                  dayjs(date).format("YYYY-MM-DD")
                ),
              })}
            >
              {dayjs(date).date()}
            </div>
          );
        }}
        onPageChange={onPageChange}
        renderLabel={date => {
          if (dateList.includes(dayjs(date).format("YYYY-MM-DD"))) {
            return <span>已打卡</span>;
          }
        }}
      />
      <div
        className={classNames(styles.exercise_list, {
          [styles.no_data]: currentList?.length === 0,
        })}
      >
        {currentList?.map(item => (
          <ExerciseItem key={item.id} item={item} />
        ))}
        {currentList?.length === 0 && (
          <div className={styles.no_task}>未打卡</div>
        )}
      </div>
      {isShowToday && (
        <div onClick={backToday} className={styles.today}>
          今
        </div>
      )}
      <div className={styles.go_exercise_btn} onClick={onClickExercise}>
        <Iconfont type="icon-jiahao" size={28} color="#fff" />
      </div>
    </Page>
  );
};

const ExerciseItem = ({ item }: any) => {
  return (
    <div className={styles.exercise_item}>
      <Checkbox checked={!!item.status} />
      <div className={styles.exercise_item_right}>
        <div className={styles.title}>{item.title}</div>
        <div className={styles.desc}>{item.description}</div>
        <div className={styles.time}>
          打卡时间：{dayjs(item.createTime).format("YYYY-MM-DD HH:mm:ss")}
        </div>
      </div>
    </div>
  );
};

export default Exercise;
