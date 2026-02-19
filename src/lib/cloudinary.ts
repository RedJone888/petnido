// lib/cloudinary.ts
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 定义返回类型
interface CloudinaryUploadResult {
  url: string;
  fileKey: string;
}

export const uploadToCloudinary = async (
  file: File,
  folder: string = "others"
): Promise<CloudinaryUploadResult> => {
  // 1. 将 File 对象转换为 ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 2. 将 Buffer 转为 Base64 字符串 (Cloudinary Node SDK 需要这种格式或 Stream)
  // 这种方式适合中小文件，简单直接
  const fileStr = `data:${file.type};base64,${buffer.toString("base64")}`;

  // 3. 上传
  const result: UploadApiResponse = await cloudinary.uploader.upload(fileStr, {
    folder: `petnido/${folder}`, // 自定义你的文件夹前缀
    resource_type: "auto", // 自动识别是图片还是视频
  });

  return {
    url: result.secure_url,
    fileKey: result.public_id, // 关键：这是删除时需要的 ID
  };
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};
