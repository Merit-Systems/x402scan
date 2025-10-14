import type { Node } from '@xyflow/react';
import type { LucideIcon } from 'lucide-react';

export enum SequenceNodeType {
  Actor = 'actor',
  Message = 'message',
  Sink = 'sink',
}

export type ActorData = { name: string; Icon: LucideIcon };
export type ActorNode = Node<ActorData, SequenceNodeType.Actor>;
export type MessageNode = Node<{ isSource: boolean }, SequenceNodeType.Message>;
export type SinkNode = Node<Record<string, unknown>, SequenceNodeType.Sink>;
