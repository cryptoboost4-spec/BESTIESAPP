/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your brand colors
        primary: '#FF69B4',      // Hot pink
        secondary: '#9370DB',    // Medium purple
        accent: '#FFB6C1',       // Light pink
        
        // Status colors
        success: '#4CAF50',      // Green
        warning: '#FFC107',      // Yellow
        danger: '#FF6B35',       // Orange (for emergency)
        
        // Text colors
        'text-primary': '#2D3748',
        'text-secondary': '#718096',
        'text-light': '#A0AEC0',
        
        // Background
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
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FF69B4 0%, #9370DB 100%)',
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
