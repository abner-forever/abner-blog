import React, { useEffect, useRef, useState } from "react";
import { Page } from "@/components";
import apiBlog from "@/services/apiBlog";
import { useMount } from "ahooks";
import {
  Calendar,
  CalendarRef,
  CalendarPickerViewRef,
  Checkbox,
} from "antd-mobile";
import styles from "./style.module.less";
import { useNavigate } from "@/hooks";
import Iconfont from "@/components/Iconfont";
import dayjs from "dayjs";
import classNames from "classnames";
import {
  CarryOutFilled,
  CarryOutOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const isSameday = (
  timeA: string | number | Date | dayjs.Dayjs | null | undefined,
  timeB: string | number | Date | dayjs.Dayjs | null | undefined
) => {
  return dayjs(timeA).isSame(timeB, "day");
};

/** 我的运动 */
const Exercise = () => {
  const [dateList, setdateList] = useState<any[]>([]);
  const [exerciseList, setExerciseList] = useState<any[]>([]);
  const [currentList, setCurrentList] = useState<any[]>();
  const [hasToday, setHasTody] = useState(false);
  const [isShowToday, setIshowToday] = useState(false);
  const [workdays, setWorkdays] = useState<any>({});
  const [holidays, setHolidays] = useState<any>({});
  const [date, setDate] = useState({
    year: dayjs().year(),
    month: dayjs().month() + 1,
  });

  const calendarRef = useRef<CalendarRef>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const data = await apiBlog.getTaskListByMonth(date);
      const _hasToday = data.find((item: any) => {
        return item.type==='exercise' && dayjs().isSame(item.createTime, "day");
      });
      if (!isShowToday) {
        setHasTody(!!_hasToday);
      }
      const newdate = data.map((item: any) => {
        if (item.type === "exercise") {
          return dayjs(item.createTime).format("YYYY-MM-DD");
        } else if (item.type === "todo") {
          return dayjs(item.notificationTime).format("YYYY-MM-DD");
        }
        return;
      });
      const _currentList = data.filter((item: any) => {
        if (item.type === "exercise") {
          return isSameday(item.createTime, new Date());
        } else if (item.type === "todo") {
          return isSameday(new Date(item.notificationTime), new Date());
        }
      });
      setCurrentList(_currentList);
      setdateList(newdate);
      setExerciseList(data);
    };
    init();
  }, [date]);

  useEffect(() => {
    const init = async () => {
      const _workdays = await apiBlog.getWorkdays(date);
      const _holidays = await apiBlog.getHolidays(date);
      setWorkdays(_workdays);
      setHolidays(_holidays);
    };
    init();
  }, [date.year]);

  const onClickExercise = () => {
    navigate("/user/exercise/checkIn");
  };
  const onDayChange = (val: any) => {
    const _currentList = exerciseList.filter(item => {
      if (item.type === "exercise") {
        return isSameday(item.createTime, val);
      } else if (item.type === "todo") {
        return isSameday(new Date(item.notificationTime), val);
      }
    });
    setIshowToday(!dayjs().isSame(val, "day"));
    setCurrentList(_currentList);
  };
  const onPageChange = (year: number, month: number) => {
    setIshowToday(
      dayjs(`${year}-${month}`).format("YYYY-MM") !== dayjs().format("YYYY-MM")
    );
    setDate({ year, month });
  };
  const backToday = () => {
    calendarRef.current?.jumpToToday();
  };
  console.log("dateList", dateList);

  return (
    <Page title="打卡九零" className={styles.exercise_page}>
      <div className={styles.exercise_header}>
        <div className={styles.tody_exercise}>
          {hasToday ? "今日已打卡" : "今日未打卡"}
        </div>
      </div>
      <Calendar
        ref={calendarRef}
        selectionMode="single"
        onChange={onDayChange}
        className={styles.calendar}
        onPageChange={onPageChange}
        renderDate={date => {
          return (
            <div
              className={classNames(styles.cell, {
                [styles.weekends]: [0, 6].includes(dayjs(date).day()),
              })}
            >
              {dayjs(date).date()}
              {Object.keys(holidays).includes(
                dayjs(date).format("YYYY-MM-DD")
              ) && (
                <>
                  <span className={styles.holidays}>
                    {holidays[dayjs(date).format("YYYY-MM-DD")].name}
                  </span>
                  {holidays[dayjs(date).format("YYYY-MM-DD")].isOffDay ? (
                    <span className={styles.offday}>休</span>
                  ) : (
                    <span className={classNames(styles.offday, styles.work)}>
                      班
                    </span>
                  )}
                </>
              )}
            </div>
          );
        }}
        renderLabel={date => {
          if (dateList.includes(dayjs(date).format("YYYY-MM-DD"))) {
            return <span className={styles.dot} />;
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
      </div>
      <div
        onClick={backToday}
        className={classNames(styles.today, {
          [styles.show]: isShowToday,
        })}
      >
        今
      </div>
      <div className={styles.go_exercise_btn} onClick={onClickExercise}>
        <Iconfont type="icon-jiahao" size={28} color="#fff" />
      </div>
    </Page>
  );
};

const ExerciseItem = ({ item }: any) => {
  return (
    <div className={styles.exercise_item}>
      <div className={styles.exercise_item_left}>
        <div className={styles.title}>{item.title}</div>
        <div className={styles.desc}>{item.description}</div>
        {item.type === "exercise" && (
          <div className={styles.time}>
            <span>
              <ClockCircleOutlined
                style={{ fontSize: 20 }}
                className={styles.time_icon}
              />
              {item.spendTime}分钟
            </span>
            <span>
              <CarryOutFilled
                className={styles.time_icon}
                style={{ fontSize: 20 }}
                color="#fff"
              />
              {dayjs(item.createTime).format("YYYY-MM-DD HH:mm")}
            </span>
          </div>
        )}
        {item.type === "todo" && (
          <div className={styles.time}>
            <span>截止时间</span>
            <span>
              <CarryOutFilled
                className={styles.time_icon}
                style={{ fontSize: 20 }}
                color="#fff"
              />
              {dayjs(item.notificationTime).format("YYYY-MM-DD HH:mm")}
            </span>
          </div>
        )}
      </div>
      {!!item.status && <Checkbox checked={true} />}
    </div>
  );
};

export default Exercise;
