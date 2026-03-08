import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EventType = "upload" | "search" | "view" | "share" | "download";

export async function trackEvent(eventType: EventType, eventData: Record<string, any> = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("analytics_events").insert({
    user_id: user.id,
    event_type: eventType,
    event_data: eventData,
  });
}

export function useTrackEvent() {
  return useMutation({
    mutationFn: ({ type, data }: { type: EventType; data?: Record<string, any> }) =>
      trackEvent(type, data),
  });
}

interface DailyStat {
  date: string;
  uploads: number;
  searches: number;
  views: number;
  shares: number;
  downloads: number;
}

export function useAnalyticsSummary(days = 30) {
  return useQuery({
    queryKey: ["analytics-summary", days],
    queryFn: async (): Promise<{
      daily: DailyStat[];
      totals: Record<EventType, number>;
      recentEvents: any[];
    }> => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: events, error } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      const allEvents = events || [];

      // Build daily stats
      const dailyMap = new Map<string, Record<string, number>>();
      const totals: Record<string, number> = { upload: 0, search: 0, view: 0, share: 0, download: 0 };

      for (const ev of allEvents) {
        const date = ev.created_at.split("T")[0];
        if (!dailyMap.has(date)) dailyMap.set(date, { uploads: 0, searches: 0, views: 0, shares: 0, downloads: 0 });
        const d = dailyMap.get(date)!;
        const t = ev.event_type;
        if (t === "upload") d.uploads++;
        else if (t === "search") d.searches++;
        else if (t === "view") d.views++;
        else if (t === "share") d.shares++;
        else if (t === "download") d.downloads++;
        totals[t] = (totals[t] || 0) + 1;
      }

      const daily = Array.from(dailyMap.entries())
        .map(([date, counts]) => ({ date, ...counts } as DailyStat))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        daily,
        totals: totals as Record<EventType, number>,
        recentEvents: allEvents.slice(0, 20),
      };
    },
  });
}
