// models/SiteReport.js
import mongoose from "mongoose";

// ---------------- Core Web Vitals ----------------
const CoreWebVitalsSchema = new mongoose.Schema({
  LCP: { Score: Number, Value: Number, Parameter: String },
  FID: { Score: Number, Value: Number, Parameter: String },
  CLS: { Score: Number, Value: Number, Parameter: String },
  FCP: { Score: Number, Value: Number, Parameter: String },
  TTFB: { Score: Number, Value: Number, Parameter: String },
  TBT: { Score: Number, Value: Number, Parameter: String },
  SI: { Score: Number, Value: Number, Parameter: String },
  INP: { Score: Number, Value: Number, Parameter: String },
  Core_Web_Vitals_Total_Score: Number
}, { _id: false });

// ---------------- Delivery and Render ----------------
const DeliveryAndRenderSchema = new mongoose.Schema({
  Compression: { Score: Number, Parameter: String },
  Caching: { Score: Number, Value: Number, Parameter: String },
  Resource_Optimization: { Score: Number, Parameter: String },
  Render_Blocking: { Score: Number, Parameter: String },
  HTTP: { Score: Number, Parameter: String },
  Delivery_and_Render_Total_Score: Number
}, { _id: false });

// ---------------- Crawlability & Hygiene ----------------
const CrawlabilityAndHygieneSchema = new mongoose.Schema({
  Sitemap: { Score: Number, Parameter: String },
  Robots: { Score: Number, Parameter: String },
  Structured_Data: { Score: Number, Parameter: String },
  Broken_Links: { Score: Number, Value: Number, Parameter: String },
  Redirect_Chains: { Score: Number, Value: Number, Parameter: String },
  Crawlability_and_Hygiene_Total_Score: Number
}, { _id: false });

// ---------------- Technical Performance ----------------
const TechnicalPerformanceSchema = new mongoose.Schema({
  Core_Web_Vitals: CoreWebVitalsSchema,
  Delivery_and_Render: DeliveryAndRenderSchema,
  Crawlability_and_Hygiene: CrawlabilityAndHygieneSchema,
  Percentage: Number,
  Warning: [String],
  Passed: Number,
  Total: Number,
  Improvements: [String]
}, { _id: false });

// ---------------- Generic Metric Schema ----------------
const MetricSchema = new mongoose.Schema({
  Score: Number,
  Parameter: String,
  Value: Number
}, { _id: false });

// ---------------- On Page SEO ----------------
const SEOEssentialsSchema = new mongoose.Schema({
  Title: { Title: String, Title_Exist: Number, Title_Length: Number, Score: Number, Parameter: String },
  Meta_Description: { MetaDescription: String, MetaDescription_Exist: Number, MetaDescription_Length: Number, Score: Number, Parameter: String },
  URL_Structure: { Score: Number, Parameter: String },
  Canonical: { Canonical: String, Canonical_Exist: Number, Score: Number, Parameter: String },
  Essentials_Total_Score: Number
}, { _id: false });

const MediaAndSemanticsSchema = new mongoose.Schema({
  H1: { H1_Count: Number, H1_Count_Score: Number, Score: Number, Parameter: String },
  Image: { Image_Exist: Number, Image_Alt_Exist: Number, Image_Alt_Meaningfull_Exist: Number, Image_Compression_Exist: Number, Parameter: String },
  Video: { Video_Exist: Number, Video_Embedding_Exist: Number, Video_LazyLoading_Exist: Number, Video_Structured_Metadata_Exist: Number, Parameter: String },
  Heading_Hierarchy: { H1_Count: Number, H2_Count: Number, H3_Count: Number, H4_Count: Number, H5_Count: Number, H6_Count: Number, Heading: [String], Score: Number, Parameter: String },
  ALT_Text_Relevance: { Score: Number, Parameter: String },
  Internal_Links: { Total: Number, Descriptive_Score: Number, Parameter: String },
  Semantic_Tags: { Article_Score: Number, Section_Score: Number, Header_Score: Number, Footer_Score: Number, Parameter: String },
  Media_and_Semantics_Total_Score: Number
}, { _id: false });

const StructureAndUniquenessSchema = new mongoose.Schema({
  Duplicate_Content: { Score: Number, Parameter: String },
  URL_Slugs: { Slug: String, Slug_Check_Score: Number, Score: Number, Parameter: String },
  HTTPS: { Score: Number, Parameter: String },
  Pagination_Tags: { Score: Number, Parameter: String },
  Structure_and_Uniqueness_Total_Score: Number
}, { _id: false });

const OnPageSEOSchema = new mongoose.Schema({
  Essentials: SEOEssentialsSchema,
  Media_and_Semantics: MediaAndSemanticsSchema,
  Structure_and_Uniqueness: StructureAndUniquenessSchema,
  Percentage: Number,
  Warning: [String],
  Passed: Number,
  Total: Number,
  Improvements: [String]
}, { _id: false });

