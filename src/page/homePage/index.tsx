import React, { Component, Suspense } from 'react'
import { Empty, ItemCard, Page } from '@/components'
import withRouter from '@/components/WithRouter'
import ApiBlog from '@/services/apiBlog'
interface P {
  storeArticle?: any;
  history?: any;
  router: any
}
interface S {
  articleList: any[]
  loading: boolean
}
class Home extends Component<P, S> {
  store: any
  constructor(props: any) {
    super(props)
    this.state = {
      articleList: [],
      loading: true,
    }
  }

  componentDidMount() {
    this.init()
  }

  init = async () => {
    try {
      let res: any = await ApiBlog.apiArticleList();
      this.setState({
        articleList: res.list,
        loading: false
      })
    } catch (error: any) {
      console.error('get article list error', error.message)
      this.setState({
        loading: false
      })
      
    }
  }

  render() {
    const { articleList = [], loading } = this.state;
    return (
      <Page className='home-content' loading={loading}>
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
      </Page>
    );
  }
}

export default withRouter(Home)