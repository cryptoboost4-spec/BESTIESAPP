// Illustrated Background Patterns with Actual Graphics
// SVG-based patterns that show real themed elements

export const ILLUSTRATED_BACKGROUNDS = {
  // 🌿 PLANT MOM - Actual plant illustrations
  plantMom: [
    {
      id: 'monstera-jungle',
      name: 'Monstera Jungle',
      category: 'plantMom',
      baseColor: '#E8F5E9',
      accentColor: '#4A7C59',
      svg: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="monstera" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <!-- Monstera Leaf -->
            <path d="M30,20 Q40,15 50,20 L55,40 Q50,50 40,45 Q35,50 30,45 L25,40 Q30,25 30,20 Z"
                  fill="#81C784" opacity="0.3"/>
            <ellipse cx="40" cy="35" rx="3" ry="5" fill="#66BB6A" opacity="0.4"/>
            <ellipse cx="35" cy="35" rx="2" ry="4" fill="#66BB6A" opacity="0.4"/>
            <ellipse cx="45" cy="35" rx="2" ry="4" fill="#66BB6A" opacity="0.4"/>

            <!-- Second leaf offset -->
            <path d="M70,60 Q80,55 90,60 L95,80 Q90,90 80,85 Q75,90 70,85 L65,80 Q70,65 70,60 Z"
                  fill="#4CAF50" opacity="0.25"/>
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#monstera)"/>
      </svg>`,
      description: 'Lush monstera leaves'
    },
    {
      id: 'potted-plants',
      name: 'Potted Paradise',
      category: 'plantMom',
      baseColor: '#FFF3E0',
      accentColor: '#8D6E63',
      svg: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="pots" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <!-- Terracotta Pot -->
            <rect x="25" y="50" width="30" height="25" rx="2" fill="#D4A574" opacity="0.4"/>
            <polygon points="25,50 40,45 55,50" fill="#C9A98D" opacity="0.4"/>

            <!-- Plant stems -->
            <line x1="35" y1="45" x2="35" y2="35" stroke="#4CAF50" stroke-width="2" opacity="0.5"/>
            <line x1="40" y1="45" x2="40" y2="30" stroke="#66BB6A" stroke-width="2" opacity="0.5"/>
            <line x1="45" y1="45" x2="45" y2="38" stroke="#4CAF50" stroke-width="2" opacity="0.5"/>

            <!-- Leaves -->
            <ellipse cx="35" cy="32" rx="4" ry="6" fill="#81C784" opacity="0.5"/>
            <ellipse cx="40" cy="27" rx="5" ry="7" fill="#66BB6A" opacity="0.5"/>
            <ellipse cx="45" cy="35" rx="4" ry="5" fill="#4CAF50" opacity="0.5"/>
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#pots)"/>
      </svg>`,
      description: 'Cute potted plants'
    },
    {
      id: 'hanging-vines',
      name: 'Hanging Garden',
      category: 'plantMom',
      baseColor: '#F1F8E9',
      accentColor: '#558B2F',
      svg: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="vines" x="0" y="0" width="60" height="100" patternUnits="userSpaceOnUse">
            <!-- Hanging vine -->
            <path d="M20,0 Q25,20 20,30 Q15,40 20,50 Q25,60 20,70 Q15,80 20,90"
                  stroke="#689F38" stroke-width="2" fill="none" opacity="0.3"/>
            <!-- Leaves along vine -->
            <ellipse cx="20" cy="15" rx="5" ry="3" fill="#7CB342" opacity="0.4" transform="rotate(20 20 15)"/>
            <ellipse cx="20" cy="35" rx="5" ry="3" fill="#8BC34A" opacity="0.4" transform="rotate(-20 20 35)"/>
            <ellipse cx="20" cy="55" rx="5" ry="3" fill="#7CB342" opacity="0.4" transform="rotate(15 20 55)"/>
            <ellipse cx="20" cy="75" rx="5" ry="3" fill="#689F38" opacity="0.4" transform="rotate(-15 20 75)"/>

            <!-- Second vine offset -->
            <path d="M45,10 Q40,30 45,40 Q50,50 45,60 Q40,70 45,80"
                  stroke="#7CB342" stroke-width="2" fill="none" opacity="0.25"/>
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#vines)"/>
      </svg>`,
      description: 'Cascading green vines'
    },
    {
      id: 'succulents',
      name: 'Succulent Garden',
      category: 'plantMom',
      baseColor: '#E8F5E9',
      accentColor: '#66BB6A',
      svg: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="succulents" x="0" y="0" width="70" height="70" patternUnits="userSpaceOnUse">
            <!-- Succulent rosette -->
            <circle cx="35" cy="35" r="12" fill="#81C784" opacity="0.3"/>
            <ellipse cx="35" cy="28" rx="6" ry="8" fill="#66BB6A" opacity="0.4"/>
            <ellipse cx="42" cy="35" rx="6" ry="8" fill="#4CAF50" opacity="0.4" transform="rotate(60 42 35)"/>
            <ellipse cx="28" cy="35" rx="6" ry="8" fill="#66BB6A" opacity="0.4" transform="rotate(-60 28 35)"/>
            <ellipse cx="35" cy="42" rx="6" ry="8" fill="#81C784" opacity="0.4" transform="rotate(180 35 42)"/>
            <circle cx="35" cy="35" r="4" fill="#A5D6A7" opacity="0.5"/>
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#succulents)"/>
      </svg>`,
      description: 'Geometric succulents'
    }
  ],

  // 🐱 CAT LOVER - Actual cat illustrations
  catLover: [
    {
      id: 'cat-silhouettes',
      name: 'Cat Silhouettes',
      category: 'catLover',
      baseColor: '#FFF9C4',
      accentColor: '#5D4037',
      svg: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cats" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <!-- Sitting cat -->
            <path d="M30,50 Q25,45 25,40 L23,35 Q25,33 27,35 L30,30 L33,35 Q35,33 37,35 L35,40 Q35,45 30,50 L32,60 Q30,65 28,60 Z"
                  fill="#6D4C41" opacity="0.25"/>
            <!-- Tail -->
            <path d="M32,60 Q40,65 45,55" stroke="#6D4C41" stroke-width="3" fill="none" opacity="0.25"/>

            <!-- Walking cat -->
            <ellipse cx="70" cy="65" rx="12" ry="8" fill="#5D4037" opacity="0.2"/>
            <circle cx="75" cy="58" r="8" fill="#5D4037" opacity="0.2"/>
            <!-- Ears -->
            <polygon points="70,52 72,58 68,58" fill="#5D4037" opacity="0.2"/>
            <polygon points="78,52 80,58 76,58" fill="#5D4037" opacity="0.2"/>
            <!-- Tail -->
            <path d="M82,65 Q90,60 88,70" stroke="#5D4037" stroke-width="2.5" fill="none" opacity="0.2"/>
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#cats)"/>
      </svg>`,
      description: 'Cute cat silhouettes'
    },
    {
      id: 'paw-prints',
      name: 'Paw Prints',
      category: 'catLover',
      baseColor: '#FFF8E1',
      accentColor: '#FF6F00',
      svg: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="paws" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <!-- Paw print -->
            <ellipse cx="40" cy="50" rx="8" ry="10" fill="#FF8F00" opacity="0.25"/>
            <circle cx="33" cy="40" r="4" fill="#FF8F00" opacity="0.25"/>
            <circle cx="40" cy="38" r="4" fill="#FF8F00" opacity="0.25"/>
            <circle cx="47" cy="40" r="4" fill="#FF8F00" opacity="0.25"/>
            <circle cx="35" cy="35" r="3" fill="#FF8F00" opacity="0.25"/>

            <!-- Second paw rotated -->
            <g transform="rotate(30 65 25)">
              <ellipse cx="65" cy="30" rx="6" ry="8" fill="#FFA726" opacity="0.2"/>
              <circle cx="60" cy="22" r="3" fill="#FFA726" opacity="0.2"/>
              <circle cx="65" cy="20" r="3" fill="#FFA726" opacity="0.2"/>
              <circle cx="70" cy="22" r="3" fill="#FFA726" opacity="0.2"/>
            </g>
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#paws)"/>
      </svg>`,
      description: 'Scattered paw prints'
    }
  ],

  // ☕ COFFEE - Actual coffee illustrations
  coffee: [
    {
      id: 'coffee-cups',
      name: 'Coffee Cups',
      category: 'coffee',
      baseColor: '#FFF8E1',
      accentColor: '#5D4037',
      svg: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cups" x="0" y="0" width="90" height="90" patternUnits="userSpaceOnUse">
            <!-- Coffee cup -->
            <path d="M30,40 L35,60 L55,60 L60,40 Z" fill="#8D6E63" opacity="0.3"/>
            <ellipse cx="45" cy="40" rx="15" ry="5" fill="#6D4C41" opacity="0.3"/>
            <!-- Steam -->
            <path d="M38,35 Q40,28 38,22" stroke="#A1887F" stroke-width="1.5" fill="none" opacity="0.4"/>
            <path d="M45,33 Q47,26 45,20" stroke="#A1887F" stroke-width="1.5" fill="none" opacity="0.4"/>
            <path d="M52,35 Q54,28 52,22" stroke="#A1887F" stroke-width="1.5" fill="none" opacity="0.4"/>
            <!-- Handle -->
            <path d="M60,45 Q68,45 68,50 Q68,55 60,55" stroke="#8D6E63" stroke-width="2" fill="none" opacity="0.3"/>

            <!-- Coffee beans -->
            <ellipse cx="25" cy="70" rx="4" ry="6" fill="#6D4C41" opacity="0.25"/>
            <line x1="25" y1="67" x2="25" y2="73" stroke="#4E342E" stroke-width="1" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#cups)"/>
      </svg>`,
      description: 'Steaming coffee cups'
    },
    {
      id: 'coffee-beans',
      name: 'Coffee Beans',
      category: 'coffee',
      baseColor: '#EFEBE9',
      accentColor: '#3E2723',
      svg: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="beans" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <!-- Coffee bean 1 -->
            <ellipse cx="20" cy="20" rx="6" ry="9" fill="#5D4037" opacity="0.3" transform="rotate(30 20 20)"/>
            <path d="M17,16 Q20,20 17,24" stroke="#4E342E" stroke-width="1.5" fill="none" opacity="0.4"/>

            <!-- Coffee bean 2 -->
            <ellipse cx="45" cy="35" rx="5" ry="8" fill="#6D4C41" opacity="0.25" transform="rotate(-20 45 35)"/>
            <path d="M43,30 Q45,35 43,40" stroke="#4E342E" stroke-width="1.5" fill="none" opacity="0.35"/>

            <!-- Coffee bean 3 -->
            <ellipse cx="30" cy="50" rx="6" ry="9" fill="#5D4037" opacity="0.28" transform="rotate(60 30 50)"/>
            <path d="M27,46 Q30,50 27,54" stroke="#4E342E" stroke-width="1.5" fill="none" opacity="0.38"/>
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#beans)"/>
      </svg>`,
      description: 'Roasted coffee beans'
    }
  ],

  // 🦋 BUTTERFLIES - Actual butterfly illustrations
  butterflies: [
    {
      id: 'butterfly-garden',
      name: 'Butterfly Garden',
      category: 'butterflies',
      baseColor: '#FCE4EC',
      accentColor: '#E91E63',
      svg: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="butterflies" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <!-- Butterfly -->
            <g transform="translate(50,50)">
              <!-- Body -->
              <ellipse cx="0" cy="0" rx="2" ry="8" fill="#C2185B" opacity="0.4"/>
              <!-- Upper wings -->
              <ellipse cx="-8" cy="-5" rx="10" ry="8" fill="#F48FB1" opacity="0.3" transform="rotate(-30 -8 -5)"/>
              <ellipse cx="8" cy="-5" rx="10" ry="8" fill="#F48FB1" opacity="0.3" transform="rotate(30 8 -5)"/>
              <!-- Lower wings -->
              <ellipse cx="-7" cy="5" rx="8" ry="6" fill="#F8BBD0" opacity="0.3" transform="rotate(-20 -7 5)"/>
              <ellipse cx="7" cy="5" rx="8" ry="6" fill="#F8BBD0" opacity="0.3" transform="rotate(20 7 5)"/>
              <!-- Wing spots -->
              <circle cx="-8" cy="-5" r="2" fill="#E91E63" opacity="0.4"/>
              <circle cx="8" cy="-5" r="2" fill="#E91E63" opacity="0.4"/>
            </g>

            <!-- Smaller butterfly -->
            <g transform="translate(25,75) scale(0.7)">
              <ellipse cx="0" cy="0" rx="2" ry="6" fill="#C2185B" opacity="0.3"/>
              <ellipse cx="-6" cy="-4" rx="8" ry="6" fill="#F48FB1" opacity="0.25"/>
              <ellipse cx="6" cy="-4" rx="8" ry="6" fill="#F48FB1" opacity="0.25"/>
            </g>
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#butterflies)"/>
      </svg>`,
      description: 'Delicate butterflies'
    }
  ],

  // 🌸 FLOWERS - Actual flower illustrations
  flowers: [
    {
      id: 'wildflowers',
      name: 'Wildflower Meadow',
      category: 'flowers',
      baseColor: '#FFF9C4',
      accentColor: '#F06292',
      svg: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="wildflowers" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <!-- Flower 1 - 5 petals -->
            <circle cx="40" cy="40" r="4" fill="#FDD835" opacity="0.4"/>
            <circle cx="40" cy="30" r="5" fill="#F06292" opacity="0.3"/>
            <circle cx="48" cy="36" r="5" fill="#F48FB1" opacity="0.3"/>
            <circle cx="46" cy="46" r="5" fill="#F06292" opacity="0.3"/>
            <circle cx="34" cy="46" r="5" fill="#F8BBD0" opacity="0.3"/>
            <circle cx="32" cy="36" r="5" fill="#F06292" opacity="0.3"/>

            <!-- Stem -->
            <line x1="40" y1="44" x2="40" y2="60" stroke="#81C784" stroke-width="2" opacity="0.3"/>

            <!-- Small flower -->
            <circle cx="20" cy="25" r="3" fill="#FFD54F" opacity="0.35"/>
            <circle cx="20" cy="20" r="3" fill="#FF4081" opacity="0.25"/>
            <circle cx="24" cy="23" r="3" fill="#FF4081" opacity="0.25"/>
            <circle cx="16" cy="23" r="3" fill="#FF4081" opacity="0.25"/>
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#wildflowers)"/>
      </svg>`,
      description: 'Blooming wildflowers'
    }
  ]
};

// Helper to get all illustrated backgrounds
export const getAllIllustratedBackgrounds = () => {
  return Object.values(ILLUSTRATED_BACKGROUNDS).flat();
};

// Helper to get illustrated backgrounds by category
export const getIllustratedBackgroundsByCategory = (category) => {
  return ILLUSTRATED_BACKGROUNDS[category] || [];
};

// Convert SVG to data URI for use in CSS
export const getSvgDataUri = (svg) => {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
};

// Generate gradient with SVG overlay
export const getIllustratedBackgroundStyle = (background) => {
  if (!background) return {};

  const dataUri = getSvgDataUri(background.svg);

  return {
    background: `
      linear-gradient(135deg, ${background.baseColor} 0%, ${background.accentColor}15 100%),
      url("${dataUri}")
    `,
    backgroundSize: 'cover, 200px 200px',
    backgroundPosition: 'center, center',
    backgroundRepeat: 'no-repeat, repeat'
  };
};
