# Software Requirements Specification (SRS)
## Google reCAPTCHA v2 Integration — DealerPulse (SiteAudit Professional)

**Document Version:** 1.0.0  
**Date:** 2026-03-27  
**Project:** DealerPulse — Website Health Audit Tool  
**Feature:** Google reCAPTCHA v2 on Analyze Button  
**Repository:** https://github.com/DheerajSaini0001/DealerPulse  
**Prepared For:** AI-assisted implementation (no human interaction required)

---

## 1. PURPOSE

This SRS defines the complete specification for integrating Google reCAPTCHA v2 ("I'm not a robot" checkbox) into the DealerPulse homepage analyze flow. The document is structured for autonomous AI-driven implementation without human intervention.

---

## 2. SCOPE

### 2.1 In Scope
- Frontend: reCAPTCHA widget rendered on Analyze button click (Homepage — `Frontend/src/`)
- Frontend: Token capture and forwarding to backend with the audit request
- Backend: reCAPTCHA token verification via Google Secret Key before processing audit
- Error handling for failed/expired CAPTCHA on both client and server

### 2.2 Out of Scope
- Bulk Audit page reCAPTCHA (separate feature)
- reCAPTCHA v3 (invisible) integration
- Admin bypass mechanisms
- Changes to audit logic, scoring, or PDF generation

---

## 3. SYSTEM OVERVIEW

### 3.1 Current Flow (Before Integration)
```
User enters URL → Clicks "Analyze" → Request sent to backend → Audit results returned
```

### 3.2 New Flow (After Integration)
```
User enters URL
  → Clicks "Analyze"
    → reCAPTCHA widget appears (modal/inline overlay)
      → User completes CAPTCHA
        → Frontend receives reCAPTCHA token
          → Frontend sends { url, device, auditType, recaptchaToken } to backend
            → Backend verifies token with Google API
              → If valid: run audit → return results
              → If invalid: return 403 error → Frontend shows error message
```

---

## 4. CREDENTIALS & CONFIGURATION

| Parameter | Value |
|-----------|-------|
| **reCAPTCHA Type** | v2 Checkbox ("I'm not a robot") |
| **Site Key** | `6LdZC5osAAAAAP6_ZyvSAeH8tnRG9xrU60uHwjus` |
| **Secret Key** | `6LdZC5osAAAAAGzO_O70TzO7lmkRAsSmtuCaU3ap` |
| **Google Verify URL** | `https://www.google.com/recaptcha/api/verify` |
| **Script CDN** | `https://www.google.com/recaptcha/api.js` |

> **SECURITY NOTE:** The Secret Key must ONLY be stored in `Backend/.env` as `RECAPTCHA_SECRET_KEY`. Never expose it in frontend code or commit it to source control.

---

## 5. FRONTEND REQUIREMENTS

### 5.1 File: `Frontend/.env`

Add the following environment variable:
```env
VITE_RECAPTCHA_SITE_KEY=6LdZC5osAAAAAP6_ZyvSAeH8tnRG9xrU60uHwjus
```

### 5.2 Install Dependency

```bash
cd Frontend
npm install react-google-recaptcha
```

### 5.3 File: `Frontend/index.html`

No changes required — `react-google-recaptcha` loads the script automatically via the component.

### 5.4 State Management in Homepage Component

Locate the homepage component (likely `Frontend/src/Pages/Home.jsx` or `Frontend/src/App.jsx`).

#### 5.4.1 Import Addition
```jsx
import ReCAPTCHA from 'react-google-recaptcha';
import { useRef, useState } from 'react';
```

#### 5.4.2 New State Variables
```jsx
const recaptchaRef = useRef(null);
const [showCaptcha, setShowCaptcha] = useState(false);
const [captchaToken, setCaptchaToken] = useState(null);
const [captchaError, setCaptchaError] = useState(false);
```

### 5.5 Analyze Button Click Handler Logic

Replace the existing `handleAnalyze` (or equivalent submit function) with the following logic:

