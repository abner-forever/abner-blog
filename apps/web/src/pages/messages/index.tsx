import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { FC } from 'react';
import {
  Layout,
  Input,
  Button,
  Avatar,
  Badge,
  Spin,
  Empty,
  Popconfirm,
  message as antdMessage,
} from 'antd';
import { UserOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getConversations,
  getConversationMessages,
  openConversation,
  sendDirectMessage,
  deleteConversation,
  type ConversationListItem,
  type DirectMessageItem,
} from '@services/social';
import { useDmThreadReadReceipt } from '@/hooks/useDmThreadReadReceipt';
import './index.less';

const { Sider, Content } = Layout;

function clipOneLine(s: string, max: number): string {
  const one = s.replace(/\s+/g, ' ').trim();
  return one.length > max ? `${one.slice(0, max)}…` : one;
}

/** localStorage / 接口可能把 id 序列化为 string，与消息 senderId(number) 严格相等会失败 */
function isSameUserId(
  a: number | string | undefined | null,
  b: number,
): boolean {
  if (a === undefined || a === null) return false;
  return Number(a) === Number(b);
}

const MessagesPage: FC = () => {
  const { t } = useTranslation();
  const myId = useSelector((s: RootState) => s.auth.user?.id);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const peerFromUrl = searchParams.get('peer');

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const threadScrollRef = useRef<HTMLDivElement>(null);

  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversations', 1],
    queryFn: async () => {
      const r = await getConversations(1, 50);
      void queryClient.invalidateQueries({ queryKey: ['social', 'dm-unread'] });
      return r;
    },
  });

  const {
    data: msgData,
    isLoading: msgLoading,
    dataUpdatedAt: dmMessagesQueryUpdatedAt = 0,
  } = useQuery({
    queryKey: ['direct-messages', selectedId, 1],
    queryFn: async () => {
      if (!selectedId) return null;
      return getConversationMessages(selectedId, 1, 100);
    },
    enabled: !!selectedId,
  });

  useEffect(() => {
    if (!peerFromUrl) return;
    const pid = Number(peerFromUrl);
    if (!Number.isFinite(pid) || pid < 1) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await openConversation(pid);
        if (cancelled) return;
        setSelectedId(data.id);
        void queryClient.invalidateQueries({ queryKey: ['conversations'] });
        setSearchParams({}, { replace: true });
      } catch (e) {
        if (!cancelled) {
          antdMessage.error(
            e instanceof Error ? e.message : t('social.openConversationFail'),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [peerFromUrl, queryClient, setSearchParams, t]);

  const sendMut = useMutation({
    mutationFn: () => {
      if (!selectedId) throw new Error('no conversation');
      return sendDirectMessage(selectedId, { content: draft });
    },
    onSuccess: () => {
      setDraft('');
      void queryClient.invalidateQueries({
        queryKey: ['direct-messages', selectedId],
      });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['social', 'dm-unread'] });
    },
    onError: (err: Error) => {
      antdMessage.error(err.message || t('social.sendFail'));
    },
  });

  const deleteConvMut = useMutation({
    mutationFn: (id: number) => deleteConversation(id),
    onSuccess: (_, deletedId) => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['social', 'dm-unread'] });
      if (selectedId === deletedId) {
        setSelectedId(null);
      }
    },
    onError: (err: Error) => {
      antdMessage.error(err.message || t('social.deleteConversationFail'));
    },
  });

  const conversations = useMemo(() => convData?.list ?? [], [convData?.list]);
  const messages = useMemo(() => {
    const list = msgData?.list ?? [];
    return [...list].reverse();
  }, [msgData?.list]);

  /** 仅随消息 id 集合变化，避免列表 refetch 引用抖动拆掉已读订阅 */
  const dmMessageIdsKey = useMemo(
    () => messages.map((m) => m.id).join(','),
    [messages],
  );

  /** 时间轴上最后一条（列表已按时间正序展示），用于滚到底时的已读兜底 */
  const dmThreadTail = useMemo(() => {
    if (!messages.length) return null;
    const m = messages[messages.length - 1];
    const createdMs = new Date(m.createdAt).getTime();
    if (!Number.isFinite(createdMs)) return null;
    return { id: m.id, createdMs };
  }, [messages]);

  const onReadReceiptAck = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    void queryClient.invalidateQueries({ queryKey: ['social', 'dm-unread'] });
  }, [queryClient]);

  useDmThreadReadReceipt(
    threadScrollRef,
    selectedId,
    dmMessageIdsKey,
    msgLoading,
    selectedId ? dmMessagesQueryUpdatedAt : 0,
    dmThreadTail,
    onReadReceiptAck,
  );

  /**
   * 用 layout 阶段滚到底，保证随后 useEffect 里已读几何扫描落在正确视口上
   *（若用 useEffect，会先扫到未滚动前的可视区，未读游标可能停在旧消息上）。
   */
  useLayoutEffect(() => {
    if (!selectedId || msgLoading) return;
    const el = threadScrollRef.current;
    if (!el) return;
    const run = () => {
      el.scrollTop = el.scrollHeight;
    };
    run();
    requestAnimationFrame(run);
    const t = window.setTimeout(run, 50);
    return () => window.clearTimeout(t);
  }, [selectedId, msgLoading, dmMessageIdsKey]);

  const selectedConv = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const handleSelect = useCallback((c: ConversationListItem) => {
    setSelectedId(c.id);
  }, []);

  const peerName = (p: ConversationListItem['peer']) =>
    p.nickname || p.username;

  const formatConvPreview = (item: ConversationListItem): string => {
    if (!item.lastMessage) {
      return t('social.dmNoMessagePreview');
    }
    const body = clipOneLine(item.lastMessage.content, 48);
    const fromMe = isSameUserId(myId, item.lastMessage.senderId);
    const prefix = fromMe
      ? t('social.dmLastFromMe')
      : t('social.dmLastFromPeer', { name: peerName(item.peer) });
    return `${prefix}${body}`;
  };

  return (
    <div className="messages-page">
      <Layout className="messages-page__layout">
        <Sider width={280} className="messages-page__sider" theme="light">
          <div className="messages-page__sider-title">
            {t('social.privateMessages')}
          </div>
          {convLoading ? (
            <div className="messages-page__sider-body messages-page__center">
              <Spin />
            </div>
          ) : conversations.length === 0 ? (
            <div className="messages-page__sider-body messages-page__center">
              <Empty description={t('social.noConversations')} />
            </div>
          ) : (
            <div className="messages-page__sider-body">
              <div
                className="messages-page__conv-list"
                role="list"
                aria-label={t('social.privateMessages')}
              >
                {conversations.map((item) => {
                  const unread = item.unreadCount ?? 0;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="listitem"
                      className={
                        item.id === selectedId
                          ? 'messages-page__conv-item messages-page__conv-item--active'
                          : 'messages-page__conv-item'
                      }
                      onClick={() => handleSelect(item)}
                    >
                      <div className="messages-page__conv-row">
                        <Badge
                          count={unread}
                          size="small"
                          overflowCount={99}
                          offset={[-4, 4]}
                          className="messages-page__conv-avatar-badge"
                        >
                          <Avatar
                            src={item.peer.avatar}
                            icon={<UserOutlined />}
                            className="messages-page__conv-avatar"
                          />
                        </Badge>
                        <div className="messages-page__conv-text">
                          <div className="messages-page__conv-title-row">
                            <span className="messages-page__conv-peer-name">
                              {peerName(item.peer)}
                            </span>
                          </div>
                          <div
                            className="messages-page__conv-preview"
                            title={formatConvPreview(item)}
                          >
                            {formatConvPreview(item)}
                          </div>
                        </div>
                        <Popconfirm
                          title={t('social.confirmDeleteConversation')}
                          onConfirm={() => deleteConvMut.mutate(item.id)}
                          onCancel={(e) => e?.stopPropagation()}
                        >
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => e.stopPropagation()}
                            className="messages-page__conv-delete"
                          />
                        </Popconfirm>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Sider>
        <Content className="messages-page__main">
          {!selectedId ? (
            <div className="messages-page__placeholder">
              <Empty description={t('social.selectConversation')} />
            </div>
          ) : (
            <>
              <div className="messages-page__header">
                <Avatar
                  src={selectedConv?.peer.avatar}
                  icon={<UserOutlined />}
                />
                <span className="messages-page__header-name">
                  {selectedConv ? peerName(selectedConv.peer) : ''}
                </span>
              </div>
              <div
                className="messages-page__thread"
                ref={threadScrollRef}
              >
                {msgLoading ? (
                  <div className="messages-page__center messages-page__center--in-thread">
                    <Spin />
                  </div>
                ) : (
                  <div className="messages-page__messages">
                    {messages.map((m: DirectMessageItem) => (
                      <div
                        key={m.id}
                        data-dm-anchor="1"
                        data-message-id={m.id}
                        data-message-created-ms={new Date(m.createdAt).getTime()}
                        className={`messages-page__bubble-wrap messages-page__bubble-wrap--${
                          isSameUserId(myId, m.senderId) ? 'me' : 'peer'
                        }`}
                      >
                        <div className="messages-page__bubble">{m.content}</div>
                        <div className="messages-page__time">
                          {new Date(m.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="messages-page__composer">
                <Input.TextArea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('social.messagePlaceholder')}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      if (draft.trim()) sendMut.mutate();
                    }
                  }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={sendMut.isPending}
                  disabled={!draft.trim()}
                  onClick={() => sendMut.mutate()}
                >
                  {t('social.send')}
                </Button>
              </div>
            </>
          )}
        </Content>
      </Layout>
    </div>
  );
};

export default MessagesPage;
