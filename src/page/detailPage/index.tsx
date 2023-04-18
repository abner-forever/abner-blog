import React, { useState, useEffect } from "react";
import ArticleDetail from "@/components/ArticleDetail";
import { Comments, Loading, Page } from "@/components";
import { useParams } from "react-router-dom";
import ApiBlog from "@/api/apiBlog";
import Cookies from "js-cookie";

const DetailPage = () => {
  const { id } = useParams();
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
    <Page>
      <React.Suspense fallback={<Loading />}>
        <ArticleDetail editArticle={articleDetail} />
        {!!userId && <Comments id={id} />}
      </React.Suspense>

    </Page>
  );
};
export default DetailPage;
