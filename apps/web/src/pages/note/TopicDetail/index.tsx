import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import CustomEmpty from '@/components/CustomEmpty';
import NoteCard from '@components/NoteCard';
import Loading from '@/components/Loading';
import { topicsControllerFindOne } from '@/services/generated/topics/topics';
import './index.less';


const TopicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const topicId = id || '';

  const { data: topicData, isLoading } = useQuery({
    queryKey: ['topicDetail', topicId, currentPage],
    queryFn: async () =>{
      const data = await topicsControllerFindOne(topicId, { page: currentPage, pageSize: 10 })
      return data || {};
    },
    enabled: !!topicId,
  });

  const notes = useMemo(() => {
    return (topicData?.notes || []) as unknown as Array<{
      id: number;
      title?: string;
      content: string;
      images: string[];
      cover?: string;
      location?: string;
      viewCount: number;
      likeCount: number;
      commentCount: number;
      favoriteCount: number;
      isLiked: boolean;
      isFavorited: boolean;
      createdAt: string;
      author: {
        id: number;
        nickname: string;
        username: string;
        avatar: string;
      };
      topic?: {
        id: number;
        name: string;
      };
    }>;
  }, [topicData?.notes]);

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="topicDetail">
        <div className="loadingContainer">
          <Loading size="small" tip={t('note.loading')} />
        </div>
      </div>
    );
  }

  if (!topicData?.topic) {
    return (
      <div className="topicDetail">
        <div className="emptyContainer">
          <CustomEmpty tip="话题不存在" />
        </div>
      </div>
    );
  }

  const { topic } = topicData;

  return (
    <div className="topicDetail">
      <div className="topicHeader">
        <div className="backBtn" onClick={handleBack}>
          <LeftOutlined />
        </div>
        <div className="topicInfo">
          <span
            className="topicIcon"
            style={{ backgroundColor: topic.color || '' }}
          >
            {topic.icon}
          </span>
          <div className="topicMeta">
            <h1 className="topicName">{topic.name}</h1>
            {topic.description && (
              <p className="topicDesc">{topic.description}</p>
            )}
            <span className="topicCount">
              {topic.noteCount} {t('note.notes')}
            </span>
          </div>
        </div>
      </div>

      <div className="notesSection">
        <h2 className="sectionTitle">{t('note.topicNotes')}</h2>
        <div className="container">
          {notes.length === 0 ? (
            <CustomEmpty tip={t('note.noNotes')} />
          ) : (
            <div className="waterfall">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  id={note.id}
                  avatar={note.author?.avatar}
                  nickname={note.author?.nickname || note.author?.username || ''}
                  title={note.title}
                  cover={note.cover}
                  images={note.images || []}
                  content={note.content}
                  likes={note.likeCount}
                  comments={note.commentCount}
                  topics={note.topic ? [note.topic.name] : []}
                  location={note.location}
                  time={new Date(note.createdAt).toLocaleDateString()}
                />
              ))}
            </div>
          )}
          {topicData &&
            notes.length < topicData.total &&
            notes.length > 0 && (
              <div className="loadMore">
                <Button onClick={() => setCurrentPage((p) => p + 1)}>
                  {t('note.loadMore')}
                </Button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TopicDetail;
