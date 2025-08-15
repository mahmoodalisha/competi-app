import type { NextApiRequest, NextApiResponse } from "next";

interface Position {
  positionId: string;
  marketId: string;
  outcome: string;
  size: number;
  odds: number;
  status: "open" | "closed";
}

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<Position[]>
) {
  res.status(200).json([
    { positionId: "pos_1", marketId: "16084", outcome: "Yes", size: 10, odds: 0.55, status: "open" },
    { positionId: "pos_2", marketId: "16084", outcome: "No", size: 5, odds: 0.45, status: "open" }
  ]);
}
