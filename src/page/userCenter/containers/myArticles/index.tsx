import React, { useEffect, useState } from "react";
import { Empty, ArticleCard, Page } from "@/components";
import ApiBlog from "@/services/apiBlog";
import styles from "./style.module.less";
import { useNavigate } from "@/hooks";

/**
 * 我的笔记
 */
const MyArticle = () => {
  const [articleList, setArticleList] = useState([]);
  const navigate = useNavigate();

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
  const onClickNewArticle = () => {
    navigate("/addArticle");
  };
  return (
    <Page title="我的笔记" className="content-item">
      <p onClick={onClickNewArticle} className={styles.add_new_article}>
        新增笔记
      </p>
      {articleList.length > 0 &&
        articleList.map((item, index) => (
          <ArticleCard
            key={index}
            item={item}
            isEdit={true}
            deleteArticle={deleteArticle}
          />
        ))}
      {!articleList.length && <Empty title="暂无笔记" />}
    </Page>
  );
};
export default MyArticle;
