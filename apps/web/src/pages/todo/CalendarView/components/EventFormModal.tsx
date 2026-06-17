import { Modal, Form, Input, DatePicker, Switch } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ColorPickerField from '../../shared/ColorPickerField';
import type { CalendarEventData } from '../../shared/utils';

interface EventFormModalProps {
  visible: boolean;
  editingEvent: CalendarEventData | null;
  form: ReturnType<typeof Form.useForm>[0];
  confirmLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

const EventFormModal: React.FC<EventFormModalProps> = ({
  visible,
  editingEvent,
  form,
  confirmLoading,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation();
  const allDay = Form.useWatch('allDay', form) ?? true;

  return (
    <Modal
      title={
        <div className="modal-title">
          <CalendarOutlined />
          <span>{editingEvent ? t('calendar.edit') : t('calendar.add')}</span>
        </div>
      }
      open={visible}
      onOk={onSubmit}
      onCancel={onCancel}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      confirmLoading={confirmLoading}
      width={480}
    >
      <Form form={form} layout="vertical" className="event-form">
        <Form.Item
          name="title"
          label={t('calendar.eventTitle')}
          rules={[{ required: true, message: t('calendar.pleaseEnterTitle') }]}
        >
          <Input placeholder={t('calendar.titlePlaceholder')} size="large" />
        </Form.Item>

        <Form.Item name="description" label={t('calendar.description')}>
          <Input.TextArea rows={2} placeholder={t('calendar.descriptionPlaceholder')} />
        </Form.Item>

        <Form.Item
          name="allDay"
          label={t('calendar.allDay', '全天')}
          valuePropName="checked"
          initialValue={true}
        >
          <Switch size="small" />
        </Form.Item>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Form.Item
            name="startDate"
            label={t('calendar.startDate')}
            rules={[{ required: true, message: t('calendar.pleaseSelectStartDate') }]}
            style={{ flex: 1 }}
          >
            <DatePicker
              style={{ width: '100%' }}
              showTime={!allDay ? { format: 'HH:mm' } : undefined}
              format={allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm'}
            />
          </Form.Item>
          <Form.Item
            name="endDate"
            label={t('calendar.endDate')}
            style={{ flex: 1 }}
          >
            <DatePicker
              style={{ width: '100%' }}
              showTime={!allDay ? { format: 'HH:mm' } : undefined}
              format={allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm'}
              placeholder={t('calendar.endDatePlaceholder')}
            />
          </Form.Item>
        </div>

        <Form.Item name="color" label={t('calendar.colorLabel')} initialValue="#8b5cf6">
          <ColorPickerField />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EventFormModal;
