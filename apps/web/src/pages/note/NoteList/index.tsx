import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Masonry } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useInfiniteNotes, type NoteDetail } from '@/hooks/useNotes';
import CustomEmpty from '@/components/CustomEmpty';
import NoteCard from '@/components/NoteCard';
import Loading from '@/components/Loading';
import './index.less';

const NoteList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchKeyword, setSearchKeyword] = useState('');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const params = useMemo(
    () => ({
      pageSize: 10,
      sortBy: 'time' as const,
      ...(searchKeyword && { search: searchKeyword }),
    }),
    [searchKeyword],
  );

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteNotes(params);

  const notes = useMemo(
    (): NoteDetail[] => data?.pages.flatMap((page) => page.list) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total || 0;
  const masonryItems = useMemo(
    () => notes.map((note) => ({ key: note.id, data: note })),
    [notes],
  );

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleSearchChange = (value: string) => {
    setSearchKeyword(value);
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCreateNote = () => {
    navigate('/notes/create');
  };

  return (
    <div className="note-list">
      <div className="note-list__header">
        <h1 className="note-list__title">{t('note.title')}</h1>
        <div className="note-list__header-search">
          <Input
            prefix={<SearchOutlined />}
            placeholder={t('note.listSearchPlaceholder')}
            className="note-list__search-input"
            value={searchKeyword}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
          />
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateNote}
          className="note-list__create-btn"
        >
          {t('note.createNote')}
        </Button>
      </div>
      <div className="note-list__container">
        {notes.length === 0 && !isLoading ? (
          <CustomEmpty tip={t('note.noNotes')} />
        ) : (
          <Masonry<NoteDetail>
            className="note-list__waterfall"
            columns={{ xs: 2, md: 5 }}
            gutter={[12, 12]}
            items={masonryItems}
            fresh
            itemRender={({ data: note }) => (
              <NoteCard
                id={note.id}
                avatar={note.author.avatar}
                nickname={note.author.nickname}
                title={note.title}
                images={note.images || []}
                cover={note.cover}
                content={note.content}
                likes={note.likeCount}
                comments={note.commentCount}
                topics={note.topic ? [note.topic.name] : []}
                topicId={note.topic?.id}
                location={note.location}
                time={new Date(note.createdAt).toLocaleDateString()}
              />
            )}
          />
        )}
        {isLoading && (
          <div className="note-list__loading">
            <Loading size="small" tip={t('note.loading')} />
          </div>
        )}
        {!isLoading && notes.length >= total && notes.length > 0 && (
          <div className="note-list__no-more">{t('note.noMore')}</div>
        )}
        <div ref={loadMoreRef} className="note-list__load-trigger" />
        {isFetchingNextPage && (
          <div className="note-list__loading">
            <Loading size="small" tip={t('note.loading')} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteList;
