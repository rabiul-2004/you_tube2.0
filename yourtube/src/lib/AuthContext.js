import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { useState } from "react";
import { createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect, useContext, useRef } from "react";

const UserContext = createContext();

const getDeviceFingerprint = () => {
  if (typeof navigator === "undefined") return null;
  return `${navigator.userAgent.slice(0, 50)}`;
};

const getClientInfo = async () => {
  try {
    const res = await axiosInstance.get("/user/location");
    return res.data;
  } catch {
    return {};
  }
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [signingIn, setSigningIn] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpUserId, setOtpUserId] = useState(null);
  const [otpMessage, setOtpMessage] = useState("");
  const userRef = useRef(null);

  const login = (userdata) => {
    const current = JSON.stringify(userRef.current);
    if (current && current === JSON.stringify(userdata)) {
      return;
    }
    userRef.current = userdata;
    setUser(userdata);
    localStorage.setItem("user", JSON.stringify(userdata));
  };

  const logout = async () => {
    userRef.current = null;
    setUser(null);
    setOtpRequired(false);
    setOtpUserId(null);
    localStorage.removeItem("user");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const syncWithBackend = async (firebaseuser) => {
    const device = getDeviceFingerprint();
    const location = await getClientInfo();
    const payload = {
      email: firebaseuser.email,
      name: firebaseuser.displayName,
      image: firebaseuser.photoURL || "https://github.com/shadcn.png",
      city: location.city || null,
      state: location.state || null,
      device,
    };
    const response = await axiosInstance.post("/user/login", payload);

    if (response.data.otpRequired) {
      setOtpRequired(true);
      setOtpUserId(response.data.result._id);
      setOtpMessage(response.data.message || "OTP sent to your email.");
      return;
    }

    const result = response.data.result;
    if (result.theme) {
      applyTheme(result.theme);
    }
    login(result);
  };

  const applyTheme = (theme) => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "auto") {
      const hour = new Date().getHours();
      const isISTLight = hour >= 10 && hour < 12;
      root.classList.toggle("dark", !isISTLight);
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
  };

  const verifyOtp = async (otp) => {
    const device = getDeviceFingerprint();
    const location = await getClientInfo();
    const response = await axiosInstance.post("/user/verify-otp", {
      userId: otpUserId,
      otp,
      city: location.city || null,
      state: location.state || null,
      device,
    });
    const result = response.data.result;
    setOtpRequired(false);
    setOtpUserId(null);
    if (result.theme) {
      applyTheme(result.theme);
    }
    login(result);
    return true;
  };

  const handlegooglesignin = async () => {
    if (signingIn) return { success: false };
    setSigningIn(true);
    try {
      await signInWithPopup(auth, provider);
      return { success: true };
    } catch (error) {
      return { success: false, code: error.code };
    } finally {
      setSigningIn(false);
    }
  };

  const signinwithemail = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const signupwithemail = async (name, email, password) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    if (name) {
      await updateProfile(credential.user, { displayName: name });
    }
    let emailSent = false;
    try {
      await sendEmailVerification(credential.user);
      emailSent = true;
    } catch (error) {
      console.error("Verification email send failed:", error.code || error);
    }
    return { emailSent };
  };

  const sendverificationemail = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await sendEmailVerification(currentUser);
  };

  const sendpasswordreset = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (firebaseuser) {
        setEmailVerified(firebaseuser.emailVerified);
        try {
          await syncWithBackend(firebaseuser);
        } catch (error) {
          console.error(error);
          logout();
        }
      } else {
        setUser(null);
        setEmailVerified(false);
        localStorage.removeItem("user");
      }
    });
    return () => unsubcribe();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        handlegooglesignin,
        signinwithemail,
        signupwithemail,
        sendpasswordreset,
        sendverificationemail,
        emailVerified,
        signingIn,
        otpRequired,
        otpMessage,
        verifyOtp,
        applyTheme,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
