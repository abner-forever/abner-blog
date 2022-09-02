import dayjs from "dayjs";
import React from "react";
import "./style.scss";
interface IProps {
  item: IArticleItemtype,
  isEdit?: boolean;
  onGetArticle: Function;
  editArticle: Function;
  deleteArticle?: Function;
}
function ItemCard({
  item,
  isEdit,
  onGetArticle,
  editArticle,
  deleteArticle = () => { },
}: IProps) {
  return (
    <div className="item-card" key={item.id}>
      <div onClick={() => onGetArticle(item.id)}>
        <p className="title">{item.title}</p>
        <p className="contents">{item.description}</p>
      </div>
      <div className="meta">
        <span>{item.author}</span>
        <span className="update-time">
          {dayjs(item.updateTime || item.createTime).format('YYYY-MM-DD hh:mm')}
        </span>
        {isEdit && (
          <div onClick={() => editArticle(item.id)} className="edit-icon">
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
