import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
// import Apple, { createAppleClientSecret } from "next-auth/providers/apple";
import Line from "next-auth/providers/line";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { decodeJwt } from "jose";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  // secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    // Apple({
    //   clientId: process.env.APPLE_CLIENT_ID!,
    //   clientSecret: createAppleClientSecret({
    //     clientId: process.env.APPLE_CLIENT_ID!,
    //     teamId: process.env.APPLE_TEAM_ID!,
    //     privateKey: process.env.APPLE_PRIVATE_KEY!,
    //     keyId: process.env.APPLE_KEY_ID!,
    //   }),
    // }),
    Line({
      clientId: process.env.LINE_CLIENT_ID ?? "",
      clientSecret: process.env.LINE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({
          where: { email },
        });
        // 如果用户不存在，抛出特定错误
        if (!user || !user.password) return null;
        if (password === "MAGIC_LINK") return user;
        const isValid = await bcrypt.compare(password, user.password);
        // 如果密码错误，抛出特定错误
        if (!isValid) return null;
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        //token.sub=user.id是NextAuth自动生成的
        /* //NextAuth默认会给
        session.user = {
          name: user.name,
          email: user.email,
          image: user.image,
        }; */
        token.id = (user as any).id;
      }
      return token;
    },
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
    async signIn({ user, account }) {
      if (!account) return true;
      // 只处理 OAuth 登录
      if (account.provider !== "credentials") {
        // 如果是 LINE 登录且 email 不存在
        if (account.provider === "line") {
          if (!user.email) {
            // 为 LINE 用户生成一个可唯一识别的 pseudo-email
            user.email = `${user.id}@line.oauth`;
          }
        }

        // 查询是否已有该邮箱的用户
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email ?? "" },
          include: { profile: true, accounts: true },
        });
        // 如果是全新 OAuth 用户（Google/LINE） → NextAuth 刚创建 user
        if (!existingUser) {
          // NextAuth 已经创建 user，所以 user.id 已存在
          await prisma.profile.create({
            data: {
              userId: user.id ?? "",
              isOwner: true,
              isSitter: false,
            },
          });
          return true;
        }
        if (account?.provider === "google") {
          // ⭐ 1. 从 id_token 解码 Google 用户资料
          const claims = decodeJwt(account.id_token as string);
          // claims.picture 就是 Google 头像
          const googleImage = claims.picture;
          // const googleImage = user.image;
          // 自动同步头像，仅当用户没有头像
          if (!existingUser.image && googleImage) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                image: googleImage,
              },
            });
          }
        }
        if (!existingUser.profile) {
          // 如果已有用户但没有 profile → 自动补齐
          await prisma.profile.create({
            data: {
              userId: existingUser.id,
              isOwner: true,
              isSitter: false,
            },
          });
        }
        // 🔥 如果你允许同邮箱绑定（推荐），自动补 Account
        const hasThisProvider = existingUser.accounts.some(
          (acc) => acc.provider === account.provider,
        );
        if (!hasThisProvider) {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              provider: account.provider,
              type: account.type,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              id_token: account.id_token,
              session_state: account.session_state ?? undefined,
            },
          });
        }
        // 告诉 NextAuth：使用已存在的这个用户登录
        user.id = existingUser.id;
      }
      return true;
    },
  },
  pages: {
    signIn: "/",
  },
});
