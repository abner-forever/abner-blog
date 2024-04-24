import dayjs from "dayjs";
import React from "react";
import { useNavigate } from "@/hooks";
import "./styles.less";
import Iconfont from "../Iconfont";
import { EyeOutlined } from "@ant-design/icons";
interface IProps {
  item: IArticleItemtype;
  isEdit?: boolean;
  deleteArticle?: Function;
}
function ArticleCard({ item, isEdit, deleteArticle = () => {} }: IProps) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => {
        navigate(`/articleDetail/${item.id}`);
      }}
      className="article-card"
      key={item.id}
    >
      <div className="item-left">{item.cover && <img src={item.cover} />}</div>
      <div className="item-right">
        <div>
          <p className="title">{item.title}</p>
          <p className="desc">{item.description}</p>
        </div>
        <div className="meta">
          <div className="update-time">
            {!isEdit && <span className="author">{item.author}</span>}
            <span>
              <Iconfont style={{ marginRight: 6 }} type="icon-clock" size={16} color="#b4b4b4" />
              {dayjs(item.updateTime || item.createTime).format(
                "YYYY-MM-DD HH:MM"
              )}
            </span>
            <span>
              <EyeOutlined style={{ fontSize:16, marginRight: 6 }} />
              {item.viewCount}
            </span>
          </div>
          {isEdit && (
            <div className="edit-options">
              <Iconfont
                onClick={(event: any) => {
                  event.stopPropagation();
                  navigate(`/edit/${item.id}`);
                }}
                type="icon-edit"
                size={20}
                color="#222"
              />
              <Iconfont
                onClick={(event: any) => {
                  event.stopPropagation();
                  deleteArticle(item.id);
                }}
                type="icon-delete"
                size={20}
                color="#222"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ArticleCard;
