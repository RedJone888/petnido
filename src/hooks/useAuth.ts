"use client";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

export function useAuth() {
  // 1. 检查邮箱 (Mutation)
  const checkEmailMutation = trpc.auth.checkEmailExist.useMutation();

  // 2. 发送验证码 (Mutation)
  const sendVerifyCode = trpc.auth.sendVerificationCode.useMutation();

  // 3. 验证码登录成功逻辑
  const verifyCode = trpc.auth.verifyCode.useMutation();
  return {
    checkEmailMutation,
    sendVerifyCode,
    verifyCode,
  };
}
