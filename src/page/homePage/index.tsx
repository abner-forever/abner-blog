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
  onGetArticle = (articleId: string) => {
    this.store.onGetEditText(articleId).then(() => {
      this.props.history.push(`/articledetail/${articleId}`)
    })
  }
  editArticle = (articleId: any) => {
    this.store.onGetEditText(articleId).then((res: any) => {
      this.props.history.push(`/edit/${articleId}`)
    })
  }
  render() {
    const { articleList = [] } = this.store;
    return (
      <div className='home-content'>
        {
          articleList.map((item: any, index: number) => (
            <ItemCard
              key={index}
              item={item}
              onGetArticle={this.onGetArticle}
              editArticle={this.editArticle}
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