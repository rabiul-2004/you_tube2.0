import React, { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import axiosInstance from "@/lib/axiosinstance";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { useUser } from "@/lib/AuthContext";

const ProfileEditDialog = ({ isopen, onclose }: any) => {
  const { user, login } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [isUploading, setisUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isopen) {
      setFile(null);
      setPreview("");
    }
  }, [isopen]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const img = files[0];
    if (!img.type.startsWith("image/")) {
      toast.error("Profile picture must be an image file.");
      return;
    }
    if (img.size > 5 * 1024 * 1024) {
      toast.error("Profile picture must be under 5MB.");
      return;
    }
    setFile(img);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(img);
    });
  };

  const handleSave = async () => {
    if (!file || !user?._id) return;
    setisUploading(true);
    try {
      const { data: sig } = await axiosInstance.post("/video/upload-signature");
      const url = await uploadImageToCloudinary(file, sig);
      const response = await axiosInstance.patch(`/user/update/${user._id}`, {
        image: url,
      });
      login(response.data);
      toast.success("Profile picture updated");
      onclose();
    } catch (error: any) {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          "Could not update profile picture. Please try again."
      );
    } finally {
      setisUploading(false);
    }
  };

  const shown = preview || user?.image || "";

  return (
    <Dialog open={isopen} onOpenChange={onclose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="relative">
            <Avatar className="w-24 h-24 ring-4 ring-border">
              {shown && <AvatarImage src={shown} alt={user?.name} />}
              <AvatarFallback className="text-3xl">
                {user?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-background border border-border rounded-full p-1.5 shadow-sm hover:bg-accent"
              aria-label="Change profile picture"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center">
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="w-3.5 h-3.5 mr-1.5" />
            {file ? "Choose another picture" : "Update profile picture"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handlePick}
          />
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button type="button" variant="outline" onClick={onclose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isUploading || !file}
          >
            {isUploading ? "Uploading..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditDialog;