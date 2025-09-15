"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import I18nProvider from '../components/I18nProvider';
import LanguageSwitcher from '../components/LanguageSwitcher';

function NotFoundContent() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center relative overflow-hidden">
      {/* Language Switcher */}
      <LanguageSwitcher />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Farm field background */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-200 to-green-100 opacity-30"></div>
        
        {/* Field rows */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="flex justify-between opacity-20">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-1 h-24 bg-green-400 opacity-50"></div>
            ))}
          </div>
        </div>

        {/* Confused farmer silhouette */}
        <div className="absolute bottom-16 left-8 opacity-30">
          <div className="relative">
            {/* Farmer body */}
            <div className="w-12 h-16 bg-gray-600 rounded-t-full relative">
              {/* Head */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gray-600 rounded-full">
                {/* Confused expression */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full"></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full"></div>
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-white rounded opacity-60"></div>
              </div>
              {/* Hat */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-gray-500 rounded-full"></div>
              {/* Arms */}
              <div className="absolute top-2 -left-2 w-3 h-8 bg-gray-600 rounded transform rotate-12"></div>
              <div className="absolute top-2 -right-2 w-3 h-8 bg-gray-600 rounded transform -rotate-12"></div>
            </div>
            {/* Legs */}
            <div className="flex justify-center space-x-1 mt-1">
              <div className="w-2 h-8 bg-gray-600 rounded"></div>
              <div className="w-2 h-8 bg-gray-600 rounded"></div>
            </div>
            {/* Question marks floating around farmer */}
            <div className="absolute -top-8 -right-2 text-gray-400 text-xl animate-bounce">?</div>
            <div className="absolute -top-6 -left-4 text-gray-400 text-lg animate-bounce delay-500">?</div>
            <div className="absolute -top-10 left-2 text-gray-400 text-sm animate-bounce delay-1000">?</div>
          </div>
        </div>

        {/* Farm tools scattered around */}
        <div className="absolute bottom-12 right-16 opacity-25">
          <div className="w-8 h-1 bg-amber-600 rounded transform rotate-45"></div>
          <div className="w-1 h-8 bg-amber-800 rounded transform -rotate-12 ml-3"></div>
        </div>

        {/* Animated leaves */}
        <div className="absolute top-10 left-10 w-16 h-16 opacity-20">
          <img 
            src="/images/leaf1.png" 
            alt="" 
            className="w-full h-full animate-bounce"
          />
        </div>
        <div className="absolute top-32 right-20 w-20 h-20 opacity-15">
          <img 
            src="/images/leaf2.png" 
            alt="" 
            className="w-full h-full animate-pulse"
          />
        </div>
        <div className="absolute bottom-20 left-32 w-14 h-14 opacity-25">
          <img 
            src="/images/leaf1.png" 
            alt="" 
            className="w-full h-full animate-bounce delay-1000"
          />
        </div>
        
        {/* Floating clouds */}
        <div className="absolute top-5 right-10 w-32 h-20 opacity-10">
          <img 
            src="/images/cloud1.png" 
            alt="" 
            className="w-full h-full animate-pulse delay-500"
          />
        </div>
        <div className="absolute bottom-10 right-5 w-28 h-18 opacity-15">
          <img 
            src="/images/cloud2.png" 
            alt="" 
            className="w-full h-full animate-bounce delay-700"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="text-center z-10 max-w-md mx-auto px-6">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-green-600 opacity-20 select-none">
            404
          </h1>
        </div>

        {/* HarvestHub Logo */}
        <div className="mb-8">
          <img 
            src="/images/harvesthub.png" 
            alt="HarvestHub" 
            className="h-16 mx-auto opacity-80"
          />
        </div>

        {/* Error message */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('notFound.title')}
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            {t('notFound.message')}
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <Link 
            href="/"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            {t('notFound.goHome')}
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200 border border-gray-300"
          >
            {t('notFound.goBack')}
          </button>
        </div>

        {/* Additional help text */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {t('notFound.helpText')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <I18nProvider>
      <NotFoundContent />
    </I18nProvider>
  );
}