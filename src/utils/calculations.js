/**
 * Calculation helper functions for Apartment Bill Splitter
 */

/**
 * Split Water Bill (Su Faturası)
 * Formula: (Total Amount / Total Residents) * Apartment Residents count
 */
export function calculateWater(totalAmount, residents) {
  const totalCount = residents.reduce((sum, res) => sum + Number(res.count), 0);
  
  if (totalCount === 0) return residents.map(r => ({ ...r, share: 0, breakdown: {} }));

  return residents.map(res => {
    const share = (totalAmount / totalCount) * Number(res.count);
    return {
      ...res,
      share: Math.round(share * 100) / 100,
      breakdown: {
        residentsCount: res.count,
        perResident: Math.round((totalAmount / totalCount) * 100) / 100
      }
    };
  });
}

/**
 * Split Electricity Bill (Elektrik Faturası V2)
 * Formula:
 * - Common Pool (e.g. 10%): Divided equally among the 9 apartments
 * - Fixed Pool (e.g. 30%): Divided equally among the 9 apartments
 * - Personal Pool (e.g. 60%): Divided proportionally based on resident counts
 * 
 * Ratios are customizable but should default to 10%, 30%, 60% (ratios: { common: 10, fixed: 30, personal: 60 })
 */
export function calculateElectricity(totalAmount, residents, ratios = { common: 10, fixed: 30, personal: 60 }) {
  const numApartments = residents.length || 9;
  const totalResidents = residents.reduce((sum, res) => sum + Number(res.count), 0);
  
  const commonFraction = ratios.common / 100;
  const fixedFraction = ratios.fixed / 100;
  const personalFraction = ratios.personal / 100;

  const commonPool = totalAmount * commonFraction;
  const fixedPool = totalAmount * fixedFraction;
  const personalPool = totalAmount * personalFraction;

  const commonSharePerApartment = commonPool / numApartments;
  const fixedSharePerApartment = fixedPool / numApartments;

  return residents.map(res => {
    const personalShare = totalResidents > 0 
      ? (personalPool / totalResidents) * Number(res.count)
      : 0;
    
    const totalShare = commonSharePerApartment + fixedSharePerApartment + personalShare;

    return {
      ...res,
      share: Math.round(totalShare * 100) / 100,
      breakdown: {
        commonShare: Math.round(commonSharePerApartment * 100) / 100,
        fixedShare: Math.round(fixedSharePerApartment * 100) / 100,
        personalShare: Math.round(personalShare * 100) / 100,
        residentsCount: res.count
      }
    };
  });
}

/**
 * Split General Maintenance (Ortak Gider)
 * Formula: Divided equally among all 9 apartments
 */
export function calculateMaintenance(totalAmount, residents) {
  const numApartments = residents.length || 9;
  const share = totalAmount / numApartments;

  return residents.map(res => {
    return {
      ...res,
      share: Math.round(share * 100) / 100,
      breakdown: {
        perApartment: Math.round(share * 100) / 100
      }
    };
  });
}

/**
 * Main calculate dispatch function
 */
export function calculateBill({ type, totalAmount, residents, electricityRatios }) {
  const amount = parseFloat(totalAmount);
  if (isNaN(amount) || amount <= 0) {
    return residents.map(res => ({ ...res, share: 0, breakdown: {} }));
  }

  switch (type) {
    case 'water':
      return calculateWater(amount, residents);
    case 'electricity':
      return calculateElectricity(amount, residents, electricityRatios);
    case 'maintenance':
      return calculateMaintenance(amount, residents);
    default:
      return residents.map(res => ({ ...res, share: 0, breakdown: {} }));
  }
}
