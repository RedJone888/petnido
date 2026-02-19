"use client";

import { useState, ChangeEvent, useRef } from "react";
import { Camera, X, GripVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { getFileSignature } from "@/domain/attachment/getFileSignature";
import { uploadSingleImage } from "@/domain/attachment/upload";
import { ImageItem } from "@/domain/attachment/type";
import Spinner from "@/components/ui/Spinner";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import cn from "@/lib/cn";

function SortableImage({
  img,
  onRemove,
  size = "md",
}: {
  img: ImageItem;
  onRemove: (id: string) => void;
  size?: "sm" | "md";
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
    touchAction: "none",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "shrink-0 rounded-xl group/img relative",
        "aspect-square border border-gray-200 overflow-hidden",
        size === "sm" ? "w-16 h-16" : "w-24 h-24",
      )}
    >
      <img
        src={img.url}
        alt="Uploaded"
        className={`h-full w-full object-cover ${img.isUploading ? "opacity-50" : ""}`}
      />
      {img.isUploading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="w-4 h-4" className="text-gray-400" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 transition-colors group-hover/img:bg-black/20">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 cursor-grab active:cursor-grabbing rounded-full bg-white/90 p-1 text-gray-600 shadow-sm opacity-0 transition-opacity group-hover/img:opacity-100 hover:text-purple-600"
          title="並び替え"
        >
          <GripVertical size={16} />
        </button>
      </div>
      <button
        type="button"
        // onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(img.id);
        }}
        className="absolute top-1 right-1 cursor-pointer bg-white/90 text-gray-600 shadow-sm p-1 rounded-full opacity-0 transition-opacity group-hover/img:opacity-100 hover:text-purple-600"
        title="削除"
      >
        <X size={16} />
      </button>
    </div>
  );
}

interface Props {
  value: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxCount?: number;
  folder?: string;
  serviceKind?: string;
  addClassName?: string;
  size?: "sm" | "md";
  onRemove: (id: string) => void;
}

export default function ImageUploader({
  value = [],
  onChange,
  maxCount = 12,
  folder = "others",
  serviceKind,
  addClassName = "",
  size = "md",
  onRemove,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // 1. 展示前处理
    // A. 检查剩余名额
    const currentCount = value.length;
    const remainingSlots = maxCount - currentCount;
    if (remainingSlots <= 0) {
      toast.info(`最多只能上传 ${maxCount} 张图片`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    // B. 去重
    let fileArray = Array.from(files);
    const validFiles: { file: File; signature: string }[] = [];
    let duplicateCount = 0;
    fileArray.forEach((file) => {
      const signature = getFileSignature(file);
      // 检查是否与“已上传的图片(value)”重复
      const isExistInValue = value.some(
        (uploaded) => uploaded.signature === signature,
      );
      if (isExistInValue) {
        duplicateCount++;
      } else {
        validFiles.push({ file, signature });
      }
    });
    if (duplicateCount > 0) {
      toast.info(`已自动过滤 ${duplicateCount} 张重复或已存在的图片`);
    }
    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    // C. 截断逻辑 (如果有超出最大张数的)
    const filesToUpload = validFiles.slice(0, remainingSlots);
    if (validFiles.length > remainingSlots) {
      toast.info(
        `剩余名额只有 ${remainingSlots} 张，已自动截取前 ${remainingSlots} 张。`,
      );
    }
    // 2. 乐观更新
    // A. 立即生成预览图
    const newLocalImages: ImageItem[] = Array.from(filesToUpload).map(
      (item) => ({
        id: `temp-${Math.random().toString(36).substring(2, 9)}`,
        url: URL.createObjectURL(item.file),
        isUploading: true,
        signature: item.signature,
        serviceKind,
        file: item.file,
      }),
    );
    // B. 先把这些图加到列表里展示给用户看
    const currentList = [...value, ...newLocalImages];
    onChange(currentList);
    // C. 后台静默上传
    // a. 创建一个 Promise 数组，但给每个 Promise 加一个 catch
    const uploadPromises = newLocalImages.map(async (localImg, index) => {
      try {
        if (!localImg.file) return null;
        const dbRecord = await uploadSingleImage({
          file: localImg.file,
          signature: localImg.signature,
          serviceKind: serviceKind ?? null,
          folder,
        });
        return {
          tempId: localImg.id,
          realRecord: dbRecord,
        };
      } catch (err) {
        console.error("上传失败", err);
        return { tempId: localImg.id, error: true };
      }
    });

    // b. 并发执行所有任务，等所有请求结束，把“临时卡片”替换成“真实数据”
    const results = await Promise.all(uploadPromises);
    const finalImages = currentList.map((img) => {
      const result = results.find((r) => r && r.tempId === img.id);
      if (result && result.realRecord) {
        return {
          id: result.realRecord.id,
          url: result.realRecord.url,
          fileKey: result.realRecord.fileKey,
          signature: img.signature,
          isUploading: false,
          serviceKind: result.realRecord.serviceKind,
        };
      }
      if (result && result.error) {
        return { ...img, isUploading: false, isError: true };
      }
      return img;
    });
    onChange(finalImages);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    console.log("handleDragEnd", event);
    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex((item) => item.id === active.id);
      const newIndex = value.findIndex((item) => item.id === over.id);
      onChange(arrayMove(value, oldIndex, newIndex));
    }
  };
  return (
    <DndContext
      autoScroll={false}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={value.map((i) => i.id)}
        strategy={rectSortingStrategy}
      >
        <div
          className={`flex flex-wrap items-center w-full ${size === "sm" ? "gap-1" : "gap-3"}`}
        >
          {value.map((img) => (
            <SortableImage
              key={img.id}
              img={img}
              onRemove={onRemove}
              size={size}
            />
          ))}
          {value.length < maxCount && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "shrink-0 rounded-xl",
                "border-2 border-gray-200 border-dashed cursor-pointer",
                "flex flex-col items-center justify-center",
                "hover:bg-gray-50 text-gray-400",
                size === "sm" ? "w-16 h-16" : "h-24 w-24",
                addClassName,
              )}
            >
              {size === "sm" ? (
                <Plus size={20} />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Camera size={20} />
                  <span className="mt-1 text-[10px]">写真を追加</span>
                </div>
              )}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </SortableContext>
    </DndContext>
  );
}
