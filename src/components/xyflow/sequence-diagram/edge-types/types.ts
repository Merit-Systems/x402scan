import type { Edge } from '@xyflow/react';

export enum SequenceEdgeType {
  MessageEdge = 'messageEdge',
  SinkEdge = 'sinkEdge',
}

export type MessageEdge = Edge<
  { label: string; index: number },
  SequenceEdgeType.MessageEdge
>;

export type SinkEdge = Edge<Record<string, unknown>, SequenceEdgeType.SinkEdge>;
