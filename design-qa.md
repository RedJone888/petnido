# Homepage design QA

## Evidence

- Source visual truth:
  - `/Users/xiaoguoba/.codex/visualizations/2026/07/23/019f8c96-299a-72c2-879f-eb5b435e914e/petnido-visual-audit/01-desktop-top.png`
  - `/Users/xiaoguoba/.codex/visualizations/2026/07/23/019f8c96-299a-72c2-879f-eb5b435e914e/petnido-visual-audit/02-desktop-cards.png`
  - `/Users/xiaoguoba/.codex/visualizations/2026/07/23/019f8c96-299a-72c2-879f-eb5b435e914e/petnido-visual-audit/03-desktop-role-cards.png`
  - `/Users/xiaoguoba/.codex/visualizations/2026/07/23/019f8c96-299a-72c2-879f-eb5b435e914e/petnido-visual-audit/04-mobile-top.png`
  - `/Users/xiaoguoba/.codex/visualizations/2026/07/23/019f8c96-299a-72c2-879f-eb5b435e914e/petnido-visual-audit/premium-direction.md`
- Browser-rendered implementation:
  - `/Users/xiaoguoba/Desktop/petcare/.codex-qa/homepage-desktop-final.png`
  - `/Users/xiaoguoba/Desktop/petcare/.codex-qa/homepage-mobile-final.png`
  - `/Users/xiaoguoba/Desktop/petcare/.codex-qa/homepage-mobile-scroll-1.png` through `homepage-mobile-scroll-7.png`
  - `/Users/xiaoguoba/Desktop/petcare/.codex-qa/homepage-mobile-offer-expanded-final.png`
  - `/Users/xiaoguoba/Desktop/petcare/.codex-qa/homepage-four-entrances-desktop-final.png`
  - `/Users/xiaoguoba/Desktop/petcare/.codex-qa/homepage-four-entrances-mobile-final.png`
- Combined comparison evidence:
  - `/Users/xiaoguoba/Desktop/petcare/.codex-qa/comparison-desktop.png`
  - `/Users/xiaoguoba/Desktop/petcare/.codex-qa/comparison-mobile.png`
  - `/Users/xiaoguoba/Desktop/petcare/.codex-qa/comparison-four-entrances-desktop.png`
  - `/Users/xiaoguoba/Desktop/petcare/.codex-qa/comparison-four-entrances-mobile.png`
- Route and state: `http://127.0.0.1:3001/`, English, light theme, signed out, Find care expanded by default; Offer care expanded for interaction verification.
- Viewports and normalization:
  - Desktop source and implementation: 1440 × 1000 pixels, 1440 × 1000 CSS px, device scale factor 1.
  - Mobile source and implementation: 390 × 844 pixels, 390 × 844 CSS px, device scale factor 1.
  - No density normalization was required.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Typography: the larger desktop display type, reduced badge styling, restrained weights, and mobile wrapping create the intended hierarchy without truncation or overflow.
- Spacing and layout: section rhythm is consistent, service cards share one geometry, role steps use dividers rather than nested cards, and the 390 px layout has no horizontal page overflow.
- Colors and tokens: the current homepage is scoped to warm canvas, soft lavender surfaces, deep purple actions, neutral borders, and a limited sand accent. Other routes and the legacy homepage retain their existing tokens.
- Image quality: existing photographic assets remain sharp at both viewports; crops preserve the subjects and the desktop hero no longer uses the heavy white frame.
- Copy and content: Hero actions now accurately describe creation tasks (`Post a Care Request`, `Create a Service`), while the new Explore Nearby cards clearly describe the two browsing tasks. Prices and service structure remain unchanged.
- Accessibility and affordances: primary/secondary actions remain distinguishable; mobile role headers expose `aria-expanded`; keyboard/pointer interaction changes the expanded role correctly.

## Comparison history

### Iteration 1

- [P2] Cards and role panels used multiple saturated fills, large shadows, nested containers, and inconsistent icon colors.
  - Fix: unified white cards, 1 px neutral borders, 18–20 px radii, no default shadow, divider-based details, and a single purple icon treatment with one restrained sand role accent.
  - Post-fix evidence: `homepage-mobile-scroll-2.png`, `homepage-mobile-scroll-3.png`, and `homepage-mobile-scroll-4.png`.
- [P2] Primary buttons, hero framing, and the homepage navigation retained high-saturation color, pill shapes, hover scaling, and heavy elevation.
  - Fix: deep-purple 10–11 px radius actions, flat secondary buttons, subtle navigation border, and a 1 px hero image edge with soft elevation.
  - Post-fix evidence: `comparison-desktop.png` and `comparison-mobile.png`.
- [P2] The mobile primary action used a bright orange fill that competed with the hero image.
  - Fix: changed the mobile primary action to a high-contrast white button with deep-purple text, while retaining a translucent outlined secondary action.
  - Post-fix evidence: `comparison-mobile.png`.
- [P2] Navbar links with duplicate `#` href values produced React duplicate-key warnings.
  - Fix: keys now combine href and translated label. A clean browser session reported no console errors.

### Iteration 2

- Re-captured the desktop and mobile top viewports after the navigation refinement.
- Re-tested mobile role switching in a clean session: Find care collapsed and Offer care expanded successfully.
- Rechecked console errors in a clean browser tab: none.
- No new P0, P1, or P2 findings.

### Iteration 3 — four-entry information architecture

- [P2] Creation and browsing tasks were conflated: Hero labels sounded like browsing actions, while the actual nearby browsing choices remained much farther down the page.
  - Fix: renamed the Hero actions to `Post a Care Request` and `Create a Service`; added a separate `Explore Nearby` section with `Find Nearby Sitters` and `Browse Nearby Requests` immediately after the Hero.
  - Post-fix evidence: `comparison-four-entrances-desktop.png` and `comparison-four-entrances-mobile.png`.
- [P2] The first implementation placed the Explore cards just below the desktop fold and showed only a card edge on mobile.
  - Fix: reduced desktop Hero vertical padding and tightened Explore spacing; removed the repetitive Explore description on mobile. Both browse choices are fully readable at 1440 × 1000, and the first browse choice enters the 390 × 844 first viewport.
  - Post-fix evidence: `homepage-four-entrances-desktop-final.png` and `homepage-four-entrances-mobile-final.png`.
- Interaction verification:
  - Signed-out `Post a Care Request` opens the login/registration modal with `/dashboard/needs/new` as the continuation target.
  - Signed-out `Create a Service` opens the login/registration modal with `/dashboard/serviceprofile/services/new` as the continuation target.
  - `Find Nearby Sitters` navigates to `/public/sitters`.
  - `Browse Nearby Requests` navigates to `/public/needs`.
  - A fresh browser tab reported no console errors.

## Focused region comparison

Focused checks were used because card copy, dividers, mobile accordion states, nearby-card overflow, sitter rows, and the final CTA are too small to judge from a full-page scaled image. The seven mobile scroll captures cover those regions at native 390 px width.

## Implementation checklist

- [x] Warm neutral homepage palette is scoped locally.
- [x] Buttons, cards, radii, borders, and shadows use one visual system.
- [x] Desktop and mobile hero states verified.
- [x] All four top-of-page entry points verified.
- [x] Mobile horizontal needs rail verified without page overflow.
- [x] Mobile dual-role accordion verified in both states.
- [x] Clean-session console checked.
- [x] TypeScript and production build passed.

## Follow-up polish

- P3: when the footer is redesigned later, its gray-blue legacy surface can be moved onto the same warm neutral palette as the new homepage.

final result: passed

### Iteration 59 — full detail-page alignment to the reference design (latest)

- Source visual truth: `/Users/xiaoguoba/.codex/generated_images/019fc727-f0f9-7f60-b84f-538d3344d2a3/exec-36db29e2-4154-4403-9452-9815e68d5011.png` (`1487 × 1058` pixels).
- Browser-rendered implementation: `/Users/xiaoguoba/Desktop/petcare/design-qa-layout-aligned.png` (desktop full-page capture); mobile evidence: `/Users/xiaoguoba/Desktop/petcare/design-qa-layout-aligned-mobile.png` (`390 × 844` CSS viewport).
- Desktop state: `http://localhost:3000/needs/create/preview?careType=visit`, `1280 × 720` CSS viewport, device scale factor `2`, light theme, direct demo data. The right rail measured `375px` wide and started at `y=109px`; calendar week rows measured `48px` each.
- Full-view comparison: source and final implementation were opened together. The implementation now follows the reference's proportions for the right rail, card padding, story card, pet profile cards, care schedule cards, calendar height, date cells, and action area while intentionally preserving the existing font and color tokens.
- Calendar: the month row uses bare left/right chevrons, the calendar is fluid within a `360px` max content width, six fixed week rows are `48px` high, planned dates use filled rounded cells, and the legend follows the reference's single `Care dates` treatment.
- Schedule: Visit 1 is expanded with target-pet groups on the left and compact check-list tasks on the right; Visit 2 is collapsed with its pet-group count visible. Different pet groups and task assignments remain represented.
- Responsive evidence: mobile measured `390px` document width, one `h1`, and the Visit 1 card measured `350px` wide; no horizontal overflow. The right rail moves below the main content.
- Console/build: clean final browser tab reported no error/warning logs; `npx tsc --noEmit` and `npm run build` passed. Build emitted only the existing outdated Browserslist/caniuse-lite notices.
- No actionable P0, P1, or P2 findings remain. Remaining differences are intentional: the existing PetNido preview chrome, font family, and theme colors were preserved per the user's constraint.

final result: passed

### Iteration 58 — compact visit budget block (latest)

- Source visual truth: `/Users/xiaoguoba/.codex/generated_images/019fc727-f0f9-7f60-b84f-538d3344d2a3/exec-36db29e2-4154-4403-9452-9815e68d5011.png`.
- Implementation screenshot: `/Users/xiaoguoba/Desktop/petcare/design-qa-budget-tight.png` (`1280 × 1452` pixels; `1280 × 720` CSS viewport; device scale factor `2`).
- The Visit budget now uses the design's compact two-row structure: `4 visits × ¥3,000 / ¥12,000` and `Travel costs / Included`. The previous standalone `Visit fee` row and repeated formula line were removed.
- The estimated total was reduced from `text-3xl` to `text-2xl`; the total-to-row gap and row vertical padding were tightened while preserving existing colors, font family, borders, and button styling.
- Browser verification: no horizontal overflow (`1280px` document width), one `h1`, expected budget copy present, no browser console errors or warnings. Production build and TypeScript check pass.
- No actionable P0, P1, or P2 findings remain. Any remaining difference from the source's serif display treatment is intentional because the existing app font was explicitly preserved.

final result: passed

### Iteration 57 — adaptive home-visit detail preview (latest)

## Evidence

