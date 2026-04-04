import { useState, memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { api, uploadToS3 } from "@/services/api";
import { Upload, X, Loader2 } from "lucide-react";

interface AddArtistNodeProps {
  id: string;
  data: {
    onClose: (id: string) => void;
    onSuccess: () => void;
  };
}

function AddArtistNodeComponent({ id, data }: AddArtistNodeProps) {
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("File must be an image");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Artist name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      let s3CoverKey = undefined;
      
      // Generate artist UUID once - this will be used for both S3 and database
      const artistId = crypto.randomUUID();

      if (image) {
        const { data: presignedData } = await api.getArtistImagePresignedUrl(artistId, image.type);
        const uploadUrl = presignedData.uploadUrl;
        s3CoverKey = presignedData.key || presignedData.s3Key;
        await uploadToS3(uploadUrl, image);
      }

      await api.addArtist({ id: artistId, name, s3CoverKey });
      
      data.onSuccess();
      data.onClose(id); // Close the node automatically on success

    } catch (err: any) {
      console.error("Error adding artist:", err);
      setError(err.response?.data?.error || "Failed to add artist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-[380px] bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 relative">
      {/* Blurred Background Image Layer */}
      <div 
        className="absolute inset-x-0 top-0 h-[300px] pointer-events-none"
        style={{
          backgroundImage: 'url(/node_bg.png)',
          backgroundSize: '100% auto',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(1.2px)', // ~5% lightweight blur
          opacity: 0.95,
        }}
      />

      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-black !border-[3px] !border-black shadow-sm z-20" />
      <Handle type="source" position={Position.Right} className="!hidden" />

      <div className="flex items-start justify-between p-6 pt-24 border-0 relative z-10">
        <h3 className="font-extrabold text-2xl tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Add New Artist</h3>
        <button 
          onClick={() => data.onClose(id)}
          className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 transition-all text-white backdrop-blur-md -mt-2 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 pt-12 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Artist Name *</label>
            <Input
              id="artistName"
              placeholder="Enter artist name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="nodrag nopan bg-gray-50/50 shadow-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Artist Image (optional)</label>
            <div className={`relative group flex items-center justify-center w-full h-40 rounded-2xl bg-gray-50/80 hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden backdrop-blur-sm ${imagePreview ? 'border-0' : 'border-2 border-dashed border-gray-200 shadow-sm'}`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 nodrag nopan"
              />
              
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-full shadow-md z-0" />
                  <div className="absolute top-2 right-2 z-20">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImage(null); setImagePreview(null); }}
                      className="p-1.5 bg-white/90 rounded-full shadow-sm hover:scale-110 transition-transform backdrop-blur-sm"
                    >
                      <X className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-gray-600 transition-colors p-4 text-center">
                  <Upload className="w-6 h-6 mb-2" />
                  <p className="text-sm font-medium">Click to upload image</p>
                  <p className="text-xs mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
            {error && <p className="text-red-500 text-xs font-semibold mt-2 px-2 py-1 bg-red-50 rounded-md border border-red-100 shadow-sm">{error}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 flex items-center justify-center bg-black text-white rounded-xl font-bold text-sm shadow-md hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none nodrag nopan"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Artist"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const AddArtistNode = memo(AddArtistNodeComponent);
