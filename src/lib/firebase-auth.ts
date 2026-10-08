import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Sign in using Firebase Google popup
 */
export async function signInWithFirebaseGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign in using Firebase Email and Password
 */
export async function signInWithFirebaseEmail(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Create a new user account using Firebase Email and Password
 */
export async function signUpWithFirebaseEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && result.user) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

/**
 * Sign out of Firebase
 */
export async function signOutFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.error("Firebase signout error:", err);
  }
}

/**
 * Subscribe to Firebase Auth state updates
 */
export function subscribeToFirebaseAuthState(
  callback: (user: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, callback);
}

export { auth };
