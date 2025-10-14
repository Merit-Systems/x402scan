import { MessageEdge } from './message-edge';
import { SinkEdge } from './sink-edge';
import { SequenceEdgeType } from './types';
import type { EdgeTypes } from '@xyflow/react';

export const sequenceDiagramEdgeTypes: EdgeTypes = {
  [SequenceEdgeType.MessageEdge]: MessageEdge,
  [SequenceEdgeType.SinkEdge]: SinkEdge,
};
