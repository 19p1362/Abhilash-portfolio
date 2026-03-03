import React, { useState } from 'react';
import {
  ShieldCheck,
  FileSearch,
  Activity,
  CheckCircle,
  ClipboardList,
  AlertCircle,
  Award,
  BriefcaseMedical,
  Mail,
  ArrowRight,
  Sparkles,
  Loader2,
  Bot,
  FileText,
  Phone,
  Linkedin,
  Download,
  Shield,
  Menu,
  X,
  ChevronDown,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';

const apiKey = '';

const App = () => {
  // --- Gemini API State & Functions ---
  const [noteText, setNoteText] = useState(
    'Patient is a 68-year-old male presenting for follow-up of Type 2 Diabetes and Hypertension. \n\nAssessment/Plan:\n1. Type 2 Diabetes Mellitus without complications: A1c is 7.2%. Patient is currently on Metformin 1000mg BID. Will continue current dosage and monitor blood glucose logs.\n2. Essential Hypertension: BP today is 135/85. Patient reports taking Lisinopril 10mg daily. Tolerating well. Refill provided.'
  );
  const [meatResult, setMeatResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [demoError, setDemoError] = useState('');

  // --- New Feature State: Provider Query Drafter ---
  const [activeDemoTab, setActiveDemoTab] = useState('meat'); // 'meat' or 'query'
  const [queryNoteText, setQueryNoteText] = useState(
    'Patient is here for diabetes follow up. Blood sugars are poorly controlled. A1C is 9.1%. Patient complains of numbness and tingling in both feet. Adjusting Metformin. Will refer to podiatry.'
  );
  const [draftedQuery, setDraftedQuery] = useState('');
  const [isDraftingQuery, setIsDraftingQuery] = useState(false);
  const [queryError, setQueryError] = useState('');

  const [chartVolume, setChartVolume] = useState('50');
  const [emrSystem, setEmrSystem] = useState('Epic');
  const [draftedMessage, setDraftedMessage] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  // --- Mobile Menu State ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- FAQ State ---
  const [activeFaq, setActiveFaq] = useState(0);

  const faqs = [
    {
      question:
        'What is the difference between V24 and V28, and why does it matter?',
      answer:
        'The CMS-HCC V28 model overhauled the risk adjustment landscape by expanding categories (from 86 to 115), completely renumbering them, and removing over 2,000 ICD-10 codes that no longer map to a payment category (like unspecified depression or mild diabetes). My dual expertise in both V24 and V28 ensures your organization accurately captures risk during blended transition years without losing valid revenue or failing RADV audits.',
    },
    {
      question:
        'How does your background as a Registered Pharmacist help my RAF scores?',
      answer:
        "Standard coders often miss chronic conditions if the provider's documentation is slightly ambiguous. Because of my clinical pharmacology background, I can cross-reference active medication logs (like Metformin or Lisinopril) with the assessment plan. This allows me to confidently extract 'Treat' evidence for MEAT validation that others overlook, ethically maximizing your RAF score.",
    },
    {
      question: 'What is your daily chart review capacity?',
      answer:
        'Based on my experience at Augustus Healthcare LLP, I can confidently process up to 120 profiler charts per day, or 12 full, comprehensive charts per day while maintaining my 95%+ QA accuracy standard.',
    },
    {
      question: 'Do you handle retrospective or prospective coding?',
      answer:
        'I handle both. I can review historical charts to capture missed revenue (retrospective) or perform pre-visit reviews to query providers and flag potential HCCs before the patient is seen (prospective).',
    },
  ];

  // --- Export for Google Sheets / Canva ---
  const exportToCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Service Tier,Charts Volume,Price (USD),Turnaround Time,Key Features\n' +
      'Basic,25 Charts,$50,2 Days,MEAT Validation; Excel/CSV Output\n' +
      'Standard,50 Charts,$95,3 Days,MEAT Validation; Gap Notes; V28 Compliant\n' +
      'Premium,100 Charts,$180,5 Days,Priority Support; Complete RCM Alignment\n\n' +
      'Contact Info,Email,WhatsApp,LinkedIn\n' +
      'Gonela Abhilash (CPC: 2180641),abisandey@gmail.com,+91 9666103210,linkedin.com/in/abigonela';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Gonela_Abhilash_HCC_Rates.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exponential backoff retry logic for API calls
  const fetchWithRetry = async (url, options, retries = 5) => {
    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, delays[i]));
      }
    }
  };

  const handleAnalyzeNote = async () => {
    if (!noteText.trim()) return;
    setIsAnalyzing(true);
    setDemoError('');
    setMeatResult(null);

    const prompt = `You are an expert HCC medical coder. Analyze this clinical note snippet and extract any chronic conditions along with their MEAT (Monitor, Evaluate, Assess, Treat) documentation evidence. \n\nNote Snippet:\n${noteText}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [
          {
            text: 'Extract conditions and MEAT criteria accurately based on ICD-10-CM guidelines.',
          },
        ],
      },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            conditions: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  diagnosis: { type: 'STRING' },
                  meat_evidence: { type: 'STRING' },
                },
              },
            },
          },
        },
      },
    };

    try {
      const result = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        setMeatResult(JSON.parse(textResponse));
      } else {
        setDemoError('Failed to parse response from AI.');
      }
    } catch (err) {
      setDemoError(
        'An error occurred while contacting the AI. Please try again later.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDraftProviderQuery = async () => {
    if (!queryNoteText.trim()) return;
    setIsDraftingQuery(true);
    setQueryError('');
    setDraftedQuery('');

    const prompt = `You are an expert HCC Risk Adjustment medical coder. Review the following ambiguous or incomplete clinical documentation. Draft a professional, strictly compliant, NON-LEADING provider query to clarify the diagnosis and severity for accurate ICD-10-CM coding. Provide the query in a clear, ready-to-send format. \n\nDocumentation snippet:\n${queryNoteText}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [
          {
            text: 'Draft a compliant, non-leading AHIMA/AAPC standard provider query.',
          },
        ],
      },
    };

    try {
      const result = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        setDraftedQuery(textResponse);
      } else {
        setQueryError('Failed to generate query from AI.');
      }
    } catch (err) {
      setQueryError(
        'An error occurred while contacting the AI. Please try again later.'
      );
    } finally {
      setIsDraftingQuery(false);
    }
  };

  const handleDraftMessage = async () => {
    setIsDrafting(true);

    const prompt = `Draft a professional, concise email to a freelance HCC Medical Coder (who is also a Pharmacist) expressing interest in hiring them for a risk adjustment audit project. Include these details: Volume: ${chartVolume} charts. EMR System used: ${emrSystem}. Ask about their availability and request a quick chat.`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [
          {
            text: 'You are a professional healthcare admin drafting an outreach email.',
          },
        ],
      },
    };

    try {
      const result = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        setDraftedMessage(textResponse);
      }
    } catch (err) {
      setDraftedMessage(
        'Failed to draft message. Please write your message manually below.'
      );
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-blue-600 p-2 sm:p-2.5 rounded-xl shadow-inner shadow-blue-800/50 flex-shrink-0">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-lg sm:text-xl text-blue-900 block leading-tight truncate">
                  Gonela Abhilash
                </span>
                <span className="text-[10px] sm:text-xs text-blue-600 font-bold tracking-wider uppercase truncate block">
                  AAPC CPC • Reg. Pharmacist
                </span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 items-center">
              <a
                href="#services"
                className="text-slate-600 hover:text-blue-600 font-semibold transition-colors"
              >
                Services
              </a>
              <a
                href="#ai-demo"
                className="text-slate-600 hover:text-blue-600 font-semibold transition-colors flex items-center gap-1"
              >
                <Sparkles className="h-4 w-4 text-blue-500" /> AI Demo
              </a>
              <a
                href="#pricing"
                className="text-slate-600 hover:text-blue-600 font-semibold transition-colors"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-slate-600 hover:text-blue-600 font-semibold transition-colors"
              >
                FAQ
              </a>
              <a
                href="#contact"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-lg shadow-blue-600/30"
              >
                Discuss Project
              </a>
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-600 hover:text-blue-600 p-2 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-7 w-7" />
                ) : (
                  <Menu className="h-7 w-7" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full left-0 z-40">
            <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col">
              <a
                href="#services"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-slate-700 font-semibold hover:bg-blue-50 hover:text-blue-700 rounded-lg"
              >
                Services
              </a>
              <a
                href="#ai-demo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 text-slate-700 font-semibold hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-blue-500" /> AI Demo
              </a>
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-slate-700 font-semibold hover:bg-blue-50 hover:text-blue-700 rounded-lg"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-slate-700 font-semibold hover:bg-blue-50 hover:text-blue-700 rounded-lg"
              >
                FAQ
              </a>
              <a
                href="#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 mt-4 text-center bg-blue-600 text-white font-bold rounded-xl shadow-md"
              >
                Discuss Project
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-20 lg:py-32 relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-400 opacity-10 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-800/50 border border-blue-400/30 text-blue-100 text-xs sm:text-sm font-semibold">
                <Award className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                AAPC CPC ID: 2180641
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-800/50 border border-blue-400/30 text-blue-100 text-xs sm:text-sm font-semibold">
                <BriefcaseMedical className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400" />
                Reg. Pharmacist: TG076206
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-800/50 border border-blue-400/30 text-blue-100 text-xs sm:text-sm font-semibold">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                100% HIPAA Compliant
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-800/50 border border-blue-400/30 text-blue-100 text-xs sm:text-sm font-semibold">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-300" />
                95%+ QA Accuracy
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Hi, I'm Gonela Abhilash.
              <br />
              Audit-Ready{' '}
              <span className="text-blue-300">HCC Risk Adjustment</span> Coding.
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed max-w-2xl font-light">
              Accurate ICD-10-CM HCC coding with strict MEAT-based documentation
              review.{' '}
              <strong className="text-white">
                Expertise in both V24 and V28 CMS-HCC models.
              </strong>{' '}
              I help Medicare Advantage plans and RCMs improve RAF scores while
              ensuring 100% compliant, audit-ready diagnosis capture.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#pricing"
                className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-3.5 rounded-full font-bold text-lg text-center transition-all shadow-xl flex items-center justify-center gap-2"
              >
                View Project Tiers <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="#contact"
                className="bg-transparent border-2 border-blue-300 hover:border-white text-white px-8 py-3.5 rounded-full font-bold text-lg text-center transition-all"
              >
                Contact Me First
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Experience Bar */}
      <section
        id="experience"
        className="bg-white border-b border-slate-200 py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">
              Professional Experience
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              1+ year of high-volume, precision HCC coding experience at{' '}
              <span className="font-bold text-blue-700">
                Augustus Healthcare LLP
              </span>
              .
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 mb-16">
            <div className="text-center p-8 bg-blue-50 rounded-3xl border border-blue-100 w-full md:w-72 hover:shadow-lg hover:border-blue-200 transition-all">
              <div className="text-5xl font-extrabold text-blue-600 mb-3">
                120
              </div>
              <div className="text-slate-700 font-bold uppercase tracking-wider text-sm">
                Profiler Charts / Day
              </div>
            </div>
            <div className="text-center p-8 bg-blue-50 rounded-3xl border border-blue-100 w-full md:w-72 hover:shadow-lg hover:border-blue-200 transition-all">
              <div className="text-5xl font-extrabold text-blue-600 mb-3">
                12
              </div>
              <div className="text-slate-700 font-bold uppercase tracking-wider text-sm">
                Full Charts / Day
              </div>
            </div>
          </div>

          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">
            Also experienced with leading health plans
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 lg:gap-16">
            {[
              'Wellcare',
              'Elevance',
              'Kaiser Permanente',
              'Datavind',
              'Ciox',
              'Centene',
              'Aetna ACA',
            ].map((plan) => (
              <div
                key={plan}
                className="text-slate-400 font-extrabold text-lg md:text-xl grayscale opacity-60 hover:opacity-100 hover:grayscale-0 hover:text-blue-800 transition-all cursor-default"
              >
                {plan}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Services / What's Included */}
      <section id="services" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">
              Comprehensive Chart Review & Validation
            </h2>
            <p className="text-lg text-slate-600">
              I provide full-scope retrospective and prospective HCC coding
              support. Every chart undergoes a rigorous review to ensure zero
              gaps, strict V28 compliance, and maximum RADV audit safety.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileSearch className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">
                Full Chart Review
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Deep-dive analysis of provider documentation including progress
                notes, consults, and diagnostic reports for up to 100 Medicare
                Advantage charts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">
                ICD-10-CM Accuracy
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Precise diagnosis assignment strictly following the latest CMS
                and plan-specific coding guidelines to optimize Risk Adjustment
                Factor (RAF) scores.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ClipboardList className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">
                MEAT Validation
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Strict validation of each chronic condition using MEAT (Monitor,
                Evaluate, Assess, Treat) criteria to ensure your codes survive
                any CMS audit.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">
                Gap Identification
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Proactive identification of missed or undocumented chronic
                conditions, empowering your team with actionable data for
                provider follow-up.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all group md:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <CheckCircle className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">
                Clean Deliverables
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Receive a meticulously formatted Excel/CSV file (or use your
                custom template) with all captured diagnoses, HCCs, and clear
                notes for queries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI MEAT Extractor Demo (Gemini API Integration) */}
      <section
        id="ai-demo"
        className="py-24 bg-blue-950 text-white border-y border-blue-900 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/80 text-blue-200 mb-4 text-sm font-semibold border border-blue-700/50 shadow-inner">
              <Sparkles className="h-4 w-4 text-blue-400" />
              Interactive Methodology Toolkit
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See My Process in Action
            </h2>
            <p className="text-blue-200 text-lg">
              Test my methodology. Use these AI tools to simulate how I extract
              MEAT evidence or compliantly query providers when documentation is
              ambiguous.
            </p>
          </div>

          {/* Toolkit Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveDemoTab('meat')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                activeDemoTab === 'meat'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 border border-blue-500'
                  : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800 border border-blue-800/50'
              }`}
            >
              <FileSearch className="h-5 w-5" /> MEAT Extractor
            </button>
            <button
              onClick={() => setActiveDemoTab('query')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                activeDemoTab === 'query'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 border border-blue-500'
                  : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800 border border-blue-800/50'
              }`}
            >
              <MessageSquare className="h-5 w-5" /> Provider Query Drafter
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            {/* Input Side */}
            <div className="lg:w-1/2 flex flex-col">
              <div className="bg-blue-900/50 p-1 rounded-2xl border border-blue-700/50 backdrop-blur-sm flex-grow flex flex-col shadow-2xl">
                <div className="bg-slate-900 rounded-xl p-5 flex-grow flex flex-col">
                  <div className="flex items-center justify-between mb-4 text-slate-300 border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <span className="font-semibold text-sm tracking-wide">
                        {activeDemoTab === 'meat'
                          ? 'CLINICAL NOTE SNIPPET'
                          : 'AMBIGUOUS DOCUMENTATION'}
                      </span>
                    </div>
                  </div>

                  {activeDemoTab === 'meat' ? (
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full flex-grow min-h-[200px] bg-transparent text-slate-200 focus:outline-none resize-none text-base leading-relaxed placeholder-slate-600"
                      placeholder="Paste a progress note, consult, or assessment snippet here to see extraction..."
                    ></textarea>
                  ) : (
                    <textarea
                      value={queryNoteText}
                      onChange={(e) => setQueryNoteText(e.target.value)}
                      className="w-full flex-grow min-h-[200px] bg-transparent text-slate-200 focus:outline-none resize-none text-base leading-relaxed placeholder-slate-600"
                      placeholder="Paste ambiguous documentation here to generate a compliant query..."
                    ></textarea>
                  )}

                  <div className="mt-4 pt-4 flex justify-end border-t border-slate-800">
                    {activeDemoTab === 'meat' ? (
                      <button
                        onClick={handleAnalyzeNote}
                        disabled={isAnalyzing || !noteText.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/50"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Bot className="h-5 w-5" />
                        )}
                        {isAnalyzing
                          ? 'Extracting Data...'
                          : '✨ Extract MEAT Evidence'}
                      </button>
                    ) : (
                      <button
                        onClick={handleDraftProviderQuery}
                        disabled={isDraftingQuery || !queryNoteText.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/50"
                      >
                        {isDraftingQuery ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <MessageSquare className="h-5 w-5" />
                        )}
                        {isDraftingQuery
                          ? 'Drafting Query...'
                          : '✨ Draft Provider Query'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Output Side */}
            <div className="lg:w-1/2 flex flex-col">
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl text-slate-800 flex flex-col flex-grow border-4 border-white">
                <h3 className="text-xl font-extrabold text-blue-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                  {activeDemoTab === 'meat'
                    ? 'Extracted Conditions'
                    : 'Compliant Query Draft'}
                </h3>

                <div className="flex-grow bg-slate-50 rounded-xl p-5 border border-slate-200 overflow-y-auto min-h-[300px]">
                  {/* MEAT Tab Output */}
                  {activeDemoTab === 'meat' && (
                    <>
                      {demoError && (
                        <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm border border-red-200 flex items-start gap-3 shadow-sm">
                          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                          <p className="font-medium">{demoError}</p>
                        </div>
                      )}

                      {!isAnalyzing && !meatResult && !demoError && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                          <div className="bg-blue-50 p-4 rounded-full mb-4">
                            <Activity className="h-8 w-8 text-blue-300" />
                          </div>
                          <p className="text-base font-medium text-slate-500">
                            Awaiting Documentation
                          </p>
                          <p className="text-sm mt-2 max-w-xs">
                            Click the extraction button to parse the note for
                            valid HCCs.
                          </p>
                        </div>
                      )}

                      {isAnalyzing && (
                        <div className="h-full flex flex-col items-center justify-center text-blue-600">
                          <Loader2 className="h-10 w-10 mb-4 animate-spin text-blue-500" />
                          <p className="text-sm font-bold tracking-widest uppercase text-blue-800 animate-pulse">
                            Analyzing Documentation...
                          </p>
                        </div>
                      )}

                      {meatResult && meatResult.conditions && (
                        <div className="space-y-4">
                          {meatResult.conditions.length === 0 ? (
                            <div className="text-center p-6 text-slate-500 italic">
                              No chronic conditions with clear MEAT evidence
                              found in this snippet.
                            </div>
                          ) : (
                            meatResult.conditions.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-white border-2 border-blue-50 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start gap-3 mb-2">
                                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                  <div className="font-bold text-lg text-blue-900 leading-tight">
                                    {item.diagnosis}
                                  </div>
                                </div>
                                <div className="text-sm text-slate-600 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  <span className="font-bold text-slate-800 uppercase text-xs tracking-wider block mb-1">
                                    MEAT Evidence found:
                                  </span>
                                  {item.meat_evidence}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Provider Query Tab Output */}
                  {activeDemoTab === 'query' && (
                    <>
                      {queryError && (
                        <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm border border-red-200 flex items-start gap-3 shadow-sm">
                          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                          <p className="font-medium">{queryError}</p>
                        </div>
                      )}

                      {!isDraftingQuery && !draftedQuery && !queryError && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                          <div className="bg-blue-50 p-4 rounded-full mb-4">
                            <MessageSquare className="h-8 w-8 text-blue-300" />
                          </div>
                          <p className="text-base font-medium text-slate-500">
                            Awaiting Ambiguous Text
                          </p>
                          <p className="text-sm mt-2 max-w-xs">
                            Click the draft button to generate a non-leading
                            query.
                          </p>
                        </div>
                      )}

                      {isDraftingQuery && (
                        <div className="h-full flex flex-col items-center justify-center text-blue-600">
                          <Loader2 className="h-10 w-10 mb-4 animate-spin text-blue-500" />
                          <p className="text-sm font-bold tracking-widest uppercase text-blue-800 animate-pulse">
                            Drafting Compliant Query...
                          </p>
                        </div>
                      )}

                      {draftedQuery && (
                        <div className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed p-2">
                          {draftedQuery}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ideal Clients Section */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-sm mb-6 border border-blue-100 uppercase tracking-wide">
                Who I Work With
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-blue-950 mb-6 leading-tight">
                Bridging the gap between clinical care and accurate coding.
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                With a dual background as a{' '}
                <span className="font-bold">Registered Pharmacist</span> and a
                CPC-certified coder, I bring a deep pharmacological
                understanding to chart reviews that standard coders often miss.
                This makes me the ideal partner for:
              </p>
              <ul className="space-y-5">
                {[
                  'RCM companies and specialized coding vendors',
                  'Medicare Advantage plans requiring Level 2 & 3 support',
                  'Accountable Care Organizations (ACOs)',
                  'Clinics needing retrospective or prospective HCC projects',
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-4 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <CheckCircle className="h-6 w-6 text-blue-500 shrink-0" />
                    <span className="text-slate-700 font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 relative w-full">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl transform rotate-3 scale-105"></div>
              <div className="relative bg-blue-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl border border-blue-800">
                <BriefcaseMedical className="h-14 w-14 text-blue-300 mb-8 bg-blue-800/50 p-3 rounded-2xl" />
                <h3 className="text-3xl font-bold mb-5 leading-tight">
                  The Pharmacist <br />
                  Clinical Advantage
                </h3>
                <p className="text-blue-100 leading-relaxed text-lg">
                  My background as a Registered Pharmacist allows me to
                  seamlessly connect complex prescribed medications directly to
                  underlying chronic conditions. When providers fail to
                  explicitly state a condition, I use medication logs to uncover
                  powerful clues, ensuring subtle "Treat" evidence is never
                  overlooked during MEAT validation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-24 bg-slate-50 border-t border-slate-200 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-blue-950 mb-4">
              Project Scope & Pricing
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              Competitive, market-standard pricing optimized for accuracy and
              quality. Choose the tier that fits your current project needs, or
              export this data to present to your hiring team.
            </p>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-700 px-4 sm:px-6 py-3 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm w-full sm:w-auto"
            >
              <Download className="h-4 w-4 shrink-0" />{' '}
              <span className="truncate">Export Pricing to CSV</span>
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8 max-w-5xl mx-auto">
            {/* Basic Tier */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col hover:border-blue-300 hover:shadow-xl transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-blue-900 mb-2">Basic</h3>
                <p className="text-slate-500 text-sm font-medium">
                  Perfect for small audits or trial runs.
                </p>
              </div>
              <div className="mb-6 pb-6 border-b border-slate-100">
                <span className="text-5xl font-extrabold text-slate-900">
                  $50
                </span>
                <span className="text-slate-500 font-medium ml-1">
                  /project
                </span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle className="h-5 w-5 text-blue-500" /> 25 MA Charts
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle className="h-5 w-5 text-blue-500" /> 2 Days
                  Delivery
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle className="h-5 w-5 text-blue-500" /> MEAT
                  Validation
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle className="h-5 w-5 text-blue-500" /> Excel/CSV
                  Output
                </li>
              </ul>
              <a
                href="#contact"
                className="w-full block text-center bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 font-bold py-3.5 rounded-xl transition-colors"
              >
                Select Basic
              </a>
            </div>

            {/* Standard Tier */}
            <div className="bg-blue-900 rounded-3xl shadow-2xl shadow-blue-900/20 border-2 border-blue-500 p-8 flex flex-col transform md:-translate-y-4 relative z-10 mt-4 md:mt-0">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-blue-400 text-blue-950 text-xs font-extrabold uppercase tracking-widest py-1.5 px-5 rounded-full shadow-lg whitespace-nowrap">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Standard</h3>
                <p className="text-blue-200 text-sm font-medium">
                  Ideal for consistent monthly volumes.
                </p>
              </div>
              <div className="mb-6 pb-6 border-b border-blue-800">
                <span className="text-5xl font-extrabold text-white">$95</span>
                <span className="text-blue-200 font-medium ml-1">/project</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-blue-50 font-medium">
                  <CheckCircle className="h-5 w-5 text-blue-400" /> 50 MA Charts
                </li>
                <li className="flex items-center gap-3 text-blue-50 font-medium">
                  <CheckCircle className="h-5 w-5 text-blue-400" /> 3 Days
                  Delivery
                </li>
                <li className="flex items-center gap-3 text-blue-50 font-medium">
                  <CheckCircle className="h-5 w-5 text-blue-400" /> MEAT
                  Validation
                </li>
                <li className="flex items-center gap-3 text-blue-50 font-medium">
                  <CheckCircle className="h-5 w-5 text-blue-400" /> V28 Gap
                  Notes Included
                </li>
              </ul>
              <a
                href="#contact"
                className="w-full block text-center bg-blue-500 text-white hover:bg-blue-400 font-bold py-3.5 rounded-xl transition-colors shadow-lg"
              >
                Select Standard
              </a>
            </div>

            {/* Premium Tier */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col hover:border-blue-300 hover:shadow-xl transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-blue-900 mb-2">
                  Premium
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  Large scale backlog or prospective runs.
                </p>
              </div>
              <div className="mb-6 pb-6 border-b border-slate-100">
                <span className="text-5xl font-extrabold text-slate-900">
                  $180
                </span>
                <span className="text-slate-500 font-medium ml-1">
                  /project
                </span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle className="h-5 w-5 text-blue-500" /> 100 MA
                  Charts
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle className="h-5 w-5 text-blue-500" /> 5 Days
                  Delivery
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle className="h-5 w-5 text-blue-500" /> Priority
                  Support
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle className="h-5 w-5 text-blue-500" /> Complete RCM
                  alignment
                </li>
              </ul>
              <a
                href="#contact"
                className="w-full block text-center bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 font-bold py-3.5 rounded-xl transition-colors"
              >
                Select Premium
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-bold text-sm mb-4 border border-blue-100 uppercase tracking-wide">
              <HelpCircle className="h-4 w-4" /> Client FAQ
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-blue-950 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600">
              Clear answers regarding my coding methodology, clinical
              background, and capacity.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`border-2 rounded-2xl transition-all duration-300 overflow-hidden ${
                  activeFaq === index
                    ? 'border-blue-500 bg-blue-50/50 shadow-md'
                    : 'border-slate-100 bg-white hover:border-blue-200'
                }`}
              >
                <button
                  onClick={() =>
                    setActiveFaq(activeFaq === index ? null : index)
                  }
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span
                    className={`font-bold text-lg ${
                      activeFaq === index ? 'text-blue-900' : 'text-slate-800'
                    }`}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-6 w-6 shrink-0 transition-transform duration-300 ${
                      activeFaq === index
                        ? 'text-blue-600 rotate-180'
                        : 'text-slate-400'
                    }`}
                  />
                </button>

                <div
                  className={`px-6 transition-all duration-300 ease-in-out ${
                    activeFaq === index
                      ? 'max-h-96 pb-6 opacity-100'
                      : 'max-h-0 opacity-0 overflow-hidden'
                  }`}
                >
                  <p className="text-slate-600 leading-relaxed pt-2 border-t border-blue-100/50">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contact Section */}
      <section
        id="contact"
        className="bg-blue-600 py-24 relative overflow-hidden"
      >
        {/* Decor */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-700 rounded-full opacity-50 blur-3xl"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
            {/* Left side text */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                Ready to secure your RAF scores?
              </h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Let's discuss your specific chart volume, required templates,
                and timelines to ensure a seamless integration with your
                auditing workflow.
              </p>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-10">
                <a
                  href="https://www.upwork.com/freelancers/~012de6413bd45c631a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-blue-700 hover:bg-slate-50 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  Hire Me on Upwork <ArrowRight className="h-5 w-5" />
                </a>
              </div>

              <div className="flex flex-col gap-5 text-blue-100">
                <a
                  href="mailto:abisandey@gmail.com"
                  className="flex items-center justify-center lg:justify-start gap-4 hover:text-white transition-colors group"
                >
                  <div className="bg-blue-800 p-3 rounded-full group-hover:bg-blue-700 transition-colors shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-base sm:text-lg break-all">
                    abisandey@gmail.com
                  </span>
                </a>
                <a
                  href="https://wa.me/919666103210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center lg:justify-start gap-4 hover:text-white transition-colors group"
                >
                  <div className="bg-blue-800 p-3 rounded-full group-hover:bg-blue-700 transition-colors shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-base sm:text-lg">
                    +91 9666103210 (WhatsApp)
                  </span>
                </a>
                <a
                  href="https://www.linkedin.com/in/abigonela"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center lg:justify-start gap-4 hover:text-white transition-colors group"
                >
                  <div className="bg-blue-800 p-3 rounded-full group-hover:bg-blue-700 transition-colors shrink-0">
                    <Linkedin className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-base sm:text-lg break-all">
                    linkedin.com/in/abigonela
                  </span>
                </a>
              </div>
            </div>

            {/* Right side form block */}
            <div className="lg:w-1/2 w-full bg-white rounded-3xl shadow-2xl p-6 md:p-8 lg:p-10 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-blue-950">
                  Send an Inquiry
                </h3>
              </div>
              <p className="text-slate-500 mb-6 text-sm font-medium">
                Use the{' '}
                <span className="text-blue-600 font-bold flex inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI assistant
                </span>{' '}
                to quickly draft your message, or write it manually.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">
                    Chart Volume
                  </label>
                  <input
                    type="text"
                    value={chartVolume}
                    onChange={(e) => setChartVolume(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all bg-slate-50"
                    placeholder="e.g., 50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">
                    EMR System
                  </label>
                  <input
                    type="text"
                    value={emrSystem}
                    onChange={(e) => setEmrSystem(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all bg-slate-50"
                    placeholder="e.g., Epic"
                  />
                </div>
              </div>

              <button
                onClick={handleDraftMessage}
                disabled={isDrafting}
                className="w-full mb-5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 border border-blue-200 shadow-sm"
              >
                {isDrafting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                {isDrafting
                  ? 'Drafting your message...'
                  : '✨ Auto-Draft Message'}
              </button>

              <textarea
                value={draftedMessage}
                onChange={(e) => setDraftedMessage(e.target.value)}
                className="w-full h-36 border-2 border-slate-200 rounded-xl p-4 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all mb-5 resize-none bg-slate-50"
                placeholder="Write your message here, or use the auto-draft button above..."
              ></textarea>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-600/30 flex justify-center items-center gap-2 text-lg">
                <Mail className="h-6 w-6" /> Send Message
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-2 rounded-lg">
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <span className="font-bold text-xl text-white block">
                Gonela Abhilash
              </span>
            </div>
          </div>
          <p className="text-slate-400 text-sm text-center md:text-left font-medium">
            © {new Date().getFullYear()} Gonela Abhilash. All rights reserved.{' '}
            <br className="md:hidden mt-1" />
            <span className="text-slate-500">
              AAPC CPC (2180641) & Reg. Pharmacist (TG Pharmacy Council:
              TG076206).
            </span>
          </p>
          <div className="flex gap-4">
            <a
              href="https://www.upwork.com/freelancers/~012de6413bd45c631a"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white px-5 py-2 rounded-full transition-all text-sm font-bold shadow-md"
            >
              View Upwork Profile
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
