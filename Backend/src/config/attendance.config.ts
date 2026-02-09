export const ATTENDANCE_CONFIG = {
    REQUIRED_FACTORS: 2,
    // Relaxed from 100m to 300m to account for building size and GPS drift
    MAX_DISTANCE_METERS: 300,
    // Relaxed from 80m to 500m because indoor GPS often has poor accuracy
    MAX_ACCURACY_METERS: 500,
    // Add known office IPs here. 
    // Example: ['192.168.1.1', '203.0.113.5']
    OFFICE_IP_RANGES: process.env.OFFICE_IP_RANGES
        ? process.env.OFFICE_IP_RANGES.split(',').map(ip => ip.trim())
        : [] as string[]
};
