"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

type PostgresEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface SubscriptionConfig {
  table: string;
  event: PostgresEvent;
  filter?: string;
  callback: (payload: { new: Record<string, unknown>; old: Record<string, unknown>; eventType: string }) => void;
}

export function useSupabaseSubscription(
  channelName: string,
  configs: SubscriptionConfig[],
  enabled = true
) {
  const callbacksRef = useRef(configs);
  callbacksRef.current = configs;

  useEffect(() => {
    if (!enabled || !channelName) return;

    const channel: RealtimeChannel = supabase.channel(channelName);

    for (let i = 0; i < callbacksRef.current.length; i++) {
      const config = callbacksRef.current[i];
      const opts: Record<string, string> = {
        event: config.event,
        schema: "public",
        table: config.table,
      };
      if (config.filter) opts.filter = config.filter;

      channel.on(
        "postgres_changes" as "system",
        opts as unknown as { event: "system"; schema: string },
        (payload: unknown) => {
          callbacksRef.current[i]?.callback(
            payload as { new: Record<string, unknown>; old: Record<string, unknown>; eventType: string }
          );
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, enabled]);
}
