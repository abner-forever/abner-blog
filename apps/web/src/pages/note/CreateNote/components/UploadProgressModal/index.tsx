import { useId, type FC } from 'react';
import { Modal } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './index.less';

/** 环形描边进度（原样式） | 水注满式（类似安卓商店图标下载） */
export type UploadProgressVisual = 'ring' | 'liquid';

interface UploadProgressModalProps {
  open: boolean;
  progress: number;
  imageCount: number;
  videoCount: number;
  /** 上传中进度展示形态，完成态均为对勾 */
  progressVisual?: UploadProgressVisual;
}

const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;

/** 水面基准线 Y（viewBox 0–100，越大越靠下） */
function liquidSurfaceY(progress: number): number {
  const p = Math.min(100, Math.max(0, progress));
  return 100 - (p / 100) * 90;
}

function buildWavePath(surfaceY: number): string {
  const y = surfaceY;
  const a = 2.8;
  // 加宽重复段，便于横向位移动画
  return [
    'M -120',
    String(y + a * 0.3),
    'Q -87.5',
    String(y - a),
    '-55',
    String(y + a * 0.3),
    'T 10',
    String(y + a * 0.3),
    'T 75',
    String(y + a * 0.3),
    'T 140',
    String(y + a * 0.3),
    'T 205',
    String(y + a * 0.3),
    'L 205 110 L -120 110 Z',
  ].join(' ');
}

interface RingProgressProps {
  progress: number;
  gradientId: string;
}

const RingProgress: FC<RingProgressProps> = ({ progress, gradientId }) => (
  <>
    <svg
      className="uploadProgressModal__svg"
      width={132}
      height={132}
      viewBox="0 0 120 120"
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="var(--primary-color)" />
          <stop offset="100%" stopColor="var(--primary-hover)" />
        </linearGradient>
      </defs>
      <circle
        className="uploadProgressModal__progressTrack"
        cx="60"
        cy="60"
        r={RING_R}
      />
      <circle
        className="uploadProgressModal__progressBar"
        cx="60"
        cy="60"
        r={RING_R}
        stroke={`url(#${gradientId})`}
        strokeDasharray={RING_C}
        strokeDashoffset={RING_C * (1 - progress / 100)}
      />
    </svg>
    <span className="uploadProgressModal__percent">{progress}%</span>
  </>
);

interface LiquidProgressProps {
  progress: number;
  clipId: string;
  gradId: string;
  gradDeepId: string;
}

const LiquidProgress: FC<LiquidProgressProps> = ({
  progress,
  clipId,
  gradId,
  gradDeepId,
}) => {
  const y = liquidSurfaceY(progress);
  const d = buildWavePath(y);

  return (
    <>
      <svg
        className="uploadProgressModal__liquidSvg"
        width={132}
        height={132}
        viewBox="0 0 100 100"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="var(--primary-hover)" stopOpacity="0.95" />
            <stop offset="55%" stopColor="var(--primary-color)" stopOpacity="0.88" />
            <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id={gradDeepId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="var(--primary-hover)" stopOpacity="0.75" />
            <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.4" />
          </linearGradient>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r="46" />
          </clipPath>
        </defs>
        {/* 空「容器」底色 */}
        <circle
          className="uploadProgressModal__liquidTrack"
          cx="50"
          cy="50"
          r="46"
        />
        <g clipPath={`url(#${clipId})`}>
          <g className="uploadProgressModal__liquidWaveGroup">
            <path className="uploadProgressModal__liquidWavePath" d={d} fill={`url(#${gradId})`} />
          </g>
          <g className="uploadProgressModal__liquidWaveGroup uploadProgressModal__liquidWaveGroup--secondary">
            <path
              className="uploadProgressModal__liquidWavePath"
              d={d}
              fill={`url(#${gradDeepId})`}
            />
          </g>
        </g>
        {/* 内圈高光边 */}
        <circle
          className="uploadProgressModal__liquidRim"
          cx="50"
          cy="50"
          r="46"
          fill="none"
        />
      </svg>
      <span className="uploadProgressModal__percent uploadProgressModal__liquidPercent">
        {progress}%
      </span>
    </>
  );
};

const UploadProgressModal: FC<UploadProgressModalProps> = ({
  open,
  progress,
  imageCount,
  videoCount,
  progressVisual = 'ring',
}) => {
  const { t } = useTranslation();
  const rawId = useId();
  const safeId = rawId.replace(/:/g, '');
  const ringGradientId = `upload-progress-ring-${safeId}`;
  const liquidClipId = `upload-progress-clip-${safeId}`;
  const liquidGradId = `upload-progress-liq-${safeId}`;
  const liquidGradDeepId = `upload-progress-liqd-${safeId}`;
  const isDone = progress >= 100;

  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      centered
      width={400}
      rootClassName="uploadProgressModal"
    >
      <div className="uploadProgressModal__accent" aria-hidden />
      <div
        className="uploadProgressModal__body"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div
          className={`uploadProgressModal__ringWrap${!isDone ? ' is-uploading' : ''}${progressVisual === 'liquid' ? ' uploadProgressModal__ringWrap--liquid' : ''}`}
        >
          {!isDone ? (
            progressVisual === 'liquid' ? (
              <LiquidProgress
                progress={progress}
                clipId={liquidClipId}
                gradId={liquidGradId}
                gradDeepId={liquidGradDeepId}
              />
            ) : (
              <RingProgress progress={progress} gradientId={ringGradientId} />
            )
          ) : (
            <CheckCircleFilled className="uploadProgressModal__doneIcon" aria-hidden />
          )}
        </div>

        <h3 className="uploadProgressModal__title">
          {isDone ? t('note.publishSuccess') : t('note.uploadProgressPublishing')}
        </h3>
        {!isDone && videoCount > 0 && (
          <p className="uploadProgressModal__subtitle">
            {t('note.uploadProgressHint')}
          </p>
        )}

        {(imageCount > 0 || videoCount > 0) && (
          <div className="uploadProgressModal__chips">
            {imageCount > 0 && (
              <span className="uploadProgressModal__chip">
                {t('note.uploadProgressImages', { count: imageCount })}
              </span>
            )}
            {videoCount > 0 && (
              <span className="uploadProgressModal__chip">
                {t('note.uploadProgressVideos', { count: videoCount })}
              </span>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UploadProgressModal;
