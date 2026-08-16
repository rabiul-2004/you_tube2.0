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

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [signingIn, setSigningIn] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
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
    localStorage.removeItem("user");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const syncWithBackend = async (firebaseuser) => {
    const payload = {
      email: firebaseuser.email,
      name: firebaseuser.displayName,
      image: firebaseuser.photoURL || "https://github.com/shadcn.png",
    };
    const response = await axiosInstance.post("/user/login", payload);
    login(response.data.result);
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
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
