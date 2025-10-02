import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  deleteUser,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, Firestore } from "firebase/firestore";
import { auth, googleProvider, db, firestoreAvailable } from "./config";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  firstName?: string;
  lastName?: string;
  companyId?: string;
  role?: string;
  providerData?: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  }>;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<any>;
  confirmPhoneVerification: (
    verificationId: string,
    code: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Type guard to check if Firestore is available and db is not null
const isFirestoreAvailable = (db: any): db is Firestore => {
  return firestoreAvailable && db !== null;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Only use Firestore if it's available and enabled
      if (isFirestoreAvailable(db)) {
        try {
          // Check if user exists in Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (!userDoc.exists()) {
            // Create new user document
            const userData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              firstName: user.displayName?.split(" ")[0] || "",
              lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
              createdAt: new Date().toISOString(),
              companyId: null,
              role: "sales_rep",
            };

            await setDoc(doc(db, "users", user.uid), userData);
          }
        } catch (firestoreError) {
          console.warn(
            "Firestore error, continuing without user profile sync:",
            firestoreError
          );
        }
      } else {
        console.log("Firestore not enabled, skipping user profile sync");
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved");
          },
        }
      );

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier
      );
      return confirmationResult;
    } catch (error) {
      console.error("Error signing in with phone:", error);
      throw error;
    }
  };

  const confirmPhoneVerification = async (
    verificationId: string,
    code: string
  ) => {
    try {
      // This would be handled by the confirmation result from signInWithPhone
      // Implementation depends on your specific flow
    } catch (error) {
      console.error("Error confirming phone verification:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!currentUser || !auth.currentUser) return;

    try {
      // Try to delete user document from Firestore (if available)
      if (isFirestoreAvailable(db)) {
        try {
          await deleteDoc(doc(db, "users", currentUser.uid));
        } catch (firestoreError) {
          console.warn(
            "Firestore error, skipping user document deletion:",
            firestoreError
          );
        }
      }

      // Delete the Firebase Auth user
      await deleteUser(auth.currentUser);
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!currentUser) return;

    if (isFirestoreAvailable(db)) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), data, { merge: true });
      } catch (error) {
        console.warn("Firestore error, user profile update skipped:", error);
      }
    } else {
      console.log("Firestore not enabled, user profile update skipped");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          let userData = {};

          if (isFirestoreAvailable(db)) {
            try {
              // Get additional user data from Firestore
              const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
              userData = userDoc.data() || {};
            } catch (firestoreError) {
              console.warn(
                "Firestore error, using basic user data:",
                firestoreError
              );
              userData = {
                firstName: firebaseUser.displayName?.split(" ")[0] || "",
                lastName:
                  firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
                role: "sales_rep",
              };
            }
          } else {
            // Use default user data when Firestore is not available
            userData = {
              firstName: firebaseUser.displayName?.split(" ")[0] || "",
              lastName:
                firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
              role: "sales_rep",
            };
          }

          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            phoneNumber: firebaseUser.phoneNumber,
            photoURL: firebaseUser.photoURL,
            providerData: firebaseUser.providerData.map(provider => ({
              providerId: provider.providerId,
              uid: provider.uid,
              displayName: provider.displayName,
              email: provider.email,
              phoneNumber: provider.phoneNumber,
              photoURL: provider.photoURL,
            })),
            ...userData,
          });
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    signInWithGoogle,
    signInWithPhone,
    confirmPhoneVerification,
    signOut,
    deleteAccount,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
