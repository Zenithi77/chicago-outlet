"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminState {
  authed: boolean;
  username: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

// Demo credentials per spec: admin / chicago2025
export const useAdmin = create<AdminState>()(
  persist(
    (set) => ({
      authed: false,
      username: null,
      login: (username, password) => {
        if (username === "admin" && password === "chicago2025") {
          set({ authed: true, username });
          return true;
        }
        return false;
      },
      logout: () => set({ authed: false, username: null }),
    }),
    { name: "chicago-outlet-admin" }
  )
);
