import React, { Component } from 'react'
import { observer, inject } from 'mobx-react'
import './style.scss'
import { Empty, ItemCard } from '@/components'

interface P {
  storeArticle: any;
  history: any;
}
interface S {
}

@inject('storeArticle')
@observer
class Home extends Component<P, S> {
  store: any
  constructor(props: any) {
    super(props)
    this.store = this.props.storeArticle
  }
  componentDidMount() {
    this.store.onGetArticle() //初始化数据
  }
  render() {
    const { articleList = [] } = this.store;
    return (
      <div className='home-content'>
        {
          articleList.map((item: IArticleItemtype, index: number) => (
            <ItemCard
              key={index}
              item={item}
            />
          ))
        }
        {
          articleList.length === 0 && <Empty title='暂无文章' />
        }
      </div>
    );
  }
}

export default Home