- Source visual truth: `/Users/xiaoguoba/.codex/generated_images/019fc727-f0f9-7f60-b84f-538d3344d2a3/exec-36db29e2-4154-4403-9452-9815e68d5011.png` (`1487 × 1058` pixels).
- Browser-rendered implementation: `/Users/xiaoguoba/Desktop/petcare/design-qa-implementation-desktop.png` (`1280 × 1452` pixels, `1280 × 720` CSS viewport, device scale factor `2`).
- Route and state: `http://localhost:3000/needs/create/preview?careType=visit`, English, light theme, direct URL with no database/session data, deterministic visit demo fallback, two pet groups, two visits with different task groups, four total visits, `¥12,000` estimate.
- Comparison method: source and implementation were opened together in one visual comparison input. The source is a design reference with a different canvas height and the implementation uses the existing PetNido shell, so comparison focused on hierarchy, grouping, responsive behavior, and information density rather than pixel-level color or font matching.
- Responsive evidence: `390 × 844` mobile browser state was captured and inspected. The page measured `390px` document width with no horizontal overflow; pet groups stacked, visit task cards remained readable, and the right rail moved below the main content.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Information architecture: publisher information now sits immediately below the title/status row; location and date metadata follow it; story, pet groups, and care schedule remain in the main column.
- Right rail: the calendar is the first section in one unified card, followed by the estimate and fee breakdown, then exactly two actions (`Apply to help` and `Save request`).
- Adaptability: pet groups use a responsive grid and visit cards are full-width stacked sections. Each visit can target different pet groups and expose a separate task list; additional groups/visits continue without relying on fixed-width cards.
- Fonts and typography: the existing app font family, weights, sizes, and text tokens were preserved. The source mock's display serif is an intentional reference-only difference because the user asked not to change the current font.
- Spacing and layout rhythm: existing flow spacing, border, radius, shadow, and max-width tokens were reused. Desktop alignment is stable and mobile wrapping remains readable.
- Colors and visual tokens: no theme colors were changed. Existing PetNido purple, warm neutral surfaces, semantic green labels, borders, and focus treatment remain in use.
- Image and icon fidelity: existing local pet imagery and the project's Phosphor icon set are used; no custom SVG or CSS-drawn substitutes were introduced.
- Copy and interaction: direct preview fallback makes the URL visible without database data; `See more` / `Show less` was verified; browser console reported no errors or warnings.

## Focused region comparison

No separate crop was required: the full-view comparison kept the title/publisher stack, the calendar-to-budget transition, and both visit task cards legible. Mobile was reviewed separately for wrapping, stacking, and the expanded story state.

## Comparison history

### Iteration 1

- [P2] The initial preview layout placed publisher context too far from the title and kept schedule content embedded in a narrow in-content block.
  - Fix: moved publisher information directly under title/status, promoted the schedule to a full-width main-column section, and made each visit card independently legible.
  - Post-fix evidence: `/Users/xiaoguoba/Desktop/petcare/design-qa-implementation-desktop.png`; desktop and mobile browser captures showed stable grouping and no overflow.
- [P2] Calendar and budget were separate sidebar regions, which weakened the decision panel hierarchy.
  - Fix: merged them into one right-hand card with calendar first, budget second, and two actions at the bottom.
  - Post-fix evidence: the right rail in `/Users/xiaoguoba/Desktop/petcare/design-qa-implementation-desktop.png` and the mobile stacked-card browser state.
- No new P0, P1, or P2 findings after the responsive pass.

## Implementation checklist

- [x] Publisher sits below title/status.
- [x] Calendar is above budget in the unified right card.
- [x] Budget is followed by exactly two actions.
- [x] Multiple pet groups and visit-specific task groups are supported.
- [x] Existing theme colors, fonts, icons, and visual tokens are preserved.
- [x] Direct preview URL renders deterministic demo data without database/session data.
- [x] Desktop and `390 × 844` mobile states are verified.
- [x] TypeScript check and production build pass.

## Follow-up polish

- [P3] Replace the deterministic fallback content with persisted preview data once the request database/session model is wired; the layout already supports the same shape.

final result: passed

### Iteration 57 — three independent care-mode guides with generated scene art

- Source visual truth: `/Users/xiaoguoba/Desktop/petcare/public/images/care-guides/home-visits-photo.png` (`1587 × 991`), one of six purpose-generated photo/illustration assets defining the photo-plus-doodle direction.
- Browser implementation evidence: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/care-home-visits-desktop-final.png` (`1440 × 900`) and `/Users/xiaoguoba/Desktop/petcare/.codex-qa/care-home-visits-mobile-final.png` (`390 × 844`). CSS viewports matched those pixel sizes at device scale 1.
- Full-view comparison evidence: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/care-home-visits-comparison.png` (`2160 × 900`). The source asset was proportionally contained in a `720 × 820` panel beside the desktop implementation; no density-based visual findings were filed.
- State: Chinese, light theme, logged out. `/care-types/home-visits` shows exactly two top alternatives (boarding and custom). `/care-types/boarding` and `/care-types/custom` likewise show only their other two modes.
- Fonts and typography: the existing PetNido family, strong plum display hierarchy, compact uppercase eyebrow, readable body leading, and mobile wrapping remain consistent with the homepage system.
- Spacing and layout rhythm: the 1480px site shell aligns with the creation flow; desktop uses a balanced text/image hero and mobile collapses without horizontal overflow (`390px` document width at a `390px` viewport).
- Colors and visual tokens: existing cream, plum, pale green/lavender/sand, border, radius, and button tokens are reused across all three guides.
- Image quality and fidelity: every mode uses two newly generated, mode-specific raster assets. The rendered desktop hero preserves the source subject, integrated doodles, sharpness and crop; no previous homepage image is repeated in these details.
- Copy and content: each page tells owner scenarios, the service response, preparation/risks, sitter fit, acceptance considerations and trust-building actions in prose-led sections rather than the previous comparison checklist.
- Focused-region evidence: the mobile viewport capture verifies the alternative links, hero type scale, CTA wrapping and first image crop. A second focused crop was unnecessary because the full desktop hero makes the source-asset fidelity directly legible.
- Primary interactions checked: all three direct routes load; homepage and posting-guide links now deep-link to the corresponding detail route; owner and sitter CTAs retain their existing destinations. The production preview reported an existing Auth.js session-endpoint parsing error while logged out, but no care-guide render, routing, image-load or overflow error was observed.
- Comparison history: the initial production desktop capture occurred before the optimized hero image completed loading. After waiting for both guide images to report non-zero natural dimensions, the implementation was recaptured and the combined comparison regenerated. No P0/P1/P2 visual finding remains.
- Build checks: `npx tsc --noEmit` and `npm run build` passed; all three new routes were statically generated.

final result: passed

---

# Marketplace homepage and care-guide information architecture — July 31, 2026

## Evidence

- Source visual truth: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/source-airtasker-desktop.png` (`1280 × 720`). It is used as layout and conversion-rhythm inspiration, not a pixel-identical clone target.
- Generated PetNido hero art direction: `/Users/xiaoguoba/Desktop/petcare/public/images/home/petnido-hero-doodle.png` (`1536 × 1024`), combining real pet-care photography with the approved purple, cream and warm-brown doodle language.
- Browser-rendered implementation:
  - `/Users/xiaoguoba/Desktop/petcare/.codex-qa/implementation-home-desktop-final.jpg` (`1440 × 1024`, CSS viewport `1440 × 1024`, density 1).
  - `/Users/xiaoguoba/Desktop/petcare/.codex-qa/implementation-home-mobile.png` (`390 × 844`, CSS viewport `390 × 844`, density 1).
- Combined full-view comparison: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/source-implementation-comparison-final.png` (`2560 × 720`). The 1440 × 1024 implementation was center-cropped to the same 16:9 top-view region and normalized to `1280 × 720` before being placed beside the source.
- State: English, light theme, signed out. The homepage, `/how-it-works`, `/how-it-works/needs`, `/how-it-works/services`, and `/care-types` were rendered through the in-app browser.

## Findings

- No actionable P0, P1 or P2 findings remain.
- Fonts and typography: the implementation preserves the reference's decisive display hierarchy while using PetNido's existing rounded sans-serif family and deep-purple color. The desktop heading wraps into four readable lines and the mobile heading reflows without truncation or horizontal overflow.
- Spacing and layout rhythm: navbar, body sections and footer use the same `1480px` shell with `20px` mobile and `40px` desktop gutters, matching the width contract of `/needs/create`. The reference's strong contained hero and sequential conversion rhythm are retained, while the membership promotion is intentionally replaced by PetNido's dual-role/reuse proposition.
- Colors and visual tokens: warm ivory, restrained lavender, deep purple, warm brown and pale green provide clear section contrast without copying Airtasker's blue palette. Primary and secondary actions remain visually distinct.
- Image quality and asset fidelity: all new homepage and guide imagery is locally generated and uses the approved real-photo-plus-doodle direction. The animal mix visibly includes dogs, cats, rabbits, guinea pigs and birds. Crops preserve faces and key care actions at desktop and mobile. No hotlinked images, placeholder art, handcrafted SVGs, emoji or CSS-drawn image substitutes remain in the new experience.
- Copy and content: the homepage communicates one account/two roles, reusable needs and services, three structured care types, real nearby needs, sitter specialties and the path to publish. The guide pages connect “understand → compare → choose → publish” with bidirectional links.
- Accessibility and affordances: the mobile menu exposes correct expanded state; navigation labels and image alt text are meaningful; care-type anchor navigation is keyboard-accessible; primary calls to action use real links or buttons.

## Focused region comparison

- The native `390 × 844` mobile capture was used to inspect the hero crop, heading wrap, CTA stacking, trust labels and menu overlay because these details are too small in the normalized desktop comparison.
- The `/care-types#home-visits` browser view was inspected at desktop size to verify the sticky comparison navigation, photo crop, advantages, limitations, examples and both publish exits.
- Additional static crops were not needed because the focused browser views kept typography, imagery and interaction controls legible.

## Comparison history

### Iteration 1

