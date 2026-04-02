import React, { useState, useEffect, useContext } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import HeroSection from '../Component/Landing/HeroSection';
import MetricsBanner from '../Component/Landing/MetricsBanner';
import AuditPillarsSection from '../Component/Landing/AuditPillarsSection';
import HowItWorksSection from '../Component/Landing/HowItWorksSection';
import CTASection from '../Component/Landing/CTASection';

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

    const handleAuditSubmit = async (url, device, report = "All", token = null) => {
        setError(null);
        
        const result = await fetchData(url, device, report, token);
        if (result?.success) {
            navigate('/report');
        } else {
            setError(result?.error || "Audit failed. Please try again.");
        }
    };

    return (
        <div className={`relative w-full overflow-x-hidden ${darkMode ? 'bg-[#0A0F1E] text-white' : 'bg-slate-50 text-slate-900'}`}>
            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 z-[100] origin-left"
                style={{ scaleX }}
            />

            <main>
                <HeroSection 
                    onSubmit={handleAuditSubmit} 
                    isLoading={loading} 
                    error={error} 
                />
                
                <MetricsBanner />
                
                <AuditPillarsSection />
                
                <HowItWorksSection />
                
                <CTASection 
                    onSubmit={handleAuditSubmit} 
                    isLoading={loading} 
                />
            </main>
        </div>
    );
};

export default LandingPage;
