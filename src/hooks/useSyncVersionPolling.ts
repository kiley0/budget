"use client";

import { useEffect, useRef } from "react";
import {
  useBudgetStore,
  fetchSyncMetadata,
  isRemoteNewer,
} from "@/store/budget";
import { isNewerVersionCooldownActive } from "@/lib/constants";

const INITIAL_POLL_DELAY_MS = 1000; // 1 second
const MAX_POLL_DELAY_MS = 30 * 1000; // 30 seconds (exponential backoff cap)
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes; stop polling when inactive

/** Events that count as user activity. Polling resumes from 1s when user becomes active again. */
const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
] as const;

/**
 * Polls Vercel Blob for a newer budget version only when the tab is active.
 * Starts at 1s, doubles each poll (exponential backoff) up to 30s, and stops
 * if the user is inactive for 10 minutes. Resumes from 1s when the user is active again.
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
    let currentDelay = INITIAL_POLL_DELAY_MS;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function scheduleNext() {
      if (timeoutId) return;
      const tabHidden = document.visibilityState === "hidden";
      const inactive = Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS;
      if (tabHidden || inactive) return;

      timeoutId = setTimeout(() => {
        timeoutId = null;

        const nowHidden = document.visibilityState === "hidden";
        const nowInactive = Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS;
        if (nowHidden || nowInactive) return;

        if (isNewerVersionCooldownActive(bid)) {
          scheduleNext();
          return;
        }

        void fetchSyncMetadata(bid)
          .then((meta) => {
            if (!meta?.updatedAt) {
              currentDelay = Math.min(currentDelay * 2, MAX_POLL_DELAY_MS);
              scheduleNext();
              return;
            }
            if (isNewerVersionCooldownActive(bid)) {
              scheduleNext();
              return;
            }
            const state = useBudgetStore.getState();
            if (state.budgetId !== bid) {
              scheduleNext();
              return;
            }
            if (isRemoteNewer(meta.updatedAt, state.updatedAt)) {
              onNewerVersionRef.current();
              return; // Dialog opens; enabled becomes false, effect cleans up
            }
            currentDelay = Math.min(currentDelay * 2, MAX_POLL_DELAY_MS);
            scheduleNext();
          })
          .catch(() => {
            currentDelay = Math.min(currentDelay * 2, MAX_POLL_DELAY_MS);
            scheduleNext();
          });
      }, currentDelay);
    }

    function onActivity() {
      lastActivity = Date.now();
      if (document.visibilityState === "hidden") return;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      currentDelay = INITIAL_POLL_DELAY_MS;
      scheduleNext();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        lastActivity = Date.now();
        currentDelay = INITIAL_POLL_DELAY_MS;
        scheduleNext();
      } else if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    if (document.visibilityState === "visible") {
      scheduleNext();
    }
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity));
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      ACTIVITY_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, onActivity),
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, budgetId]);
}
