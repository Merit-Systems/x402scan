import React, { memo, type ReactNode } from 'react';

import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
} from '@/components/xyflow/lib/base-node';
import { TableBody, TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { NodeProps } from '@xyflow/react';
import { Position } from '@xyflow/react';
import { LabeledHandle } from '../../lib/labeled-handle';
import type { DatabaseSchemaEntityNode as DatabaseSchemaEntityNodeType } from './types';

type DatabaseSchemaNodeHeaderProps = {
  children?: ReactNode;
};

const DatabaseSchemaNodeHeader = ({
  children,
}: DatabaseSchemaNodeHeaderProps) => {
  return (
    <BaseNodeHeader className="rounded-tl-md rounded-tr-md bg-primary p-2 text-center text-sm text-white m-0!">
      <span className="my-0 text-lg font-bold">{children}</span>
    </BaseNodeHeader>
  );
};

type DatabaseSchemaNodeBodyProps = {
  children?: ReactNode;
};

const DatabaseSchemaNodeBody = ({ children }: DatabaseSchemaNodeBodyProps) => {
  return (
    <BaseNodeContent className="p-0 h-fit!">
      <table className="overflow-visible my-0! border-0! bg-transparent!">
        <TableBody>{children}</TableBody>
      </table>
    </BaseNodeContent>
  );
};

type DatabaseSchemaTableRowProps = {
  children: ReactNode;
  className?: string;
};

const DatabaseSchemaTableRow = ({
  children,
  className,
}: DatabaseSchemaTableRowProps) => {
  return (
    <TableRow className={cn('relative text-xs', className)}>
      {children}
    </TableRow>
  );
};

type DatabaseSchemaTableCellProps = {
  className?: string;
  children?: ReactNode;
};

const DatabaseSchemaTableCell = ({
  className,
  children,
}: DatabaseSchemaTableCellProps) => {
  return <TableCell className={className}>{children}</TableCell>;
};

type DatabaseSchemaNodeProps = {
  className?: string;
  children?: ReactNode;
};

const DatabaseSchemaBaseNode = ({
  className,
  children,
}: DatabaseSchemaNodeProps) => {
  return <BaseNode className={className}>{children}</BaseNode>;
};

export const DatabaseSchemaEntityNode = memo(
  ({ data }: NodeProps<DatabaseSchemaEntityNodeType>) => {
    return (
      <DatabaseSchemaBaseNode className="p-0 flex flex-col border-primary cursor-default">
        <DatabaseSchemaNodeHeader>{data.label}</DatabaseSchemaNodeHeader>
        <DatabaseSchemaNodeBody>
          {data.schema.map(entry => (
            <DatabaseSchemaTableRow key={entry.title}>
              <DatabaseSchemaTableCell className="pl-0 pr-6 font-light">
                <LabeledHandle
                  id={entry.title}
                  title={entry.title}
                  type="target"
                  position={Position.Left}
                />
              </DatabaseSchemaTableCell>
              <DatabaseSchemaTableCell className="pr-0 font-thin font-mono">
                <LabeledHandle
                  id={entry.title}
                  title={entry.type}
                  type="source"
                  position={Position.Right}
                  className="p-0"
                  handleClassName="p-0"
                  labelClassName="p-0 w-full pr-3 text-right"
                />
              </DatabaseSchemaTableCell>
            </DatabaseSchemaTableRow>
          ))}
        </DatabaseSchemaNodeBody>
      </DatabaseSchemaBaseNode>
    );
  }
);

DatabaseSchemaEntityNode.displayName = 'DatabaseSchemaEntityNode';
