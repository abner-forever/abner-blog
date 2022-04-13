import React, { useEffect, useState } from "react";
import ApiBlog from "@/api/apiBlog";
import { Table, Tabs } from "antd";
const { TabPane } = Tabs;

const columns = [
  {
    dataIndex: 'time',
    title: '时间'
  },
  {
    dataIndex: 'content',
    title: '描述'
  }
]
const tabList = [
  {
    key: '0',
    name: '数据请求',
    value: 'request'
  },
  {
    key: '1',
    name: '请求日志',
    value: 'out'
  },
  {
    key: '2',
    name: '异常信息',
    value: 'error'
  }
]

/**
 * 关于我
 */
const About = () => {
  const [list, setList] = useState([]);
  const [currentTab, setCurretTab] = useState("0")
  // const [currentType, setCurretType] = useState("request")
  useEffect(() => {
    getLogList();
  }, [currentTab])
  const getLogList = async () => {
    const res: any = await ApiBlog.logList({
      type: tabList[Number(currentTab)].value
    });
    console.log('res', res);
    setList(res.list);
  }
  const onChangeTab = (val: string) => {
    console.log('val', val);
    setCurretTab(val)
  }
  return <div>
    {/* <p>日志报错列表</p> */}
    <Tabs defaultActiveKey={currentTab} onChange={onChangeTab}>
      {
        tabList.map((item) => (
          <TabPane tab={item.name} key={item.key}>
            <Table
              rowKey='id'
              columns={columns}
              dataSource={list}
            />
          </TabPane>
        ))
      }
    </Tabs>

  </div>
}
export default About;