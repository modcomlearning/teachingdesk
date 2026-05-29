import { useState, useCallback } from "react";

function storageKey(userId) {
  return `ns_opened_${userId || "anon"}`;
}

function readOpened(userId) {
  try { return new Set(JSON.parse(localStorage.getItem(storageKey(userId))) || []); }
  catch { return new Set(); }
}

function writeOpened(userId, set) {
  localStorage.setItem(storageKey(userId), JSON.stringify([...set]));
}

export function useOpenedFiles(userId) {
  // Keep a local state copy so components re-render when a file is opened
  const [opened, setOpened] = useState(() => readOpened(userId));

  const markOpened = useCallback((materialId) => {
    setOpened(prev => {
      const next = new Set(prev);
      next.add(String(materialId));
      writeOpened(userId, next);
      return next;
    });
  }, [userId]);

  const isOpened = useCallback((materialId) => {
    return opened.has(String(materialId));
  }, [opened]);

  return { markOpened, isOpened };
}
