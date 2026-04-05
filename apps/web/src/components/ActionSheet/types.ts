import React from 'react';

export interface ActionSheetItem {
  key: string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  badge?: string | number;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}
