import { useState, useRef, memo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Handle, Position } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { api, uploadToS3 } from "@/services/api";
import { X, Upload, Loader2, GripVertical, CheckCircle2, Plus, ImagePlus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CreateAlbumNodeProps {
  id: string;
  data: {
    artistId: string;
    artistName: string;
    onClose: (id: string) => void;
    onAlbumCreated: (album: { id: string; title: string; release_year?: number; genre?: string }) => void;
  };
}

interface TrackItem {
  id: string;
  file: File;
  title: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

function CreateAlbumNodeComponent({ id, data }: CreateAlbumNodeProps) {
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumYear, setAlbumYear] = useState<number | "">("");
  const [albumGenre, setAlbumGenre] = useState("");
  
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    files.sort((a, b) => a.name.localeCompare(b.name));

    const newTracks: TrackItem[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      title: file.name,
      status: "pending"
    }));

    setTracks(prev => [...prev, ...newTracks]);
    e.target.value = "";
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
    e.target.value = "";
  };

  const removeTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const updateTrackTitle = useCallback((trackId: string, newTitle: string) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, title: newTitle } : t));
  }, []);

  // Activation distance prevents accidental drags when clicking inputs
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      setTracks((items) => {
        const oldIndex = items.findIndex(t => t.id === active.id);
        const newIndex = items.findIndex(t => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const activeTrack = activeId ? tracks.find(t => t.id === activeId) : null;

  const handleUploadAlbum = async () => {
    if (!albumTitle.trim()) {
      setGlobalError("Album title is required.");
      return;
    }
    if (tracks.length === 0) {
      setGlobalError("Please add at least one track.");
      return;
    }

    setIsUploading(true);
    setGlobalError(null);

    // Generate album ID once in frontend - this will be used for both S3 and database
    const albumId = crypto.randomUUID();
    let createdAlbumId: string | null = null;
    let createdAlbum:
      | { id: string; title: string; release_year?: number; genre?: string }
      | null = null;

    try {
      const albumRes = await api.addAlbum({
        id: albumId,
        title: albumTitle,
        artistId: data.artistId,
        releaseYear: albumYear ? Number(albumYear) : undefined,
        genre: albumGenre.trim() || undefined
      });
      createdAlbumId = albumRes.data.albumId || albumRes.data.album?.id;
      if (createdAlbumId) {
        createdAlbum = {
          id: createdAlbumId,
          title: albumTitle.trim(),
          release_year: albumYear ? Number(albumYear) : undefined,
          genre: albumGenre.trim() || undefined
        };
      }

      if (coverFile && createdAlbumId) {
        try {
          const { data: presignedData } = await api.getAlbumCoverPresignedUrl(data.artistId, createdAlbumId, coverFile.type);
          await uploadToS3(presignedData.uploadUrl, coverFile);
          await api.confirmAlbumCoverUpload(data.artistId, createdAlbumId, presignedData.key || presignedData.s3Key);
        } catch (err) {
          console.error("Failed to upload cover:", err);
        }
      }

      let failedTrackCount = 0;
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        
        setTracks(prev => prev.map(t => t.id === track.id ? { ...t, status: "uploading", error: undefined } : t));

        try {
          const songId = crypto.randomUUID();
          const { data: presignedData } = await api.getSongPresignedUrl({
            artistId: data.artistId,
            albumId: createdAlbumId!,
            songId,
            trackNumber: i + 1,
            fileType: track.file.type,
          });
          
          await uploadToS3(presignedData.uploadUrl, track.file);
          
          await api.confirmSongUpload({
            albumId: createdAlbumId!,
            artistId: data.artistId,
            title: track.title,
            trackNumber: i + 1,
            s3AudioKey: presignedData.key || presignedData.s3Key
          });

          setTracks(prev => prev.map(t => t.id === track.id ? { ...t, status: "done" } : t));
        } catch (err: any) {
          console.error(`Failed to upload track ${track.title}:`, err);
          failedTrackCount += 1;
          setTracks(prev => prev.map(t => t.id === track.id ? { ...t, status: "error", error: err.message || "Upload failed" } : t));
        }
      }

      if (failedTrackCount > 0 || !createdAlbumId || !createdAlbum) {
        setGlobalError(
          failedTrackCount > 0
            ? `Uploaded album, but ${failedTrackCount} track(s) failed to upload.`
            : "Uploaded album, but could not finalize songs upload."
        );
        setIsUploading(false);
        return;
      }

      setIsUploading(false);
      const albumToOpen = createdAlbum!;
      setTimeout(() => {
        data.onAlbumCreated(albumToOpen);
        data.onClose(id);
      }, 1500);

    } catch (err: any) {
      console.error("Failed to create album flow:", err);
      setGlobalError(err.message || "Failed to create album. Please try again.");
      setIsUploading(false);
    }
  };

  const overallProgress = tracks.length > 0 
    ? Math.round((tracks.filter(t => t.status === "done").length / tracks.length) * 100)
    : 0;

  return (
    <div className="w-[450px] bg-white border border-gray-200 rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 relative group/node">
      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-black !border-[3px] !border-black" />
      
      {!isUploading && (
        <button 
          onClick={() => data.onClose(id)}
          className="absolute top-5 right-5 z-50 p-2 rounded-full bg-white/80 hover:bg-neutral-100 backdrop-blur-sm transition-colors text-neutral-400 hover:text-black nodrag opacity-0 group-hover/node:opacity-100 shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="p-8 pb-4 flex flex-col items-center">
        <input type="file" accept="image/*" ref={coverInputRef} onChange={handleCoverSelect} className="hidden" disabled={isUploading} />
        
        <div 
          onClick={() => !isUploading && coverInputRef.current?.click()}
          className="w-48 h-48 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 cursor-pointer relative group flex flex-col items-center justify-center transition-all hover:border-neutral-300 shadow-sm nodrag"
        >
          {coverPreview ? (
            <>
              <img src={coverPreview} className="w-full h-full object-cover" alt="Cover preview" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImagePlus className="w-8 h-8 text-white" />
              </div>
            </>
          ) : (
            <div className="text-neutral-400 group-hover:text-black transition-colors flex flex-col items-center">
              <ImagePlus className="w-8 h-8 mb-2 stroke-[1.5]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Add Cover</span>
            </div>
          )}
        </div>

        <div className="w-full mt-6 space-y-2 nodrag">
          <Input 
            placeholder="Album Title" 
            value={albumTitle} 
            onChange={e => setAlbumTitle(e.target.value)} 
            disabled={isUploading}
            className="text-2xl font-bold text-center border-transparent hover:border-neutral-200 focus-visible:ring-1 focus-visible:ring-neutral-300 bg-transparent hover:bg-neutral-50 px-2 h-12 shadow-none rounded-lg font-serif tracking-tight"
          />
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-neutral-500 font-medium tracking-wide w-full">
            <span>{data.artistName}</span>
            <span>•</span>
            <Input 
               placeholder="YYYY" 
               type="number"
               value={albumYear} 
               onChange={e => setAlbumYear(Number(e.target.value) || "")} 
               disabled={isUploading}
               className="w-16 h-7 text-center text-sm border border-neutral-200 focus-visible:ring-1 focus-visible:ring-neutral-300 bg-transparent hover:bg-neutral-50 px-1 shadow-none rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span>•</span>
            <select
               value={albumGenre} 
               onChange={e => setAlbumGenre(e.target.value)} 
               disabled={isUploading}
               className="w-32 h-7 text-center text-sm border border-neutral-200 focus-visible:ring-1 focus-visible:ring-neutral-300 bg-transparent hover:bg-neutral-50 px-1 shadow-none rounded-md outline-none appearance-none cursor-pointer"
            >
              <option value="" disabled>Genre</option>
              <option value="Pop">Pop</option>
              <option value="Hip-Hop/Rap">Hip-Hop/Rap</option>
              <option value="R&B/Soul">R&B/Soul</option>
              <option value="Electronic">Electronic</option>
              <option value="Rock">Rock</option>
              <option value="Alternative">Alternative</option>
              <option value="Indie">Indie</option>
              <option value="Country">Country</option>
              <option value="Folk">Folk</option>
              <option value="Classical">Classical</option>
              <option value="Jazz">Jazz</option>
              <option value="Blues">Blues</option>
              <option value="Latin">Latin</option>
              <option value="K-Pop">K-Pop</option>
              <option value="African">African</option>
              <option value="Reggae">Reggae</option>
              <option value="Dance">Dance</option>
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 nodrag nowheel">
        <div className="space-y-4">

          {tracks.length === 0 && (
            <div className="relative group flex items-center justify-center w-full min-h-[100px] border-2 border-dashed border-neutral-200 rounded-2xl bg-transparent hover:bg-neutral-50/50 transition-colors cursor-pointer overflow-hidden p-6 mx-auto">
              <input
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFilesSelect}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
              />
              <div className="flex flex-col items-center justify-center text-neutral-400 group-hover:text-black transition-colors text-center pointer-events-none">
                <Upload className="w-6 h-6 mb-2 stroke-[1.5]" />
                <p className="text-sm font-semibold">Click or drag tracks here</p>
              </div>
            </div>
          )}

          {tracks.length > 0 && (
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2 nodrag nowheel">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  {tracks.length} Track{tracks.length !== 1 ? 's' : ''} Added
                </label>
              </div>
              
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext 
                  items={tracks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {tracks.map((track, i) => (
                      <SortableTrackItem
                        key={track.id}
                        track={track}
                        index={i}
                        isUploading={isUploading}
                        updateTrackTitle={updateTrackTitle}
                        removeTrack={removeTrack}
                      />
                    ))}
                  </div>
                </SortableContext>
                
                {/* Portal the overlay to document.body so React Flow transforms don't affect it */}
                {createPortal(
                  <DragOverlay dropAnimation={null}>
                    {activeTrack ? (
                      <TrackOverlayItem track={activeTrack} index={tracks.findIndex(t => t.id === activeTrack.id)} />
                    ) : null}
                  </DragOverlay>,
                  document.body
                )}
              </DndContext>
            </div>
          )}

          {globalError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold text-center">
              {globalError}
            </div>
          )}

          <div className="pt-2">
            {isUploading && (
              <div className="w-full bg-neutral-100 h-1.5 rounded-full mb-3 overflow-hidden">
                <div className="bg-black h-full transition-all duration-300" style={{ width: `${overallProgress}%` }} />
              </div>
            )}
            
            <input
              type="file"
              accept="audio/*"
              multiple
              ref={fileInputRef}
              onChange={handleFilesSelect}
              disabled={isUploading}
              className="hidden"
            />

            <div className="flex gap-2 w-full">
              {tracks.length > 0 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-12 h-12 shrink-0 flex items-center justify-center bg-white border border-neutral-200 text-black hover:bg-neutral-50 hover:border-neutral-300 rounded-full shadow-sm transition-all disabled:opacity-50 nodrag"
                  title="Add more tracks"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={handleUploadAlbum}
                disabled={isUploading || tracks.length === 0 || !albumTitle.trim()}
                className="flex-1 h-12 flex items-center justify-center bg-black text-white rounded-full font-bold text-sm shadow-md hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:pointer-events-none nodrag"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading Album ({tracks.filter(t => t.status === "done").length}/{tracks.length})...
                  </>
                ) : (
                  "Upload Album"
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export const CreateAlbumNode = memo(CreateAlbumNodeComponent);

/* ─── Sortable Track Row (in-place, becomes invisible when dragged) ─── */
const SortableTrackItem = memo(function SortableTrackItem({
  track,
  index,
  isUploading,
  updateTrackTitle,
  removeTrack,
}: {
  track: TrackItem;
  index: number;
  isUploading: boolean;
  updateTrackTitle: (id: string, newTitle: string) => void;
  removeTrack: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: track.id, disabled: isUploading });

  // Use CSS.Translate (not CSS.Transform) to avoid conflicting with React Flow's scale
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 999 : 'auto',
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 py-2 px-2 border rounded-xl bg-white group
        ${track.status === 'error' ? 'border-red-100 bg-red-50/50' : track.status === 'done' ? 'border-green-100 bg-green-50/20' : 'border-neutral-100 hover:border-neutral-200'}`}
    >
      {/* Grip Handle / Status */}
      <div className="flex items-center w-8 shrink-0 justify-center">
        {track.status === 'uploading' ? (
          <Loader2 className="w-4 h-4 text-black animate-spin" />
        ) : track.status === 'done' ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <>
            <span className="group-hover:hidden text-xs font-mono font-bold text-neutral-400">
              {String(index + 1).padStart(2, '0')}
            </span>
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="hidden group-hover:flex w-6 h-6 items-center justify-center cursor-grab active:cursor-grabbing text-neutral-300 hover:text-black nodrag"
              style={{ touchAction: 'none' }}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Input
          value={track.title}
          onChange={(e) => updateTrackTitle(track.id, e.target.value)}
          disabled={isUploading}
          placeholder="Enter track name..."
          className="h-9 text-sm font-medium border-neutral-200 hover:border-neutral-300 focus-visible:ring-1 focus-visible:ring-neutral-300 bg-neutral-50 hover:bg-white px-3 rounded-lg shadow-sm transition-colors"
          title={track.title}
        />
      </div>

      <div className="flex items-center shrink-0">
        <button 
          type="button"
          disabled={isUploading}
          onClick={() => removeTrack(track.id)}
          className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 nodrag"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

/* ─── Overlay Clone (rendered at document.body, unaffected by React Flow transforms) ─── */
function TrackOverlayItem({ track }: { track: TrackItem; index: number }) {
  return (
    <div
      className="flex items-center gap-2 py-2 px-2 border border-neutral-200 rounded-xl bg-white shadow-2xl ring-2 ring-black/10 w-[460px]"
      style={{ cursor: 'grabbing', touchAction: 'none' }}
    >
      <div className="flex items-center w-8 shrink-0 justify-center">
        <GripVertical className="w-4 h-4 text-black" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-9 text-sm font-medium px-3 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center truncate">
          {track.title}
        </div>
      </div>
      <div className="flex items-center shrink-0 w-8" />
    </div>
  );
}
