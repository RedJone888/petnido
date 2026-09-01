/**
 * Unified pet profile components module.
 * Subcomponents are partitioned into single-responsibility modules:
 * - pet-profile-types.ts: Domain and UI types
 * - pet-profile-icons.tsx: Sprite icons and buttons
 * - pet-profile-form-fields.tsx: Inputs, selectors, and form helpers
 * - pet-profile-editor-dialog.tsx: Modal dialog for create/edit
 * - pet-profile-card.tsx: Profile display card
 */

export * from "./pet-profile-types";
export * from "./pet-profile-icons";
export * from "./pet-profile-form-fields";
export { PetProfileEditorDialog } from "./pet-profile-editor-dialog";
export { PetProfileCard } from "./pet-profile-card";
