import { useQuery } from "@tanstack/react-query";

export function useEmails(category: string = "all") {
  return useQuery({
    queryKey: ["emails", category],
    queryFn: async () => {
      const res = await fetch(`/api/emails?category=${encodeURIComponent(category)}`);
      if (!res.ok) throw new Error("Failed to fetch emails");
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}
