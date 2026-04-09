export type AuthFactor = 'webauthn' | 'fingerprint' | 'face' | 'iris' | 'retina' | 'behavior' | 'voice' | 'signature' | 'password';

const factorWeights: Record<AuthFactor, number> = {
  webauthn: 1.0,
  fingerprint: 1.0, 
  face: 0.9,
  iris: 1.0,
  retina: 1.0,
  password: 0.8,
  signature: 0.7,
  behavior: 0.6,
  voice: 0.5
};

/**
 * Enterprise Trust Score Engine
 * Evaluates the confidence of the current session based on layered factor inputs.
 */
export function evaluateTrustScore(factors: AuthFactor[]): { score: number; allowed: boolean; recommendedAction: 'ALLOW' | 'STEP_UP_AUTH' | 'DENY' } {
  // Prevent duplicate scoring of the same factor
  const uniqueFactors = Array.from(new Set(factors));
  
  const score = uniqueFactors.reduce((sum, factor) => sum + factorWeights[factor], 0);
  
  if (score >= 1.2) {
    return { score, allowed: true, recommendedAction: 'ALLOW' };
  } else if (score >= 0.8) {
    // Score implies standard password (0.8) or Face (0.9) alone without a secondary factor
    return { score, allowed: false, recommendedAction: 'STEP_UP_AUTH' };
  } else {
    // Very weak, e.g., only voice (0.5) is recognized
    return { score, allowed: false, recommendedAction: 'DENY' };
  }
}
