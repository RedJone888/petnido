"use client";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useRef } from "react";
import { Loader2, Plus, RefreshCcw } from "lucide-react";
import { CURRENCY_META } from "@/domain/location/constants";
import {
  type NeedCreateInput,
  needFormSchema,
  type NeedForm,
} from "@/lib/zod/needs";
import {
  DistanceRange,
  FrequencyType,
  ServiceCategory,
  NeedStatus,
  TransportMethod,
  Currency,
} from "@prisma/client";
import {
  differenceInDays,
  format,
  formatDate,
  isValid,
  parseISO,
} from "date-fns";
import type { ImageItem } from "@/domain/attachment/type";
import {
  NEED_TYPE_JA,
  DEFAULT_NEED_PET,
  NEED_STEPS,
} from "@/domain/need/constant";
import cn from "@/lib/cn";
import NeedBase from "./form/NeedBase";
import NeedDetail from "./form/NeedDetail";
import NeedPetCard from "./form/NeedPetCard";
import { useLocationController } from "@/hooks/useLocationController";
import { useRouter } from "next/navigation";
import "react-day-picker/dist/style.css";
import { needFormToApi } from "@/domain/need/mapper";
import NeedPrice from "./form/NeedPrice";
import { Button } from "@/components/ui/Button";
type SaveStatus = "IDLE" | "SAVING" | "SAVED" | "ERROR";
type Props = {
  initialData?: NeedForm & { id?: string };
  onSubmit: (data: NeedCreateInput) => Promise<void>;
  isLoading?: boolean;
};
export function NeedForm({ initialData, onSubmit, isLoading }: Props) {
  const router = useRouter();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("IDLE");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const INITIAL_VALUES = {
    category: ServiceCategory.VISIT,
    title: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    frequencyType: FrequencyType.ONCE_A_DAY,
    customDays: "",
    customTimes: "",
    fosterRange: DistanceRange.NO_LIMIT,
    addressRaw: "",
    addressLat: 0,
    addressLon: 0,
    currency: Currency.JPY,
    transportMethod: TransportMethod.DISCUSS,
    requirement: "",
    photos: [] as ImageItem[],
    needPets: [DEFAULT_NEED_PET()],
    status: NeedStatus.OPEN,
    priceAmount: "0",
    totalPrice: "0",
  };
  // const defaultValues = savedData ? JSON.parse(savedData) : INITIAL_VALUES;
  const form = useForm<NeedForm>({
    resolver: zodResolver(needFormSchema),
    defaultValues: initialData || INITIAL_VALUES,
  });
  const [
    category,
    startDate,
    endDate,
    priceAmount,
    totalPrice,
    frequencyType,
    customDays,
    customTimes,
    currency,
  ] = form.watch([
    "category",
    "startDate",
    "endDate",
    "priceAmount",
    "totalPrice",
    "frequencyType",
    "customDays",
    "customTimes",
    "currency",
  ]);
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "needPets",
  });
  const activeNeedType = NEED_TYPE_JA[category];
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [isWaitingForDecision, setIsWaitingForDecision] = useState(false);
  const isEditMode = !!initialData?.id;
  useEffect(() => {
    if (isEditMode) return;
    const savedData = localStorage.getItem("NEED_FORM_DRAFT");
    if (savedData) {
      setShowRestoreBanner(true);
      setIsWaitingForDecision(true);
    }
  }, [form, isEditMode]);
  const handleRestore = () => {
    const savedData = localStorage.getItem("NEED_FORM_DRAFT");
    if (savedData) {
      form.reset(JSON.parse(savedData));
    }
    setShowRestoreBanner(false);
    setIsWaitingForDecision(false);
  };
  const handleDiscard = () => {
    localStorage.removeItem("NEED_FORM_DRAFT");
    setShowRestoreBanner(false);
    setIsWaitingForDecision(false);
  };
  // 优化后的自动保存逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout;
    // 订阅所有变动，但通过防抖处理，不会引起重渲染
    const subscription = form.watch((value, { name, type }) => {
      if (isWaitingForDecision || type !== "change") return;
      // 只有没有草稿且当用户真的在输入（change）时才触发
      setSaveStatus("SAVING");
      // 清理上一个计时器
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        // 这里使用 getValues() 获取当前全量快照，不触发渲染
        try {
          const currentData = form.getValues();
          localStorage.setItem("NEED_FORM_DRAFT", JSON.stringify(currentData));
          setSaveStatus("SAVED");
          setLastSavedTime(formatDate(new Date(), "HH:mm"));
        } catch (error) {
          setSaveStatus("ERROR");
        }
      }, 1000);
    });
    return () => {
      subscription.unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [form.watch, isWaitingForDecision]);
  // 地图以及同步地图数据到form
  const locController = useLocationController({
    location: {
      label: "",
      lat: 0,
      lon: 0,
    },
    currency: "JPY",
  });
  useEffect(() => {
    form.setValue("addressRaw", locController.location.label, {
      shouldValidate: true,
    });
    form.setValue("addressLat", locController.location.lat);
    form.setValue("addressLon", locController.location.lon);
  }, [locController.location, form.setValue]);
  useEffect(() => {
    if (!locController.currency) return;
    form.setValue("currency", locController.currency, { shouldValidate: true });
  }, [locController.currency, form.setValue]);
  // 左侧导航和右侧表单区域
  const [activeStep, setActiveStep] = useState("type");
  // 滚动表单，切换左侧导航
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // 1. 创建观察者逻辑
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 关键逻辑：只要元素进入了我们定义的“热区”（isIntersecting），并且我们判断它是从下方滚上来的，或者正在视口中，更新左侧导航
          if (entry.isIntersecting) {
            setActiveStep(entry.target.id);
          }
        });
      },
      {
        root: container, // 监听这个容器内的滚动
        threshold: 0, // 只要有一点点进入热区就触发，配合 rootMargin 使用极其灵敏
        rootMargin: "-45% 0px -45% 0px", // '0px 0px -80% 0px' 表示：只有当元素出现在视口顶部 20% 的区域时，才算作触发
      },
    );
    // 2. 告诉观察者要看哪些 section
    const sections = NEED_STEPS.map((s) => s.id);
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  // 点击左侧导航，平滑滚动到对应位置
  const scrollToSection = (id: string) => {
    setActiveStep(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };
  // 底部价格区域
  const [actualTimes, setActualTimes] = useState<number | undefined>(undefined);
  const days =
    startDate &&
    endDate &&
    isValid(parseISO(startDate)) &&
    isValid(parseISO(endDate))
      ? Math.max(
          0,
          differenceInDays(parseISO(endDate), parseISO(startDate)) + 1,
        )
      : 0;
  const freqMap: Record<string, { cDaysStr: string; cTimesStr: string }> = {
    ONCE_A_DAY: { cDaysStr: "1", cTimesStr: "1" },
    TWICE_A_DAY: { cDaysStr: "1", cTimesStr: "2" },
    EVERY_2_DAYS: { cDaysStr: "2", cTimesStr: "1" },
    EVERY_3_DAYS: { cDaysStr: "3", cTimesStr: "1" },
  };
  const calculateActualTimes = (
    days: number,
    cDaysStr: string | null,
    cTimesStr: string | null,
  ): number => {
    const cDays = Number(cDaysStr) || 1;
    const cTimes = Number(cTimesStr) || 1;
    if (days <= 0 || cDays <= 0 || cTimes <= 0) return 0;
    const fullCycleCount = Math.floor(days / cDays) * cTimes;
    const remainingDays = days % cDays;
    const extraCount = Math.min(cTimes, remainingDays);
    return fullCycleCount + extraCount;
  };
  // 自动计算总价的逻辑
  useEffect(() => {
    let total = 0;
    const unitPrice = Number(priceAmount) || 0;
    if (category === ServiceCategory.VISIT) {
      if (days > 0) {
        let actualTimes;
        if (frequencyType === FrequencyType.CUSTOM) {
          actualTimes = calculateActualTimes(days, customDays, customTimes);
        } else {
          if (frequencyType !== null) {
            const currFreq = freqMap[frequencyType];
            actualTimes = calculateActualTimes(
              days,
              currFreq.cDaysStr,
              currFreq.cTimesStr,
            );
          }
        }
        setActualTimes(actualTimes);
        total = actualTimes ? unitPrice * actualTimes : 0;
      }
    } else if (category === "FOSTER") {
      total = unitPrice * days;
    } else {
      total = unitPrice; // OTHER 模式直接使用手动输入的值
    }
    form.setValue("totalPrice", String(total));
  }, [
    category,
    startDate,
    endDate,
    frequencyType,
    customDays,
    customTimes,
    priceAmount,
    form.setValue,
  ]);
  const onErrors = (errors: any) => {
    console.log("❌ 校验失败详情:", errors);
  };
  const onActualSubmit = async (data: NeedForm) => {
    const input = needFormToApi(data);
    await onSubmit(input);
    localStorage.removeItem("NEED_FORM_DRAFT");
    form.reset();
    router.replace("/dashboard/needs");
    // router.refresh();
  };
  const onCancel = () => {
    isEditMode && localStorage.removeItem("NEED_FORM_DRAFT");
    router.replace("/dashboard/needs");
  };

  return (
    <FormProvider {...form}>
      <div className="max-w-6xl mx-auto h-full font-sans flex flex-col bg-white overflow-hidden text-sm">
        {/* 1. 顶部固定标题栏 */}
        <header className="px-8 h-20 shadow-[0_4px_20px_rgba(0,0,0,0.05)] z-10 bg-white flex items-center shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {`お世話の依頼を${isEditMode ? "編集" : "作成"}する`}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {isEditMode
                ? "内容を更新して、シッターにより正確な情報を伝えましょう"
                : "詳細な情報を入力すると、ぴったりのシッターが見つかりやすくなります"}
            </p>
          </div>
        </header>

        {/* 2. 中间主体区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：步骤导航 */}
          <aside className="px-8 shadow-[4px_0px_20px_rgba(0,0,0,0.05)] bg-white flex flex-col justify-center shrink-0">
            <nav className="space-y-8">
              {NEED_STEPS.map((step, i) => (
                <div
                  key={step.id}
                  onClick={() => scrollToSection(step.id)}
                  className="flex items-center gap-4 group cursor-pointer"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      activeStep === step.id
                        ? "border-primary bg-secondary/10 text-primary"
                        : "border-gray-200 text-gray-400",
                    )}
                  >
                    {/* {activeStep === step.id ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <span>{i + 1}</span>
                    )} */}
                    <span>{i + 1}</span>
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        activeStep === step.id
                          ? "text-primary"
                          : "text-gray-400",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* 右侧：表单内容 */}
          <main
            ref={scrollContainerRef}
            className="relative flex-1 overflow-y-auto pr-8 custom-scrollbar"
          >
            {showRestoreBanner && (
              <div className="sticky top-0 z-50 text-xs bg-yellow-50 border border-yellow-300 p-3 rounded-md flex justify-between items-center">
                <span className="text-yellow-700">
                  前回の続きから再開しますか？
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleRestore}
                    className="font-bold text-yellow-600 cursor-pointer"
                  >
                    再開する
                  </button>
                  <button
                    onClick={handleDiscard}
                    className="text-gray-400 cursor-pointer"
                  >
                    破棄
                  </button>
                </div>
              </div>
            )}
            <div className="bg-gray-50 p-6 max-w-4xl mx-auto space-y-6">
              {/* 这里放置之前设计的各个 Section */}
              <section
                id="type"
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4"
              >
                <h2 className="text-xl font-bold tracking-wide">
                  {/* <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span> */}
                  1. 依頼の基本内容
                </h2>

                <NeedBase />
              </section>

              <section
                id="schedule"
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4"
              >
                <h2 className="text-xl font-bold tracking-wide">
                  2. 依頼の詳細
                </h2>

                <NeedDetail
                  activeNeedType={activeNeedType}
                  locController={locController}
                  category={category}
                  frequencyType={frequencyType}
                  // photos={photos}
                />
              </section>

              <section
                id="pets"
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4"
              >
                <h2 className="text-xl font-bold tracking-wide">
                  3. ペットの情報
                </h2>
                <button className="text-red-500">
                  登録済みのペットから選択
                </button>
                <div className="space-y-4">
                  {fields.map((pet, index) => (
                    <NeedPetCard
                      key={pet.id}
                      index={index}
                      pet={pet}
                      remove={remove}
                      canRemove={fields.length > 1}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    append(DEFAULT_NEED_PET(), { shouldFocus: false })
                  }
                  className="mt-4 flex items-center text-primary text-sm font-medium hover:underline"
                >
                  <Plus size={16} className="mr-1" /> ペットを追加する
                </button>
              </section>

              <section
                id="budget"
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4"
              >
                <h2 className="text-xl font-bold tracking-wide">
                  4. 報酬の計算
                </h2>
                <NeedPrice
                  activeNeedType={activeNeedType}
                  locController={locController}
                  category={category}
                  currency={currency}
                  totalPrice={totalPrice}
                  days={days}
                  frequencyType={frequencyType}
                  customDays={customDays}
                  customTimes={customTimes}
                  actualTimes={actualTimes}
                />
              </section>
            </div>
          </main>
        </div>

        {/* 3. 底部固定操作栏 */}
        <footer className="px-8 h-20 bg-white flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10 shrink-0">
          <div className="flex items-center gap-6">
            <button
              className="text-gray-500 hover:text-gray-800 font-medium transition-colors"
              disabled={isLoading}
              onClick={onCancel}
            >
              キャンセル
            </button>
            <div className="text-sm text-gray-400 italic">
              {saveStatus === "SAVING" && (
                <span className="flex items-center gap-1">
                  <RefreshCcw size={12} className="animate-spin" />
                  保存中...
                </span>
              )}
              {saveStatus === "SAVED" && lastSavedTime && (
                <span>下書き保存済み {lastSavedTime}</span>
              )}
              {saveStatus === "ERROR" && (
                <span className="text-red-400">保存に失敗しました</span>
              )}
              {saveStatus === "IDLE" && lastSavedTime && (
                <span>下書き保存済み {lastSavedTime}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className="text-xs text-gray-400 block">
                想定支出額（目安）
              </span>
              <span className="text-2xl font-black text-gray-600">
                {CURRENCY_META[currency].symbol} {totalPrice}
              </span>
            </div>

            <Button
              onClick={form.handleSubmit(onActualSubmit, onErrors)}
              className="px-10 py-3 shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading
                ? "処理中..."
                : isEditMode
                  ? "変更を保存する"
                  : "依頼を投稿する"}
            </Button>
          </div>
        </footer>
      </div>
    </FormProvider>
  );
}
