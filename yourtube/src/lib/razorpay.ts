declare global {
  interface Window {
    Razorpay: any;
  }
}

let loadPromise: Promise<any> | null = null;

export function loadRazorpayScript(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("client only"));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Razorpay checkout script"));
    };
    document.body.appendChild(script);
  });
  return loadPromise;
}
