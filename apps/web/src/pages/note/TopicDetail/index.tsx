import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Masonry } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery } from '@tanstack/react-query';
import CustomEmpty from '@/components/CustomEmpty';
import NoteCard from '@components/NoteCard';
import Loading from '@/components/Loading';
import { topicsControllerFindOne } from '@/services/generated/topics/topics';
import type { TopicDetailNoteDto } from '@/services/generated/model/topicDetailNoteDto';
import './index.less';

const PAGE_SIZE = 10;

const TopicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const topicId = id || '';

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['topicDetail', topicId],
    queryFn: async ({ pageParam }) => {
      const res = await topicsControllerFindOne(topicId, {
        page: pageParam,
        pageSize: PAGE_SIZE,
      });
      return res;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage.page ?? 1;
      const totalPages = lastPage.totalPages ?? 0;
      if (page < totalPages) {
        return page + 1;
      }
      return undefined;
    },
    enabled: !!topicId,
  });

  const topic = data?.pages[0]?.topic;

  const notes = useMemo(
    () => data?.pages.flatMap((p) => p.notes ?? []) ?? [],
    [data?.pages],
  );

  const masonryItems = useMemo(
    () => notes.map((note) => ({ key: note.id, data: note })),
    [notes],
  );

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading && !data) {
    return (
      <div className="topic-detail">
        <div className="topic-detail__loading">
          <Loading size="small" tip={t('note.loading')} />
        </div>
      </div>
    );
  }

  if (isError || !topic) {
    return (
      <div className="topic-detail">
        <div className="topic-detail__empty">
          <CustomEmpty tip={t('note.topicNotFound')} />
        </div>
      </div>
    );
  }

  return (
    <div className="topic-detail">
      <div className="topic-detail__header">
        <div className="topic-detail__back" onClick={handleBack}>
          <LeftOutlined />
        </div>
        <div className="topic-detail__info">
          <span
            className="topic-detail__icon"
            style={{ backgroundColor: topic.color || '' }}
          >
            {topic.icon}
          </span>
          <div className="topic-detail__meta">
            <h1 className="topic-detail__name">{topic.name}</h1>
            {topic.description && (
              <p className="topic-detail__desc">{topic.description}</p>
            )}
            <span className="topic-detail__count">
              {topic.noteCount} {t('note.notes')}
            </span>
          </div>
        </div>
      </div>

      <div className="topic-detail__notes">
        <h2 className="topic-detail__section-title">{t('note.topicNotes')}</h2>
        <div className="topic-detail__container">
          {notes.length === 0 ? (
            <CustomEmpty tip={t('note.noNotes')} />
          ) : (
            <Masonry<TopicDetailNoteDto>
              className="topic-detail__masonry"
              columns={{ xs: 2, md: 5 }}
              gutter={[12, 12]}
              items={masonryItems}
              fresh
              itemRender={({ data: note }) => (
                <NoteCard
                  id={note.id}
                  avatar={note.author?.avatar ?? undefined}
                  nickname={
                    note.author?.nickname || note.author?.username || ''
                  }
                  title={note.title ?? undefined}
                  cover={note.cover ?? undefined}
                  images={note.images || []}
                  content={note.content}
                  likes={note.likeCount}
                  comments={note.commentCount}
                  topics={note.topic ? [note.topic.name] : []}
                  topicId={note.topic?.id}
                  location={note.location ?? undefined}
                  time={new Date(note.createdAt).toLocaleDateString(
                    i18n.language,
                  )}
                />
              )}
            />
          )}
          {hasNextPage && notes.length > 0 && (
            <div className="topic-detail__load-more">
              <Button
                onClick={() => fetchNextPage()}
                loading={isFetchingNextPage}
              >
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
