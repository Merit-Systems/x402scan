import { BaseEdge, EdgeLabelRenderer, getStraightPath } from '@xyflow/react';

import type { EdgeProps } from '@xyflow/react';
import type { MessageEdge as MessageEdgeType } from './types';

export const MessageEdge: React.FC<EdgeProps<MessageEdgeType>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  ...rest
}) => {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const { label, labelStyle, markerStart, markerEnd } = rest;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        label={label}
        labelStyle={labelStyle}
        markerStart={markerStart}
        markerEnd={markerEnd}
        className="stroke-primary!"
      />
      <EdgeLabelRenderer>
        <span
          className="text-xs font-bold bg-card rounded-md px-2 py-1 border font-mono flex gap-2"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          <span className="border border-primary rounded-full size-4 text-primary flex items-center justify-center">
            {data?.index}
          </span>
          <span>{data?.label}</span>
        </span>
      </EdgeLabelRenderer>
    </>
  );
};
