
export interface BiometricPoint {
    x: number;
    y: number;
    timestamp: number;
    pressure: number;
    tiltX?: number;
    tiltY?: number;
}

export interface ForensicReport {
    humanityScore: number; // 0-100
    entropy: number;
    velocityStability: number;
    rhythmScore: number;
    status: 'genuine' | 'suspicious' | 'forgery_risk' | 'low_data';
}

/**
 * ForensicService (Phase 5: Quantum Leap)
 * Analyzes signature dynamics using neural-inspired heuristics.
 * This differentiates Sovereign Sign by detecting robotically jittered or "too perfect" signatures.
 */
export class ForensicService {
    static analyzeDynamics(points: BiometricPoint[]): ForensicReport {
        if (points.length < 10) {
            return { humanityScore: 50, entropy: 0, velocityStability: 0, rhythmScore: 0, status: 'low_data' };
        }

        const velocities: number[] = [];
        const pressures: number[] = [];
        // let totalDistance = 0;

        for (let i = 1; i < points.length; i++) {
            // eslint-disable-next-line security/detect-object-injection
            const p1 = points[i - 1];
            // eslint-disable-next-line security/detect-object-injection
            const p2 = points[i];
            const dt = p2.timestamp - p1.timestamp;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            // const dist = Math.sqrt(dx * dx + dy * dy);

            if (dt > 0) {
                velocities.push(Math.sqrt(dx * dx + dy * dy) / dt);
            }
            pressures.push(p2.pressure);
            // totalDistance += dist;
        }

        // 1. Calculate Entropy (Variation in movement)
        const avgVel = velocities.reduce((a, b) => a + b, 0) / velocities.length;
        const velVariance = velocities.reduce((a, b) => a + Math.pow(b - avgVel, 2), 0) / velocities.length;
        const entropy = Math.min(100, (velVariance / (avgVel || 1)) * 500);

        // 2. Velocity Stability (Human-like acceleration/deceleration curves)
        // Humans aren't perfectly linear. Bots often are.
        const accels = [];
        for (let i = 1; i < velocities.length; i++) {
            // eslint-disable-next-line security/detect-object-injection
            accels.push(velocities[i] - velocities[i - 1]);
        }
        const avgAccel = accels.reduce((a, b) => a + Math.abs(b), 0) / accels.length;
        const velocityStability = Math.max(0, 100 - (avgAccel * 10));

        // 3. Rhythm (Pressure dynamics)
        const avgPressure = pressures.reduce((a, b) => a + b, 0) / pressures.length;
        const pressSdev = Math.sqrt(pressures.reduce((a, b) => a + Math.pow(b - avgPressure, 2), 0) / pressures.length);
        const rhythmScore = Math.min(100, pressSdev * 400);

        // Calculate Humanity Score (Heuristic Blend)
        // High score = complex human movement.
        // Extreme low = robotic/perfect. Extreme high = panicked/random.
        let humanityScore = (entropy * 0.4) + (velocityStability * 0.3) + (rhythmScore * 0.3);

        // Bot Detection: Too consistent or too perfectly timed
        const isTooPerfect = velocityStability > 98 && rhythmScore < 5;
        const isTooRandom = entropy > 90;

        let status: ForensicReport['status'] = 'genuine';
        if (isTooPerfect) {
            status = 'forgery_risk';
            humanityScore *= 0.2;
        } else if (isTooRandom) {
            status = 'suspicious';
            humanityScore *= 0.7;
        }

        return {
            humanityScore: Math.round(humanityScore),
            entropy: Number(entropy.toFixed(2)),
            velocityStability: Number(velocityStability.toFixed(2)),
            rhythmScore: Number(rhythmScore.toFixed(2)),
            status
        };
    }
}
