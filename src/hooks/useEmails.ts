import { useQuery } from "@tanstack/react-query";
import { useEmailStore } from "@/store/useEmailStore";

export function useEmails() {
  const emails = useEmailStore((state) => state.emails);
  return useQuery({
    queryKey: ["emails"],
    queryFn: async () => {
      return emails;
    },
    initialData: emails,
  });
}
