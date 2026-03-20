import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import path from "path";

const client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const buildKey = (buildingId: string, filename: string) => {
  const extension = path.extname(filename).replace(".", "");
  if (!extension) {
    throw new Error("נדרשת סיומת קובץ");
  }

  return `issues/${buildingId}/${randomUUID()}.${extension}`;
};

export const generateUploadUrls = async (
  files: Array<{ filename: string; contentType: string }>,
  buildingId: string,
) => {
  const uploads = [];

  for (const file of files) {
    const key = buildKey(buildingId, file.filename);

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: file.contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: 60 * 5,
    });

    uploads.push({ key, uploadUrl });
  }

  return uploads;
};

export const generateViewUrl = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  const expiresIn = Number(process.env.AWS_VIEW_URL_EXPIRES_SECONDS ?? "300");

  return getSignedUrl(client, command, { expiresIn });
};
