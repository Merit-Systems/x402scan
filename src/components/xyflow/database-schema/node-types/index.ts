import type { NodeTypes } from '@xyflow/react';
import { DatabaseSchemaNodeTypes } from './types';
import { DatabaseSchemaEntityNode } from './database-entity';

export const databaseSchemaNodeTypes: NodeTypes = {
  [DatabaseSchemaNodeTypes.Entity]: DatabaseSchemaEntityNode,
};
