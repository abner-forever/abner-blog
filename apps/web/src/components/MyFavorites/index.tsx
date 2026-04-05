import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { BlogDto } from '@services/generated/model';

const MyFavorites: React.FC = () => {
  const [favorites, setFavorites] = useState<BlogDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await axios.get('/api/favorites/my', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setFavorites(res.data);
      } catch (error) {
        console.error('获取我的收藏失败', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  if (loading) return <div>加载中...</div>;
  if (!favorites.length) return <div>暂无收藏</div>;

  return (
    <div>
      <h3>我的收藏</h3>
      <ul>
        {favorites.map((blog) => (
          <li key={blog.id}>
            <h4>{blog.title}</h4>
            <p>{blog.content.substring(0, 100)}...</p>
            <span style={{ color: '#888', fontSize: 12 }}>
              作者: {blog.author?.nickname || blog.author?.username || '匿名'} |
              发布时间: {new Date(blog.createdAt).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyFavorites;
