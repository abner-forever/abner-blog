import React, { useState, useEffect } from "react";
import ArticleDetail from "@/components/ArticleDetail";
import { Loading, Comments } from "@/components";
import ApiBlog from "@/api/apiBlog";
const DetailPage = (props: any) => {
  const id = props.history.location.pathname.split("/")[2] || "";
  const [articleDetail, setArticleDetail] = useState();
  useEffect(() => {
    getArticleDetail(); // eslint-disable-next-line
  }, []);
  const getArticleDetail = async () => {
    let res: any = await ApiBlog.apiArticleOne({ id });
    setArticleDetail(res);
  };
  return (
    <div>
      {articleDetail ? (
        <ArticleDetail editArticle={articleDetail} />
      ) : (
        <Loading />
      )}
      <Comments id={id} />
    </div>
  );
};
export default DetailPage;
// export default observer(DetailPage)
