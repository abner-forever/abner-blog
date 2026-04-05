import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs, { type Dayjs } from 'dayjs';
import type { ClarificationNeededDto } from '@services/generated/model';

const { TextArea } = Input;

interface ClarificationModalProps {
  open: boolean;
  clarification: ClarificationNeededDto | null;
  onComplete: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

interface FormValues {
  title: string;
  description?: string;
  startDate?: Dayjs;
  endDate?: Dayjs;
  allDay?: boolean;
  location?: string;
}

const ClarificationModal: React.FC<ClarificationModalProps> = ({
  open,
  clarification,
  onComplete,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<FormValues>();
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    if (open && clarification) {
      const initialValues: FormValues = {
        title: (clarification.partialData?.['title'] as string) || '',
        description: clarification.partialData?.['description'] as string,
        allDay: clarification.partialData?.['allDay'] as boolean,
        location: clarification.partialData?.['location'] as string,
      };

      if (clarification.partialData?.['startDate']) {
        initialValues.startDate = dayjs(
          clarification.partialData['startDate'] as string,
        );
      }
      if (clarification.partialData?.['endDate']) {
        initialValues.endDate = dayjs(
          clarification.partialData['endDate'] as string,
        );
      }

      form.setFieldsValue(initialValues);
    }
  }, [open, clarification, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const completeData: Record<string, unknown> = {
        title: values.title,
        description: values.description,
        allDay: values.allDay,
        location: values.location,
      };

      if (values.startDate) {
        completeData.startDate = values.startDate.toISOString();
      }
      if (values.endDate) {
        completeData.endDate = values.endDate.toISOString();
      }

      // 直接完成，不再调用 AI 补全接口
      setIsLoading(true);
      try {
        onComplete(completeData);
      } finally {
        setIsLoading(false);
      }
    } catch {
      // 表单验证失败，不做处理
    }
  };

  const renderFields = () => {
    if (!clarification) return null;

    const fields = [];

    if (clarification.missingFields.includes('title')) {
      fields.push(
        <Form.Item
          key="title"
          name="title"
          label={t('calendar.eventTitle')}
          rules={[{ required: true, message: t('todo.pleaseEnterContent') }]}
        >
          <Input placeholder={t('todo.title')} size="large" />
        </Form.Item>,
      );
    }

    if (clarification.missingFields.includes('startDate')) {
      fields.push(
        <Form.Item
          key="startDate"
          name="startDate"
          label={t('calendar.startDate')}
          rules={[{ required: true, message: t('calendar.pleaseSelectDate') }]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>,
      );
    }

    if (clarification.missingFields.includes('endDate')) {
      fields.push(
        <Form.Item key="endDate" name="endDate" label={t('calendar.endDate')}>
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>,
      );
    }

    if (clarification.missingFields.includes('location')) {
      fields.push(
        <Form.Item
          key="location"
          name="location"
          label={t('calendar.location')}
        >
          <Input placeholder={t('calendar.location')} />
        </Form.Item>,
      );
    }

    // 描述字段始终显示
    fields.push(
      <Form.Item
        key="description"
        name="description"
        label={t('todo.description')}
      >
        <TextArea rows={2} placeholder={t('todo.description')} />
      </Form.Item>,
    );

    // 全天事件开关
    if (clarification.intent === 'create_event') {
      fields.push(
        <Form.Item
          key="allDay"
          name="allDay"
          label={t('calendar.allDay')}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>,
      );
    }

    return fields;
  };

  return (
    <Modal
      title={
        clarification?.intent === 'create_todo'
          ? t('todo.add')
          : t('calendar.add')
      }
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      confirmLoading={isLoading}
      width={480}
    >
      {clarification && (
        <>
          <div
            className="clarification-suggestion"
            style={{ marginBottom: 16, color: '#666' }}
          >
            {clarification.suggestion}
          </div>
          <Form form={form} layout="vertical">
            {renderFields()}
          </Form>
        </>
      )}
    </Modal>
  );
};

export default ClarificationModal;
