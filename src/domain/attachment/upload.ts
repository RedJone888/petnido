// import { AttachmentPresignedFromApi } from "./api.types";
import { getFileSignature } from "./getFileSignature";
interface Props {
  file: File;
  signature?: string;
  folder?: string;
  serviceKind: string | null;
}
export const uploadSingleImage = async ({
  file,
  signature,
  serviceKind,
  folder = "others",
}: Props) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", folder); // 这里的 type 对应后端的文件夹
  formData.append("signature", signature ?? getFileSignature(file));
  if (folder === "service" && serviceKind !== null) {
    formData.append("serviceKind", serviceKind);
  }

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    // A. 上传 Cloudinary
    const dbRecord = await res.json();
    console.log("Upload & Save Success:", dbRecord);
    return dbRecord;
  } catch (error) {
    console.error(`Failed to upload ${file.name}:`, error);
    throw error;
  }
};
