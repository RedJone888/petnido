import { z } from "zod";
const email = z
  .string()
  .trim()
  .min(1, "メールアドレスを入力してください")
  .email("正しいメールアドレスを入力してください");
const password = z
  .string()
  .trim()
  .min(6, "パスワードは6文字以上で入力してください")
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/,
    "英字と数字を組み合わせて入力してください"
  );
const code = z.string().length(6);
const username = z.string().trim().min(1, "名前を入力してください");
export const stepEmailSchema = z.object({ email });
export const stepSignupLinkSchema = z.object({ email, password, username });
export const stepSignupCodeSchema = z.object({ email, username });
export const stepVerifySchema = z.object({ email, password, username, code });
export const stepLoginSchema = z.object({ email, password });
export const magicLinkSchema = z.object({ token: z.string() });
