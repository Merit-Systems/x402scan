import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ActorNode as ActorNodeType } from './types';
import { Card } from '@/components/ui/card';

export const ActorNode: React.FC<NodeProps<ActorNodeType>> = ({ data }) => {
  return (
    <>
      <Card className="flex items-center gap-2 p-2 justify-center h-full relative">
        <span className="text-lg font-bold font-mono">{data.name}</span>
      </Card>
    </>
  );
};
