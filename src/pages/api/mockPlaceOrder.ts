import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  orderId: string;
  status: string;
  price: number;
  details: { tokenId: string; amount: number };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { error: string }>
) {
  const { token, tokenId, amount } = req.body;

  if (!token || !tokenId || !amount) {
    return res.status(400).json({ error: "Missing fields" });
  }

  res.status(200).json({
    orderId: "mock_order_123",
    status: "success",
    price: 0.55,
    details: { tokenId, amount }
  });
}

