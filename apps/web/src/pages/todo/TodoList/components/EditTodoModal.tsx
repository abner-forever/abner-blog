import { Modal, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import type { TodoDto } from '@services/generated/model';

const { TextArea } = Input;

interface EditTodoModalProps {
  visible: boolean;
  editingTodo: TodoDto | null;
  form: ReturnType<typeof Form.useForm>[0];
  onSubmit: () => void;
  onCancel: () => void;
}

const EditTodoModal: React.FC<EditTodoModalProps> = ({
  visible,
  form,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t('todo.edit')}
      open={visible}
      onOk={onSubmit}
      onCancel={onCancel}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label={t('todo.title')}
          rules={[{ required: true, message: t('todo.pleaseEnterContent') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t('todo.description')}>
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditTodoModal;
