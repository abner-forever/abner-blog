import React from 'react';
import { useTranslation } from 'react-i18next';
import Loading from '../Loading';
import CustomEmpty from '../CustomEmpty';
import MomentCard from '../MomentCard';
import type { MomentDto } from '@services/generated/model';
import './index.less';

interface MomentListProps {
  moments: MomentDto[];
  loading?: boolean;
  onUpdate?: () => void;
  showActions?: boolean;
}

const MomentList: React.FC<MomentListProps> = ({
  moments,
  loading = false,
  onUpdate,
  showActions = true,
}) => {
  const { t } = useTranslation();

  // 如果有数据但正在刷新，显示小的 loading
  if (loading) {
    return (
      <div className="moment-list-loading">
        <Loading />
      </div>
    );
  }

  if (moments.length === 0) {
    return (
      <div className="moment-list-empty">
        <CustomEmpty tip={t('common.emptyMoment')} />
      </div>
    );
  }

  return (
    <div className="moment-list">
      {moments.map((moment) => (
        <MomentCard
          key={moment.id}
          moment={moment}
          onUpdate={onUpdate}
          showActions={showActions}
        />
      ))}
    </div>
  );
};

export default MomentList;
