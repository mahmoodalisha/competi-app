import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const DATA_API = process.env.NEXT_PUBLIC_DATA_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { marketId, user, limit = 20 } = req.query;

  try {
    const response = await axios.get(`${DATA_API}/trades`, {
      params: { market: marketId, user, limit }
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Error fetching trades:", error.message);
    res.status(500).json({ error: "Failed to fetch trades" });
  }
}
