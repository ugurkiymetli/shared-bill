/**
 * Calculation helper functions for Apartment Bill Splitter
 */

/**
 * Split Water Bill (Su Faturası)
 * Formula: (Total Amount / Total Residents) * Apartment Residents count
 */
/**
 * Split Water Bill (Su Faturası)
 * Formula: (Total Amount / Total Residents) * Apartment Residents count (vacation shares are 0)
 */
export function calculateWater(totalAmount, residents) {
  const activeResidents = residents.filter(r => !r.isVacation);
  const totalCount = activeResidents.reduce((sum, res) => sum + Number(res.count), 0);
  
  return residents.map(res => {
    if (res.isVacation || totalCount === 0) {
      return {
        ...res,
        share: 0,
        breakdown: {
          residentsCount: 0,
          perResident: 0,
          isVacation: true
        }
      };
    }
    const share = (totalAmount / totalCount) * Number(res.count);
    return {
      ...res,
      share: Math.round(share * 100) / 100,
      breakdown: {
        residentsCount: res.count,
        perResident: Math.round((totalAmount / totalCount) * 100) / 100,
        isVacation: false
      }
    };
  });
}

/**
 * Split Electricity Bill (Elektrik Faturası V2)
 * Formula:
 * - Common Pool (e.g. 10%): Divided equally among all apartments
 * - Fixed Pool (e.g. 30%): Divided equally among all apartments
 * - Personal Pool (e.g. 60%): Divided proportionally based on active resident counts
 */
export function calculateElectricity(totalAmount, residents, ratios = { common: 10, fixed: 30, personal: 60 }) {
  const numApartments = residents.length || 9;
  const activeResidents = residents.filter(r => !r.isVacation);
  const numActiveApartments = activeResidents.length;
  const totalResidents = activeResidents.reduce((sum, res) => sum + Number(res.count), 0);
  
  const commonFraction = ratios.common / 100;
  const fixedFraction = ratios.fixed / 100;
  const personalFraction = ratios.personal / 100;

  const commonPool = totalAmount * commonFraction;
  const fixedPool = totalAmount * fixedFraction;
  const personalPool = totalAmount * personalFraction;

  const commonSharePerApartment = commonPool / numApartments;
  const fixedSharePerActiveApartment = numActiveApartments > 0 ? fixedPool / numActiveApartments : 0;

  return residents.map(res => {
    const fixedShare = !res.isVacation ? fixedSharePerActiveApartment : 0;
    const personalShare = (!res.isVacation && totalResidents > 0)
      ? (personalPool / totalResidents) * Number(res.count)
      : 0;
    
    const totalShare = commonSharePerApartment + fixedShare + personalShare;

    return {
      ...res,
      share: Math.round(totalShare * 100) / 100,
      breakdown: {
        commonShare: Math.round(commonSharePerApartment * 100) / 100,
        fixedShare: Math.round(fixedShare * 100) / 100,
        personalShare: Math.round(personalShare * 100) / 100,
        residentsCount: res.isVacation ? 0 : res.count,
        isVacation: !!res.isVacation
      }
    };
  });
}

/**
 * Split General Maintenance (Ortak Gider)
 * Formula: Divided equally among all apartments
 */
export function calculateMaintenance(totalAmount, residents) {
  const numApartments = residents.length || 9;
  const share = totalAmount / numApartments;

  return residents.map(res => {
    return {
      ...res,
      share: Math.round(share * 100) / 100,
      breakdown: {
        perApartment: Math.round(share * 100) / 100,
        isVacation: !!res.isVacation
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
