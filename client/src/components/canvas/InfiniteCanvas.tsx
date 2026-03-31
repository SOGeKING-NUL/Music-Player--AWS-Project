import { useCallback, useState, useMemo } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { MainButtonNode } from './MainButtonNode';
import { ArtistPoolNode } from './ArtistPoolNode';
import { AddArtistForm } from '../forms/AddArtistForm';

const nodeTypes = {
  mainButton: MainButtonNode,
  artistPool: ArtistPoolNode,
};

const defaultEdgeOptions = {
  type: 'bezier',
  animated: false,
  style: {
    stroke: '#000000', // Pitch black line
    strokeWidth: 3,
  },
};

const initialNodes: Node[] = [
  {
    id: 'main-btn',
    type: 'mainButton',
    position: { x: 50, y: 350 },
    data: {},
    draggable: true,
    selectable: false,
  },
  {
    id: 'artist-pool',
    type: 'artistPool',
    position: { x: 350, y: 100 },
    data: {},
    draggable: true,
    selectable: false,
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e-main-pool',
    source: 'main-btn',
    target: 'artist-pool',
    selectable: false,
  },
];

export function InfiniteCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [isAddArtistOpen, setIsAddArtistOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.id === 'main-btn') {
      setIsAddArtistOpen(true);
    }
  }, []);

  const handleArtistSuccess = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  const nodesWithData = useMemo(() => {
    return nodes.map(node => {
      if (node.id === 'artist-pool') {
        return { ...node, data: { ...node.data, refreshKey: refreshCounter } };
      }
      return node;
    });
  }, [nodes, refreshCounter]);

  return (
    <>
      <ReactFlow
        nodes={nodesWithData}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-gray-50/50"
      />

      <AddArtistForm
        open={isAddArtistOpen}
        onOpenChange={setIsAddArtistOpen}
        onSuccess={handleArtistSuccess}
      />
    </>
  );
}
