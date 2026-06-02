import type { Config } from "tailwindcss";
​const config: Config = {
content: [
"./src/pages//*.{js,ts,jsx,tsx,mdx}",
"./src/components//.{js,ts,jsx,tsx,mdx}",
"./src/app/**/.{js,ts,jsx,tsx,mdx}"
],
theme: {
extend: {
colors: {
background: "#030712",
oracle: {
cyan: "#22d3ee",
purple: "#c084fc",
indigo: "#818cf8",
amber: "#fbbf24",
emerald: "#34d399",
blue: "#60a5fa"
}
},
animation: {
"pulse-slow": "pulse-slow 8s ease-in-out infinite",
"float": "float 6s ease-in-out infinite",
"orbit-slow": "orbit 24s linear infinite",
"orbit-reverse": "orbit 30s linear infinite reverse",
"glow-sweep": "glow-sweep 8s linear infinite",
"data-stream": "data-stream 2s infinite linear",
"scanline": "scanline 4s linear infinite",
"node-pulse": "node-pulse 4s infinite"
},
keyframes: {
"pulse-slow": {
"0%, 100%": { opacity: "0.3", transform: "scale(1)"},
"50%": { opacity: "0.6", transform: "scale(1.05)"}
},
"float": {
"0%, 100%": { transform: "translateY(0)"},
"50%": { transform: "translateY(-10px)"}
},
"orbit": {
"0%": { transform: "rotate(0deg)"},
"100%": { transform: "rotate(360deg)"}
},
"glow-sweep": {
"0%": { backgroundPosition: "200% center" },
"100%": { backgroundPosition: "-200% center" }
},
"data-stream": {
"0%": { transform: "translateY(0)", opacity: "0" },
"50%": { opacity: "1" },
"100%": { transform: "translateY(20px)", opacity: "0" }
},
"scanline": {
"0%": { transform: "translateY(-100%)", opacity: "0" },
"50%": { opacity: "0.1" },
"100%": { transform: "translateY(100%)", opacity: "0" }
},
"node-pulse": {
"0%, 100%": { boxShadow: "0 0 10px rgba(6, 182, 212, 0.2)" },
"50%": { boxShadow: "0 0 25px rgba(6, 182, 212, 0.6)"}
}
}
}
},
plugins: []
};
​export default config;
