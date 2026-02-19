// const [needData, setNeedData] = useState<NeedForm>({
//   category: ServiceCategory.VISIT,
//   title: "",
//   startDate: "",
//   endDate: "",
//   frequencyType: FrequencyType.ONCE_A_DAY,
//   customFrequency: "",
//   fosterRange: DistanceRange.NO_LIMIT,
//   addressRaw: "",
//   addressLat: 0,
//   addressLon: 0,
//   transportMethod: TransportMethod.DISCUSS,
//   requirement: "",
//   photos: [] as ImageItem[],
//   needPets: [DEFAULT_NEED_PET()],
//   status: NeedStatus.OPEN,
//   priceAmount: 0,
//   totalPrice: 0,
// });

// updateForm({
//       addressRaw: locController.location.label,
//       addressLat: locController.location.lat,
//       addressLon: locController.location.lon,
//     });

// const updateForm = (
//   patch: Partial<NeedForm> | ((prev: NeedForm) => Partial<NeedForm>),
// ) => {
//   setNeedData((prev) => {
//     if (!prev) return prev;
//     const temps = typeof patch === "function" ? patch(prev) : patch;
//     let updates = { ...temps };
//     if (temps.category) {
//       if (temps.category === ServiceCategory.VISIT) {
//         updates = {
//           ...updates,
//           fosterRange: null,
//           transportMethod: null,
//         };
//       } else if (temps.category === ServiceCategory.FOSTER) {
//         updates = {
//           ...updates,
//           frequencyType: null,
//           customFrequency: null,
//         };
//       }
//     }
//     if (temps.frequencyType && temps.frequencyType !== FrequencyType.CUSTOM) {
//       updates.customFrequency = null;
//     }
//     return {
//       ...prev,
//       ...updates,
//     };
//   });
// };

// // 添加、修改、删除宠物分组
//   const addPetGroup = () => {
//     updateForm((prev) => ({
//       needPets: [...prev.needPets, DEFAULT_NEED_PET()],
//     }));
//   };
//   const updatePetData = (tempId: string, petPatch: Partial<NeedForm>) => {
//     updateForm((prev) => ({
//       needPets: prev.needPets.map((p) =>
//         p.tempId === tempId ? { ...p, ...petPatch } : p,
//       ),
//     }));
//   };
//   const removePetGroup = (tempId: string) => {
//     if (needData.needPets.length === 1) return;
//     updateForm((prev) => ({
//       needPets: prev.needPets.filter((p) => p.tempId !== tempId),
//     }));
//   };
