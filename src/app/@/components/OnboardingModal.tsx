'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSelector } from 'react-redux';
import { submitOnboarding } from '../../services/Api/onboarding';

interface Interest {
  id: string;
  name: string;
  image: string;
}

export default function OnboardingModal() {
  const { data: session, status, update } = useSession();
  const reduxUser = useSelector((state: any) => state.user.user);
  const [gender, setGender] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/interests");
        setInterests(res.data);
      } catch (err) {
        console.error("Failed to fetch interests", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, []);


  useEffect(() => {
    console.log('=== ONBOARDING MODAL DEBUG ===');
    console.log('Session in OnboardingModal:', session);
    console.log('User data:', session?.user);
    console.log('Auth status:', status);
    console.log('Redux user:', reduxUser);
    console.log('ShowModal state:', showModal);
    console.log('Session keys:', session ? Object.keys(session) : 'No session');
    console.log('User keys:', session?.user ? Object.keys(session.user) : 'No user');
    
    // Check localStorage trực tiếp
    const localStorageUser = localStorage.getItem('user');
    console.log('LocalStorage user:', localStorageUser ? JSON.parse(localStorageUser) : 'No localStorage user');
    
    // Clear localStorage nếu user khác hoặc onboarded undefined
    if (localStorageUser) {
      const user = JSON.parse(localStorageUser);
      if (user.onboarded === undefined || user.onboarded === null) {
        console.log('Clearing localStorage with invalid onboarded status');
        localStorage.removeItem('user');
      }
    }
    
    // Không hiện modal khi đang loading
    if (status === 'loading') {
      console.log('Auth still loading, hiding modal');
      setShowModal(false);
      return;
    }
    
    // Check onboarded status từ NextAuth, Redux, hoặc localStorage
    let onboarded = null;
    let userEmail = null;
    
    if (status === 'authenticated' && session?.user) {
      // NextAuth session
      onboarded = (session.user as any).onboarded;
      userEmail = session.user.email;
      console.log('Using NextAuth session data');
    } else if (reduxUser) {
      // Redux store (login thường)
      onboarded = reduxUser.onboarded;
      userEmail = reduxUser.email;
      console.log('Using Redux store data');
    } else if (localStorageUser) {
      // LocalStorage (fallback)
      const user = JSON.parse(localStorageUser);
      onboarded = user.onboarded;
      userEmail = user.email;
      console.log('Using localStorage data');
    }
    
    console.log('Onboarded status:', onboarded);
    console.log('Onboarded type:', typeof onboarded);
    console.log('User email:', userEmail);
    
    // Chỉ hiển thị modal khi đã đăng nhập và chưa onboarded
    if ((status === 'authenticated' && session?.user) || reduxUser || localStorageUser) {
      if (onboarded === false || onboarded === null || onboarded === undefined) {
        console.log('Showing onboarding modal');
        setShowModal(true);
      } else {
        console.log('User already onboarded, hiding modal');
        setShowModal(false);
      }
    } else {
      console.log('Not authenticated yet, hiding modal. Status:', status);
      setShowModal(false);
    }
  }, [session?.user?.onboarded, session?.user?.email, status, reduxUser?.onboarded, reduxUser?.email]);

  const handleInterestToggle = (topicId: string) => {
    const isSelected = selectedInterests.includes(topicId);
    
    if (isSelected) {
      // Nếu đã chọn thì bỏ chọn
      setSelectedInterests(prev => prev.filter(id => id !== topicId));
    } else {
      // Nếu chưa chọn và chưa đạt giới hạn 3 topics
      if (setSelectedInterests.length < 3) {
        setSelectedInterests(prev => [...prev, topicId]);
      } else {
        // Đã đạt giới hạn 3 topics
        alert('Bạn chỉ có thể chọn tối đa 3 topics!');
      }
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && gender) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleImageLoad = (topicId: string) => {
    setImageLoadStates(prev => ({ ...prev, [topicId]: true }));
  };

  const handleSubmit = async () => {
    if (!gender.trim()) {
      alert('Please select your gender!');
      return;
    }
    
    if (setSelectedInterests.length === 0) {
      alert('Please select at least 1 topic!');
      return;
    }
    
    if (setSelectedInterests.length > 3) {
      alert('You can only select up to 3 topics!');
      return;
    }

    setLoading(true);
    try {
      // Debug log
      const requestData = {
        email: session?.user?.email || reduxUser?.email,
        gender: gender.trim(),
        topics: selectedInterests.join(','),
      };
      console.log('Onboarding request data:', requestData);
      
      // Gọi trực tiếp đến backend server
      await submitOnboarding(requestData);
      
      // Cập nhật localStorage để tránh modal hiện lại khi refresh
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        const updatedUser = {
          ...user,
          onboarded: true,
          gender: gender.trim(),
          topics: selectedInterests.join(',')
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('Updated localStorage user:', updatedUser);
      }
      
      // Show success animation
      setShowSuccess(true);
      
      // Wait for animation to complete then close modal
      setTimeout(async () => {
        try {
          const userEmail = session?.user?.email || reduxUser?.email;
          console.log('Refreshing user data for email:', userEmail);
          
          if (!userEmail) {
            console.log('No email found, closing modal');
            setShowModal(false);
            setShowSuccess(false);
            return;
          }
          
          // Gọi API để lấy thông tin user mới nhất
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
          });
          
          if (refreshResponse.ok) {
            const userData = await refreshResponse.json();
            console.log('Refreshed user data:', userData);
            
            if (userData.user && userData.user.onboarded === true) {
              console.log('User successfully onboarded, closing modal');
              // Force update session
              await update();
              setShowModal(false);
              setShowSuccess(false);
            } else {
              console.log('User still not onboarded, keeping modal open');
              setShowSuccess(false);
            }
          } else {
            const errorData = await refreshResponse.json().catch(() => ({}));
            console.log('Failed to refresh user data:', refreshResponse.status, errorData);
            // Vẫn đóng modal vì onboarding đã thành công
            setShowModal(false);
            setShowSuccess(false);
          }
        } catch (error) {
          console.error('Error updating session:', error);
          // Vẫn đóng modal vì onboarding đã thành công
          setShowModal(false);
          setShowSuccess(false);
        }
      }, 3000);
      
    } catch (err: any) {
      console.error('Onboarding failed:', err);
      
      // Show more specific error messages
      let errorMessage = 'An error occurred, please try again!';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-white flex justify-center items-center z-50 p-4">
      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-55">
          {/* Sparkles */}
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2000}ms`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
          
          <div className="bg-white rounded-3xl p-8 text-center animate-success-pulse shadow-2xl relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 via-orange-200 to-pink-200 opacity-20 animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Congratulations!</h2>
              <p className="text-gray-600">You have successfully completed onboarding</p>
              <div className="mt-4 text-sm text-gray-500 flex items-center justify-center">
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Redirecting...
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transition-all duration-500 ${
        showSuccess ? 'animate-fade-out scale-95 opacity-50' : ''
      }`}>

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-black text-white p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-center animate-float">Welcome!</h2>
            <p className="text-center text-gray-300 mt-2">Tell us more about yourself</p>
          </div>
          
                      {/* Progress Steps */}
            <div className="flex justify-center items-center mt-6 space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                currentStep >= 1 ? 'bg-white text-gray-800 scale-110 shadow-lg' : 'bg-white/30 text-white'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 rounded-full transition-all duration-500 ${
                currentStep >= 2 ? 'bg-white' : 'bg-white/30'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                currentStep >= 2 ? 'bg-white text-gray-800 scale-110 shadow-lg' : 'bg-white/30 text-white'
              }`}>
                2
              </div>
            </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {currentStep === 1 ? (
            // Step 1: Gender Selection
            <div className="space-y-6 animate-slide-in">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">You are...</h3>
                <p className="text-gray-600">Select your gender</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setGender('male');
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    gender === 'male'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-md'
                  }`}>
                  <div className="text-4xl mb-2 transition-transform duration-300 hover:scale-110 animate-bounce">👨</div>
                  <div className="font-semibold">Male</div>
                </button>
                
                <button
                  onClick={() => {
                    setGender('female');
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    gender === 'female'
                      ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-md'
                  }`}>
                  <div className="text-4xl mb-2 transition-transform duration-300 hover:scale-110 animate-bounce">👩</div>
                  <div className="font-semibold">Female</div>
                </button>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleNext}
                  disabled={!gender}
                  className="bg-gray-800 text-white px-8 py-3 rounded-xl font-semibold hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                                      <span className="flex items-center">
                      Next
                      <svg className="w-4 h-4 ml-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                </button>
              </div>
            </div>
          ) : (
            // Step 2: Topics Selection
            <div className="space-y-6 animate-scale-in">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Interests</h3>
                <p className="text-gray-600">Select interests you're interested in (choose up to 3)</p>
                <div className="mt-2 text-sm text-gray-500">
                  <span className={`font-medium ${selectedInterests.length >= 3 ? 'text-red-500' : 'text-blue-600'}`}>
                    {selectedInterests.length}/3 interests selected
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {interests.map((interest, index) => (
                  <button
                    key={interest.id}
                    onClick={() => handleInterestToggle(interest.id)}
                    disabled={!selectedInterests.includes(interest.id) && selectedInterests.length >= 3}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden group h-32 transform hover:scale-105 ${
                      selectedInterests.includes(interest.id)
                        ? 'border-gray-800 ring-2 ring-gray-200 shadow-lg'
                        : !selectedInterests.includes(interest.id) && selectedInterests.length >= 3
                        ? 'border-gray-200 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}>
                    
                    {/* Fallback Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300"></div>
                    
                    {/* Background Image */}
                    <img
                      src={interest.image}
                      alt={interest.name}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                        imageLoadStates[interest.id] ? 'opacity-100' : 'opacity-0'
                      } group-hover:scale-110`}
                      onLoad={() => handleImageLoad(interest.id)}
                      onError={() => {
                        console.log(`Failed to load image for ${interest.name}`);
                        handleImageLoad(interest.id);
                      }}
                      crossOrigin="anonymous"
                    />
                    
                    {/* Overlay */}
                    <div className={`absolute inset-0 transition-all duration-300 ${
                      imageLoadStates[interest.id] ? 'bg-black/30' : 'bg-transparent'
                    } group-hover:bg-black/20`}></div>
                    
                    {/* Content */}
                    <div className="relative z-10 text-center h-full flex flex-col items-center justify-center">
                      <div className={`font-semibold transition-all duration-300 ${
                        imageLoadStates[interest.id] ? 'text-white drop-shadow-lg scale-100' : 'text-gray-400 scale-90'
                      }`}>
                        {interest.name}
                      </div>
                      
                      {/* Checkmark */}
                      {selectedInterests.includes(interest.id) && (
                        <div 
                          className="absolute top-2 right-2 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handleBack}
                  className="text-gray-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </span>
                </button>
                
                <button
                  onClick={handleSubmit}
                  disabled={loading || selectedInterests.length === 0}
                  className="bg-gray-800 text-white px-8 py-3 rounded-xl font-semibold hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center">
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        Complete
                        <svg className="w-4 h-4 ml-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
