export type AuthMailLocale = "zh" | "en" | "ja";

export function buildCodeMail(
  locale: AuthMailLocale,
  kind: "SIGN_UP" | "EMAIL_CHANGE" | "PASSWORD_RESET" | "PASSWORD_SETUP" | "ACCOUNT_LINK",
  code: string,
) {
  const labels = {
    SIGN_UP: { zh: "注册 PetNido", en: "Create your PetNido account", ja: "PetNido 会員登録" },
    EMAIL_CHANGE: { zh: "更换 PetNido 邮箱", en: "Change your PetNido email", ja: "PetNido メールアドレス変更" },
    PASSWORD_RESET: { zh: "重设 PetNido 密码", en: "Reset your PetNido password", ja: "PetNido パスワード再設定" },
    PASSWORD_SETUP: { zh: "设置 PetNido 登录密码", en: "Set your PetNido sign-in password", ja: "PetNido ログインパスワード設定" },
    ACCOUNT_LINK: { zh: "绑定 PetNido 登录方式", en: "Link a PetNido sign-in method", ja: "PetNido ログイン方法の連携" },
  }[kind][locale];
  const subject = `${labels} - ${code}`;
  return {
    subject,
    html: `<div style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.7;max-width:600px"><p>${labels}</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>This code expires in 10 minutes.</p></div>`,
  };
}
