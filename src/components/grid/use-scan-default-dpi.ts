"use client";

import { DEFAULT_SCAN_DPI } from "@/lib/assets/compute-context";
import { useEffect, useState } from "react";

export function useScanDefaultDpi(): number {
  const [dpi, setDpi] = useState(DEFAULT_SCAN_DPI);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/immich/curator-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { scanDefaultDpi?: number } | null) => {
        if (cancelled || !data?.scanDefaultDpi) return;
        setDpi(data.scanDefaultDpi);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return dpi;
}
