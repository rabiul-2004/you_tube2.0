import { useRouter } from "next/router";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import axiosInstance from "@/lib/axiosinstance";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { useUser } from "@/lib/AuthContext";

const Channeldialogue = ({ isopen, onclose, channeldata, mode, onSuccess }: any) => {
  const { user, login } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [channelImageFile, setChannelImageFile] = useState<File | null>(null);
  const [channelImagePreview, setChannelImagePreview] = useState("");
  const [channelImageRemoved, setChannelImageRemoved] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [coverImageRemoved, setCoverImageRemoved] = useState(false);
  const [isSubmitting, setisSubmitting] = useState(false);
  const channelInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (channeldata && mode === "edit") {
      setFormData({
        name: channeldata.channelname || "",
        description: channeldata.description || "",
      });
      setChannelImageRemoved(false);
      setCoverImageRemoved(false);
    } else {
      setFormData({
        name: user?.name || "",
        description: "",
      });
      setChannelImageRemoved(false);
      setCoverImageRemoved(false);
    }
  }, [channeldata, mode]);

  useEffect(() => {
    return () => {
      if (channelImagePreview) URL.revokeObjectURL(channelImagePreview);
      if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
    };
  }, [channelImagePreview, coverImagePreview]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const pickImage = (
    e: ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: React.Dispatch<React.SetStateAction<string>>,
    setRemoved: (r: boolean) => void
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const img = files[0];
    if (!img.type.startsWith("image/")) {
      return;
    }
    if (img.size > 5 * 1024 * 1024) {
      return;
    }
    setFile(img);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(img);
    });
    setRemoved(false);
  };

  const shownChannel =
    channelImagePreview ||
    (!channelImageRemoved && channeldata?.channelImage) ||
    "";
  const shownCover =
    coverImagePreview ||
    (!coverImageRemoved && channeldata?.coverImage) ||
    "";

  const handlesubmit = async (e: FormEvent) => {
    e.preventDefault();
    setisSubmitting(true);
    try {
      let channelImageUrl: string | undefined;
      let coverImageUrl: string | undefined;
      if (channelImageFile || coverImageFile) {
        const { data: sig } = await axiosInstance.post(
          "/video/upload-signature"
        );
        if (channelImageFile) {
          channelImageUrl = await uploadImageToCloudinary(channelImageFile, sig);
        }
        if (coverImageFile) {
          coverImageUrl = await uploadImageToCloudinary(coverImageFile, sig);
        }
      }
      const payload: any = {
        channelname: formData.name,
        description: formData.description,
      };
      if (channelImageFile) payload.channelImage = channelImageUrl;
      else if (channelImageRemoved || channeldata?.channelImage)
        payload.channelImage = channelImageRemoved ? "" : undefined;
      if (coverImageFile) payload.coverImage = coverImageUrl;
      else if (coverImageRemoved || channeldata?.coverImage)
        payload.coverImage = coverImageRemoved ? "" : undefined;

      const response = await axiosInstance.patch(
        `/user/update/${user._id}`,
        payload
      );
      login(response?.data);
      setFormData({
        name: "",
        description: "",
      });
      onclose();
      if (onSuccess) {
        onSuccess(response?.data);
      } else {
        router.push(`/channel/${user?._id}`);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setisSubmitting(false);
    }
  };
  return (
    <Dialog open={isopen} onOpenChange={onclose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create your channel" : "Edit your channel"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handlesubmit} className="space-y-6">
          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          {/* Channel Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Channel Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Tell viewers about your channel..."
            />
          </div>

          {/* Channel Picture */}
          <div className="space-y-2">
            <Label>Channel picture</Label>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 ring-2 ring-border">
                {shownChannel ? (
                  <AvatarImage src={shownChannel} alt="Channel picture" />
                ) : null}
                <AvatarFallback>
                  {formData.name?.[0] || user?.name?.[0] || "C"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => channelInputRef.current?.click()}
                >
                  <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
                  {shownChannel ? "Change picture" : "Add picture"}
                </Button>
                {shownChannel && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => {
                      setChannelImageFile(null);
                      setChannelImagePreview((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return "";
                      });
                      setChannelImageRemoved(true);
                      if (channelInputRef.current)
                        channelInputRef.current.value = "";
                    }}
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    Remove
                  </Button>
                )}
                <input
                  type="file"
                  ref={channelInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) =>
                    pickImage(
                      e,
                      setChannelImageFile,
                      setChannelImagePreview,
                      setChannelImageRemoved
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* Cover Picture */}
          <div className="space-y-2">
            <Label>Cover picture</Label>
            <div className="overflow-hidden rounded-lg border border-border h-28 relative">
              {shownCover ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shownCover}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImageFile(null);
                      setCoverImagePreview((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return "";
                      });
                      setCoverImageRemoved(true);
                      if (coverInputRef.current)
                        coverInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80"
                    aria-label="Remove cover picture"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-accent"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-xs">Add cover picture</span>
                </button>
              )}
            </div>
            {shownCover && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => coverInputRef.current?.click()}
              >
                <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
                Change cover picture
              </Button>
            )}
            <input
              type="file"
              ref={coverInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) =>
                pickImage(
                  e,
                  setCoverImageFile,
                  setCoverImagePreview,
                  setCoverImageRemoved
                )
              }
            />
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button type="button" variant="outline" onClick={onclose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                ? "Create Channel"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Channeldialogue;