import React from "react";

interface BookCoverProps {
  title: string;
  category?: string;
  theme?: {
    bg?: string;
    accent?: string;
    icon?: string;
    subtitle?: string;
    logo?: string;
    imageUrl?: string;
    cordelArt?: string | { themeName: string; elements: string[]; caption: string; };
  };
  variant?: "thumbnail" | "tilted-3d" | "flat-card";
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  title,
  theme,
  variant = "thumbnail",
  className = "",
}) => {
  const bg = theme?.bg || "linear-gradient(145deg, #333333 0%, #151515 100%)";
  const accent = theme?.accent || "#EAEAEA";
  const icon = theme?.icon || "sparkles";

  // Render icon graphic depending on icon name
  const renderIconGraphic = (size: number) => {
    switch (icon) {
      case "discord":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        );
      case "audacity":
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <svg width={size} height={size * 0.75} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
            <div style={{ width: size * 0.8, height: 3, background: "#ffca28", marginTop: 2, borderRadius: 2 }} />
          </div>
        );
      case "video":
      case "film":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" />
            <line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="17" x2="22" y2="17" />
            <line x1="17" y1="7" x2="22" y2="7" />
          </svg>
        );
      case "lightroom":
        return (
          <div
            style={{
              width: size,
              height: size,
              border: "2px solid #38bdf8",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: size * 0.46,
              color: "#38bdf8",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Lr
          </div>
        );
      case "illustrator":
        return (
          <div
            style={{
              width: size,
              height: size,
              border: "2px solid #ff9a00",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: size * 0.46,
              color: "#ff9a00",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Ai
          </div>
        );
      case "copywriter":
      case "quill":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
        );
      case "code":
      case "devops":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        );
      case "shield":
      case "security":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
    }
  };

  const cordelImg =
    theme?.imageUrl || (typeof theme?.cordelArt === "string" ? theme.cordelArt : undefined);

  // Thumbnail Variant for list rows (Image 1 style)
  if (variant === "thumbnail") {
    return (
      <div
        className={`book-thumbnail ${className}`}
        style={{
          width: 58,
          height: 74,
          borderRadius: "4px 6px 6px 4px",
          background: bg,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: "2px 4px 10px rgba(46, 25, 15, 0.22), inset 2px 0 4px rgba(255,255,255,0.15)",
          border: "1px solid rgba(46, 25, 15, 0.28)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: cordelImg ? 0 : "5px 4px 3px 7px",
        }}
      >
        {/* Book spine line effect */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: "linear-gradient(to right, rgba(0,0,0,0.7), rgba(255,255,255,0.15) 50%, rgba(0,0,0,0.4))",
            borderRight: "1px solid rgba(0,0,0,0.5)",
            zIndex: 3,
          }}
        />

        {cordelImg ? (
          <img
            src={cordelImg}
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: "contrast(1.08)",
            }}
          />
        ) : (
          <>
            {/* Top title text */}
            <div
              style={{
                fontSize: 7.5,
                fontWeight: 800,
                color: "#fff",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                paddingLeft: 2,
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              {title.split(" ")[0]}
            </div>

            {/* Center Logo/Icon Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: accent,
                margin: "auto 0",
              }}
            >
              {renderIconGraphic(22)}
            </div>

            {/* Bottom decorative illustration pattern strip */}
            <div
              style={{
                height: 14,
                background: "linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                padding: "0 2px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span style={{ width: 4, height: 6, background: accent, opacity: 0.8, borderRadius: 1 }} />
              <span style={{ width: 5, height: 8, background: "#ffca28", opacity: 0.9, borderRadius: 1 }} />
              <span style={{ width: 4, height: 5, background: "#4ade80", opacity: 0.8, borderRadius: 1 }} />
              <span style={{ width: 5, height: 7, background: "#f87171", opacity: 0.8, borderRadius: 1 }} />
            </div>
          </>
        )}
      </div>
    );
  }

  // 3D Tilted Variant for Modal (Image 2 style)
  return (
    <div
      className={`book-3d-wrapper ${className}`}
      style={{
        perspective: "800px",
        display: "inline-block",
      }}
    >
      <div
        className="book-3d"
        style={{
          width: 140,
          height: 185,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: "rotateY(-18deg) rotateX(8deg) rotateZ(3deg)",
          boxShadow: "-8px 12px 24px rgba(46, 25, 15, 0.28), -3px 5px 10px rgba(46, 25, 15, 0.16)",
          borderRadius: "5px 8px 8px 5px",
          background: bg,
          border: "1px solid rgba(46, 25, 15, 0.25)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: cordelImg ? 0 : "12px 10px 8px 16px",
          overflow: "hidden",
        }}
      >
        {/* Book spine lighting */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 8,
            background: "linear-gradient(to right, rgba(0,0,0,0.7), rgba(255,255,255,0.2) 50%, rgba(0,0,0,0.4))",
            borderRight: "1px solid rgba(0,0,0,0.5)",
            zIndex: 4,
          }}
        />

        {/* Paper pages depth effect on the right side */}
        <div
          style={{
            position: "absolute",
            right: -6,
            top: 4,
            bottom: 4,
            width: 6,
            background: "repeating-linear-gradient(to bottom, #d1d5db 0px, #d1d5db 1px, #9ca3af 2px, #f3f4f6 3px)",
            transform: "rotateY(90deg) translateZ(3px)",
            borderRadius: "0 2px 2px 0",
            opacity: 0.85,
            zIndex: 4,
          }}
        />

        {cordelImg ? (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <img
              src={cordelImg}
              alt={title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "contrast(1.08)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                padding: "16px 8px 6px 12px",
                fontSize: 10,
                fontWeight: 700,
                color: "#EAEAEA",
                textAlign: "left",
                letterSpacing: "0.02em",
              }}
            >
              Xilogravura Nordestina
            </div>
          </div>
        ) : (
          <>
            {/* Top title */}
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "0.03em",
                  lineHeight: 1.2,
                  fontFamily: "'Georgia', serif",
                  textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: 8.5,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                  marginTop: 3,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Playbook & Guide
              </div>
            </div>

            {/* Center Logo/Icon Feature */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: accent,
                margin: "auto 0",
                background: "rgba(0,0,0,0.25)",
                padding: 10,
                borderRadius: 8,
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4)",
              }}
            >
              {renderIconGraphic(44)}
            </div>

            {/* Bottom illustrated banner (folk art / figures style like screenshot) */}
            <div
              style={{
                background: "rgba(0,0,0,0.35)",
                borderRadius: 4,
                padding: "5px 6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
                <div style={{ width: 8, height: 16, background: "#f87171", borderRadius: 2 }} />
                <div style={{ width: 8, height: 20, background: "#60a5fa", borderRadius: 2 }} />
                <div style={{ width: 8, height: 14, background: "#fbbf24", borderRadius: 2 }} />
                <div style={{ width: 8, height: 18, background: "#34d399", borderRadius: 2 }} />
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                <div style={{ width: 7, height: 7, background: accent, borderRadius: 1 }} />
                <div style={{ width: 7, height: 7, background: "#fbbf24", borderRadius: 1 }} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
