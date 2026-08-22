export type RecoveryKind = "AUTH" | "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "EXPIRED" | "NETWORK" | "DRAFT_CORRUPTED" | "CANCELLED" | "UNKNOWN";
export type RecoveryAction = "LOGIN" | "BACK" | "REFRESH" | "RETRY" | "DISCARD_DRAFT" | "NONE";

export type RecoveryAdvice = {
  kind: RecoveryKind;
  title: string;
  description: string;
  action: RecoveryAction;
  retryable: boolean;
  correlationId: string | null;
};

function appErrorData(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const data = "data" in error && error.data && typeof error.data === "object" ? error.data : null;
  const appError = data && "appError" in data && data.appError && typeof data.appError === "object" ? data.appError : null;
  return appError as { code?: unknown; retryable?: unknown; correlationId?: unknown } | null;
}

export function recoveryAdvice(error: unknown): RecoveryAdvice {
  const appError = appErrorData(error);
  const rawMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const code = typeof appError?.code === "string" ? appError.code : rawMessage;
  const correlationId = typeof appError?.correlationId === "string" ? appError.correlationId : null;
  const item = (kind: RecoveryKind, title: string, description: string, action: RecoveryAction, retryable = false): RecoveryAdvice => ({ kind, title, description, action, retryable, correlationId });
  if (code.includes("AUTH_REQUIRED") || code.includes("UNAUTHORIZED")) return item("AUTH", "需要重新登录", "登录状态已失效。重新登录后可以回到当前操作。", "LOGIN");
  if (code.includes("RESOURCE_NOT_FOUND")) return item("NOT_FOUND", "内容不可用", "内容可能已删除、归档或不再公开。", "BACK");
  if (code.includes("FORBIDDEN_RESOURCE_ACTION") || code.includes("FORBIDDEN")) return item("FORBIDDEN", "没有操作权限", "当前账号无权查看或修改这项内容。", "BACK");
  if (code.includes("CONFLICT") || code.includes("DRAFT_REVISION")) return item("CONFLICT", "内容已发生变化", "其他页面或操作已更新内容，请刷新最新版本后再决定。", "REFRESH", true);
  if (code.includes("EXPIRED")) return item("EXPIRED", "内容已过期", "结束时间已经过去，请返回管理页查看或修改。", "BACK");
  if (code.includes("DRAFT") && (code.includes("DAMAGED") || code.includes("CORRUPT") || code.includes("UNSUPPORTED"))) return item("DRAFT_CORRUPTED", "草稿无法安全恢复", "草稿格式损坏或版本不再支持。系统不会猜测缺失字段或覆盖有效服务端草稿。", "DISCARD_DRAFT");
  if (code.includes("CANCELLED")) return item("CANCELLED", "操作已取消", "没有内容被修改。", "NONE");
  if (/network|fetch failed|timeout|dependency_unavailable/i.test(code)) return item("NETWORK", "网络或服务暂时不可用", "当前内容已保留，可以安全重试。", "RETRY", true);
  return item("UNKNOWN", "暂时无法完成操作", "当前内容已保留。请重试；若问题持续，可提供下方请求编号。", "RETRY", true);
}
