import type { Node } from '@xyflow/react';

export enum DatabaseSchemaNodeTypes {
  Entity = 'entity',
}

export type DatabaseSchemaEntityNodeData = {
  label: string;
  schema: DatabaseSchemaTableEntry[];
};
export type DatabaseSchemaTableEntry = { title: string; type: string };
export type DatabaseSchemaEntityNode = Node<DatabaseSchemaEntityNodeData>;
