import { useState } from 'react';

function VirtualList({ list }: { list: string[] }) {
  const itemHeight = 40; // 每项高度
  const visibleCount = 10; // 可视区域10条数据

  const [scrollTop, setScrollTop] = useState(0);

  // 根据滚动计算起始节点下标
  const start = Math.floor(scrollTop / itemHeight);

  const end = start + visibleCount;

  // 可视 区域的数据
  const visible = list.slice(start, end);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div style={{ height: 400, overflow: 'auto' }} onScroll={handleScroll}>
      <div style={{ height: `${list.length * itemHeight}px` }}>
        <div
          style={{
            transform: `translateY(${start * itemHeight}px)`,
          }}
        >
          {visible.map((item) => (
            <div style={{ height: itemHeight }}>{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualList;
