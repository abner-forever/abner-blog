import React, { memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Result, Button, Avatar, message } from 'antd';
import { UserOutlined, RobotOutlined, CopyOutlined } from '@ant-design/icons';
import { useChatShareControllerFindOne } from '@services/generated/chat-share/chat-share';

interface ShareMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const ChatSharePage: React.FC = memo(function ChatSharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useChatShareControllerFindOne(shareId || '', {
    query: {
      enabled: !!shareId,
    },
  });

  const [, setCopiedIdx] = React.useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="chat-share-page">
        <div className="share-container">
          <Spin size="large" tip="正在加载分享内容..." />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="chat-share-page">
        <div className="share-container">
          <Result
            status="error"
            title="加载失败"
            subTitle="该分享链接可能已失效或不存在"
            extra={[
              <Button type="primary" key="chat" onClick={() => navigate('/chat')}>
                开始新对话
              </Button>,
              <Button key="home" onClick={() => navigate('/')}>
                返回首页
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

  // Parse messages - the API returns messages as string[] (JSON stringified) or ShareMessage[]
  let messages: ShareMessage[] = [];
  if (data.messages && Array.isArray(data.messages)) {
    if (typeof data.messages[0] === 'string') {
      // Messages are JSON stringified
      try {
        messages = (data.messages as unknown as string[]).map((m, idx) => {
          const parsed = typeof m === 'string' ? JSON.parse(m) : m;
          return { id: `msg-${idx}`, ...parsed };
        });
      } catch {
        messages = [];
      }
    } else {
      // Messages are already objects
      messages = (data.messages as unknown as ShareMessage[]).map((m, idx) => ({
        id: m.id || `msg-${idx}`,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));
    }
  }

  const handleCopyToChat = () => {
    try {
      const sharedData = {
        id: `shared-${Date.now()}`,
        title: data.title || '分享的对话',
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          images: [],
          displayContent: m.content,
          timestamp: m.timestamp,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isShared: true,
      };

      const existingSessions = JSON.parse(localStorage.getItem('chat-sessions') || '[]');
      const newSessions = [sharedData, ...existingSessions];
      localStorage.setItem('chat-sessions', JSON.stringify(newSessions));
      localStorage.setItem('chat-shared-session', JSON.stringify(sharedData));

      message.success('已复制到对话，可开始新对话');
      navigate('/chat');
    } catch {
      message.error('复制失败');
    }
  };

  const handleCopyContent = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    message.success('已复制内容');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="chat-share-page">
      <div className="share-header">
        <h1 className="share-title">{data.title || '分享的对话'}</h1>
        <div className="share-actions">
          <Button type="primary" icon={<CopyOutlined />} onClick={handleCopyToChat}>
            复制到我的对话
          </Button>
        </div>
      </div>

      <div className="share-container">
        <div className="share-messages">
          {messages.map((msg, idx) => (
            <div key={msg.id || idx} className={`message-item message-${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? (
                  <Avatar icon={<UserOutlined />} className="user-avatar" />
                ) : (
                  <Avatar icon={<RobotOutlined />} className="ai-avatar" />
                )}
              </div>
              <div className="message-content-wrapper">
                <div className="message-bubble">
                  <div className="message-content">{msg.content}</div>
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  className="copy-btn"
                  onClick={() => handleCopyContent(msg.content, idx)}
                />
              </div>
            </div>
          ))}
        </div>

        {messages.length === 0 && (
          <Result status="info" title="空对话" subTitle="该分享内容为空" />
        )}
      </div>

      <style>{`
        .chat-share-page {
          min-height: 100vh;
          background: var(--bg-color, #f5f5f5);
          padding: 20px;
        }

        .share-header {
          max-width: 800px;
          margin: 0 auto 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .share-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-color, #333);
        }

        .share-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          padding: 24px;
          min-height: 400px;
        }

        .share-messages {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .message-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
        }

        .message-item:hover {
          background: var(--hover-bg, #fafafa);
        }

        .message-user {
          flex-direction: row;
        }

        .message-assistant {
          flex-direction: row;
          background: var(--ai-message-bg, #f0f7ff);
        }

        .message-avatar {
          flex-shrink: 0;
        }

        .user-avatar {
          background: var(--user-avatar-bg, #1890ff);
        }

        .ai-avatar {
          background: var(--ai-avatar-bg, #722ed1);
        }

        .message-content-wrapper {
          flex: 1;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          position: relative;
        }

        .message-bubble {
          flex: 1;
          padding: 12px 16px;
          border-radius: 12px;
          background: var(--message-bubble-bg, #f5f5f5);
          position: relative;
        }

        .message-user .message-bubble {
          background: var(--user-bubble-bg, #e6f7ff);
        }

        .message-assistant .message-bubble {
          background: var(--ai-bubble-bg, #f0f7ff);
        }

        .message-content {
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.6;
          color: var(--text-color, #333);
        }

        .copy-btn {
          opacity: 0;
          transition: opacity 0.2s;
        }

        .message-item:hover .copy-btn {
          opacity: 1;
        }
      `}</style>
    </div>
  );
});

export default ChatSharePage;