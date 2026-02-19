// import { localStorage } from "@/lib/storage/localStorage";
// export async function POST(req: Request) {
//   const formData = await req.formData();
//   const file = formData.get("file");
//   if (!(file instanceof File)) {
//     return new Response("No file", { status: 400 });
//   }
//   const buffer = Buffer.from(await file.arrayBuffer());
//   const ext = file.name.split(".").pop();
//   const key = `service/${crypto.randomUUID()}.${ext}`;
//   await localStorage.put(key, buffer);
//   return Response.json({
//     url: `/uploads/${key}`,
//   });
// }

import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { auth } from "@/server/auth/auth";
import prisma from "@/lib/prisma";
import { ServicePhotoKind } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    // 1. 鉴权
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // 2. 每日数量限制 (Rate Limit by DB)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const count = await prisma.attachment.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: startOfDay },
      },
    });
    if (count >= 50) {
      // 限制每天 50 张
      return NextResponse.json(
        { error: "Daily upload limit reached (50 photos)" },
        { status: 429 },
      );
    }
    // 3. 文件校验
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "others";
    const signature = formData.get("signature") as string;
    const serviceKind = formData.get("serviceKind") as ServicePhotoKind;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      // 限制 5MB
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }
    // 4. 执行上传
    const { url, fileKey } = await uploadToCloudinary(file, type);

    const newRecord = await prisma.attachment.create({
      data: {
        userId: session.user.id,
        url,
        fileKey,
        signature,
        serviceKind,
        status: 0,
        order: 0,
      },
    });
    // 5. 返回完整的数据库记录给前端
    return NextResponse.json(newRecord);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
