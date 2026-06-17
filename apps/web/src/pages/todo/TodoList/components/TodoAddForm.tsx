import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface TodoAddFormProps {
  inputValue: string;
  descriptionValue: string;
  isFormExpanded: boolean;
  isAdding: boolean;
  onInputChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onExpand: (expanded: boolean) => void;
  onAdd: () => void;
  onCancel: () => void;
}

const TodoAddForm: React.FC<TodoAddFormProps> = ({
  inputValue,
  descriptionValue,
  isFormExpanded,
  isAdding,
  onInputChange,
  onDescriptionChange,
  onExpand,
  onAdd,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <div className={`todo-add-card ${isFormExpanded ? 'expanded' : ''}`}>
      <div className="add-input-row">
        <PlusOutlined className="add-icon" />
        <input
          className="add-main-input"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={t('todo.title') + '...'}
          onFocus={() => onExpand(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onAdd();
            }
            if (e.key === 'Escape') onCancel();
          }}
          disabled={isAdding}
        />
        {!isFormExpanded && (
          <button
            className="add-quick-btn"
            onClick={() => {
              if (inputValue.trim()) {
                onAdd();
              } else {
                onExpand(true);
              }
            }}
          >
            {t('todo.add')}
          </button>
        )}
      </div>

      <div className={`add-expanded ${isFormExpanded ? 'visible' : ''}`}>
        <textarea
          className="add-desc-input"
          value={descriptionValue}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={
            t('todo.description') +
            '... (' +
            t('common.optional', '可选') +
            ')'
          }
          rows={2}
          disabled={isAdding}
        />
        <div className="add-actions">
          <button className="btn-cancel" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button
            className="btn-confirm"
            onClick={onAdd}
            disabled={isAdding}
          >
            {isAdding ? '...' : t('todo.add')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoAddForm;
