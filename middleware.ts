import { auth } from "@/lib/auth";
export default auth((req) => {
  // req.auth 包含了 session 信息
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  // 如果访问的是 /dashboard 开头的路径且未登录
  if (nextUrl.pathname.startsWith("/dashboard") && !isLoggedIn) {
    // 强制跳转回首页，并带上回跳参数 callbackUrl
    return Response.redirect(
      new URL("/?callbackUrl=" + nextUrl.pathname, nextUrl),
    );
  }
});
// 配置哪些路径需要经过这个中间件
export const config = {
  // 匹配所有 dashboard 及其子路由
  matcher: ["/dashboard/:path*"],
};
