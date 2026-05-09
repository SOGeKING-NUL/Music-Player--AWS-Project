import { useCallback, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Controls,
  ReactFlowProvider,
  type ReactFlowInstance
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { MainButtonNode } from './MainButtonNode';
import { ArtistPoolNode } from './ArtistPoolNode';
import { AddArtistNode } from './AddArtistNode';
import { ArtistAlbumsNode } from './ArtistAlbumsNode';
import { AlbumSongsNode } from './AlbumSongsNode';
import { CreateAlbumNode } from './CreateAlbumNode';

const nodeTypes = {
  mainButton: MainButtonNode,
  artistPool: ArtistPoolNode,
  addArtist: AddArtistNode,
  artistAlbums: ArtistAlbumsNode,
  albumSongs: AlbumSongsNode,
  createAlbum: CreateAlbumNode,
};

const defaultEdgeOptions = {
  type: 'default',
  style: {
    stroke: '#9ca3af',
    strokeWidth: 2,
    strokeDasharray: '6, 4',
  },
};

const INITIAL_NODES: Node[] = [
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
    position: { x: 500, y: 100 },
    data: {},
    draggable: true,
    selectable: false,
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: 'e-main-pool',
    source: 'main-btn',
    sourceHandle: 'to-pool',
    target: 'artist-pool',
    selectable: false,
  },
];

const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || "https://music-player-2026.s3.ap-south-1.amazonaws.com";

function CanvasContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const focusNode = useCallback((x: number, y: number) => {
    if (rfInstance) {
      // Offset slightly to account for node width/height and keep it centered
      rfInstance.setCenter(x + 200, y + 200, { zoom: 1, duration: 800 });
    }
  }, [rfInstance]);

  const removeNodeAndChildren = useCallback((nodeIdToRemove: string) => {
    let idsToRemove = [nodeIdToRemove];
    if (nodeIdToRemove === 'artist-albums') {
      idsToRemove.push('album-songs');
      idsToRemove.push('create-album');
    }
    
    setNodes((nds) => nds.filter((n) => !idsToRemove.includes(n.id)));
    setEdges((eds) => eds.filter((e) => !idsToRemove.includes(e.source) && !idsToRemove.includes(e.target)));
  }, [setNodes, setEdges]);

  // Main Button -> Add Artist Form Node
  const onMainButtonClick = useCallback(() => {
    let focusPos = { x: 50, y: -100 };
    setNodes((nds) => {
      if (nds.some(n => n.id === 'add-artist')) {
        const existing = nds.find(n => n.id === 'add-artist');
        if (existing) focusNode(existing.position.x, existing.position.y);
        return nds;
      }
      
      const mainBtnNode = nds.find(n => n.id === 'main-btn');
      // Position Add Artist strictly above and slightly right to avoid overlapping pool
      const pos = mainBtnNode ? { x: mainBtnNode.position.x + 50, y: mainBtnNode.position.y - 450 } : focusPos;
      focusPos = pos;
      
      return [...nds, {
        id: 'add-artist',
        type: 'addArtist',
        position: pos,
        data: {
          onClose: () => removeNodeAndChildren('add-artist'),
          onSuccess: () => setRefreshCounter(c => c + 1)
        },
        draggable: true,
      }];
    });

    setEdges((eds) => {
      if (eds.some(e => e.id === 'e-main-add')) return eds;
      return [...eds, { id: 'e-main-add', source: 'main-btn', sourceHandle: 'to-add-artist', target: 'add-artist' }];
    });

    // Animate camera to the new node
    setTimeout(() => focusNode(focusPos.x, focusPos.y), 50);
  }, [setNodes, setEdges, removeNodeAndChildren, focusNode]);

  // Artist Bubble -> Artist Albums Node
  const onArtistSelect = useCallback((artist: any, _sourceNodeId: string) => {
    const formattedArtist = {
      ...artist,
      image: artist.s3_cover_key ? `${S3_BASE_URL}/${artist.s3_cover_key}` : `https://i.pravatar.cc/150?u=${artist.id}`
    };

    let focusPos = { x: 950, y: 200 };
    
    setNodes((nds) => {
      const filtered = nds.filter(n => n.id !== 'artist-albums' && n.id !== 'album-songs');
      const poolNode = filtered.find(n => n.id === 'artist-pool');
      // Position Albums node to the right of the pool
      const pos = poolNode ? { x: poolNode.position.x + 600, y: poolNode.position.y + 100 } : focusPos;
      focusPos = pos;

      return [...filtered, {
        id: 'artist-albums',
        type: 'artistAlbums',
        position: pos,
        data: {
          artist: formattedArtist,
          onClose: () => removeNodeAndChildren('artist-albums'),
          onAlbumSelect: (album: any) => onAlbumSelect(album, formattedArtist.id, formattedArtist.name),
          onNewAlbumClick: () => onNewAlbumClick(formattedArtist.id, formattedArtist.name)
        },
        draggable: true,
      }];
    });

    setEdges((eds) => {
      const filtered = eds.filter(e => e.id !== 'e-pool-albums' && e.id !== 'e-albums-songs');
      return [...filtered, { id: 'e-pool-albums', source: 'artist-pool', target: 'artist-albums' }];
    });

    setTimeout(() => focusNode(focusPos.x, focusPos.y), 50);
  }, [setNodes, setEdges, removeNodeAndChildren, focusNode]);

  // Album -> Album Songs Node
  const onAlbumSelect = useCallback((album: any, artistId: string, artistName: string) => {
    let focusPos = { x: 1450, y: 200 };

    setNodes((nds) => nds.map((n) => {
      if (n.id === 'artist-albums') {
        n.data = { ...n.data, selectedAlbumId: album.id };
      }
      return n;
    }));

    setNodes((nds) => {
      const filtered = nds.filter(n => n.id !== 'album-songs');
      const albumsNode = filtered.find(n => n.id === 'artist-albums');
      // Stack songs node strictly to the right of albums
      const pos = albumsNode ? { x: albumsNode.position.x + 500, y: albumsNode.position.y } : focusPos;
      focusPos = pos;

      return [...filtered, {
        id: 'album-songs',
        type: 'albumSongs',
        position: pos,
        data: {
          album,
          artistId,
          artistName,
          onClose: () => removeNodeAndChildren('album-songs')
        },
        draggable: true,
      }];
    });

    setEdges((eds) => {
      const filtered = eds.filter(e => e.id !== 'e-albums-songs');
      return [...filtered, { id: 'e-albums-songs', source: 'artist-albums', target: 'album-songs' }];
    });

    setTimeout(() => focusNode(focusPos.x, focusPos.y), 50);
  }, [setNodes, setEdges, removeNodeAndChildren, focusNode]);

  // Artist Albums -> Create Album Node (Batch Upload)
  const onNewAlbumClick = useCallback((artistId: string, artistName: string) => {
    let focusPos = { x: 1450, y: -200 };

    setNodes((nds) => {
      const filtered = nds.filter(n => n.id !== 'create-album' && n.id !== 'album-songs');
      const albumsNode = filtered.find(n => n.id === 'artist-albums');
      
      // Position Create Album node above the songs location
      const pos = albumsNode ? { x: albumsNode.position.x + 500, y: albumsNode.position.y - 300 } : focusPos;
      focusPos = pos;

      return [...filtered, {
        id: 'create-album',
        type: 'createAlbum',
        position: pos,
        data: {
          artistId,
          artistName,
          onClose: () => removeNodeAndChildren('create-album'),
          onAlbumCreated: (createdAlbum: { id: string; title: string; release_year?: number }) => {
            // Re-trigger artist selection to refresh the albums list
            removeNodeAndChildren('create-album');
            // Hacky way to trick the pool node to refresh, or just refresh albums manually.
            // But since ArtistAlbumsNode fetches on mount & artist ID change, we should probably 
            // tell ArtistAlbumsNode to refresh via a prop update.
            setNodes(current => current.map(n => {
              if (n.id === 'artist-albums') {
                return { ...n, data: { ...n.data, refreshKey: Date.now() } };
              }
              return n;
            }));

            // Open the album tracks tab immediately for the newly created album.
            onAlbumSelect(createdAlbum, artistId, artistName);
          }
        },
        draggable: true,
      }];
    });

    setEdges((eds) => {
      const filtered = eds.filter(e => e.id !== 'e-albums-create' && e.id !== 'e-albums-songs');
      return [...filtered, { id: 'e-albums-create', source: 'artist-albums', target: 'create-album' }];
    });

    setTimeout(() => focusNode(focusPos.x, focusPos.y), 50);
  }, [setNodes, setEdges, removeNodeAndChildren, focusNode]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    // Also focus if the user clicks an existing node naturally
    focusNode(node.position.x, node.position.y);
    if (node.id === 'main-btn') {
      onMainButtonClick();
    }
  }, [onMainButtonClick, focusNode]);

  const nodesWithData = nodes.map(node => {
    if (node.id === 'main-btn') return { ...node, data: { ...node.data, onClick: onMainButtonClick } };
    if (node.id === 'artist-pool') return { ...node, data: { ...node.data, refreshKey: refreshCounter, onArtistSelect } };
    return node;
  });

  return (
    <ReactFlow
      nodes={nodesWithData}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onInit={setRfInstance}
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
    >
      <Controls showInteractive={false} className="bg-white shadow-xl border-gray-200" />
    </ReactFlow>
  );
}

export function InfiniteCanvas() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <ReactFlowProvider>
        <CanvasContent />
      </ReactFlowProvider>
    </div>
  );
}
