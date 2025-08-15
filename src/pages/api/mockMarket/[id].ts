import type { NextApiRequest, NextApiResponse } from "next";

interface Market {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  resolutionSource: string;
  endDate: string;
  startDate: string;
  image: string;
  icon: string;
  description: string;
  outcomes: string[];
  active: boolean;
  closed: boolean;
  marketMakerAddress: string;
  createdAt: string;
  updatedAt: string;
  new: boolean;
  featured: boolean;
  submitted_by: string;
  archived: boolean;
  restricted: boolean;
  groupItemTitle: string;
  groupItemThreshold: string;
  enableOrderBook: boolean;
  orderPriceMinTickSize: number;
  orderMinSize: number;
  startDateIso: string;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  umaBond: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Market | { error: string }>
) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid market ID" });
  }

  
  const mockMarket: Market = {
    id,
    question: "ARCH Will the match be a draw?",
    conditionId: "",
    slug: "will-the-match-be-a-draw-romania-ukraine",
    resolutionSource: "",
    endDate: "2024-06-17T12:00:00Z",
    startDate: "2024-06-17T03:51:23.112Z",
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/euro-2024-spain-vs-croatia-hMVrh1C7sGqw.png",
    icon: "https://polymarket-upload.s3.us-east-2.amazonaws.com/euro-2024-spain-vs-croatia-hMVrh1C7sGqw.png",
    description:
      "This market refers to the 2024 UEFA European Football Championship match between Romania and Ukraine scheduled for June 17, 9:00 AM ET.\n\nIf the match ends in a draw this market will resolve to 'Yes'. Otherwise this market will resolve to 'No'.",
    outcomes: ["Yes", "No"],
    active: true,
    closed: false,
    marketMakerAddress: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    new: false,
    featured: false,
    submitted_by: "0x91430CaD2d3975766499717fA0D66A78D814E5c5",
    archived: false,
    restricted: true,
    groupItemTitle: "Draw",
    groupItemThreshold: "2",
    enableOrderBook: true,
    orderPriceMinTickSize: 0.01,
    orderMinSize: 5,
    startDateIso: "2024-06-17",
    volume1wk: 0,
    volume1mo: 0,
    volume1yr: 0,
    umaBond: "500",
  };

  res.status(200).json(mockMarket);
}
