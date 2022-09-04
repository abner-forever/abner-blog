import dayjs from "dayjs";
import React from "react";
import { useNavigate } from "react-router-dom";
import "./style.scss";
interface IProps {
  item: IArticleItemtype,
  isEdit?: boolean;
  deleteArticle?: Function;
}
function ItemCard({
  item,
  isEdit,
  deleteArticle = () => { },
}: IProps) {
   const navigate = useNavigate();
  return (
    <div className="item-card" key={item.id}>
      <div onClick={() => {
       navigate(`/articleDetail/${item.id}`)
      }}>
        <p className="title">{item.title}</p>
        <p className="contents">{item.description}</p>
      </div>
      <div className="meta">
        <span>{item.author}</span>
        <span className="update-time">
          {dayjs(item.updateTime || item.createTime).format('YYYY-MM-DD hh:mm')}
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
  );
}
export default ItemCard;
