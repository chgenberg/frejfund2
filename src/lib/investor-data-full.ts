// Complete investor database - 100 top VCs in Europe & Nordics
export const INVESTOR_SEED_DATA = [
  // Copy all the investor data here...
];

export const getInvestorsByStage = (stage: string) => {
  return INVESTOR_SEED_DATA.filter(inv => inv.stage.includes(stage));
};

export const getInvestorsByIndustry = (industry: string) => {
  return INVESTOR_SEED_DATA.filter(inv => inv.industries.includes(industry));
};

export const getInvestorsByGeography = (geo: string) => {
  return INVESTOR_SEED_DATA.filter(inv => inv.geographies.includes(geo));
};