- [P1] Running the production build while the development server was active invalidated the live development asset manifest and briefly produced a 404 in the first comparison capture.
  - Fix: stopped the affected development process and restarted the server cleanly on port 3001.
  - Post-fix evidence: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/implementation-home-desktop-final.jpg` and `/Users/xiaoguoba/Desktop/petcare/.codex-qa/source-implementation-comparison-final.png` show the complete rendered homepage.
- [P2] The desktop signed-out action inherited a hard-coded Japanese login label from the legacy shared button.
  - Fix: replaced it in the new navbar with the active language's `Sign in / 登录 / ログイン` label while preserving the existing authentication modal.
  - Post-fix evidence: final desktop capture shows `Sign in` in the English state.
- [P2] The first care-type image produced an LCP priority warning when its anchored section became the initial viewport.
  - Fix: the first care-type image now opts into Next Image priority loading.

### Iteration 2

- Re-captured the homepage after a clean server restart and repeated the same-size source/implementation comparison.
- Verified the mobile menu open state, the three care-type anchors, both posting-guide routes and the unified `/how-it-works` hub.
- No new application errors, P0, P1 or P2 visual issues appeared in the final browser-rendered state.

## Implementation checklist

- [x] Navbar, homepage body and footer share the `/needs/create` maximum width.
- [x] Homepage follows the requested conversion sequence.
- [x] One-account/two-role and reusable-post messaging is integrated.
- [x] Generated photo+doodle assets are stored locally.
- [x] Dogs, cats, rabbits, guinea pigs and birds are represented.
- [x] Home visits, boarding and custom care have comparison content.
- [x] Need-posting and service-publishing guides are connected.
- [x] Desktop and `390 × 844` mobile views are verified.
- [x] Mobile navigation interaction is verified.
- [x] TypeScript and production build pass.

## Follow-up polish

- [P3] The source PNGs are intentionally retained at high resolution; converting them to production WebP/AVIF originals would reduce repository weight further, although Next Image already optimizes delivered variants.

final result: passed

---

# Sitter-facing request preview — narrative and disclosure QA

## Evidence

- Selected source design: `/Users/xiaoguoba/.codex/generated_images/019fb22e-9553-7762-a0d5-00c8f04c73ef/exec-81e201ea-39f1-4f86-8d95-af710a1b403e.png` (`828 × 1900`).
- Browser-rendered implementation: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/request-preview-boarding-final.png` (`1280 × 2145`, desktop CSS viewport at density 1).
- Combined comparison: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/request-preview-comparison-final.png`. Both images were proportionally normalized to a common comparison width; the implementation's shorter default content is intentional because this iteration adds progressive disclosure.
- Verified state: Pet Boarding for Group A (3 rabbits) and Group B (2 cats), Aug 7–21, 2026, within 5 km, sitter pickup and owner return, owner/sitter supplies, detailed routine data, home-fit preferences, and fixed extra-cost allowances.

## Findings and fixes

- [P1] A normal global navbar in pre-publish preview would allow the requester to navigate away and risk losing the editing context.
  - Fix: `/needs/create` and its nested preview route use dedicated flow chrome. The preview brand is non-navigational and the only exit is `Back to edit`, which returns to `/needs/create?restore=preview` and restores the draft at Preview.
- [P2] A field-by-field detail page lacked a coherent story and forced sitters to reconstruct the request mentally.
  - Fix: added a deterministic `About this request` narrative assembled from service type, dates, pet groups, area/radius, transport, and supply arrangements. No invented owner name, pet profile, or image is introduced.
- [P2] Showing every routine and preference by default made the page visually long and reduced scanability.
  - Fix: the narrative, routines, home fit, supplies, visit plan, and custom tasks now expose bounded default content with independent `See more / Show less` controls. Pricing, extra costs, and transport remain fully visible because they are decision-critical.
- [P2] The page needed to communicate the sitter's service responsibility before the detail sections.
  - Fix: added a service-context strip that explicitly distinguishes care in the sitter's home, visits to the owner's home, and custom arrangements.
- Intentional differences from the source mock: requester profile and pet photography are omitted because the creation flow does not collect them. Existing pet-head assets represent group/species information without suggesting real profile photos.

## Interaction and runtime verification

- Completed the real ten-step Boarding creation flow in the in-app browser and opened the routed sitter preview without directly mutating browser storage.
- Verified narrative expansion/collapse and section-level expansion state through visible controls and `aria-expanded`.
- Verified `Back to edit` restores the completed draft and returns to the Preview step.
- Confirmed no global navigation is rendered on the creation or preview route.
- `npx tsc --noEmit` passed.
- `npm run build` passed after allowing the existing `next/font` setup to fetch Google Fonts; only the non-blocking outdated Browserslist data notice remained.
- No actionable P0, P1, or P2 findings remain.

final result: passed

### Iteration 56 — routed sitter detail views

- Source visual truth: `/var/folders/8s/sg3482y94csbxdrllx2d4q9m0000gn/T/codex-clipboard-8b69d819-a19e-493e-87cb-2a31d027c0f6.png` (`1404 × 1046`). This is the compact Pet Boarding preview; the new routed page intentionally represents the expanded sitter-facing state, so the comparison evaluates shared hierarchy and visual language rather than identical information density.
- Browser implementation evidence: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-home-visits-desktop.jpg`, `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-boarding-desktop.jpg`, and `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-custom-desktop.jpg` (`1440px` desktop CSS viewport, device scale 1). Mobile evidence: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-custom-mobile-viewport.jpg` (`390 × 844`, CSS viewport `390 × 844`, device scale 1).
- Full-view comparison: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-comparison.jpg`. Source and implementation were proportionally normalized to a maximum width of `700px` and placed together. The source contains populated boarding data while the implementation capture deliberately exercises the empty/incomplete preview state.
- Focused evidence: the `390 × 844` mobile viewport capture was used to evaluate header actions, hero wrapping, stacked metrics, card widths, and the transition into body content. A separate desktop crop was not needed because the full comparison keeps typography, spacing, color, and hierarchy legible.
- State and primary interactions tested: Home Visits, Pet Boarding, and Custom Care were each selected in the creation flow; Preview was opened; `Preview details as sitter` navigated to the mode-specific route; the Close action returned to the compact Preview and restored its care type and state. The route rendered service-specific sections for visit schedule/tasks, boarding routines/home fit/supplies/transport, and custom tasks/requirements/cautions.
- Fonts and typography: the established sans-serif family, strong title weight, warm-brown uppercase eyebrows, compact labels, and purple accent hierarchy remain consistent with the source. Text wraps without horizontal overflow at `390px`.
- Spacing and layout rhythm: the detail route uses a scrollable page, a sticky close header, a bounded hero, a primary-content/sidebar desktop grid, and a single-column mobile stack. Browser measurement confirmed `390px` viewport width and `390px` document scroll width.
- Colors and visual tokens: existing PetNido purple, warm neutral background, white surfaces, light lavender accents, semantic green/brown tags, borders, radii, and shadows were reused.
- Image and icon fidelity: the existing PetNido favicon is used as the brand asset. All interface icons come from the existing Phosphor icon library; no placeholder, custom SVG, or CSS-drawn visual asset was introduced.
- Copy and content: the detailed route is explicitly labelled `Sitter view preview`. The estimate formula retains the shortened combined exclusion copy `transport and supply costs not included` when both exclusions apply.
- Iteration history: the first mobile capture exposed that the inner page used intrinsic desktop width and clipped content, including the Close action. Adding `w-full` to the inner main container and compacting the mobile header fixed the issue. Post-fix evidence shows a visible close icon, fully bounded hero, stacked metrics, and no horizontal overflow.
- Runtime verification: all three route variants rendered without a visible error boundary after a clean dev-server restart. Direct console-log inspection was not repeated after the final viewport check because browser control stopped at that point; TypeScript and whitespace checks passed.
- No actionable P0, P1, or P2 visual findings remain. The remaining evidence gap is limited to a final direct console-log query and does not affect the verified navigation, restore behavior, rendering, or responsive layout.

final result: passed

### Iteration 54 — compact boarding preview summary

- Source visual truth: `/var/folders/8s/sg3482y94csbxdrllx2d4q9m0000gn/T/codex-clipboard-77f52a95-d94c-4552-b763-aa5bcb7c9493.png` (`990 × 1498`, boarding preview before this iteration).
- Browser implementation captures: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/boarding-preview-compact-final-grid.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1) and `/Users/xiaoguoba/Desktop/petcare/.codex-qa/boarding-preview-compact-mobile-final.png` (`390 × 844`, mobile CSS viewport `390 × 844`, device scale 1).
- Full-view comparison evidence: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/boarding-preview-before-after.png` (`1142 × 816`). The source and implementation card crop were placed together in one comparison image; each side was proportionally normalized to a maximum `620 × 760` area without changing density-dependent layout.
- State: English, light theme, Pet Boarding for two dogs, Aug 14–20, 2026, ¥2,000 per night, one daily Feeding routine, two home needs, no supply arrangements, and Pet taxi.
- Replaced the individually expanded routine cards, full Home fit tag matrix, separate notes panels, supply explanation, and standalone transport section with one bounded `Boarding details` summary.
- Care routines now show total count, schedule-type counts, and at most three unique routine names; Home fit shows category counts; Supplies and Transport each occupy one compact summary card. Additional notes are represented by a small presence indicator instead of repeating their full body.
- On desktop the four summaries use one row. The rendered preview card is `592 × 528.5px`, has no horizontal overflow, and is approximately 73px shorter than the intermediate two-row compact version and far shorter than the source.
- On mobile the summaries use a two-column grid. The preview card is `310 × 865.5px` with no horizontal overflow; scrolling remains expected because the mobile flow also includes its review heading and illustration above the card.
- Typography, palette, radii, border treatment, icons, and imagery reuse the existing flow design system. No source assets were replaced or recreated. Copy retains the decision-critical dates, price, estimate, routine count, home-fit counts, supplies, and transport while removing repeated detail.
- Primary interactions tested: completed the full ten-step Pet Boarding flow, selected pets and dates, saved a care routine, selected Home fit preferences, resolved an area search, selected distance and Pet taxi, entered a budget, and reached Preview. Browser console contained no errors or warnings.
- Focused region comparison was not needed because the full comparison keeps all preview text and the complete post-redesign card legible.
- No actionable P0, P1, or P2 findings remain. The intentional reduction in detail is the target product change rather than fidelity drift.
- TypeScript and whitespace checks passed.

final result: passed

### Iteration 56 — routed sitter detail views (final)

- Source visual truth: `/var/folders/8s/sg3482y94csbxdrllx2d4q9m0000gn/T/codex-clipboard-8b69d819-a19e-493e-87cb-2a31d027c0f6.png` (`1404 × 1046`). The source is the compact boarding summary; the implementation is intentionally the expanded sitter-facing state.
- Browser implementation evidence: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-home-visits-desktop.jpg`, `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-boarding-desktop.jpg`, `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-custom-desktop.jpg` (desktop CSS viewport `1440px`, density 1), and `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-custom-mobile-viewport.jpg` (`390 × 844`, density 1).
- Full-view comparison: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-comparison.jpg`; the source and implementation were proportionally normalized to `700px` maximum width. The different data quantities and detail depth are intentional.
- Focused evidence: the mobile viewport capture clearly exposes the sticky Close action, hero wrapping, stacked metrics, cards, typography, and responsive rhythm; no additional crop was needed.
- Primary interactions tested: each of Home Visits, Pet Boarding, and Custom Care navigates from compact Preview to its own service-specific detail content. Close returns to `/needs/create`, restores the selected mode and draft, and lands on Preview.
- Required fidelity surfaces: existing typography hierarchy, spacing scale, purple/warm-neutral tokens, PetNido favicon, Phosphor icons, and app-specific copy were preserved. The route introduces no placeholder or custom-drawn visual assets. The combined estimate exclusion remains `transport and supply costs not included`.
- Iteration history: the initial mobile version clipped the content and Close action because the nested page retained intrinsic desktop width. Adding `w-full` and compacting the mobile header removed horizontal overflow; post-fix browser measurement was `390px` viewport width and `390px` document scroll width.
- Runtime verification: all three route variants rendered without a visible error boundary after a clean development-server restart. Direct console-log inspection was not repeated after the final browser-control interruption; TypeScript and whitespace checks passed.
- No actionable P0, P1, or P2 visual findings remain.

final result: passed

---

# Guided need-creation flow design QA

## Evidence

- Source visual truth: `/Users/xiaoguoba/.codex/generated_images/019f8c96-299a-72c2-879f-eb5b435e914e/exec-7d2b1ede-811c-49f7-9178-b8a110a12b07.png` (1487 × 1058 px).
- Browser-rendered implementation: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-flow-task-desktop-final.png` (1440 × 1024 px), `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-flow-three-times-desktop-final.png` (1440 × 900 px), and `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-flow-progress-mobile-final.png` (390 × 844 px).
- Combined comparison evidence: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-flow-task-comparison-final.png` and `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-flow-layout-comparison-final.png` (1440 × 480 px).
- Route and state: `http://localhost:3001/needs/create`, English, light theme. Desktop comparison uses Home Visits → Tasks with Feeding expanded, Refresh water collapsed, and the initial Pet 1 selected.
- Normalization: the source and desktop implementation were fitted to equal 720 × 512 panels in the combined comparison so differences were judged at the same visible density.

