import React, { FormEvent, useEffect, useState } from "react";
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
import axiosInstance from "@/lib/axiosinstance";

const VideoEditDialog = ({ video, isopen, onclose, onSaved }: any) => {
  const [videotitle, setVideotitle] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isSaving, setisSaving] = useState(false);

  useEffect(() => {
    if (video) {
      setVideotitle(video.videotitle || "");
      setIsPremium(!!video.isPremium);
    }
  }, [video]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!video || !videotitle.trim()) return;
    setisSaving(true);
    try {
      await axiosInstance.patch(`/video/${video._id}`, {
        videotitle: videotitle.trim(),
        isPremium: String(isPremium),
        uploader: video.uploader,
      });
      onSaved?.();
      onclose();
    } catch (error) {
      console.log(error);
    } finally {
      setisSaving(false);
    }
  };

  return (
    <Dialog open={isopen} onOpenChange={onclose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit video</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={videotitle}
              onChange={(e) => setVideotitle(e.target.value)}
              disabled={isSaving}
            />
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
