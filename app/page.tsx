"use client"

import { Search, Settings, Play, Plus, ChevronLeft, ChevronRight, Flame, Sparkles } from "lucide-react"
import { useState } from "react"

const featuredDrama = {
  title: "I Made a Deal with the Future",
  subtitle: "我与未来做交易",
  episode: "Episode 1",
}

const rankingDramas = [
  { id: 1, title: "After Being Hurt by a Scumbag" },
  { id: 2, title: "Oops, My Cat Princess Identity" },
  { id: 3, title: "Different Names, Same Love" },
  { id: 4, title: "After the Storm" },
]

const newReleases = [
  { id: 1, title: "Daddy, You Got the Wrong Mommy" },
  { id: 2, title: "Secret Romance" },
  { id: 3, title: "Love in the City" },
  { id: 4, title: "Destined Hearts" },
]

const tabs = ["All", "Ranking", "Micro", "New", "Trending"]

export default function ReeLeeDesignPage() {
  const [activeTab, setActiveTab] = useState("All")

  return (
    <div 
      style={{ 
        minHeight: "100vh",
        backgroundColor: "#08080c",
        color: "white",
        maxWidth: "430px",
        margin: "0 auto",
        position: "relative",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}
    >
      {/* Status bar */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        padding: "12px 24px 8px"
      }}>
        <span style={{ fontSize: "14px", fontWeight: 500 }}>03:04</span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "12px" }}>SOS</span>
          <span style={{ opacity: 0.6 }}>●●○</span>
          <div style={{ 
            width: "24px", 
            height: "12px", 
            border: "1px solid rgba(255,255,255,0.6)", 
            borderRadius: "3px",
            padding: "1px",
            marginLeft: "4px"
          }}>
            <div style={{ width: "50%", height: "100%", backgroundColor: "rgba(255,255,255,0.6)", borderRadius: "2px" }} />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ padding: "8px 16px 16px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ 
            flex: 1, 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            backgroundColor: "#16151f",
            borderRadius: "16px",
            padding: "12px 16px",
            border: "1px solid rgba(37, 35, 54, 0.5)"
          }}>
            <Search style={{ width: "20px", height: "20px", color: "#6b6788" }} />
            <input
              type="text"
              placeholder="Search dramas..."
              style={{ 
                backgroundColor: "transparent", 
                border: "none", 
                outline: "none",
                color: "rgba(255,255,255,0.9)",
                fontSize: "14px",
                flex: 1
              }}
            />
          </div>
          <button style={{ 
            width: "44px", 
            height: "44px", 
            borderRadius: "12px",
            backgroundColor: "#16151f",
            border: "1px solid rgba(37, 35, 54, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}>
            <Settings style={{ width: "20px", height: "20px", color: "#c9a87c" }} />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ padding: "0 16px 16px", display: "flex", gap: "4px" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 500,
              borderRadius: "24px",
              border: "none",
              backgroundColor: "transparent",
              color: activeTab === tab ? "#c9a87c" : "#6b6788",
              cursor: "pointer",
              position: "relative"
            }}
          >
            {tab}
            {activeTab === tab && (
              <div style={{ 
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "20px",
                height: "2px",
                background: "linear-gradient(to right, #c9a87c, #d4b896)",
                borderRadius: "2px"
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Featured Banner */}
      <div style={{ padding: "0 16px 24px" }}>
        <div style={{ 
          position: "relative",
          borderRadius: "24px",
          overflow: "hidden",
          aspectRatio: "16/10",
          backgroundColor: "#1e1d2a"
        }}>
          {/* Gradient overlay */}
          <div style={{ 
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, #08080c 0%, rgba(8,8,12,0.4) 50%, transparent 100%)",
            zIndex: 1
          }} />
          
          {/* Placeholder for image */}
          <div style={{ 
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #2a2940 0%, #1a1928 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span style={{ color: "#6b6788", fontSize: "14px" }}>Featured Image</span>
          </div>
          
          {/* Navigation Arrows */}
          <button style={{ 
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 20,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}>
            <ChevronLeft style={{ width: "20px", height: "20px", color: "rgba(255,255,255,0.8)" }} />
          </button>
          <button style={{ 
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 20,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}>
            <ChevronRight style={{ width: "20px", height: "20px", color: "rgba(255,255,255,0.8)" }} />
          </button>

          {/* Content */}
          <div style={{ 
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "20px",
            zIndex: 20
          }}>
            <h2 style={{ 
              fontSize: "20px", 
              fontWeight: 600, 
              marginBottom: "4px",
              letterSpacing: "-0.02em"
            }}>
              {featuredDrama.title}
            </h2>
            <p style={{ 
              fontSize: "14px", 
              color: "rgba(255,255,255,0.5)", 
              marginBottom: "16px" 
            }}>
              {featuredDrama.subtitle} · {featuredDrama.episode}
            </p>
            
            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button style={{ 
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px",
                background: "linear-gradient(to right, #c9a87c, #d4b896)",
                borderRadius: "24px",
                border: "none",
                color: "#1a1714",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(201,168,124,0.3)"
              }}>
                <Play style={{ width: "16px", height: "16px", fill: "currentColor" }} />
                Watch
              </button>
              <button style={{ 
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                backgroundColor: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
                borderRadius: "24px",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.9)",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer"
              }}>
                <Plus style={{ width: "16px", height: "16px" }} />
                My List
              </button>
            </div>
          </div>

          {/* Pagination Dots */}
          <div style={{ 
            position: "absolute",
            bottom: "20px",
            right: "20px",
            zIndex: 20,
            display: "flex",
            gap: "6px"
          }}>
            <div style={{ width: "20px", height: "6px", borderRadius: "3px", backgroundColor: "#c9a87c" }} />
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.3)" }} />
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.3)" }} />
          </div>
        </div>
      </div>

      {/* Ranking Section */}
      <div style={{ paddingBottom: "24px" }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px", 
          padding: "0 16px", 
          marginBottom: "16px" 
        }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em" }}>Ranking</h3>
          <div style={{ 
            width: "20px", 
            height: "20px", 
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ff6b35, #f7931e)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Flame style={{ width: "12px", height: "12px", color: "white" }} />
          </div>
        </div>
        
        <div style={{ 
          display: "flex", 
          gap: "12px", 
          padding: "0 16px",
          overflowX: "auto"
        }}>
          {rankingDramas.map((drama, index) => (
            <div key={drama.id} style={{ flexShrink: 0, width: "140px", cursor: "pointer" }}>
              <div style={{ 
                position: "relative",
                borderRadius: "16px",
                overflow: "hidden",
                marginBottom: "8px",
                aspectRatio: "3/4",
                backgroundColor: "#16151f"
              }}>
                {/* Rank Badge */}
                <div style={{ 
                  position: "absolute",
                  top: "8px",
                  left: "8px",
                  zIndex: 10,
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#c9a87c" }}>{index + 1}</span>
                </div>
                
                {/* Placeholder */}
                <div style={{ 
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #1e1d2a, #16151f)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <span style={{ color: "#6b6788", fontSize: "12px" }}>Cover</span>
                </div>
              </div>
              <p style={{ 
                fontSize: "14px", 
                color: "rgba(255,255,255,0.8)", 
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical"
              }}>
                {drama.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* New Releases Section */}
      <div style={{ paddingBottom: "120px" }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px", 
          padding: "0 16px", 
          marginBottom: "16px" 
        }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em" }}>New Releases</h3>
          <div style={{ 
            width: "20px", 
            height: "20px", 
            borderRadius: "50%",
            background: "linear-gradient(135deg, #c9a87c, #9b7f5a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Sparkles style={{ width: "12px", height: "12px", color: "white" }} />
          </div>
        </div>
        
        <div style={{ 
          display: "flex", 
          gap: "12px", 
          padding: "0 16px",
          overflowX: "auto"
        }}>
          {newReleases.map((drama) => (
            <div key={drama.id} style={{ flexShrink: 0, width: "140px", cursor: "pointer" }}>
              <div style={{ 
                position: "relative",
                borderRadius: "16px",
                overflow: "hidden",
                marginBottom: "8px",
                aspectRatio: "3/4",
                backgroundColor: "#16151f"
              }}>
                {/* New Badge */}
                <div style={{ 
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  zIndex: 10,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: "linear-gradient(to right, #c9a87c, #d4b896)",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#1a1714",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  New
                </div>
                
                {/* Placeholder */}
                <div style={{ 
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #1e1d2a, #16151f)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <span style={{ color: "#6b6788", fontSize: "12px" }}>Cover</span>
                </div>
              </div>
              <p style={{ 
                fontSize: "14px", 
                color: "rgba(255,255,255,0.8)", 
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical"
              }}>
                {drama.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{ 
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: "430px",
        margin: "0 auto",
        zIndex: 50
      }}>
        <div style={{ 
          backgroundColor: "rgba(13, 12, 20, 0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(37, 35, 54, 0.3)",
          padding: "8px 8px 32px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {[
              { icon: "dramas", label: "Dramas", active: true },
              { icon: "list", label: "My List", active: false },
              { icon: "shorts", label: "Shorts", active: false },
              { icon: "rewards", label: "Rewards", active: false },
              { icon: "me", label: "Me", active: false },
            ].map((item) => (
              <button
                key={item.label}
                style={{ 
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: item.active ? "#c9a87c" : "#6b6788",
                  cursor: "pointer"
                }}
              >
                {item.icon === "dramas" && <Play style={{ width: "24px", height: "24px", fill: item.active ? "#c9a87c" : "none" }} />}
                {item.icon === "list" && (
                  <svg style={{ width: "24px", height: "24px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                )}
                {item.icon === "shorts" && (
                  <svg style={{ width: "24px", height: "24px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                )}
                {item.icon === "rewards" && (
                  <svg style={{ width: "24px", height: "24px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5h-18a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5z" />
                  </svg>
                )}
                {item.icon === "me" && (
                  <svg style={{ width: "24px", height: "24px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )}
                <span style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.02em" }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Home Indicator */}
        <div style={{ 
          position: "absolute",
          bottom: "8px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "128px",
          height: "4px",
          backgroundColor: "rgba(255,255,255,0.2)",
          borderRadius: "2px"
        }} />
      </div>
    </div>
  )
}
