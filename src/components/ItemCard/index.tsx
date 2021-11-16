import React from "react";
import "./style.scss";
function ItemCard({
  item,
  isEdit,
  onGetArticle = () => {},
  editArticle,
  deleteArticle,
}: any) {
  return (
    <div className="item-card" key={item.id}>
      <div onClick={() => onGetArticle(item.id)}>
        <p className="title">{item.title}</p>
        <p className="contents">{item.description}</p>
      </div>
      <div className="meta">
        <span>{item.userName}</span>
        <span className="update-time">
          {item.updateTime || item.createTime}
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
