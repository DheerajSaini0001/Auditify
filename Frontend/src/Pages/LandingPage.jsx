import React, { useState, useEffect, useContext } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import HeroSection from '../Component/Landing/HeroSection';
import MetricsBanner from '../Component/Landing/MetricsBanner';
import AuditPillarsSection from '../Component/Landing/AuditPillarsSection';

const LandingPage = () => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === 'dark';
    const { fetchData, loading } = useData();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    // Page scroll progress bar
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const handleAuditSubmit = React.useCallback(async (url, device, report = "All", captchaAnswer = null, captchaId = null) => {
        if (loading) return;
        setError(null);
        
        const result = await fetchData(url, device, report, captchaAnswer, captchaId);
        if (result?.success) {
            navigate(`/report/${result.id}`);
        } else {
            setError(result?.error || "Audit failed. Please try again.");
        }
    }, [fetchData, navigate, loading]);

    return (
        <div className={`relative w-full overflow-x-hidden transition-colors duration-500 ${darkMode ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 z-[100] origin-left shadow-lg shadow-violet-500/20"
                style={{ scaleX }}
            />

            <main className="relative">
                {/* Global Background Glows */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                    <div className="absolute top-[10%] left-[-10%] w-[50%] h-[600px] bg-violet-500/5 blur-[120px] rounded-full"></div>
                    <div className="absolute top-[40%] right-[-10%] w-[45%] h-[700px] bg-violet-500/5 blur-[120px] rounded-full"></div>
                    <div className="absolute top-[80%] left-[5%] w-[40%] h-[600px] bg-purple-500/5 blur-[120px] rounded-full"></div>
                </div>
                <HeroSection 
                    onSubmit={handleAuditSubmit} 
                    isLoading={loading} 
                    error={error} 
                />
                
                <MetricsBanner />
                
                <AuditPillarsSection />
            </main>
        </div>
    );
};


export default LandingPage;

