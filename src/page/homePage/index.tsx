import React, { Component } from 'react'
import { Empty, ItemCard } from '@/components'
import withRouter from '@/components/WithRouter'
import ApiBlog from '@/api/apiBlog'
interface P {
  storeArticle?: any;
  history?: any;
  router: any
}
interface S {
  articleList: any[]
}
class Home extends Component<P, S> {
  store: any
  constructor(props: any) {
    super(props)
    this.state = {
      articleList: []
    }
  }

  async componentDidMount() {
    let res: any = await ApiBlog.apiArticleList();
    this.setState({
      articleList: res.list
    })
  }

  render() {
    const { articleList = [] } = this.state;
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