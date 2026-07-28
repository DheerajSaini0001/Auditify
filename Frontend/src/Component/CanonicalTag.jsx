import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEO_CONFIGS = [
  {
    path: '/',
    exact: true,
    title: 'Site Audit: Top AI Engine for SEO & Web Performance',
    description: 'Site Audit is a high-speed website auditing engine. Gain comprehensive insights on SEO, security, AIO readiness, and technical performance for free now.'
  },
  {
    path: '/login',
    exact: true,
    title: 'Login to Site Audit - Access Your SEO Dashboard Now',
    description: 'Log in to your Site Audit account to view saved report history, track multi-page web audits, monitor security compliance, and optimize your site SEO today.'
  },
  {
    path: '/register',
    exact: true,
    title: 'Create Your Site Audit Account - Start Free Auditing',
    description: 'Sign up for a free Site Audit account today. Instantly scan your web application for SEO errors, security vulnerabilities, and page performance issues easily.'
  },
  {
    path: '/verify-otp',
    exact: true,
    title: 'Verify Account OTP Code - Secure Sign In Site Audit',
    description: 'Enter your email verification code to complete registration on Site Audit. Confirm your account details to unlock comprehensive website auditing tools online.'
  },
  {
    path: '/forgot-password',
    exact: true,
    title: 'Reset Your Password - Recover Your Site Audit Login',
    description: 'Forgot your Site Audit account password? Enter your registered email address to receive a secure password reset link and recover your dashboard access now.'
  },
  {
    path: '/reset-password',
    exact: true,
    title: 'Update Account Password - Site Audit Secure Recovery',
    description: 'Choose a new strong password for your Site Audit account. Securely restore your account credentials and resume managing your automated website audits today.'
  },
  {
    path: '/about',
    exact: true,
    title: 'About Site Audit Engine - Next-Gen Web Intelligence',
    description: 'Learn about Site Audit, our mission, and our advanced auditing platform designed to help developers, agencies, and marketers scale web performance & SEO today.'
  },
  {
    path: '/services',
    exact: true,
    title: 'Site Audit Services - SEO, AIO & Security Auditing',
    description: 'Explore our web auditing services including deep SEO analysis, AI search engine optimization, technical performance checks, and security compliance rules.'
  },
  {
    path: '/contact',
    exact: true,
    title: 'Contact Site Audit - Technical Support & Inquiries',
    description: 'Get in touch with the Site Audit engineering and customer support team. Reach out for technical assistance, custom enterprise quotes, or general inquiries.'
  },
  {
    path: '/documentation',
    exact: true,
    title: 'Site Audit Docs - Complete API & Auditing Guide Book',
    description: 'Read official Site Audit documentation. Discover how to run single and bulk web audits, integrate our REST API, and interpret technical SEO parameters online.'
  },
  {
    path: '/help',
    exact: true,
    title: 'Help Center - Frequently Asked Site Audit Questions',
    description: 'Find quick solutions, troubleshoot common audit issues, and browse FAQs about Site Audit scoring logic, report exporting, and account management tools now.'
  },
  {
    path: '/privacy',
    exact: true,
    title: 'Privacy Policy - Site Audit Data & User Protection',
    description: 'Read the Site Audit Privacy Policy to understand how we collect, handle, and safeguard your personal information and scanned website auditing data securely.'
  },
  {
    path: '/terms',
    exact: true,
    title: 'Terms of Service Guide - Site Audit Rules & Policy',
    description: 'Review our official Terms of Service. Understand the legal guidelines, usage restrictions, and service level agreements governing the Site Audit tool online.'
  },
  {
    path: '/cookies',
    exact: true,
    title: 'Cookie Policy Guide - Site Audit Tracking & Storage',
    description: 'Understand how Site Audit uses browser cookies, local storage sessions, and telemetry tracking technologies to deliver seamless website audit services now.'
  },
  {
    path: '/do-not-sell',
    exact: true,
    title: 'Do Not Sell Info Page - Site Audit Privacy Options',
    description: 'Exercise your privacy rights under state laws. Submit a request to opt out of the sale or sharing of your personal data processed by the Site Audit app online.'
  },
  {
    path: '/dashboard',
    exact: true,
    title: 'User Audit Dashboard - Manage Your Website Scans Now',
    description: 'Access your personal Site Audit dashboard to launch new site audits, review past audit scores, compare web performance stats, and download PDF reports online.'
  },
  {
    path: '/dashboard/add-website',
    exact: true,
    title: 'Add New Website URL - Run Instant Audit Site Audit',
    description: 'Submit a new domain URL to launch a comprehensive multi-parameter audit. Test SEO optimization, page speed, mobile usability, and security in real time today.'
  },
  {
    path: '/audit-history',
    exact: true,
    title: 'Audit History Log - Review Past Scans & SEO Reports',
    description: 'Browse your complete history of website audit scans. Compare historical scores, track improvements over time, and re-run audits with a single click today.'
  },
  {
    path: '/audit-summary',
    exact: true,
    title: 'Audit Summary - Full Multi-Page SEO Audit Scan Data',
    description: 'View your comprehensive website audit summary. Inspect overall health scores, priority fix recommendations, and page-by-page SEO performance metrics today.'
  },
  {
    path: '/technical-performance',
    prefix: true,
    title: 'Technical Performance Report - Speed & Core Vitals',
    description: 'Analyze server response times, Core Web Vitals, page weight, script execution delays, and caching policies with the Site Audit Technical Performance engine.'
  },
  {
    path: '/on-page-seo',
    prefix: true,
    title: 'On-Page SEO Report - Titles, Metas & Content Check',
    description: 'Audit meta tags, canonical links, header hierarchy, keyword density, and internal linking structures using our in-depth Site Audit On-Page SEO analyzer tool.'
  },
  {
    path: '/accessibility',
    prefix: true,
    title: 'Accessibility Audit Report - WCAG & ARIA Compliance',
    description: 'Ensure full compliance with WCAG 2.1 standards. Audit color contrast ratios, screen reader ARIA attributes, keyboard navigation, and landmark regions now.'
  },
  {
    path: '/ux-content-structure',
    prefix: true,
    title: 'UX & Content Audit - Layout & Readability Analysis',
    description: 'Evaluate website layout usability, content readability, visual hierarchy, mobile viewport responsiveness, and navigation design with Site Audit UX tool online.'
  },
  {
    path: '/security-compliance',
    prefix: true,
    title: 'Security Audit Report - SSL, CSP & Header Shielding',
    description: 'Inspect website security vulnerabilities, HTTPS setup, Content Security Policies, security header configurations, and cookie flags on Site Audit platform.'
  },
  {
    path: '/conversion-lead-flow',
    prefix: true,
    title: 'Conversion Audit Report - Forms & Funnel Analytics',
    description: 'Optimize call-to-action buttons, lead capture form usability, conversion funnel friction, and trust badges with the Site Audit Lead Flow analyzer tool.'
  },
  {
    path: '/aio',
    prefix: true,
    title: 'AIO Readiness Report - AI Engine Optimization Tool',
    description: 'Prepare your web content for AI search engines like ChatGPT and Perplexity. Audit JSON-LD structured schema data, entity clarity, and topical depth today.'
  },
  {
    path: '/aeo',
    prefix: true,
    title: 'AEO Audit Report - Answer Engine Optimization Scan',
    description: 'Optimize site content for conversational AI answers and voice search assistants. Audit question-based headings, direct answers, and featured snippets online.'
  },
  {
    path: '/report',
    prefix: true,
    title: 'Audit Summary - Full Multi-Page SEO Audit Scan Data',
    description: 'View your comprehensive website audit summary. Inspect overall health scores, priority fix recommendations, and page-by-page SEO performance metrics today.'
  },
  {
    path: '/admin/setup',
    exact: true,
    title: 'Admin System Config - Site Audit Platform Controls',
    description: 'Configure system-level environment variables, API integration keys, crawler concurrency limits, and database connection settings for Site Audit engine.'
  },
  {
    path: '/admin',
    prefix: true,
    title: 'Admin Dashboard - Site Audit System Operations Control',
    description: 'Manage system users, monitor active background audit queues, review system health stats, and configure global platform settings on Site Audit Admin portal.'
  }
];

