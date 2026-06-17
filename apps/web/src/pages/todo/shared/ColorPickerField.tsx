import { Tooltip } from 'antd';
import { colorOptions } from './utils';

interface ColorPickerFieldProps {
  value?: string;
  onChange?: (value: string) => void;
}

const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="color-picker-field">
      {colorOptions.map((color) => (
        <Tooltip key={color.value} title={color.label}>
          <div
            className={`color-option ${value === color.value ? 'selected' : ''}`}
            style={{ backgroundColor: color.value }}
            onClick={() => onChange?.(color.value)}
          >
            {value === color.value && <span className="check-icon">✓</span>}
          </div>
        </Tooltip>
      ))}
    </div>
  );
};

export default ColorPickerField;
