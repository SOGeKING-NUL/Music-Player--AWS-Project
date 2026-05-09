import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, uploadToS3 } from "@/services/api";
import { Upload, X } from "lucide-react";

interface AddArtistFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (id?: string) => void;
}

export function AddArtistForm({ open, onOpenChange, onSuccess }: AddArtistFormProps) {
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

    setIsSubmitting(true);

    try {
      let s3CoverKey: string | undefined;
      const artistId = crypto.randomUUID();

      if (image) {
        const fileType = image.type;
        const { data } = await api.getArtistImagePresignedUrl(artistId, fileType);
        await uploadToS3(data.uploadUrl, image);
        s3CoverKey = data.s3Key;
      }

      const response = await api.addArtist({
        id: artistId,
        name: name.trim(),
        s3CoverKey,
      });

      setName("");
      setImage(null);
      setImagePreview(null);
      onOpenChange(false);
      onSuccess?.(response.data.artistId);
    } catch (err: any) {
      console.error("Error adding artist. Full error object:", err);
      // If it's an axios error with a response, log the response data for more context
      if (err.response) {
        console.error("Server responded with:", err.response.data);
        console.error("Status code:", err.response.status);
        console.error("Headers:", err.response.headers);
      } else if (err.request) {
        console.error("No response received from server. Request details:", err.request);
        console.error("This might be a CORS issue or the server is down.");
      } else {
        console.error("Error setting up request:", err.message);
      }
      setError(err.response?.data?.error || err.message || "Failed to add artist");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName("");
      setImage(null);
      setImagePreview(null);
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Add New Artist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Artist Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Artist Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter artist name"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Artist Image */}
          <div className="space-y-2">
            <Label htmlFor="image">Artist Image (optional)</Label>
            <div className="flex flex-col gap-4">
              {imagePreview ? (
                <div className="relative w-32 h-32 mx-auto">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Click to upload image</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                </label>
              )}
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ease-out hover:bg-gray-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add Artist"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
