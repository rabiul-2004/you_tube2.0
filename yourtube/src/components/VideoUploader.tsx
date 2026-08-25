import { Check, FileVideo, ImagePlus, Upload, X } from "lucide-react";
import React, { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { uploadToCloudinary, uploadImageToCloudinary } from "@/lib/cloudinary";
import { captureVideoFrame } from "@/lib/thumbnail";

const VideoUploader = ({ channelId, channelName }: any) => {
  const { user, emailVerified } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [autoThumb, setAutoThumb] = useState<Blob | null>(null);
  const [customThumb, setCustomThumb] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const handlefilechange = async (e: ChangeEvent<HTMLInputElement>) => {
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
      setCustomThumb(null);
      const blob = await captureVideoFrame(file);
      if (blob) {
        setAutoThumb(blob);
        setThumbPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      }
    }
  };
  const handleThumbChange = (e: ChangeEvent<HTMLInputElement>) => {
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
    setCustomThumb(img);
    setThumbPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(img);
    });
  };
  const resetForm = () => {
    setVideoFile(null);
    setVideoTitle("");
    setDescription("");
    setIsPremium(false);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    setVideoDuration(0);
    setAutoThumb(null);
    setCustomThumb(null);
    setThumbPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (thumbInputRef.current) {
      thumbInputRef.current.value = "";
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

      let thumbnailUrl = "";
      const thumbSource: File | Blob | null = customThumb || autoThumb;
      if (thumbSource) {
        try {
          const { data: imgSig } = await axiosInstance.post("/video/upload-signature");
          thumbnailUrl = await uploadImageToCloudinary(thumbSource, imgSig);
        } catch (err) {
          console.error("Thumbnail upload failed, continuing without it:", err);
          toast.info("Thumbnail could not be uploaded — the video will use a live preview.");
        }
      }
      setUploadProgress(90);

      await axiosInstance.post(
        "/video/upload",
        {
          videotitle: videoTitle,
          description,
          thumbnail: thumbnailUrl,
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
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your video"
                  disabled={isUploading || uploadComplete}
                  className="mt-1 min-h-[80px] max-h-64 max-w-full resize-y [field-sizing:fixed]"
                  maxLength={5000}
                />
              </div>
              <div>
                <Label>Thumbnail</Label>
                <div className="mt-1 flex items-start gap-3">
                  {thumbPreview ? (
                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden border bg-secondary flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-40 aspect-video rounded-lg border border-dashed bg-secondary/50 flex flex-col items-center justify-center text-muted-foreground flex-shrink-0">
                      <ImagePlus className="w-6 h-6 mb-1" />
                      <span className="text-[11px] text-center px-2">Auto frame captured after upload</span>
                    </div>
                  )}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>A frame is auto-captured from your video. You can replace it with a custom image.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading || uploadComplete}
                      onClick={() => thumbInputRef.current?.click()}
                    >
                      <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
                      {thumbPreview && customThumb ? "Change image" : "Use custom image"}
                    </Button>
                    {customThumb && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUploading || uploadComplete}
                        onClick={() => {
                          setCustomThumb(null);
                          setThumbPreview((prev) => {
                            if (prev) URL.revokeObjectURL(prev);
                            return autoThumb ? URL.createObjectURL(autoThumb) : "";
                          });
                        }}
                      >
                        <X className="w-3.5 h-3.5 mr-1.5" />
                        Revert to auto frame
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
