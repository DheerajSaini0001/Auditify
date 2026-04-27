import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const CanonicalTag = () => {
  const location = useLocation();

  useEffect(() => {
    const baseUrl = 'https://siteaudit.sltechsoft.com' || 'http://localhost:5173';
    const canonicalUrl = `${baseUrl}${location.pathname}`;

    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);
  }, [location.pathname]);

  return null;
};

export default CanonicalTag;
