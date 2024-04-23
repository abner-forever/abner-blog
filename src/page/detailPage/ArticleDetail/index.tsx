import React from "react";
import dayjs from "dayjs";
import MarkdownPreview from "@uiw/react-markdown-preview";
import Iconfont from "../../../components/Iconfont";
import { isMobile } from "@/utils/userAgent";
import "./styles.less";
import { EyeOutlined } from "@ant-design/icons";

//文章详情页
const ArticleDetail = ({ editArticle }: any) => {
  const {
    title,
    content: htmlContent,
    author = "佚名",
    updateTime,
    createTime,
    viewCount
  } = editArticle || {};
  const _createTime = dayjs(updateTime || createTime).format(
    "YYYY-MM-DD HH:MM"
  );
  return (
    <div className="detail-content">
      {!isMobile() && <p className="detail-title">{title}</p>}
      <div className="title-desc">
        <div className="author">
          <Iconfont type="icon-author" size={18} color="#333" />
          <span>{author}</span>
        </div>
        <div className="update-time">
          <Iconfont type="icon-clock" size={18} color="#333" />
          <span>{_createTime}</span>
        </div>
        <div>
          <EyeOutlined className="eye-icon" style={{ marginRight: 6 }} />
          <span>{viewCount}</span>
        </div>
      </div>
      <MarkdownPreview
        className="article-content"
        source={htmlContent}
        // rehypeRewrite={(node, index, parent) => {
        //   if (
        //     // @ts-ignore
        //     node.tagName === "a" &&
        //     parent &&
        //     // @ts-ignore
        //     /^h(1|2|3|4|5|6)/.test(parent.tagName)
        //   ) {
        //     parent.children = parent.children.slice(1);
        //   }
        // }}
      />
    </div>
  );
};
export default ArticleDetail;
