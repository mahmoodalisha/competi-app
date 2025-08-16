import axios from "axios";
import { config } from "./config";

export async function getMarketsFromGammaAPI() {
  const url = `${config.GAMMA_API_URL}/markets?limit=50&offset=0&active=true&closed=false`;
  const { data } = await axios.get(url);
  return data;
}

export async function getMarketById(id: string) {
  const url = `${config.GAMMA_API_URL}/markets/${id}`;
  const { data } = await axios.get(url);
  return data;
}
