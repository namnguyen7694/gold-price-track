export const TROY_OUNCE_TO_GRAM = 31.1034768;
export const TAEL_TO_GRAM = 37.5;
export const CHI_TO_GRAM = 3.75;

/**
 * Converts World Gold Price (USD/oz) to VND/chỉ
 * @param usdPerOz World gold price in USD per Troy Ounce
 * @param usdToVnd Exchange rate USD/VND
 * @returns Gold price in VND per chỉ
 */
export function convertUsdOzToVndChi(usdPerOz: number, usdToVnd: number): number {
  const usdPerGram = usdPerOz / TROY_OUNCE_TO_GRAM;
  const usdPerChi = usdPerGram * CHI_TO_GRAM;
  return Math.round(usdPerChi * usdToVnd);
}

/**
 * Converts World Gold Price (USD/oz) to VND/lượng (tael)
 */
export function convertUsdOzToVndTael(usdPerOz: number, usdToVnd: number): number {
  const usdPerGram = usdPerOz / TROY_OUNCE_TO_GRAM;
  const usdPerTael = usdPerGram * TAEL_TO_GRAM;
  return Math.round(usdPerTael * usdToVnd);
}
