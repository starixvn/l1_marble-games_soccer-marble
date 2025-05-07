import crypto from "crypto";

const algorithm = "aes-256-ctr";
const key = "SDF4eGGjkyulkuiop3Ef42vsgaemEfeq";

export const encrypt = (data: any) => {
  const json = JSON.stringify(data);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(json, "utf8", "base64");
  encrypted += cipher.final("base64");

  const ivBase64 = iv.toString("base64");

  return ivBase64 + ":" + encrypted;
};

export const decrypt = (encrypted: any) => {
  const [ivBase64, encryptedData] = encrypted.split(":");
  const iv = Buffer.from(ivBase64, "base64");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  let decrypted = decipher.update(encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
};
