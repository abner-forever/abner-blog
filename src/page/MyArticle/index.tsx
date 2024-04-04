import React, { useEffect, useState } from "react";
import { Empty, ArticleCard } from "@/components";
import ApiBlog from "@/services/apiBlog";
import "./styles.less";

const MyArticle = (props: any) => {
  const [articleList, setArticleList] = useState([]);
  useEffect(() => {
    init();
  }, []);
  const init = async () => {
    let res: any = await ApiBlog.getMyArticleList();
    setArticleList(res.list);
  };
  //删除某一条数据
  const deleteArticle = async (id: string) => {
    await ApiBlog.removeArticle({
      id,
    });
    let newlist: any = [];
    articleList.forEach((item: any) => {
      if (item.id !== id) {
        newlist.push(item);
      }
    });
    setArticleList(newlist);
  };
  return (
    <div className="content-item">
      {articleList.length > 0 &&
        articleList.map((item, index) => (
          <ArticleCard
            key={index}
            item={item}
            isEdit={true}
            deleteArticle={deleteArticle}
          />
        ))}
      {!articleList.length && <Empty title="暂无文章" />}
    </div>
  );
};
export default MyArticle;