```jsx
const handleAnalyzeClick = () => {
  // Validate URL first
  if (!url || !isValidUrl(url)) {
    setError('Please enter a valid URL');
    return;
  }
  // Show CAPTCHA overlay instead of immediately submitting
  setShowCaptcha(true);
  setCaptchaToken(null);
  setCaptchaError(false);
};

const handleCaptchaChange = (token) => {
  if (token) {
    setCaptchaToken(token);
    setCaptchaError(false);
    // Automatically proceed once CAPTCHA is completed
    handleSubmitWithToken(token);
  }
};

const handleCaptchaExpired = () => {
  setCaptchaToken(null);
  setCaptchaError(true);
};

const handleSubmitWithToken = async (token) => {
  setShowCaptcha(false);
  setIsLoading(true);

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url,
        device: selectedDevice,       // 'desktop' | 'mobile'
        auditType: selectedAuditType, // 'full' | 'seo' | etc.
        recaptchaToken: token,
      }),
    });

    if (response.status === 403) {
      const errData = await response.json();
      setError(errData.message || 'CAPTCHA verification failed. Please try again.');
      recaptchaRef.current?.reset();
      return;
    }

    const data = await response.json();
    // existing logic to handle audit result...
    setAuditResult(data);
  } catch (err) {
    setError('Something went wrong. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

### 5.6 CAPTCHA UI Component (Modal Overlay)

Render this **conditionally** when `showCaptcha === true`, placed just before the closing `</div>` of the main page wrapper:

```jsx
{showCaptcha && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
      <h3 className="text-lg font-semibold text-gray-800">Verify you're human</h3>
      <p className="text-sm text-gray-500 text-center">
        Complete the CAPTCHA to start your website audit.
      </p>

      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        onChange={handleCaptchaChange}
        onExpired={handleCaptchaExpired}
      />

      {captchaError && (
        <p className="text-sm text-red-500">
          CAPTCHA expired. Please verify again.
        </p>
      )}

      <button
        onClick={() => setShowCaptcha(false)}
        className="text-sm text-gray-400 hover:text-gray-600 underline mt-1"
      >
        Cancel
      </button>
    </div>
  </div>
)}
```

### 5.7 Analyze Button JSX Update

Update the Analyze button to call `handleAnalyzeClick` instead of the existing submit handler:

```jsx
<button
  onClick={handleAnalyzeClick}
  disabled={isLoading}
  className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
>
  {isLoading ? 'Analyzing...' : 'Analyze →'}
</button>
```

---

## 6. BACKEND REQUIREMENTS

### 6.1 File: `Backend/.env`

Add the following line:
```env
RECAPTCHA_SECRET_KEY=6LdZC5osAAAAAGzO_O70TzO7lmkRAsSmtuCaU3ap
```

### 6.2 Install Dependency

```bash
cd Backend
npm install axios
```
> (If `axios` is already installed, skip this step. Alternatively use Node's built-in `fetch` in Node 18+.)

### 6.3 New File: `Backend/middleware/verifyCaptcha.js`

Create this file as reusable middleware:

```javascript
const axios = require('axios');

/**
 * Middleware: verifyRecaptcha
 * Validates the reCAPTCHA v2 token sent in req.body.recaptchaToken
 * Rejects request with 403 if token is missing or invalid.
 */
const verifyRecaptcha = async (req, res, next) => {
  const token = req.body?.recaptchaToken;

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'CAPTCHA token is required. Please complete the CAPTCHA.',
    });
  }

  try {
    const verifyURL = 'https://www.google.com/recaptcha/api/siteverify';
    const params = new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: token,
      remoteip: req.ip, // optional but recommended
    });

    const { data } = await axios.post(verifyURL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!data.success) {
      return res.status(403).json({
        success: false,
        message: 'CAPTCHA verification failed. Please try again.',
        errorCodes: data['error-codes'],
      });
    }

    // Token valid — proceed to audit handler
    next();
  } catch (err) {
    console.error('[reCAPTCHA] Verification error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'CAPTCHA service unavailable. Please try again later.',
    });
  }
};

module.exports = verifyRecaptcha;
```

### 6.4 Apply Middleware to Audit Route

Locate the audit route file (likely `Backend/controllers/auditController.js` or `Backend/Server.js`).

Import and apply the middleware:

```javascript
const verifyRecaptcha = require('./middleware/verifyCaptcha');

