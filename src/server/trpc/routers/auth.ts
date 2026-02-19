//登录/注册/验证码逻辑
import { publicProcedure, router } from "@/server/trpc/trpc";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { randomInt } from "crypto";
import { addHours } from "date-fns";
import { sendEmail } from "@/lib/email";
import {
  stepEmailSchema,
  stepSignupLinkSchema,
  stepSignupCodeSchema,
  stepLoginSchema,
  magicLinkSchema,
  stepVerifySchema,
} from "@/lib/zod/auth";

export const authRouter = router({
  checkEmailExist: publicProcedure
    .input(stepEmailSchema)
    .query(async ({ ctx, input }) => {
      try {
        const user = await ctx.prisma.user.findUnique({
          where: { email: input.email },
        });
        return { exists: !!user };
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "EMAIL_CHECK_FAILED",
        });
      }
    }),
  // sendVerificationLink: publicProcedure
  //   .input(stepSignupSchema)
  //   .mutation(async ({ input }) => {
  //     const hashed = await bcrypt.hash(input.password, 10);
  //     const payload = {
  //       email: input.email,
  //       password: hashed,
  //       username: input.username,
  //     };
  //     const token = Buffer.from(JSON.stringify(payload)).toString("base64");
  //     await prisma.verificationToken.create({
  //       data: {
  //         identifier: input.email,
  //         token,
  //         expires: addHours(new Date(), 1),
  //       },
  //     });

  //     const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;

  //     await sendEmail({
  //       to: input.email,
  //       subject: "PetNido アカウントの確認",
  //       html: `<p>${input.username}さん、こんにちは。</p>

  //       <p>PetNido へのご登録ありがとうございます</p>。
  //       <p>以下のリンクをクリックして、メールアドレスの認証を完了してください：<br/>
  //         <a href="${verifyUrl}">${verifyUrl}</a>
  //       </p>

  //       <p>この手続きを行っていない場合は、本メールは破棄していただいて問題ありません。</p>

  //       <p>今後とも PetNido をよろしくお願いいたします。</p>

  //       <p>PetNido サポートチーム</p>`,
  //     });

  //     return true;
  //   }),
  // verifyMagicLink: publicProcedure
  //   .input(magicLinkSchema)
  //   .mutation(async ({ input }) => {
  //     const record = await prisma.verificationToken.findUnique({
  //       where: { token: input.token },
  //     });

  //     if (!record) throw new Error("無効なリンクです");
  //     const { email, password, username } = JSON.parse(
  //       Buffer.from(record.token, "base64").toString()
  //     );
  //     // 创建 user + profile
  //     const user = await prisma.user.create({
  //       data: {
  //         email,
  //         password,
  //         profile: {
  //           create: {
  //             displayName: username,
  //             isOwner: true,
  //             isSitter: false,
  //           },
  //         },
  //       },
  //     });

  //     // 删除 token
  //     await prisma.verificationToken.delete({
  //       where: { token: input.token },
  //     });

  //     return { email: user.email };
  //   }),
  sendVerificationCode: publicProcedure
    .input(stepSignupCodeSchema)
    .mutation(async ({ ctx, input }) => {
      const code = randomInt(100000, 999999).toString();
      // 1) 写入 / 更新 token
      try {
        await ctx.prisma.verificationToken.upsert({
          where: {
            identifier_token: {
              identifier: input.email,
              token: code,
            },
          },
          update: {
            expires: new Date(Date.now() + 10 * 60 * 1000),
          },
          create: {
            identifier: input.email,
            token: code,
            expires: new Date(Date.now() + 10 * 60 * 1000),
          },
        });
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "TOKEN_SAVE_FAILED",
        });
      }
      // 2) 发送邮件
      try {
        await sendEmail({
          to: input.email,
          subject: "PetNido 会員登録コード",
          html: `
          <div style="font-family:Arial; font-size:14px; color:#333">
            <p>${input.username}さん、こんにちは。</p>
            <p>PetNido へのご登録ありがとうございます</p>。
            <p>以下の認証コードを入力してください：</p>
            <h2 style="font-size:28px; letter-spacing:4px;">${code}</h2>
            <p>10分以内にご入力ください。</p>
            <p>この手続きを行っていない場合は、本メールは破棄していただいて問題ありません。</p>
            <p>今後とも PetNido をよろしくお願いいたします。</p>
            <p>PetNido サポートチーム</p>
          </div>`,
        });
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "EMAIL_SEND_FAILED",
        });
      }
      return true;
    }),
  verifyCode: publicProcedure
    .input(stepVerifySchema)
    .mutation(async ({ ctx, input }) => {
      const { username, password, email, code } = input;
      // 1) 查验证码
      const record = await ctx.prisma.verificationToken.findUnique({
        where: {
          identifier_token: {
            identifier: email,
            token: code,
          },
        },
      });
      if (!record || record.token !== code) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "INVALID_CODE",
        });
      }
      // 2) 创建用户
      const hashed = await bcrypt.hash(password, 10);
      let user;
      try {
        user = await ctx.prisma.user.create({
          data: {
            email,
            password: hashed,
            name: username,
            profile: {
              create: {
                isOwner: true,
                isSitter: false,
              },
            },
          },
        });
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "USER_CREATE_FAILED",
        });
      }
      // 3) 删除 token（错误不影响主流程）
      try {
        await ctx.prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: input.email,
              token: input.code,
            },
          },
        });
      } catch (e) {
        // 不抛错
        console.warn("Failed to delete verification token", e);
      }
      // 4) 正常返回
      return { email: user.email };
    }),
});
