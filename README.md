# 🚀 DealerPulse (Website Health & SEO Audit Engine)

A powerful, production-ready MERN Stack application designed to perform deep technical audits of websites. It evaluates **Technical Performance, SEO, Accessibility, Security, UX, AIO Readiness, and Conversion Flow** using advanced scraping and browser automation tools.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🌟 Key Features

### 🔍 Comprehensive Audits (7 Pillars)
1.  **⚡ Technical Performance**: Core Web Vitals (LCP, CLS, INP), Server Response Time, Compression (Gzip/Brotli), Caching logic.
2.  **📈 On-Page SEO**: Meta tags, Heading Hierarchy (H1-H6), Keyword Density, Schema Markup, Robot Rules, Alt Attributes.
3.  **♿ Accessibility**: WCAG 2.1 compliance using `axe-core` (Contrast, ARIA, Keyboard Nav, Semantic HTML).
4.  **🔐 Security & Compliance**: SSL/TLS verification, Security Headers (CSP, HSTS, XSS), Cookie Policies, Vulnerability Scanning.
5.  **🎨 UX & Content Structure**: Readability scores, Tap Targets, Navigation Depth, Layout Stability, Mobile Responsiveness.
6.  **🤖 AIO (AI Optimization) Readiness**: Structured Data for AI Crawlers, NLP Compatibility, Entity density, API availability.
7.  **🎯 Conversion & Lead Flow**: Call-to-Action (CTA) analysis, Form UX, Trust Signals, Social Proof verification.

### 🛡️ Security Features
*   **Rate Limiting**: Protects against DoS attacks (Default: 5 scans per 15 mins per IP).
*   **SSRF Protection**: Blocks internal/private network access.
*   **Secure Headers**: Implemented using `Helmet` for robust HTTP security.
*   **Input Validation**: Strict URL parsing and sanitization.

### 💻 User Experience
*   **Real-time Granular Loading**: Dynamic status updates during audits (e.g., "Verifying SSL...", "Measuring LCP...").
*   **PDF Reporting**: One-click professional PDF report generation with scores and branding.
*   **Responsive Design**: Fully optimized for Desktop and Mobile viewing.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React 19 (Vite)
*   **Styling**: Tailwind CSS 4
*   **Icons**: Lucide React
*   **Animations**: Framer Motion
*   **Charts**: Recharts
*   **Report**: jsPDF & AutoTable

### Backend
*   **Runtime**: Node.js & Express
*   **Database**: MongoDB (Mongoose)
*   **Automation**: Puppeteer (with Stealth Plugin)
*   **Security**: Helmet, Express Rate Limit
*   **Analysis**: Cheerio, JSDOM, Axe-Core, Mozilla Readability

---

## � Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB (Local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/DheerajSaini0001/DealerPulse.git
cd DealerPulse
```

### 2. Backend Setup
Navigate to the backend folder and install dependencies:
```bash
cd Backend
npm install
```

**Configure Environment Variables:**
Create a `.env` file in the `Backend` directory:
```env
MONGO_URI=your_mongodb_connection_string
PORT=2000
```

Start the Backend:
```bash
npm run dev
# Server runs on: http://localhost:2000
```

### 3. Frontend Setup
Navigate to the frontend folder and install dependencies:
```bash
cd ../Frontend
npm install
```

**Configure Environment Variables:**
Create a `.env` file in the `Frontend` directory:
```env
VITE_API_URL=http://localhost:2000
```

Start the Frontend:
```bash
npm run dev
# Client runs on: http://localhost:5173
```

---

## 🚦 Usage Guide

1.  Open the application (`http://localhost:5173`).
2.  Enter a valid website URL (e.g., `https://example.com`) and select **Desktop/Mobile**.
3.  Click **Analyze**.
4.  Observe real-time status updates on the dashboard.
5.  Click on any metric card (e.g., *Technical Performance*) to view deep insights.
6.  Click **Download PDF** to export the full report.

---

## 📂 Project Structure

```bash
DealerPulse/
├── Backend/                 # Express Server & Workers
│   ├── controllers/         # Audit & Report Logic
│   ├── models/              # MongoDB Schemas (SiteReport)
│   ├── workers/             # Heavy Duty Scrapers (Puppeteer/Axe)
│   ├── metricServices/      # Logic for 7 Audit Pillars
│   └── Server.js            # Entry Point
│
└── Frontend/                # React Vite App
    ├── src/
    │   ├── Pages/           # Metric Detail Pages
    │   ├── Component/       # UI Components (Sidebar, Charts)
    │   ├── context/         # Global State (Context API)
    │   └── utils/           # Helpers (PDF Generator)
```

---

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a Pull Request.

---

## 📜 License
This project is licensed under the MIT License.