## Findings

- No actionable P0, P1, or P2 findings remain.
- The route uses its own minimal flow chrome and no dashboard or marketing navigation.
- Desktop layout follows the selected split-screen direction: prompt and quiet illustration on the left, one focused interaction on the right, and persistent Back/Next controls.
- The desktop document height exactly matches the 1440 × 900 viewport; the 390 × 844 document also remains locked to the viewport. Only the content panel can scroll when an unusually long form state requires it.
- Route-specific progress segments are now integrated between Back and Next in the fixed footer. Every available segment remains directly clickable, preserving non-linear editing.
- The initial Pet 1 state intentionally differs from the source's Luna/Milo example because the flow begins before the user has entered pet details.
- The generated pet illustration is sharp, palette-compatible, and does not compete with the form controls.
- Browser verification found no application warnings or errors; only the standard React development-tools informational message appeared.

## Comparison history

### Iteration 1

- [P2] The first implementation wrapped the full work area in a large rounded card, making the experience feel like a dashboard panel rather than a dedicated onboarding flow.
  - Fix: removed the outer border, radius, and shadow so the content sits directly on the warm canvas.
- [P2] The task editor was vertically centered and visually detached from the question.
  - Fix: top-aligned the task panel and shifted the left prompt to match the editor's first-card baseline.

### Iteration 2

- Re-captured and compared the task screen after layout fixes.
- Verified care-type selection, direct progress navigation, task addition, in-place expansion/collapse, priority and pet assignment, and removal.
- Verified the Boarding branch exposes boarding-specific task and requirement screens.
- Verified the responsive first screen at 390 × 844 and rechecked browser logs.
- No new P0, P1, or P2 findings.

### Iteration 3 — single-screen and accordion refinement

- [P2] The progress line consumed a separate row above the work area and made the screen feel vertically stacked.
  - Fix: moved the clickable progress segments into the fixed Back/Next footer and locked the document to the viewport at desktop and mobile breakpoints.
  - Post-fix evidence: `need-flow-schedule-desktop-final.png` and `need-flow-mobile-progress-final.png`.
- [P2] Home Visit frequency, daily visit count, and time preference were split across three screens even though users need to understand them together.
  - Fix: combined them into one compact `Visit schedule` screen. The Home Visit path now contains eight steps rather than ten.
  - Post-fix evidence: `need-flow-schedule-comparison-final.png`.
- [P2] Adding a pet did not reliably communicate which group was being edited, and opening the task picker could leave an existing task editor open.
  - Fix: both lists now use a strict single-open accordion. Adding a pet opens the new pet and closes the previous pet; opening the task picker closes the current task; selecting a task closes the picker and opens only the new task.
- [P2] Boarding copy `Which environments will not work?` made choices such as `No dogs` sound ambiguous.
  - Fix: changed the label to `Environment fit` and the question to `What should your pet’s boarding environment avoid?`.
- Interaction verification: added a second pet, added Feeding and Refresh water tasks, reopened the task picker, switched to Boarding environment fit, and directly navigated with footer progress. A clean browser tab reported no warnings or errors.

### Iteration 4 — progress metadata, density, and scroll-origin fixes

- [P2] Step metadata remained above the work area while the progress segments moved into the footer.
  - Fix: placed the current chapter/step label and step number directly below the footer progress segments, centered between Back and Next. Mobile `Save & exit` moved into the compact header.
  - Post-fix evidence: `need-flow-three-times-desktop-final.png` and `need-flow-progress-mobile-final.png`.
- [P1] Pets, Preview, and Boarding Home needs could begin above the scrollable panel's reachable origin because tall content was vertically centered.
  - Fix: all right-hand panels now top-align their content. Programmatic bottom-to-top checks returned `scrollTop: 0`, with the first element 40 px below the panel top for Pets, Preview, and Home needs.
- [P2] Visit-count controls were compressed beside their heading, and three visit-time controls did not share one row.
  - Fix: moved count controls onto their own row and changed preferred-time fields to a three-column desktop grid, with exact-time inputs stacking inside their own column.
  - Post-fix evidence: `need-flow-layout-comparison-final.png`.
- [P2] Collapsed task cards consumed a full row each, and the exhausted preset picker still said `Choose a task`.
  - Fix: collapsed tasks now form a two-column desktop grid; an expanded task spans both columns. Once all presets are used, the picker changes to `Add a custom task` and shows only the custom input.
- Interaction verification: selected three daily visits, added all seven Home Visit presets, opened the exhausted picker, created five pet groups, and checked Preview and Boarding Home needs scroll origins. The verified browser session reported no warnings or errors.

### Iteration 5 — per-visit tasks, location selection, and richer preview

- [P2] A Home Visit task could be assigned to pets but not to an individual visit when a care day contained multiple visits.
  - Fix: every task now stores one or more visit numbers and exposes compact visit chips labelled with both visit number and preferred time. The collapsed summary also shows its assigned visits.
- [P2] Tasks had no direct way to express execution order.
  - Fix: added drag handles with pointer drag-and-drop plus keyboard Arrow Up/Down reordering. Browser verification moved `Refresh water` above `Feeding` using the accessible reorder handle.
- [P2] Expanded task cards and the add-task affordance did not preserve the compact two-column desktop rhythm requested for this iteration.
  - Fix: expanded and collapsed cards now remain one half-column wide on desktop; `Add another task` and the task picker use the same width. Measured at 1440 × 900: card 301 px, add control 301 px, grid 614 px.
- [P2] Pet age and biological details allowed ambiguous values.
  - Fix: age input strips non-digits, age units are Years/Months with Years as default, Sex is Not specified/Female/Male, and spay/neuter status is Not specified/Yes/No with supporting copy.
- [P2] The area step accepted only free text and did not let the requester refine a private search origin.
  - Fix: added keyword suggestions, real OpenStreetMap raster tiles, an interactive private pin, recentering, and click-to-select coordinates. Selecting `Tennoji Station, Osaka` and clicking the map updated the pin to `34.6500, 135.5403`.
- [P2] Preview omitted the care mode and visit-level schedule summary.
  - Fix: the compact preview now includes service type, start/end date fields, price basis, estimated total, visits per care day, preferred time for each visit, and task count per visit.
- Evidence: `.codex-qa/iteration-5/desktop-tasks.png`, `.codex-qa/iteration-5/desktop-preview.png`, `.codex-qa/iteration-5/mobile-tasks.png`, `.codex-qa/iteration-5/mobile-preview.png`, and `.codex-qa/iteration-5/reference-vs-implementation.png`.
- Responsive verification: 1440 × 900 and 390 × 844. The expanded mobile task remains usable inside the local content scroller and the fixed footer remains visible.
- Console verification: no warnings or errors.

### Iteration 6 — non-displacing task configuration popover

- [P2] Expanding a task increased its grid-row height and pushed later tasks downward, making the list jump while editing.
  - Fix: task configuration now renders as an anchored popover below the selected task header. The header remains 65 px high in both open and closed states, so sibling task positions do not change.
- [P2] The active task previously behaved as a manual accordion toggle and stayed open when attention moved elsewhere.
  - Fix: clicking any task always opens that task, clicking another task transfers the single open popover, and a document-level outside-pointer handler closes it when the user clicks blank space or another control.
- Interaction verification: added Feeding and Refresh water; switched the open panel from Refresh water to Feeding; confirmed both cards remained at `top: 145 px` and `height: 65 px`; clicked blank canvas and confirmed the configuration content disappeared.
- Responsive verification: the anchored popover remains full card width at 390 × 844, stays above surrounding content, and does not obscure the fixed Back/Next footer.
- Evidence: `.codex-qa/iteration-6/desktop-task-popover.png`, `.codex-qa/iteration-6/mobile-task-popover.png`, and `.codex-qa/iteration-6/reference-vs-task-popover.png`.
- Console verification: no application errors; only the expected Next.js Fast Refresh full-reload warning appeared after the source edit.

### Iteration 7 — complete visit defaults and real place lookup

- [P2] Newly added Home Visit tasks defaulted only to Visit 1 even when the schedule contained multiple visits.
  - Fix: standard and custom tasks now initialize with every current visit number selected. Browser verification with three visits produced `Visit 1, 2, 3` in the task summary and three active visit chips.
- [P1] Area search relied on a short hard-coded example list, so valid queries such as `Konohana` returned nothing.
  - Fix: added a same-origin geocoding proxy with cached, explicit user-triggered search. `Konohana` returned `Konohana Ward, Osaka, Osaka Prefecture, Japan` in both endpoint and browser verification.
- [P2] The map had no zoom interaction and map clicks updated only coordinates.
  - Fix: added zoom-in, zoom-out, mouse-wheel zoom, current zoom feedback, and a keyboard-accessible center-pin control. Clicking the map now performs a suburb-level reverse lookup and fills the public area field; browser verification filled `Torishima 5-chome, Konohana Ward, Osaka, Osaka Prefecture`.
- Responsive verification: 1440 × 900 and 390 × 844; the mobile document remained at `scrollWidth: 390` for a `clientWidth: 390` viewport.
- Evidence: `.codex-qa/iteration-7/desktop-geocoding-map.png` and `.codex-qa/iteration-7/mobile-geocoding-map.png`.
- Console verification: no warnings or errors after search, zoom, and reverse lookup.

### Iteration 8 — consolidated dates and transparent price estimate

- [P2] Preview presented start and end dates as separate form-like fields rather than one readable summary period.
  - Fix: replaced them with a single `Care dates` stat using a human-readable range such as `Aug 1, 2026 – Aug 3, 2026`.
- [P2] The estimated total did not explain which scheduled units were multiplied by the selected price.
  - Fix: added a full-width calculation explanation immediately below the date/price/total row. Home Visits now states the date-window frequency, resulting care days, visits per care day, total visits, price per visit, and total. Pet Boarding states boarding days × daily price = total. Range and open-price modes receive matching explanations.
- Responsive verification: the three summary stats stack on mobile, the explanation remains directly below them, and the 390 px viewport reported no horizontal overflow.
- Evidence: `.codex-qa/iteration-8/desktop-preview-estimate.png` and `.codex-qa/iteration-8/mobile-preview-estimate.png`.
- Console verification: no warnings or errors.

### Iteration 9 — floating task picker, map panning, and compact review hierarchy

