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
    sourceX: sourceX,
    sourceY,
    targetX: sourceX > targetX ? targetX + 5 : targetX,
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
      />
      <EdgeLabelRenderer>
        <span
          className="text-sm font-medium bg-card rounded-md px-2 py-1 border"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {data?.label}
        </span>
      </EdgeLabelRenderer>
    </>
  );
};
