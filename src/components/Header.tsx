'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  showInvestorsButton?: boolean;
  rightContent?: React.ReactNode;
}

export default function Header({ showInvestorsButton = false, rightContent }: HeaderProps) {
  const router = useRouter();

  return (
    <motion.header 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100"
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
            onClick={() => router.push('/')}
            style={{ cursor: 'pointer' }}
          >
            <div className="relative">
              <img 
                src="/FREJFUND-logo.png" 
                alt="FrejFund" 
                className="h-10 sm:h-12 md:h-14 w-auto"
              />
            </div>
          </motion.div>
          
                {rightContent || (
                  showInvestorsButton && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/locations')}
                        className="px-3 sm:px-4 py-2 text-gray-600 hover:text-black text-xs sm:text-sm font-medium transition-colors hidden sm:block"
                      >
                        Locations
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/login')}
                        className="px-3 sm:px-4 py-2 text-gray-600 hover:text-black text-xs sm:text-sm font-medium transition-colors"
                      >
                        Log in
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/vc/login')}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-black text-white rounded-full text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
                      >
                        Investors
                      </motion.button>
                    </div>
                  )
                )}
        </div>
      </div>
    </motion.header>
  );
}