- [P2] The task-choice panel still occupied a grid cell, changed the list flow, changed the trigger label to `Close task picker`, and stayed open after attention moved elsewhere.
  - Fix: `Add another task` is now a stable 66 px trigger with an anchored popover. Selecting a preset or submitting a custom task closes the picker; clicking outside closes it without adding anything. The trigger never changes to a close action. Desktop measurement confirmed the picker wrapper remains 66 px while the 474 px panel is positioned independently.
- [P2] The full task picker could be cut off by the fixed mobile footer.
  - Fix: added non-displacing scroll allowance while the picker is open. At 390 × 844, the content panel can scroll from the unchanged trigger through all presets to the custom-task input.
- [P1] The map could place a pin but could not be panned, while trackpad wheel events could advance several zoom levels too quickly.
  - Fix: added pointer-captured drag panning that does not accidentally place a pin, and accumulated/throttled wheel zoom. Browser verification dragged the map while keeping the saved pin at `34.6545, 135.5155`; one control click changed Zoom 13 → 14 and one wheel gesture changed Zoom 14 → 15.
- [P2] Preview still treated estimate details as a calculation walkthrough and repeated pets/frequency information in multiple sections.
  - Fix: dates now occupy one full-width row with total days; frequency, visits per care day, total visits, and unit price share one statistics row; estimated total has only a symbolic formula. Visit Plan now says only visits per care day and lists task counts for every pet group inside each visit. The standalone Pets section was removed.
- Responsive verification: Preview and the task picker were checked at 1440 × 900 and 390 × 844 with no horizontal overflow.
- Evidence: `.codex-qa/iteration-9/desktop-task-picker.png`, `.codex-qa/iteration-9/desktop-map-dragged.png`, `.codex-qa/iteration-9/desktop-preview-restructured.png`, `.codex-qa/iteration-9/mobile-preview-restructured.png`, and `.codex-qa/iteration-9/mobile-task-picker-scrolled.png`.
- Console verification: no warnings or errors.

### Iteration 10 — aligned visit controls, intentional task entry, and safer map zoom

- [P2] The preset visit-count controls and custom-number input did not share a visual baseline.
  - Fix: all four controls now use a 48 px height and the row explicitly centers its children. Browser measurements confirmed identical `top: 292 px`, `bottom: 340 px`, and `height: 48 px` values.
- [P2] Entering Tasks opened a task-related panel before the requester chose to edit anything.
  - Fix: both the active task and `Add another task` picker initialize closed. The verified initial Tasks snapshot contains only the collapsed trigger.
- [P1] Trackpad zoom could be interpreted by the browser page rather than remaining inside the map.
  - Fix: the map now owns a native non-passive wheel listener, prevents the browser default, stops propagation, and retains accumulated/throttled one-level map zoom. A real map-centered wheel gesture changed `Zoom 13` to `Zoom 14` while document width stayed 1280 px and `visualViewport.scale` stayed 1.
- [P2] Preview repeated the public area in its generated title and had lost the visual identifier for each pet group.
  - Fix: generated titles now contain only care type and pet summary; the area remains a separate field. Compact circular pet-type icons were restored beside every pet group in Visit Plan. Browser verification returned `Home Visits for a pet`, with the area on its own line and one SVG icon in the pet task-count row.
- TypeScript and whitespace checks passed. Browser interaction produced no flow-specific runtime failures; the development console still contains the existing Auth.js session-fetch error from the local authentication setup.

### Iteration 11 — editable visit count, dismissible pet details, and step illustrations

- [P1] The custom visits-per-day input was controlled directly by the numeric schedule state, so deleting its only digit immediately restored the previous value.
  - Fix: introduced a string editing draft for the field. It can remain empty while the user edits, accepts digits from 1–6, and updates the schedule only after a digit exists. Real keyboard verification selected `6`, deleted it to a genuinely empty field, then entered `5`, producing five visit-time controls.
- [P2] Pet detail accordions stayed open when the requester moved attention outside the active pet card.
  - Fix: the expanded card now owns an outside-pointer boundary. Clicking the page heading collapsed the detailed fields while preserving the pet summary card.
- [P2] The area input lacked a one-action way to clear a selected or typed location.
  - Fix: added a keyboard-accessible trailing clear button that appears only when the input has content and clears the query, results, open suggestion state, and search error together. Browser verification cleared `Konohana` and removed the button once empty.
- [P2] Visit Plan identified each pet group but did not state how many pets the group represented.
  - Fix: added a compact `×N` badge beside the pet name and type avatar. A two-pet group rendered `×2` in every visit card.
- [P2] Only Tasks used the left illustration area, so other steps felt visually unfinished.
  - Fix: every screen now receives a context-specific illustration from the existing project assets, plus the current step icon as a small overlay. Illustrations remain desktop-only so the mobile form retains its compact, no-extra-scroll layout. Browser checks confirmed the Care type, Pets, Visit schedule, Area, and Preview illustrations loaded with step-specific alternative text.
- TypeScript and whitespace checks passed. The known local Auth.js session-fetch error remains unrelated to this flow.

### Iteration 12 — unified unique artwork and floating pet editor

- [P2] Several steps reused the same illustration while the remaining images came from visually unrelated legacy asset sets.
  - Fix: generated one purpose-built 1448 × 1086 sprite sheet containing twelve equal 362 × 362 scenes in a consistent warm-taupe and muted-lavender line-art style. Eleven request steps map to distinct panels in semantic order. Each desktop illustration renders at a fixed 270 × 270 size with no overlay icon.
  - Asset: `public/images/need-flow-step-sprite-v1.png`.
- [P2] Expanding a pet card changed document flow and pushed every following pet or action downward.
  - Fix: pet editing now opens in a locally scrollable anchored popover below the 72 px summary card. Browser measurement kept `Add another pet` at `top: 229 px` and the card at `height: 72 px` in both open and closed states, while the editor rendered independently at `top: 224 px`.
- [P2] The pet summary repeated the selected type and used an unpluralized phrase such as `2 Cat`.
  - Fix: the first line now contains only the pet name or type, while the second line uses the language-neutral count label `Number: N`. Browser verification produced `Cat` and `Number: 2` with no repeated or incorrectly pluralized type.
- [P1] The flow's initial pet used a random UUID during server and client rendering, which could trigger a hydration mismatch.
  - Fix: the one default pet now uses a deterministic initial ID; subsequently added pets still receive UUIDs.
- TypeScript and whitespace checks passed.

### Iteration 13 — collapsed pet entry, bounded detail scrolling, and blended canvas

- [P2] The first pet editor still opened automatically on entry.
  - Fix: pet expansion state now initializes empty, matching the task editor and task picker behavior.
- [P1] Opening Optional pet details could make the out-of-flow editor taller than the visible form panel, forcing confusing nested movement and hiding the last fields behind the fixed footer.
  - Fix: the anchored editor now owns responsive viewport-based maximum heights: `100dvh − 390px` on mobile, `100dvh − 330px` on medium screens, and at most 510 px on desktop. It remains locally scrollable with overscroll containment and additional bottom padding, so its final controls stay reachable without moving the outer form.
- [P2] The illustration tile and white form column read as two hard rectangular panels against the page.
  - Fix: the flow canvas, left narrative section, and right form section now share the same warm background. Illustration tiles use a soft radial alpha mask, fading their ivory edges into the canvas instead of showing a square crop boundary.
- TypeScript and whitespace checks passed. The local in-app browser connection timed out against the already-running port 3001 process during the final reload; responsive constraints were checked statically after compilation.

### Iteration 14 — always-visible deletion and scroll-container-aware pet editor

- [P2] Pet groups and tasks could only be deleted after opening their configuration panels.
  - Fix: every pet and task summary header now includes a persistent 36 px pale-red delete button with a trash icon, hover/focus states, tooltip, and item-specific accessible name. The duplicate task removal action was removed from the expanded panel.
- [P1] A tall pet editor could extend beyond its nearest outer scroll region, and the container could clip its bottom shadow even when viewport-based height limits were applied.
  - Fix: the active pet editor now measures its nearest scrollable ancestor rather than only the browser viewport. A ResizeObserver responds to Optional details and other content-height changes. If the editor bottom would leave the visible scroll region, the active pet card is moved to the region's top; the editor then receives a pixel max-height calculated from the remaining visible space with 30 px reserved below for its shadow.
- TypeScript and whitespace checks passed. Browser automation remained unavailable because the existing local port 3001 page connection timed out; implementation paths and accessible labels were checked statically after compilation.

### Iteration 15 — full-card task drag image and fixed-height pet editor

- [P2] Native task dragging used the six-dot handle itself as the draggable element, so the browser drag image showed only that icon.
  - Fix: the complete task article is now the native draggable element. A pointer-down ref on the six-dot handle authorizes drag start, so dragging elsewhere on the card is still blocked while the browser captures the full card as its drag image. Keyboard Arrow Up/Down reordering remains available on the handle.
- [P1] Pet editor height still changed according to its card position and remaining space, producing inconsistent floating windows.
  - Fix: every editor inside the same outer scroll region now receives one fixed height derived only from that region's visible height, capped at 510 px. Optional details changes only the editor's internal scrollable content and no longer changes its frame.
- [P2] The pet editor bottom and shadow could remain clipped when the outer region had additional scroll capacity.
  - Fix: after the fixed height is applied, the editor measures its hidden bottom. When the nearest outer container is scrollable, it advances by exactly that hidden amount plus a 30 px shadow allowance, bringing the complete editor bottom into view without forcing the pet card to the top.
- TypeScript and whitespace checks passed. Browser automation remained unavailable because the existing local port 3001 page connection timed out during DOM capture.

### Iteration 16 — keep the active pet header visible while revealing the editor bottom

- Reference target: `codex-clipboard-c6f52e93-44ea-4c8c-a51e-84902913e07a.png`. The complete active pet header remains visible above its editor, unlike the clipped header in `codex-clipboard-2d555e00-05f1-4941-81e5-d4e8ebed9730.png`.
- [P1] Scrolling by the editor's hidden-bottom distance could move the first pet header past the outer region's top edge and clip its border.
  - Fix: fixed editor height is now calculated as outer visible height minus a 12 px top inset, the complete active card height, the 8 px editor gap, and a 34 px bottom shadow allowance. When repositioning is required, the outer region aligns the pet card to exactly 12 px below its own top rather than scrolling by the editor overflow amount.
- [P2] The editor bottom remained visually tight against the outer clip boundary.
  - Fix: increased the reserved bottom space to 34 px, leaving the editor shadow visible and separating the card edge from the outer boundary.
- TypeScript and whitespace checks passed. Prototype capture and same-viewport comparison remain blocked by the local in-app browser connection timing out against port 3001.

### Iteration 17 — compact pet editor with Optional details internal reveal

- Reference target: `codex-clipboard-e583757e-a51f-4351-be86-a218c7bcb3c5.png`. The floating editor should end shortly after the collapsed `Optional pet details` control instead of filling all remaining vertical space.
- [P1] Calculating the editor from the full available outer height left a large empty area beneath the collapsed Optional control.
  - Fix: the editor now measures its natural collapsed content height and uses the smaller of that height, the 510 px desktop cap, and the available outer-scroll height. Bottom padding was reduced from 32 px to 20 px while retaining 20 px outside the panel for its shadow.
