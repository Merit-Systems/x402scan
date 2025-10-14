import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ActorNode as ActorNodeType } from './types';
import { Card } from '@/components/ui/card';

export const ActorNode: React.FC<NodeProps<ActorNodeType>> = ({ data }) => {
  return (
    <>
      <Card className="flex items-center gap-2 p-2 justify-center h-full relative">
        <div className="flex items-center gap-2 bg-primary rounded-full p-1.5 size-7">
          <data.Icon className="size-full text-white" />
        </div>
        <span className="text-lg font-bold font-mono">{data.name}</span>
        <Handle
          type="source"
          position={Position.Bottom}
          className="-translate-y-1/2 absolute opacity-0 w-0 h-0"
        />
      </Card>
    </>
  );
};
