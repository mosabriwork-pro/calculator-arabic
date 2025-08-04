'use client'

import { useState } from 'react'

export default function Navbar() {
  const [showSocialMenu, setShowSocialMenu] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [socialIconErrors, setSocialIconErrors] = useState<{[key: string]: boolean}>({})

  const socialLinks = [
    {
      name: 'يوتيوب',
      url: 'https://www.youtube.com/@mosabri1',
      icon: '/youtube.png',
      color: '#FF0000'
    },
    {
      name: 'انستغرام',
      url: 'https://instagram.com/mosabrii?utm_medium=copy_link',
      icon: '/instagram.png',
      color: '#E4405F'
    },
    {
      name: 'تيك توك',
      url: 'https://www.tiktok.com/@mosabrii1?_t=8V0EOrVs8Tx&_r=1&utm_medium=social&utm_source=heylink.me',
      icon: '/tiktok.png',
      color: '#000000'
    },
    {
      name: 'فيسبوك',
      url: 'https://www.facebook.com/mosabrii1/?utm_medium=social&utm_source=heylink.me',
      icon: '/facebook.png',
      color: '#1877F2'
    }
  ]

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'linear-gradient(135deg, rgba(26,71,42,0.95) 0%, rgba(45,80,22,0.95) 100%)',
      backdropFilter: 'blur(20px)',
      borderBottom: '2px solid rgba(255,255,255,0.1)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      <div className="navbar-container" style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '15px 30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Logo Section */}
        <div className="logo-section" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          flexShrink: 0
        }}>
          {/* Logo Container - Ready for Custom Logo */}
          <div className="logo-container" style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(34,197,94,0.3)',
            border: '2px solid rgba(255,255,255,0.2)',
            overflow: 'hidden'
          }}>
            {!logoError ? (
              <img 
                src="/logo.png?v=1" 
                alt="موصبري" 
                className="logo-image"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }} 
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="logo-fallback" style={{ 
                fontSize: '36px', 
                color: 'white',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}>
                ⚽
              </span>
            )}
          </div>
          
          <div>
            <h1 className="navbar-title" style={{
              fontSize: '24px',
              fontWeight: '900',
              color: 'white',
              margin: 0,
              background: 'linear-gradient(135deg, #ffffff 0%, #fbbf24 50%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              whiteSpace: 'nowrap'
            }}>
              موصبري | Mosabri
            </h1>
            <p className="navbar-subtitle" style={{
              fontSize: '12px',
              color: '#dcfce7',
              margin: 0,
              fontWeight: '500'
            }}>
              حاسبة لاعب كرة القدم
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="nav-buttons" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Social Media Dropdown */}
          <div style={{ position: 'relative', zIndex: 1002 }}>
            <button
              onClick={() => {
                setShowSocialMenu(!showSocialMenu);
              }}
              className="nav-button social-button"
              style={{
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                padding: '10px 20px',
                borderRadius: '25px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <span className="button-icon">📱</span>
              حساباتنا
              <span className="dropdown-arrow" style={{ 
                fontSize: '12px',
                transition: 'transform 0.3s ease',
                transform: showSocialMenu ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>▼</span>
            </button>

            {/* Dropdown Menu */}
            {showSocialMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '10px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
                borderRadius: '20px',
                boxShadow: '0 15px 30px rgba(0,0,0,0.3)',
                border: '2px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(20px)',
                minWidth: '250px',
                maxWidth: '300px',
                overflow: 'hidden',
                zIndex: 1002,
                animation: 'fadeIn 0.3s ease'
              }}>
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  تابعنا على
                </div>
                
                <div style={{ padding: '15px' }}>
                  {socialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        padding: '15px',
                        color: '#374151',
                        textDecoration: 'none',
                        borderRadius: '15px',
                        transition: 'all 0.3s ease',
                        marginBottom: '8px',
                        background: 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.8)'
                        e.currentTarget.style.transform = 'scale(1.02)'
                        e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.5)'
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {!socialIconErrors[link.name] ? (
                          <img 
                            src={link.icon}
                            alt={link.name}
                            style={{
                              width: '32px',
                              height: '32px',
                              objectFit: 'contain',
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                            }}
                            onError={() => setSocialIconErrors(prev => ({...prev, [link.name]: true}))}
                          />
                        ) : (
                          <span style={{
                            fontSize: '24px',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                          }}>
                            {link.name === 'يوتيوب' ? '▶️' : 
                             link.name === 'انستغرام' ? '📸' : 
                             link.name === 'تيك توك' ? '🎵' : '📘'}
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontWeight: '600',
                        fontSize: '16px'
                      }}>
                        {link.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Store Button */}
          <button
            className="nav-button store-button"
            style={{
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              padding: '10px 20px',
              borderRadius: '25px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
            onClick={() => {
              alert('المتجر الالكتروني قريباً!');
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span className="button-icon">🛒</span>
            المتجر الالكتروني
          </button>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {showSocialMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowSocialMenu(false)}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            .navbar-container {
              padding: 8px 15px !important;
              gap: 5px !important;
            }
            
            .logo-section {
              gap: 8px !important;
            }
            
            .logo-container {
              width: 35px !important;
              height: 35px !important;
              border-radius: 10px !important;
            }
            
            .logo-image {
              width: 35px !important;
              height: 35px !important;
            }
            
            .logo-fallback {
              font-size: 24px !important;
            }
            
            .nav-buttons {
              gap: 10px !important;
            }
            
            .nav-button {
              font-size: 14px !important;
              font-weight: 500 !important;
              padding: 8px 15px !important;
              border-radius: 20px !important;
            }
            
            .button-icon {
              font-size: 16px !important;
            }
            
            .dropdown-arrow {
              font-size: 10px !important;
            }
            
            .navbar-title {
              font-size: 18px !important;
              font-weight: 700 !important;
            }
            
            .navbar-subtitle {
              font-size: 10px !important;
              font-weight: 400 !important;
            }
          }
        `
      }} />
    </nav>
  )
} 