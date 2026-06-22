import { useState, useEffect, useCallback } from "react";
import { Modal, Spin, Empty } from "antd";
import {
  BarChartOutlined,
} from "@ant-design/icons";
import { statsApi, type DailyPV } from "@/services/api";

interface StatsChartProps {
  open: boolean;
  pageId: number;
  pageTitle?: string;
  onClose: () => void;
}

/** 简易折线图 — 纯CSS/SVG实现，无需第三方图表库 */
const SimpleLineChart: React.FC<{
  data: DailyPV[];
  width?: number;
  height?: number;
}> = ({ data, width = 480, height = 200 }) => {
  if (data.length === 0) return <Empty description="暂无数据" />;

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padding.top + chartH - (d.count / maxVal) * chartH;
    return `${x},${y}`;
  });

  const linePath = points.join(" ");

  // Y axis ticks
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {/* Grid lines */}
      {yTicks.map((tick) => {
        const y = padding.top + chartH - (tick / maxVal) * chartH;
        return (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#f0f0f0"
              strokeWidth={1}
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={11}
              fill="#999"
            >
              {tick}
            </text>
          </g>
        );
      })}

      {/* Line */}
      <polyline
        points={linePath}
        fill="none"
        stroke="#1890ff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {data.map((d, i) => {
        const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
        const y = padding.top + chartH - (d.count / maxVal) * chartH;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={3} fill="#1890ff" />
            <title>{`${d.date}: ${d.count}`}</title>
          </g>
        );
      })}

      {/* X axis labels (show first, middle, last) */}
      {data.length > 0 && (
        <>
          {[0, Math.floor(data.length / 2), data.length - 1].map((i) => {
            const x =
              padding.left +
              (i / Math.max(data.length - 1, 1)) * chartW;
            return (
              <text
                key={i}
                x={x}
                y={height - 5}
                textAnchor="middle"
                fontSize={11}
                fill="#999"
              >
                {data[i].date.slice(5)}
              </text>
            );
          })}
        </>
      )}
    </svg>
  );
};

const StatsChart: React.FC<StatsChartProps> = ({
  open,
  pageId,
  pageTitle,
  onClose,
}) => {
  const [dailyData, setDailyData] = useState<DailyPV[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [dailyResult, totalResult] = await Promise.all([
        statsApi.getDaily(pageId, 30),
        statsApi.getTotal(pageId),
      ]);
      setDailyData(dailyResult.daily);
      setTotal(totalResult.total);
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (open && pageId) {
      fetchStats();
    }
  }, [open, pageId, fetchStats]);

  return (
    <Modal
      title={
        <span>
          <BarChartOutlined style={{ marginRight: 8 }} />
          访问趋势
          {pageTitle ? ` - ${pageTitle}` : ""}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      getContainer={document.body}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin />
        </div>
      ) : (
        <div>
          <div
            style={{
              textAlign: "center",
              fontSize: 28,
              fontWeight: 600,
              color: "#1890ff",
              marginBottom: 8,
            }}
          >
            {total.toLocaleString()}
            <span style={{ fontSize: 14, color: "#999", marginLeft: 8 }}>
              总访问量
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#999",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            最近 30 天访问趋势
          </div>
          <SimpleLineChart data={dailyData} />
          {dailyData.length > 0 && (
            <div
              style={{
                marginTop: 16,
                fontSize: 12,
                color: "#bbb",
                textAlign: "center",
              }}
            >
              鼠标悬停查看每日数据
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default StatsChart;
