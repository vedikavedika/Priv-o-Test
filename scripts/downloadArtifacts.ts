import fs from "fs";
import path from "path";
import https from "https";

const ARTIFACTS_DIR = path.join(process.cwd(), "public", "artifacts");

const FILES = [
  { name: "semaphore-12.wasm", url: "https://snark-artifacts.pse.dev/semaphore/4.13.0/semaphore-12.wasm" },
  { name: "semaphore-12.zkey", url: "https://snark-artifacts.pse.dev/semaphore/4.13.0/semaphore-12.zkey" },
];

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: Status Code ${response.statusCode}`));
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }

  console.log("Downloading Semaphore Depth 12 Snark Proving Key Artifacts...");
  for (const { name, url } of FILES) {
    const dest = path.join(ARTIFACTS_DIR, name);
    if (fs.existsSync(dest)) {
      console.log(`[EXISTS] ${name} already exists.`);
      continue;
    }
    console.log(`[DOWNLOADING] ${name} from ${url}...`);
    try {
      await downloadFile(url, dest);
      console.log(`[DONE] Downloaded ${name}`);
    } catch (err) {
      console.warn(`[WARN] Could not download ${name} directly:`, (err as Error).message);
    }
  }
}

main().catch(console.error);
