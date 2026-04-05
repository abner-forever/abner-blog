import React from 'react';
import { EyeOutlined } from '@ant-design/icons';
import './index.less';

interface Article {
  id: string;
  title: string;
  content: string;
  tags: string[];
  publishTime: string;
  views: number;
}

interface ArticleListProps {
  articles: Article[];
}

const ArticleList: React.FC<ArticleListProps> = ({ articles }) => {
  return (
    <div className="article-list">
      {articles.map((article) => (
        <div key={article.id} className="article-list-item">
          <h3 className="article-list-title">{article.title}</h3>
          <p className="article-list-content">{article.content}</p>
          <div className="article-list-meta">
            <div className="article-list-meta-left">
              {article.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="article-list-meta-right">
              <span className="time">{article.publishTime}</span>
              <span className="views">
                <EyeOutlined className="icon" />
                {article.views}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ArticleList;
