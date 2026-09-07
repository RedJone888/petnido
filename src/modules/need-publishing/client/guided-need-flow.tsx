"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import {
  DraftRecoveryDialogs,
  PublishFeedback,
} from "./guided-need-flow-feedback";
import { GuidedNeedFlowLayout } from "./guided-need-flow-layout";
import { boardingNights } from "./guided-need-flow-shared";
import { NeedPublishingSkeleton } from "./need-publishing-skeleton";
import { NEED_DRAFT_STORAGE_KEY } from "./preview/types";
import {
  StepBoardingTasks,
  StepBudget,
  StepCareType,
  StepCustomTasks,
  StepPets,
  StepPreview,
  StepRequirementsBoarding,
  StepRequirementsCustom,
  StepScheduleBoarding,
  StepScheduleCustom,
  StepScheduleVisitDates,
  StepScheduleVisitTiming,
  StepSupplies,
  StepVisitTasks,
  createPet,
  draftPetFromProfile,
} from "./steps";

const StepArea = dynamic(
  () => import("./steps/step-area").then((module) => module.StepArea),
  {
    loading: () => (
      <div
        aria-hidden="true"
        className="h-[28rem] animate-pulse rounded-[16px] bg-[#f3eff4]"
      />
    ),
  },
);

import { boardingTasks, customTasks } from "./guided-need-flow-config";

