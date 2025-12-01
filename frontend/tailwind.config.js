/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your brand colors (updated palette)
        primary: '#FF89C9',      // Softer pink
        secondary: '#A09EFF',    // Purple
        accent: '#F9D56B',       // Yellow accent
        
        // Status colors
        success: '#4CAF50',      // Green
        warning: '#FFC107',      // Yellow
        danger: '#FF6B35',       // Orange (for emergency)
        
        // Text colors (updated palette)
        'text-primary': '#654C75',  // Purple-gray
        'text-secondary': '#A996B8', // Light purple-gray
        'text-light': '#A0AEC0',
        
        // Background (updated palette)
        'background-light': '#FEF6FF',  // Very light pink
        'surface-light': '#FFFFFF',      // White
        'bg-pattern': '#FFF5F7',
        'bg-card': '#FFFFFF',
      },
      fontFamily: {
        display: ['Fredoka One', 'cursive'],
        body: ['Quicksand', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(255, 105, 180, 0.1), 0 2px 4px -1px rgba(255, 105, 180, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(255, 105, 180, 0.2), 0 4px 6px -2px rgba(255, 105, 180, 0.1)',
        'soft': '0 6px 20px 0 rgba(193, 169, 219, 0.25)',
        'inner-soft': 'inset 0 2px 8px 0 rgba(255, 255, 255, 0.8)',
        'soft-dreamy': '0 10px 25px -5px rgba(255, 182, 193, 0.3), 0 8px 10px -6px rgba(255, 182, 193, 0.2)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FF89C9 0%, #A09EFF 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #FFB6C1 0%, #DDA0DD 100%)',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-up': 'scaleUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