// Apply BEFORE the audit handler on the POST /api/audit route
router.post('/api/audit', verifyRecaptcha, auditHandler);
```

> **NOTE:** The middleware must be placed BEFORE the audit logic handler in the route chain. The `recaptchaToken` field in `req.body` is consumed by the middleware — the audit handler does not need to process it.

---

## 7. DATA CONTRACT

### 7.1 Request Body (Frontend → Backend)

```json
{
  "url": "https://example.com",
  "device": "desktop",
  "auditType": "full",
  "recaptchaToken": "<google_recaptcha_v2_token>"
}
```

### 7.2 Error Response — Invalid CAPTCHA (Backend → Frontend)

```json
{
  "success": false,
  "message": "CAPTCHA verification failed. Please try again.",
  "errorCodes": ["invalid-input-response"]
}
```

**HTTP Status:** `403 Forbidden`

### 7.3 Error Response — Missing CAPTCHA Token

```json
{
  "success": false,
  "message": "CAPTCHA token is required. Please complete the CAPTCHA."
}
```

**HTTP Status:** `403 Forbidden`

### 7.4 Success Response (unchanged)

The audit result JSON remains unchanged — CAPTCHA adds no fields to the success response.

---

## 8. ERROR HANDLING MATRIX

| Scenario | Frontend Behavior | Backend Response |
|----------|-------------------|-----------------|
| User clicks Analyze without URL | Show inline URL validation error | Request never sent |
| User closes CAPTCHA modal | Modal closes, no request sent | N/A |
| CAPTCHA token expires before submit | Show "CAPTCHA expired" message, reset widget | N/A |
| Backend CAPTCHA verify fails | Show error toast/message, reset CAPTCHA | 403 + JSON error |
| Google reCAPTCHA API is down | Show "service unavailable" message | 500 + JSON error |
| Valid CAPTCHA, valid URL | Hide modal, show loading, display results | 200 + audit data |

---

## 9. SECURITY REQUIREMENTS

| Requirement | Implementation |
|-------------|---------------|
| Secret Key never exposed to client | Store only in `Backend/.env`, never in frontend |
| Token single-use enforcement | Google's API rejects reused tokens automatically |
| IP forwarding to Google | Pass `req.ip` in verification call for fraud signals |
| CAPTCHA bypass prevention | Middleware applied at route level before any audit logic |
| `.env` not committed | Ensure `Backend/.env` is listed in `.gitignore` |

---

## 10. IMPLEMENTATION CHECKLIST (AI Execution Order)

```
STEP 1 — Frontend
  [ ] Install: cd Frontend && npm install react-google-recaptcha
  [ ] Add VITE_RECAPTCHA_SITE_KEY to Frontend/.env
  [ ] Import ReCAPTCHA, useRef, useState in Homepage component
  [ ] Add state variables: showCaptcha, captchaToken, captchaError, recaptchaRef
  [ ] Replace Analyze onClick with handleAnalyzeClick
  [ ] Add handleCaptchaChange, handleCaptchaExpired, handleSubmitWithToken functions
  [ ] Add CAPTCHA modal overlay JSX (conditionally rendered)
  [ ] Pass recaptchaToken in fetch body to backend

STEP 2 — Backend
  [ ] Add RECAPTCHA_SECRET_KEY to Backend/.env
  [ ] Install axios if not present: cd Backend && npm install axios
  [ ] Create Backend/middleware/verifyCaptcha.js
  [ ] Import verifyRecaptcha in route/controller file
  [ ] Apply verifyRecaptcha middleware to POST /api/audit route

STEP 3 — Validation
  [ ] Test: CAPTCHA appears on Analyze button click
  [ ] Test: Submitting without CAPTCHA → 403 error shown
  [ ] Test: Valid CAPTCHA completion triggers audit automatically
  [ ] Test: Expired token shows reset message
  [ ] Test: Backend rejects request with no recaptchaToken field
```

---

## 11. DEPENDENCIES

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| `react-google-recaptcha` | ^3.1.0 | reCAPTCHA v2 React component |

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | ^1.x | HTTP call to Google verify endpoint |

---

## 12. ASSUMPTIONS

1. The homepage component uses React functional component with hooks.
2. The backend uses Express.js with `express.json()` middleware already applied (so `req.body` is parsed).
3. The audit endpoint is `POST /api/audit` — adjust route path if different.
4. The frontend uses Vite (env variables prefixed with `VITE_`).
5. Node.js v18+ is used on the backend (native `fetch` available as alternative to axios).
6. The existing `isLoading` and `setError` state already exist in the homepage component.

---

*End of SRS — reCAPTCHA Integration v1.0.0*
