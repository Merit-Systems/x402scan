import { Handle, Position } from '@xyflow/react';

import type { NodeProps } from '@xyflow/react';
import type { SinkNode as SinkNodeType } from './types';

export const SinkNode: React.FC<NodeProps<SinkNodeType>> = () => {
  return (
    <>
      <div>
        <Handle
          type="target"
          position={Position.Top}
          className="border-primary! bg-primary/20!"
        />
      </div>
    </>
  );
};