const DEFAULT_SEO = {
  title: '404 Page Not Found - Return to Site Audit Engine Now',
  description: 'The page you are looking for could not be found on Site Audit. Please check the web URL address or navigate back to the main homepage to run an audit now.'
};

const updateMetaTag = (selector, attribute, value) => {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [attrName, attrVal] = selector.replace('meta[', '').replace(']', '').split('=');
    el.setAttribute(attrName, attrVal.replace(/"/g, ''));
    document.head.appendChild(el);
  }
  el.setAttribute(attribute, value);
};

const CanonicalTag = () => {
  const location = useLocation();

  useEffect(() => {
    const baseUrl = 'https://siteaudit.sltechsoft.com';
    const canonicalUrl = `${baseUrl}${location.pathname}`;

    // 1. Update Self-Referential Canonical Tag
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);

    // 2. Find matching SEO Config
    const path = location.pathname;
    let config = SEO_CONFIGS.find(c => c.exact && c.path === path);
    if (!config) {
      config = SEO_CONFIGS.find(c => c.prefix && path.startsWith(c.path));
    }
    if (!config) {
      config = DEFAULT_SEO;
    }

    // 3. Update document title
    document.title = config.title;

    // 4. Update Meta Description and Social OpenGraph / Twitter cards
    updateMetaTag('meta[name="description"]', 'content', config.description);
    updateMetaTag('meta[property="og:title"]', 'content', config.title);
    updateMetaTag('meta[property="og:description"]', 'content', config.description);
    updateMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    updateMetaTag('meta[name="twitter:title"]', 'content', config.title);
    updateMetaTag('meta[name="twitter:description"]', 'content', config.description);

  }, [location.pathname]);

  return null;
};

export default CanonicalTag;
