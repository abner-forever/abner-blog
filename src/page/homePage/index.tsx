import React, { Component } from 'react'
import { Empty, ItemCard } from '@/components'
import withRouter from '@/components/WithRouter'

interface P {
  storeArticle?: any;
  history?: any;
  router: any
}
interface S {
}
class Home extends Component<P, S> {
  store: any
  constructor(props: any) {
    super(props)
    this.store = this.props.storeArticle||{}
  }
  componentDidMount() {
    // this?.store?.onGetArticle() //初始化数据
  }
  render() {
    const { articleList = [] } = this.store;
    const { router } = this.props;
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

export default withRouter(Home)