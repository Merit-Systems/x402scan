import { Background, ReactFlow } from '@xyflow/react';

import type { Edge, EdgeTypes, Node, NodeTypes, Viewport } from '@xyflow/react';

import '@xyflow/react/dist/style.css';

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
  return (
    <div
      className="w-full border rounded-md shadow-sm"
      style={{ height: `${height}px` }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        height={height}
        width={width}
        fitView
        proOptions={{ hideAttribution: true }}
        panOnScroll={false}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesFocusable={false}
        edgesFocusable={false}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitViewOptions={{
          padding: 0.05,
        }}
        defaultViewport={defaultViewport}
      >
        <Background />
      </ReactFlow>
    </div>
  );
};
