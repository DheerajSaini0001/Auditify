
export default function Raw(url, MetricesCalculation_Data, Overall_Data,timeTaken,device) {

  const metrices = {
    Schema:MetricesCalculation_Data.technicalReport.structuredData,
    Device:device,
    Time_Taken:timeTaken,
    Site: url,
    Score: Overall_Data.totalScore,
    Grade: Overall_Data.grade,
    AIO_Compatibility_Badge: MetricesCalculation_Data.aioReport.AIO_Compatibility_Badge,
    Section_Score: Overall_Data.sectionScores,
    Technical_Performance: {
      Core_Web_Vitals: {
        LCP:{
          Score: MetricesCalculation_Data.technicalReport.coreWebVitals.lcpScore,
          Value: MetricesCalculation_Data.technicalReport.coreWebVitals.lcpValue,
          Parameter:'Set 1 if LCP ≤ 2.5s, otherwise set 0'
        },
        FID:{
          Score: MetricesCalculation_Data.technicalReport.coreWebVitals.fidScore,
          Value: MetricesCalculation_Data.technicalReport.coreWebVitals.fidValue,
          Parameter:'Set 1 if FID ≤ 0.1s, otherwise set 0'
        },
        CLS:{
          Score: MetricesCalculation_Data.technicalReport.coreWebVitals.clsScore,
          Value: MetricesCalculation_Data.technicalReport.coreWebVitals.clsValue,
          Parameter:'Set 1 if CLS ≤ 0.1, otherwise set 0'
        },
        FCP:{
          Score: MetricesCalculation_Data.technicalReport.coreWebVitals.fcpScore,
          Value: MetricesCalculation_Data.technicalReport.coreWebVitals.fcpValue,
          Parameter:'Set 1 if FCP ≤ 1.8s, otherwise set 0'
        },
        TTFB:{
          Score: MetricesCalculation_Data.technicalReport.coreWebVitals.ttfbScore,
          Value: MetricesCalculation_Data.technicalReport.coreWebVitals.ttfbValue,
          Parameter:'Set 1 if TTFB ≤ 0.2s, otherwise set 0'
        },
        TBT:{
          Score: MetricesCalculation_Data.technicalReport.coreWebVitals.tbtScore,
          Value: MetricesCalculation_Data.technicalReport.coreWebVitals.tbtValue,
          Parameter:'Set 1 if TBT ≤ 0.3s, otherwise set 0'
        },
        SI:{
          Score: MetricesCalculation_Data.technicalReport.coreWebVitals.siScore,
          Value: MetricesCalculation_Data.technicalReport.coreWebVitals.siValue,
          Parameter:'Set 1 if SI ≤ 3s, otherwise set 0'
        },
        INP:{
          Score: MetricesCalculation_Data.technicalReport.coreWebVitals.inpScore,
          Value: MetricesCalculation_Data.technicalReport.coreWebVitals.inpValue,
          Parameter:'Set 1 if INP ≤ 0.2s, otherwise set 0'
        },
        Core_Web_Vitals_Total_Score: MetricesCalculation_Data.technicalReport.coreWebVitals.coreWebVitalsTotal,
      },
      Delivery_and_Render: {
        Compression:{
          Score: MetricesCalculation_Data.technicalReport.deliveryAndRender.compressionScore,
          Parameter:'Set 1 if "gzip" or "brotli" compression is enabled, otherwise set 0 if it’s disabled or missing.'
        },
        Caching:{
          Score: MetricesCalculation_Data.technicalReport.deliveryAndRender.cachingScore,
          Value: MetricesCalculation_Data.technicalReport.deliveryAndRender.cachingValue,
          Parameter:'Set 1 if static resources have TTL ≥ 7 days, otherwise set 0 if TTL is less than 7 days or missing'
        },
        Resource_Optimization:{
          Score: MetricesCalculation_Data.technicalReport.deliveryAndRender.resourceOptimizationScore,
          Parameter:'Set 1 if images are optimized, CSS/JS minified, and offscreen images deferred; otherwise set 0.'
        },
        Render_Blocking:{
          Score: MetricesCalculation_Data.technicalReport.deliveryAndRender.renderBlockingScore,
          Parameter:'Set 1 if there are no render-blocking CSS/JS resources, otherwise set 0'
        },
        HTTP:{
          Score: MetricesCalculation_Data.technicalReport.deliveryAndRender.httpsScore,
          Parameter:'Set 1 if HTTP/2 is enabled, otherwise set 0 if not enabled'
        },
        Delivery_and_Render_Total_Score: MetricesCalculation_Data.technicalReport.deliveryAndRender.deliveryAndRenderTotal,
      },
      Crawlability_and_Hygiene: {
        Sitemap:{
          Score: MetricesCalculation_Data.technicalReport.crawlabilityAndHygiene.sitemapScore,
          Parameter:'Set 1 if /sitemap.xml exists, otherwise set 0'
        },
        Robots:{
          Score: MetricesCalculation_Data.technicalReport.crawlabilityAndHygiene.robotsScore,
          Parameter:'Set 1 if robots.txt exists, otherwise set 0'
        },
        Structured_Data:{
          Score: MetricesCalculation_Data.technicalReport.crawlabilityAndHygiene.structuredDataScore,
          Parameter:'Set 1 if JSON-LD structured data is present, otherwise set 0'
        },
        Broken_Links:{
          Score: MetricesCalculation_Data.technicalReport.crawlabilityAndHygiene.brokenScore,
          Value: MetricesCalculation_Data.technicalReport.crawlabilityAndHygiene.brokenPercent,
          Parameter:'Set 1 if 0% broken links, otherwise set 0'
        },
        Redirect_Chains:{
          Score: MetricesCalculation_Data.technicalReport.crawlabilityAndHygiene.redirectScore,
          Value: MetricesCalculation_Data.technicalReport.crawlabilityAndHygiene.hops,
          Parameter:'Set 1 if ≤ 1 hop, otherwise set 0'
        },
        Crawlability_and_Hygiene_Total_Score: MetricesCalculation_Data.technicalReport.crawlabilityAndHygiene.crawlabilityAndHygieneTotal,
      },
      Percentage: MetricesCalculation_Data.technicalReport.actualPercentage,
    },
    On_Page_SEO: {
      Essentials: {
        Title: {
          Title: MetricesCalculation_Data.seoReport.essentials.title,
          Title_Exist : MetricesCalculation_Data.seoReport.essentials.titleExistanceScore,
          Title_Length: MetricesCalculation_Data.seoReport.essentials.titleLength,
          Score: MetricesCalculation_Data.seoReport.essentials.titleScore,
          Parameter:'1 if title exists and 30–60 characters, else 0'
        },
        Meta_Description: {
          MetaDescription: MetricesCalculation_Data.seoReport.essentials.metaDesc,
          MetaDescription_Exist: MetricesCalculation_Data.seoReport.essentials.metaDescExistanceScore,
          MetaDescription_Length: MetricesCalculation_Data.seoReport.essentials.metaDescLength,
          Score: MetricesCalculation_Data.seoReport.essentials.metaDescScore,
          Parameter:'1 if meta description exists and ≤ 165 characters, else 0'
        },
        URL_Structure: {
          Score: MetricesCalculation_Data.seoReport.essentials.URLStructureScore,
          Parameter:'1 if URL ≤ 5 segments, lowercase, hyphen-separated, else 0'
        },
        Canonical: {
          Canonical: MetricesCalculation_Data.seoReport.essentials.canonical,
          Canonical_Exist: MetricesCalculation_Data.seoReport.essentials.canonicalExistanceScore,
          Score: MetricesCalculation_Data.seoReport.essentials.canonicalScore,
          Parameter:'1 if canonical tag exists and matches page URL, else 0'
        },
        Essentials_Total_Score: MetricesCalculation_Data.seoReport.essentials.essentialsTotal,
      },
      Media_and_Semantics: {
        H1: {
          H1_Count: MetricesCalculation_Data.seoReport.mediaAndSemantics.h1Count,
          H1_Count_Score: MetricesCalculation_Data.seoReport.mediaAndSemantics.h1CountScore,
          Score: MetricesCalculation_Data.seoReport.mediaAndSemantics.h1Score,
          Parameter:'1 if exactly one H1, 2 if >1, 0 if none'
        },
        Image:{
          Image_Exist: MetricesCalculation_Data.seoReport.mediaAndSemantics.imagePresenceScore,
          Image_Alt_Exist: MetricesCalculation_Data.seoReport.mediaAndSemantics.altPresence,
          Image_Alt_Meaningfull_Exist: MetricesCalculation_Data.seoReport.mediaAndSemantics.altMeaningfullPercentage,
          Image_Compression_Exist: MetricesCalculation_Data.seoReport.mediaAndSemantics.imageCompressionScore,
          Parameter:'Alt text ≥ 75% meaningful, images ≤ 200KB'
        },
        Video:{
          Video_Exist: MetricesCalculation_Data.seoReport.mediaAndSemantics.videoExistanceScore,
          Video_Embedding_Exist: MetricesCalculation_Data.seoReport.mediaAndSemantics.embedding,
          Video_LazyLoading_Exist: MetricesCalculation_Data.seoReport.mediaAndSemantics.lazyLoading,
          Video_Structured_Metadata_Exist: MetricesCalculation_Data.seoReport.mediaAndSemantics.structuredMetadata,
          Parameter:'Proper embedding, lazy-loading, JSON-LD metadata'
        },
        Heading_Hierarchy:{
          H1_Count: MetricesCalculation_Data.seoReport.mediaAndSemantics.h1Count,
          H2_Count: MetricesCalculation_Data.seoReport.mediaAndSemantics.h2Count,
          H3_Count: MetricesCalculation_Data.seoReport.mediaAndSemantics.h3Count,
          H4_Count: MetricesCalculation_Data.seoReport.mediaAndSemantics.h4Count,
          H5_Count: MetricesCalculation_Data.seoReport.mediaAndSemantics.h5Count,
          H6_Count: MetricesCalculation_Data.seoReport.mediaAndSemantics.h6Count,
        //   Heading: MetricesCalculation_Data.seoReport.mediaAndSemantics.headings,
          Score:MetricesCalculation_Data.seoReport.mediaAndSemantics.hierarchy,
          Parameter:'1 if headings follow proper H1→H2→H3 order, else 0',
        },
        ALT_Text_Relevance: {
          Score: MetricesCalculation_Data.seoReport.mediaAndSemantics.alttextScore,
          Parameter: "1 if alt text contains keywords or is descriptive, else 0"
        },
        Internal_Links: {
          Total: MetricesCalculation_Data.seoReport.mediaAndSemantics.totalInternalLinks,
          Descriptive_Score: MetricesCalculation_Data.seoReport.mediaAndSemantics.internalLinksDescriptiveScore,
          Parameter: "1 if ≥ 75% internal links are descriptive, else 0"
        },
        Semantic_Tags: {
          Article_Score: MetricesCalculation_Data.seoReport.mediaAndSemantics.articleScore,
          Section_Score: MetricesCalculation_Data.seoReport.mediaAndSemantics.sectionScore,
          Header_Score: MetricesCalculation_Data.seoReport.mediaAndSemantics.headerScore,
          Footer_Score: MetricesCalculation_Data.seoReport.mediaAndSemantics.footerScore,
          Parameter: "1 if tag exists, else 0"
        },
        Media_and_Semantics_Total_Score: MetricesCalculation_Data.seoReport.mediaAndSemantics.mediaAndSemanticsTotal
      },
      Structure_and_Uniqueness: {
        Duplicate_Content:{
          Score: MetricesCalculation_Data.seoReport.structureAndUniqueness.dupScore,
          Parameter:'1 if duplication ≤ 75%, else 0'
        },
         URL_Slugs:{
          Slug:MetricesCalculation_Data.seoReport.structureAndUniqueness.slug,
          Slug_Check_Score:MetricesCalculation_Data.seoReport.structureAndUniqueness.slugCheckScore,
          Score:MetricesCalculation_Data.seoReport.structureAndUniqueness.slugScore,
          Parameter:'1 if slug exists, ≤25 characters, lowercase hyphenated, else 0'
        },
        HTTPS: {
          Score: MetricesCalculation_Data.seoReport.structureAndUniqueness.checkHTTPSScore,
          Parameter: "1 if HTTPS implemented, else 0"
        },
        Pagination_Tags:{
          Score: MetricesCalculation_Data.seoReport.structureAndUniqueness.paginationScore,
          Parameter:'1 if pagination links or rel=next/prev exist, else 0'
        },
        Structure_and_Uniqueness_Total_Score: MetricesCalculation_Data.seoReport.structureAndUniqueness.structureAndUniquenessTotal,
      },
      Percentage: MetricesCalculation_Data.seoReport.actualPercentage,
    },
    Accessibility: {
      Color_Contrast:{
        Score:MetricesCalculation_Data.accessibilityReport.colorContrast,
        Parameter:'1 if color contrast passes, else 0'
      },
      Focus_Order:{
        Score:MetricesCalculation_Data.accessibilityReport.focusOrder,
        Parameter:'1 if tab/focus order is correct, else 0'
      },
      Focusable_Content:{
        Score:MetricesCalculation_Data.accessibilityReport.focusableContent,
        Parameter:'1 if focusable elements are correctly used, else 0'
      },
      Tab_Index:{
        Score:MetricesCalculation_Data.accessibilityReport.tabindex,
        Parameter:'1 if tabindex attributes are valid, else 0'
      },
      Interactive_Element_Affordance:{
        Score:MetricesCalculation_Data.accessibilityReport.interactiveElementAffordance,
        Parameter:'1 if interactive elements have clear affordance, else 0'
      },
      Label:{
        Score:MetricesCalculation_Data.accessibilityReport.label,
        Parameter:'1 if form elements have labels, else 0'
      },
      Aria_Allowed_Attr:{
        Score:MetricesCalculation_Data.accessibilityReport.ariaAllowedAttr,
        Parameter:'1 if only allowed ARIA attributes are used, else 0'
      },
      Aria_Roles:{
        Score:MetricesCalculation_Data.accessibilityReport.ariaRoles,
        Parameter:'1 if ARIA roles are correctly applied, else 0'
      },
      Aria_Hidden_Focus:{
        Score:MetricesCalculation_Data.accessibilityReport.ariaHiddenFocus,
        Parameter:'1 if hidden elements do not receive focus, else 0'
      },
      Image_Alt:{
        Score:MetricesCalculation_Data.accessibilityReport.imageAlt,
        Parameter:'1 if images have descriptive alt text, else 0'
      },
      Skip_Links:{
        Score:MetricesCalculation_Data.accessibilityReport.skipLinks,
        Parameter:'1 if skip links exist, else 0',
      },
      Landmarks:{
        Score:MetricesCalculation_Data.accessibilityReport.landMarks,
        Parameter:'1 if landmark roles (banner, main, contentinfo, navigation, complementary) exist, else 0'
      },
      Percentage: MetricesCalculation_Data.accessibilityReport.actualPercentage,
    },
    Security_or_Compliance: {
      HTTPS: {
        Score: MetricesCalculation_Data.securityReport.checkHTTPSScore,
        Parameter: '1 if HTTPS is implemented, else 0'
      },
      SSL: {
        Score: MetricesCalculation_Data.securityReport.checkSSLScore,
        Parameter: '1 if SSL/TLS certificate is valid, else 0'
      },
      SSL_Expiry: {
        Score: MetricesCalculation_Data.securityReport.checkSSLCertificateExpiryScore,
        Parameter: '1 if SSL certificate is not expired, else 0'
      },
      HSTS: {
        Score: MetricesCalculation_Data.securityReport.checkHSTSScore,
        Parameter: '1 if HSTS header is present, else 0'
      },
      TLS_Version: {
        Score: MetricesCalculation_Data.securityReport.checkTLSVersionScore,
        Parameter: '1 if secure TLS version is used, else 0'
      },
      X_Frame_Options: {
        Score: MetricesCalculation_Data.securityReport.checkXFrameOptionsScore,
        Parameter: '1 if X-Frame-Options header is set, else 0'
      },
      CSP: {
        Score: MetricesCalculation_Data.securityReport.checkCSPScore,
        Parameter: '1 if Content Security Policy (CSP) is set, else 0'
      },
      X_Content_Type_Options: {
        Score: MetricesCalculation_Data.securityReport.checkXContentTypeOptionsScore,
        Parameter: '1 if X-Content-Type-Options header is set, else 0'
      },
      Cookies_Secure: {
        Score: MetricesCalculation_Data.securityReport.checkCookiesSecureScore,
        Parameter: '1 if cookies are set with Secure flag, else 0'
      },
      Cookies_HttpOnly: {
        Score: MetricesCalculation_Data.securityReport.checkCookiesHttpOnlyScore,
        Parameter: '1 if cookies are HttpOnly, else 0'
      },
      Google_Safe_Browsing: {
        Score: MetricesCalculation_Data.securityReport.safeBrowsingScore,
        Parameter: '1 if site is safe according to Google Safe Browsing, else 0'
      },
      Blacklist: {
        Score: MetricesCalculation_Data.securityReport.blacklistScore,
        Parameter: '1 if site is not blacklisted, else 0'
      },
      Malware_Scan: {
        Score: MetricesCalculation_Data.securityReport.malwareScanScore,
        Parameter: '1 if no malware detected, else 0'
      },
      SQLi_Exposure: {
        Score: MetricesCalculation_Data.securityReport.sqliExposureScore,
        Parameter: '1 if site is not vulnerable to SQL injection, else 0'
      },
      XSS: {
        Score: MetricesCalculation_Data.securityReport.xssVulnerabilityScore,
        Parameter: '1 if site is not vulnerable to XSS, else 0'
      },
      Cookie_Consent: {
        Score: MetricesCalculation_Data.securityReport.cookieConsentScore,
        Parameter: '1 if cookie consent banner is implemented, else 0'
      },
      Privacy_Policy: {
        Score: MetricesCalculation_Data.securityReport.privacyPolicyScore,
        Parameter: '1 if privacy policy exists, else 0'
      },
      Forms_Use_HTTPS: {
        Score: MetricesCalculation_Data.securityReport.formsUseHTTPSScore,
        Parameter: '1 if forms submit over HTTPS, else 0'
      },
      GDPR_CCPA: {
        Score: MetricesCalculation_Data.securityReport.checkGDPRCCPAScore,
        Parameter: '1 if GDPR/CCPA compliance implemented, else 0'
      },
      Data_Collection: {
        Score: MetricesCalculation_Data.securityReport.checkDataCollectionScore,
        Parameter: '1 if data collection practices are compliant, else 0'
      },
      Weak_Default_Credentials: {
        Score: MetricesCalculation_Data.securityReport.weakDefaultCredsScore,
        Parameter: '1 if no weak default credentials exist, else 0'
      },
      MFA_Enabled: {
        Score: MetricesCalculation_Data.securityReport.mfaEnabledScore,
        Parameter: '1 if multi-factor authentication is enabled, else 0'
      },
      Admin_Panel_Public: {
        Score: MetricesCalculation_Data.securityReport.checkAdminPanelPublicScore,
        Parameter: '1 if admin panel is not publicly accessible, else 0'
      },
      Viewport_Meta_Tag: {
        Score: MetricesCalculation_Data.securityReport.checkViewportMetaTagScore,
        Parameter: '1 if <meta name="viewport" content="width=device-width, initial-scale=1.0"> is present, else 0'
      },
      HTML_Doctype: {
        Score: MetricesCalculation_Data.securityReport.checkHtmlDoctypeScore,
        Parameter: '1 if <!DOCTYPE html> is declared at document start, else 0'
      },
      Character_Encoding: {
        Score: MetricesCalculation_Data.securityReport.checkCharsetDefinedScore,
        Parameter: '1 if charset is defined in <meta> or HTTP headers, else 0'
      },
      Browser_Console_Errors: {
        Score: MetricesCalculation_Data.securityReport.checkBrowserErrorsScore,
        Parameter: '1 if no console or JS errors are detected, else 0'
      },
      Geolocation_Request: {
        Score: MetricesCalculation_Data.securityReport.checkGeolocationRequestScore,
        Parameter: '1 if geolocation is not requested automatically, else 0'
      },
      Input_Paste_Allowed: {
        Score: MetricesCalculation_Data.securityReport.checkInputPasteAllowedScore,
        Parameter: '1 if paste is allowed in input fields, else 0'
      },
      Notification_Request: {
        Score: MetricesCalculation_Data.securityReport.checkNotificationRequestScore,
        Parameter: '1 if no unsolicited notification request is made, else 0'
      },
      Third_Party_Cookies: {
        Score: MetricesCalculation_Data.securityReport.checkThirdPartyCookiesScore,
        Parameter: '1 if no third-party cookies are detected, else 0'
      },
      Deprecated_APIs: {
        Score: MetricesCalculation_Data.securityReport.checkDeprecatedAPIsScore,
        Parameter: '1 if no deprecated APIs are used, else 0'
      },
      Percentage: MetricesCalculation_Data.securityReport.actualPercentage,
    },
    UX_or_Content_Structure: {
      Navigation_Clarity: {
        Score: MetricesCalculation_Data.uxReport.checkNavigationClarityScore,
        Parameter: '1 if navigation menus are visible, labeled, and unique, else 0'
      },
      Breadcrumbs: {
        Score: MetricesCalculation_Data.uxReport.checkBreadcrumbsScore,
        Parameter: '1 if breadcrumbs are present with at least one text item, else 0'
      },
      Clickable_Logo: {
        Score: MetricesCalculation_Data.uxReport.checkClickableLogoScore,
        Parameter: '1 if logo links to homepage, else 0'
      },
      Mobile_Responsiveness: {
        Score: MetricesCalculation_Data.uxReport.checkMobileResponsivenessScore,
        Parameter: '1 if viewport meta is set and responsive CSS exists, else 0'
      },
      Font_Style_and_Size_Consistency: {
        Score: MetricesCalculation_Data.uxReport.checkFontStyleAndSizeConsistencyScore,
        Parameter: '1 if font-family and font-size are consistent, else 0'
      },
      Whitespace_Usage: {
        Score: MetricesCalculation_Data.uxReport.checkWhitespaceUsageScore,
        Parameter: '1 if sufficient padding/margins exist in most blocks, else 0'
      },
      Paragraph_Length_and_Spacing: {
        Score: MetricesCalculation_Data.uxReport.checkParagraphLengthAndSpacingScore,
        Parameter: '1 if paragraphs are 40–120 words and spacing is adequate, else 0'
      },
      Contrast_and_Color_Harmony: {
        Score: MetricesCalculation_Data.uxReport.checkContrastAndColorHarmonyScore,
        Parameter: '1 if text-background contrast ratio ≥ 4.5, else 0'
      },
      Content_Relevance: {
        Score: MetricesCalculation_Data.uxReport.checkContentRelevanceScore,
        Parameter: '1 if ≥50% of title keywords appear in content, else 0'
      },
      Call_to_Action_Clarity: {
        Score: MetricesCalculation_Data.uxReport.checkCallToActionClarityScore,
        Parameter: '1 if at least 1 meaningful CTA exists, else 0'
      },
      Multimedia_Balance: {
        Score: MetricesCalculation_Data.uxReport.checkMultimediaBalanceScore,
        Parameter: '1 if text and media are balanced (≥1 text per media element), else 0'
      },
      Error_and_Empty_State_Handling: {
        Score: MetricesCalculation_Data.uxReport.checkErrorEmptyStateScore,
        Parameter: '1 if empty/error states provide guidance, else 0'
      },
      Interactive_Feedback: {
        Score: MetricesCalculation_Data.uxReport.checkInteractiveFeedbackScore,
        Parameter: '1 if buttons/links/forms provide visual or textual feedback, else 0'
      },
      Sticky_Navigation: {
        Score: MetricesCalculation_Data.uxReport.checkStickyNavigationScore,
        Parameter: '1 if navigation remains visible when scrolling, else 0'
      },
      Scroll_Depth_Logic: {
        Score: MetricesCalculation_Data.uxReport.checkScrollDepthLogicScore,
        Parameter: '1 if TOC or back-to-top exists for long pages, else 0'
      },
      Loading_Indicators: {
        Score: MetricesCalculation_Data.uxReport.checkLoadingIndicatorsScore,
        Parameter: '1 if visible loading indicators exist, else 0'
      },
      Internal_Linking_Quality: {
        Score: MetricesCalculation_Data.uxReport.checkInternalLinkingQualityScore,
        Parameter: '1 if internal links exist and are relevant, else 0'
      },
      User_Journey_Continuity: {
        Score: MetricesCalculation_Data.uxReport.checkUserJourneyContinuityScore,
        Parameter: '1 if at least one meaningful CTA exists for next steps, else 0'
      },
      Percentage: MetricesCalculation_Data.uxReport.actualPercentage,
    },
    Conversion_and_Lead_Flow: {
      CTA_and_Forms: {
        CTA_Visibility: {
          Score: MetricesCalculation_Data.conversionReport.checkCTAsScore,
          Parameter: "1 if at least one prominent CTA is present, else 0"
        },
        CTA_Clarity: {
          Score: MetricesCalculation_Data.conversionReport.checkCTAClarityScore,
          Parameter: "1 if CTA buttons and links have clear, actionable text, else 0"
        },
        CTA_Contrast: {
          Score: MetricesCalculation_Data.conversionReport.checkCTAContrastScore,
          Parameter: "1 if CTA text has sufficient contrast (≥4.5:1), else 0"
        },
        CTA_Crowding: {
          Score: MetricesCalculation_Data.conversionReport.checkCTACrowdingScore,
          Parameter: "1 if number of CTAs is limited to prevent confusion, else 0"
        },
        CTA_Flow_Alignment: {
          Score: MetricesCalculation_Data.conversionReport.checkCTAFlowAlignmentScore,
          Parameter: "1 if CTAs are placed logically along user flow, else 0"
        },
        Form_Presence: {
          Score: MetricesCalculation_Data.conversionReport.checkFormPresenceScore,
          Parameter: "1 if at least one form is present, else 0"
        },
        Form_Length: {
          Score: MetricesCalculation_Data.conversionReport.checkFormLengthOptimalScore,
          Parameter: "1 if forms are concise, else 0"
        },
        Required_vs_Optional_Fields: {
          Score: MetricesCalculation_Data.conversionReport.checkRequiredVsOptionalFieldsScore,
          Parameter: "1 if required vs optional fields are clearly marked, else 0"
        },
        Inline_Validation: {
          Score: MetricesCalculation_Data.conversionReport.checkInlineValidationScore,
          Parameter: "1 if real-time feedback is provided for user input, else 0"
        },
        Submit_Button_Clarity: {
          Score: MetricesCalculation_Data.conversionReport.checkSubmitButtonClarityScore,
          Parameter: "1 if submit button text is clear and actionable, else 0"
        },
        AutoFocus_Field: {
          Score: MetricesCalculation_Data.conversionReport.checkAutoFocusFieldScore,
          Parameter: "1 if first input field is autofocused, else 0"
        },
        MultiStep_Form_Progress: {
          Score: MetricesCalculation_Data.conversionReport.checkMultiStepFormProgressScore,
          Parameter: "1 if progress indicators exist in multi-step forms, else 0"
        }
      },
      Trust_and_SocialProof: {
        Testimonials: {
          Score: MetricesCalculation_Data.conversionReport.checkTestimonialsScore,
          Parameter: "1 if testimonials are visible, else 0"
        },
        Reviews: {
          Score: MetricesCalculation_Data.conversionReport.checkReviewsVisibleScore,
          Parameter: "1 if reviews/ratings are visible, else 0"
        },
        Trust_Badges: {
          Score: MetricesCalculation_Data.conversionReport.checkTrustBadgesScore,
          Parameter: "1 if trust/security badges are visible, else 0"
        },
        Client_Logos: {
          Score: MetricesCalculation_Data.conversionReport.checkClientLogosScore,
          Parameter: "1 if client logos are visible, else 0"
        },
        Case_Studies_Accessibility: {
          Score: MetricesCalculation_Data.conversionReport.checkCaseStudiesAccessibilityScore,
          Parameter: "1 if case studies are accessible, else 0"
        }
      },
      Lead_Funnel: {
        Exit_Intent_Triggers: {
          Score: MetricesCalculation_Data.conversionReport.checkExitIntentTriggersScore,
          Parameter: "1 if exit-intent triggers exist, else 0"
        },
        Lead_Magnets: {
          Score: MetricesCalculation_Data.conversionReport.checkLeadMagnetsScore,
          Parameter: "1 if lead magnets are offered, else 0"
        },
        Contact_Info_Visibility: {
          Score: MetricesCalculation_Data.conversionReport.checkContactInfoVisibilityScore,
          Parameter: "1 if contact info is visible, else 0"
        },
        Chatbot_Presence: {
          Score: MetricesCalculation_Data.conversionReport.checkChatbotPresenceScore,
          Parameter: "1 if chatbot is present, else 0"
        }
      },
      UX_and_Interaction: {
        Interactive_Elements: {
          Score: MetricesCalculation_Data.conversionReport.checkInteractiveElementsScore,
          Parameter: "1 if interactive elements are present, else 0"
        },
        Personalization: {
          Score: MetricesCalculation_Data.conversionReport.checkPersonalizationScore,
          Parameter: "1 if personalized content exists, else 0"
        },
        Progress_Indicators: {
          Score: MetricesCalculation_Data.conversionReport.checkProgressIndicatorsScore,
          Parameter: "1 if progress indicators are visible, else 0"
        },
        Friendly_Error_Handling: {
          Score: MetricesCalculation_Data.conversionReport.checkFriendlyErrorHandlingScore,
          Parameter: "1 if error messages are clear and helpful, else 0"
        },
        Microcopy_Clarity: {
          Score: MetricesCalculation_Data.conversionReport.checkMicrocopyClarityScore,
          Parameter: "1 if labels/placeholders are clear, else 0"
        },
        Incentives_Displayed: {
          Score: MetricesCalculation_Data.conversionReport.checkIncentivesDisplayedScore,
          Parameter: "1 if offers or incentives are visible, else 0"
        },
        Scarcity_Urgency: {
          Score: MetricesCalculation_Data.conversionReport.checkScarcityUrgencyScore,
          Parameter: "1 if scarcity or urgency cues are present, else 0"
        },
        Smooth_Scrolling: {
          Score: MetricesCalculation_Data.conversionReport.checkSmoothScrollingScore,
          Parameter: "1 if smooth scrolling is implemented, else 0"
        },
        Mobile_CTA_Adaptation: {
          Score: MetricesCalculation_Data.conversionReport.checkMobileCTAAdaptationScore,
          Parameter: "1 if CTAs are mobile-friendly, else 0"
        },
        MultiChannel_FollowUp: {
          Score: MetricesCalculation_Data.conversionReport.checkMultiChannelFollowUpScore,
          Parameter: "1 if multi-channel follow-up options exist, else 0"
        }
      },
      Percentage: MetricesCalculation_Data.conversionReport.actualPercentage,
    },
    AIO_Readiness: {
      Technical_AI_Foundation: {
        Structured_Data: {
          Score: MetricesCalculation_Data.aioReport.structuredData,
          Parameter: "1 if valid structured data (schema.org/JSON-LD) is implemented, else 0"
        },
        Metadata_Complete: {
          Score: MetricesCalculation_Data.aioReport.metadataComplete,
          Parameter: "1 if metadata (title, description, OG/Twitter tags) is complete, else 0"
        },
        Fast_Page_Load: {
          Score: MetricesCalculation_Data.aioReport.fastPageLoad,
          Parameter: "1 if page load time is under 2s, else 0"
        },
        API_Data_Access: {
          Score: MetricesCalculation_Data.aioReport.apiDataAccess,
          Parameter: "1 if secure and documented API endpoints exist, else 0"
        },
        Dynamic_Content_Available: {
          Score: MetricesCalculation_Data.aioReport.dynamicContentAvailable,
          Parameter: "1 if dynamic or interactive content is present, else 0"
        },
        Multilingual_Support: {
          Score: MetricesCalculation_Data.aioReport.multilingualSupport,
          Parameter: "1 if hreflang and multilingual versions exist, else 0"
        }
      },
      Content_AI_Optimization: {
        Content_NLP_Friendly: {
          Score: MetricesCalculation_Data.aioReport.contentNLPFriendly,
          Parameter: "1 if content uses natural, entity-rich language and NLP-friendly structure, else 0"
        },
        Keywords_Entities_Annotated: {
          Score: MetricesCalculation_Data.aioReport.keywordsEntitiesAnnotated,
          Parameter: "1 if entities and keywords are annotated with schema or metadata, else 0"
        },
        Content_Updated_Regularly: {
          Score: MetricesCalculation_Data.aioReport.contentUpdatedRegularly,
          Parameter: "1 if website content is updated frequently, else 0"
        },
        Internal_Linking_AI_Friendly: {
          Score: MetricesCalculation_Data.aioReport.internalLinkingAIFriendly,
          Parameter: "1 if internal links are structured and contextually relevant, else 0"
        },
        Duplicate_Content_Detection_Ready: {
          Score: MetricesCalculation_Data.aioReport.duplicateContentDetectionReady,
          Parameter: "1 if duplicate content detection mechanisms are active, else 0"
        }
      },
      Data_Intelligence_Integration: {
        Behavior_Tracking_Implemented: {
          Score: MetricesCalculation_Data.aioReport.behaviorTrackingImplemented,
          Parameter: "1 if user behavior tracking is implemented (e.g., analytics), else 0"
        },
        Segmentation_Profiling_Ready: {
          Score: MetricesCalculation_Data.aioReport.segmentationProfilingReady,
          Parameter: "1 if audience segmentation and profiling are in place, else 0"
        },
        Event_Goal_Tracking_Integrated: {
          Score: MetricesCalculation_Data.aioReport.eventGoalTrackingIntegrated,
          Parameter: "1 if event or goal tracking is active, else 0"
        },
        AB_Testing_Ready: {
          Score: MetricesCalculation_Data.aioReport.abTestingReady,
          Parameter: "1 if A/B testing setup exists, else 0"
        },
        User_Feedback_Loops_Present: {
          Score: MetricesCalculation_Data.aioReport.userFeedbackLoopsPresent,
          Parameter: "1 if feedback collection systems (surveys, reviews) are active, else 0"
        }
      },
      AI_Content_Delivery: {
        Dynamic_Personalization: {
          Score: MetricesCalculation_Data.aioReport.dynamicContentAvailable,
          Parameter: "1 if dynamic content adjusts based on user segments or behavior, else 0"
        },
        AI_Content_Distribution: {
          Score: MetricesCalculation_Data.aioReport.apiDataAccess,
          Parameter: "1 if content delivery through APIs or feeds is available, else 0"
        },
        AI_Friendly_Structure: {
          Score: MetricesCalculation_Data.aioReport.internalLinkingAIFriendly,
          Parameter: "1 if website structure aids AI comprehension and crawling, else 0"
        }
      },
      Percentage: MetricesCalculation_Data.aioReport.actualPercentage,
    }
  }
return metrices;

};
