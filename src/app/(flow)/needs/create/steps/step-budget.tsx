"use client";

import { PiCheck, PiWarningCircle } from "react-icons/pi";
import { useLanguage } from "@/components/providers/language-provider";
import {
  CurrencyPicker,
  supportedCurrencies,
  type SupportedCurrency,
} from "@/components/ui/currency-picker";
import type { BudgetDraft, CareType, SupplyCostMode } from "@/domain/publishing/legacy-need-draft-v3";
import cn from "@/lib/cn";
import { BudgetChoice, CompactMoneyField, currencySymbol, currencyUnitLabel } from "../guided-need-flow-shared";

export function StepBudget({
  careType,
  totalVisits,
  totalNights,
  transport,
  sitterSupplyCount,
  supplyCostMode,
  onSupplyCostModeChange,
  value,
  onChange,
  showValidation,
}: {
  careType: CareType;
  totalVisits: number;
  totalNights: number;
  transport: string;
  sitterSupplyCount: number;
  supplyCostMode: SupplyCostMode;
  onSupplyCostModeChange: (value: SupplyCostMode) => void;
  value: BudgetDraft;
  onChange: (value: BudgetDraft) => void;
  showValidation: boolean;
}) {
  const { t, lang } = useLanguage();
  const copy = t.core.needPublishingAdvanced.budget;
  const itemCountLabel = (count: number) =>
    copy.sitterItems
      .replace("{n}", String(count))
      .replace("{item}", count === 1 ? copy.item : copy.items);
  const symbol = currencySymbol(value.currency);
  const currencyLabel = currencyUnitLabel(value.currency);
  const selectedCurrency = supportedCurrencies.includes(
    value.currency as SupportedCurrency,
  )
    ? (value.currency as SupportedCurrency)
    : "JPY";
  const visitCopy = {
    en: {
      careFee: "Care fee",
      perVisit: "per visit",
      fixedCare: "Fixed amount",
      rangeCare: "Price range",
      discussCare: "Discuss later",
      careMethod: "Pricing method",
      allowSuggestions: "Open to sitter price suggestions",
      travelFee: "Travel fee",
      fixedTravel: "Fixed allowance",
      actualTravel: "Reimburse actual cost",
      noTravel: "No travel allowance",
      travelMethod: "Travel cost arrangement",
      estimateTitle: "Budget summary",
      totalVisitsLabel: "Total visits",
      careFeePerVisitLabel: "Care fee per visit",
      travelFeePerVisitLabel: "Travel fee per visit",
      estimatedTotalLabel: "Estimated total",
      excludingTravelCosts: "excluding travel costs",
      excludingCareFee: "excluding care fee",
      estimateEquals: "Estimated total =",
      totalVisitsTerm: "total visits",
      careFeeTerm: "care fee",
      careFeeRangeTerm: "care fee range",
      careFeeDiscussedTerm: "care fee to be discussed",
      travelFeeTerm: "travel fee",
      visits: totalVisits === 1 ? "1 visit" : `${totalVisits} visits`,
      addDates: "Complete the Dates step to calculate the total.",
      addCareCost: "Enter a care cost to calculate the total.",
      addTravelCost: "Enter the fixed travel allowance to calculate the total.",
      discussed: "To be discussed",
      actualExcluded: "Actual travel costs are reimbursed separately and are not included.",
      discussedCareExcluded: "The care fee is still to be discussed and is not included.",
      negotiableShort: "Negotiable",
      negotiable: "The care fee is open to negotiation.",
    },
    zh: {
      careFee: "照护费用",
      perVisit: "每次上门",
      fixedCare: "固定金额",
      rangeCare: "费用范围",
      discussCare: "之后讨论",
      careMethod: "计费方式",
      allowSuggestions: "接受服务者的价格建议",
      travelFee: "交通费用",
      fixedTravel: "提供固定费用",
      actualTravel: "实报实销",
      noTravel: "不提供交通费",
      travelMethod: "交通费处理方式",
      estimateTitle: "预算摘要",
      totalVisitsLabel: "总上门次数",
      careFeePerVisitLabel: "单次照护费",
      travelFeePerVisitLabel: "单次交通费",
      estimatedTotalLabel: "预计总额",
      excludingTravelCosts: "不包含交通费",
      excludingCareFee: "不包含照护费",
      estimateEquals: "预计总价 =",
      totalVisitsTerm: "总上门次数",
      careFeeTerm: "照护费",
      careFeeRangeTerm: "照护费范围",
      careFeeDiscussedTerm: "待协商的照护费",
      travelFeeTerm: "交通费",
      visits: `${totalVisits} 次上门`,
      addDates: "完成日期步骤后即可计算总费用。",
      addCareCost: "填写照护费用后即可计算总费用。",
      addTravelCost: "填写每次上门的固定交通费后即可计算总费用。",
      discussed: "之后讨论",
      actualExcluded: "交通费实报实销，未计入本次估算。",
      discussedCareExcluded: "照护费仍待协商，未计入该金额。",
      negotiableShort: "可协商",
      negotiable: "照护费可与服务者协商。",
    },
    ja: {
      careFee: "お世話料金",
      perVisit: "訪問1回あたり",
      fixedCare: "固定金額",
      rangeCare: "料金範囲",
      discussCare: "後で相談",
      careMethod: "料金設定",
      allowSuggestions: "シッターからの料金提案を受け付ける",
      travelFee: "交通費",
      fixedTravel: "固定額を支給",
      actualTravel: "実費を精算",
      noTravel: "交通費なし",
      travelMethod: "交通費の扱い",
      estimateTitle: "料金概要",
      totalVisitsLabel: "訪問回数",
      careFeePerVisitLabel: "1回あたりのお世話料金",
      travelFeePerVisitLabel: "1回あたりの交通費",
      estimatedTotalLabel: "見積合計",
      excludingTravelCosts: "交通費を含まない",
      excludingCareFee: "お世話料金を含まない",
      estimateEquals: "見積合計 =",
      totalVisitsTerm: "訪問回数",
      careFeeTerm: "お世話料金",
      careFeeRangeTerm: "お世話料金の範囲",
      careFeeDiscussedTerm: "相談して決めるお世話料金",
      travelFeeTerm: "交通費",
      visits: `${totalVisits}回の訪問`,
      addDates: "日程ステップを完了すると合計を計算できます。",
      addCareCost: "お世話料金を入力すると合計を計算できます。",
      addTravelCost: "訪問1回あたりの固定交通費を入力してください。",
      discussed: "後で相談",
      actualExcluded: "交通費は実費精算となり、この見積には含まれません。",
      discussedCareExcluded: "お世話料金は相談中のため、この金額には含まれません。",
      negotiableShort: "相談可",
      negotiable: "お世話料金はシッターと相談できます。",
    },
  }[lang];
  const boardingCopy = {
    en: {
      careFee: "Care fee",
      perNight: "per night",
      pricingMethod: "Pricing method",
      fixedCare: "Fixed amount",
      rangeCare: "Price range",
      discussCare: "Discuss later",
      supplyFee: "Supply costs",
      supplyMethod: "Supply cost arrangement",
      transportFee: "Pickup & drop-off costs",
      transportMethod: "Travel cost arrangement",
      summary: "Budget summary",
      nights: "Total nights",
      carePerNight: "Care fee per night",
      supplies: "Supply costs",
      transport: "Pickup & drop-off costs",
      estimatedTotal: "Estimated total",
      estimateEquals: "Estimated total =",
      careTerm: "care fee",
      nightsTerm: "nights",
      suppliesTerm: "supplies",
      transportTerm: "pickup & drop-off",
      discussed: "To be discussed",
      excludedCare: "excluding the care fee",
      negotiableShort: "Negotiable",
      addDates: "Complete the Dates step to calculate the total.",
    },
    zh: {
      careFee: "照护费用",
      perNight: "每晚",
      pricingMethod: "计费方式",
      fixedCare: "固定金额",
      rangeCare: "费用范围",
      discussCare: "之后讨论",
      supplyFee: "物资费用",
      supplyMethod: "物资费用处理方式",
      transportFee: "接送费用",
      transportMethod: "接送费用处理方式",
      summary: "预算摘要",
      nights: "寄养晚数",
      carePerNight: "每晚照护费",
      supplies: "物资费用",
      transport: "接送费用",
      estimatedTotal: "预计总额",
      estimateEquals: "预计总价 =",
      careTerm: "每晚照护费",
      nightsTerm: "寄养晚数",
      suppliesTerm: "物资费",
      transportTerm: "接送费",
      discussed: "之后讨论",
      excludedCare: "不包含照护费",
      negotiableShort: "可协商",
      addDates: "完成日期步骤后即可计算总费用。",
    },
    ja: {
      careFee: "お世話料金",
      perNight: "1泊あたり",
      pricingMethod: "料金設定",
      fixedCare: "固定金額",
      rangeCare: "料金範囲",
      discussCare: "後で相談",
      supplyFee: "物品費",
      supplyMethod: "物品費の扱い",
      transportFee: "送迎費",
      transportMethod: "送迎費の扱い",
      summary: "料金概要",
      nights: "宿泊数",
      carePerNight: "1泊あたりのお世話料金",
      supplies: "物品費",
      transport: "送迎費",
      estimatedTotal: "見積合計",
      estimateEquals: "見積合計 =",
      careTerm: "お世話料金",
      nightsTerm: "宿泊数",
      suppliesTerm: "物品費",
      transportTerm: "送迎費",
      discussed: "後で相談",
      excludedCare: "お世話料金を含まない",
      negotiableShort: "相談可",
      addDates: "日程ステップを完了すると合計を計算できます。",
    },
  }[lang];
  const customCopy = {
    en: {
      serviceFee: "Service fee",
      total: "total",
      pricingMethod: "Pricing method",
      fixedCare: "Fixed amount",
      rangeCare: "Price range",
      discussCare: "Discuss later",
      summary: "Budget summary",
      estimatedTotal: "Estimated total",
      totalServiceFee: "Service fee",
      negotiableShort: "Negotiable",
      discussed: "To be discussed",
    },
    zh: {
      serviceFee: "服务费用",
      total: "总计",
      pricingMethod: "计费方式",
      fixedCare: "固定金额",
      rangeCare: "费用范围",
      discussCare: "之后讨论",
      summary: "预算摘要",
      estimatedTotal: "预计总额",
      totalServiceFee: "服务费用",
      negotiableShort: "可协商",
      discussed: "之后讨论",
    },
    ja: {
      serviceFee: "依頼料金",
      total: "合計",
      pricingMethod: "料金設定",
      fixedCare: "固定金額",
      rangeCare: "料金範囲",
      discussCare: "後で相談",
      summary: "料金概要",
      estimatedTotal: "見積合計",
      totalServiceFee: "依頼料金",
      negotiableShort: "相談可",
      discussed: "後で相談",
    },
  }[lang];
  const unit =
    careType === "visit"
      ? visitCopy.perVisit
      : careType === "boarding"
        ? boardingCopy.perNight
        : customCopy.total;
  const visitTravelPerUnit =
    value.travelMode === "fixed" ? Number(value.travelAmount || 0) : 0;
  const visitEstimateMinimum =
    (Number(value.amount || 0) + visitTravelPerUnit) * totalVisits;
  const visitEstimateMaximum =
    (Number(value.maximum || 0) + visitTravelPerUnit) * totalVisits;
  const visitCareEstimateReady =
    value.mode === "open" ||
    (Number(value.amount) > 0 &&
      (value.mode !== "range" || Number(value.maximum) > Number(value.amount)));
  const visitTravelEstimateReady =
    value.travelMode !== "fixed" || Number(value.travelAmount) > 0;
  const visitEstimateReady =
    totalVisits > 0 &&
    visitCareEstimateReady &&
    visitTravelEstimateReady;
  const visitEstimateLabel =
    value.mode === "open"
      ? value.travelMode === "fixed"
        ? `${symbol}${(visitTravelPerUnit * totalVisits).toLocaleString()}`
        : visitCopy.discussed
      : value.mode === "range"
        ? `${symbol}${visitEstimateMinimum.toLocaleString()}–${symbol}${visitEstimateMaximum.toLocaleString()}`
        : `${symbol}${visitEstimateMinimum.toLocaleString()}`;
  const visitCarePerVisitLabel =
    value.mode === "open"
      ? visitCopy.discussed
      : value.mode === "range"
        ? Number(value.amount) > 0 && Number(value.maximum) > Number(value.amount)
          ? `${symbol}${Number(value.amount).toLocaleString()}–${symbol}${Number(value.maximum).toLocaleString()}`
          : "—"
        : Number(value.amount) > 0
          ? `${symbol}${Number(value.amount).toLocaleString()}`
          : "—";
  const visitTravelPerVisitLabel =
    value.travelMode === "fixed"
      ? Number(value.travelAmount) > 0
        ? `${symbol}${Number(value.travelAmount).toLocaleString()}`
        : "—"
      : value.travelMode === "actual"
        ? visitCopy.actualTravel
        : `${symbol}0`;
  const visitCarePerVisitIsAmount =
    (value.mode === "exact" && Number(value.amount) > 0) ||
    (value.mode === "range" &&
      Number(value.amount) > 0 &&
      Number(value.maximum) > Number(value.amount));
  const visitTravelPerVisitIsAmount =
    value.travelMode === "none" ||
    (value.travelMode === "fixed" && Number(value.travelAmount) > 0);
  const visitCareFormulaTerm = visitCopy.careFeeTerm;
  const visitFormulaPrefix = visitCopy.estimateEquals;
  const visitEstimateFormula =
    value.mode === "open" && value.travelMode === "fixed"
      ? `${visitCopy.estimateEquals} ${visitCopy.travelFeeTerm} × ${visitCopy.totalVisitsTerm}`
      : value.travelMode === "fixed"
        ? `${visitFormulaPrefix} (${visitCareFormulaTerm} + ${visitCopy.travelFeeTerm}) × ${visitCopy.totalVisitsTerm}`
        : `${visitFormulaPrefix} ${visitCareFormulaTerm} × ${visitCopy.totalVisitsTerm}`;
  const amountError =
    showValidation && Number(value.amount) <= 0
      ? value.mode === "range"
        ? copy.errors.minimum
        : copy.errors.amount
      : "";
  const rangeOrderError =
    value.mode === "range" &&
    value.amount !== "" &&
    value.maximum !== "" &&
    Number(value.maximum) <= Number(value.amount)
      ? copy.errors.range
      : "";
  const maximumError =
    rangeOrderError ||
    (showValidation && value.mode === "range" && Number(value.maximum) <= 0
      ? copy.errors.maximum
      : "");
  const travelAmountError =
    showValidation &&
    value.travelMode === "fixed" &&
    Number(value.travelAmount) <= 0
      ? careType === "boarding"
        ? copy.errors.travelTotal
        : copy.errors.travelVisit
      : "";
  const supplyAmountError =
    showValidation &&
    careType === "boarding" &&
    sitterSupplyCount > 0 &&
    supplyCostMode === "fixed" &&
    Number(value.supplyAmount) <= 0
      ? copy.errors.supply
      : "";
  const boardingTransportNeedsBudget =
    careType === "boarding" &&
    (transport === "sitter" || transport === "split");
  const boardingTransportModeError =
    showValidation &&
    boardingTransportNeedsBudget &&
    value.travelMode === "none";
  const visitSectionClass = "space-y-2.5";
  const visitSectionHeaderClass = "flex items-baseline gap-2";
  const visitLabelClass =
    "text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]";
  const visitUnitClass =
    "text-[11px] font-semibold normal-case tracking-normal text-[#a18469]";
  const visitChoiceLabelClass =
    "mb-2 text-xs font-bold text-[#514a58]";
  const visitSectionBodyClass =
    "w-fit max-w-full rounded-[16px] border border-[#e8e1ea] bg-white px-5 py-5 sm:px-6";

  const boardingFixedSupply =
    sitterSupplyCount > 0 && supplyCostMode === "fixed"
      ? Number(value.supplyAmount || 0)
      : 0;
  const boardingFixedTransport =
    boardingTransportNeedsBudget && value.travelMode === "fixed"
      ? Number(value.travelAmount || 0)
      : 0;
  const boardingKnownAdditional =
    boardingFixedSupply + boardingFixedTransport;
  const boardingEstimateMinimum =
    Number(value.amount || 0) * totalNights + boardingKnownAdditional;
  const boardingEstimateMaximum =
    Number(value.maximum || 0) * totalNights + boardingKnownAdditional;
  const boardingSupplyEstimateReady =
    sitterSupplyCount === 0 ||
    supplyCostMode !== "fixed" ||
    Number(value.supplyAmount) > 0;
  const boardingTravelEstimateReady =
    !boardingTransportNeedsBudget ||
    (value.travelMode !== "none" &&
      (value.travelMode !== "fixed" || Number(value.travelAmount) > 0));
  const boardingEstimateReady =
    totalNights > 0 &&
    visitCareEstimateReady &&
    boardingSupplyEstimateReady &&
    boardingTravelEstimateReady;
  const boardingEstimateLabel =
    value.mode === "open"
      ? boardingKnownAdditional > 0
        ? `${symbol}${boardingKnownAdditional.toLocaleString()}`
        : boardingCopy.discussed
      : value.mode === "range"
        ? `${symbol}${boardingEstimateMinimum.toLocaleString()}–${symbol}${boardingEstimateMaximum.toLocaleString()}`
        : `${symbol}${boardingEstimateMinimum.toLocaleString()}`;
  const boardingCarePerNightLabel =
    value.mode === "open"
      ? boardingCopy.discussed
      : value.mode === "range"
        ? Number(value.amount) > 0 && Number(value.maximum) > Number(value.amount)
          ? `${symbol}${Number(value.amount).toLocaleString()}–${symbol}${Number(value.maximum).toLocaleString()}`
          : "—"
        : Number(value.amount) > 0
          ? `${symbol}${Number(value.amount).toLocaleString()}`
          : "—";
  const boardingSupplyLabel =
    sitterSupplyCount === 0
      ? `${symbol}0`
      : supplyCostMode === "fixed"
        ? Number(value.supplyAmount) > 0
          ? `${symbol}${Number(value.supplyAmount).toLocaleString()}`
          : "—"
        : supplyCostMode === "reimburse"
          ? copy.reimburse
          : copy.discussAfter;
  const boardingTransportLabel = !boardingTransportNeedsBudget
    ? transport === "taxi"
      ? copy.taxiStatus
      : transport === "owner"
        ? `${symbol}0`
        : copy.handoverUnconfirmed
    : value.travelMode === "fixed"
      ? Number(value.travelAmount) > 0
        ? `${symbol}${Number(value.travelAmount).toLocaleString()}`
        : "—"
      : value.travelMode === "actual"
        ? copy.actual
        : value.travelMode === "discuss"
          ? copy.discussAfter
          : "—";
  const boardingFormulaTerms = [
    value.mode === "open"
      ? ""
      : `${boardingCopy.careTerm} × ${boardingCopy.nightsTerm}`,
    boardingFixedSupply > 0 ? boardingCopy.suppliesTerm : "",
    boardingFixedTransport > 0 ? boardingCopy.transportTerm : "",
  ].filter(Boolean);
  const boardingEstimateFormula = `${boardingCopy.estimateEquals} ${
    boardingFormulaTerms.length
      ? boardingFormulaTerms.join(" + ")
      : boardingCopy.discussed
  }`;

  const customEstimateReady =
    value.mode === "open" ||
    (Number(value.amount) > 0 &&
      (value.mode !== "range" || Number(value.maximum) > Number(value.amount)));

  const customEstimateLabel =
    value.mode === "open"
      ? customCopy.discussed
      : value.mode === "range"
        ? Number(value.amount) > 0 && Number(value.maximum) > Number(value.amount)
          ? `${symbol}${Number(value.amount).toLocaleString()}–${symbol}${Number(value.maximum).toLocaleString()}`
          : "—"
        : Number(value.amount) > 0
          ? `${symbol}${Number(value.amount).toLocaleString()}`
          : "—";

  const customCareFeeIsAmount =
    (value.mode === "exact" && Number(value.amount) > 0) ||
    (value.mode === "range" &&
      Number(value.amount) > 0 &&
      Number(value.maximum) > Number(value.amount));

  if (careType === "boarding") {
    return (
      <div className="grid w-full items-start justify-start gap-4 lg:grid-cols-[fit-content(60%)_fit-content(40%)]">
        <div className="min-w-0 space-y-2.5 lg:col-start-1">
          <label htmlFor="budget-currency" className={visitLabelClass}>
            {copy.currency}
          </label>
          <div className="w-fit max-w-full">
            <CurrencyPicker
              id="budget-currency"
              value={selectedCurrency}
              onChange={(currency) => onChange({ ...value, currency })}
              ariaLabel={copy.currency}
              className="w-[300px] max-w-full"
            />
          </div>
        </div>

        <section className={cn(visitSectionClass, "min-w-0 lg:col-start-1")}>
          <div className={visitSectionHeaderClass}>
            <h3 className="flex items-center gap-2">
              <span className={visitLabelClass}>{boardingCopy.careFee}</span>
              <span className={visitUnitClass}>{boardingCopy.perNight}</span>
            </h3>
          </div>
          <div className={visitSectionBodyClass}>
            <p className={visitChoiceLabelClass}>
              {boardingCopy.pricingMethod}
            </p>
            <div className="flex flex-wrap gap-2">
              <BudgetChoice
                label={boardingCopy.fixedCare}
                active={value.mode === "exact"}
                onClick={() => onChange({ ...value, mode: "exact" })}
              />
              <BudgetChoice
                label={boardingCopy.rangeCare}
                active={value.mode === "range"}
                onClick={() => onChange({ ...value, mode: "range" })}
              />
              <BudgetChoice
                label={boardingCopy.discussCare}
                active={value.mode === "open"}
                onClick={() => onChange({ ...value, mode: "open" })}
              />
            </div>
            {value.mode === "exact" && (
              <div className="mt-3 flex flex-wrap items-start gap-x-5 gap-y-3">
                <div className="w-full max-w-[268px]">
                  <CompactMoneyField
                    label={`Budget · ${unit}`}
                    labelVariant="muted"
                    symbol={symbol}
                    currencyLabel={currencyLabel}
                    value={value.amount}
                    onChange={(amount) => onChange({ ...value, amount })}
                    error={amountError}
                  />
                </div>
                <label className="block w-full sm:w-[250px] sm:pt-7">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        exactNegotiable: !value.exactNegotiable,
                      })
                    }
                    className={cn(
                      "flex h-10 w-auto items-center gap-2 text-left text-sm font-semibold transition",
                      value.exactNegotiable
                        ? "text-[var(--primary-strong)]"
                        : "text-[#706a78]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        value.exactNegotiable
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                          : "border-[#bcb5bf] bg-white",
                      )}
                    >
                      {value.exactNegotiable && <PiCheck size={10} />}
                    </span>
                    <span>{copy.allowSuggestions}</span>
                  </button>
                </label>
              </div>
            )}
            {value.mode === "range" && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-[268px_268px]">
                <CompactMoneyField
                  label={`${copy.from} · ${unit}`}
                  labelVariant="muted"
                  symbol={symbol}
                  currencyLabel={currencyLabel}
                  value={value.amount}
                  onChange={(amount) => onChange({ ...value, amount })}
                  error={amountError}
                />
                <CompactMoneyField
                  label={`${copy.upTo} · ${unit}`}
                  labelVariant="muted"
                  symbol={symbol}
                  currencyLabel={currencyLabel}
                  value={value.maximum}
                  onChange={(maximum) => onChange({ ...value, maximum })}
                  error={maximumError}
                />
              </div>
            )}
          </div>
        </section>

        <section className={cn(visitSectionClass, "min-w-0 lg:col-start-1")}>
          <div className={visitSectionHeaderClass}>
            <h3 className="flex items-center gap-2">
              <span className={visitLabelClass}>{boardingCopy.supplyFee}</span>
              <span className={visitUnitClass}>
                {sitterSupplyCount > 0
                  ? itemCountLabel(sitterSupplyCount)
                  : copy.noSitterItems}
              </span>
            </h3>
          </div>
          <div className={visitSectionBodyClass}>
            {sitterSupplyCount > 0 ? (
              <>
                <p className={visitChoiceLabelClass}>
                  {boardingCopy.supplyMethod}
                </p>
                <div className="flex flex-wrap gap-2">
                  <BudgetChoice
                    label={copy.fixedAllowance}
                    active={supplyCostMode === "fixed"}
                    onClick={() => onSupplyCostModeChange("fixed")}
                  />
                  <BudgetChoice
                    label={copy.reimburse}
                    active={supplyCostMode === "reimburse"}
                    onClick={() => onSupplyCostModeChange("reimburse")}
                  />
                  <BudgetChoice
                    label={copy.discussAfter}
                    active={supplyCostMode === "discuss"}
                    onClick={() => onSupplyCostModeChange("discuss")}
                  />
                </div>
                {supplyCostMode === "fixed" && (
                  <div className="mt-3 w-full max-w-[268px]">
                    <CompactMoneyField
                      label={copy.supplyAllowance}
                      labelVariant="muted"
                      symbol={symbol}
                      currencyLabel={currencyLabel}
                      value={value.supplyAmount}
                      onChange={(supplyAmount) =>
                        onChange({ ...value, supplyAmount })
                      }
                      error={supplyAmountError}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm leading-6 text-[#817a85]">
                {copy.noSupplyCosts}
              </p>
            )}
          </div>
        </section>

        <section
          className={cn(
            visitSectionClass,
            "min-w-0 lg:col-start-1",
            boardingTransportModeError && "text-danger-text",
          )}
        >
          <div className={visitSectionHeaderClass}>
            <h3 className="flex items-center gap-2">
              <span className={visitLabelClass}>
                {boardingCopy.transportFee}
              </span>
              <span className={visitUnitClass}>
                {transport === "sitter"
                  ? copy.bothTrips
                  : transport === "split"
                    ? copy.sitterHandledTrip
                    : transport === "taxi"
                    ? copy.taxiStatus
                    : transport === "owner"
                      ? copy.noSitterTrip
                      : copy.handoverUnconfirmed}
              </span>
            </h3>
          </div>
          <div
            className={cn(
              visitSectionBodyClass,
              boardingTransportModeError && "border-danger-border",
            )}
          >
            {boardingTransportNeedsBudget ? (
              <div className="relative">
                <p className={visitChoiceLabelClass}>
                  {boardingCopy.transportMethod}
                </p>
                <div className="flex flex-wrap gap-2">
                  <BudgetChoice
                    label={copy.fixedAllowance}
                    active={value.travelMode === "fixed"}
                    onClick={() =>
                      onChange({ ...value, travelMode: "fixed" })
                    }
                  />
                  <BudgetChoice
                    label={copy.actual}
                    active={value.travelMode === "actual"}
                    onClick={() =>
                      onChange({ ...value, travelMode: "actual" })
                    }
                  />
                  <BudgetChoice
                    label={copy.discussAfter}
                    active={value.travelMode === "discuss"}
                    onClick={() =>
                      onChange({ ...value, travelMode: "discuss" })
                    }
                  />
                </div>
                {value.travelMode === "fixed" && (
                  <div className="mt-3 w-full max-w-[268px]">
                    <CompactMoneyField
                      label={
                        transport === "split"
                          ? copy.sitterHandledTrip
                          : copy.bothTrips
                      }
                      labelVariant="muted"
                      symbol={symbol}
                      currencyLabel={currencyLabel}
                      value={value.travelAmount}
                      onChange={(travelAmount) =>
                        onChange({ ...value, travelAmount })
                      }
                      error={travelAmountError}
                    />
                  </div>
                )}
                {boardingTransportModeError && (
                  <p
                    role="alert"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-danger-text"
                  >
                    <PiWarningCircle className="shrink-0" size={12} />
                    {copy.chooseTransportCosts}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm leading-6 text-[#817a85]">
                {transport === "taxi"
                  ? copy.noTaxi
                  : transport === "owner"
                    ? copy.noOwner
                    : copy.noDiscuss}
              </p>
            )}
          </div>
        </section>

        <section className="min-w-0 w-full lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:w-fit lg:min-w-[260px] lg:max-w-[40vw] lg:self-end">
          <div className="overflow-hidden rounded-[16px] border border-[#d9cdea] bg-[#f7f3fa] px-5 pb-5 shadow-[0_16px_34px_-27px_rgba(82,48,112,0.55)] sm:px-6">
            <h3 className="-mx-5 mb-4 border-b border-[#dcd0e6] bg-[#eee7f4] px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#79508b] sm:-mx-6 sm:px-6">
              {boardingCopy.summary}
            </h3>
            <div className="rounded-[14px] border border-[#dfd5e7] bg-white p-4 shadow-[0_10px_24px_-24px_rgba(65,40,84,0.75)]">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-xs font-bold text-[#514a58]">
                  {boardingCopy.estimatedTotal}
                </p>
                {value.mode === "open" && boardingKnownAdditional > 0 ? (
                  <span className="text-[10px] font-semibold text-[#806887]">
                    {boardingCopy.excludedCare}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "text-[28px] font-bold leading-tight tracking-[-0.035em]",
                    boardingEstimateReady
                      ? "text-[var(--primary)]"
                      : "text-[#817a85]",
                  )}
                >
                  {boardingEstimateReady ? boardingEstimateLabel : "—"}
                </p>
                {boardingEstimateReady &&
                value.mode === "exact" &&
                value.exactNegotiable ? (
                  <span className="inline-flex rounded-full border border-[#ead8c6] bg-[#f8efe6] px-2 py-0.5 text-[10px] font-bold text-[#8a5d34]">
                    {boardingCopy.negotiableShort}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-[11px] font-medium leading-5 text-[#776d7c]">
                {totalNights > 0
                  ? boardingEstimateFormula
                  : boardingCopy.addDates}
              </p>
            </div>
            <dl className="mt-5 space-y-3 px-1 text-xs">
              {[
                {
                  label: boardingCopy.nights,
                  displayValue: String(totalNights || "—"),
                  negotiable: false,
                },
                {
                  label: boardingCopy.carePerNight,
                  displayValue: boardingCarePerNightLabel,
                  negotiable:
                    value.mode === "exact" &&
                    value.exactNegotiable &&
                    Number(value.amount) > 0,
                },
                {
                  label: boardingCopy.supplies,
                  displayValue: boardingSupplyLabel,
                  negotiable: false,
                },
                {
                  label: boardingCopy.transport,
                  displayValue: boardingTransportLabel,
                  negotiable: false,
                },
              ].map(({ label, displayValue, negotiable }) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4"
                >
                  <dt className="font-medium text-[#706a78]">{label}</dt>
                  <dd className="flex flex-wrap items-center justify-end gap-1.5 text-right font-bold text-[#3f3945]">
                    <span>{displayValue}</span>
                    {negotiable ? (
                      <span className="inline-flex rounded-full border border-[#ead8c6] bg-[#f8efe6] px-2 py-0.5 text-[10px] font-bold text-[#8a5d34]">
                        {boardingCopy.negotiableShort}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    );
  }

  if (careType === "custom") {
    return (
      <div className="grid w-full items-start justify-start gap-4 lg:grid-cols-[fit-content(60%)_fit-content(40%)]">
        <div className="min-w-0 space-y-2.5 lg:col-start-1">
          <label htmlFor="budget-currency" className={visitLabelClass}>
            {copy.currency}
          </label>
          <div className="w-fit max-w-full">
            <CurrencyPicker
              id="budget-currency"
              value={selectedCurrency}
              onChange={(currency) => onChange({ ...value, currency })}
              ariaLabel={copy.currency}
              className="w-[300px] max-w-full"
            />
          </div>
        </div>

        <section className={cn(visitSectionClass, "min-w-0 lg:col-start-1")}>
          <div className={visitSectionHeaderClass}>
            <h3 className="flex items-center gap-2">
              <span className={visitLabelClass}>{customCopy.serviceFee}</span>
              <span className={visitUnitClass}>{customCopy.total}</span>
            </h3>
          </div>
          <div className={visitSectionBodyClass}>
            <p className={visitChoiceLabelClass}>
              {customCopy.pricingMethod}
            </p>
            <div className="flex flex-wrap gap-2">
              <BudgetChoice
                label={customCopy.fixedCare}
                active={value.mode === "exact"}
                onClick={() => onChange({ ...value, mode: "exact" })}
              />
              <BudgetChoice
                label={customCopy.rangeCare}
                active={value.mode === "range"}
                onClick={() => onChange({ ...value, mode: "range" })}
              />
              <BudgetChoice
                label={customCopy.discussCare}
                active={value.mode === "open"}
                onClick={() => onChange({ ...value, mode: "open" })}
              />
            </div>
            {value.mode === "exact" && (
              <div className="mt-3 flex flex-wrap items-start gap-x-5 gap-y-3">
                <div className="w-full max-w-[268px]">
                  <CompactMoneyField
                    label={`Budget · ${unit}`}
                    labelVariant="muted"
                    symbol={symbol}
                    currencyLabel={currencyLabel}
                    value={value.amount}
                    onChange={(amount) => onChange({ ...value, amount })}
                    error={amountError}
                  />
                </div>
                <label className="block w-full sm:w-[250px] sm:pt-7">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        exactNegotiable: !value.exactNegotiable,
                      })
                    }
                    className={cn(
                      "flex h-10 w-auto items-center gap-2 text-left text-sm font-semibold transition",
                      value.exactNegotiable
                        ? "text-[var(--primary-strong)]"
                        : "text-[#706a78]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        value.exactNegotiable
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                          : "border-[#bcb5bf] bg-white",
                      )}
                    >
                      {value.exactNegotiable && <PiCheck size={10} />}
                    </span>
                    <span>{copy.allowSuggestions}</span>
                  </button>
                </label>
              </div>
            )}
            {value.mode === "range" && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-[268px_268px]">
                <CompactMoneyField
                  label={`${copy.from} · ${unit}`}
                  labelVariant="muted"
                  symbol={symbol}
                  currencyLabel={currencyLabel}
                  value={value.amount}
                  onChange={(amount) => onChange({ ...value, amount })}
                  error={amountError}
                />
                <CompactMoneyField
                  label={`${copy.upTo} · ${unit}`}
                  labelVariant="muted"
                  symbol={symbol}
                  currencyLabel={currencyLabel}
                  value={value.maximum}
                  onChange={(maximum) => onChange({ ...value, maximum })}
                  error={maximumError}
                />
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0 w-full lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:w-fit lg:min-w-[260px] lg:max-w-[40vw] lg:self-end">
          <div className="overflow-hidden rounded-[16px] border border-[#d9cdea] bg-[#f7f3fa] px-5 pb-5 shadow-[0_16px_34px_-27px_rgba(82,48,112,0.55)] sm:px-6">
            <h3 className="-mx-5 mb-4 border-b border-[#dcd0e6] bg-[#eee7f4] px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#79508b] sm:-mx-6 sm:px-6">
              {customCopy.summary}
            </h3>
            <div className="rounded-[14px] border border-[#dfd5e7] bg-white p-4 shadow-[0_10px_24px_-24px_rgba(65,40,84,0.75)]">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-xs font-bold text-[#514a58]">
                  {customCopy.estimatedTotal}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "text-[28px] font-bold leading-tight tracking-[-0.035em]",
                    customEstimateReady
                      ? "text-[var(--primary)]"
                      : "text-[#817a85]",
                  )}
                >
                  {customEstimateReady ? customEstimateLabel : "—"}
                </p>
                {customEstimateReady &&
                value.mode === "exact" &&
                value.exactNegotiable ? (
                  <span className="inline-flex rounded-full border border-[#ead8c6] bg-[#f8efe6] px-2 py-0.5 text-[10px] font-bold text-[#8a5d34]">
                    {customCopy.negotiableShort}
                  </span>
                ) : null}
              </div>
            </div>
            <dl className="mt-5 space-y-3 px-1 text-xs">
              <div className="flex items-start justify-between gap-4">
                <dt className="font-medium text-[#706a78]">
                  {customCopy.totalServiceFee}
                </dt>
                <dd
                  className={cn(
                    "flex flex-wrap items-center justify-end gap-1.5 text-right font-bold",
                    customCareFeeIsAmount
                      ? "text-[var(--primary)]"
                      : "text-[#3f3945]",
                  )}
                >
                  <span>{customEstimateLabel}</span>
                  {value.mode === "exact" &&
                  value.exactNegotiable &&
                  Number(value.amount) > 0 ? (
                    <span className="inline-flex rounded-full border border-[#ead8c6] bg-[#f8efe6] px-2 py-0.5 text-[10px] font-bold text-[#8a5d34]">
                      {customCopy.negotiableShort}
                    </span>
                  ) : null}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid w-full items-start justify-start gap-4 lg:grid-cols-[fit-content(60%)_fit-content(40%)]">
      <div className="min-w-0 space-y-2.5 lg:col-start-1">
        <label htmlFor="budget-currency" className={visitLabelClass}>
          {copy.currency}
        </label>
        <div className="w-fit max-w-full">
          <CurrencyPicker
            id="budget-currency"
            value={selectedCurrency}
            onChange={(currency) => onChange({ ...value, currency })}
            ariaLabel={copy.currency}
            className="w-[300px] max-w-full"
          />
        </div>
      </div>

      <section className={cn(visitSectionClass, "min-w-0 lg:col-start-1")}>
        <div className={visitSectionHeaderClass}>
          <h3 className="flex items-center gap-2">
            <span className={visitLabelClass}>{visitCopy.careFee}</span>
            <span className={visitUnitClass}>{visitCopy.perVisit}</span>
          </h3>
        </div>
        <div className={visitSectionBodyClass}>
          <p className={visitChoiceLabelClass}>{visitCopy.careMethod}</p>
          <div className="flex flex-wrap gap-2">
            <BudgetChoice
              label={visitCopy.fixedCare}
              active={value.mode === "exact"}
              onClick={() => onChange({ ...value, mode: "exact" })}
            />
            <BudgetChoice
              label={visitCopy.rangeCare}
              active={value.mode === "range"}
              onClick={() => onChange({ ...value, mode: "range" })}
            />
            <BudgetChoice
              label={visitCopy.discussCare}
              active={value.mode === "open"}
              onClick={() => onChange({ ...value, mode: "open" })}
            />
          </div>
          {value.mode === "exact" && (
            <div className="mt-3 flex flex-wrap items-start gap-x-5 gap-y-3">
              <div className="w-full max-w-[268px]">
                <CompactMoneyField
                  label={`Budget · ${unit}`}
                  labelVariant="muted"
                  symbol={symbol}
                  currencyLabel={currencyLabel}
                  value={value.amount}
                  onChange={(amount) => onChange({ ...value, amount })}
                  error={amountError}
                />
              </div>
              <label className="block w-full sm:w-[250px] sm:pt-7">
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      exactNegotiable: !value.exactNegotiable,
                    })
                  }
                  className={cn(
                    "flex h-10 w-auto items-center gap-2 text-left text-sm font-semibold transition",
                    value.exactNegotiable
                      ? "text-[var(--primary-strong)]"
                      : "text-[#706a78]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      value.exactNegotiable
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : "border-[#bcb5bf] bg-white",
                    )}
                  >
                    {value.exactNegotiable && <PiCheck size={10} />}
                  </span>
                  <span>{visitCopy.allowSuggestions}</span>
                </button>
              </label>
            </div>
          )}
          {value.mode === "range" && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-[268px_268px]">
              <CompactMoneyField
                label={`${copy.from} · ${unit}`}
                labelVariant="muted"
                symbol={symbol}
                currencyLabel={currencyLabel}
                value={value.amount}
                onChange={(amount) => onChange({ ...value, amount })}
                error={amountError}
              />
              <CompactMoneyField
                label={`${copy.upTo} · ${unit}`}
                labelVariant="muted"
                symbol={symbol}
                currencyLabel={currencyLabel}
                value={value.maximum}
                onChange={(maximum) => onChange({ ...value, maximum })}
                error={maximumError}
              />
            </div>
          )}
        </div>
      </section>

      <section className={cn(visitSectionClass, "min-w-0 lg:col-start-1")}>
        <div className={visitSectionHeaderClass}>
          <h3 className="flex items-center gap-2">
            <span className={visitLabelClass}>{visitCopy.travelFee}</span>
            <span className={visitUnitClass}>{visitCopy.perVisit}</span>
          </h3>
        </div>
        <div className={visitSectionBodyClass}>
          <div className="space-y-3">
            <div>
              <p className={visitChoiceLabelClass}>
                {visitCopy.travelMethod}
              </p>
              <div className="flex flex-nowrap gap-2">
                <BudgetChoice
                  label={visitCopy.fixedTravel}
                  active={value.travelMode === "fixed"}
                  onClick={() => onChange({ ...value, travelMode: "fixed" })}
                />
                <BudgetChoice
                  label={visitCopy.actualTravel}
                  active={value.travelMode === "actual"}
                  onClick={() => onChange({ ...value, travelMode: "actual" })}
                />
                <BudgetChoice
                  label={visitCopy.noTravel}
                  active={value.travelMode === "none"}
                  onClick={() => onChange({ ...value, travelMode: "none" })}
                />
              </div>
            </div>
            {value.travelMode === "fixed" && (
              <div>
                <div className="w-full max-w-[268px]">
                  <CompactMoneyField
                    label={`Budget · ${unit}`}
                    labelVariant="muted"
                    symbol={symbol}
                    currencyLabel={currencyLabel}
                    value={value.travelAmount}
                    onChange={(travelAmount) =>
                      onChange({ ...value, travelAmount })
                    }
                    error={travelAmountError}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="min-w-0 w-full lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:w-fit lg:min-w-[260px] lg:max-w-[40vw] lg:self-end">
        <div className="overflow-hidden rounded-[16px] border border-[#d9cdea] bg-[#f7f3fa] px-5 pb-5 shadow-[0_16px_34px_-27px_rgba(82,48,112,0.55)] sm:px-6">
          <h3 className="-mx-5 mb-4 border-b border-[#dcd0e6] bg-[#eee7f4] px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#79508b] sm:-mx-6 sm:px-6">
            {visitCopy.estimateTitle}
          </h3>
          <div className="rounded-[14px] border border-[#dfd5e7] bg-white p-4 shadow-[0_10px_24px_-24px_rgba(65,40,84,0.75)]">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <p className="text-xs font-bold text-[#514a58]">
                {visitCopy.estimatedTotalLabel}
              </p>
              {value.travelMode === "actual" ||
              (value.mode === "open" && value.travelMode === "fixed") ? (
                <span className="text-[10px] font-semibold normal-case tracking-normal text-[#806887]">
                  {value.travelMode === "actual"
                    ? visitCopy.excludingTravelCosts
                    : visitCopy.excludingCareFee}
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "text-[28px] font-bold leading-tight tracking-[-0.035em]",
                  visitEstimateReady
                    ? "text-[var(--primary)]"
                    : "text-[#817a85]",
                )}
              >
                {visitEstimateReady ? visitEstimateLabel : "—"}
              </p>
              {visitEstimateReady &&
              value.mode === "exact" &&
              value.exactNegotiable ? (
                <span className="inline-flex rounded-full border border-[#ead8c6] bg-[#f8efe6] px-2 py-0.5 text-[10px] font-bold text-[#8a5d34]">
                  {visitCopy.negotiableShort}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] font-medium leading-5 text-[#776d7c]">
              {visitEstimateFormula}
            </p>
          </div>
          <dl className="mt-5 space-y-3 px-1 text-xs">
            <div className="flex items-start justify-between gap-4">
              <dt className="font-medium text-[#706a78]">
                {visitCopy.totalVisitsLabel}
              </dt>
              <dd className="text-right font-bold tabular-nums text-[var(--primary)]">
                {totalVisits}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="font-medium text-[#706a78]">
                {visitCopy.careFeePerVisitLabel}
              </dt>
              <dd
                className={cn(
                  "flex flex-wrap items-center justify-end gap-1.5 text-right font-bold",
                  visitCarePerVisitIsAmount
                    ? "text-[var(--primary)]"
                    : "text-[#3f3945]",
                )}
              >
                <span>{visitCarePerVisitLabel}</span>
                {value.mode === "exact" &&
                value.exactNegotiable &&
                Number(value.amount) > 0 ? (
                  <span className="inline-flex rounded-full border border-[#ead8c6] bg-[#f8efe6] px-2 py-0.5 text-[10px] font-bold text-[#8a5d34]">
                    {visitCopy.negotiableShort}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="font-medium text-[#706a78]">
                {visitCopy.travelFeePerVisitLabel}
              </dt>
              <dd
                className={cn(
                  "text-right font-bold",
                  visitTravelPerVisitIsAmount
                    ? "text-[var(--primary)]"
                    : "text-[#3f3945]",
                )}
              >
                {visitTravelPerVisitLabel}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

// Compatibility exports
export const BudgetScreen = StepBudget;
export const GuidedNeedBudgetStep = StepBudget;
