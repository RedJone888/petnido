import { NeedStatus } from "@prisma/client";
import { isBefore, parseISO } from "date-fns";
import { NeedDisplayStatus } from "./constant";

export const getNeedDisplayKey = (
  status: NeedStatus,
  endDate: string | Date,
): NeedDisplayStatus => {
  if (status === NeedStatus.OPEN) {
    const isExpired = isBefore(
      typeof endDate === "string" ? parseISO(endDate) : endDate,
      new Date(),
    );
    return isExpired ? "EXPIRED" : "OPEN";
  }
  return status;
};
