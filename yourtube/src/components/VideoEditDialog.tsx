import React, { FormEvent, useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import axiosInstance from "@/lib/axiosinstance";
import { uploadImageToCloudinary, getVideoUrl } from "@/lib/cloudinary";

const VideoEditDialog = ({ video, isopen, onclose, onSaved }: any) => {
  const [videotitle, setVideotitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [currentThumb, setCurrentThumb] = useState("");
  const [newThumbFile, setNewThumbFile] = useState<File | null>(null);
  const [newThumbPreview, setNewThumbPreview] = useState("");
  const [isSaving, setisSaving] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (video) {
      setVideotitle(video.videotitle || "");
      setDescription(video.description || "");
      setIsPremium(!!video.isPremium);
      setCurrentThumb(video.thumbnail || "");
      setNewThumbFile(null);
      setNewThumbPreview("");
    }
  }, [video]);

  useEffect(() => {
    return () => {
      if (newThumbPreview) URL.revokeObjectURL(newThumbPreview);
    };
  }, [newThumbPreview]);

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const img = files[0];
    if (!img.type.startsWith("image/")) {
      toast.error("Thumbnail must be an image file.");
      return;
    }
    if (img.size > 5 * 1024 * 1024) {
      toast.error("Thumbnail must be under 5MB.");
      return;
    }
    setNewThumbFile(img);
    setNewThumbPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(img);
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!video || !videotitle.trim()) return;
    setisSaving(true);
    try {
      let thumbnailUrl: string | undefined;
      if (newThumbFile) {
        const { data: sig } = await axiosInstance.post("/video/upload-signature");
        thumbnailUrl = await uploadImageToCloudinary(newThumbFile, sig);
      }
      await axiosInstance.patch(`/video/${video._id}`, {
        videotitle: videotitle.trim(),
        description,
        ...(thumbnailUrl ? { thumbnail: thumbnailUrl } : {}),
        isPremium: String(isPremium),
        uploader: video.uploader,
      });
      toast.success("Changes saved");
      onSaved?.();
      onclose();
    } catch (error: any) {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          "Could not save changes. Please try again."
      );
    } finally {
      setisSaving(false);
    }
  };

  const shownThumb = newThumbPreview || currentThumb;

  return (
    <Dialog open={isopen} onOpenChange={onclose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit video</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={videotitle}
              onChange={(e) => setVideotitle(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video"
              disabled={isSaving}
              className="min-h-[80px] max-h-64 max-w-full resize-y [field-sizing:fixed]"
              maxLength={5000}
            />
          </div>
          <div className="space-y-2">
            <Label>Thumbnail</Label>
            <div className="flex items-center gap-3">
              {shownThumb ? (
                <div className="relative w-32 aspect-video rounded-lg overflow-hidden border bg-secondary flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={newThumbPreview || getVideoUrl(currentThumb)}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 aspect-video rounded-lg border border-dashed bg-secondary/50 flex items-center justify-center text-muted-foreground flex-shrink-0">
                  <ImagePlus className="w-5 h-5" />
                </div>
              )}
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => thumbInputRef.current?.click()}
                >
                  <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
                  {shownThumb ? "Change thumbnail" : "Add thumbnail"}
                </Button>
                {(newThumbFile || currentThumb) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => {
                      setNewThumbFile(null);
                      setNewThumbPreview((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return "";
                      });
                      setCurrentThumb("");
                      if (thumbInputRef.current) thumbInputRef.current.value = "";
                    }}
                  >
                    Remove thumbnail
                  </Button>
                )}
                <input
                  type="file"
                  ref={thumbInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleThumbChange}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-premium"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              disabled={isSaving}
              className="w-4 h-4 accent-red-600"
            />
            <Label htmlFor="edit-premium" className="cursor-pointer">
              Premium content (requires a paid plan to watch)
            </Label>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button type="button" variant="outline" onClick={onclose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !videotitle.trim()}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VideoEditDialog;
