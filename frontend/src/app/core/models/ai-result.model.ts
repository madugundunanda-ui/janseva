export type AiRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AiResult {
  issueType?: string;
  confidence: number;
  severity?: AiRiskLevel | string;
  suggestedDepartment?: string;
  predictedResolutionTime?: number;
  duplicateProbability?: number;
  priority?: string;
  title?: string;
  description?: string;
  department?: string;
  reason?: string[];
  severityScore?: number;
  estimatedDays?: number;
  delayRisk?: 'Low' | 'Medium' | 'High' | string;
  escalationProbability?: number;
}

export interface SeverityAnalysisResult {
  severityScore: number;
  priority: string;
  reason: string[];
  confidence: number;
}

export interface ResolutionPredictionResult {
  estimatedDays: number;
  delayRisk: 'Low' | 'Medium' | 'High';
  escalationProbability: number;
  suggestedPriority: string;
  confidence: number;
}

export interface DuplicateDetectionResult {
  duplicateDetected: boolean;
  similarity?: number;
  confidence?: number;
}
