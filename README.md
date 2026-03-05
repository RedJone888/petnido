# 🐰 PetNido - C2C Pet Care Matching Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Live Demo](https://www.petnido.net)

---

## 📖 Part 1: 概要 & 開発の背景 / Overview & Motivation

### 🌟 概要 / Overview

**JP:**
PetNidoは、ペットの「お世話を依頼したい飼い主」と「お世話を提供したいシッター」を直接つなぐ、CtoCのマッチングプラットフォームです。SNS上に散らばっている「家庭預かり」や「訪問給餌」といった主流のニーズから、「爪切り」「通院代行」「掃除」などのニッチな依頼までを構造化し、効率的にマッチングできるよう設計されています。

- **ハイブリッド・ロール:** ユーザーが **「飼い主（依頼者）」** と **「シッター（提供者）」** の両方の役割をシームレスに使い分け可能。
- **資産としてのデータ:** 一度作成した依頼（Need）やサービス（Service）の情報は、使い捨てではなくユーザーの資産として残ります。引っ越しや再依頼の際も、削除することなく場所・日時・通貨などを微調整するだけで、最小限の手間で再び公開できる「圧倒的な運用効率」を実現。

**EN:**
PetNido is a C2C matching platform designed to connect pet owners with sitters. We have standardized fragmented info from social media—ranging from common models like "Home Boarding" and "Home Visits" to highly flexible services like "Nail Trimming", "Vet Escort," and "Cage Cleaning"—into specific searchable types for efficient matching.

- **Dual-Role Flexibility:** Users can easily switch between being an owner and a sitter within one account.
- **Data Reusability:** Instead of creating one-off posts, your "Needs" and "Services" remain in your history. When moving or needing care again, you can simply update the existing record (location, date, currency, etc.) and republish it instantly, offering unmatched efficiency for long-term users.

---

### 🌟 開発の背景 / Motivation

**JP:**

- **実体験と市場の気づき:** 私自身、うさぎの飼い主として外出時の預け先に苦労しました。ペットホテルは犬猫中心で高価なことが多く、環境の変化がストレスになる小動物には不向きな場合があります。「住み慣れた家でケアを受けさせたい」「近所の信頼できる人に頼みたい」というニーズを叶え、SNSでシッターを探し、時には自分もシッターとして依頼を受けた経験から、個人間でのペットケアには確かな需要があることを実感しました。切実な願いが開発の原動力です。
- **SNSマッチングの限界:**
  - **「検索性の低さ」:** 大量の投稿に埋もれ、近所のシッターや特定のニーズ（うさぎの世話など）を探すのが困難。
  - **「再利用の不便さ」:** 過去の投稿を使い回す機能がなく、毎回ゼロから内容を考える必要がある。
  - **「管理の難しさ」:** 「一時的な受付停止」や「引っ越し後の地域・通貨変更」など、状況に合わせた柔軟な切り替えができない。
- **解決策としてのPetNido:** これらの不便を解消するため、入力の構造化（フォーム化）、下書き保存、ステータスの切り替え、そして多通貨・多地域対応を備えた、 **「使い続けられる」** マッチングプラットフォームを開発しました。

**EN:**

- **Personal Insights:** As a rabbit owner, I found it challenging to find suitable care during trips. Conventional pet hotels are often dog/cat-centric and expensive, which can be stressful for small animals. Having successfully matched on social media both as a pet owner and a sitter to enable "care in a familiar environment" and "local trust", I realized there is a strong market for peer-to-peer pet care.

- **Limitations of Social Media:**
  - **High Search Cost:** Specific needs (e.g., rabbit care) or services get lost in the noise of unrelated posts.
  - **Lack of Reusability:** No easy way to reuse past requests, requiring users to re-type everything every time.
  - **Rigid Management:** Hard to quickly toggle "Service Availability" or update info (like currency or location) after moving to a new city or country.

- **The Solution:** I built PetNido to solve these issues through structured forms, auto-save, status toggles, and multi-currency/location support, creating a platform that evolves with the user's life..

---

## 🛠 Part 2: 使用技術 & 技術的なこだわり / Tech Stack & Highlights

### ■ 使用技術 / Tech Stack

| 分類                 | 技術 / Tools                                    |
| :------------------- | :---------------------------------------------- |
| **Framework**        | Next.js 14 (App Router)                         |
| **Language**         | TypeScript (完全型安全な開発)                   |
| **API**              | tRPC (End-to-end Type Safety)                   |
| **Database**         | Prisma (PostgreSQL)                             |
| **Auth**             | Next-Auth (v5 Beta) (Email OTP, Google, LINE)   |
| **State Management** | Zustand (Global), TanStack Query (Server State) |
| **Forms/Validation** | React Hook Form + Zod                           |
| **UI/Styling**       | Tailwind CSS, Radix UI, Lucide React            |
| **Maps/Charts**      | Maplibre GL, ECharts                            |
| **Media Storage**    | Cloudinary                                      |

