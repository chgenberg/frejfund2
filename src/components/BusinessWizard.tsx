'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, ChevronDown, Upload, X, FileText, Globe, Linkedin } from 'lucide-react';
import { BusinessInfo } from '@/types/business';
import { normalizeUrl, isValidUrl } from '@/lib/url-utils';

interface BusinessWizardProps {
  onComplete: (businessInfo: BusinessInfo) => void;
}

export default function BusinessWizard({ onComplete }: BusinessWizardProps) {
  const [currentStep, setCurrentStep] = useState(-1); // Start with welcome screen
  const [businessInfo, setBusinessInfo] = useState<Partial<BusinessInfo>>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const steps = [
    {
      title: 'Basic Information',
      subtitle: 'Tell us about yourself and your company',
      fields: ['name', 'email', 'website']
    },
    {
      title: 'Business Context',
      subtitle: 'Help us understand your business stage and model',
      fields: ['stage', 'industry', 'targetMarket', 'businessModel']
    },
    {
      title: 'Scale & Team',
      subtitle: 'Current revenue and team size',
      fields: ['monthlyRevenue', 'teamSize', 'linkedinProfiles']
    },
    {
      title: 'Documents',
      subtitle: 'Upload pitch deck or business documents (optional)',
      fields: ['uploadedFiles']
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    // Auto-normalize URLs
    if (field === 'website' && value) {
      value = normalizeUrl(value);
    }
    setBusinessInfo(prev => ({ ...prev, [field]: value }));
  };

  // Background scrape when website is filled (debounced)
  useEffect(() => {
    const url = businessInfo.website || '';
    // Only trigger when we have a full domain with TLD and a valid URL
    const looksComplete = /\.[a-z]{2,}$/i.test(url);
    if (!url || !looksComplete || !isValidUrl(url)) return;

    const sessionId = localStorage.getItem('frejfund-session-id') || `sess-${Date.now()}`;
    localStorage.setItem('frejfund-session-id', sessionId);

    const t = setTimeout(async () => {
      try {
        setIsScraping(true);
        // Use enhanced scraping for richer data
        const response = await fetch('/api/scrape/enhanced', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
            ...businessInfo,
            website: url,
            sessionId 
          }) 
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Enhanced scraping complete! Sources: ${data.stats?.dataSources?.join(', ')}`);
          
          // Store enriched data
          if (data.enrichedSummary) {
            setBusinessInfo(prev => ({
              ...prev,
              preScrapedText: data.enrichedSummary,
              preScrapedSources: data.stats?.dataSources || []
            }));
          }
        } else {
          console.log(`Background scraping started for ${url}`);
        }
      } catch (error) {
        console.error('Enhanced scraping failed, falling back:', error);
      } finally { 
        setIsScraping(false); 
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [businessInfo.website]);

  const [uploadError, setUploadError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileExtractionStatus, setFileExtractionStatus] = useState<Record<string, {
    status: 'extracting' | 'success' | 'error';
    wordCount?: number;
    error?: string;
  }>>({});
  
  const ALLOWED_FORMATS = [
    '.pdf', '.docx', '.doc', '.xlsx', '.xls', 
    '.pptx', '.ppt', '.key', '.csv', '.txt'
  ];
  
  const validateAndAddFiles = async (files: File[]) => {
    setUploadError('');
    
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB
    const MAX_FILES = 10;
    
    // Check file count
    if (uploadedFiles.length + files.length > MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }
    
    // Check file formats
    for (const file of files) {
      const hasValidFormat = ALLOWED_FORMATS.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      if (!hasValidFormat) {
        setUploadError(
          `"${file.name}" has unsupported format. Allowed: ${ALLOWED_FORMATS.join(', ')}`
        );
        return;
      }
    }
    
    // Check individual file sizes
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(
          `"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 50MB`
        );
        return;
      }
    }
    
    // Check total size
    const currentTotal = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
    const newTotal = files.reduce((sum, f) => sum + f.size, 0);
    if (currentTotal + newTotal > MAX_TOTAL_SIZE) {
      setUploadError('Total upload size would exceed 100MB limit');
      return;
    }
    
    // Add files and start extraction preview
    setUploadedFiles(prev => [...prev, ...files]);
    
    // Extract text preview from files
    for (const file of files) {
      extractFilePreview(file);
    }
  };
  
  const extractFilePreview = async (file: File) => {
    setFileExtractionStatus(prev => ({
      ...prev,
      [file.name]: { status: 'extracting' }
    }));
    
    // For PDFs and complex files, extraction happens on backend
    // Just show a success message here
    setTimeout(() => {
      setFileExtractionStatus(prev => ({
        ...prev,
        [file.name]: { 
          status: 'success',
          wordCount: undefined // Will be extracted on backend
        }
      }));
    }, 500);
    
    // Note: Full extraction happens on backend during deep analysis
    // This is just a quick preview/validation
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    validateAndAddFiles(files);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    validateAndAddFiles(files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    // Welcome screen: requires terms acceptance
    if (currentStep === -1) {
      return acceptedTerms;
    }
    
    const currentFields = steps[currentStep].fields;
    
    if (currentStep === 0) {
      return businessInfo.name && businessInfo.email;
    }
    if (currentStep === 1) {
      return businessInfo.stage && businessInfo.industry && businessInfo.targetMarket && businessInfo.businessModel;
    }
    if (currentStep === 2) {
      return businessInfo.monthlyRevenue && businessInfo.teamSize;
    }
    return true; // File upload is optional
  };

  const handleNext = async () => {
    // From welcome screen, go to first real step
    if (currentStep === -1) {
      setCurrentStep(0);
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Start analysis
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      setAnalysisStatus('Preparing analysis...');

      // Simulate analysis progress
      const statuses = [
        'Analyzing your business model...',
        'Evaluating market potential...',
        'Assessing team capabilities...',
        'Calculating investment readiness...',
        'Generating insights...'
      ];

      let progress = 0;
      const interval = setInterval(() => {
        progress += 1.67; // 60 seconds = 100%
        setAnalysisProgress(Math.min(progress, 100));
        
        const statusIndex = Math.floor(progress / 20);
        if (statusIndex < statuses.length) {
          setAnalysisStatus(statuses[statusIndex]);
        }

        if (progress >= 100) {
          clearInterval(interval);
          // Complete wizard
          const completeInfo: BusinessInfo = {
            name: businessInfo.name || '',
            email: businessInfo.email || '',
            website: businessInfo.website,
            linkedinProfiles: businessInfo.linkedinProfiles,
            stage: businessInfo.stage as BusinessInfo['stage'],
            industry: businessInfo.industry || '',
            targetMarket: businessInfo.targetMarket || '',
            businessModel: businessInfo.businessModel || '',
            monthlyRevenue: businessInfo.monthlyRevenue || '',
            teamSize: businessInfo.teamSize || '',
            uploadedFiles,
            preScrapedText: businessInfo.preScrapedText,
            preScrapedSources: businessInfo.preScrapedSources
          };
          
          // Note: File extraction continues in background
          // Backend will handle full extraction during deep analysis
          onComplete(completeInfo);
        }
      }, 1000);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderWelcomeScreen = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto text-center px-4 sm:px-0"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center">
        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-black mb-3 sm:mb-4">
        Welcome to FrejFund
      </h2>
      
      <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
        Let's analyze your business and help you become investment-ready
      </p>

      <div className="minimal-box text-left mb-6 sm:mb-8 p-4 sm:p-6">
        <h3 className="font-semibold text-black mb-3 sm:mb-4 text-sm sm:text-base">What we'll do together:</h3>
        <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
          <li className="flex items-start">
            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5 flex-shrink-0 text-xs sm:text-sm">1</span>
            <span>Gather information about your business, team, and traction</span>
          </li>
          <li className="flex items-start">
            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5 flex-shrink-0 text-xs sm:text-sm">2</span>
            <span>Analyze your investment readiness across 10 key dimensions</span>
          </li>
          <li className="flex items-start">
            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5 flex-shrink-0 text-xs sm:text-sm">3</span>
            <span>Connect you with AI coach Freja for personalized guidance</span>
          </li>
          <li className="flex items-start">
            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5 flex-shrink-0 text-xs sm:text-sm">4</span>
            <span>Match you with relevant investors in our network</span>
          </li>
        </ul>
      </div>

      <div className="minimal-box text-left mb-6 sm:mb-8 p-4 sm:p-6">
        <h3 className="font-semibold text-black mb-3 sm:mb-4 text-sm sm:text-base">Your data is safe:</h3>
        <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
          <li>• Your information is encrypted and stored securely</li>
          <li>• We never share your data without explicit permission</li>
          <li>• Investors only see what you choose to share</li>
          <li>• You can delete your account anytime</li>
        </ul>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <label className="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 mr-3 w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
          />
          <span className="text-sm text-gray-700 text-left">
            I agree to FrejFund's{' '}
            <a href="/terms" target="_blank" className="text-black underline hover:no-underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="text-black underline hover:no-underline">
              Privacy Policy
            </a>
            . I understand that my data will be used to provide AI-powered investment readiness analysis and investor matching.
          </span>
        </label>
      </div>

      <button
        onClick={handleNext}
        disabled={!acceptedTerms}
        className="minimal-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Get Started
      </button>
    </motion.div>
  );

  const renderField = (field: string) => {
    switch (field) {
      case 'name':
        return (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your Name *
            </label>
            <input
              type="text"
              value={businessInfo.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="John Doe"
              className="minimal-select w-full"
            />
          </div>
        );

      case 'email':
        return (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Email Address *
            </label>
            <input
              type="email"
              value={businessInfo.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john@company.com"
              className="minimal-select w-full"
            />
          </div>
        );

      case 'website':
        return (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Globe className="inline w-4 h-4 mr-1" />
              Company Website
            </label>
            <div className="relative">
              <input
                type="text"
                value={businessInfo.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="yourcompany.com (http:// auto-added)"
                className="minimal-select w-full"
              />
              {isScraping && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full"
                  />
                </div>
              )}
            </div>
            {isScraping && (
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🔍 Analyzing website + LinkedIn + GitHub + Product Hunt...
                </motion.span>
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              We'll automatically scrape website, LinkedIn, GitHub, and Product Hunt
            </p>
          </div>
        );

      case 'stage':
        return (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Business Stage *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {[
                { value: 'idea', label: 'Idea', desc: 'Concept stage' },
                { value: 'mvp', label: 'MVP', desc: 'Early product' },
                { value: 'early-revenue', label: 'Early Revenue', desc: 'First customers' },
                { value: 'scaling', label: 'Scaling', desc: 'Growing fast' }
              ].map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleInputChange('stage', option.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    businessInfo.stage === option.value
                      ? 'border-black bg-gray-100 text-black'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.desc}</div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 'industry':
        return (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Industry *
            </label>
            <div className="relative">
              <select
                value={businessInfo.industry || ''}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="minimal-select w-full"
              >
                <option value="">Select your industry</option>
                <option value="SaaS">SaaS / Software</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Fintech">Fintech</option>
                <option value="HealthTech">HealthTech</option>
                <option value="EdTech">EdTech</option>
                <option value="AI/ML">AI / Machine Learning</option>
                <option value="IoT">IoT / Hardware</option>
                <option value="Marketplace">Marketplace</option>
                <option value="Gaming">Gaming</option>
                <option value="Other">Other</option>
              </select>
              <motion.div 
                className="absolute right-5 top-1/2 transform -translate-y-1/2 pointer-events-none"
                animate={{ rotate: businessInfo.industry ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </motion.div>
            </div>
          </div>
        );

      case 'targetMarket':
        return (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Target Market *
            </label>
            <select
              value={businessInfo.targetMarket || ''}
              onChange={(e) => handleInputChange('targetMarket', e.target.value)}
              className="minimal-select w-full"
            >
              <option value="">Select your target market</option>
              <option value="SMBs">Small & Medium Businesses</option>
              <option value="Enterprises">Enterprise Companies</option>
              <option value="Consumers">Consumers (B2C)</option>
              <option value="Startups">Startups</option>
              <option value="Government">Government</option>
              <option value="Non-profit">Non-profit</option>
            </select>
          </div>
        );

      case 'businessModel':
        return (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Business Model *
            </label>
            <select
              value={businessInfo.businessModel || ''}
              onChange={(e) => handleInputChange('businessModel', e.target.value)}
              className="minimal-select w-full"
            >
              <option value="">Select your business model</option>
              <option value="B2B Subscription">B2B Subscription (SaaS)</option>
              <option value="B2C Subscription">B2C Subscription</option>
              <option value="Marketplace">Marketplace (Commission)</option>
              <option value="E-commerce">E-commerce (Product Sales)</option>
              <option value="Freemium">Freemium</option>
              <option value="One-time License">One-time License</option>
              <option value="Services">Professional Services</option>
              <option value="Advertising">Advertising Revenue</option>
              <option value="Other">Other</option>
            </select>
          </div>
        );

      case 'monthlyRevenue':
        return (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Monthly Revenue *
            </label>
            <select
              value={businessInfo.monthlyRevenue || ''}
              onChange={(e) => handleInputChange('monthlyRevenue', e.target.value)}
              className="minimal-select w-full"
            >
              <option value="">Select revenue range</option>
              <option value="0">€0 (Pre-revenue)</option>
              <option value="1-10k">€1k - €10k</option>
              <option value="10-50k">€10k - €50k</option>
              <option value="50-100k">€50k - €100k</option>
              <option value="100k+">€100k+</option>
            </select>
          </div>
        );

      case 'teamSize':
        return (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Team Size *
            </label>
            <select
              value={businessInfo.teamSize || ''}
              onChange={(e) => handleInputChange('teamSize', e.target.value)}
              className="minimal-select w-full"
            >
              <option value="">Select team size</option>
              <option value="1">Solo founder</option>
              <option value="2-5">2-5 people</option>
              <option value="6-10">6-10 people</option>
              <option value="11-25">11-25 people</option>
              <option value="25+">25+ people</option>
            </select>
          </div>
        );

      case 'linkedinProfiles':
        return (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Linkedin className="inline w-4 h-4 mr-1" />
              LinkedIn Profiles
            </label>
            <input
              type="text"
              value={businessInfo.linkedinProfiles || ''}
              onChange={(e) => handleInputChange('linkedinProfiles', e.target.value)}
              placeholder="https://linkedin.com/in/founder1, https://linkedin.com/in/founder2"
              className="minimal-select w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              Comma-separated LinkedIn URLs for team analysis
            </p>
          </div>
        );

      case 'uploadedFiles':
        return (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <FileText className="inline w-4 h-4 mr-1" />
              Business Documents
            </label>
            
            <motion.div 
              whileHover={{ scale: 1.01 }}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-2xl p-8 text-center transition-all cursor-pointer border-2 border-dashed ${
                isDragging 
                  ? 'border-black bg-gray-200 scale-105' 
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
              }`}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <motion.div 
                animate={isDragging ? { 
                  y: [-5, 5, -5],
                  rotate: [0, 5, -5, 0]
                } : {}}
                transition={{ duration: 0.6, repeat: isDragging ? Infinity : 0 }}
                className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-sm"
              >
                <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-black' : 'text-gray-600'}`} strokeWidth={1.5} />
              </motion.div>
              <p className={`font-medium mb-2 transition-colors ${isDragging ? 'text-black text-lg' : 'text-gray-700'}`}>
                {isDragging ? '✨ Drop your files here!' : 'Drag & drop files here or click to browse'}
              </p>
              <p className="text-sm text-gray-500 mb-1">
                PDF, Word, Excel, PowerPoint, Keynote, CSV, Text
              </p>
              <p className="text-xs text-gray-400">
                Max 50MB per file • Up to 10 files • 100MB total
              </p>
              <p className="text-xs text-green-600 mt-2">
                💡 You can continue while files are being analyzed in the background
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.key,.txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
            </motion.div>

            {uploadError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {uploadError}
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
                  <span>{uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded</span>
                  <span>
                    {(uploadedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(1)} MB total
                  </span>
                </div>
                {uploadedFiles.map((file, index) => {
                  const extractionStatus = fileExtractionStatus[file.name];
                  return (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white p-3 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                            extractionStatus?.status === 'success' ? 'bg-green-50' :
                            extractionStatus?.status === 'error' ? 'bg-red-50' :
                            'bg-gray-100'
                          }`}>
                            <FileText className={`w-4 h-4 ${
                              extractionStatus?.status === 'success' ? 'text-green-600' :
                              extractionStatus?.status === 'error' ? 'text-red-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 block truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-gray-600 p-1 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </div>
                      
                      {/* Extraction Status */}
                      {extractionStatus && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          {extractionStatus.status === 'extracting' && (
                            <div className="flex items-center text-xs text-gray-500">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-3 h-3 border-2 border-gray-300 border-t-black rounded-full mr-2"
                              />
                              Extracting text...
                            </div>
                          )}
                          {extractionStatus.status === 'success' && (
                            <div className="text-xs text-green-600 font-medium">
                              ✓ Ready for analysis
                            </div>
                          )}
                          {extractionStatus.status === 'error' && (
                            <div className="text-xs text-red-600">
                              ✗ {extractionStatus.error}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          <div className="minimal-box minimal-box-shadow">
            {/* Progress Circle */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e5e5"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#000"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysisProgress / 100)}`}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-black">{Math.round(analysisProgress)}%</span>
              </div>
            </div>

            {/* Status Text */}
            <h2 className="text-xl font-semibold text-black mb-2">Analyzing Your Business</h2>
            <p className="text-gray-600 mb-6">{analysisStatus}</p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-black rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${analysisProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
      >
        <div className="container mx-auto px-4 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="relative">
                <img 
                  src="/FREJFUND-logo.png" 
                  alt="FrejFund" 
                  className="h-10 sm:h-12 md:h-14 w-auto"
                />
              </div>
            </motion.div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/login'}
                className="px-3 sm:px-4 py-2 text-gray-600 hover:text-black text-xs sm:text-sm font-medium transition-colors"
              >
                Log in
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/vc'}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-black text-white rounded-full text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Investors
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="pt-20 sm:pt-24 flex items-center justify-center p-4 sm:p-8 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-xl"
        >
        {/* Welcome Screen */}
        {currentStep === -1 && renderWelcomeScreen()}

        {/* Regular wizard steps */}
        {currentStep >= 0 && (
          <>
            {/* Progress Dots */}
            <div className="flex justify-center space-x-2 sm:space-x-3 mb-8 sm:mb-12">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 sm:h-2.5 rounded-full transition-all duration-500 ${
                    index === currentStep
                      ? 'w-8 sm:w-10 bg-black'
                      : index < currentStep
                      ? 'w-2 sm:w-2.5 bg-gray-400'
                      : 'w-2 sm:w-2.5 bg-gray-200'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                />
              ))}
            </div>

            {/* Form Card */}
            <motion.div
          className="minimal-box minimal-box-shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6 sm:mb-10">
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xl sm:text-3xl font-semibold text-black mb-2 sm:mb-3 tracking-tight"
                >
                  {steps[currentStep].title}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm sm:text-lg text-gray-600 font-light"
                >
                  {steps[currentStep].subtitle}
                </motion.p>
              </div>

              <div className="space-y-6">
                {steps[currentStep].fields.map((field) => (
                  <motion.div 
                    key={field}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {renderField(field)}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 sm:mt-10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all ${
                currentStep === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:text-black hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Back
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={!canProceed()}
              className="relative px-6 sm:px-8 py-2.5 sm:py-3 bg-black text-white rounded-full text-xs sm:text-sm font-medium overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center">
                {currentStep === steps.length - 1 ? 'Start Analysis' : 'Continue'}
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gray-800"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </motion.button>
          </div>
        </motion.div>
          </>
        )}
        </motion.div>
      </div>
    </div>
  );
}
