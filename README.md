Site Audit Tool

A comprehensive Web Performance & SEO Audit Tool designed to analyze websites for technical performance, accessibility, SEO, security, UX, conversion flow, and AI optimization readiness.

This tool provides detailed insights, scoring, and actionable recommendations to improve overall website quality, user experience, and search engine visibility.

🚀 Key Features

⚡ Technical Performance Audit

Evaluates Core Web Vitals (LCP, CLS, INP), server response time, caching, resource size, compression, and loading strategies.

📈 On-Page SEO Analysis

Checks meta tags, heading structure, internal linking, content hierarchy, robots rules, alt attributes, and keyword optimization.

♿ Accessibility Audit

Uses axe-core to validate WCAG compliance, contrast issues, missing ARIA labels, keyboard navigation support, and semantic HTML.

🔐 Security & Compliance

Evaluates SSL/TLS status, security headers (CSP, HSTS, X-XSS-Protection), cookie security, and privacy policy availability.

🎨 UX & Content Structure

Assesses readability, content spacing, navigation depth, mobile tap targets, and content structure for improved usability.

🤖 AIO (AI Optimization) Readiness

Evaluates AI crawler-friendliness, structured data, NLP-ready content, JSON-LD, internal content relationships, and API discoverability.

Includes AIO Compatibility Badge: Gold / Silver / Bronze

🎯 Conversion & Lead Flow

Analyzes CTA visibility, form UX, trust signals, social proof, and friction points in conversion flow.

📄 PDF Reporting

Generate downloadable audit reports using jsPDF.

🛠️ Tech Stack
Frontend

React (Vite)

Tailwind CSS

Lucide React

Recharts

Framer Motion

jsPDF

Backend

Node.js & Express

MongoDB (Mongoose)

Puppeteer

Cheerio

Axe-core

JSDOM

📦 Installation & Setup
Prerequisites

Node.js (v16+)

MongoDB (Local or Atlas)

1. Clone the Repository
git clone https://github.com/DheerajSaini0001/Page_Speed_SLT.git
cd Page_Speed_SLT

2. Backend Setup
cd Backend
npm install


Create a .env file with:

MONGO_URI=your_connection_string
PORT=5000


Start the backend:

npm run dev


Backend runs at: http://localhost:5000

3. Frontend Setup
cd ../Frontend
npm install
npm run dev


Frontend runs at: http://localhost:5173

🚦 Usage

Open the frontend interface.

Enter the website URL.

Select Desktop or Mobile analysis.

Click Analyze.

View results in categorized dashboards.

Export report as PDF if needed.

📂 Project Structure
Page_Speed_SLT/
├── Backend/
│   ├── metricServices/
│   │   ├── aioReadiness.js
│   │   ├── technicalMetrics.js
│   ├── workers/
│   │   └── auditWorker.js
│   ├── models/
│   │   └── SiteReport.js
│   └── ...
└── Frontend/
    ├── src/Pages/
    │   ├── Technical_Performance.jsx
    │   ├── AIO.jsx
    ├── src/Components/
    │   ├── MetricCard.jsx
    │   ├── CircularProgress.jsx
    ├── src/context/
    │   └── DataContext.js

🤝 Contributing

Contributions are welcome!
Please fork this repository and submit a Pull Request if you’d like to help improve the project.
