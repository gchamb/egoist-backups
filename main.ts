import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { execSync } from "child_process";
import fs from "fs/promises";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

async function backup() {
  const now = new Date().toISOString();

  console.log(`Starting backup at ${now}`);

  const MYSQL_HOST = process.env.MYSQL_HOST;
  const MYSQL_USER = process.env.MYSQL_USER;
  const MYSQL_PASS = process.env.MYSQL_PASS;
  const MYSQL_PORT = process.env.MYSQL_PORT;
  const MYSQL_DATABASE = process.env.MYSQL_DATABASE;
  const ENV = process.env.ENV;
  const BUCKET_NAME = process.env.BUCKET_NAME;
  const ACCESS_KEY = process.env.MY_AWS_ACCESS_KEY_ID;
  const SECRET_ACCESS_KEY = process.env.MY_AWS_SECRET_ACCESS_KEY;

  if (
    MYSQL_HOST === undefined ||
    MYSQL_USER === undefined ||
    MYSQL_PASS === undefined ||
    MYSQL_PORT === undefined ||
    MYSQL_DATABASE === undefined ||
    ENV === undefined ||
    BUCKET_NAME === undefined ||
    ACCESS_KEY === undefined ||
    SECRET_ACCESS_KEY === undefined
  ) {
    throw new Error("Not all environment variables are set. Check config.");
  }

  const client = new S3Client({
    region: "us-east-2",
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });

  const fileName = `${now}-backup.sql`;
  const command = `mysqldump -h ${MYSQL_HOST} -u ${MYSQL_USER} -p${MYSQL_PASS} --port ${MYSQL_PORT} ${MYSQL_DATABASE} > ${fileName}`;

  console.log("Executing Backup..");

  execSync(command);

  if (!fileExists(fileName)) {
    throw new Error("Backup file doesn't exist.");
  }

  console.log("Dump operation successfully completed.");

  const putCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `${ENV}/mysql/${fileName}`,
    Body: await fs.readFile(fileName),
  });

  console.log("Uploading to s3...");

  await client.send(putCommand);

  console.log("Backup is complete.");
}

try {
  backup();
} catch (err) {
  console.error("Error occurred while backing up database", err);
}
