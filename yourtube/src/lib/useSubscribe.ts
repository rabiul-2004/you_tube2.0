import { useCallback, useEffect, useState } from "react";
import { useUser } from "./AuthContext";
import axiosInstance from "./axiosinstance";

export function useSubscribe(channelId: string | undefined) {
  const { user } = useUser();
  const [subscribed, setSubscribed] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!channelId) return;
    let mounted = true;
    axiosInstance
      .get(`/subscribe/${channelId}`, {
        params: user?._id ? { userId: user._id } : {},
      })
      .then((res) => {
        if (!mounted) return;
        setSubscribed(res.data.subscribed);
        setCount(res.data.count);
      })
      .catch((error) => console.log(error));
    return () => {
      mounted = false;
    };
  }, [channelId, user?._id]);

  const toggle = useCallback(async () => {
    if (!channelId || !user) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/subscribe/${channelId}`, {
        userId: user._id,
      });
      setSubscribed(res.data.subscribed);
      setCount(res.data.count);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [channelId, user?._id]);

  return { subscribed, count, loading, toggle };
}
