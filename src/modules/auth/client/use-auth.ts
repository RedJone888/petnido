"use client";

import { trpc } from "@/utils/trpc";

export function useAuth() {
  return {
    checkEmailMutation: trpc.auth.checkEmailExist.useMutation(),
    sendVerifyCode: trpc.auth.sendVerificationCode.useMutation(),
    verifyCode: trpc.auth.verifyCode.useMutation(),
  };
}
