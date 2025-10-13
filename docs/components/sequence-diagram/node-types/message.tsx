import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { MessageNode as MessageNodeType } from './types';

export const MessageNode: React.FC<NodeProps<MessageNodeType>> = ({ data }) => {
  return (
    <>
      <div />
      <Handle
        type={data.isSource ? 'source' : 'target'}
        position={data.isSource ? Position.Right : Position.Left}
      />
    </>
  );
};
