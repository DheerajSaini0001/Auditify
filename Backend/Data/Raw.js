export default function Raw(Metrices_Data) {

    let metrices = null;

    switch(Metrices_Data.Report) {

    case 'technicalMetrics':
        metrices = {
    Schema:Metrices_Data.Schema,
    Device:Metrices_Data.Device,
    Time_Taken:Metrices_Data.Time_Taken,
    Site: Metrices_Data.Site,
    Report:Metrices_Data.Report,
    Technical_Performance: {
        LCP:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.LCP.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.LCP.Value,
          Parameter:'Set 1 if LCP ≤ 2.5s, otherwise set 0'
        },
        FID:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.FID.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.FID.Value,
          Parameter:'Set 1 if FID ≤ 0.1s, otherwise set 0'
        },
        CLS:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.CLS.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.CLS.Value,
          Parameter:'Set 1 if CLS ≤ 0.1, otherwise set 0'
        },
        FCP:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.FCP.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.FCP.Value,
          Parameter:'Set 1 if FCP ≤ 1.8s, otherwise set 0'
        },
        TTFB:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.TTFB.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.TTFB.Value,
          Parameter:'Set 1 if TTFB ≤ 0.2s, otherwise set 0'
        },
        TBT:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.TBT.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.TBT.Value,
          Parameter:'Set 1 if TBT ≤ 0.3s, otherwise set 0'
        },
        SI:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.SI.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.SI.Value,
          Parameter:'Set 1 if SI ≤ 3s, otherwise set 0'
        },
        INP:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.INP.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.INP.Value,
          Parameter:'Set 1 if INP ≤ 0.2s, otherwise set 0'
        },
        Compression:{
          Score: Metrices_Data.Technical_Performance.Delivery_and_Render.Compression.Score,
          Parameter:'Set 1 if gzip or brotli compression is enabled, otherwise set 0 if it’s disabled or missing.'
        },
        Caching:{
          Score: Metrices_Data.Technical_Performance.Delivery_and_Render.Caching.Score,
          Value: Metrices_Data.Technical_Performance.Delivery_and_Render.Caching.Value,
          Parameter:'Set 1 if static resources have TTL ≥ 7 days, otherwise set 0 if TTL is less than 7 days or missing'
        },
        Resource_Optimization:{
          Score: Metrices_Data.Technical_Performance.Delivery_and_Render.Resource_Optimization.Score,
          Parameter:'Set 1 if images are optimized, CSS/JS minified, and offscreen images deferred, otherwise set 0.'
        },
        Render_Blocking:{
          Score: Metrices_Data.Technical_Performance.Delivery_and_Render.Render_Blocking.Score,
          Parameter:'Set 1 if there are no render-blocking CSS/JS resources, otherwise set 0'
        },
        HTTP:{
          Score: Metrices_Data.Technical_Performance.Delivery_and_Render.HTTP.Score,
          Parameter:'Set 1 if HTTP/2 is enabled, otherwise set 0 if not enabled'
        },
        Sitemap:{
          Score: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Sitemap.Score,
          Parameter:'Set 1 if /sitemap.xml exists, otherwise set 0'
        },
        Robots:{
          Score: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Robots.Score,
          Parameter:'Set 1 if robots.txt exists, otherwise set 0'
        },
        Structured_Data:{
          Score: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Structured_Data.Score,
          Parameter:'Set 1 if JSON-LD structured data is present, otherwise set 0'
        },
        Broken_Links:{
          Score: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Broken_Links.Score,
          Value: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Broken_Links.Value,
          Parameter:'Set 1 if 0% broken links, otherwise set 0'
        },
        Redirect_Chains:{
          Score: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Redirect_Chains.Score,
          Value: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Redirect_Chains.Value,
          Parameter:'Set 1 if ≤ 1 hop, otherwise set 0'
        },
      Percentage: Metrices_Data.Technical_Performance.Percentage,
    }
        }
        break;

    case 'seoMetrics':
      metrices = {
    Device:Metrices_Data.Device,
    Time_Taken:Metrices_Data.Time_Taken ,
    Site: Metrices_Data.Site,
    Report:Metrices_Data.Report,
    On_Page_SEO: {
        Title: {
          Title: Metrices_Data.On_Page_SEO.Essentials.Title.Title,
          Title_Exist : Metrices_Data.On_Page_SEO.Essentials.Title.Title_Exist,
          Title_Length: Metrices_Data.On_Page_SEO.Essentials.Title.Title_Length,
          Score: Metrices_Data.On_Page_SEO.Essentials.Title.Score,
          Parameter:'1 if title exists and 30–60 characters, else 0'
        },
        Meta_Description: {
          MetaDescription: Metrices_Data.On_Page_SEO.Essentials.Meta_Description.MetaDescription,
          MetaDescription_Exist: Metrices_Data.On_Page_SEO.Essentials.Meta_Description.MetaDescription_Exist,
          MetaDescription_Length: Metrices_Data.On_Page_SEO.Essentials.Meta_Description.MetaDescription_Length,
          Score: Metrices_Data.On_Page_SEO.Essentials.Meta_Description.Score,
          Parameter:'1 if meta description exists and ≤ 165 characters, else 0'
        },
        URL_Structure: {
          Score: Metrices_Data.On_Page_SEO.Essentials.URL_Structure.Score,
          Parameter:'1 if URL ≤ 5 segments, lowercase, hyphen-separated, else 0'
        },
        Canonical: {
          Canonical: Metrices_Data.On_Page_SEO.Essentials.Canonical.Canonical,
          Canonical_Exist: Metrices_Data.On_Page_SEO.Essentials.Canonical.Canonical_Exist,
          Score: Metrices_Data.On_Page_SEO.Essentials.Canonical.Score,
          Parameter:'1 if canonical tag exists and matches page URL, else 0'
        },
        H1: {
          H1_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.H1.H1_Count,
          H1_Count_Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.H1.H1_Count_Score,
          Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.H1.Score,
          Parameter:'1 if exactly one H1, 2 if >1, 0 if none'
        },
        Image:{
          Image_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Image.Image_Exist,
          Image_Alt_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Image.Image_Alt_Exist,
          Image_Alt_Meaningfull_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Image.Image_Alt_Meaningfull_Exist,
          Image_Compression_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Image.Image_Compression_Exist,
          Parameter:'Alt text ≥ 75% meaningful, images ≤ 200KB'
        },
        Video:{
          Video_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Video.Video_Exist,
          Video_Embedding_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Video.Video_Embedding_Exist,
          Video_LazyLoading_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Video.Video_LazyLoading_Exist,
          Video_Structured_Metadata_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Video.Video_Structured_Metadata_Exist,
          Parameter:'Proper embedding, lazy-loading, JSON-LD metadata'
        },
        Heading_Hierarchy:{
          H1_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.H1_Count,
          H2_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.H2_Count,
          H3_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.H3_Count,
          H4_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.H4_Count,
          H5_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.H5_Count,
          H6_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.H6_Count,
        //   Heading: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.Heading,
          Score:Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.Score,
          Parameter:'1 if headings follow proper H1→H2→H3 order, else 0',
        },
        ALT_Text_Relevance: {
          Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.ALT_Text_Relevance.Score,
          Parameter: "1 if alt text contains keywords or is descriptive, else 0"
        },
        Internal_Links: {
          Total: Metrices_Data.On_Page_SEO.Media_and_Semantics.Internal_Links.Total,
          Descriptive_Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.Internal_Links.Descriptive_Score,
          Parameter: "1 if ≥ 75% internal links are descriptive, else 0"
        },
        Semantic_Tags: {
          Article_Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.Semantic_Tags.Article_Score,
          Section_Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.Semantic_Tags.Section_Score,
          Header_Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.Semantic_Tags.Header_Score,
          Footer_Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.Semantic_Tags.Footer_Score,
          Parameter: "1 if tag exists, else 0"
        },
        Duplicate_Content:{
          Score: Metrices_Data.On_Page_SEO.Structure_and_Uniqueness.Duplicate_Content.Score,
          Parameter:'1 if duplication ≤ 75%, else 0'
        },
         URL_Slugs:{
          Slug:Metrices_Data.On_Page_SEO.Structure_and_Uniqueness.URL_Slugs.Slug,
          Slug_Check_Score:Metrices_Data.On_Page_SEO.Structure_and_Uniqueness.URL_Slugs.Slug_Check_Score,
          Score:Metrices_Data.On_Page_SEO.Structure_and_Uniqueness.URL_Slugs.Score,
          Parameter:'1 if slug exists, ≤25 characters, lowercase hyphenated, else 0'
        },
        HTTPS: {
          Score: Metrices_Data.On_Page_SEO.Structure_and_Uniqueness.HTTPS.Score,
          Parameter: "1 if HTTPS implemented, else 0"
        },
        Pagination_Tags:{
          Score: Metrices_Data.On_Page_SEO.Structure_and_Uniqueness.Pagination_Tags.Score,
          Parameter:'1 if pagination links or rel=next/prev exist, else 0'
        },
      Percentage: Metrices_Data.On_Page_SEO.Percentage,
    }
        }
      break;

    case 'accessibilityMetrics':
      metrices = {
    Device:Metrices_Data.Device,
    Time_Taken:Metrices_Data.Time_Taken ,
    Site: Metrices_Data.Site,
    Report:Metrices_Data.Report,
    Accessibility: {
      Color_Contrast:{
        Score:Metrices_Data.Accessibility.Color_Contrast.Score,
        Parameter:'1 if color contrast passes, else 0'
      },
      Focus_Order:{
        Score:Metrices_Data.Accessibility.Focus_Order.Score,
        Parameter:'1 if tab/focus order is correct, else 0'
      },
      Focusable_Content:{
        Score:Metrices_Data.Accessibility.Focusable_Content.Score,
        Parameter:'1 if focusable elements are correctly used, else 0'
      },
      Tab_Index:{
        Score:Metrices_Data.Accessibility.Tab_Index.Score,
        Parameter:'1 if tabindex attributes are valid, else 0'
      },
      Interactive_Element_Affordance:{
        Score:Metrices_Data.Accessibility.Interactive_Element_Affordance.Score,
        Parameter:'1 if interactive elements have clear affordance, else 0'
      },
      Label:{
        Score:Metrices_Data.Accessibility.Label.Score,
        Parameter:'1 if form elements have labels, else 0'
      },
      Aria_Allowed_Attr:{
        Score:Metrices_Data.Accessibility.Aria_Allowed_Attr.Score,
        Parameter:'1 if only allowed ARIA attributes are used, else 0'
      },
      Aria_Roles:{
        Score:Metrices_Data.Accessibility.Aria_Roles.Score,
        Parameter:'1 if ARIA roles are correctly applied, else 0'
      },
      Aria_Hidden_Focus:{
        Score:Metrices_Data.Accessibility.Aria_Hidden_Focus.Score,
        Parameter:'1 if hidden elements do not receive focus, else 0'
      },
      Image_Alt:{
        Score:Metrices_Data.Accessibility.Image_Alt.Score,
        Parameter:'1 if images have descriptive alt text, else 0'
      },
      Skip_Links:{
        Score:Metrices_Data.Accessibility.Skip_Links.Score,
        Parameter:'1 if skip links exist, else 0',
      },
      Landmarks:{
        Score:Metrices_Data.Accessibility.Landmarks.Score,
        Parameter:'1 if landmark roles (banner, main, contentinfo, navigation, complementary) exist, else 0'
      },
      Percentage: Metrices_Data.Accessibility.Percentage,
    }
        }
      break;

    case 'securityCompliance':
      metrices = {
    Device:Metrices_Data.Device,
    Time_Taken:Metrices_Data.Time_Taken,
    Site: Metrices_Data.Site,
    Report:Metrices_Data.Report,
    Security_or_Compliance: {
      HTTPS: {
        Score: Metrices_Data.Security_or_Compliance.HTTPS.Score,
        Parameter: '1 if HTTPS is implemented, else 0'
      },
      SSL: {
        Score: Metrices_Data.Security_or_Compliance.SSL.Score,
        Parameter: '1 if SSL/TLS certificate is valid, else 0'
      },
      SSL_Expiry: {
        Score: Metrices_Data.Security_or_Compliance.SSL_Expiry.Score,
        Parameter: '1 if SSL certificate is not expired, else 0'
      },
      HSTS: {
        Score: Metrices_Data.Security_or_Compliance.HSTS.Score,
        Parameter: '1 if HSTS header is present, else 0'
      },
      TLS_Version: {
        Score: Metrices_Data.Security_or_Compliance.TLS_Version.Score,
        Parameter: '1 if secure TLS version is used, else 0'
      },
      X_Frame_Options: {
        Score: Metrices_Data.Security_or_Compliance.X_Frame_Options.Score,
        Parameter: '1 if X-Frame-Options header is set, else 0'
      },
      CSP: {
        Score: Metrices_Data.Security_or_Compliance.CSP.Score,
        Parameter: '1 if Content Security Policy (CSP) is set, else 0'
      },
      X_Content_Type_Options: {
        Score: Metrices_Data.Security_or_Compliance.X_Content_Type_Options.Score,
        Parameter: '1 if X-Content-Type-Options header is set, else 0'
      },
      Cookies_Secure: {
        Score: Metrices_Data.Security_or_Compliance.Cookies_Secure.Score,
        Parameter: '1 if cookies are set with Secure flag, else 0'
      },
      Cookies_HttpOnly: {
        Score: Metrices_Data.Security_or_Compliance.Cookies_HttpOnly.Score,
        Parameter: '1 if cookies are HttpOnly, else 0'
      },
      Google_Safe_Browsing: {
        Score: Metrices_Data.Security_or_Compliance.Google_Safe_Browsing.Score,
        Parameter: '1 if site is safe according to Google Safe Browsing, else 0'
      },
      Blacklist: {
        Score: Metrices_Data.Security_or_Compliance.Blacklist.Score,
        Parameter: '1 if site is not blacklisted, else 0'
      },
      Malware_Scan: {
        Score: Metrices_Data.Security_or_Compliance.Malware_Scan.Score,
        Parameter: '1 if no malware detected, else 0'
      },
      SQLi_Exposure: {
        Score: Metrices_Data.Security_or_Compliance.SQLi_Exposure.Score,
        Parameter: '1 if site is not vulnerable to SQL injection, else 0'
      },
      XSS: {
        Score: Metrices_Data.Security_or_Compliance.XSS.Score,
        Parameter: '1 if site is not vulnerable to XSS, else 0'
      },
      Cookie_Consent: {
        Score: Metrices_Data.Security_or_Compliance.Cookie_Consent.Score,
        Parameter: '1 if cookie consent banner is implemented, else 0'
      },
      Privacy_Policy: {
        Score: Metrices_Data.Security_or_Compliance.Privacy_Policy.Score,
        Parameter: '1 if privacy policy exists, else 0'
      },
      Forms_Use_HTTPS: {
        Score: Metrices_Data.Security_or_Compliance.Forms_Use_HTTPS.Score,
        Parameter: '1 if forms submit over HTTPS, else 0'
      },
      GDPR_CCPA: {
        Score: Metrices_Data.Security_or_Compliance.GDPR_CCPA.Score,
        Parameter: '1 if GDPR/CCPA compliance implemented, else 0'
      },
      Data_Collection: {
        Score: Metrices_Data.Security_or_Compliance.Data_Collection.Score,
        Parameter: '1 if data collection practices are compliant, else 0'
      },
      Weak_Default_Credentials: {
        Score: Metrices_Data.Security_or_Compliance.Weak_Default_Credentials.Score,
        Parameter: '1 if no weak default credentials exist, else 0'
      },
      MFA_Enabled: {
        Score: Metrices_Data.Security_or_Compliance.MFA_Enabled.Score,
        Parameter: '1 if multi-factor authentication is enabled, else 0'
      },
      Admin_Panel_Public: {
        Score: Metrices_Data.Security_or_Compliance.Admin_Panel_Public.Score,
        Parameter: '1 if admin panel is not publicly accessible, else 0'
      },
      Viewport_Meta_Tag: {
        Score: Metrices_Data.Security_or_Compliance.Viewport_Meta_Tag.Score,
        Parameter: "1 if <meta name='viewport' content='width=device-width, initial-scale=1.0'> is present, else 0"
      },
      HTML_Doctype: {
        Score: Metrices_Data.Security_or_Compliance.HTML_Doctype.Score,
        Parameter: '1 if <!DOCTYPE html> is declared at document start, else 0'
      },
      Character_Encoding: {
        Score: Metrices_Data.Security_or_Compliance.Character_Encoding.Score,
        Parameter: '1 if charset is defined in <meta> or HTTP headers, else 0'
      },
      Browser_Console_Errors: {
        Score: Metrices_Data.Security_or_Compliance.Browser_Console_Errors.Score,
        Parameter: '1 if no console or JS errors are detected, else 0'
      },
      Geolocation_Request: {
        Score: Metrices_Data.Security_or_Compliance.Geolocation_Request.Score,
        Parameter: '1 if geolocation is not requested automatically, else 0'
      },
      Input_Paste_Allowed: {
        Score: Metrices_Data.Security_or_Compliance.Input_Paste_Allowed.Score,
        Parameter: '1 if paste is allowed in input fields, else 0'
      },
      Notification_Request: {
        Score: Metrices_Data.Security_or_Compliance.Notification_Request.Score,
        Parameter: '1 if no unsolicited notification request is made, else 0'
      },
      Third_Party_Cookies: {
        Score: Metrices_Data.Security_or_Compliance.Third_Party_Cookies.Score,
        Parameter: '1 if no third-party cookies are detected, else 0'
      },
      Deprecated_APIs: {
        Score: Metrices_Data.Security_or_Compliance.Deprecated_APIs.Score,
        Parameter: '1 if no deprecated APIs are used, else 0'
      },
      Percentage: Metrices_Data.Security_or_Compliance.Percentage,
    }
        }
      break;

    case 'uxContentStructure':
      metrices = {
    Device:Metrices_Data.Device,
    Time_Taken:Metrices_Data.Time_Taken ,
    Site: Metrices_Data.Site,
    Report:Metrices_Data.Report,
    UX_or_Content_Structure: {
      Navigation_Clarity: {
        Score: Metrices_Data.UX_or_Content_Structure.Navigation_Clarity.Score,
        Parameter: '1 if navigation menus are visible, labeled, and unique, else 0'
      },
      Breadcrumbs: {
        Score: Metrices_Data.UX_or_Content_Structure.Breadcrumbs.Score,
        Parameter: '1 if breadcrumbs are present with at least one text item, else 0'
      },
      Clickable_Logo: {
        Score: Metrices_Data.UX_or_Content_Structure.Clickable_Logo.Score,
        Parameter: '1 if logo links to homepage, else 0'
      },
      Mobile_Responsiveness: {
        Score: Metrices_Data.UX_or_Content_Structure.Mobile_Responsiveness.Score,
        Parameter: '1 if viewport meta is set and responsive CSS exists, else 0'
      },
      Font_Style_and_Size_Consistency: {
        Score: Metrices_Data.UX_or_Content_Structure.Font_Style_and_Size_Consistency.Score,
        Parameter: '1 if font-family and font-size are consistent, else 0'
      },
      Whitespace_Usage: {
        Score: Metrices_Data.UX_or_Content_Structure.Whitespace_Usage.Score,
        Parameter: '1 if sufficient padding/margins exist in most blocks, else 0'
      },
      Paragraph_Length_and_Spacing: {
        Score: Metrices_Data.UX_or_Content_Structure.Paragraph_Length_and_Spacing.Score,
        Parameter: '1 if paragraphs are 40–120 words and spacing is adequate, else 0'
      },
      Contrast_and_Color_Harmony: {
        Score: Metrices_Data.UX_or_Content_Structure.Contrast_and_Color_Harmony.Score,
        Parameter: '1 if text-background contrast ratio ≥ 4.5, else 0'
      },
      Content_Relevance: {
        Score: Metrices_Data.UX_or_Content_Structure.Content_Relevance.Score,
        Parameter: '1 if ≥50% of title keywords appear in content, else 0'
      },
      Call_to_Action_Clarity: {
        Score: Metrices_Data.UX_or_Content_Structure.Call_to_Action_Clarity.Score,
        Parameter: '1 if at least 1 meaningful CTA exists, else 0'
      },
      Multimedia_Balance: {
        Score: Metrices_Data.UX_or_Content_Structure.Multimedia_Balance.Score,
        Parameter: '1 if text and media are balanced (≥1 text per media element), else 0'
      },
      Error_and_Empty_State_Handling: {
        Score: Metrices_Data.UX_or_Content_Structure.Error_and_Empty_State_Handling.Score,
        Parameter: '1 if empty/error states provide guidance, else 0'
      },
      Interactive_Feedback: {
        Score: Metrices_Data.UX_or_Content_Structure.Interactive_Feedback.Score,
        Parameter: '1 if buttons/links/forms provide visual or textual feedback, else 0'
      },
      Sticky_Navigation: {
        Score: Metrices_Data.UX_or_Content_Structure.Sticky_Navigation.Score,
        Parameter: '1 if navigation remains visible when scrolling, else 0'
      },
      Scroll_Depth_Logic: {
        Score: Metrices_Data.UX_or_Content_Structure.Scroll_Depth_Logic.Score,
        Parameter: '1 if TOC or back-to-top exists for long pages, else 0'
      },
      Loading_Indicators: {
        Score: Metrices_Data.UX_or_Content_Structure.Loading_Indicators.Score,
        Parameter: '1 if visible loading indicators exist, else 0'
      },
      Internal_Linking_Quality: {
        Score: Metrices_Data.UX_or_Content_Structure.Internal_Linking_Quality.Score,
        Parameter: '1 if internal links exist and are relevant, else 0'
      },
      User_Journey_Continuity: {
        Score: Metrices_Data.UX_or_Content_Structure.User_Journey_Continuity.Score,
        Parameter: '1 if at least one meaningful CTA exists for next steps, else 0'
      },
      Percentage: Metrices_Data.UX_or_Content_Structure.Percentage,
    }
        }
      break;

    case 'conversionLeadFlow':
      metrices = {
    Device:Metrices_Data.Device,
    Time_Taken:Metrices_Data.Time_Taken ,
    Site: Metrices_Data.Site,
    Report:Metrices_Data.Report,
    Conversion_and_Lead_Flow: {
        CTA_Visibility: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Visibility.Score,
          Parameter: "1 if at least one prominent CTA is present, else 0"
        },
        CTA_Clarity: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Clarity.Score,
          Parameter: "1 if CTA buttons and links have clear, actionable text, else 0"
        },
        CTA_Contrast: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Contrast.Score,
          Parameter: "1 if CTA text has sufficient contrast (≥4.5:1), else 0"
        },
        CTA_Crowding: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Crowding.Score,
          Parameter: "1 if number of CTAs is limited to prevent confusion, else 0"
        },
        CTA_Flow_Alignment: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Flow_Alignment.Score,
          Parameter: "1 if CTAs are placed logically along user flow, else 0"
        },
        Form_Presence: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.Form_Presence.Score,
          Parameter: "1 if at least one form is present, else 0"
        },
        Form_Length: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.Form_Length.Score,
          Parameter: "1 if forms are concise, else 0"
        },
        Required_vs_Optional_Fields: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.Required_vs_Optional_Fields.Score,
          Parameter: "1 if required vs optional fields are clearly marked, else 0"
        },
        Inline_Validation: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.Inline_Validation.Score,
          Parameter: "1 if real-time feedback is provided for user input, else 0"
        },
        Submit_Button_Clarity: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.Submit_Button_Clarity.Score,
          Parameter: "1 if submit button text is clear and actionable, else 0"
        },
        AutoFocus_Field: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.AutoFocus_Field.Score,
          Parameter: "1 if first input field is autofocused, else 0"
        },
        MultiStep_Form_Progress: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.MultiStep_Form_Progress.Score,
          Parameter: "1 if progress indicators exist in multi-step forms, else 0"
        },
        Testimonials: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Testimonials.Score,
          Parameter: "1 if testimonials are visible, else 0"
        },
        Reviews: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Reviews.Score,
          Parameter: "1 if reviews/ratings are visible, else 0"
        },
        Trust_Badges: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Trust_Badges.Score,
          Parameter: "1 if trust/security badges are visible, else 0"
        },
        Client_Logos: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Client_Logos.Score,
          Parameter: "1 if client logos are visible, else 0"
        },
        Case_Studies_Accessibility: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Case_Studies_Accessibility.Score,
          Parameter: "1 if case studies are accessible, else 0"
        },
        Exit_Intent_Triggers: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Lead_Funnel.Exit_Intent_Triggers.Score,
          Parameter: "1 if exit-intent triggers exist, else 0"
        },
        Lead_Magnets: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Lead_Funnel.Lead_Magnets.Score,
          Parameter: "1 if lead magnets are offered, else 0"
        },
        Contact_Info_Visibility: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Lead_Funnel.Contact_Info_Visibility.Score,
          Parameter: "1 if contact info is visible, else 0"
        },
        Chatbot_Presence: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Lead_Funnel.Chatbot_Presence.Score,
          Parameter: "1 if chatbot is present, else 0"
        },
        Interactive_Elements: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Interactive_Elements.Score,
          Parameter: "1 if interactive elements are present, else 0"
        },
        Personalization: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Personalization.Score,
          Parameter: "1 if personalized content exists, else 0"
        },
        Progress_Indicators: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Progress_Indicators.Score,
          Parameter: "1 if progress indicators are visible, else 0"
        },
        Friendly_Error_Handling: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Friendly_Error_Handling.Score,
          Parameter: "1 if error messages are clear and helpful, else 0"
        },
        Microcopy_Clarity: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Microcopy_Clarity.Score,
          Parameter: "1 if labels/placeholders are clear, else 0"
        },
        Incentives_Displayed: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Incentives_Displayed.Score,
          Parameter: "1 if offers or incentives are visible, else 0"
        },
        Scarcity_Urgency: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Scarcity_Urgency.Score,
          Parameter: "1 if scarcity or urgency cues are present, else 0"
        },
        Smooth_Scrolling: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Smooth_Scrolling.Score,
          Parameter: "1 if smooth scrolling is implemented, else 0"
        },
        Mobile_CTA_Adaptation: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Mobile_CTA_Adaptation.Score,
          Parameter: "1 if CTAs are mobile-friendly, else 0"
        },
        MultiChannel_FollowUp: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.MultiChannel_FollowUp.Score,
          Parameter: "1 if multi-channel follow-up options exist, else 0"
        },
      Percentage: Metrices_Data.Conversion_and_Lead_Flow.Percentage,
    }
        }
      break;

    case 'aioReadiness':
      metrices = {
    Device:Metrices_Data.Device,
    Time_Taken:Metrices_Data.Time_Taken,
    Site: Metrices_Data.Site,
    Report:Metrices_Data.Report,
    AIO_Compatibility_Badge: Metrices_Data.AIO_Compatibility_Badge,
    AIO_Readiness: {
        Structured_Data: {
          Score: Metrices_Data.AIO_Readiness.Technical_AI_Foundation.Structured_Data.Score,
          Parameter: "1 if valid structured data (schema.org/JSON-LD) is implemented, else 0"
        },
        Metadata_Complete: {
          Score: Metrices_Data.AIO_Readiness.Technical_AI_Foundation.Metadata_Complete.Score,
          Parameter: "1 if metadata (title, description, OG/Twitter tags) is complete, else 0"
        },
        Fast_Page_Load: {
          Score: Metrices_Data.AIO_Readiness.Technical_AI_Foundation.Fast_Page_Load.Score,
          Parameter: "1 if page load time is under 2s, else 0"
        },
        API_Data_Access: {
          Score: Metrices_Data.AIO_Readiness.Technical_AI_Foundation.API_Data_Access.Score,
          Parameter: "1 if secure and documented API endpoints exist, else 0"
        },
        Dynamic_Content_Available: {
          Score: Metrices_Data.AIO_Readiness.Technical_AI_Foundation.Dynamic_Content_Available.Score,
          Parameter: "1 if dynamic or interactive content is present, else 0"
        },
        Multilingual_Support: {
          Score: Metrices_Data.AIO_Readiness.Technical_AI_Foundation.Multilingual_Support.Score,
          Parameter: "1 if hreflang and multilingual versions exist, else 0"
        },
        Content_NLP_Friendly: {
          Score: Metrices_Data.AIO_Readiness.Content_AI_Optimization.Content_NLP_Friendly.Score,
          Parameter: "1 if content uses natural, entity-rich language and NLP-friendly structure, else 0"
        },
        Keywords_Entities_Annotated: {
          Score: Metrices_Data.AIO_Readiness.Content_AI_Optimization.Keywords_Entities_Annotated.Score,
          Parameter: "1 if entities and keywords are annotated with schema or metadata, else 0"
        },
        Content_Updated_Regularly: {
          Score: Metrices_Data.AIO_Readiness.Content_AI_Optimization.Content_Updated_Regularly.Score,
          Parameter: "1 if website content is updated frequently, else 0"
        },
        Internal_Linking_AI_Friendly: {
          Score: Metrices_Data.AIO_Readiness.Content_AI_Optimization.Internal_Linking_AI_Friendly.Score,
          Parameter: "1 if internal links are structured and contextually relevant, else 0"
        },
        Duplicate_Content_Detection_Ready: {
          Score: Metrices_Data.AIO_Readiness.Content_AI_Optimization.Duplicate_Content_Detection_Ready.Score,
          Parameter: "1 if duplicate content detection mechanisms are active, else 0"
        },
        Behavior_Tracking_Implemented: {
          Score: Metrices_Data.AIO_Readiness.Data_Intelligence_Integration.Behavior_Tracking_Implemented.Score,
          Parameter: "1 if user behavior tracking is implemented (e.g., analytics), else 0"
        },
        Segmentation_Profiling_Ready: {
          Score: Metrices_Data.AIO_Readiness.Data_Intelligence_Integration.Segmentation_Profiling_Ready.Score,
          Parameter: "1 if audience segmentation and profiling are in place, else 0"
        },
        Event_Goal_Tracking_Integrated: {
          Score: Metrices_Data.AIO_Readiness.Data_Intelligence_Integration.Event_Goal_Tracking_Integrated.Score,
          Parameter: "1 if event or goal tracking is active, else 0"
        },
        AB_Testing_Ready: {
          Score: Metrices_Data.AIO_Readiness.Data_Intelligence_Integration.AB_Testing_Ready.Score,
          Parameter: "1 if A/B testing setup exists, else 0"
        },
        User_Feedback_Loops_Present: {
          Score: Metrices_Data.AIO_Readiness.Data_Intelligence_Integration.User_Feedback_Loops_Present.Score,
          Parameter: "1 if feedback collection systems (surveys, reviews) are active, else 0"
        },
        Dynamic_Personalization: {
          Score: Metrices_Data.AIO_Readiness.AI_Content_Delivery.Dynamic_Personalization.Score,
          Parameter: "1 if dynamic content adjusts based on user segments or behavior, else 0"
        },
        AI_Content_Distribution: {
          Score: Metrices_Data.AIO_Readiness.AI_Content_Delivery.AI_Content_Distribution.Score,
          Parameter: "1 if content delivery through APIs or feeds is available, else 0"
        },
        AI_Friendly_Structure: {
          Score: Metrices_Data.AIO_Readiness.AI_Content_Delivery.AI_Friendly_Structure.Score,
          Parameter: "1 if website structure aids AI comprehension and crawling, else 0"
        },
      Percentage: Metrices_Data.AIO_Readiness.Percentage,
    }
        }
      break;

    case 'All':
        metrices = {
    Schema:Metrices_Data.Schema,
    Device:Metrices_Data.Device,
    Time_Taken:Metrices_Data.Time_Taken,
    Site: Metrices_Data.Site,
    Score: Metrices_Data.Score,
    Grade: Metrices_Data.Grade,
    Report:Metrices_Data.Report,
    AIO_Compatibility_Badge: Metrices_Data.AIO_Compatibility_Badge,
    Section_Score: Metrices_Data.sectionScores,
    Technical_Performance: {
        LCP:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.LCP.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.LCP.Value,
          Parameter:'Set 1 if LCP ≤ 2.5s, otherwise set 0'
        },
        FID:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.FID.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.FID.Value,
          Parameter:'Set 1 if FID ≤ 0.1s, otherwise set 0'
        },
        CLS:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.CLS.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.CLS.Value,
          Parameter:'Set 1 if CLS ≤ 0.1, otherwise set 0'
        },
        FCP:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.FCP.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.FCP.Value,
          Parameter:'Set 1 if FCP ≤ 1.8s, otherwise set 0'
        },
        TTFB:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.TTFB.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.TTFB.Value,
          Parameter:'Set 1 if TTFB ≤ 0.2s, otherwise set 0'
        },
        TBT:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.TBT.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.TBT.Value,
          Parameter:'Set 1 if TBT ≤ 0.3s, otherwise set 0'
        },
        SI:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.SI.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.SI.Value,
          Parameter:'Set 1 if SI ≤ 3s, otherwise set 0'
        },
        INP:{
          Score: Metrices_Data.Technical_Performance.Core_Web_Vitals.INP.Score,
          Value: Metrices_Data.Technical_Performance.Core_Web_Vitals.INP.Value,
          Parameter:'Set 1 if INP ≤ 0.2s, otherwise set 0'
        },
        Compression:{
          Score: Metrices_Data.Technical_Performance.Delivery_and_Render.Compression.Score,
          Parameter:'Set 1 if gzip or brotli compression is enabled, otherwise set 0 if it’s disabled or missing.'
        },
        Caching:{
          Score: Metrices_Data.Technical_Performance.Delivery_and_Render.Caching.Score,
          Value: Metrices_Data.Technical_Performance.Delivery_and_Render.Caching.Value,
          Parameter:'Set 1 if static resources have TTL ≥ 7 days, otherwise set 0 if TTL is less than 7 days or missing'
        },
        Resource_Optimization:{
          Score: Metrices_Data.Technical_Performance.Delivery_and_Render.Resource_Optimization.Score,
          Parameter:'Set 1 if images are optimized, CSS/JS minified, and offscreen images deferred, otherwise set 0.'
        },
        Render_Blocking:{
          Score: Metrices_Data.Technical_Performance.Delivery_and_Render.Render_Blocking.Score,
          Parameter:'Set 1 if there are no render-blocking CSS/JS resources, otherwise set 0'
        },
        HTTP:{
          Score: Metrices_Data.Technical_Performance.Delivery_and_Render.HTTP.Score,
          Parameter:'Set 1 if HTTP/2 is enabled, otherwise set 0 if not enabled'
        },
        Sitemap:{
          Score: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Sitemap.Score,
          Parameter:'Set 1 if /sitemap.xml exists, otherwise set 0'
        },
        Robots:{
          Score: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Robots.Score,
          Parameter:'Set 1 if robots.txt exists, otherwise set 0'
        },
        Structured_Data:{
          Score: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Structured_Data.Score,
          Parameter:'Set 1 if JSON-LD structured data is present, otherwise set 0'
        },
        Broken_Links:{
          Score: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Broken_Links.Score,
          Value: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Broken_Links.Value,
          Parameter:'Set 1 if 0% broken links, otherwise set 0'
        },
        Redirect_Chains:{
          Score: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Redirect_Chains.Score,
          Value: Metrices_Data.Technical_Performance.Crawlability_and_Hygiene.Redirect_Chains.Value,
          Parameter:'Set 1 if ≤ 1 hop, otherwise set 0'
        },
      Percentage: Metrices_Data.Technical_Performance.Percentage,
    },
    On_Page_SEO: {
        Title: {
          Title: Metrices_Data.On_Page_SEO.Essentials.Title.Title,
          Title_Exist : Metrices_Data.On_Page_SEO.Essentials.Title.Title_Exist,
          Title_Length: Metrices_Data.On_Page_SEO.Essentials.Title.Title_Length,
          Score: Metrices_Data.On_Page_SEO.Essentials.Title.Score,
          Parameter:'1 if title exists and 30–60 characters, else 0'
        },
        Meta_Description: {
          MetaDescription: Metrices_Data.On_Page_SEO.Essentials.Meta_Description.MetaDescription,
          MetaDescription_Exist: Metrices_Data.On_Page_SEO.Essentials.Meta_Description.MetaDescription_Exist,
          MetaDescription_Length: Metrices_Data.On_Page_SEO.Essentials.Meta_Description.MetaDescription_Length,
          Score: Metrices_Data.On_Page_SEO.Essentials.Meta_Description.Score,
          Parameter:'1 if meta description exists and ≤ 165 characters, else 0'
        },
        URL_Structure: {
          Score: Metrices_Data.On_Page_SEO.Essentials.URL_Structure.Score,
          Parameter:'1 if URL ≤ 5 segments, lowercase, hyphen-separated, else 0'
        },
        Canonical: {
          Canonical: Metrices_Data.On_Page_SEO.Essentials.Canonical.Canonical,
          Canonical_Exist: Metrices_Data.On_Page_SEO.Essentials.Canonical.Canonical_Exist,
          Score: Metrices_Data.On_Page_SEO.Essentials.Canonical.Score,
          Parameter:'1 if canonical tag exists and matches page URL, else 0'
        },
        H1: {
          H1_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.H1.H1_Count,
          H1_Count_Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.H1.H1_Count_Score,
          Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.H1.Score,
          Parameter:'1 if exactly one H1, 2 if >1, 0 if none'
        },
        Image:{
          Image_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Image.Image_Exist,
          Image_Alt_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Image.Image_Alt_Exist,
          Image_Alt_Meaningfull_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Image.Image_Alt_Meaningfull_Exist,
          Image_Compression_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Image.Image_Compression_Exist,
          Parameter:'Alt text ≥ 75% meaningful, images ≤ 200KB'
        },
        Video:{
          Video_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Video.Video_Exist,
          Video_Embedding_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Video.Video_Embedding_Exist,
          Video_LazyLoading_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Video.Video_LazyLoading_Exist,
          Video_Structured_Metadata_Exist: Metrices_Data.On_Page_SEO.Media_and_Semantics.Video.Video_Structured_Metadata_Exist,
          Parameter:'Proper embedding, lazy-loading, JSON-LD metadata'
        },
        Heading_Hierarchy:{
          H1_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.H1_Count,
          H2_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.H2_Count,
          H3_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.H3_Count,
          H4_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.H4_Count,
          H5_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.H5_Count,
          H6_Count: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.H6_Count,
        //   Heading: Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.Heading,
          Score:Metrices_Data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.Score,
          Parameter:'1 if headings follow proper H1→H2→H3 order, else 0',
        },
        ALT_Text_Relevance: {
          Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.ALT_Text_Relevance.Score,
          Parameter: "1 if alt text contains keywords or is descriptive, else 0"
        },
        Internal_Links: {
          Total: Metrices_Data.On_Page_SEO.Media_and_Semantics.Internal_Links.Total,
          Descriptive_Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.Internal_Links.Descriptive_Score,
          Parameter: "1 if ≥ 75% internal links are descriptive, else 0"
        },
        Semantic_Tags: {
          Article_Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.Semantic_Tags.Article_Score,
          Section_Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.Semantic_Tags.Section_Score,
          Header_Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.Semantic_Tags.Header_Score,
          Footer_Score: Metrices_Data.On_Page_SEO.Media_and_Semantics.Semantic_Tags.Footer_Score,
          Parameter: "1 if tag exists, else 0"
        },
        Duplicate_Content:{
          Score: Metrices_Data.On_Page_SEO.Structure_and_Uniqueness.Duplicate_Content.Score,
          Parameter:'1 if duplication ≤ 75%, else 0'
        },
         URL_Slugs:{
          Slug:Metrices_Data.On_Page_SEO.Structure_and_Uniqueness.URL_Slugs.Slug,
          Slug_Check_Score:Metrices_Data.On_Page_SEO.Structure_and_Uniqueness.URL_Slugs.Slug_Check_Score,
          Score:Metrices_Data.On_Page_SEO.Structure_and_Uniqueness.URL_Slugs.Score,
          Parameter:'1 if slug exists, ≤25 characters, lowercase hyphenated, else 0'
        },
        HTTPS: {
          Score: Metrices_Data.On_Page_SEO.Structure_and_Uniqueness.HTTPS.Score,
          Parameter: "1 if HTTPS implemented, else 0"
        },
        Pagination_Tags:{
          Score: Metrices_Data.On_Page_SEO.Structure_and_Uniqueness.Pagination_Tags.Score,
          Parameter:'1 if pagination links or rel=next/prev exist, else 0'
        },
      Percentage: Metrices_Data.On_Page_SEO.Percentage,
    },
    Accessibility: {
      Color_Contrast:{
        Score:Metrices_Data.Accessibility.Color_Contrast.Score,
        Parameter:'1 if color contrast passes, else 0'
      },
      Focus_Order:{
        Score:Metrices_Data.Accessibility.Focus_Order.Score,
        Parameter:'1 if tab/focus order is correct, else 0'
      },
      Focusable_Content:{
        Score:Metrices_Data.Accessibility.Focusable_Content.Score,
        Parameter:'1 if focusable elements are correctly used, else 0'
      },
      Tab_Index:{
        Score:Metrices_Data.Accessibility.Tab_Index.Score,
        Parameter:'1 if tabindex attributes are valid, else 0'
      },
      Interactive_Element_Affordance:{
        Score:Metrices_Data.Accessibility.Interactive_Element_Affordance.Score,
        Parameter:'1 if interactive elements have clear affordance, else 0'
      },
      Label:{
        Score:Metrices_Data.Accessibility.Label.Score,
        Parameter:'1 if form elements have labels, else 0'
      },
      Aria_Allowed_Attr:{
        Score:Metrices_Data.Accessibility.Aria_Allowed_Attr.Score,
        Parameter:'1 if only allowed ARIA attributes are used, else 0'
      },
      Aria_Roles:{
        Score:Metrices_Data.Accessibility.Aria_Roles.Score,
        Parameter:'1 if ARIA roles are correctly applied, else 0'
      },
      Aria_Hidden_Focus:{
        Score:Metrices_Data.Accessibility.Aria_Hidden_Focus.Score,
        Parameter:'1 if hidden elements do not receive focus, else 0'
      },
      Image_Alt:{
        Score:Metrices_Data.Accessibility.Image_Alt.Score,
        Parameter:'1 if images have descriptive alt text, else 0'
      },
      Skip_Links:{
        Score:Metrices_Data.Accessibility.Skip_Links.Score,
        Parameter:'1 if skip links exist, else 0',
      },
      Landmarks:{
        Score:Metrices_Data.Accessibility.Landmarks.Score,
        Parameter:'1 if landmark roles (banner, main, contentinfo, navigation, complementary) exist, else 0'
      },
      Percentage: Metrices_Data.Accessibility.Percentage,
    },
    Security_or_Compliance: {
      HTTPS: {
        Score: Metrices_Data.Security_or_Compliance.HTTPS.Score,
        Parameter: '1 if HTTPS is implemented, else 0'
      },
      SSL: {
        Score: Metrices_Data.Security_or_Compliance.SSL.Score,
        Parameter: '1 if SSL/TLS certificate is valid, else 0'
      },
      SSL_Expiry: {
        Score: Metrices_Data.Security_or_Compliance.SSL_Expiry.Score,
        Parameter: '1 if SSL certificate is not expired, else 0'
      },
      HSTS: {
        Score: Metrices_Data.Security_or_Compliance.HSTS.Score,
        Parameter: '1 if HSTS header is present, else 0'
      },
      TLS_Version: {
        Score: Metrices_Data.Security_or_Compliance.TLS_Version.Score,
        Parameter: '1 if secure TLS version is used, else 0'
      },
      X_Frame_Options: {
        Score: Metrices_Data.Security_or_Compliance.X_Frame_Options.Score,
        Parameter: '1 if X-Frame-Options header is set, else 0'
      },
      CSP: {
        Score: Metrices_Data.Security_or_Compliance.CSP.Score,
        Parameter: '1 if Content Security Policy (CSP) is set, else 0'
      },
      X_Content_Type_Options: {
        Score: Metrices_Data.Security_or_Compliance.X_Content_Type_Options.Score,
        Parameter: '1 if X-Content-Type-Options header is set, else 0'
      },
      Cookies_Secure: {
        Score: Metrices_Data.Security_or_Compliance.Cookies_Secure.Score,
        Parameter: '1 if cookies are set with Secure flag, else 0'
      },
      Cookies_HttpOnly: {
        Score: Metrices_Data.Security_or_Compliance.Cookies_HttpOnly.Score,
        Parameter: '1 if cookies are HttpOnly, else 0'
      },
      Google_Safe_Browsing: {
        Score: Metrices_Data.Security_or_Compliance.Google_Safe_Browsing.Score,
        Parameter: '1 if site is safe according to Google Safe Browsing, else 0'
      },
      Blacklist: {
        Score: Metrices_Data.Security_or_Compliance.Blacklist.Score,
        Parameter: '1 if site is not blacklisted, else 0'
      },
      Malware_Scan: {
        Score: Metrices_Data.Security_or_Compliance.Malware_Scan.Score,
        Parameter: '1 if no malware detected, else 0'
      },
      SQLi_Exposure: {
        Score: Metrices_Data.Security_or_Compliance.SQLi_Exposure.Score,
        Parameter: '1 if site is not vulnerable to SQL injection, else 0'
      },
      XSS: {
        Score: Metrices_Data.Security_or_Compliance.XSS.Score,
        Parameter: '1 if site is not vulnerable to XSS, else 0'
      },
      Cookie_Consent: {
        Score: Metrices_Data.Security_or_Compliance.Cookie_Consent.Score,
        Parameter: '1 if cookie consent banner is implemented, else 0'
      },
      Privacy_Policy: {
        Score: Metrices_Data.Security_or_Compliance.Privacy_Policy.Score,
        Parameter: '1 if privacy policy exists, else 0'
      },
      Forms_Use_HTTPS: {
        Score: Metrices_Data.Security_or_Compliance.Forms_Use_HTTPS.Score,
        Parameter: '1 if forms submit over HTTPS, else 0'
      },
      GDPR_CCPA: {
        Score: Metrices_Data.Security_or_Compliance.GDPR_CCPA.Score,
        Parameter: '1 if GDPR/CCPA compliance implemented, else 0'
      },
      Data_Collection: {
        Score: Metrices_Data.Security_or_Compliance.Data_Collection.Score,
        Parameter: '1 if data collection practices are compliant, else 0'
      },
      Weak_Default_Credentials: {
        Score: Metrices_Data.Security_or_Compliance.Weak_Default_Credentials.Score,
        Parameter: '1 if no weak default credentials exist, else 0'
      },
      MFA_Enabled: {
        Score: Metrices_Data.Security_or_Compliance.MFA_Enabled.Score,
        Parameter: '1 if multi-factor authentication is enabled, else 0'
      },
      Admin_Panel_Public: {
        Score: Metrices_Data.Security_or_Compliance.Admin_Panel_Public.Score,
        Parameter: '1 if admin panel is not publicly accessible, else 0'
      },
      Viewport_Meta_Tag: {
        Score: Metrices_Data.Security_or_Compliance.Viewport_Meta_Tag.Score,
        Parameter: "1 if <meta name='viewport' content='width=device-width, initial-scale=1.0'> is present, else 0"
      },
      HTML_Doctype: {
        Score: Metrices_Data.Security_or_Compliance.HTML_Doctype.Score,
        Parameter: '1 if <!DOCTYPE html> is declared at document start, else 0'
      },
      Character_Encoding: {
        Score: Metrices_Data.Security_or_Compliance.Character_Encoding.Score,
        Parameter: '1 if charset is defined in <meta> or HTTP headers, else 0'
      },
      Browser_Console_Errors: {
        Score: Metrices_Data.Security_or_Compliance.Browser_Console_Errors.Score,
        Parameter: '1 if no console or JS errors are detected, else 0'
      },
      Geolocation_Request: {
        Score: Metrices_Data.Security_or_Compliance.Geolocation_Request.Score,
        Parameter: '1 if geolocation is not requested automatically, else 0'
      },
      Input_Paste_Allowed: {
        Score: Metrices_Data.Security_or_Compliance.Input_Paste_Allowed.Score,
        Parameter: '1 if paste is allowed in input fields, else 0'
      },
      Notification_Request: {
        Score: Metrices_Data.Security_or_Compliance.Notification_Request.Score,
        Parameter: '1 if no unsolicited notification request is made, else 0'
      },
      Third_Party_Cookies: {
        Score: Metrices_Data.Security_or_Compliance.Third_Party_Cookies.Score,
        Parameter: '1 if no third-party cookies are detected, else 0'
      },
      Deprecated_APIs: {
        Score: Metrices_Data.Security_or_Compliance.Deprecated_APIs.Score,
        Parameter: '1 if no deprecated APIs are used, else 0'
      },
      Percentage: Metrices_Data.Security_or_Compliance.Percentage,
    },
    UX_or_Content_Structure: {
      Navigation_Clarity: {
        Score: Metrices_Data.UX_or_Content_Structure.Navigation_Clarity.Score,
        Parameter: '1 if navigation menus are visible, labeled, and unique, else 0'
      },
      Breadcrumbs: {
        Score: Metrices_Data.UX_or_Content_Structure.Breadcrumbs.Score,
        Parameter: '1 if breadcrumbs are present with at least one text item, else 0'
      },
      Clickable_Logo: {
        Score: Metrices_Data.UX_or_Content_Structure.Clickable_Logo.Score,
        Parameter: '1 if logo links to homepage, else 0'
      },
      Mobile_Responsiveness: {
        Score: Metrices_Data.UX_or_Content_Structure.Mobile_Responsiveness.Score,
        Parameter: '1 if viewport meta is set and responsive CSS exists, else 0'
      },
      Font_Style_and_Size_Consistency: {
        Score: Metrices_Data.UX_or_Content_Structure.Font_Style_and_Size_Consistency.Score,
        Parameter: '1 if font-family and font-size are consistent, else 0'
      },
      Whitespace_Usage: {
        Score: Metrices_Data.UX_or_Content_Structure.Whitespace_Usage.Score,
        Parameter: '1 if sufficient padding/margins exist in most blocks, else 0'
      },
      Paragraph_Length_and_Spacing: {
        Score: Metrices_Data.UX_or_Content_Structure.Paragraph_Length_and_Spacing.Score,
        Parameter: '1 if paragraphs are 40–120 words and spacing is adequate, else 0'
      },
      Contrast_and_Color_Harmony: {
        Score: Metrices_Data.UX_or_Content_Structure.Contrast_and_Color_Harmony.Score,
        Parameter: '1 if text-background contrast ratio ≥ 4.5, else 0'
      },
      Content_Relevance: {
        Score: Metrices_Data.UX_or_Content_Structure.Content_Relevance.Score,
        Parameter: '1 if ≥50% of title keywords appear in content, else 0'
      },
      Call_to_Action_Clarity: {
        Score: Metrices_Data.UX_or_Content_Structure.Call_to_Action_Clarity.Score,
        Parameter: '1 if at least 1 meaningful CTA exists, else 0'
      },
      Multimedia_Balance: {
        Score: Metrices_Data.UX_or_Content_Structure.Multimedia_Balance.Score,
        Parameter: '1 if text and media are balanced (≥1 text per media element), else 0'
      },
      Error_and_Empty_State_Handling: {
        Score: Metrices_Data.UX_or_Content_Structure.Error_and_Empty_State_Handling.Score,
        Parameter: '1 if empty/error states provide guidance, else 0'
      },
      Interactive_Feedback: {
        Score: Metrices_Data.UX_or_Content_Structure.Interactive_Feedback.Score,
        Parameter: '1 if buttons/links/forms provide visual or textual feedback, else 0'
      },
      Sticky_Navigation: {
        Score: Metrices_Data.UX_or_Content_Structure.Sticky_Navigation.Score,
        Parameter: '1 if navigation remains visible when scrolling, else 0'
      },
      Scroll_Depth_Logic: {
        Score: Metrices_Data.UX_or_Content_Structure.Scroll_Depth_Logic.Score,
        Parameter: '1 if TOC or back-to-top exists for long pages, else 0'
      },
      Loading_Indicators: {
        Score: Metrices_Data.UX_or_Content_Structure.Loading_Indicators.Score,
        Parameter: '1 if visible loading indicators exist, else 0'
      },
      Internal_Linking_Quality: {
        Score: Metrices_Data.UX_or_Content_Structure.Internal_Linking_Quality.Score,
        Parameter: '1 if internal links exist and are relevant, else 0'
      },
      User_Journey_Continuity: {
        Score: Metrices_Data.UX_or_Content_Structure.User_Journey_Continuity.Score,
        Parameter: '1 if at least one meaningful CTA exists for next steps, else 0'
      },
      Percentage: Metrices_Data.UX_or_Content_Structure.Percentage,
    },
    Conversion_and_Lead_Flow: {
        CTA_Visibility: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Visibility.Score,
          Parameter: "1 if at least one prominent CTA is present, else 0"
        },
        CTA_Clarity: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Clarity.Score,
          Parameter: "1 if CTA buttons and links have clear, actionable text, else 0"
        },
        CTA_Contrast: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Contrast.Score,
          Parameter: "1 if CTA text has sufficient contrast (≥4.5:1), else 0"
        },
        CTA_Crowding: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Crowding.Score,
          Parameter: "1 if number of CTAs is limited to prevent confusion, else 0"
        },
        CTA_Flow_Alignment: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Flow_Alignment.Score,
          Parameter: "1 if CTAs are placed logically along user flow, else 0"
        },
        Form_Presence: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.Form_Presence.Score,
          Parameter: "1 if at least one form is present, else 0"
        },
        Form_Length: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.Form_Length.Score,
          Parameter: "1 if forms are concise, else 0"
        },
        Required_vs_Optional_Fields: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.Required_vs_Optional_Fields.Score,
          Parameter: "1 if required vs optional fields are clearly marked, else 0"
        },
        Inline_Validation: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.Inline_Validation.Score,
          Parameter: "1 if real-time feedback is provided for user input, else 0"
        },
        Submit_Button_Clarity: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.Submit_Button_Clarity.Score,
          Parameter: "1 if submit button text is clear and actionable, else 0"
        },
        AutoFocus_Field: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.AutoFocus_Field.Score,
          Parameter: "1 if first input field is autofocused, else 0"
        },
        MultiStep_Form_Progress: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.CTA_and_Forms.MultiStep_Form_Progress.Score,
          Parameter: "1 if progress indicators exist in multi-step forms, else 0"
        },
        Testimonials: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Testimonials.Score,
          Parameter: "1 if testimonials are visible, else 0"
        },
        Reviews: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Reviews.Score,
          Parameter: "1 if reviews/ratings are visible, else 0"
        },
        Trust_Badges: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Trust_Badges.Score,
          Parameter: "1 if trust/security badges are visible, else 0"
        },
        Client_Logos: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Client_Logos.Score,
          Parameter: "1 if client logos are visible, else 0"
        },
        Case_Studies_Accessibility: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Case_Studies_Accessibility.Score,
          Parameter: "1 if case studies are accessible, else 0"
        },
        Exit_Intent_Triggers: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Lead_Funnel.Exit_Intent_Triggers.Score,
          Parameter: "1 if exit-intent triggers exist, else 0"
        },
        Lead_Magnets: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Lead_Funnel.Lead_Magnets.Score,
          Parameter: "1 if lead magnets are offered, else 0"
        },
        Contact_Info_Visibility: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Lead_Funnel.Contact_Info_Visibility.Score,
          Parameter: "1 if contact info is visible, else 0"
        },
        Chatbot_Presence: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.Lead_Funnel.Chatbot_Presence.Score,
          Parameter: "1 if chatbot is present, else 0"
        },
        Interactive_Elements: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Interactive_Elements.Score,
          Parameter: "1 if interactive elements are present, else 0"
        },
        Personalization: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Personalization.Score,
          Parameter: "1 if personalized content exists, else 0"
        },
        Progress_Indicators: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Progress_Indicators.Score,
          Parameter: "1 if progress indicators are visible, else 0"
        },
        Friendly_Error_Handling: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Friendly_Error_Handling.Score,
          Parameter: "1 if error messages are clear and helpful, else 0"
        },
        Microcopy_Clarity: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Microcopy_Clarity.Score,
          Parameter: "1 if labels/placeholders are clear, else 0"
        },
        Incentives_Displayed: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Incentives_Displayed.Score,
          Parameter: "1 if offers or incentives are visible, else 0"
        },
        Scarcity_Urgency: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Scarcity_Urgency.Score,
          Parameter: "1 if scarcity or urgency cues are present, else 0"
        },
        Smooth_Scrolling: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Smooth_Scrolling.Score,
          Parameter: "1 if smooth scrolling is implemented, else 0"
        },
        Mobile_CTA_Adaptation: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.Mobile_CTA_Adaptation.Score,
          Parameter: "1 if CTAs are mobile-friendly, else 0"
        },
        MultiChannel_FollowUp: {
          Score: Metrices_Data.Conversion_and_Lead_Flow.UX_and_Interaction.MultiChannel_FollowUp.Score,
          Parameter: "1 if multi-channel follow-up options exist, else 0"
        },
      Percentage: Metrices_Data.Conversion_and_Lead_Flow.Percentage,
    },
    AIO_Readiness: {
        Structured_Data: {
          Score: Metrices_Data.AIO_Readiness.Technical_AI_Foundation.Structured_Data.Score,
          Parameter: "1 if valid structured data (schema.org/JSON-LD) is implemented, else 0"
        },
        Metadata_Complete: {
          Score: Metrices_Data.AIO_Readiness.Technical_AI_Foundation.Metadata_Complete.Score,
          Parameter: "1 if metadata (title, description, OG/Twitter tags) is complete, else 0"
        },
        Fast_Page_Load: {
          Score: Metrices_Data.AIO_Readiness.Technical_AI_Foundation.Fast_Page_Load.Score,
          Parameter: "1 if page load time is under 2s, else 0"
        },
        API_Data_Access: {
          Score: Metrices_Data.AIO_Readiness.Technical_AI_Foundation.API_Data_Access.Score,
          Parameter: "1 if secure and documented API endpoints exist, else 0"
        },
        Dynamic_Content_Available: {
          Score: Metrices_Data.AIO_Readiness.Technical_AI_Foundation.Dynamic_Content_Available.Score,
          Parameter: "1 if dynamic or interactive content is present, else 0"
        },
        Multilingual_Support: {
          Score: Metrices_Data.AIO_Readiness.Technical_AI_Foundation.Multilingual_Support.Score,
          Parameter: "1 if hreflang and multilingual versions exist, else 0"
        },
        Content_NLP_Friendly: {
          Score: Metrices_Data.AIO_Readiness.Content_AI_Optimization.Content_NLP_Friendly.Score,
          Parameter: "1 if content uses natural, entity-rich language and NLP-friendly structure, else 0"
        },
        Keywords_Entities_Annotated: {
          Score: Metrices_Data.AIO_Readiness.Content_AI_Optimization.Keywords_Entities_Annotated.Score,
          Parameter: "1 if entities and keywords are annotated with schema or metadata, else 0"
        },
        Content_Updated_Regularly: {
          Score: Metrices_Data.AIO_Readiness.Content_AI_Optimization.Content_Updated_Regularly.Score,
          Parameter: "1 if website content is updated frequently, else 0"
        },
        Internal_Linking_AI_Friendly: {
          Score: Metrices_Data.AIO_Readiness.Content_AI_Optimization.Internal_Linking_AI_Friendly.Score,
          Parameter: "1 if internal links are structured and contextually relevant, else 0"
        },
        Duplicate_Content_Detection_Ready: {
          Score: Metrices_Data.AIO_Readiness.Content_AI_Optimization.Duplicate_Content_Detection_Ready.Score,
          Parameter: "1 if duplicate content detection mechanisms are active, else 0"
        },
        Behavior_Tracking_Implemented: {
          Score: Metrices_Data.AIO_Readiness.Data_Intelligence_Integration.Behavior_Tracking_Implemented.Score,
          Parameter: "1 if user behavior tracking is implemented (e.g., analytics), else 0"
        },
        Segmentation_Profiling_Ready: {
          Score: Metrices_Data.AIO_Readiness.Data_Intelligence_Integration.Segmentation_Profiling_Ready.Score,
          Parameter: "1 if audience segmentation and profiling are in place, else 0"
        },
        Event_Goal_Tracking_Integrated: {
          Score: Metrices_Data.AIO_Readiness.Data_Intelligence_Integration.Event_Goal_Tracking_Integrated.Score,
          Parameter: "1 if event or goal tracking is active, else 0"
        },
        AB_Testing_Ready: {
          Score: Metrices_Data.AIO_Readiness.Data_Intelligence_Integration.AB_Testing_Ready.Score,
          Parameter: "1 if A/B testing setup exists, else 0"
        },
        User_Feedback_Loops_Present: {
          Score: Metrices_Data.AIO_Readiness.Data_Intelligence_Integration.User_Feedback_Loops_Present.Score,
          Parameter: "1 if feedback collection systems (surveys, reviews) are active, else 0"
        },
        Dynamic_Personalization: {
          Score: Metrices_Data.AIO_Readiness.AI_Content_Delivery.Dynamic_Personalization.Score,
          Parameter: "1 if dynamic content adjusts based on user segments or behavior, else 0"
        },
        AI_Content_Distribution: {
          Score: Metrices_Data.AIO_Readiness.AI_Content_Delivery.AI_Content_Distribution.Score,
          Parameter: "1 if content delivery through APIs or feeds is available, else 0"
        },
        AI_Friendly_Structure: {
          Score: Metrices_Data.AIO_Readiness.AI_Content_Delivery.AI_Friendly_Structure.Score,
          Parameter: "1 if website structure aids AI comprehension and crawling, else 0"
        },
      Percentage: Metrices_Data.AIO_Readiness.Percentage,
    }
        }
        break;

    default:        
    }

return metrices;
};
