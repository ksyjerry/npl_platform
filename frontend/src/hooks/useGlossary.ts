"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import type { GlossaryItem } from "@/types/glossary";

export function useGlossary() {
  const [items, setItems] = useState<GlossaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ items: GlossaryItem[] }>("/glossary");
        setItems(data.items);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { items, loading };
}
