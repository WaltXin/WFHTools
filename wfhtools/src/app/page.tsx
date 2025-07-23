'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface CoinAnimation {
  id: number;
  x: number;
  y: number;
}

export default function Home() {
  const [salary, setSalary] = useState<string>('');
  const [paymentFrequency, setPaymentFrequency] = useState<'yearly' | 'monthly' | 'biweekly'>('yearly');
  const [isWorking, setIsWorking] = useState(false);
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const [coinAnimations, setCoinAnimations] = useState<CoinAnimation[]>([]);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const coinIdRef = useRef(0);

  // Calculate earnings per second
  const calculateEarningsPerSecond = () => {
    if (!salary || isNaN(Number(salary))) return 0;
    
    const salaryNum = Number(salary);
    let yearlyAmount = 0;
    
    switch (paymentFrequency) {
      case 'yearly':
        yearlyAmount = salaryNum;
        break;
      case 'monthly':
        yearlyAmount = salaryNum * 12;
        break;
      case 'biweekly':
        yearlyAmount = salaryNum * 26; // 26 bi-weekly periods in a year
        break;
    }
    
    // 52 weeks per year, 5 working days per week, 8 hours per day
    const workingSecondsPerYear = 52 * 5 * 8 * 60 * 60; // 52 weeks * 5 days * 8 hours * 60 min * 60 sec
    return yearlyAmount / workingSecondsPerYear;
  };

  const earningsPerSecond = calculateEarningsPerSecond();

  // Create coin drop animation
  const createCoinAnimation = useCallback(() => {
    if (!animationEnabled) return;
    
    const newCoins: CoinAnimation[] = [];
    
    // Create 100 coins at once
    for (let i = 0; i < 50; i++) {
      newCoins.push({
        id: coinIdRef.current++,
        x: Math.random() * (window.innerWidth - 120) + 60,
        y: -80 - (Math.random() * 200), // Spread them out vertically at start
      });
    }
    
    setCoinAnimations(prev => [...prev, ...newCoins]);
    
    // Play realistic coin drop sound using Web Audio API (only if animation is enabled)
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Create multiple oscillators for a richer coin sound
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const oscillator3 = audioContext.createOscillator();
      
      const gainNode1 = audioContext.createGain();
      const gainNode2 = audioContext.createGain();
      const gainNode3 = audioContext.createGain();
      const masterGain = audioContext.createGain();
      
      // Connect oscillators to gain nodes
      oscillator1.connect(gainNode1);
      oscillator2.connect(gainNode2);
      oscillator3.connect(gainNode3);
      
      gainNode1.connect(masterGain);
      gainNode2.connect(masterGain);
      gainNode3.connect(masterGain);
      masterGain.connect(audioContext.destination);
      
      // Create a realistic coin drop sound with multiple frequencies
      const startTime = audioContext.currentTime;
      
      // First oscillator - main coin ring
      oscillator1.frequency.setValueAtTime(1200, startTime);
      oscillator1.frequency.exponentialRampToValueAtTime(800, startTime + 0.1);
      oscillator1.frequency.exponentialRampToValueAtTime(600, startTime + 0.3);
      
      // Second oscillator - harmonic
      oscillator2.frequency.setValueAtTime(2400, startTime);
      oscillator2.frequency.exponentialRampToValueAtTime(1600, startTime + 0.1);
      oscillator2.frequency.exponentialRampToValueAtTime(1200, startTime + 0.3);
      
      // Third oscillator - lower frequency for depth
      oscillator3.frequency.setValueAtTime(600, startTime);
      oscillator3.frequency.exponentialRampToValueAtTime(400, startTime + 0.1);
      oscillator3.frequency.exponentialRampToValueAtTime(300, startTime + 0.3);
      
      // Set gain envelopes for realistic coin sound
      gainNode1.gain.setValueAtTime(0.4, startTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.2, startTime + 0.1);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      gainNode2.gain.setValueAtTime(0.2, startTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.1, startTime + 0.1);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      gainNode3.gain.setValueAtTime(0.3, startTime);
      gainNode3.gain.exponentialRampToValueAtTime(0.15, startTime + 0.1);
      gainNode3.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);
      
      masterGain.gain.setValueAtTime(0.6, startTime);
      masterGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      
      // Start and stop oscillators
      oscillator1.start(startTime);
      oscillator2.start(startTime);
      oscillator3.start(startTime);
      
      oscillator1.stop(startTime + 0.5);
      oscillator2.stop(startTime + 0.4);
      oscillator3.stop(startTime + 0.45);
      
    } catch {
      // Fallback if Web Audio API fails
      console.log('Audio playback not available');
    }
    
    // Remove animation after 10 second (much faster)
    setTimeout(() => {
      setCoinAnimations(prev => prev.filter(coin => !newCoins.some(newCoin => newCoin.id === coin.id)));
    }, 10000);
  }, [animationEnabled]);

  // Start/stop work timer
  useEffect(() => {
    if (isWorking && earningsPerSecond > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentEarnings(prev => {
          const newEarnings = prev + earningsPerSecond;
          
          // Check if we've earned another 10 yuan
          const currentTens = Math.floor(newEarnings / 10);
          const previousTens = Math.floor(prev / 10);
          
          if (currentTens > previousTens) {
            createCoinAnimation();
          }
          
          return newEarnings;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isWorking, earningsPerSecond, createCoinAnimation]);



  const resetEarnings = () => {
    setCurrentEarnings(0);
    setIsWorking(false);
    setCoinAnimations([]);
  };

  // Toggle animation and clear existing coins when disabled
  const toggleAnimation = () => {
    const newState = !animationEnabled;
    setAnimationEnabled(newState);
    if (!newState) {
      // Clear all existing coin animations when disabled
      setCoinAnimations([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 relative overflow-hidden">
      {/* Coin Animations */}
      {animationEnabled && coinAnimations.map((coin) => (
        <div
          key={coin.id}
          className="fixed z-50 pointer-events-none"
          style={{
            left: coin.x,
            top: coin.y,
            animation: 'coinDropFast 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
          }}
        >
                     <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-2xl shadow-2xl border-2 border-yellow-200"
                style={{
                  animation: 'coinSpinFast 0.4s linear infinite, coinBounceFast 0.4s ease-out forwards',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }}>
            💰
          </div>
        </div>
      ))}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Work From Home Tracker
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Watch your income grow in real-time while you work! 💼✨
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-8">
          {/* Salary Input Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
                Enter Your Salary
              </label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="50000"
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-700 dark:text-white transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
                Payment Frequency
              </label>
              <select
                value={paymentFrequency}
                onChange={(e) => setPaymentFrequency(e.target.value as 'yearly' | 'monthly' | 'biweekly')}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
                <option value="biweekly">Bi-weekly</option>
              </select>
            </div>
          </div>

          {/* Earnings Display */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-2xl p-8 mb-6">
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                Current Earnings Today
              </h2>
                             <div className="text-6xl font-bold text-green-600 dark:text-green-400 mb-2">
                 ${currentEarnings.toFixed(4)}
               </div>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => setIsWorking(!isWorking)}
                disabled={!salary || earningsPerSecond === 0}
                className={`px-8 py-4 text-xl font-semibold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isWorking
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                }`}
              >
                {isWorking ? '⏸️ Stop Working' : '▶️ Start Working'}
              </button>
              
              <button
                onClick={resetEarnings}
                className="px-8 py-4 text-xl font-semibold bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                🔄 Reset
              </button>
              
              <button
                onClick={toggleAnimation}
                className={`px-8 py-4 text-xl font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg ${
                  animationEnabled
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {animationEnabled ? '🎬 Animation ON' : '🔇 Animation OFF'}
              </button>
            </div>
          </div>

          
        </div>

      </div>

      <style jsx>{`
        @keyframes coinDropFast {
          0% {
            transform: translateY(-80px);
            opacity: 1;
          }
          30% {
            transform: translateY(600px);
            opacity: 1;
          }
          50% {
            transform: translateY(400px);
            opacity: 1;
          }
          65% {
            transform: translateY(550px);
            opacity: 1;
          }
          75% {
            transform: translateY(480px);
            opacity: 0.8;
          }
          85% {
            transform: translateY(520px);
            opacity: 0.6;
          }
          95% {
            transform: translateY(500px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(510px);
            opacity: 0;
          }
        }
        
        @keyframes coinSpinFast {
          0% {
            transform: rotateY(0deg) scale(1);
          }
          25% {
            transform: rotateY(180deg) scale(0.7);
          }
          50% {
            transform: rotateY(360deg) scale(1);
          }
          75% {
            transform: rotateY(540deg) scale(0.7);
          }
          100% {
            transform: rotateY(720deg) scale(1);
          }
        }
        
        @keyframes coinBounceFast {
          0% {
            transform: scale(1);
          }
          30% {
            transform: scale(1.3);
          }
          50% {
            transform: scale(0.8);
          }
          65% {
            transform: scale(1.1);
          }
          75% {
            transform: scale(0.9);
          }
          85% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
