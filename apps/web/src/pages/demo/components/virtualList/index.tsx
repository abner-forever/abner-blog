import React, { useMemo, useState, type UIEvent } from 'react';

interface VirtualListProps<T> {
  data: T[];
  height: number;
  itemHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

function VirtualList<T>({
  data,
  height,
  itemHeight,
  overscan = 5,
  renderItem,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(height / itemHeight);

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemHeight) - overscan,
  );

  const endIndex = Math.min(
    data.length,
    startIndex + visibleCount + overscan * 2,
  );

  const visibleData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  const offsetY = startIndex * itemHeight;

  const totalHeight = data.length * itemHeight;

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      style={{
        height,
        overflowY: 'auto',
        overflowAnchor: 'none',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform',
          }}
        >
          {visibleData.map((item, index) => (
            <div
              key={startIndex + index}
              style={{
                height: itemHeight,
                boxSizing: 'border-box',
              }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualList;