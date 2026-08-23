"use client";

import { PiCheck, PiWarningCircle } from "react-icons/pi";
import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import {
  CurrencyPicker,
  supportedCurrencies,
  type SupportedCurrency,
} from "@/components/ui/currency-picker";
import type { BudgetDraft, CareType, SupplyCostMode } from "@/domain/publishing/legacy-need-draft-v3";
import type { NeedPricingSummary } from "@/modules/need-publishing/domain/pricing";
import {
  formatMoneyAmount,
  formatNeedPricingFormula,
} from "@/modules/need-publishing/domain/pricing";
import cn from "@/lib/cn";
import { BudgetChoice, CompactMoneyField, currencySymbol, currencyUnitLabel } from "../guided-need-flow-shared";

export function StepBudget({
  careType,
  totalVisits,
  totalNights,
  pricing,
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
  pricing: NeedPricingSummary;
  transport: string;
  sitterSupplyCount: number;
  supplyCostMode: SupplyCostMode;
  onSupplyCostModeChange: (value: SupplyCostMode) => void;
  value: BudgetDraft;
  onChange: (value: BudgetDraft) => void;
  showValidation: boolean;
}) {
  const { lang } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishingAdvanced.budget;
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
  const budgetCopy = needMessages.needPublishingClient.budget;
  const visitCopy = budgetCopy.visit;
  const boardingCopy = budgetCopy.boarding;
  const customCopy = budgetCopy.custom;
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
  const pricingEstimateLabel = pricing.isEstimateReady && pricing.estimatedTotalMinMinor !== null
    ? pricing.estimatedTotalMaxMinor !== null
      ? `${formatMoneyAmount(pricing.estimatedTotalMinMinor, pricing.currency, lang)}–${formatMoneyAmount(pricing.estimatedTotalMaxMinor, pricing.currency, lang)}`
      : formatMoneyAmount(pricing.estimatedTotalMinMinor, pricing.currency, lang)
    : careType === "boarding"
      ? boardingCopy.discussed
      : careType === "custom"
        ? customCopy.discussed
        : visitCopy.discussed;
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
  const pricingEstimateReady = pricing.isEstimateReady;
  const pricingFormula = formatNeedPricingFormula(pricing, lang);

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
                    label={`${boardingCopy.budget} · ${unit}`}
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
                    pricingEstimateReady
                      ? "text-[var(--primary)]"
                      : "text-[#817a85]",
                  )}
                >
                  {pricingEstimateReady ? pricingEstimateLabel : "—"}
                </p>
                {pricingEstimateReady &&
                value.mode === "exact" &&
                value.exactNegotiable ? (
                  <span className="inline-flex rounded-full border border-[#ead8c6] bg-[#f8efe6] px-2 py-0.5 text-[10px] font-bold text-[#8a5d34]">
                    {boardingCopy.negotiableShort}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-[11px] font-medium leading-5 text-[#776d7c]">
                {totalNights > 0
                  ? `${boardingCopy.estimateEquals} ${pricingFormula}`
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
                    label={`${customCopy.budget} · ${unit}`}
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
                    pricingEstimateReady
                      ? "text-[var(--primary)]"
                      : "text-[#817a85]",
                  )}
                >
                  {pricingEstimateReady ? pricingEstimateLabel : "—"}
                </p>
                {pricingEstimateReady &&
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
                  label={`${visitCopy.budget} · ${unit}`}
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
              <div className="flex flex-wrap gap-2">
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
                  pricingEstimateReady
                    ? "text-[var(--primary)]"
                    : "text-[#817a85]",
                )}
              >
                {pricingEstimateReady ? pricingEstimateLabel : "—"}
              </p>
              {pricingEstimateReady &&
              value.mode === "exact" &&
              value.exactNegotiable ? (
                <span className="inline-flex rounded-full border border-[#ead8c6] bg-[#f8efe6] px-2 py-0.5 text-[10px] font-bold text-[#8a5d34]">
                  {visitCopy.negotiableShort}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] font-medium leading-5 text-[#776d7c]">
              {`${visitCopy.estimateEquals} ${pricingFormula}`}
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