- [P1] Expanding Optional details should reveal the additional fields without increasing the floating editor frame.
  - Fix: Optional details is now controlled by the pet editor. Its frame retains the measured collapsed height; after expansion, the Optional section scrolls to the top of the editor and the newly revealed fields scroll only inside that fixed frame. Switching pets resets Optional details to collapsed.
- TypeScript and whitespace checks passed. Prototype capture and same-viewport comparison remain blocked by the local in-app browser connection timing out against port 3001.

### Iteration 18 — preserve floating-editor shadow at the list boundary

- Reference target: `codex-clipboard-7a7d14eb-4d80-4dcf-8fe5-2efb387194de.png`. When the final pet group opens, the floating editor reaches the outer scroll region's content boundary and its lower shadow is clipped.
- [P1] Because the editor is absolutely positioned, its height and shadow do not contribute to the pet list's scrollable document height.
  - Fix: after the compact editor height is applied, the list measures the editor's lower edge against the normal-flow `Add another pet` button. Only the missing distance plus a 20 px shadow allowance is added as an invisible tail spacer after the button. Existing pet cards and the add button keep their positions, while the outer region gains exactly enough additional scroll range to lift the last editor clear of its clipping edge.
- TypeScript and whitespace checks passed. The in-app browser connected to the existing local tab, but reload/DOM capture timed out and reset the browser session, so same-state visual verification remains blocked.

### Iteration 19 — freeze pet editor geometry and overlay the task picker

- [P1] Pet edits such as selecting a type or typing a label/quantity retriggered the compact-height measurement because the complete `pets` array was an effect dependency.
  - Fix: editor geometry is now measured only when a pet card opens (and on viewport resize). Field changes and Optional details only update scrollable content inside the already-fixed frame. Every card-switch and add action collapses Optional details before measuring the new pet.
- [P2] Opening `Add another task` reserved 520 px of grid padding, making the picker behave like an in-flow expansion rather than a floating editor.
  - Fix: removed the picker-specific grid padding. The existing absolutely positioned picker now overlays the task region from its add-card anchor, matching the non-pushing interaction used by the pet editor.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 20 — place the task picker directly over its add card

- Reference comparison: `codex-clipboard-dd5cd4e8-923c-4b32-9ccb-f703de05c7b7.png` shows the picker starting below `Add another task`; the requested behavior follows the overlay relationship in `codex-clipboard-46bb7091-1f94-4c1f-aa42-287a7749f07c.png`.
- [P1] Removing grid padding made the picker out-of-flow but retained its `top: calc(100% + 8px)` anchor, so the add card remained visible above it.
  - Fix: the picker now anchors at `top: 0` and fully covers the add card. While open, the underlying add button stays invisible to preserve grid geometry and is removed from keyboard navigation/accessibility exposure; closing or completing the picker restores it.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 21 — simplify visiting-day frequency and expose the six-visit limit

- [P2] `Specific dates` relied on free-form comma-separated text for visit-date calculations, making the input format unclear and error-prone.
  - Fix: removed `Specific dates` from the visit schedule UI and deleted its state, preview label, comma parser, and estimate path. Visiting days now offers Every day, Every 2 days, Every 3 days, and Custom interval.
- [P1] The custom visits-per-day input silently converted values above six to six, so users received no explanation of the limit.
  - Fix: the input now preserves the typed value, marks itself invalid, and displays an accessible inline error when the value exceeds six. The actual visit plan is updated only for values from one through six; selecting a preset clears the error. Supporting copy now states the six-visit maximum before entry.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 22 — submission readiness, editable schedule numbers, and visit-grouped tasks

- Visits per care day now keeps an editable text draft, silently caps values above six while showing an adjustment notice, and normalizes empty, non-numeric, or sub-one values to one on blur.
- Custom visit intervals now start at four, can be cleared while editing, normalize invalid values to one on blur, and switch directly to the matching Every day / Every 2 days / Every 3 days preset when one through three is entered.
- The request starts with no pet records. The first action reads `Add a pet or pet group`; later actions read `Add another pet`. Required pet type and Other-type details receive inline errors, red summary text, and invalid card borders.
- Start and end dates are independently required. Invalid cross-order selections clear the newly changed field instead of constraining the opposite date input.
- Home-visit tasks are grouped under Visit headings and repeated only in the visits to which they apply. Task summaries now explicitly count pet groups. The empty-state action reads `Add a task`, changing to `Add another task` after the first task.
- Preview readiness now controls publishing. Missing pets, dates, tasks, area, or budget appear in restrained rose-red states; Publish is disabled; and the matching progress segments turn red. The selected error color family uses `#a74755` for text, `#b65361` for progress, and `#e1aab2` for borders.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 23 — deferred validation and repeatable task templates

- Progress errors are now gated by a visited-step set. A step remains neutral on its first visit and turns red only if the user leaves it incomplete; Preview continues to show all blocking issues immediately.
- Inline validation follows the same delayed rule for Dates, Tasks, Area, and Budget. Pet groups additionally become validation-visible when their editor is collapsed or replaced by another open group.
- Date conflicts now preserve the most recently selected date: choosing a later start clears an incompatible end, while choosing an earlier end clears an incompatible start.
- Standard tasks are now repeatable templates rather than one-time options. Every selection creates a unique task-plan instance with its own priority, pet-group selection, and visit assignment. This supports configurations such as morning Feeding for cats and dogs plus evening Feeding for cats only.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 24 — pet/task coverage and budget-range validation

- Preview now distinguishes an entirely empty pet list from incomplete required details and identifies the incomplete pet groups by label.
- A newly added pet group stays neutral while its editor is open, even after the Pets step has previously been visited. It becomes validation-visible only after that editor is collapsed; existing groups still validate when the user returns to the step.
- Task readiness now checks relationships, not only task count: every task must match a current pet group, and every pet group must have at least one task in every applicable visit. Task cards, Visit groups, and Preview Visit plan expose missing matches with restrained rose-red warnings and zero-task labels.
- A range budget is valid only when both values are positive and `From` is lower than `Up to`. The Budget step and Preview estimated total now explain an inverted range instead of treating it as publishable.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 25 — preview-wide progress errors and visit-level task rules

- Opening Preview now reveals every blocking step in the bottom progress line, including steps not previously visited. The error state remains visible after navigating back from Preview.
- Task coverage is now visit-level rather than pet-per-visit: every Home Visit must contain at least one task, and every task must match at least one current pet group. Different visits may intentionally serve different pets without creating false errors.
- Preview keeps per-pet task counts informational, including neutral zero counts. Only a completely empty Visit receives a rose-red card state and warning.
- Budget-range ordering is validated directly beneath the `Up to` field as soon as both values exist. Missing-value errors also stay beside their relevant money input after the step is visited; the generic top alert and redundant range explanation were removed.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 26 — validation reveal and task-picker shadow clearance

- Before a care type is selected, the footer now reads only `Step 1`; the total step count appears after a branch is known.
- The empty Pets step now receives the same deferred inline treatment as Tasks, with an `Add at least one pet or pet group.` alert after the step is left incomplete.
- Viewing Preview now reveals both progress errors and field-level/section-level errors when returning to Pets, Dates, Tasks, Area, or Budget, even if that step had not previously been opened.
- The task picker measures its rendered panel and adds matching scroll-tail clearance plus a shadow safety margin. Its bottom edge can now scroll clear of the clipped content boundary across task sets and viewport sizes.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 27 — whole-plan pet coverage and concise Visit preview

- Task readiness now requires every pet group to appear in at least one task somewhere in the complete care plan. This does not reintroduce per-Visit pet coverage: morning and evening visits may still intentionally serve different pets.
- After validation is revealed, the Tasks step names every pet group with no assigned task. Preview reports the same blocking issue with `No tasks have been added for …` and keeps Publish disabled.
- Visit cards in Preview now omit pet rows whose task count is zero. Each card shows only pets actually served in that visit, while empty-Visit validation remains unchanged.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 28 — linked date calendars and plan-level care notes

- Replaced the two browser-native date inputs with controlled DayPicker popovers. An empty Start picker opens at the selected End month, and an empty End picker opens at the selected Start month, avoiding a return to the current month between related selections.
- Date selection still follows the latest-choice-wins rule: choosing an incompatible Start clears the older End, and choosing an incompatible End clears the older Start. No min/max restriction prevents selecting the replacement date.
- Added optional plan-level care notes beneath the task builder for instructions that do not belong to one visit, with examples such as weekly brushing and monthly nail trimming.
- Additional care notes are included in Preview as a dedicated section when present.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 29 — Home Visit travel-cost budget

- Added an optional Home Visit-only travel allowance beneath the main care budget. It remains off by default and is ignored for Boarding and Custom Care.
- When enabled, users choose either a fixed amount per visit or reimbursement of actual travel costs. A fixed allowance receives deferred inline validation and blocks publishing until a positive amount is entered.
- Preview displays the selected travel-cost arrangement separately from the care price. Fixed travel allowances are included in the estimated total for every visit; actual-cost reimbursement is explicitly excluded from the estimate and described as a separate reimbursement.
- Updated the Home Visit estimate formula to explain whether travel is included as a fixed per-visit amount or excluded as an actual cost.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 30 — budget hierarchy and grouped Preview statistics

- In Exact budget mode, the amount and price-flexibility control now share one desktop row. `Allow sitter price suggestions` uses a compact 12px checkbox treatment under a `Price flexibility` label, separating it visually from the full-width travel-allowance decision.
- Home Visit Preview now groups Care dates, Visit frequency, Visits per care day, and Total visits in a four-column desktop row. Price per visit and Travel costs form a separate two-column row; Travel costs remains visible as `Not provided` when disabled.
- Home Visit formulas now consistently use total visits: no travel reads `Estimated total = total visits × price per visit`; fixed travel adds the per-visit allowance inside the multiplication; actual-cost reimbursement retains the base formula and adds the exclusion as a parenthetical note.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 31 — compact, content-weighted Preview metrics

- Replaced the six Home Visit statistic cards with background-free text metrics, removing repeated borders, purple fills, and per-card padding.
- The desktop schedule row now uses content-weighted columns: Care dates receives the most space, Visit frequency receives the next-largest column, and the two numeric metrics use compact columns.
- Price per visit and Travel costs remain a distinct second group separated only by a thin rule and compact vertical spacing, rather than another pair of cards.
- Metric values wrap naturally instead of truncating longer dates or travel-cost descriptions; validation remains visible through restrained red text.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 32 — wider flow shell and form-weighted desktop split

- Increased the shared desktop width ceiling for Header, main content, and Footer from 1240–1320px to 1480px so the flow uses more of wide screens while keeping all three regions aligned.
- Shifted the main desktop split toward the working area: approximately 39/61 at the `lg` breakpoint and 35/65 at `xl`, replacing the previous 44/56 balance.
- Raised the form-column content ceiling from 650px to 780px, giving dense steps and Preview metrics room without changing mobile stacking.
- Shortened `Visits per care day` to `Visits / care day`, preventing the compact numeric column from pushing Total visits beyond the content padding.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 33 — restored visual balance and adaptive vertical alignment

