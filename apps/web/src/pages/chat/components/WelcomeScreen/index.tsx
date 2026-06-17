import React, { memo } from 'react';
import './WelcomeScreen.less';

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const SUGGESTIONS = [
  { icon: '✨', text: '写一篇关于 React 性能优化的博客文章' },
  { icon: '🧠', text: '解释一下微服务架构的优缺点' },
  { icon: '💡', text: '给我一些 TypeScript 高级类型技巧' },
  { icon: '🚀', text: '如何设计一个高可用的后端系统？' },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = memo(function WelcomeScreen({
  onSuggestionClick,
}) {
  return (
    <div className="welcome-screen">
      <div className="welcome-screen__content">
        <div className="welcome-screen__logo">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
            <rect width="48" height="48" rx="12" fill="#4D6BFE" />
            <path
              d="M14 24C14 18.477 18.477 14 24 14V14C29.523 14 34 18.477 34 24V24C34 29.523 29.523 34 24 34V34C18.477 34 14 29.523 14 24V24Z"
              fill="white"
              fillOpacity="0.2"
            />
            <path
              d="M20 20L28 28M28 20L20 28"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="24" cy="24" r="6" stroke="white" strokeWidth="2" />
          </svg>
        </div>
        <h1 className="welcome-screen__title">Hi, 我是 Abner AI</h1>
        <p className="welcome-screen__subtitle">有什么我可以帮你的？</p>

        <div className="welcome-screen__suggestions">
          {SUGGESTIONS.map((item) => (
            <button
              key={item.text}
              type="button"
              className="welcome-screen__suggestion-card"
              onClick={() => onSuggestionClick(item.text)}
            >
              <span className="welcome-screen__suggestion-icon">{item.icon}</span>
              <span className="welcome-screen__suggestion-text">{item.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

export default WelcomeScreen;
