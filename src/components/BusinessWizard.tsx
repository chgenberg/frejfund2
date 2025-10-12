'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Upload, X, FileText, Globe, Linkedin, ChevronDown } from 'lucide-react';
import { BusinessInfo } from '@/types/business';
import { normalizeUrl, isValidUrl } from '@/lib/url-utils';

interface BusinessWizardProps {
  onComplete: (businessInfo: BusinessInfo) => void;
}

export default function BusinessWizard({ onComplete }: BusinessWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [businessInfo, setBusinessInfo] = useState<Partial<BusinessInfo>>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isScraping, setIsScraping] = useState(false);

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
        await fetch('/api/scrape/async', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ url, sessionId }) 
        });
        console.log(`Background scraping started for ${url}`);
      } catch (error) {
        console.error('Failed to start background scraping:', error);
      } finally { 
        setIsScraping(false); 
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [businessInfo.website]);

  const [uploadError, setUploadError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  
  const validateAndAddFiles = (files: File[]) => {
    setUploadError('');
    
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
    const MAX_FILES = 10;
    
    // Check file count
    if (uploadedFiles.length + files.length > MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }
    
    // Check individual file sizes
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File "${file.name}" is too large. Max size: 10MB`);
        return;
      }
    }
    
    // Check total size
    const currentTotal = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
    const newTotal = files.reduce((sum, f) => sum + f.size, 0);
    if (currentTotal + newTotal > MAX_TOTAL_SIZE) {
      setUploadError('Total upload size would exceed 50MB limit');
      return;
    }
    
    setUploadedFiles(prev => [...prev, ...files]);
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
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
      onComplete(completeInfo);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

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
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400"
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
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400"
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
            <input
              type="text"
              value={businessInfo.website || ''}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="yourcompany.com (http:// auto-added)"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400"
            />
          </div>
        );

      case 'stage':
        return (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Business Stage *
            </label>
            <div className="grid grid-cols-2 gap-3">
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
                className="w-full px-5 py-4 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black appearance-none cursor-pointer hover:bg-gray-100"
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
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400"
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
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400"
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
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400"
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
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400"
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
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400"
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
              <p className="text-sm text-gray-500">
                Any document type supported • PDF, Office, Apple (Keynote/Pages/Numbers), Images • Max 10MB
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.key,.pages,.numbers,.txt,.csv,.rtf,.png,.jpg,.jpeg"
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
                {uploadedFiles.map((file, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <FileText className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900 block">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          {Math.round(file.size / 1024).toLocaleString()} KB
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        {/* Progress Dots */}
        <div className="flex justify-center space-x-3 mb-12">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2.5 rounded-full transition-all duration-500 ${
                index === currentStep
                  ? 'w-10 bg-black'
                  : index < currentStep
                  ? 'w-2.5 bg-gray-400'
                  : 'w-2.5 bg-gray-200'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
            />
          ))}
        </div>

        {/* Form Card */}
        <motion.div
          className="bg-white rounded-3xl shadow-sm p-10"
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
              <div className="text-center mb-10">
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-3xl font-semibold text-black mb-3 tracking-tight"
                >
                  {steps[currentStep].title}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-gray-600 font-light"
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
          <div className="flex items-center justify-between mt-10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center px-6 py-3 rounded-full text-sm font-medium transition-all ${
                currentStep === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:text-black hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={!canProceed()}
              className="relative px-8 py-3 bg-black text-white rounded-full font-medium overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center">
                {currentStep === steps.length - 1 ? 'Start Analysis' : 'Continue'}
                <ChevronRight className="w-4 h-4 ml-1" />
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
      </motion.div>
    </div>
  );
}