import { useGuidedNeedFlow } from "./use-guided-need-flow";
export function GuidedNeedFlow({
  publishingV2Enabled = false,
  validationProfileSession = false,
  editingNeedId,
  needPublishingContinuationToken,
}: {
  publishingV2Enabled?: boolean;
  validationProfileSession?: boolean;
  editingNeedId?: string;
  needPublishingContinuationToken?: string;
}) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const {
    lang,
    t,
    needMessages,
    copy,
    flowCopy,
    router,
    authenticatedForDrafts,
    currentId,
    careType,
    pets,
    setPets,
    dates,
    setDates,
    visitFrequency,
    setVisitFrequency,
    customInterval,
    setCustomInterval,
    firstVisitDate,
    visitsPerDay,
    visitTimes,
    setVisitTimes,
    exactTimes,
    setExactTimes,
    boardingRoutines,
    setBoardingRoutines,
    boardingSupplies,
    setBoardingSupplies,
    customBoardingSupplies,
    setCustomBoardingSupplies,
    boardingSupplyNotes,
    setBoardingSupplyNotes,
    supplyCostMode,
    setSupplyCostMode,
    customPlans,
    setCustomPlans,
    taskNotes,
    setTaskNotes,
    boardingNeeds,
    setBoardingNeeds,
    customBoardingRequirements,
    setCustomBoardingRequirements,
    boardingCompatibility,
    setBoardingCompatibility,
    customHomeSituations,
    setCustomHomeSituations,
    boardingHomeNotes,
    setBoardingHomeNotes,
    customNeeds,
    setCustomNeeds,
    customWarnings,
    setCustomWarnings,
    customRequirementsNotes,
    setCustomRequirementsNotes,
    transport,
    setTransport,
    splitDirection,
    setSplitDirection,
    distance,
    setDistance,
    area,
    setArea,
    location,
    setLocation,
    areaConfirmed,
    setAreaConfirmed,
    budget,
    setBudget,
    supportingImages,
    showNotice,
    setShowNotice,
    publishOutcome,
    publishError,
    validationAttemptedScreenIds,
    pendingDraft,
    damagedDraftDetected,
    setDamagedDraftDetected,
    draftReady,
    setDraftReady,
    editingLoadError,
    appliedPreferredCurrencyRef,
    isPublishing,
    publishNeed,
    savedPets,
    savedLocations,
    switchCareType,
    persistDraft,
    serverDraftPersistence,
    serverSyncing,
    exitFlow,
    resumeDraft,
    discardDraft,
    screens,
    currentIndex,
    current,
    activeTasks,
    activeTaskOptions,
    setActiveTasks,
    petsValid,
    plannedVisitDates,
    datesValid,
    boardingSupplyItems,
    sitterSupplyCount,
    tasksValid,
    areaValid,
    budgetValid,
    pricing,
    revealAllValidation,
    canPublish,
    publishingSteps,
    goNext,
    goBack,
    selectScreen,
    handlePublish,
    updatePet,
    removePet,
    changeVisitCount,
    changeVisitDates,
  } = useGuidedNeedFlow({
    publishingV2Enabled,
    validationProfileSession,
    editingNeedId,
    needPublishingContinuationToken,
  });
  const content = (() => {
    switch (currentId) {
      case "care":
        return <StepCareType value={careType} onChange={switchCareType} />;
      case "pets":
        return (
          <StepPets
            pets={pets}
            savedPets={savedPets.data ?? []}
            savedPetsLoading={authenticatedForDrafts && savedPets.isLoading}
            onUseSavedPet={(savedPet) =>
              setPets((items) => [draftPetFromProfile(savedPet), ...items])
            }
            onChange={updatePet}
            onAdd={(pet) => {
              const nextPet = pet ?? createPet();
              setPets((items) => [nextPet, ...items]);
              return nextPet.id;
            }}
            onRemove={removePet}
            showValidation={
              revealAllValidation || validationAttemptedScreenIds.has("pets")
            }
          />
        );
      case "dates":
        return careType === "visit" ? (
          <StepScheduleVisitDates
            dates={dates}
            onDatesChange={changeVisitDates}
            showValidation={
              revealAllValidation || validationAttemptedScreenIds.has("dates")
            }
            visitFrequency={visitFrequency}
            onVisitFrequencyChange={setVisitFrequency}
            customInterval={customInterval}
            onCustomIntervalChange={setCustomInterval}
            visitsPerDay={visitsPerDay}
            onVisitCountChange={changeVisitCount}
            visitTimes={visitTimes}
            exactTimes={exactTimes}
            onVisitTimesChange={setVisitTimes}
            onExactTimesChange={setExactTimes}
          />
        ) : careType === "boarding" ? (
          <StepScheduleBoarding
            dates={dates}
            onDatesChange={(next) =>
              setDates((current) => ({ ...current, ...next }))
            }
            showValidation={
              revealAllValidation || validationAttemptedScreenIds.has("dates")
            }
          />
        ) : (
          <StepScheduleCustom
            dates={dates}
            onDatesChange={(next) =>
              setDates((current) => ({ ...current, ...next }))
            }
            showValidation={
              revealAllValidation || validationAttemptedScreenIds.has("dates")
            }
          />
        );
      case "frequency":
        return (
          <StepScheduleVisitTiming
            value={visitFrequency}
            onChange={setVisitFrequency}
            customInterval={customInterval}
            onCustomIntervalChange={setCustomInterval}
            showValidation={
              revealAllValidation ||
              validationAttemptedScreenIds.has("frequency")
            }
            visitsPerDay={visitsPerDay}
            onVisitCountChange={changeVisitCount}
            visitTimes={visitTimes}
            exactTimes={exactTimes}
            onVisitTimesChange={setVisitTimes}
            onExactTimesChange={setExactTimes}
          />
        );
      case "tasks":
        return careType === "boarding" ? (
          <StepBoardingTasks
            options={boardingTasks}
            pets={pets}
            value={boardingRoutines}
            onChange={setBoardingRoutines}
            notes={taskNotes}
            onNotesChange={setTaskNotes}
            showValidation={
              revealAllValidation || validationAttemptedScreenIds.has("tasks")
            }
          />
        ) : careType === "custom" ? (
          <StepCustomTasks
            options={customTasks}
            pets={pets}
            value={customPlans}
            onChange={setCustomPlans}
            notes={taskNotes}
            onNotesChange={setTaskNotes}
            showValidation={
              revealAllValidation || validationAttemptedScreenIds.has("tasks")
            }
          />
        ) : (
          <StepVisitTasks
            options={activeTaskOptions}
            pets={pets}
            value={activeTasks}
            onChange={setActiveTasks}
            notes={taskNotes}
            onNotesChange={setTaskNotes}
            careType={careType ?? "visit"}
            visitsPerDay={visitsPerDay}
            visitTimes={visitTimes}
            exactTimes={exactTimes}
            showValidation={
              revealAllValidation || validationAttemptedScreenIds.has("tasks")
            }
          />
        );
      case "supplies":
        return (
          <StepSupplies
            pets={pets}
            value={boardingSupplies}
            onChange={setBoardingSupplies}
            customItems={customBoardingSupplies}
            onCustomItemsChange={setCustomBoardingSupplies}
            notes={boardingSupplyNotes}
            onNotesChange={setBoardingSupplyNotes}
          />
        );
      case "requirements":
        return careType === "boarding" ? (
          <StepRequirementsBoarding
            needs={boardingNeeds}
            onNeedsChange={setBoardingNeeds}
            customRequirements={customBoardingRequirements}
            onCustomRequirementsChange={setCustomBoardingRequirements}
            compatibility={boardingCompatibility}
            onCompatibilityChange={setBoardingCompatibility}
            customSituations={customHomeSituations}
            onCustomSituationsChange={setCustomHomeSituations}
            notes={boardingHomeNotes}
            onNotesChange={setBoardingHomeNotes}
          />
        ) : (
          <StepRequirementsCustom
            requirements={customNeeds}
            onRequirementsChange={setCustomNeeds}
            cautions={customWarnings}
            onCautionsChange={setCustomWarnings}
            notes={customRequirementsNotes}
            onNotesChange={setCustomRequirementsNotes}
          />
        );
      case "cautions":
        return null;
      case "area":
        return (
          <StepArea
            careType={careType ?? "visit"}
            area={area}
            onChange={setArea}
            areaConfirmed={areaConfirmed}
            onAreaConfirmedChange={setAreaConfirmed}
            location={location}
            onLocationChange={setLocation}
            savedLocations={savedLocations.data ?? []}
            distance={distance}
            onDistanceChange={setDistance}
            transport={transport}
            onTransportChange={setTransport}
            splitDirection={splitDirection}
            onSplitDirectionChange={setSplitDirection}
            showValidation={
              revealAllValidation || validationAttemptedScreenIds.has("area")
            }
          />
        );
      case "budget":
        return (
          <StepBudget
            careType={careType ?? "visit"}
            totalVisits={plannedVisitDates.length * visitsPerDay}
            totalNights={boardingNights(dates)}
            pricing={pricing}
            transport={transport}
            sitterSupplyCount={sitterSupplyCount}
            supplyCostMode={supplyCostMode}
            onSupplyCostModeChange={setSupplyCostMode}
            value={budget}
            onChange={(nextBudget) => {
              if (nextBudget.currency !== budget.currency) {
                appliedPreferredCurrencyRef.current = true;
              }
              setBudget(nextBudget);
            }}
            showValidation={
              revealAllValidation || validationAttemptedScreenIds.has("budget")
            }
          />
        );
      case "preview":
        return (
          <StepPreview
            careType={careType ?? "visit"}
            pets={pets}
            dates={dates}
            tasks={activeTasks}
            boardingRoutines={boardingRoutines}
            boardingSupplies={boardingSupplies}
            boardingSupplyItems={boardingSupplyItems}
            boardingSupplyNotes={boardingSupplyNotes}
            supplyCostMode={supplyCostMode}
            taskNotes={taskNotes}
            homeFitNotes={boardingHomeNotes}
            requirementsNotes={
              careType === "custom" ? customRequirementsNotes : ""
            }
            location={location}
            distance={distance}
            transport={transport}
            splitDirection={splitDirection}
            budget={budget}
            pricing={pricing}
            tags={
              careType === "boarding"
                ? [
                    ...boardingNeeds,
                    ...Object.entries(boardingCompatibility)
                      .filter(([, choice]) => choice === "not-ok")
                      .map(([label]) => `Avoid: ${label}`),
                  ]
                : careType === "custom"
                  ? [...customNeeds, ...customWarnings]
                  : []
            }
            customRequirements={customNeeds}
            customCautions={customWarnings}
            visitFrequency={visitFrequency}
            customInterval={customInterval}
            firstVisitDate={firstVisitDate || dates.startDate}
            visitsPerDay={visitsPerDay}
            visitTimes={visitTimes}
            exactTimes={exactTimes}
            validation={{
              pets: petsValid,
              dates: datesValid,
              tasks: tasksValid,
              area: areaValid,
              budget: budgetValid,
            }}
            supportingImages={supportingImages}
            onBeforeOpenDetail={persistDraft}
            onEditStep={(stepId) => {
              const index = screens.findIndex((screen) => screen.id === stepId);
              if (index >= 0) selectScreen(index);
            }}
          />
        );
    }
  })();

  if (!hydrated || (editingNeedId && !draftReady && !editingLoadError)) {
    return <NeedPublishingSkeleton stepCount={8} />;
  }

  if (editingLoadError && editingNeedId) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#fcfbf8] px-4 py-12">
        <section className="w-full max-w-xl rounded-3xl border border-danger-border bg-white p-8 text-center shadow-xl shadow-purple-100/40">
          <h1 className="text-2xl font-black text-slate-900">
            {t.core.management.actions.editUnavailable}
          </h1>
          <p role="alert" className="mt-4 text-sm leading-7 text-danger-text">
            {needMessages.needPublishing.publishError}
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/needs")}
            className="mt-7 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white"
          >
            {needMessages.needPublishing.back}
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#fcfbf8] text-[#211d27] lg:min-h-dvh">
      {!editingNeedId && (
        <DraftRecoveryDialogs
          damagedDraftDetected={damagedDraftDetected}
          pendingDraft={pendingDraft}
          lang={lang}
          copy={copy}
          damagedTitle={t.errors.draftDamagedTitle}
          damagedDescription={t.errors.draftDamagedDescription}
          discardDamagedLabel={t.errors.discardDamagedDraft}
          onDiscardDamaged={() => {
            window.localStorage.removeItem(NEED_DRAFT_STORAGE_KEY);
            setDamagedDraftDetected(false);
            setDraftReady(true);
          }}
          onDiscardDraft={discardDraft}
          onResumeDraft={resumeDraft}
        />
      )}

      <GuidedNeedFlowLayout
        current={current}
        currentId={currentId}
        currentIndex={currentIndex}
        steps={publishingSteps}
        careTypeSelected={Boolean(careType)}
        canPublish={canPublish}
        publishing={
          isPublishing ||
          (!publishOutcome && (publishNeed.isLoading || serverSyncing))
        }
        syncing={!isPublishing && !publishOutcome && serverSyncing}
        syncingLabel={flowCopy.syncingDraft}
        publishComplete={Boolean(publishOutcome)}
        saveState={
          publishingV2Enabled && authenticatedForDrafts
            ? serverDraftPersistence.saveState
            : undefined
        }
        onSaveExit={exitFlow}
        onResolveConflict={() => {
          void serverDraftPersistence.keepCurrentChanges();
        }}
        onStepSelect={(id) => {
          const index = screens.findIndex((screen) => screen.id === id);
          if (index >= 0) selectScreen(index);
        }}
        onBack={goBack}
        onNext={goNext}
        onPublish={handlePublish}
      >
        {content}
      </GuidedNeedFlowLayout>

      <PublishFeedback
        showDraftNotice={showNotice}
        publishOutcome={publishOutcome}
        publishError={publishError}
        copy={copy}
        onCloseDraftNotice={() => setShowNotice(false)}
      />
    </div>
  );
}
