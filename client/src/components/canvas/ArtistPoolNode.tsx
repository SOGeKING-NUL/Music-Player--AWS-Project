import { memo, useRef, useState, useCallback, useMemo, createRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ArtistDetailsModal } from '../ArtistDetailsModal';
import { api } from '@/services/api';

// ─── Constants ───
const POOL_SIZE = 520;
const PAD = 20;
const SPOTLIGHT_SCALE = 1.22;
const INFLUENCE_RADIUS = 100;
const PUSH_STRENGTH = 18;
const S3_BASE_URL = "https://music-player-2026.s3.ap-south-1.amazonaws.com";

// ─── SELF-SHRINKING LAYOUT: guarantees ZERO overlap ───
function layoutBubbles(count: number): { positions: { x: number; y: number }[]; bubbleSize: number } {
  if (count === 0) return { positions: [], bubbleSize: 60 };

  const usable = POOL_SIZE - PAD * 2;
  let size = Math.min(90, Math.sqrt((usable * usable * 0.38) / (count * Math.PI)) * 2);
  size = Math.max(36, size);

  for (let sizeAttempt = 0; sizeAttempt < 20; sizeAttempt++) {
    const result = tryPlace(count, size);
    if (result) return { positions: result, bubbleSize: Math.round(size) };
    size -= 4;
    if (size < 20) break;
  }

  const positions: { x: number; y: number }[] = [];
  const center = POOL_SIZE / 2;
  for (let i = 0; i < count; i++) {
    const a = i * 2.4;
    const r = Math.sqrt(i + 1) * 14;
    positions.push({ x: center + Math.cos(a) * r, y: center + Math.sin(a) * r });
  }
  return { positions, bubbleSize: 20 };
}

function tryPlace(count: number, bubbleSize: number): { x: number; y: number }[] | null {
  const gap = 10;
  const minDist = bubbleSize + gap;
  const center = POOL_SIZE / 2;
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const randCentered = () => (rand() + rand()) / 2;
  const spreadRadius = (POOL_SIZE - PAD * 2 - bubbleSize) / 2;
  const positions: { x: number; y: number }[] = [];

  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 600; attempt++) {
      const angle = rand() * Math.PI * 2;
      const dist = randCentered() * spreadRadius;
      const x = center + Math.cos(angle) * dist;
      const y = center + Math.sin(angle) * dist;
      const half = bubbleSize / 2 + 4;
      if (x < half || x > POOL_SIZE - half || y < half || y > POOL_SIZE - half) continue;
      let ok = true;
      for (const p of positions) {
        const dx = x - p.x;
        const dy = y - p.y;
        if (dx * dx + dy * dy < minDist * minDist) { ok = false; break; }
      }
      if (ok) {
        positions.push({ x, y });
        placed = true;
        break;
      }
    }
    if (!placed) return null;
  }
  return positions;
}

interface BubbleState {
  scale: number;
  dx: number;
  dy: number;
}

const DEFAULT_STATE: BubbleState = { scale: 1, dx: 0, dy: 0 };

interface Artist {
  id: string;
  name: string;
  s3_cover_key?: string | null;
}

interface ArtistPoolNodeProps {
  data: {
    refreshKey?: number;
  };
}

function ArtistPoolNodeComponent({ data }: ArtistPoolNodeProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  const fetchArtists = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.getArtists();
      setArtists(data.artists || []);
      setFetchError(null);
    } catch (err) {
      console.error("Error fetching artists:", err);
      setFetchError("Failed to load artists");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists, data.refreshKey]);

  const { positions, bubbleSize } = useMemo(() => layoutBubbles(artists.length), [artists.length]);
  const bubbleRefs = useRef<React.RefObject<HTMLDivElement | null>[]>([]);

  if (bubbleRefs.current.length !== artists.length) {
    bubbleRefs.current = Array.from({ length: artists.length }, () => createRef<HTMLDivElement>());
  }

  const [bubbleStates, setBubbleStates] = useState<BubbleState[]>([]);

  useEffect(() => {
    setBubbleStates(artists.map(() => ({ ...DEFAULT_STATE })));
  }, [artists]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const scaleX = POOL_SIZE / rect.width;
      const scaleY = POOL_SIZE / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const newStates: BubbleState[] = positions.map((pos) => {
        const distX = mx - pos.x;
        const distY = my - pos.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < INFLUENCE_RADIUS) {
          const t = 1 - distance / INFLUENCE_RADIUS;
          const eased = t * t;
          const scale = 1 + eased * (SPOTLIGHT_SCALE - 1);
          let dx = 0, dy = 0;
          if (distance > 5) {
            const pushAmount = eased * PUSH_STRENGTH;
            dx = (-distX / distance) * pushAmount;
            dy = (-distY / distance) * pushAmount;
          }
          return { scale, dx, dy };
        }
        return { scale: 1, dx: 0, dy: 0 };
      });

      setBubbleStates(newStates);
    },
    [positions]
  );

  const handleMouseLeave = useCallback(() => {
    setBubbleStates(artists.map(() => ({ ...DEFAULT_STATE })));
  }, [artists, positions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-white border border-gray-200 rounded-3xl shadow-lg" style={{ width: `${POOL_SIZE}px`, height: `${POOL_SIZE}px` }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div
      className="relative bg-white border border-gray-200 rounded-3xl shadow-lg overflow-visible"
      style={{ width: `${POOL_SIZE}px`, height: `${POOL_SIZE}px` }}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-black !border-2 !border-black" />

      {fetchError ? (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
          <p className="text-red-500 text-sm font-medium">{fetchError}</p>
        </div>
      ) : (
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {artists.map((artist, i) => {
            const { scale, dx, dy } = bubbleStates[i] || DEFAULT_STATE;
            const imageUrl = artist.s3_cover_key 
              ? `${S3_BASE_URL}/${artist.s3_cover_key}`
              : `https://i.pravatar.cc/150?u=${artist.id}`; // Fallback to avatar if no cover

            return (
              <div
                key={artist.id}
                ref={bubbleRefs.current[i]}
                className="absolute rounded-full overflow-hidden cursor-pointer"
                style={{
                  width: `${bubbleSize}px`,
                  height: `${bubbleSize}px`,
                  left: `${positions[i].x - bubbleSize / 2}px`,
                  top: `${positions[i].y - bubbleSize / 2}px`,
                  transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
                  transition: 'transform 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  zIndex: scale > 1.05 ? 10 : 1,
                  boxShadow: '0 0 0 3px white, 0 2px 8px rgba(0,0,0,0.08)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedArtist(artist);
                }}
              >
                <img
                  src={imageUrl}
                  alt={artist.name}
                  className="w-full h-full object-cover rounded-full pointer-events-none"
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Tooltip for empty state */}
      {!isLoading && !fetchError && artists.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
          <p className="text-gray-400 text-sm font-medium">No artists found. Start by adding one!</p>
        </div>
      )}

      <ArtistDetailsModal
        open={!!selectedArtist}
        onOpenChange={(open) => !open && setSelectedArtist(null)}
        artist={selectedArtist ? {
          ...selectedArtist,
          image: selectedArtist.s3_cover_key ? `${S3_BASE_URL}/${selectedArtist.s3_cover_key}` : `https://i.pravatar.cc/150?u=${selectedArtist.id}`
        } : null}
      />
    </div>
  );
}

export const ArtistPoolNode = memo(ArtistPoolNodeComponent);

