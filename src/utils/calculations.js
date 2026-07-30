/**
 * Calculation helper functions for Apartment Bill Splitter
 */

/**
 * Split Water Bill (Su Faturası)
 * Formula: (Total Amount / Total Residents) * Apartment Residents count
 */
export function calculateWater(totalAmount, residents) {
  const weights = residents.map(r => {
    const days = r.stayDays !== undefined ? r.stayDays : (r.isVacation ? 0 : 30);
    return {
      ...r,
      weight: Number(r.count) * (days / 30),
      days
    };
  });
  const totalWeight = weights.reduce((sum, res) => sum + res.weight, 0);
  
  return weights.map(res => {
    if (totalWeight === 0) {
      return {
        ...res,
        share: 0,
        breakdown: {
          residentsCount: 0,
          perResident: 0,
          isVacation: res.days === 0,
          stayDays: res.days
        }
      };
    }
    const share = (totalAmount / totalWeight) * res.weight;
    return {
      ...res,
      share: Math.round(share * 100) / 100,
      breakdown: {
        residentsCount: res.count,
        perResident: Math.round((totalAmount / totalWeight) * 100) / 100,
        isVacation: res.days === 0,
        stayDays: res.days
      }
    };
  });
}

/**
 * Split Electricity Bill (Elektrik Faturası V2)
 * Formula:
 * - Common Pool (e.g. 10%): Divided equally among all apartments
 * - Fixed Pool (e.g. 30%): Divided equally among active apartments (stayDays > 0)
 * - Personal Pool (e.g. 60%): Divided proportionally based on stayDays count weight (count * stayDays / 30)
 */
export function calculateElectricity(totalAmount, residents, ratios = { common: 10, fixed: 30, personal: 60 }) {
  const numApartments = residents.length || 9;
  
  const parsedResidents = residents.map(r => {
    const days = r.stayDays !== undefined ? r.stayDays : (r.isVacation ? 0 : 30);
    return {
      ...r,
      days,
      isActive: days > 0,
      weight: Number(r.count) * (days / 30)
    };
  });

  const activeApartments = parsedResidents.filter(r => r.isActive);
  const numActiveApartments = activeApartments.length;
  const totalWeight = parsedResidents.reduce((sum, res) => sum + res.weight, 0);
  
  const commonFraction = ratios.common / 100;
  const fixedFraction = ratios.fixed / 100;
  const personalFraction = ratios.personal / 100;

  const commonPool = totalAmount * commonFraction;
  const fixedPool = totalAmount * fixedFraction;
  const personalPool = totalAmount * personalFraction;

  const commonSharePerApartment = commonPool / numApartments;
  const fixedSharePerActiveApartment = numActiveApartments > 0 ? fixedPool / numActiveApartments : 0;

  return parsedResidents.map(res => {
    const fixedShare = res.isActive ? fixedSharePerActiveApartment : 0;
    const personalShare = (res.isActive && totalWeight > 0)
      ? (personalPool / totalWeight) * res.weight
      : 0;
    
    const totalShare = commonSharePerApartment + fixedShare + personalShare;

    return {
      ...res,
      share: Math.round(totalShare * 100) / 100,
      breakdown: {
        commonShare: Math.round(commonSharePerApartment * 100) / 100,
        fixedShare: Math.round(fixedShare * 100) / 100,
        personalShare: Math.round(personalShare * 100) / 100,
        residentsCount: res.days === 0 ? 0 : res.count,
        isVacation: res.days === 0,
        stayDays: res.days
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
