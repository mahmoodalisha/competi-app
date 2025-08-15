import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const GAMMA_API = process.env.NEXT_PUBLIC_GAMMA_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { limit = 20, offset = 0, active = true } = req.query;

    const response = await axios.get(`${GAMMA_API}/markets`, {
      params: { limit, offset, active }
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Error fetching markets:", error.message);
    res.status(500).json({ error: "Failed to fetch markets" });
  }
}
