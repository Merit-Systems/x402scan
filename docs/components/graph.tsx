'use client';

import { Background, ReactFlow } from '@xyflow/react';

import type { Edge, EdgeTypes, Node, NodeTypes, Viewport } from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Props {
  nodes?: Node[];
  edges?: Edge[];
  height?: number;
  width?: number;
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  defaultViewport?: Viewport;
}

export const Graph = ({
  nodes = [],
  edges = [],
  height = 300,
  width,
  nodeTypes,
  edgeTypes,
  defaultViewport,
}: Props) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card
      className="w-full relative"
      style={{
        aspectRatio: width !== undefined ? width / height : undefined,
      }}
    >
      {!isMounted && (
        <div className="w-full h-full flex items-center justify-center absolute inset-0 bg-background z-10">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        height={height}
        defaultViewport={defaultViewport}
        proOptions={{ hideAttribution: true }}
        panOnDrag={true}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesFocusable={false}
        edgesFocusable={false}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{
          padding: 0.05,
        }}
        minZoom={0.1}
      >
        <Background />
      </ReactFlow>
    </Card>
  );
};
