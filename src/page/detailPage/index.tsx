import React, { useState, useEffect } from "react";
import ArticleDetail from "@/components/ArticleDetail";
import { Loading, Comments } from "@/components";
import ApiBlog from "@/api/apiBlog";
import Cookies from "js-cookie";
import { getEndofUrlPath } from "@/utils";

const DetailPage = (props: any) => {
  const id = getEndofUrlPath(props.history.location.pathname);
  const [articleDetail, setArticleDetail] = useState();
  useEffect(() => {
    getArticleDetail();
  }, []);
  let userId = Cookies.get("userId");
  const getArticleDetail = async () => {
    let res: any = await ApiBlog.getArticleDetail({ id });
    setArticleDetail(res);
  };
  return (
    <div>
      {articleDetail ? (
        <ArticleDetail editArticle={articleDetail} />
      ) : (
        <Loading />
      )}
      {!!userId && <Comments id={id} />}
    </div>
  );
};
export default DetailPage;
