const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

/**
 * Parse Swedish VC data from .docx and convert to structured JSON
 */
async function parseVCDocx() {
  const docxPath = path.join(__dirname, '../public/Sweden_vc.docx');
  const outputPath = path.join(__dirname, '../src/lib/investor-data-sweden.ts');

  console.log('📄 Reading Sweden_vc.docx...');

  try {
    // Extract text from .docx
    const result = await mammoth.extractRawText({ path: docxPath });
    const text = result.value;

    console.log('✅ Text extracted successfully');
    console.log(`📝 Document length: ${text.length} characters\n`);

    // Parse the text into structured investor data
    const investors = parseInvestorsFromText(text);

    console.log(`🎯 Parsed ${investors.length} investors\n`);

    // Create TypeScript export
    const tsContent = `// Auto-generated from Sweden_vc.docx
// Generated: ${new Date().toISOString()}
// Total investors: ${investors.length}

export const SWEDEN_VC_DATA = ${JSON.stringify(investors, null, 2)};

export const SWEDEN_VC_COUNT = ${investors.length};
`;

    fs.writeFileSync(outputPath, tsContent);
    console.log(`✅ TypeScript data saved to: ${outputPath}`);

    // Print first 3 samples
    console.log('\n📊 Sample investors:');
    investors.slice(0, 3).forEach((inv, i) => {
      console.log(`\n${i + 1}. ${inv.firmName || inv.name}`);
      console.log(`   Stage: ${inv.stage.join(', ')}`);
      console.log(`   Industries: ${inv.industries.join(', ')}`);
      console.log(`   Website: ${inv.website || 'N/A'}`);
    });

    console.log(`\n🎉 Done! Ready to merge into main investor database`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Parse investors from raw text using document structure
 */
function parseInvestorsFromText(text) {
  const investors = [];

  // The document structure appears to be:
  // VC-firma
  // Fokus & styrka
  // Vad de letar efter
  // Kontakt
  // Webbplats
  // [VC Name]
  // [Description]
  // [What they look for]
  // [Contact]
  // [Website]

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l);

  // Known headers to skip
  const headers = [
    'sverige',
    'sweden',
    'vc-firma',
    'fokus & styrka',
    'fokus',
    'styrka',
    'vad de letar efter',
    'kontakt',
    'webbplats',
    'portföljbolag',
    'investeringsfokus',
    'stage',
    'checkstorlek',
    'notable investments',
  ];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Skip headers and very short lines
    if (headers.some((h) => lowerLine === h) || line.length < 3) {
      i++;
      continue;
    }

    // Check if this looks like a VC firm name
    // Criteria: Capitalized, not too long, not a common word
    const looksLikeFirmName =
      line.length >= 3 &&
      line.length < 80 &&
      /^[A-ZÅÄÖ]/.test(line) &&
      !line.match(/^\d+\./) &&
      !looksLikeHeader(line) &&
      !line.includes('@') &&
      !line.startsWith('http');

    if (looksLikeFirmName) {
      const investor = {
        id: `sweden-vc-${investors.length + 1}`,
        name: line,
        firmName: line,
        type: 'vc',
        stage: [],
        industries: [],
        geographies: ['sweden', 'nordics'],
        notableInvestments: [],
        tags: ['sweden'],
        ranking: 90 - investors.length,
      };

      // Collect next 3-6 lines as description, contact, website
      let j = i + 1;
      let descriptionLines = [];

      while (j < lines.length && j < i + 10) {
        const nextLine = lines[j];

        // Stop at next firm name
        if (looksLikeFirmName && j > i + 1) {
          break;
        }

        // Extract website
        const urlMatch = nextLine.match(/(https?:\/\/[^\s]+|[\w-]+\.(?:com|se|co|vc|io|net))/i);
        if (urlMatch) {
          let url = urlMatch[0];
          if (!url.startsWith('http')) {
            url = 'https://' + url;
          }

          if (url.includes('linkedin.com')) {
            investor.linkedIn = url;
          } else if (url.includes('twitter.com') || url.includes('x.com')) {
            investor.twitter = url;
          } else {
            investor.website = url;
          }
        }

        // Extract email
        const emailMatch = nextLine.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) {
          investor.email = emailMatch[0];
        }

        // Extract stages
        extractStages(nextLine, investor);

        // Extract industries
        extractIndustries(nextLine, investor);

        // Extract money amounts
        extractFinancials(nextLine, investor);

        // Extract year
        const yearMatch = nextLine.match(/\b(19\d{2}|20\d{2})\b/);
        if (yearMatch && !investor.yearFounded) {
          const year = parseInt(yearMatch[1]);
          if (year >= 1980 && year <= 2025) {
            investor.yearFounded = year;
          }
        }

        // Extract portfolio companies
        if (
          nextLine.toLowerCase().includes('portfölj') ||
          nextLine.toLowerCase().includes('portfolio') ||
          nextLine.toLowerCase().includes('inkluderar') ||
          nextLine.toLowerCase().includes('investerat i')
        ) {
          const companies = extractCompanies(nextLine);
          investor.notableInvestments.push(...companies);
        }

        // Collect description
        if (
          nextLine.length > 40 &&
          nextLine.length < 800 &&
          !nextLine.match(/^(http|www|@)/) &&
          !headers.some((h) => nextLine.toLowerCase().includes(h))
        ) {
          descriptionLines.push(nextLine);
        }

        j++;
      }

      // Set thesis from collected descriptions
      if (descriptionLines.length > 0) {
        investor.thesis = descriptionLines[0];
        if (descriptionLines.length > 1) {
          investor.sweetSpot = descriptionLines[1];
        }
      }

      // Set defaults
      finalizeInvestor(investor);

      // Only add if it has meaningful data
      if (investor.website || investor.email || investor.thesis?.length > 50) {
        investors.push(investor);
        console.log(`✓ Parsed: ${investor.firmName}`);
      }

      i = j;
    } else {
      i++;
    }
  }

  return investors;
}

