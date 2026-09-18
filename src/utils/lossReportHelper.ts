import {
  checkProcessLossAlert,
  getProcessLossColorClass,
  AlertRule,
} from '@/lib/api/alertmanagement';

export interface LossEvaluationResult {
  expectedLoss: number;
  actualLoss: number;
  diffLoss: number;
  colorClass: string;
  lossColorClass: string;
}

export const getStoredAlertRulesMap = (): Record<string, AlertRule[]> => {
  try {
    const saved = localStorage.getItem('chain_alert_management_settings_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {}
  return {};
};

export const evaluateLossDetails = (
  grossWtInput: any,
  purityInput: any,
  actualLossInput: any,
  arg4?: any,
  arg5?: any,
  arg6?: any,
): LossEvaluationResult => {
  // Parse gross weight safely (whether number, string, or object)
  let grossWt = 0;
  if (typeof grossWtInput === 'number') {
    grossWt = grossWtInput;
  } else if (typeof grossWtInput === 'string') {
    grossWt = parseFloat(grossWtInput) || 0;
  } else if (grossWtInput && typeof grossWtInput === 'object') {
    grossWt =
      Number(
        grossWtInput.chainGiven ||
          grossWtInput.chainWeight ||
          grossWtInput.fine ||
          grossWtInput.grossWeight ||
          grossWtInput.grosswt ||
          grossWtInput.weight ||
          0,
      ) || 0;
  }

  const purity = Number(purityInput) || 0;
  const actualLoss = Math.max(
    0,
    Math.round((Number(actualLossInput) || 0) * 1000) / 1000,
  );

  // Normalize polymorphic arguments:
  // Signature A: (gross, purity, loss, alertRules: AlertRule[], processName?: string)
  // Signature B: (gross, purity, loss, processName?: string, rawExpectedLoss?: number, alertRulesMap?: Record<string, AlertRule[]>)
  // Signature C: (gross, purity, loss, alertRulesMap: Record<string, AlertRule[]>, processName?: string)
  let directRules: AlertRule[] | undefined = undefined;
  let processName = '';
  let rawExpectedLoss: number | undefined = undefined;
  let rulesMap: Record<string, AlertRule[]> = {};

  if (Array.isArray(arg4)) {
    directRules = arg4;
    if (typeof arg5 === 'string') {
      processName = arg5;
    }
  } else if (typeof arg4 === 'string') {
    processName = arg4;
    if (typeof arg5 === 'number') {
      rawExpectedLoss = arg5;
    }
    if (arg6 && typeof arg6 === 'object' && !Array.isArray(arg6)) {
      rulesMap = arg6;
    }
  } else if (arg4 && typeof arg4 === 'object' && !Array.isArray(arg4)) {
    rulesMap = arg4;
    if (typeof arg5 === 'string') {
      processName = arg5;
    }
  }

  if (Object.keys(rulesMap).length === 0) {
    rulesMap = getStoredAlertRulesMap();
  }

  // Resolve rules to use
  let rules: AlertRule[] = [];
  if (directRules && directRules.length > 0) {
    rules = directRules;
  } else {
    const normProcess = (typeof processName === 'string' ? processName : '')
      .toLowerCase()
      .replace(/[^a-z]/g, '');

    if (normProcess.includes('tar')) rules = rulesMap.tar || [];
    else if (normProcess.includes('box')) rules = rulesMap.box || [];
    else if (normProcess.includes('cut')) rules = rulesMap.cutting || [];
    else if (normProcess.includes('kunda') || normProcess.includes('skunda'))
      rules = rulesMap.skunda || rulesMap.kunda || [];
    else if (normProcess.includes('melt')) rules = rulesMap.melting || [];
    else if (normProcess.includes('solder')) rules = rulesMap.soldering || [];
    else if (normProcess.includes('joint')) rules = rulesMap.joint || [];
    else {
      rules = Object.values(rulesMap).flat();
    }
  }

  // If no alert rules configured for this process, do not show expected loss (defaults to 0)
  if (!rules || rules.length === 0) {
    return {
      expectedLoss: 0,
      actualLoss,
      diffLoss: 0,
      colorClass: 'text-gray-500 dark:text-slate-400',
      lossColorClass: 'text-gray-500 dark:text-slate-400',
    };
  }

  const effectiveGross = grossWt > 0 ? grossWt : 100;
  const alertResult = checkProcessLossAlert(
    effectiveGross,
    purity,
    actualLoss,
    rules,
    true,
  );

  let expectedLoss = 0;
  let diffLoss = 0;
  let colorClass = 'text-gray-500 dark:text-slate-400';

  if (alertResult) {
    expectedLoss = alertResult.maxAllowedLoss || alertResult.baseLoss || 0;
    diffLoss =
      alertResult.diff ||
      (actualLoss > expectedLoss
        ? Math.round((actualLoss - expectedLoss) * 1000) / 1000
        : 0);
    colorClass = getProcessLossColorClass(alertResult);
  } else {
    expectedLoss = 0;
    diffLoss = 0;
    colorClass = 'text-gray-500 dark:text-slate-400';
  }

  return {
    expectedLoss: Math.round(expectedLoss * 1000) / 1000,
    actualLoss,
    diffLoss: Math.round(diffLoss * 1000) / 1000,
    colorClass,
    lossColorClass: colorClass,
  };
};