- Restored the original 44/56 desktop split between the illustration/context panel and form panel while retaining the wider 1480px shell.
- Added automatic vertical margins to the form content at desktop sizes. Short steps center within the available panel height; when content exceeds that height, auto margins collapse and the scrollable content begins at the top.
- Separated Care dates into its own Preview group. Visit frequency, Visits per care day, and Total visits now form a three-column content-weighted group beneath it.
- Restored the full `Visits per care day` wording now that it no longer competes with the date column.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 34 — auto-reveal the task picker

- Opening Add a task / Add another task now measures the picker, adds its required scroll-tail space, and scrolls the nearest form container until the complete panel and bottom shadow margin are visible.
- Scrolling is scoped to the right-hand form region rather than the page, matching the established pet-editor behavior.
- The picker now has a viewport-aware maximum height with internal overscroll containment. On shorter screens, its outer panel stays fully visible while its options scroll internally.
- ResizeObserver and animation-frame coordination keep the reveal accurate when the option set or panel height changes.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 35 — visit-specific task assignments and explicit editor commits

- Rebuilt task state around independent per-Visit assignments. Configuring one task type across multiple visits now creates a unique assignment ID for each Visit, so changing morning pets cannot mutate the evening assignment.
- Standard task templates disappear from the picker after their first saved configuration. `Configured tasks` provides the explicit edit entry; its unified editor controls which visits use the task, the pet groups for each visit, and per-visit importance.
- Visit task cards are now read-only summaries with reorder and delete controls. Removing a Visit card removes that assignment from the unified configuration; removing the final assignment restores the standard template to the picker.
- Drag ordering is scoped to each Visit. Editing a configuration preserves existing assignment IDs and order where possible, creates IDs for newly enabled visits, and deletes assignments for disabled visits.
- Added Save task / Cancel to the task configuration. Clicking outside discards the draft rather than silently saving it; new standard/custom tasks do not enter the plan until Save task succeeds.
- Added Save pet / Cancel to pet editors. Existing-pet edits restore their captured snapshot on cancel, while canceling a newly added unsaved pet removes the temporary group. Required pet details are checked before Save pet can commit.
- Preview now combines Visit frequency and Visits per care day into `Visit schedule`, such as `1 visit / Every day`, and groups Care dates, Visit schedule, and Total visits in one row.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 36 — compact configuration controls and task-section order

- Restored the Configure task overlay to the same half-width desktop footprint as Choose task; both remain full width on mobile.
- Reordered the task screen to show validation, Configured tasks, Add task, Visit assignment groups, and additional notes in that sequence.
- Replaced the `· Edit` text in Configured tasks with dedicated, accessible edit and delete icon buttons.
- Deleting a configured task now filters by template/configuration ID, removing every associated Visit assignment at once and restoring the standard task option to the picker.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 37 — inline task action and adaptive task layouts

- Moved the compact Add task action into the Configured tasks flex flow, directly after configured task pills. The action and pills wrap together based on available width.
- Decoupled both Choose task and Configure task overlays from the trigger width; each now spans the full right-hand form content region.
- Changed standard task choices from a vertical list to content-width flex items that wrap, substantially reducing picker height when several short labels fit on one row.
- Changed Configure task Visit sections to a responsive two-column desktop grid that wraps to one column when space is limited.
- Replaced the fixed two-column Visit assignment grid with content-sized flex cards: cards use their natural width above a usable minimum and wrap when needed, while remaining full width on mobile.
- Retained measured scroll-tail clearance and automatic reveal for the new full-width overlays.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 38 — overlay placement, compact inactive Visits, and pet flow cards

- Moved task-overlay clearance to the end of the task content so Choose task / Configure task stays out of document flow directly beneath the inline Add task action and overlays the Visit groups instead of pushing them down.
- Added `items-start` alignment to the Configure task Visit grid. Disabled Visit cards now keep only their compact header height rather than stretching to match an enabled card in the same row.
- Standardized configuration footers: Cancel occupies the far left and the primary Save action remains on the far right. The pet editor uses the same arrangement.
- Converted collapsed pet groups and Add pet into content-sized flex items that wrap. An opened pet group expands to full form width so its floating editor remains full width.
- Converted Pet type choices from a fixed four-column grid to content-width options that wrap.
- Added country/region flag emoji to JPY, USD, EUR, CNY, and KRW native select labels for faster scanning without introducing image assets or a custom select dependency.
- TypeScript and whitespace checks passed. Visual verification remains blocked by the local in-app browser timeout documented above.

### Iteration 39 — structural task-overlay anchoring fix

- The task overlay itself was absolute, but its containing anchor still followed the Visit groups in DOM order; CSS order utilities did not reliably change that containing block position in the rendered layout.
- Physically moved the zero-height overlay anchor immediately after Configured tasks and before every Visit group. Choose task / Configure task now originates beneath Add task and overlays the following Visit content.
- Kept the scroll-tail spacer after the Visit groups so it supplies scroll clearance without moving the overlay anchor or pushing the groups away from Add task.
- TypeScript and whitespace checks passed.

### Iteration 40 — remove obsolete overlay spacer

- Removed the empty `order-6` task div and its `pickerTailSpace` state. It was a legacy scroll-tail spacer for the earlier overlay placement and could create visible blank space in the task flow.
- Removed all remaining task-section `order-*` utilities. The screen now relies exclusively on the corrected DOM sequence: Configured tasks, zero-height absolute overlay anchor, Visit groups, and notes.
- The overlay remains viewport-capped with internal scrolling and retains automatic nearest-scroller positioning without inserting layout content.
- TypeScript and whitespace checks passed.

### Iteration 41 — structured pet-group hierarchy

- Added a `Pet groups` heading and concise management hint so the section has the same clear hierarchy as Configured tasks.
- Moved the compact Add pet action above the pet-card collection and changed it to a fully rounded pill that wraps naturally with its label.
- Kept collapsed pet cards content-sized beneath the action while preserving the existing full-width floating editor for the active pet group.
- TypeScript and whitespace checks passed.

### Iteration 42 — Add pet overlay and Other row

- Source interaction reference: `/var/folders/8s/sg3482y94csbxdrllx2d4q9m0000gn/T/codex-clipboard-1a421798-4148-4969-9576-df40b309f1b3.png` (`1484 × 690`). This is a task-panel interaction reference rather than a pixel-identical Pets-screen mock.
- Browser implementation capture: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/pets-add-other-implementation.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1).
- Combined comparison: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/pets-add-panel-comparison.png` (`1600 × 640`), with both images fitted to equal `800 × 600` comparison cells.
- The unsaved pet draft now uses a zero-height overlay anchor immediately under the unchanged Add pet action. No temporary full-width pet-summary card is rendered before the draft is saved.
- Kept the Add label in its initial state while the first pet is still only a draft; it changes to `Add another pet` only after a saved pet exists.
- Moved Other to a dedicated row. When selected, its button, `What kind of pet?` label, and input share that row and the input consumes the remaining width.
- Adjusted automatic scrolling to keep the Add action and the complete floating editor visible together instead of scrolling the action above the viewport.
- Tested Home Visits → Pets → Add pet → Other in the in-app browser. Add and Other interactions worked, the panel remained above the pet-card collection, and the browser console contained no errors.
- Typography, color tokens, icons, illustration assets, copy, radii, and shadow treatment remain consistent with the existing flow. The reference governs placement and overlay behavior, so the Pets screen intentionally retains its own content and illustration.
- No P0, P1, or P2 findings remain for this interaction state. TypeScript and whitespace checks passed.

### Iteration 43 — consolidated pet types and inline Other input

- Source issue capture: `/var/folders/8s/sg3482y94csbxdrllx2d4q9m0000gn/T/codex-clipboard-13a04f61-853d-469c-9dea-990750eb7c1d.png` (`1380 × 402`).
- Browser implementation capture: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/pet-type-other-inline-implementation.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1).
- Combined comparison: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/pet-type-other-inline-comparison.png` (`1600 × 640`) with equal `800 × 600` comparison cells.
- Removed Small mammal and Reptile from the supported type choices and removed both related example-copy branches; these pets now use Other.
- Rebuilt Other as a single no-wrap control group containing the option button and, when selected, a compact `Enter pet type` input. The group participates in the same wrapping flow as Dog, Cat, Rabbit, Bird, and Fish.
- Removed the visible `What kind of pet?` label while retaining an accessible input name and the existing missing-type validation message.
- Checked the Home Visits → Pets → Add pet → Other interaction in the in-app browser. Only six type options render, the Other group stays visually intact when wrapping, and the browser console contains no errors.
- Typography, palette, icons, spacing, radii, shadows, illustration quality, and unrelated copy remain unchanged. No P0, P1, or P2 findings remain; TypeScript and whitespace checks passed.

### Iteration 44 — compact saved-pet edit trigger

- Browser implementation capture: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/saved-pet-compact-trigger.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1).
- Replaced the saved pet card's disclosure caret with the existing pencil/edit icon treatment.
- Opening a saved pet no longer changes the summary card to full form width; the compact card remains content-sized while the editor floats beneath it at the full form-content width.
- Editor positioning is measured from the pet-list container so the full-width panel stays aligned with the form even when its trigger card is compact or wrapped onto another row.
- Tested create Fish → Save pet → reopen Fish in the in-app browser. The card width remained fixed, the editor aligned below it without entering document flow, and the browser console contained no errors.
- TypeScript and whitespace checks passed.

### Iteration 45 — compact pet editor with fixed action footer

- Browser implementation capture: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/pet-editor-fixed-footer.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1).
- Split the floating editor into an independently scrolling content body and an absolutely positioned bottom action footer.
- Cancel and Save pet now remain visible at the panel bottom while Optional pet details scroll behind their reserved footer clearance.
- Removed duplicated footer space from the compact-height calculation and capped the collapsed editor at `320px`; expanded optional details can grow within the existing viewport-aware maximum.
- Verified measured states in the in-app browser: collapsed editor `320px`; expanded editor `396px`; the footer bottom remained aligned within 1px of the panel bottom.
- Tested saving, reopening, expanding Optional pet details, and internal scrolling. The browser console contained no errors; TypeScript and whitespace checks passed.

### Iteration 46 — unified Add/Edit spacing and flat footer divider

- Browser implementation capture: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/pet-editor-unified-spacing.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1).
- Standardized the Optional-details-collapsed height to `320px` for both a newly added pet draft and an existing pet being edited, eliminating their different footer gaps.
- Removed the action footer's upward box shadow; the footer now relies only on its neutral top border for separation.
- Browser measurements confirmed Add panel `320px`, Edit panel `320px`, and computed footer shadow `none` in both states.
- The browser console contained no errors; TypeScript and whitespace checks passed.

### Iteration 47 — request-local pet groups

