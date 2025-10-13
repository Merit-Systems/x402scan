'use client';

import type { Node } from '@xyflow/react';
import { MarkerType, Position, type Edge } from '@xyflow/react';

import { Graph } from '../graph';

import { SequenceNodeType } from './node-types/types';

import type { MessageNode, SinkNode } from './node-types/types';
import { SequenceEdgeType, type MessageEdge } from './edge-types/types';

interface Props {
  actors: string[];
  messages: {
    sender: string;
    receiver: string;
    message: string;
  }[];
  height?: number;
  itemWidth?: number;
  itemHeight?: number;
  itemSpacing?: number;
  messageHeight?: number;
  messageSpacing?: number;
}

export const SequenceDiagram: React.FC<Props> = ({
  actors,
  messages,
  itemWidth = 200,
  itemHeight = 50,
  itemSpacing = 100,
  messageHeight = 25,
  messageSpacing = 25,
}) => {
  const actorNodes: Node[] = actors.map((actor, index) => ({
    id: actor,
    position: { x: index * itemWidth + index * itemSpacing, y: 0 },
    data: { label: actor },
    height: itemHeight,
    width: itemWidth,
    type: SequenceNodeType.Actor,
    handles: [
      {
        type: 'source',
        position: Position.Bottom,
        x: itemWidth / 2,
        y: itemHeight,
        style: {
          opacity: 0,
        },
      },
    ],
  }));

  const sinkNodes: Node[] = actors.map((actor, index) => ({
    id: `sink-${actor}`,
    position: {
      x: index * itemWidth + index * itemSpacing,
      y:
        itemHeight +
        messageSpacing +
        messages.length * (messageHeight + messageSpacing),
    },
    data: {},
    height: 1,
    width: itemWidth,
    handles: [
      {
        type: 'target',
        position: Position.Top,
        x: itemWidth / 2,
        y: 0,
      },
    ],
  }));

  const messageNodes: MessageNode[] = messages
    .map((message, index) => {
      const y =
        itemHeight + messageSpacing + index * (messageHeight + messageSpacing);
      const commonProps = {
        height: messageHeight,
        width: itemWidth,
        type: SequenceNodeType.Message as const,
      };
      return [
        {
          id: `${message.sender}-${index}`,
          position: {
            x:
              actorNodes.find(node => node.id === message.sender)!.position.x -
              itemWidth / 2,
            y: y,
          },
          data: { isSource: true },
          ...commonProps,
        },
        {
          id: `${message.receiver}-${index}`,
          position: {
            x:
              actorNodes.find(node => node.id === message.receiver)!.position
                .x +
              itemWidth / 2,
            y,
          },
          data: { isSource: false },
          ...commonProps,
        },
      ];
    })
    .flat();

  const sinkEdges: Edge[] = actors.map(actor => ({
    id: `sink-${actor}`,
    source: actor,
    target: `sink-${actor}`,
    data: { label: actor },
  }));

  const messageEdges: MessageEdge[] = messages.map((message, index) => ({
    id: `${message.sender}-${message.receiver}-${index}`,
    source: `${message.sender}-${index}`,
    target: `${message.receiver}-${index}`,
    data: { label: message.message },
    type: SequenceEdgeType.MessageEdge,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'var(--primary)',
      width: 20,
      height: 20,
    },
  }));

  return (
    <Graph
      nodes={[...actorNodes, ...messageNodes, ...sinkNodes]}
      edges={[...sinkEdges, ...messageEdges]}
      height={itemHeight + messages.length * (messageHeight + messageSpacing)}
      // nodeTypes={sequenceDiagramNodeTypes}
      // edgeTypes={sequenceDiagramEdgeTypes}
    />
  );
};
