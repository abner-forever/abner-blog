import React from 'react';
import { Tag, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import Loading from '../Loading';
import { httpMutator } from '../../services/http';
import './index.less';

interface TopicSelectorProps {
  value?: number;
  onChange?: (topicId: number | undefined) => void;
}

interface TopicItem {
  id: number;
  name: string;
  icon?: string | null;
  color?: string | null;
  momentCount: number;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ value, onChange }) => {
  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      // 直接调用 API 获取数据
      const response = await httpMutator<TopicItem[]>({
        url: '/api/topics/hot',
        method: 'GET',
      });
      return response || [];
    },
  });

  const handleSelect = (topicId: number) => {
    if (value === topicId) {
      onChange?.(undefined);
    } else {
      onChange?.(topicId);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="topic-selector">
      <Space size={[8, 8]} wrap>
        <Tag
          className={`topic-tag ${!value ? 'active' : ''}`}
          onClick={() => onChange?.(undefined)}
        >
          全部
        </Tag>
        {topics.map((topic) => (
          <Tag
            key={topic.id}
            className={`topic-tag ${value === topic.id ? 'active' : ''}`}
            onClick={() => handleSelect(topic.id)}
          >
            {topic.name}
          </Tag>
        ))}
      </Space>
    </div>
  );
};

export default TopicSelector;