- Browser captures: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/pet-request-compact-editor.png` and `/Users/xiaoguoba/Desktop/petcare/.codex-qa/pet-request-compact-editor-edit.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1).
- Reframed the section as `Pets in this request`: this step now records only pet type, an optional pet/group label, and quantity.
- Removed breed, age, sex, neuter status, pet notes, and the Optional pet details disclosure. Those attributes belong to individual reusable pet profiles rather than a request-local group.
- Replaced the fixed-height, internally scrolling editor and absolute footer with a naturally sized floating panel. Cancel and Save pet now follow the compact form in normal document flow.
- Preserved the full form-width overlay, compact saved-pet trigger, outside-click cancellation, validation, and scroll-tail space that protects the panel shadow from clipping.
- Verified both Add and Edit states in the in-app browser. Their content density and action spacing match, and the editor has no internal scroll region.
- TypeScript and whitespace checks passed.

### Iteration 48 — Add action follows saved pet cards

- Source issue capture: `/var/folders/8s/sg3482y94csbxdrllx2d4q9m0000gn/T/codex-clipboard-ce584384-4760-47d1-a642-f352116737d9.png` (`1366 × 438`). The screenshot documents the previous order; the requested target intentionally reverses its Add action and saved-card rows.
- Browser implementation capture: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/pet-add-below-cards.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1).
- Full-view comparison: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/pet-add-below-cards-comparison.png`; no focused crop was needed because row order and wrapping are clearly visible in the full comparison.
- Reordered the Pets section to title, saved pet cards, and then a full-width Add-action row. The Add button therefore always starts on the row after all saved cards, including when the cards wrap.
- Moved the unsaved draft overlay anchor after the Add row. Browser interaction capture `/Users/xiaoguoba/Desktop/petcare/.codex-qa/pet-add-below-cards-overlay.png` confirms the editor opens immediately below the button and above no unrelated content.
- Fonts/typography, colors/tokens, illustration quality, icons, copy, card dimensions, and existing responsive behavior remain unchanged. No actionable P0, P1, or P2 findings remain.
- TypeScript and whitespace checks passed.

### Iteration 49 — debounced area search and retina map

- Browser implementation capture: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/area-debounced-retina-map.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1).
- Added a 650ms input debounce: location search now starts after typing pauses, while the Search button remains available for immediate execution. Enter no longer triggers a dedicated keydown search.
- Added request cancellation so an older geocoding response cannot replace results for a newer query.
- Replaced standard-density map tiles with 2× CARTO tiles backed by OpenStreetMap data and aligned tiles to whole CSS pixels for sharper labels.
- Removed the visible pinned coordinates and zoom readout beneath the map; required map attribution remains inside the map.
- Browser verification confirmed that typing `Konohana Osaka` without pressing Enter or Search automatically entered the searching state after the debounce interval. No coordinate or zoom readout remained.
- TypeScript and whitespace checks passed.

### Iteration 50 — colorful map and location-biased POI search

- Browser implementation capture: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/area-voyager-map.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1).
- Replaced the low-saturation Positron tiles with high-density CARTO Voyager tiles, restoring colored roads, water, green spaces, and more visible place labels.
- Forward geocoding now sends the current map center as a Nominatim viewbox preference and searches both address and POI layers, improving nearby results for queries such as FamilyMart.
- Added optional IP-country prioritization from common deployment headers (`x-vercel-ip-country`, `cf-ipcountry`, or `x-country-code`) without hard-filtering results outside that country.
- Added an eight-second upstream timeout so a slow geocoding provider cannot leave the UI indefinitely in its searching state.
- Local browser verification confirmed the Voyager tiles load correctly. IP-country ordering cannot be exercised on localhost because deployment geo headers are absent; map-center bias is present in the outgoing request.
- TypeScript and whitespace checks passed.

### Iteration 51 — inline boarding home requirements

- Browser implementation capture: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/boarding-home-needs-inline.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1).
- Changed only the boarding `Home needs` step to content-sized selectable controls in a wrapping flex layout.
- Kept the custom requirement input and Add button in one non-breaking inline group and capped the input width so it participates naturally with the preset options.
- Other TagPicker usages retain their existing full-row layout.
- TypeScript and whitespace checks passed.

### Iteration 52 — merged boarding Home fit step

- Browser implementation capture: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/boarding-home-fit-merged.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1).
- Merged the boarding-only `Home needs` and `Environment fit` screens into one `Home fit` step, reducing the boarding flow from 10 to 9 steps. Custom Care retains its separate Requirements and Cautions screens.
- Replaced the double-negative environment wording with `What kind of home is a good fit for your pet?` and a direct compatibility description.
- Added separate `Must have` and `Home compatibility` sections. Each compatibility situation supports mutually exclusive `OK` and `Not OK` states; neither selected represents `No preference`.
- Added custom home situations and preserved custom must-have requirements. Preview tags now distinguish `OK` from `Not OK` compatibility selections.
- Changed `No stairs` to the clearer positive requirement `Step-free home` and kept option typography at the normal bold form-control size.
- TypeScript and whitespace checks passed.

### Iteration 53 — persistent custom Home fit options

- Browser implementation capture: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/boarding-home-fit-custom-delete.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1).
- Separated custom Must-have option definitions from their selected state. Unchecking a custom option now keeps it available; only its adjacent trash action removes it.
- Added a trash action to every custom Home compatibility situation. Deleting a situation also removes its associated OK/Not OK value.
- Renamed `Other animals` to `Other pets in the home`; it remains independent from the explicit Dog and Cat situations, so no lossy mutual-exclusion rules are required.
- Replaced `Shared outdoor space` with the more relevant `Shared home with housemates` compatibility situation.
- Browser interaction verified add, deselect-without-removal, and explicit delete affordances for both custom sections.
- TypeScript and whitespace checks passed.

## Focused region comparison

No separate crop was required: task labels, controls, borders, alignment, and illustration quality remain readable in the full-width combined comparison.

## Implementation checklist

- [x] Standalone route and dedicated header.
- [x] Low-density, one-question-per-screen progression.
- [x] Direct navigation back to any available step.
- [x] Home Visit, Boarding, and Custom branches.
- [x] In-place task list configuration.
- [x] Desktop and mobile responsive checks.
- [x] Legacy `/dashboard/needs/new` page preserved.
- [x] Entry links point to `/needs/create`.
- [x] TypeScript check and whitespace check passed.

final result: passed

### Iteration 55 — layered compact and sitter-facing preview

- Source visual truth: `/var/folders/8s/sg3482y94csbxdrllx2d4q9m0000gn/T/codex-clipboard-8b69d819-a19e-493e-87cb-2a31d027c0f6.png` (`1404 × 1046`).
- Browser implementation evidence: `/Users/xiaoguoba/Desktop/petcare/.codex-audit/06-compact-publish-summary-top.png`, `/Users/xiaoguoba/Desktop/petcare/.codex-audit/02-full-sitter-preview.png`, and `/Users/xiaoguoba/Desktop/petcare/.codex-audit/03-full-sitter-preview-scrolled.png` (`1280 × 720`, desktop CSS viewport `1280 × 720`, device scale 1); mobile evidence: `/Users/xiaoguoba/Desktop/petcare/.codex-audit/04-full-sitter-preview-mobile.png` (`390 × 844`, CSS viewport `390 × 844`, device scale 1).
- Full-view comparison: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/boarding-layered-preview-comparison.png` (`1400 × 622`). The source and implementation card crop were placed together and proportionally normalized to a maximum `760 × 760` area. The data quantities differ intentionally; the comparison evaluates hierarchy, spacing, controls, colors, and copy layout rather than record-for-record content.
- State: English, light theme, Pet Boarding for two dogs, Aug 7–21, 2026, ¥2,000 per night, one daily Feeding routine, two Home fit needs, one sitter-provided supply, and transport discussed later.
- Information architecture: the default Preview remains a bounded publish-check summary. A new `Preview as sitter` action opens a separate, scrollable public-request dialog containing complete pricing, care routines, Home fit, notes, supplies, and transport details.
- Copy: when both categories are excluded, the estimate now uses the single phrase `transport and supply costs not included`; single-category exclusion cases retain their specific wording.
- Fonts and typography: existing flow font family, weights, uppercase eyebrow treatment, line height, and responsive wrapping were preserved. The shorter estimate note remains on one desktop line and wraps cleanly on mobile.
- Spacing and layout rhythm: the summary keeps the four-card desktop row and gains only a compact header action. The public dialog uses a fixed header and independently scrolling body; measured desktop detail body was `574px` high with `768px` scroll height.
- Colors and visual tokens: the existing purple, warm-neutral, border, semantic tag, radius, and focus-ring tokens were reused. The backdrop separates the public view from the edit flow without creating a new visual language.
- Image and icon fidelity: no source imagery was changed. The new eye and close affordances use the existing Phosphor icon set; no placeholder or custom-drawn assets were introduced.
- Interaction and accessibility checks: open, scroll, close button, backdrop containment, body scroll lock, Escape close, initial close-button focus, and focus return to `Preview as sitter` all passed. The dialog exposes `role="dialog"`, `aria-modal="true"`, and a labelled heading. Desktop and mobile had no horizontal overflow. Browser console contained no errors or warnings.
- Earlier P2 finding: the single-supply summary initially read `1 items arranged`. It was corrected to `1 item arranged`, and the post-fix DOM and screenshot evidence confirm the fix.
- Focused region evidence: the open and scrolled dialog captures make the detailed care, Home fit, supply, and transport content legible; no additional crop was required.
- No actionable P0, P1, or P2 findings remain. The public details component is currently local to the creation flow because the repository's existing public need-detail page is still a placeholder; it is structured for later reuse when that page is implemented.
- TypeScript and whitespace checks passed.

final result: passed

### Iteration 56 — routed sitter detail views (latest)

- Source visual truth: `/var/folders/8s/sg3482y94csbxdrllx2d4q9m0000gn/T/codex-clipboard-8b69d819-a19e-493e-87cb-2a31d027c0f6.png` (`1404 × 1046`); implementation evidence: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-home-visits-desktop.jpg`, `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-boarding-desktop.jpg`, `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-custom-desktop.jpg`, and `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-custom-mobile-viewport.jpg`.
- Combined full-view comparison: `/Users/xiaoguoba/Desktop/petcare/.codex-qa/need-detail-comparison.jpg`; source and implementation were proportionally normalized to a `700px` maximum width. The compact source and expanded sitter detail intentionally differ in density.
- Desktop viewport: `1440px`, device scale 1. Mobile viewport and screenshot: `390 × 844`, device scale 1. The mobile viewport capture was also the focused-region evidence for header, hero, metric, card, and type behavior.
- Home Visits, Pet Boarding, and Custom Care each rendered their service-specific details. The Close action restored the selected mode and draft on compact Preview.
- Typography, spacing, purple/warm-neutral tokens, favicon quality, Phosphor icons, and app-specific copy remain consistent with the source. No placeholder or custom-drawn assets were added.
- The initial mobile version clipped the Close action and body. Adding an explicit full-width inner main and compact mobile header removed the P2 overflow; post-fix measurement was `390px` viewport width and `390px` document scroll width.
- The shortened combined estimate exclusion remains `transport and supply costs not included`.
- All three route variants rendered without a visible error boundary after a clean development-server restart. Direct console-log inspection was not repeated after the final browser-control interruption; TypeScript and whitespace checks passed.
- No actionable P0, P1, or P2 findings remain.

final result: passed
