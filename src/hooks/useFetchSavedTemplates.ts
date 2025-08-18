import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase"; // adjust path

type Template = {
  id: string;
  name: string;
  // add other fields from your table here
};

export function useSavedTemplates() {
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("iract_canvaTemplates")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        setError(error.message);
        console.error("Error fetching templates:", error);
        return;
      }

      if (data) {
        setSavedTemplates(data);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Unexpected error");
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedTemplates();
  }, []);

  return { savedTemplates, loading, error, refetch: fetchSavedTemplates };
}
