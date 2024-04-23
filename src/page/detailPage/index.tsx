import React, { useState, useEffect } from "react";
import ArticleDetail from "@/page/detailPage/ArticleDetail";
import { Comments, Page } from "@/components";
import { useParams } from "react-router-dom";
import ApiBlog from "@/services/apiBlog";

const DetailPage = () => {
  const { id } = useParams();
  const [articleDetail, setArticleDetail] = useState<any>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const init = async () => {
      let res: any = await ApiBlog.getArticleDetail({ id });
      setArticleDetail(res);
      setLoading(false);
    };
    init();
  }, []);

  return (
    <Page title={articleDetail?.title} loading={loading}>
      <ArticleDetail editArticle={articleDetail} />
      {/* <Comments id={id} /> */}
    </Page>
  );
};
export default DetailPage;
