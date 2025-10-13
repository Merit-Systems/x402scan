import type { Node } from '@xyflow/react';

export enum SequenceNodeType {
  Actor = 'actor',
  Message = 'message',
  Sink = 'sink',
}

export type ActorNode = Node<{ name: string }, SequenceNodeType.Actor>;
export type MessageNode = Node<{ isSource: boolean }, SequenceNodeType.Message>;
export type SinkNode = Node<Record<string, unknown>, SequenceNodeType.Sink>;
