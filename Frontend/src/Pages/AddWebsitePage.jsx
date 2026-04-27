import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, ArrowLeft, Loader2, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AddWebsitePage = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { apiFetch } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    const { ok, data } = await apiFetch('/api/websites/add', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });

    if (ok) {
      toast.success(data.message);
      navigate('/dashboard');
    } else {
      toast.error(data.message || 'Failed to add website');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="mb-10 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 text-blue-600 mb-6">
                <Globe className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Add Your Website</h2>
            <p className="mt-3 text-sm text-gray-500 font-medium tracking-wide italic">Enter the full URL starting with https://</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <Globe className="h-5 w-5" />
            </div>
            <input
              type="url"
              required
              className="block w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border-gray-100 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all font-medium placeholder:text-gray-400"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
             <div className="flex-shrink-0 mt-0.5"><div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 animate-pulse"></div></div>
             <p className="text-xs text-amber-700 font-medium leading-relaxed">
                <span className="font-bold underline">Note:</span> After adding, you'll need to verify ownership via Google Search Console to access GSC data for this site.
             </p>
          </div>

          <div className="flex flex-col gap-4">
            <button
                type="submit"
                disabled={loading}
                className="w-full h-14 flex items-center justify-center gap-2 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] uppercase tracking-widest"
            >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><PlusCircle className="h-5 w-5" /> Add Website</>}
            </button>
            <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest py-2 transition-all"
            >
                <ArrowLeft className="h-4 w-4" /> Go Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWebsitePage;
