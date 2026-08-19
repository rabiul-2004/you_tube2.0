import { Check, FileVideo, Upload, X } from "lucide-react";
import React, { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { uploadToCloudinary } from "@/lib/cloudinary";

const VideoUploader = ({ channelId, channelName }: any) => {
  const { user, emailVerified } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const handlefilechange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("video/")) {
        toast.error("Please upload a valid video file.");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size exceeds 100MB limit.");
        return;
      }
      setVideoFile(file);
      const filename = file.name;
      if (!videoTitle) {
        setVideoTitle(filename);
      }
      const url = URL.createObjectURL(file);
      const el = document.createElement("video");
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        setVideoDuration(Math.round(el.duration));
        URL.revokeObjectURL(url);
      };
      el.src = url;
    }
  };
  const resetForm = () => {
    setVideoFile(null);
    setVideoTitle("");
    setIsPremium(false);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    setVideoDuration(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const cancelUpload = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    toast.info("Upload cancelled");
  };
  const handleUpload = async () => {
    if (!videoFile || !videoTitle.trim()) {
      toast.error("Please provide file and title");
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const { data: sig } = await axiosInstance.post("/video/upload-signature");
      setUploadProgress(10);

      const cloudinaryUrl = await uploadToCloudinary(
        videoFile,
        sig,
        (pct) => setUploadProgress(10 + Math.round(pct * 0.8))
      );
      setUploadProgress(90);

      await axiosInstance.post(
        "/video/upload",
        {
          videotitle: videoTitle,
          videochanel: channelName,
          uploader: channelId,
          isPremium: String(isPremium),
          filepath: cloudinaryUrl,
          filename: videoFile.name,
          filetype: videoFile.type,
          filesize: String(videoFile.size),
          duration: String(videoDuration),
        },
        { signal: controller.signal }
      );
      setUploadProgress(100);

      toast.success("Upload successful");
      resetForm();
    } catch (error: any) {
      if (error?.name === "CanceledError" || error?.name === "AbortError") return;
      console.error("Error uploading video:", error);
      toast.error("There was an error uploading your video. Please try again.");
    } finally {
      abortRef.current = null;
      setIsUploading(false);
    }
  };
  return (
    <div className="bg-muted rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Upload a video</h2>
      {user && !emailVerified ? (
        <p className="text-sm text-amber-700 bg-amber-50 border rounded-lg px-3 py-2">
          You need to verify your email before uploading videos. Check your
          inbox for the verification link.
        </p>
      ) : (
      <div className="space-y-4">
        {!videoFile ? (
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-accent transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto text-muted-foreground/70 mb-2" />
            <p className="text-lg font-medium">
              Drag and drop video files to upload
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to select files
            </p>
            <p className="text-xs text-muted-foreground/70 mt-4">
              MP4, WebM, MOV or AVI • Up to 100MB
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="video/*"
              onChange={handlefilechange}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <div className="bg-blue-100 p-2 rounded-md">
                <FileVideo className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{videoFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {!isUploading && (
                <Button variant="ghost" size="icon" onClick={cancelUpload}>
                  <X className="w-5 h-5" />
                </Button>
              )}
              {uploadComplete && (
                <div className="bg-green-100 p-1 rounded-full">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="title">Title (required)</Label>
                <Input
                  id="title"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Add a title that describes your video"
                  disabled={isUploading || uploadComplete}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="premium"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  disabled={isUploading || uploadComplete}
                  className="w-4 h-4 accent-red-600"
                />
                <Label htmlFor="premium" className="cursor-pointer">
                  Premium content (requires a paid plan to watch)
                </Label>
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="flex justify-end gap-3">
              {!uploadComplete && (
                <>
                  <Button onClick={cancelUpload} disabled={uploadComplete}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={
                      isUploading || !videoTitle.trim() || uploadComplete
                    }
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </>
              )}
            </div>
        </div>
        )}
      </div>
      )}
    </div>
  );
};

export default VideoUploader;
