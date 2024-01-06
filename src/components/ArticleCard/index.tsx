import dayjs from "dayjs";
import React from "react";
import { useNavigate } from "react-router-dom";
import "./styles.less";
import Iconfont from "../Iconfont";
interface IProps {
  item: IArticleItemtype,
  isEdit?: boolean;
  deleteArticle?: Function;
}
function ArticleCard({
  item,
  isEdit,
  deleteArticle = () => { },
}: IProps) {
  const navigate = useNavigate();
  return (
    <div onClick={() => {
      navigate(`/articleDetail/${item.id}`)
    }} className="item-card" key={item.id}>
      <div className="item-left">
        <img src={item.cover} />
      </div>
      <div className="item-right">
        <div>
          <p className="title">{item.title}</p>
          <p className="desc">{item.description}</p>
        </div>
        <div className="meta">
          <span>{item.author}</span>
          <span className="update-time">
            <Iconfont type="icon-clock" size={20} color="#b4b4b4" />
            <span>{dayjs(item.updateTime || item.createTime).format('YYYY-MM-DD HH:MM')}</span>
          </span>
          {isEdit && (
            <div onClick={() => {
              navigate(`/edit/${item.id}`)
            }} className="edit-icon">
              编辑
            </div>
          )}
          {isEdit && (
            <div onClick={() => deleteArticle(item.id)} className="edit-icon">
              删除
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ArticleCard;
