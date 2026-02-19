import fs from "fs/promises";
import path from "path";
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads");
export const localStorage = {
  async put(key: string, buffer: Buffer) {
    const filePath = path.join(UPLOAD_DIR, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, new Uint8Array(buffer));
  },
  async delete(key: string) {
    const filePath = path.join(UPLOAD_DIR, key);
    await fs.unlink(filePath).catch(() => {});
  },
};
