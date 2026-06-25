import React, { memo, useState, useCallback } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Fuse from 'fuse.js';
import { useChat } from '../../context/ChatContext';
import type { ChatSession } from '../../types';

interface SearchResult {
  session: ChatSession;
  matchedMessageContent?: string;
}

interface Props {
  onResultClick: (sessionId: string, messageId?: string) => void;
}

const SidebarSearch: React.FC<Props> = memo(function SidebarSearch({ onResultClick }) {
  const { state } = useChat();
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fuse = new Fuse(state.sessions, {
    keys: [
      { name: 'title', weight: 0.3 },
      { name: 'messages.content', weight: 0.7 },
    ],
    threshold: 0.4,
    includeMatches: true,
    ignoreLocation: true,
  });

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (!value.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      const results = fuse.search(value).slice(0, 10);
      const searchResultsWithMatch: SearchResult[] = results.map((r) => {
        // Find the matched message content
        let matchedMessageContent: string | undefined;
        if (r.matches) {
          const contentMatch = r.matches.find((m) => m.key === 'messages.content');
          if (contentMatch && contentMatch.value) {
            // Get surrounding context of the match
            const matchIndex = contentMatch.indices[0];
            if (matchIndex) {
              const start = Math.max(0, matchIndex[0] - 20);
              const end = Math.min(contentMatch.value.length, matchIndex[1] + 50);
              matchedMessageContent = (start > 0 ? '...' : '') + contentMatch.value.slice(start, end) + (end < contentMatch.value.length ? '...' : '');
            }
          }
        }
        return { session: r.item, matchedMessageContent };
      });
      setSearchResults(searchResultsWithMatch);
    },
    [fuse, state.sessions]
  );

  const handleClear = useCallback(() => {
    setSearchValue('');
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  return (
    <div className="sidebar-search">
      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索会话..."
        value={searchValue}
        onChange={(e) => handleSearch(e.target.value)}
        allowClear
        onClear={handleClear}
        className="sidebar-search-input"
      />
      {isSearching && searchResults.length > 0 && (
        <div className="sidebar-search-results">
          {searchResults.map((result) => (
            <div
              key={result.session.id}
              className="sidebar-search-result-item"
              onClick={() => onResultClick(result.session.id)}
            >
              <div className="search-result-title">{result.session.title}</div>
              {result.matchedMessageContent && (
                <div className="search-result-preview">{result.matchedMessageContent}</div>
              )}
            </div>
          ))}
        </div>
      )}
      {isSearching && searchResults.length === 0 && searchValue && (
        <div className="sidebar-search-empty">未找到匹配的会话</div>
      )}
    </div>
  );
});

export default SidebarSearch;
