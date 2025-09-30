const fs = require('fs');
const path = require('path');

/**
 * Merge and clean investor data from multiple sources
 */
function mergeInvestors() {
  console.log('🔄 Merging investor databases...\n');
  
  // Load Sweden VC data
  const swedenPath = path.join(__dirname, '../src/lib/investor-data-sweden.ts');
  const swedenContent = fs.readFileSync(swedenPath, 'utf8');
  
  // Extract JSON from TypeScript file
  const jsonMatch = swedenContent.match(/export const SWEDEN_VC_DATA = (\[[\s\S]+\]);/);
  if (!jsonMatch) {
    console.error('❌ Could not parse Sweden VC data');
    return;
  }
  
  const swedenVCs = JSON.parse(jsonMatch[1]);
  console.log(`📊 Loaded ${swedenVCs.length} VCs from Sweden data`);
  
  // Load existing curated data
  const curatedPath = path.join(__dirname, '../src/lib/investor-data.ts');
  const curatedContent = fs.readFileSync(curatedPath, 'utf8');
  const curatedMatch = curatedContent.match(/export const INVESTOR_SEED_DATA = (\[[\s\S]+\]);/);
  
  let curatedVCs = [];
  if (curatedMatch) {
    // Remove comments before parsing JSON
    const jsonStr = curatedMatch[1].replace(/\/\/[^\n]*/g, '');
    try {
      curatedVCs = JSON.parse(jsonStr);
    } catch (e) {
      console.warn('⚠️  Could not parse curated data, using empty array');
    }
  }
  console.log(`📊 Loaded ${curatedVCs.length} curated VCs\n`);
  
  // Filter out invalid entries
  const countryHeaders = [
    'Sverige', 'Sweden', 'Danmark', 'Denmark', 'Norge', 'Norway',
    'Finland', 'Storbritannien', 'United Kingdom', 'Tyskland', 'Germany',
    'Frankrike', 'France', 'Nederländerna', 'Netherlands', 'Schweiz',
    'Switzerland', 'Spanien', 'Spain', 'Belgien', 'Belgium', 'Luxemburg',
    'Italien', 'Italy', 'Österrike', 'Austria', 'Irland', 'Ireland',
    'Tjeckien', 'Czech Republic', 'Estland', 'Estonia', 'Polen', 'Poland',
    'Portugal', 'Turkiet', 'Turkey', 'Bulgarien', 'Bulgaria'
  ];
  
  const cleanedSweden = swedenVCs.filter(vc => {
    // Remove country headers
    if (countryHeaders.includes(vc.name)) return false;
    
    // Remove if missing critical data
    if (!vc.firmName || vc.firmName.length < 2) return false;
    
    // Remove obvious noise
    if (vc.firmName.match(/^(Vad|Letar|Kontakt|Fokus|Webbplats)$/i)) return false;
    
    return true;
  });
  
  console.log(`✅ Cleaned: ${swedenVCs.length} → ${cleanedSweden.length} VCs\n`);
  
  // Merge with curated data (avoid duplicates)
  const curatedNames = new Set(curatedVCs.map(vc => vc.firmName?.toLowerCase()));
  
  const merged = [...curatedVCs];
  
  cleanedSweden.forEach(vc => {
    const name = vc.firmName.toLowerCase();
    
    if (!curatedNames.has(name)) {
      merged.push(vc);
      curatedNames.add(name);
    } else {
      console.log(`⏭️  Skipping duplicate: ${vc.firmName}`);
    }
  });
  
  console.log(`\n📊 Final count: ${merged.length} unique VCs`);
  
  // Sort by ranking
  merged.sort((a, b) => (b.ranking || 0) - (a.ranking || 0));
  
  // Save merged data
  const outputPath = path.join(__dirname, '../src/lib/investor-data-merged.ts');
  const content = `// Merged investor database
// Generated: ${new Date().toISOString()}
// Total investors: ${merged.length}

export const INVESTOR_SEED_DATA = ${JSON.stringify(merged, null, 2)};

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
  
  fs.writeFileSync(outputPath, content);
  console.log(`\n✅ Merged data saved to: ${outputPath}`);
  
  // Print breakdown by country
  const byCountry = {};
  merged.forEach(vc => {
    vc.geographies.forEach(geo => {
      byCountry[geo] = (byCountry[geo] || 0) + 1;
    });
  });
  
  console.log('\n📍 Geographic breakdown:');
  Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([geo, count]) => {
      console.log(`   ${geo}: ${count} VCs`);
    });
  
  console.log('\n🎉 Done! Use investor-data-merged.ts as your main investor database');
}

// Run
mergeInvestors();
