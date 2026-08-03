export const NEED_PREVIEW_STORAGE_KEY = "petnido:need-preview:v1";
export const NEED_DRAFT_STORAGE_KEY = "petnido:need-draft:v3";
export const NEED_ENTRY_STORAGE_KEY = "petnido:need-entry-route";

export type PreviewCareType = "visit" | "boarding" | "custom";

export type PreviewPetDetail = {
  label: string;
  value: string;
};

export type PreviewPet = {
  id: string;
  label: string;
  type: string;
  quantity: number;
  photo?: string;
  details?: PreviewPetDetail[];
  notes?: string;
};

export type PreviewTask = {
  id: string;
  label: string;
  priority: "must" | "nice";
  petLabels: string[];
  notes?: string;
};

export type PreviewVisit = {
  number: number;
  time: string;
  tasks: PreviewTask[];
};

export type PreviewRoutine = PreviewTask & {
  scheduleType: "daily" | "repeating" | "once" | "as-needed";
  schedule: string;
  instructions: string;
};

export type PreviewSupplyItem = {
  id: string;
  label: string;
  petLabel: string;
};

export type NeedPreviewSnapshot = {
  version: 1;
  careType: PreviewCareType;
  serviceTitle: string;
  title: string;
  area: string;
  areaDetail: string;
  dates: {
    label: string;
    startDate: string;
    endDate: string;
    notes: string;
    totalDays: number;
    totalNights: number;
  };
  pets: PreviewPet[];
  pricing: {
    priceLabel: string;
    supplyCostLabel: string;
    transportCostLabel: string;
    estimatedTotal: string;
    formula: string;
  };
  additionalCareNotes: string;
  visit?: {
    scheduleLabel: string;
    totalVisits: number;
    visitDates?: string[];
    visitDateCandidates?: string[];
    excludedVisitDates?: string[];
    visits: PreviewVisit[];
  };
  boarding?: {
    routines: PreviewRoutine[];
    homeFit: {
      needs: string[];
      ok: string[];
      avoid: string[];
      notes: string;
    };
    supplies: {
      owner: PreviewSupplyItem[];
      sitter: PreviewSupplyItem[];
    };
    transportLabel: string;
  };
  custom?: {
    tasks: PreviewTask[];
    requirements: string[];
    cautions: string[];
  };
};
