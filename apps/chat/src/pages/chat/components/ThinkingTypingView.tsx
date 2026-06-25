import { memo, useEffect, useRef, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

const ThinkingTypingView = memo<{
  content: string;
  expanded: boolean;
  isDark?: boolean;
  isStreaming?: boolean;
}>(({ content, expanded, isDark, isStreaming = false }) => {
  const [displayContent, setDisplayContent] = useState('');
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderedLengthRef = useRef(0);
  const contentRef = useRef(content);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    contentRef.current = content;

    if (!isStreaming) {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      renderedLengthRef.current = content.length;
      setDisplayContent(content);
      return;
    }

    if (content.length < renderedLengthRef.current) {
      renderedLengthRef.current = 0;
      setDisplayContent('');
    }
    const scheduleTyping = () => {
      if (typingTimerRef.current) return;
      const tick = () => {
        const latest = contentRef.current;
        const start = renderedLengthRef.current;
        if (start >= latest.length) {
          typingTimerRef.current = null;
          return;
        }
        const next = latest.slice(start, start + 2);
        renderedLengthRef.current += next.length;
        setDisplayContent((prev) => prev + next);
        typingTimerRef.current = setTimeout(tick, 16);
      };
      typingTimerRef.current = setTimeout(tick, 0);
    };
    scheduleTyping();
  }, [content, isStreaming]);

  useEffect(
    () => () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [displayContent, expanded]);

  return (
    <div
      className={`assistant-thinking__content ${expanded ? 'expanded' : 'collapsed'}`}
    >
      <div ref={scrollContainerRef} className="assistant-thinking__scroll">
        {expanded ? (
          <MarkdownRenderer content={displayContent} isDark={isDark} />
        ) : (
          <div className="assistant-thinking__previewText">{displayContent}</div>
        )}
      </div>
    </div>
  );
});

ThinkingTypingView.displayName = 'ThinkingTypingView';

export default ThinkingTypingView;
