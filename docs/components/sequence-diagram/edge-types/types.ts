import type { Edge } from '@xyflow/react';

export enum SequenceEdgeType {
  MessageEdge = 'messageEdge',
}

export type MessageEdge = Edge<{ label: string }, SequenceEdgeType.MessageEdge>;
