import React from "react";
import dayjs from "dayjs";
import MarkdownPreview from "@uiw/react-markdown-preview";
import Iconfont from "../Iconfont";
import { Page } from "../Page";
import "./styles.less";

//文章详情页
const ArticleDetail = ({ editArticle }: any) => {
  const {
    title,
    content: htmlContent,
    author = "佚名",
    updateTime,
    createTime,
  } = editArticle || {};
  const _createTime = dayjs(updateTime || createTime).format(
    "YYYY-MM-DD HH:MM"
  );
  return (
    <Page loading={!editArticle} className="detail-content">
      <p className="detail-title">{title}</p>
      <div className="title-desc">
        <span className="author">
          <Iconfont type="icon-author" size={24} color="" />
          <span>{author}</span>
        </span>
        <span className="update-time">
          <Iconfont type="icon-clock" size={20} color="#b4b4b4" />
          <span>{_createTime}</span>
        </span>
      </div>
      <MarkdownPreview
        className="article-content"
        source={htmlContent}
        rehypeRewrite={(node, index, parent) => {
          if (
            // @ts-ignore
            node.tagName === "a" &&
            parent &&
            // @ts-ignore
            /^h(1|2|3|4|5|6)/.test(parent.tagName)
          ) {
            parent.children = parent.children.slice(1);
          }
        }}
      />
    </Page>
  );
};
export default ArticleDetail;
