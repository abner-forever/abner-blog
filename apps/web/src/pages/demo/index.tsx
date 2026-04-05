import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Row, Col, Typography, Button, Grid } from 'antd';
import {
  PlayCircleOutlined,
  BlockOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Loading from '@/components/Loading';
import './index.less';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// Virtual List Component
const VirtualList: React.FC = () => {
  const [list, setList] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const ITEM_HEIGHT = 60;

  useEffect(() => {
    setTimeout(() => {
      setList(Array.from({ length: 10000 }, (_, i) => i + 1));
      setLoading(false);
    }, 500);
  }, []);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      const containerHeight = e.currentTarget.clientHeight;
      const start = Math.floor(scrollTop / ITEM_HEIGHT);
      const end = Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT);
      setVisibleRange({
        start: Math.max(0, start - 5),
        end: Math.min(list.length, end + 5),
      });
    },
    [list.length],
  );

  if (loading) return <Loading />;

  const visibleItems = list
    .slice(visibleRange.start, visibleRange.end)
    .map((item) => ({
      index: item,
      style: {
        position: 'absolute' as const,
        top: (item - 1) * ITEM_HEIGHT,
        height: ITEM_HEIGHT,
        left: 0,
        right: 0,
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
      },
    }));

  return (
    <div className="virtual-list-demo">
      <div className="virtual-list-header">
        <Text>共 {list.length} 条数据</Text>
        <Text>
          显示 {visibleRange.start + 1} - {visibleRange.end} 条
        </Text>
      </div>
      <div
        className="virtual-list-container"
        ref={containerRef}
        onScroll={handleScroll}
      >
        <div
          style={{ height: list.length * ITEM_HEIGHT, position: 'relative' }}
        >
          {visibleItems.map(({ index, style }) => (
            <div key={index} style={style}>
              <Text>
                第 {index} 条数据 - Item {index}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TETRIS_SHAPES = [
  { shape: [[1, 1, 1, 1]], color: '#00f0f0' },
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#f0f000',
  },
  {
    shape: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: '#a000f0',
  },
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: '#00f000',
  },
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: '#f00000',
  },
  {
    shape: [
      [1, 1, 1],
      [1, 0, 0],
    ],
    color: '#0000f0',
  },
  {
    shape: [
      [1, 1, 1],
      [0, 0, 1],
    ],
    color: '#f0a000',
  },
];

// Tetris Game Component
const TetrisGame: React.FC<{ onClose: () => void }> = ({
  onClose: _onClose,
}) => {
  const { t } = useTranslation();
  const [board, setBoard] = useState<number[][]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentPiece, setCurrentPiece] = useState<{
    shape: number[][];
    x: number;
    y: number;
  } | null>(null);
  const gameRef = useRef<NodeJS.Timeout | null>(null);

  const spawnPiece = useCallback(() => {
    const randomShape =
      TETRIS_SHAPES[Math.floor(Math.random() * TETRIS_SHAPES.length)];
    setCurrentPiece({
      shape: randomShape.shape,
      x: 3,
      y: 0,
    });
  }, []);

  const initGame = () => {
    const newBoard = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    setPlaying(false);
    spawnPiece();
  };

  const canMove = useCallback((shape: number[][], x: number, y: number) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = x + c;
          const newY = y + r;
          if (newX < 0 || newX >= 10 || newY >= 20 || board[newY]?.[newX]) {
            return false;
          }
        }
      }
    }
    return true;
  }, [board]);

  const lockPiece = useCallback(() => {
    if (!currentPiece) return;

    const newBoard = board.map((row) => [...row]);
    currentPiece.shape.forEach((rowCells, r) => {
      rowCells.forEach((cell, c) => {
        if (cell) {
          const y = currentPiece.y + r;
          const x = currentPiece.x + c;
          if (y >= 0 && y < 20 && x >= 0 && x < 10) {
            newBoard[y][x] = 1;
          }
        }
      });
    });

    let linesCleared = 0;
    for (let y = 19; y >= 0; y--) {
      if (newBoard[y].every((cell) => cell === 1)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(10).fill(0));
        linesCleared++;
        y++;
      }
    }

    setScore((s) => s + linesCleared * 100);
    setBoard(newBoard);

    if (currentPiece.y === 0) {
      setGameOver(true);
      setPlaying(false);
    } else {
      spawnPiece();
    }
  }, [currentPiece, board, spawnPiece]);

  const movePiece = useCallback(
    (direction: 'left' | 'right' | 'down') => {
      if (!currentPiece || gameOver || !playing) return;

      let newX = currentPiece.x;
      let newY = currentPiece.y;

      if (direction === 'left') newX--;
      if (direction === 'right') newX++;
      if (direction === 'down') newY++;

      if (canMove(currentPiece.shape, newX, newY)) {
        setCurrentPiece({ ...currentPiece, x: newX, y: newY });
      } else if (direction === 'down') {
        lockPiece();
      }
    },
    [currentPiece, playing, gameOver, canMove, lockPiece],
  );

  // 旋转方块
  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || !playing) return;

    // 矩阵旋转 90度
    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map((row) => row[i]).reverse(),
    );

    // 检查旋转后能否移动
    if (canMove(rotated, currentPiece.x, currentPiece.y)) {
      setCurrentPiece({ ...currentPiece, shape: rotated });
    } else if (canMove(rotated, currentPiece.x - 1, currentPiece.y)) {
      // 尝试左移
      setCurrentPiece({
        ...currentPiece,
        shape: rotated,
        x: currentPiece.x - 1,
      });
    } else if (canMove(rotated, currentPiece.x + 1, currentPiece.y)) {
      // 尝试右移
      setCurrentPiece({
        ...currentPiece,
        shape: rotated,
        x: currentPiece.x + 1,
      });
    }
  }, [currentPiece, playing, gameOver, canMove]);

  useEffect(() => {
    if (playing && !gameOver) {
      gameRef.current = setInterval(() => {
        movePiece('down');
      }, 500);
    }
    return () => {
      if (gameRef.current) clearInterval(gameRef.current);
    };
  }, [playing, gameOver, movePiece]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playing || gameOver) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        movePiece('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        movePiece('right');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        movePiece('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        rotatePiece();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePiece, rotatePiece, playing, gameOver]);

  const renderBoard = () => {
    const displayBoard = board.map((row) => [...row]);
    if (currentPiece && playing) {
      currentPiece.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell) {
            const y = currentPiece.y + r;
            const x = currentPiece.x + c;
            if (y >= 0 && y < 20 && x >= 0 && x < 10) {
              displayBoard[y][x] = 2;
            }
          }
        });
      });
    }
    return displayBoard;
  };

  return (
    <div className="tetris-game-modal">
      <div className="tetris-board">
        {renderBoard().map((row, y) => (
          <div key={y} className="tetris-row">
            {row.map((cell, x) => (
              <div
                key={x}
                className={`tetris-cell ${cell === 1 ? 'filled' : cell === 2 ? 'current' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="tetris-info">
        <div className="score">
          {t('demo.score')}: {score}
        </div>
        {!playing && !gameOver && (
          <Button
            type="primary"
            size="large"
            onClick={() => {
              initGame();
              setPlaying(true);
            }}
            block
          >
            <PlayCircleOutlined /> {t('demo.start')}
          </Button>
        )}
        {gameOver && (
          <div className="game-over">
            <Title level={4}>{t('demo.gameOver')}!</Title>
            <Text>
              {t('demo.finalScore')}: {score}
            </Text>
            <Button
              type="primary"
              block
              style={{ marginTop: 16 }}
              onClick={() => {
                initGame();
                setPlaying(true);
              }}
            >
              {t('demo.restart')}
            </Button>
          </div>
        )}
        {playing && (
          <div className="controls-hint">
            <Text type="secondary">↑ ← ↓ 控制移动</Text>
          </div>
        )}
      </div>
    </div>
  );
};

const DemoPage: React.FC = () => {
  const { t } = useTranslation();
  useBreakpoint();
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const demos = [
    {
      id: 'tetris',
      nameKey: 'demo.tetris',
      descKey: 'demo.tetrisDesc',
      icon: <BlockOutlined />,
      color: '#8b5cf6',
      action: () => setActiveDemo('tetris'),
    },
    {
      id: 'virtual',
      nameKey: 'demo.virtualList',
      descKey: 'demo.virtualListDesc',
      icon: <AppstoreOutlined />,
      color: '#10b981',
      action: () => setActiveDemo('virtual'),
    },
  ];

  return (
    <div className="demo-page">
      <div className="demo-header">
        <Title level={2}>🎮 {t('demo.title')}</Title>
        <Text type="secondary">{t('demo.subtitle')}</Text>
      </div>

      <Row gutter={[20, 20]}>
        {demos.map((demo) => (
          <Col xs={24} sm={12} md={8} lg={6} key={demo.id}>
            <Card className="demo-card" hoverable onClick={demo.action}>
              <div className="demo-icon" style={{ background: demo.color }}>
                {demo.icon}
              </div>
              <div className="demo-info">
                <Text strong>{t(demo.nameKey)}</Text>
                <Text type="secondary" className="demo-desc">
                  {t(demo.descKey)}
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {activeDemo === 'tetris' && (
        <div className="demo-modal-overlay" onClick={() => setActiveDemo(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <Title level={3} className="modal-title">
              {t('demo.tetris')}
            </Title>
            <TetrisGame onClose={() => setActiveDemo(null)} />
          </div>
        </div>
      )}

      {activeDemo === 'virtual' && (
        <div className="demo-modal-overlay" onClick={() => setActiveDemo(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '80%', maxWidth: 600 }}
          >
            <Title level={3} className="modal-title">
              {t('demo.virtualList')}
            </Title>
            <VirtualList />
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoPage;
