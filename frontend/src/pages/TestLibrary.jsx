import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TestLibrary({ pathway = 'jee' }) {
  const navigate = useNavigate();
  const isJee = pathway === 'jee';

  const viewSection = (type) => {
    navigate(`/library/${type}`);
  };

  const jeeCategories = [
    { title: "Full-Length Mocks",     desc: "JEE 2026 Pattern: 90 Questions • 3 Hours",          type: "jee-full",    icon: "assignment" },
    { title: "Previous Year Papers",  desc: "Actual JEE papers from 2015–2025 digitized",         type: "jee-pyq",     icon: "history_edu" },
    { title: "Subject-wise Tests",    desc: "Focus on specific mathematical & physical weak areas", type: "jee-chapter",  icon: "category" },
  ];
  
  const neetCategories = [
    { title: "Full-Length Mocks",     desc: "NEET Pattern: 200 Questions • 3 Hours 20 Mins",       type: "neet-full",   icon: "assignment" },
    { title: "Previous Year Papers",  desc: "Actual NEET papers from 2015–2025 digitized",        type: "neet-pyq",    icon: "history_edu" },
    { title: "Subject-wise Tests",    desc: "Intensive focus on Biology, Chemistry, and Physics",  type: "neet-chapter", icon: "biotech" },
  ];

  const categories = isJee ? jeeCategories : neetCategories;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-3xl lg:text-4xl font-black text-on-surface mb-2 font-headline">{isJee ? 'IIT JEE Library' : 'NEET (UG) Library'}</h2>
        <p className="text-on-surface-variant max-w-2xl text-lg">Choose from full mock blueprints, target tests, or PYQs to improve your {isJee ? 'engineering' : 'medical'} rank.</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {categories.map((cat, i) => (
          <div key={i} className="flex flex-col bg-slate-950/40 border border-slate-900/60 shadow-2xl p-6 md:p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 hover:shadow-primary/[0.03] group cursor-pointer" onClick={() => viewSection(cat.type)}>
            <div className="p-4 bg-primary/10 text-primary w-fit rounded-xl mb-6 group-hover:bg-primary group-hover:text-slate-950 transition-colors duration-300">
              <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
            </div>
            <h3 className="text-2xl font-black text-slate-100 mb-3 font-headline group-hover:text-primary transition-colors">{cat.title}</h3>
            <p className="text-slate-400 text-sm flex-1 mb-8 leading-relaxed font-medium">{cat.desc}</p>
            <button className="w-full py-3.5 rounded-lg font-bold bg-slate-950 hover:bg-primary text-primary hover:text-slate-950 border border-slate-900 group-hover:border-primary transition-all cursor-pointer">
              Explore Tests
            </button>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-2xl font-black text-slate-200 mb-6 font-headline flex items-center gap-2"><span className="material-symbols-outlined text-primary text-3xl">menu_book</span> Study Material</h3>
        <div className="space-y-4">
            <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl flex overflow-hidden hover:shadow-primary/[0.02] hover:-translate-y-1 transition-all duration-300 group cursor-pointer text-left">
              <div className="w-2 bg-gradient-to-b from-cyan-500 to-blue-600 group-hover:w-3 transition-all"></div>
              <div className="p-6 md:p-8 flex-1 flex flex-col md:flex-row justify-between flex-wrap gap-4 items-start md:items-center">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase rounded flex items-center gap-1.5 border border-primary/20">PDF RESOURCE</span>
                  </div>
                  <h4 className="text-xl lg:text-2xl font-black text-slate-200 font-headline group-hover:text-primary transition-colors">{isJee ? 'Class 11 Physics Formula Sheet' : 'NCERT Rapid Biology Extract'}</h4>
                  <p className="text-sm text-slate-400 mt-1 font-medium max-w-2xl">{isJee ? 'Comprehensive quick-revision notes mapped directly to NCERT structure.' : 'High-yield fact tables natively sourced from standard medical biology texts.'}</p>
                </div>
                <button className="px-8 py-3 rounded-lg font-bold bg-slate-950 border border-slate-900 text-primary shadow-sm active:scale-95 transition-all text-sm uppercase tracking-wider cursor-pointer mt-4 md:mt-0 hover:bg-primary hover:text-slate-950">
                  Open PDF
                </button>
              </div>
            </div>
            
            <div className="bg-slate-950/40 border border-slate-900/60 rounded-2xl flex overflow-hidden hover:shadow-primary/[0.02] hover:-translate-y-1 transition-all duration-300 group cursor-pointer text-left">
              <div className="w-2 bg-gradient-to-b from-emerald-500 to-green-600 group-hover:w-3 transition-all"></div>
              <div className="p-6 md:p-8 flex-1 flex flex-col md:flex-row justify-between flex-wrap gap-4 items-start md:items-center">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase rounded flex items-center gap-1.5 border border-primary/20">INTERACTIVE MODULE</span>
                  </div>
                  <h4 className="text-xl lg:text-2xl font-black text-slate-200 font-headline group-hover:text-primary transition-colors">{isJee ? 'Organic Chemistry Reactions Directory' : '3D Human Anatomy Viewer'}</h4>
                  <p className="text-sm text-slate-400 mt-1 font-medium max-w-2xl">{isJee ? 'All named reactions, mechanisms, and reagents compiled into a search-friendly interface.' : 'Interactive skeletal and muscular visualizers targeted for the pre-medical syllabus.'}</p>
                </div>
                <button className="px-8 py-3 rounded-lg font-bold bg-slate-950 border border-slate-900 text-primary shadow-sm active:scale-95 transition-all text-sm uppercase tracking-wider cursor-pointer mt-4 md:mt-0 hover:bg-primary hover:text-slate-950">
                  View Module
                </button>
              </div>
            </div>
        </div>
      </div>  </div>
    </div>
  );
}