// ---------------- Accessibility ----------------
const AccessibilitySchema = new mongoose.Schema({
  Color_Contrast: MetricSchema,
  Focus_Order: MetricSchema,
  Focusable_Content: MetricSchema,
  Tab_Index: MetricSchema,
  Interactive_Element_Affordance: MetricSchema,
  Label: MetricSchema,
  Aria_Allowed_Attr: MetricSchema,
  Aria_Roles: MetricSchema,
  Aria_Hidden_Focus: MetricSchema,
  Image_Alt: MetricSchema,
  Skip_Links: MetricSchema,
  Landmarks: MetricSchema,
  Percentage: Number,
  Warning: [String],
  Passed: Number,
  Total: Number
}, { _id: false });

// ---------------- Security ----------------
const SecuritySchema = new mongoose.Schema({
  HTTPS: MetricSchema,
  SSL: MetricSchema,
  SSL_Expiry: MetricSchema,
  HSTS: MetricSchema,
  TLS_Version: MetricSchema,
  X_Frame_Options: MetricSchema,
  CSP: MetricSchema,
  X_Content_Type_Options: MetricSchema,
  Cookies_Secure: MetricSchema,
  Cookies_HttpOnly: MetricSchema,
  Google_Safe_Browsing: MetricSchema,
  Blacklist: MetricSchema,
  Malware_Scan: MetricSchema,
  SQLi_Exposure: MetricSchema,
  XSS: MetricSchema,
  Cookie_Consent: MetricSchema,
  Privacy_Policy: MetricSchema,
  Forms_Use_HTTPS: MetricSchema,
  GDPR_CCPA: MetricSchema,
  Data_Collection: MetricSchema,
  Weak_Default_Credentials: MetricSchema,
  MFA_Enabled: MetricSchema,
  Admin_Panel_Public: MetricSchema,
  Viewport_Meta_Tag: MetricSchema,
  HTML_Doctype: MetricSchema,
  Character_Encoding: MetricSchema,
  Browser_Console_Errors: MetricSchema,
  Geolocation_Request: MetricSchema,
  Input_Paste_Allowed: MetricSchema,
  Notification_Request: MetricSchema,
  Third_Party_Cookies: MetricSchema,
  Deprecated_APIs: MetricSchema,
  Percentage: Number,
  Warning: [String],
  Passed: Number,
  Total: Number,
  Improvements: [String]
}, { _id: false });

// ---------------- UX / Content Structure ----------------
const UXSchema = new mongoose.Schema({
  Navigation_Clarity: MetricSchema,
  Breadcrumbs: MetricSchema,
  Clickable_Logo: MetricSchema,
  Mobile_Responsiveness: MetricSchema,
  Font_Style_and_Size_Consistency: MetricSchema,
  Whitespace_Usage: MetricSchema,
  Paragraph_Length_and_Spacing: MetricSchema,
  Contrast_and_Color_Harmony: MetricSchema,
  Content_Relevance: MetricSchema,
  Call_to_Action_Clarity: MetricSchema,
  Multimedia_Balance: MetricSchema,
  Error_and_Empty_State_Handling: MetricSchema,
  Interactive_Feedback: MetricSchema,
  Sticky_Navigation: MetricSchema,
  Scroll_Depth_Logic: MetricSchema,
  Loading_Indicators: MetricSchema,
  Internal_Linking_Quality: MetricSchema,
  User_Journey_Continuity: MetricSchema,
  Percentage: Number,
  Warning: [String],
  Passed: Number,
  Total: Number,
  Improvements: [String]
}, { _id: false });

// ---------------- Conversion ----------------
const ConversionSchema = new mongoose.Schema({
  CTA_and_Forms: Object,
  Trust_and_SocialProof: Object,
  Lead_Funnel: Object,
  UX_and_Interaction: Object,
  Percentage: Number,
  Warning: [String],
  Passed: Number,
  Total: Number,
  Improvements: [String]
}, { _id: false });

// ---------------- AIO ----------------
const AIOSchema = new mongoose.Schema({
  Technical_AI_Foundation: Object,
  Content_AI_Optimization: Object,
  Data_Intelligence_Integration: Object,
  AI_Content_Delivery: Object,
  Percentage: Number,
  Warning: [String],
  Passed: Number,
  Total: Number,
  Improvements: [String]
}, { _id: false });

// ---------------- Main SiteReport ----------------
const SiteReportSchema = new mongoose.Schema({
  Schema: Array,
  Device: String,
  Time_Taken: String,
  Site: String,
  Score: Number,
  Grade: String,
  AIO_Compatibility_Badge: String,
  Section_Score: Array,
  Technical_Performance: TechnicalPerformanceSchema,
  On_Page_SEO: OnPageSEOSchema,
  Accessibility: AccessibilitySchema,
  Security_or_Compliance: SecuritySchema,
  UX_or_Content_Structure: UXSchema,
  Conversion_and_Lead_Flow: ConversionSchema,
  AIO_Readiness: AIOSchema
}, { timestamps: true });

const SiteReport = mongoose.model("SiteReport", SiteReportSchema);
export default SiteReport;
