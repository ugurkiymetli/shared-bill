/**
 * Computes weight, personDays, summaryText, and active status for a resident
 */
export function getResidentWeight(r) {
  if (r.entryMode === 'detailed' && Array.isArray(r.periods) && r.periods.length > 0) {
    const personDays = r.periods.reduce((sum, p) => {
      const days = Number(p.days) || 0;
      const count = Number(p.count) || 0;
      return sum + (days * count);
    }, 0);
    const totalDays = r.periods.reduce((sum, p) => sum + (Number(p.days) || 0), 0);
    const weight = personDays / 30; // normalized to 30 days
    const summaryText = r.periods.map(p => `${p.days}g x ${p.count}k`).join(' + ');
    const avgCount = (personDays / 30).toFixed(1).replace('.0', '');

    return {
      weight,
      personDays,
      totalDays,
      entryMode: 'detailed',
      isActive: personDays > 0,
      summaryText,
      avgCount,
      isVacation: personDays === 0
    };
  }

  // Simple mode
  const days = r.stayDays !== undefined ? r.stayDays : (r.isVacation ? 0 : 30);
  const count = Number(r.count) || 0;
  const personDays = days * count;
  const weight = (count * days) / 30;
  
  let summaryText = `${count} Kişi`;
  if (days === 0 || r.isVacation) {
    summaryText = 'Tatil';
  } else if (days < 30) {
    summaryText = `${count}k (${days}g)`;
  }

  return {
    weight,
    personDays,
    totalDays: days,
    entryMode: 'simple',
    isActive: weight > 0,
    summaryText,
    avgCount: count.toString(),
    isVacation: days === 0 || !!r.isVacation
  };
}

/**
 * Split Water Bill (Su Faturası)
 * Formula: (Total Amount / Total Weights) * Apartment Weight
 */
export function calculateWater(totalAmount, residents) {
  const parsedResidents = residents.map(r => {
    const info = getResidentWeight(r);
    return {
      ...r,
      ...info
    };
  });

  const totalWeight = parsedResidents.reduce((sum, res) => sum + res.weight, 0);
  
  return parsedResidents.map(res => {
    if (totalWeight === 0 || !res.isActive) {
      return {
        ...res,
        share: 0,
        breakdown: {
          residentsCount: 0,
          perResident: 0,
          isVacation: !res.isActive,
          summaryText: res.summaryText,
          personDays: res.personDays,
          entryMode: res.entryMode
        }
      };
    }
    const share = (totalAmount / totalWeight) * res.weight;
    return {
      ...res,
      share: Math.round(share * 100) / 100,
      breakdown: {
        residentsCount: res.avgCount,
        perResident: Math.round((totalAmount / totalWeight) * 100) / 100,
        isVacation: !res.isActive,
        summaryText: res.summaryText,
        personDays: res.personDays,
        entryMode: res.entryMode
      }
    };
  });
}

/**
 * Split Electricity Bill (Elektrik Faturası V2)
 * Formula:
 * - Common Pool (e.g. 10%): Divided equally among all apartments
 * - Fixed Pool (e.g. 30%): Divided equally among active apartments (weight > 0)
 * - Personal Pool (e.g. 60%): Divided proportionally based on stayDays & period weight
 */
export function calculateElectricity(totalAmount, residents, ratios = { common: 10, fixed: 30, personal: 60 }) {
  const numApartments = residents.length || 9;
  
  const parsedResidents = residents.map(r => {
    const info = getResidentWeight(r);
    return {
      ...r,
      ...info
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
        residentsCount: res.isActive ? res.avgCount : 0,
        isVacation: !res.isActive,
        summaryText: res.summaryText,
        personDays: res.personDays,
        entryMode: res.entryMode
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
    const info = getResidentWeight(res);
    return {
      ...res,
      share: Math.round(share * 100) / 100,
      breakdown: {
        perApartment: Math.round(share * 100) / 100,
        isVacation: !info.isActive,
        summaryText: info.summaryText
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
