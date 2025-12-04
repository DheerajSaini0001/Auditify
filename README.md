Page Speed SLT
A comprehensive web performance and SEO audit tool designed to analyze websites for technical performance, accessibility, SEO, security, and AI readiness. This tool provides detailed insights and actionable recommendations to improve website quality and user experience.

🚀 Key Features
Technical Performance Audit: Analyzes Core Web Vitals (LCP, CLS, INP), server response times, and resource optimization (images, scripts, caching).
On-Page SEO Analysis: Checks for meta tags, heading structure, keyword usage, and internal linking to ensure search engine visibility.
Accessibility Checks: Validates compliance with accessibility standards (WCAG) using axe-core, identifying issues like contrast ratios and missing ARIA labels.
Security & Compliance: Evaluates SSL/TLS configuration, security headers (CSP, HSTS), and data privacy practices.
UX & Content Structure: Assesses readability, navigation depth, tap targets, and content organization for optimal user experience.
AIO (AI Optimization) Readiness: [New] Evaluates how well a site is optimized for AI crawlers and Large Language Models (LLMs), including structured data, NLP-friendly content, and API accessibility. Now features an AIO Compatibility Badge (Gold/Silver/Bronze).
Conversion & Lead Flow: Analyzes forms, CTAs, and trust signals to improve conversion rates.
PDF Reporting: Generates downloadable PDF reports of the audit results.
🛠️ Tech Stack
Frontend
React (Vite)
Tailwind CSS (Styling)
Lucide React (Icons)
Recharts (Data Visualization)
Framer Motion (Animations)
jsPDF (Report Generation)
Backend
Node.js & Express
MongoDB (Mongoose) - Data Storage
Puppeteer - Headless browser for scraping and performance metrics
Cheerio - HTML parsing and analysis
Axe-core - Accessibility engine
JSDOM - DOM manipulation
📦 Installation & Setup
Prerequisites
Node.js (v16+ recommended)
MongoDB (Local or Atlas connection string)
1. Clone the Repository
bash
git clone https://github.com/DheerajSaini0001/Page_Speed_SLT.git
cd Page_Speed_SLT
2. Backend Setup
Navigate to the backend directory and install dependencies:

bash
cd Backend
npm install
Create a .env file in the Backend directory (if required) and configure your MongoDB URI and port. Start the backend server:

bash
npm run dev
The server typically runs on http://localhost:5000 (check console output).

3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:

bash
cd Frontend
npm install
Start the frontend development server:

bash
npm run dev
The frontend will typically run on http://localhost:5173.

🚦 Usage
Open the frontend application in your browser.
Enter the URL of the website you want to audit.
Select the Device Type (Desktop/Mobile).
Click "Analyze" to start the audit process.
Wait for the analysis to complete. The tool will display a comprehensive dashboard with scores and detailed metrics for each category.
Navigate through the tabs (Technical, SEO, AIO, etc.) to view specific insights.
Download the full report as a PDF if needed.
📂 Project Structure
Backend/: Contains the Node.js/Express server, API routes, and metric calculation services.
metricServices/: Logic for individual audit categories (e.g., 
aioReadiness.js
, technicalMetrics.js).
workers/: Worker threads for handling heavy audit tasks (auditWorker.js).
models/: Mongoose schemas (
SiteReport.js
).
Frontend/: Contains the React application.
src/Pages/: Individual report pages (
Technical_Performance.jsx
, 
AIO.jsx
, etc.).
src/Component/: Reusable UI components (
MetricCard
, CircularProgress).
src/context/: State management (DataContext).
🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
