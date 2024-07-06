import React, { Suspense, useEffect, useState } from "react";
import ApiBlog from "@/services/apiBlog";
import { useLocation, useParams } from "react-router-dom";
import { Loading } from "@/components";
import MarkdownEditer from "./components/MarkdownEditer";
import LexicalEditor from "./components/LexicalEditor";

interface ArticleType {
  title?: string;
  content?: string;
  createTime?: string;
  description?: string;
  id?: number;
  updateTime?: string;
}

const defaultData = {
  content: undefined,
  title: undefined,
};

const EditorPage = () => {
  const [isAdd, setIsAdd] = useState(false);
  const { pathname } = useLocation();
  const { id = "" } = useParams();
  const [editArticle, seteditArticle] = useState<ArticleType>(defaultData);
  useEffect(() => {
    if (pathname.indexOf("addArticle") === -1) {
      getArticleDetail();
    } else {
      setIsAdd(true);
    }
  }, []);
  const getArticleDetail = async () => {
    let { title, content }: any = await ApiBlog.getArticleDetail({ id });
    seteditArticle({
      title,
      content,
    });
  };

  return (
    <Suspense fallback={<Loading />}>
      {(editArticle.content !== undefined || isAdd) && (
        <MarkdownEditer
          title={editArticle.title}
          content={editArticle.content}
          id={~~id}
        />
      )}
       {/* {(editArticle.content !== undefined || isAdd) && (
        <LexicalEditor
          // title={editArticle.title}
          // content={editArticle.content}
          // id={~~id}
        />
      )} */}
    </Suspense>
  );
};
export default EditorPage;
