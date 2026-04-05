import classNames from 'classnames';
import React, { type ReactNode } from 'react';
import { Empty, Spin } from 'antd';
import './index.less';

export type DataListRowPropsGetter<T> = (
  item: T,
  index: number,
) => React.HTMLAttributes<HTMLElement> | undefined;

export interface DataListProps<T> {
  dataSource: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  rowKey?: (item: T, index: number) => React.Key;
  /** 列表根节点 class（无 header / wrapper 时即为列表容器） */
  className?: string;
  rowClassName?: string | ((item: T, index: number) => string | undefined);
  rowProps?: DataListRowPropsGetter<T>;
  loading?: boolean;
  loadingClassName?: string;
  /** 与 antd List 的 locale.emptyText 对齐 */
  locale?: { emptyText?: ReactNode };
  /** 空数据时展示，优先级高于 locale.emptyText */
  empty?: ReactNode;
  /** 列表语义标签：ul 时常与 itemTag="li" 搭配 */
  listTag?: 'div' | 'ul';
  itemTag?: 'div' | 'li';
  /** 为 false 时不设置 role（如原生 ul/li 已有隐式角色） */
  listRole?: 'list' | false;
  itemRole?: 'listitem' | false;
  /** 包裹 header + 列表的外层（如资源卡片栏目） */
  header?: ReactNode;
  wrapperClassName?: string;
}

function resolveRowClassName<T>(
  rowClassName: DataListProps<T>['rowClassName'],
  item: T,
  index: number,
): string | undefined {
  if (rowClassName === undefined) return undefined;
  return typeof rowClassName === 'function' ? rowClassName(item, index) : rowClassName;
}

function defaultRowKey<T>(item: T, index: number): React.Key {
  if (item !== null && typeof item === 'object') {
    const rec = item as Record<string, unknown>;
    if ('id' in rec && rec.id != null) return String(rec.id);
    if ('key' in rec && rec.key != null) return String(rec.key);
  }
  return index;
}

/**
 * 项目内替代 antd `List` 的数据列表：无弃用告警，API 贴近 `dataSource` + `renderItem`。
 */
export function DataList<T>({
  dataSource,
  renderItem,
  rowKey = defaultRowKey,
  className,
  rowClassName,
  rowProps,
  loading = false,
  loadingClassName,
  locale,
  empty,
  listTag = 'div',
  itemTag = 'div',
  listRole,
  itemRole,
  header,
  wrapperClassName,
}: DataListProps<T>) {
  if (loading) {
    return (
      <div className={classNames('data-list__loading', loadingClassName)}>
        <Spin />
      </div>
    );
  }

  if (dataSource.length === 0) {
    const emptyNode =
      empty !== undefined
        ? empty
        : locale?.emptyText !== undefined && locale.emptyText !== null ? (
            <Empty description={locale.emptyText} />
          ) : null;
    if (emptyNode === null) return null;
    return <div className={className}>{emptyNode}</div>;
  }

  const ListTag = listTag;
  const ItemTag = itemTag;

  const listRoleAttr =
    listRole === false
      ? undefined
      : listTag === 'ul'
        ? undefined
        : (listRole ?? 'list');

  const itemRoleAttr =
    itemRole === false
      ? undefined
      : itemTag === 'li'
        ? undefined
        : (itemRole ?? 'listitem');

  const listBody = (
    <ListTag className={className} role={listRoleAttr}>
      {dataSource.map((item, index) => {
        const key = rowKey(item, index);
        const rowCn = resolveRowClassName(rowClassName, item, index);
        const extra = rowProps?.(item, index) ?? {};
        return React.createElement(
          ItemTag,
          {
            key,
            className: rowCn,
            role: itemRoleAttr,
            ...extra,
          },
          renderItem(item, index),
        );
      })}
    </ListTag>
  );

  if (header !== undefined || wrapperClassName !== undefined) {
    return (
      <div className={wrapperClassName}>
        {header}
        {listBody}
      </div>
    );
  }

  return listBody;
}

export default DataList;
