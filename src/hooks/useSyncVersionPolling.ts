"use client";

import { useEffect, useRef } from "react";
import {
  useBudgetStore,
  fetchSyncMetadata,
  isRemoteNewer,
} from "@/store/budget";
import { isNewerVersionCooldownActive } from "@/lib/constants";

const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/** Events that count as user activity for the inactivity timer. */
const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
] as const;

/**
 * Periodically polls Vercel Blob for a newer budget version. Stops polling after
 * INACTIVITY_TIMEOUT_MS of no user activity and resumes when the user is active again.
 * Pass enabled: false when the newer-version dialog is already open.
 */
export function useSyncVersionPolling(options: {
  enabled: boolean;
  budgetId: string | undefined;
  onNewerVersion: () => void;
}) {
  const { enabled, budgetId, onNewerVersion } = options;
  const onNewerVersionRef = useRef(onNewerVersion);
  useEffect(() => {
    onNewerVersionRef.current = onNewerVersion;
  }, [onNewerVersion]);

  useEffect(() => {
    if (!enabled || !budgetId || typeof window === "undefined") return;
    const bid: string = budgetId;

    let lastActivity = Date.now();
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function tick() {
      const tabHidden = document.visibilityState === "hidden";
      const inactive = Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS;
      if (tabHidden || inactive) {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        return;
      }

      if (isNewerVersionCooldownActive(bid)) return;

      void fetchSyncMetadata(bid).then((meta) => {
        if (!meta?.updatedAt) return;
        if (isNewerVersionCooldownActive(bid)) return;
        const state = useBudgetStore.getState();
        if (state.budgetId !== bid) return;
        if (isRemoteNewer(meta.updatedAt, state.updatedAt)) {
          onNewerVersionRef.current();
        }
      });
    }

    function onActivity() {
      lastActivity = Date.now();
      if (!intervalId && document.visibilityState !== "hidden") {
        intervalId = setInterval(tick, POLL_INTERVAL_MS);
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        lastActivity = Date.now();
        if (!intervalId) {
          intervalId = setInterval(tick, POLL_INTERVAL_MS);
        }
      } else if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    intervalId =
      document.visibilityState !== "hidden"
        ? setInterval(tick, POLL_INTERVAL_MS)
        : null;
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity));
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      ACTIVITY_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, onActivity),
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, budgetId]);
}
