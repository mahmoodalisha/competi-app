import { useEffect, useState } from "react";
import axios from "axios";

export interface RelatedMarket {
  id: string;
  question: string;
  slug: string;
  active: boolean;
  volume: number;
}

export const useRelatedMarkets = (excludeMarketId: string) => {
  const [relatedMarkets, setRelatedMarkets] = useState<RelatedMarket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get<RelatedMarket[]>("/api/markets");
        setRelatedMarkets(data.filter((m) => m.id !== excludeMarketId).slice(0, 3));
      } catch (err) {
        setRelatedMarkets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRelated();
  }, [excludeMarketId]);

  return { relatedMarkets, loading };
};