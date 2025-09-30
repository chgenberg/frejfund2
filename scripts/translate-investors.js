const fs = require('fs');
const path = require('path');

/**
 * Translate Swedish investor descriptions to English
 */
function translateInvestors() {
  console.log('🌍 Translating investor data to English...\n');
  
  const dataPath = path.join(__dirname, '../src/lib/investor-data.ts');
  const content = fs.readFileSync(dataPath, 'utf8');
  
  const match = content.match(/export const INVESTOR_SEED_DATA = (\[[\s\S]+\]);/);
  if (!match) {
    console.error('❌ Could not parse investor data');
    return;
  }
  
  const investors = JSON.parse(match[1]);
  console.log(`📊 Loaded ${investors.length} investors`);
  
  let translatedCount = 0;
  
  investors.forEach(investor => {
    // Translate thesis if it contains Swedish
    if (investor.thesis && hasSwedish(investor.thesis)) {
      investor.thesis = translateText(investor.thesis);
      translatedCount++;
    }
    
    // Translate sweetSpot if it contains Swedish
    if (investor.sweetSpot && hasSwedish(investor.sweetSpot)) {
      investor.sweetSpot = translateText(investor.sweetSpot);
    }
    
    // Clean up notableInvestments (remove Swedish words)
    if (investor.notableInvestments && investor.notableInvestments.length > 0) {
      investor.notableInvestments = investor.notableInvestments.filter(name => 
        !hasSwedish(name) && name.length > 2 && /^[A-Z]/.test(name)
      );
    }
  });
  
  console.log(`✅ Translated ${translatedCount} descriptions\n`);
  
  // Save translated data
  const output = `// Swedish & European Venture Capital Database
// Auto-generated and translated to English
// Last updated: ${new Date().toISOString()}
// Total investors: ${investors.length}

export const INVESTOR_SEED_DATA = ${JSON.stringify(investors, null, 2)};

export const getInvestorsByStage = (stage: string) => {
  return INVESTOR_SEED_DATA.filter(inv => inv.stage.includes(stage));
};

export const getInvestorsByIndustry = (industry: string) => {
  return INVESTOR_SEED_DATA.filter(inv => inv.industries.includes(industry));
};

export const getInvestorsByGeography = (geo: string) => {
  return INVESTOR_SEED_DATA.filter(inv => inv.geographies.includes(geo));
};
`;
  
  fs.writeFileSync(dataPath, output);
  console.log(`✅ Saved translated data to: ${dataPath}`);
  console.log(`🎉 Done! All investor data is now in English`);
}

function hasSwedish(text) {
  const swedishWords = [
    'och', 'med', 'för', 'från', 'är', 'i', 'som', 'en', 'ett',
    'investerar', 'söker', 'letar', 'bolag', 'företag', 'venture',
    'fond', 'kapital', 'grundare', 'startup', 'tillväxt', 'skalbar',
    'Stockholmsbaserad', 'såddfond', 'branschagnostisk', 'förkärlek',
    'mjukvarudrivna', 'typisk', 'stöttar', 'erfarna', 'entreprenörer',
    'värdefulla', 'tillsammans', 'tidigare', 'framgångsrika'
  ];
  
  return swedishWords.some(word => text.toLowerCase().includes(word.toLowerCase()));
}

function translateText(text) {
  // Simple translation rules for common VC phrases
  const translations = {
    // Common words
    'och': 'and',
    'med': 'with',
    'för': 'for',
    'från': 'from',
    'är': 'is',
    'som': 'that',
    'en': 'a',
    'ett': 'a',
    'till': 'to',
    'av': 'by',
    
    // VC-specific
    'Stockholmsbaserad': 'Stockholm-based',
    'såddfond': 'seed fund',
    'investerar': 'invests',
    'söker': 'seeks',
    'letar efter': 'looking for',
    'bolag': 'companies',
    'företag': 'companies',
    'venture': 'venture',
    'venturefond': 'venture fund',
    'fond': 'fund',
    'kapital': 'capital',
    'grundare': 'founders',
    'startup': 'startup',
    'startups': 'startups',
    'tillväxt': 'growth',
    'skalbar': 'scalable',
    'affärsmodell': 'business model',
    'branschagnostisk': 'sector-agnostic',
    'förkärlek': 'preference',
    'mjukvarudrivna': 'software-driven',
    'typisk': 'typical',
    'initialinvestering': 'initial investment',
    'kring': 'around',
    'stöttar': 'supports',
    'erfarna': 'experienced',
    'entreprenörer': 'entrepreneurs',
    'värdefulla': 'valuable',
    'tillsammans': 'together',
    'tidigare': 'previous',
    'framgångsrika': 'successful',
    'leds': 'led',
    'nätverk': 'network',
    
    // Phrases
    'upp till': 'up to',
    'ibland upp till': 'sometimes up to',
    'Backas av': 'Backed by',
    'bygger': 'builds'
  };
  
  let translated = text;
  
  // Apply translations
  Object.entries(translations).forEach(([swedish, english]) => {
    const regex = new RegExp(swedish, 'gi');
    translated = translated.replace(regex, english);
  });
  
  // Clean up artifacts
  translated = translated
    .replace(/\[[\d\s]+\]/g, '') // Remove citation numbers [1][2]
    .replace(/\s{2,}/g, ' ') // Remove double spaces
    .trim();
  
  return translated;
}

// Run
translateInvestors();