### ■ 技術的なこだわり / Technical Highlights

1.  **エンドツーエンドの型安全 (Type Safety):** tRPC と Prisma を採用することで、DBからフロントエンドまで一貫した型安全性を確保しました。APIの変更が即座にフロントエンドのコンパイルエラーとして検知されるため、デバッグ時間を大幅に短縮し、堅牢なアプリケーションを実現しています。
2.  **高度なフォーム体験:** 依頼(Need)とサービス(Service)の作成には4ステップの動的バリデーションフォームを実装しました。また、Zustand によるグローバルな状態管理と、LocalStorage を活用した「自動下書き保存」機能を統合し、ユーザー体験（UX）を損なわない設計を行いました。
3.  **データ可視化:** ECharts を使用し、マイページで依頼状況やサービス統計を視覚化しました。また、`@dnd-kit`を用いたドラッグ＆ドロップによる画像順序の入れ替えなど、直感的なUI操作にこだわっています。
4.  **高度な認証とセキュリティ:** Next-Auth v5 を活用し、安全なメール認証（OTP）に加え、GoogleやLINEによるソーシャルログインを実装。認証状態に応じたルーティング保護（Middleware）を行い、未ログインユーザーの不正アクセスを防止しています。

**EN:**

1. **End-to-End Type Safety:** By using tRPC and Prisma, I ensured full type safety from the database to the frontend. Any schema changes are immediately caught as compilation errors, significantly reducing debugging time and ensuring application stability.

2. **Advanced Form Experience:** Combined React Hook Form with Zod to implement a dynamic 4-step validation form. Integrated Zustand for global state and LocalStorage for an auto-save feature, ensuring a seamless and reliable user experience during long form entries.

3. **Data Visualization & Interactive UI:** Leveraged ECharts to visualize service statistics on the dashboard. Implemented intuitive UI features like drag-and-drop image reordering using `@dnd-kit`.

4. **Advanced Auth & Security** Utilized Next-Auth v5 to implement secure Email OTP and Social Logins (Google/LINE). Applied middleware-based route protection to ensure secure access control based on authentication status.

---

## 🚀 Part 3: 主な機能 & ロードマップ / Key Features & Roadmap

### ■ 主な機能 / Key Features

- **🔍 柔軟な検索 (Flexible Discovery)**
  - サービス/依頼を、多角的なフィルタリング（タイプ、日付、エリア、ペット種別、価格帯）。
  - キーワード検索と地図上のピンによる正確な実施場所の特定。

- **📝 ダイナミックフォーム (Advanced 4-Step Forms)**
  - インタラクティブな入力体験: プラン選択 → 詳細設定 → ペット情報 → 報酬計算の4工程。
  - 多頭飼育対応：複数のペット情報を1つの依頼ににまとめ、種類ごとの特性（性格タグ、ワクチン等）や個別の注意事項、写真を設定可能。
  - 報酬の自動見積もり: 依頼タイプ（訪問回数制 / 預かり日数制 / 一括料金制）に応じて、単価と期間から合計金額をリアルタイム算出。
  - 下書き保存 (Auto-save): 入力中のデータはLocalstorageに自動保存され、不意なページ離脱でもデータを失いません。

- **📊 ユーザー管理 (Dashboard)**
  - データ可視化 (Data Visualization): マイページにて依頼やサービスの状況を統計グラフ（円グラフ）で表示し、活動状況を直感的に把握。
  - セキュアな多要素ログイン（メールOTP/Google/LINE）。

### ■ ロードマップ / Roadmap

- [ ] **リアルタイムチャット:** マッチング前の詳細相談機能。
- [ ] **レビューシステム:** シッターの信頼性を可視化する評価機能。
- [ ] **多言語対応:** グローバル展開を見据えた i18n 対応。

---

## 👨‍💻 Author / 開発者

**Guo Hongqiong (郭 紅瓊)**

- Front-end Developer based in Osaka, Japan.
- Open to new opportunities! (現在、フロントエンドエンジニアとして就職活動中です。)
- [LinkedIn](链接) | [GitHub](https://github.com/RedJone888) | [Email](redjoan.guo@gmail.com)

**PetNido** - \*Designed with love for pets
