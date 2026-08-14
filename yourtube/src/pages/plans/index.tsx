import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { loadRazorpayScript } from "@/lib/razorpay";
import { Check, Crown, Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: 0,
    tagline: "Start watching",
    features: [
      "Unlimited basic videos",
      "1 download / day",
      "Standard quality",
      "With ads",
    ],
    highlighted: false,
  },
  {
    name: "Bronze",
    price: 1,
    tagline: "For casual viewers",
    features: [
      "Premium content access",
      "3 downloads / day",
      "Standard quality",
      "With ads",
    ],
    highlighted: false,
  },
  {
    name: "Silver",
    price: 2,
    tagline: "Most popular",
    features: [
      "Premium content access",
      "7 downloads / day",
      "HD quality",
      "Ad-free viewing",
    ],
    highlighted: true,
  },
  {
    name: "Gold",
    price: 3,
    tagline: "Maximum power",
    features: [
      "Everything in Silver",
      "15 downloads / day",
      "Full HD quality",
      "Priority support",
    ],
    highlighted: false,
  },
];

const PlansPage = () => {
  const { user, login } = useUser();
  const [status, setStatus] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await axiosInstance.get(`/plan/status/${user._id}`);
      setStatus(res.data);
    } catch (error) {
      console.log(error);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isCurrentPlan = (planName: string) =>
    status?.active && status.plan === planName;

  const handleUpgrade = async (planName: string) => {
    if (!user?._id) {
      toast.error("Please sign in to upgrade");
      return;
    }
    setProcessing(planName);
    try {
      const orderRes = await axiosInstance.post("/plan/create-order", {
        userId: user._id,
        plan: planName,
      });
      const { orderId, amount, currency, key } = orderRes.data;
      const Razorpay = await loadRazorpayScript();
      const options = {
        key,
        amount,
        currency,
        name: "YourTube",
        description: `${planName} plan`,
        order_id: orderId,
        prefill: {
          email: user.email,
          name: user.name,
        },
        handler: async (response: any) => {
          try {
            await axiosInstance.post("/plan/verify", {
              userId: user._id,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              plan: planName,
            });
            await fetchStatus();
            const updatedRes = await axiosInstance.post("/user/login", {
              email: user.email,
              name: user.name,
              image: user.image,
            });
            login(updatedRes.data.result);
            toast.success(`${planName} plan activated!`);
          } catch (error) {
            toast.error("Payment verification failed. Contact support.");
          } finally {
            setProcessing(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(null);
          },
        },
      };
      const rzp = new Razorpay(options);
      rzp.on("payment.failed", (res: any) => {
        toast.error(res.error?.description || "Payment failed");
        setProcessing(null);
      });
      rzp.open();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Could not start payment. Is the backend running with Razorpay keys?"
      );
      setProcessing(null);
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Choose your plan</h1>
          <p className="text-gray-600 mt-2">
            {status?.active
              ? `Current plan: ${status.plan} (valid until ${new Date(
                  status.expiresAt
                ).toLocaleDateString("en-IN")})`
              : "Upgrade for premium content, more downloads and ad-free viewing"}
          </p>
        </div>

        {!user && (
          <p className="text-center text-sm text-gray-500 mb-6">
            You need to sign in to upgrade. Sign in from the top-right corner.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-xl border p-5",
                plan.highlighted
                  ? "border-red-600 bg-red-50/40"
                  : "border-gray-200 bg-white",
                isCurrentPlan(plan.name) && "ring-2 ring-red-600"
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Most popular
                </span>
              )}
              {isCurrentPlan(plan.name) && (
                <span className="absolute -top-3 right-3 flex items-center gap-1 bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  <Crown className="w-3 h-3" /> Current
                </span>
              )}
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="text-sm text-gray-500">{plan.tagline}</p>
              <div className="mt-4 mb-4">
                <span className="text-3xl font-bold">₹{plan.price}</span>
                <span className="text-sm text-gray-500">/ month</span>
              </div>
              <ul className="space-y-2 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={isCurrentPlan(plan.name) ? "secondary" : "default"}
                disabled={
                  processing !== null ||
                  isCurrentPlan(plan.name) ||
                  !user ||
                  plan.price === 0
                }
                onClick={() => handleUpgrade(plan.name)}
              >
                {processing === plan.name ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : isCurrentPlan(plan.name) ? (
                  "Your plan"
                ) : plan.price === 0 ? (
                  "Current"
                ) : (
                  "Upgrade"
                )}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Payments are processed via Razorpay (test mode). Use test card 4111
          1111 1111 1111 for testing.
        </p>
      </div>
    </main>
  );
};

export default PlansPage;
