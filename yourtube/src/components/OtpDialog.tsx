import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { useUser } from "@/lib/AuthContext";
import { ShieldCheck } from "lucide-react";

const OtpDialog = () => {
  const { otpRequired, otpMessage, verifyOtp } = useUser();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  if (!otpRequired) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(otp);
      toast.success("Verification successful!");
      setOtp("");
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Invalid OTP. Try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-background border rounded-xl p-6 w-full max-w-sm mx-4 animate-scale-in shadow-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-primary/10 p-3 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Verify your identity</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {otpMessage || "New device or location detected. Enter the OTP sent to your email."}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="text-center text-lg tracking-[0.5em] font-mono"
            autoFocus
          />
          <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default OtpDialog;