function looksLikeHeader(text) {
  const headers = [
    'fokus',
    'styrka',
    'letar efter',
    'kontakt',
    'webbplats',
    'portföljbolag',
    'investeringsfokus',
    'checkstorlek',
  ];
  return headers.some((h) => text.toLowerCase().includes(h)) && text.length < 50;
}

function extractStages(text, investor) {
  const stageMap = {
    'pre-seed': 'pre_seed',
    preseed: 'pre_seed',
    seed: 'seed',
    'serie a': 'series_a',
    'series a': 'series_a',
    'serie b': 'series_b',
    'series b': 'series_b',
    'serie c': 'series_c',
    'series c': 'series_c',
    growth: 'growth',
    tillväxt: 'growth',
  };

  Object.entries(stageMap).forEach(([keyword, stage]) => {
    if (text.toLowerCase().includes(keyword) && !investor.stage.includes(stage)) {
      investor.stage.push(stage);
    }
  });
}

function extractIndustries(text, investor) {
  const industryMap = {
    saas: 'saas',
    software: 'saas',
    fintech: 'fintech',
    finansiell: 'fintech',
    health: 'health tech',
    hälsa: 'health tech',
    medtech: 'health tech',
    deeptech: 'deep_tech',
    'deep tech': 'deep_tech',
    ai: 'ai',
    ml: 'ai',
    maskininlärning: 'ai',
    climate: 'sustainability',
    klimat: 'sustainability',
    hållbar: 'sustainability',
    marketplace: 'marketplace',
    marknadsplats: 'marketplace',
    consumer: 'consumer',
    konsument: 'consumer',
    gaming: 'gaming',
    spel: 'gaming',
    biotech: 'biotech',
    'life science': 'life_science',
  };

  Object.entries(industryMap).forEach(([keyword, industry]) => {
    if (text.toLowerCase().includes(keyword) && !investor.industries.includes(industry)) {
      investor.industries.push(industry);
    }
  });
}

function extractFinancials(text, investor) {
  // Extract fund size
  const moneyMatch = text.match(
    /[€\$]\s*(\d+(?:[,\s]\d+)?(?:\.\d+)?)\s*(miljard|miljon|billion|million|mdr|M|B)/i,
  );
  if (moneyMatch) {
    let amount = parseFloat(moneyMatch[1].replace(/[,\s]/g, ''));
    const unit = moneyMatch[2].toLowerCase();

    if (unit.includes('miljard') || unit.includes('billion') || unit === 'mdr' || unit === 'b') {
      amount *= 1000000000;
    } else if (unit.includes('miljon') || unit.includes('million') || unit === 'm') {
      amount *= 1000000;
    }

    // Convert EUR to USD (approximate 1 EUR = 1.1 USD)
    if (text.includes('€')) {
      amount *= 1.1;
    }

    if (!investor.fundSize || amount > investor.fundSize) {
      investor.fundSize = Math.round(amount);
    }
  }

  // Extract check size range
  const checkMatch = text.match(/(\d+)\s*-\s*(\d+)\s*(miljoner|MSEK|M)/i);
  if (checkMatch) {
    investor.checkSizeMin = parseInt(checkMatch[1]) * 1000000;
    investor.checkSizeMax = parseInt(checkMatch[2]) * 1000000;
  }
}

function extractCompanies(text) {
  // Extract company names (capitalized words, often separated by commas or 'och')
  const companies = [];

  // Pattern: Word1, Word2, Word3 eller Word4
  const matches = text.match(/[A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)*/g);
  if (matches) {
    matches.forEach((name) => {
      if (
        name.length >= 3 &&
        name.length < 30 &&
        !['Har', 'Söker', 'Via', 'Letar', 'Betonar'].includes(name)
      ) {
        companies.push(name);
      }
    });
  }

  return companies.slice(0, 10); // Max 10 portfolio companies
}

function finalizeInvestor(investor) {
  // Set defaults
  if (investor.stage.length === 0) {
    investor.stage = ['seed', 'series_a'];
  }

  if (investor.industries.length === 0) {
    investor.industries = ['saas'];
  }

  if (!investor.checkSizeMin) {
    investor.checkSizeMin = 500000;
  }

  if (!investor.checkSizeMax) {
    investor.checkSizeMax = 5000000;
  }

  if (!investor.portfolioCount) {
    investor.portfolioCount = investor.notableInvestments.length || 20;
  }

  if (!investor.dealsPerYear) {
    investor.dealsPerYear = 5;
  }

  if (!investor.thesis || investor.thesis.length < 20) {
    investor.thesis = `Swedish venture capital firm investing in ${investor.industries[0]} companies`;
  }

  if (!investor.sweetSpot) {
    investor.sweetSpot = `${investor.stage[0]} stage ${investor.industries[0]} companies`;
  }
}

// Run the script
parseVCDocx().catch(console.error);
