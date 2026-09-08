import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        harcourts: {
          blue: "#00A1E9",
          navy: "#001D4A"
        }
      },
      boxShadow: {
        soft: "0 12px 30px rgba(0, 29, 74, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
