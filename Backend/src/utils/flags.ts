import { ATTENDANCE_CONFIG } from '../config/attendance.config.js';

interface SpoofCheckData {
    distanceMeters: number;
    gpsAccuracy: number;
}

export const detectSpoofing = (data: SpoofCheckData): { isSuspicious: boolean; reasons: string[] } => {
    const reasons: string[] = [];

    if (data.gpsAccuracy > ATTENDANCE_CONFIG.MAX_ACCURACY_METERS) {
        reasons.push('gps_accuracy_too_low');
    }

    if (data.distanceMeters > 200) {
        reasons.push('distance_out_of_range');
    }

    return {
        isSuspicious: reasons.length > 0,
        reasons
    };
};
