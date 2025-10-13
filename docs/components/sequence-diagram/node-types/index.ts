import { ActorNode } from './actor';
import { MessageNode } from './message';
import { SinkNode } from './sink';
import { SequenceNodeType } from './types';

import type { NodeTypes } from '@xyflow/react';

export const sequenceDiagramNodeTypes: NodeTypes = {
  [SequenceNodeType.Actor]: ActorNode,
  [SequenceNodeType.Message]: MessageNode,
  [SequenceNodeType.Sink]: SinkNode,
};
