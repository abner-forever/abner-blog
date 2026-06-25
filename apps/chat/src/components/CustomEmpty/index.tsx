import { Empty } from 'antd';
import { useTranslation } from 'react-i18next';

interface CustomEmptyProps {
  description?: string;
  tip?: string;
  image?: React.ReactNode;
}

const CustomEmpty: React.FC<CustomEmptyProps> = ({ description, tip, image }) => {
  const { t } = useTranslation();

  return (
    <Empty
      image={image || Empty.PRESENTED_IMAGE_SIMPLE}
      description={description || tip || t('chat.noKnowledgeBases')}
    />
  );
};

export default CustomEmpty;
