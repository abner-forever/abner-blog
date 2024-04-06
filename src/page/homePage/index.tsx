import React, { Component } from "react";
import { Empty, ArticleCard, Page, Header } from "@/components";
import withRouter from "@/components/WithRouter";
import ApiBlog from "@/services/apiBlog";
import routerConfig from "@/routes/routers";
import "./style.less";

interface P {
  storeArticle?: any;
  history?: any;
  router: any;
}
interface S {
  articleList: any[];
  loading: boolean;
}
class Home extends Component<P, S> {
  store: any;
  constructor(props: any) {
    super(props);
    this.state = {
      articleList: [],
      loading: true,
    };
  }

  componentDidMount() {
    this.init();
  }

  init = async () => {
    try {
      let res: any = await ApiBlog.apiArticleList();
      this.setState({
        articleList: res.list,
        loading: false,
      });
    } catch (error: any) {
      console.error("get article list error", error.message);
      this.setState({
        loading: false,
      });
    }
  };

  render() {
    const { articleList = [] } = this.state;
    return (
      <div className="home-content">
        <Header routerConfig={routerConfig} />
        <div className="article-list">
          {articleList.map((item: IArticleItemtype, index: number) => (
            <ArticleCard key={index} item={item} />
          ))}
        </div>
        {articleList.length === 0 && <Empty title="暂无文章" />}
      </div>
    );
  }
}

export default withRouter(Home);
