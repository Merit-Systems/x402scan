'use client';

import React from 'react';

import { Graph } from '../graph';

import { databaseSchemaNodeTypes } from './node-types';

import type { Edge } from '@xyflow/react';
import type { DatabaseSchemaEntityNode } from './node-types/types';

interface Props {
  nodes: DatabaseSchemaEntityNode[];
  edges: Edge[];
  height?: number;
  width?: number;
}

export const DatabaseSchemaGraph: React.FC<Props> = ({
  nodes,
  edges,
  height,
  width,
}) => {
  return (
    <Graph
      nodes={nodes}
      edges={edges}
      nodeTypes={databaseSchemaNodeTypes}
      height={height}
      width={width}
    />
  );
};
