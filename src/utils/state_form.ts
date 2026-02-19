// const [state, setState] = useState<ServiceForm | null>(initialService);

// updates.customType = null;

// const [errors, setErrors] = useState<{ [key: string]: string }>({});

// updateForm({
//   areaRaw: locController.location.label,
//   areaLat: locController.location.lat,
//   areaLon: locController.location.lon,
// });

// updateForm({
//   currency: locController.currency,
// });

// if (!state) return null;

// const updateForm = (
//   patch: Partial<ServiceForm> | ((prev: ServiceForm) => Partial<ServiceForm>),
// ) => {
//   setState((prev) => {
//     if (!prev) return prev;
//     const temps = typeof patch === "function" ? patch(prev) : patch;
//     let updates: Partial<ServiceForm> = { ...temps };
//     if (temps.serviceType) {
//       updates.priceUnit = inferPriceUnitByServiceType(temps.serviceType);
//       if (temps.serviceType !== ServiceCategory.OTHER) {
//         updates.customType = null;
//       }
//       if (temps.serviceType === ServiceCategory.VISIT) {
//         updates.photos = prev.photos.filter(
//           (p) => p.serviceKind !== ServicePhotoKind.HOME,
//         );
//       }
//     }
//     if (temps.availabilityRangeType) {
//       if (temps.availabilityRangeType === AvailabilityRangeType.LONG_TERM) {
//         updates.availableFrom = null;
//         updates.availableTo = null;
//       } else if (
//         temps.availabilityRangeType === AvailabilityRangeType.DATE_RANGE
//       ) {
//         if (!prev.availableFrom)
//           updates.availableFrom = format(new Date(), "yyyy-MM-dd");
//       }
//     }
//     return {
//       ...prev,
//       ...updates,
//     };
//   });
// };
//添加、修改、删除价格规则
// const addRule = () => {
//   updateForm((prev) => ({
//     priceRules: [...prev.priceRules, DEFAULT_PRICE_RULE()],
//   }));
// };
// const updateRule = (tempId: string, rulePatch: Partial<PriceRuleForm>) => {
//   updateForm((prev) => ({
//     priceRules: prev.priceRules.map((r) =>
//       r.tempId === tempId ? { ...r, ...rulePatch } : r,
//     ),
//   }));
// };
// const removeRule = (tempId: string) => {
//   if (state.priceRules.length === 1) return; // 至少保留一行
//   updateForm((prev) => ({
//     priceRules: prev.priceRules.filter((r) => r.tempId !== tempId),
//   }));
// };
// const handlePriceChange = (tempId: string) => {
//   return (e: React.ChangeEvent<HTMLInputElement>) => {
//     console.log("handlePriceChange", e.target.value);
//     let v = normalizeNumber(e.target.value);
//     console.log("v", v, /^\d$/.test(v));
//     if (!/^\d*$/.test(v)) return;
//     updateRule(tempId, {
//       price: v,
//     });
//   };
// };

// if (!state) return;

// const result = serviceCreateSchema.safeParse(input);
// if (!result.success) {
//   const formattedErrors: { [key: string]: string } = {};
//   result.error.issues.forEach((issue) => {
//     const key = issue.path.join(".");
//     formattedErrors[key] = issue.message;
//   });
//   setErrors(formattedErrors);
//   return;
// }

// value={state.customType ?? ""}
// onChange={(e) => {
//   updateForm({ customType: e.target.value });
//   if (errors.customType)
//     setErrors({ ...errors, customType: "" });
// }}

// value={state.description ?? ""}
// onChange={(e) => updateForm({ description: e.target.value })}

// updateForm({
//   photos: [...files, ...homePhotos],
// });

// const newExperiencePhotos = experiencePhotos.filter(
//   (photo) => photo.id !== id,
// );
// updateForm({
//   photos: [...newExperiencePhotos, ...homePhotos],
// });

// updateForm({
//   photos: [...files, ...experiencePhotos],
// });

// const newHomePhotos = homePhotos.filter(
//   (photo) => photo.id !== id,
// );
// updateForm({
//   photos: [...newHomePhotos, ...experiencePhotos],
// });

// value={state.availableFrom ?? ""}
// onChange={(e) => {
//   updateForm({
//     availableFrom: e.target.value,
//   });
//   if (errors.availableFrom)
//     setErrors({ ...errors, availableFrom: "" });
// }}

// value={state.availableTo ?? ""}
// onChange={(e) => {
//   updateForm({
//     availableTo: e.target.value,
//   });
//   if (errors.availableTo)
//     setErrors({ ...errors, availableTo: "" });
// }}

// checked={state.includeHolidays}
// onChange={(e) =>
//   updateForm({ includeHolidays: e.target.checked })
// }

// placeholder={config.placeholder}
// className="w-full bg-gray-50 text-md rounded-xl p-3 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all"

// showPrivacyRadius={config.showCircle}

// value={priceRule.groupLabel}
// onChange={(e) => {
//   updateRule(priceRule.tempId, {
//     groupLabel: e.target.value,
//   });
//   if (errors[`priceRules.${index}.groupLabel`])
//     setErrors({
//       ...errors,
//       [`priceRules.${index}.groupLabel`]: "",
//     });
// }}

// value={priceRule.price}
// onChange={handlePriceChange(priceRule.tempId)}
