import { BaseEdge, getStraightPath } from '@xyflow/react';

import type { EdgeProps } from '@xyflow/react';
import type { SinkEdge as SinkEdgeType } from './types';

export const SinkEdge: React.FC<EdgeProps<SinkEdgeType>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  ...rest
}) => {
  const [edgePath] = getStraightPath({
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
        className="stroke-border!"
      />
    </>
  );
};
