import { ATTENDANCE_CONFIG } from '../config/attendance.config.ts';

interface Factors {
    gpsVerified: boolean;
    qrVerified: boolean;
    ipVerified: boolean;
    photoVerified: boolean;
}

export const evaluateMFA = (factors: Factors): boolean => {
    const passedFactors = Object.values(factors).filter(f => f).length;
    return passedFactors >= ATTENDANCE_CONFIG.REQUIRED_FACTORS;
};
