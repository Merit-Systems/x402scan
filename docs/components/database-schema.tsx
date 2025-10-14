import { DatabaseSchemaGraph } from '@/components/xyflow/database-schema/graph';
import {
  DatabaseSchemaNodeTypes,
  type DatabaseSchemaEntityNode,
} from '@/components/xyflow/database-schema/node-types/types';

const spacing = 100;

const shared = {
  width: 200,
  type: DatabaseSchemaNodeTypes.Entity,
};

export const nodesData: Pick<DatabaseSchemaEntityNode, 'id' | 'data'>[] = [
  {
    id: 'facilitator',
    data: {
      label: 'Facilitator',
      schema: [
        { title: 'name', type: 'string' },
        { title: 'address', type: 'address' },
        { title: 'metadata', type: 'object' },
      ],
    },
  },
  {
    id: 'transfer',
    data: {
      label: 'Transfer',
      schema: [
        { title: 'sender', type: 'address' },
        { title: 'recipient', type: 'address' },
        { title: 'amount', type: 'number' },
        { title: 'tx_from', type: 'address' },
        { title: 'network', type: 'string' },
      ],
    },
  },
  {
    id: 'accepts',
    data: {
      label: 'Accepts',
      schema: [
        { title: 'pay_to', type: 'address' },
        { title: 'network', type: 'string' },
        { title: 'resource_id', type: 'string' },
      ],
    },
  },
  {
    id: 'resource',
    data: {
      label: 'Resource',
      schema: [
        { title: 'id', type: 'string' },
        { title: 'url', type: 'string' },
        { title: 'origin_id', type: 'string' },
      ],
    },
  },
  {
    id: 'origin',
    data: {
      label: 'Origin',
      schema: [
        { title: 'id', type: 'string' },
        { title: 'metadata', type: 'string' },
      ],
    },
  },
];

export const nodes: DatabaseSchemaEntityNode[] = nodesData.map(
  (node, index) => ({
    ...node,
    position: { x: index * (spacing + shared.width), y: 0 },
    ...shared,
  })
);

const edges = [
  {
    id: 'facilitator-transfer',
    source: 'facilitator',
    target: 'transfer',
    sourceHandle: 'address',
    targetHandle: 'tx_from',
  },
  {
    id: 'transfer-accepts-pay_to',
    source: 'transfer',
    target: 'accepts',
    sourceHandle: 'recipient',
    targetHandle: 'pay_to',
  },
  {
    id: 'transfer-accepts-resource_id',
    source: 'transfer',
    target: 'accepts',
    sourceHandle: 'network',
    targetHandle: 'network',
  },
  {
    id: 'accepts-resource',
    source: 'accepts',
    target: 'resource',
    sourceHandle: 'resource_id',
    targetHandle: 'id',
  },
  {
    id: 'resource-origin',
    source: 'resource',
    target: 'origin',
    sourceHandle: 'origin_id',
    targetHandle: 'id',
  },
];

export const DatabaseSchema = () => {
  return (
    <DatabaseSchemaGraph nodes={nodes} edges={edges} height={300} width={900} />
  );
};
