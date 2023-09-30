import { NextApiRequest } from "next";

export function getRemoteIp(req: NextApiRequest) {
  const addressInfo = req.socket.address();
  const remoteIp =
    req.headers["x-real-ip"] ||
    ("address" in addressInfo && addressInfo.address);
  return typeof remoteIp === "string" && remoteIp;
}
