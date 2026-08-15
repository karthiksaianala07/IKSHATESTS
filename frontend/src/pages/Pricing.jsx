import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, HelpCircle, ShieldAlert, Sparkles, Building2, User } from 'lucide-react';

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState('individual'); // 'individual' or 'enterprise'
  const [openFaq, setOpenFaq] = useState(null);

  // Individual Plan Tiers
  const individualPlans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '₹0',
      period: 'forever',
      description: 'Perfect for starters evaluating their prep strategy.',
      features: [
        'Access up to 10 tests from any series',
        'Standard test console features',
        'Basic speed & accuracy analysis',
        'Email community support',
        'Active proctor warning systems'
      ],
      cta: 'Sign Up Free',
      accent: false,
      popular: false,
      dark: false,
      link: '/login'
    },
    {
      id: 'pro',
      name: 'Pro Recommended',
      price: '₹399',
      period: 'month',
      description: 'The anchor plan for dedicated aspirants seeking success.',
      features: [
        'Unlimited access to any 2 exam series',
        'Centralized progress tracker Dashboard',
        'Detailed diagnostic behavioral reports',
        'Reattempt incorrect answers portal',
        'Priority community support & clarifications',
        'Full browser-guard proctoring safety'
      ],
      cta: 'Choose Pro',
      accent: true,
      popular: true,
      dark: false,
      link: '/login'
    },
    {
      id: 'premium',
      name: 'Premium Annual',
      price: '₹2,999',
      period: 'year',
      description: 'Comprehensive annual success package at a 25% lower rate.',
      features: [
        'Unlimited access to any 3 exam series',
        'All Pro Dashboard analytics tools',
        'Exclusive offline study planner modules',
        'Centralized AI question clarification tool',
        'Instant live mock results and analysis',
        'Direct email mentoring from subject experts'
      ],
      cta: 'Choose Premium',
      accent: false,
      popular: false,
      dark: true,
      link: '/login'
    }
  ];

  // Enterprise Plan Tiers (Business/Institutions placeholders)
  const enterprisePlans = [
    {
      id: 'team',
      name: 'Coaching Core',
      price: '₹2,499',
      period: 'month',
      description: 'Tailored for small coaching groups and batch coordinators.',
      features: [
        'Centralized dashboard for up to 10 students',
        'Centralized class-wide progress analytics',
        'Unlimited access to all JEE & NEET mocks',
        'Automated rank list calculations',
        'Dedicated coordinator control panel'
      ],
      cta: 'Contact Sales',
      accent: false,
      popular: false,
      dark: false,
      link: 'mailto:sales@ikshatests.com?subject=Inquiry: Coaching Core Plan'
    },
    {
      id: 'institution',
      name: 'Institution Pro',
      price: '₹9,999',
      period: 'month',
      description: 'Complete suite for premium high schools and coaching hubs.',
      features: [
        'Centralized dashboard for up to 120 students',
        'AI Word (.docx) & PDF Question ingestion',
        'Custom test authoring panel',
        'High-fidelity proctoring logs & warnings',
        'Secure API access & student reporting',
        'Centralized billing & manager seats'
      ],
      cta: 'Contact Sales',
      accent: true,
      popular: true,
      dark: false,
      link: 'mailto:sales@ikshatests.com?subject=Inquiry: Institution Pro Plan'
    },
    {
      id: 'custom',
      name: 'SLA Custom',
      price: 'Custom',
      period: 'annual',
      description: 'State-of-the-art tailored deployment for giant enterprises.',
      features: [
        'Infinite student seats & customized scaling',
        'Dedicated custom sub-domain configuration',
        '99.9% uptime SLA guarantee',
        'Whitelabel branding option available',
        'Centralized bulk data export integrations',
        'Dedicated accounts and tech engineers'
      ],
      cta: 'Contact Sales',
      accent: false,
      popular: false,
      dark: true,
      link: 'mailto:sales@ikshatests.com?subject=Inquiry: Custom SLA Plan'
    }
  ];

  const currentPlans = billingPeriod === 'individual' ? individualPlans : enterprisePlans;

  // Accordion FAQ content
  const faqs = [
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Absolutely. You can cancel your Pro or Premium subscription at any point from your Dashboard settings. Once cancelled, your premium access will remain active until the end of your current billing cycle."
    },
    {
      question: "How does the exam series access work?",
      answer: "Each plan grants access to a specific number of Exam Series (e.g., JEE Mains, JEE Advanced, or NEET UG). When you subscribe to Pro, you select two active series to unlock completely. Premium unlocks three. You can swap your selected series once every calendar month if needed."
    },
    {
      question: "What is the NTA-Style proctor guard?",
      answer: "Our CBT simulator mimics the official NTA environment. This includes tracking tab shifts, window resizing, and full-screen compliance. In basic tiers, warnings are printed; in active premium sessions, the console enforces logs that coordinators can check."
    },
    {
      question: "Do you offer offline test templates?",
      answer: "Yes, for Premium Annual and all Enterprise subscriptions, you can export test configurations into custom PDF sheets with KaTeX equation formatting included, optimized for print mock layouts."
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 select-none relative z-10">
      
      {/* ── Header Section ── */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 border border-slate-800/80 px-3 py-1 rounded-full bg-slate-950/40 text-xs font-mono tracking-widest text-primary mb-4">
          <Sparkles className="w-3.5 h-3.5" /> PRICING STRUCTURE
        </div>
        <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tight text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-sm md:text-base text-slate-400 font-medium">
          Invest in precision preparation. Get access to detailed analytics, proctor dashboards, and state-of-the-art CBT simulator tests.
        </p>
      </div>

      {/* ── Billing Toggle Switch ── */}
      <div className="flex justify-center mb-16">
        <div className="bg-slate-950/80 border border-slate-900/60 p-1.5 rounded-2xl flex items-center shadow-lg relative z-20">
          <button
            onClick={() => setBillingPeriod('individual')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              billingPeriod === 'individual'
                ? 'bg-primary text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Switch to Individual billing"
            aria-pressed={billingPeriod === 'individual'}
          >
            <User className="w-3.5 h-3.5" />
            Individual Plans
          </button>
          
          <button
            onClick={() => setBillingPeriod('enterprise')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              billingPeriod === 'enterprise'
                ? 'bg-primary text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Switch to Enterprise billing"
            aria-pressed={billingPeriod === 'enterprise'}
          >
            <Building2 className="w-3.5 h-3.5" />
            Enterprise Hub
          </button>
        </div>
      </div>

      {/* ── Pricing Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-24">
        {currentPlans.map((plan) => {
          // Conditional Styling Logic
          const isPro = plan.popular;
          const isDark = plan.dark;

          let cardClasses = "relative flex flex-col justify-between p-8 rounded-3xl transition-all duration-300 ";
          
          if (isPro) {
            // Elevated active card
            cardClasses += "bg-[#0b0f20]/95 border-2 border-primary shadow-[0_15px_40px_rgba(249,115,22,0.1)] scale-105 z-10 md:-translate-y-2 hover:scale-[1.07] hover:shadow-[0_20px_50px_rgba(249,115,22,0.18)]";
          } else if (isDark) {
            // Darker premium theme
            cardClasses += "bg-[#05060b]/90 border border-slate-800 shadow-2xl hover:-translate-y-1.5 hover:border-slate-700 hover:shadow-cyan-950/10";
          } else {
            // Standard outline card
            cardClasses += "bg-[#070912]/80 border border-slate-900/60 shadow-lg hover:-translate-y-1.5 hover:border-slate-800/80";
          }

          return (
            <div 
              key={plan.id} 
              className={cardClasses}
              style={{ contentVisibility: 'auto' }}
            >
              {/* Popular Badge */}
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-slate-950 text-[10px] font-black uppercase tracking-widest px-4.5 py-1 rounded-full shadow-md">
                  Most Popular
                </div>
              )}

              {/* Top Card Info */}
              <div>
                <h3 className={`text-base font-bold font-headline uppercase tracking-wider mb-2 ${isPro ? 'text-primary' : 'text-slate-200'}`}>
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mb-6 min-h-[32px]">
                  {plan.description}
                </p>
                
                {/* Price Display */}
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl md:text-5xl font-black font-headline text-white tracking-tight">
                    {plan.price}
                  </span>
                  {plan.period && plan.period !== 'forever' && (
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      / {plan.period}
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div className={`h-[1px] w-full mb-8 ${isPro ? 'bg-primary/20' : 'bg-slate-900/60'}`}></div>

                {/* Features List */}
                <ul className="space-y-4 mb-8" aria-label={`Features list for ${plan.name} plan`}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs text-slate-300 font-medium leading-relaxed">
                      <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${isPro ? 'bg-primary/10 text-primary' : 'bg-slate-900 text-slate-400'}`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Action Button */}
              <div>
                <a
                  href={plan.link}
                  className={`w-full text-center block py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer ${
                    isPro 
                      ? 'bg-primary hover:bg-[#ff8533] text-slate-950 shadow-md hover:shadow-lg' 
                      : isDark
                        ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700'
                        : 'bg-transparent hover:bg-slate-900/60 text-slate-300 hover:text-white border border-slate-900 hover:border-slate-800'
                  }`}
                  aria-label={`${plan.cta} - ${plan.name} Plan`}
                >
                  {plan.cta}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FAQ Accordeon Section ── */}
      <div className="max-w-3xl mx-auto border-t border-slate-900/60 pt-16">
        <h2 className="text-2xl md:text-3xl font-black font-headline text-center text-white mb-10 tracking-tight">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index} 
                className="bg-[#060913]/60 border border-slate-900/60 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between text-left p-6 font-bold font-headline text-xs md:text-sm text-slate-200 hover:text-white transition-colors cursor-pointer outline-none"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {faq.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  )}
                </button>
                
                <div
                  id={`faq-answer-${index}`}
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[300px] border-t border-slate-900/30 opacity-100 p-6 pt-5' : 'max-h-0 opacity-0 pointer-events-none'
                  } overflow-hidden`}
                  aria-hidden={!isOpen}
                >
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
