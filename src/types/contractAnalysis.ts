// Enhanced Contract Analysis Types - Based on Technical Architecture Document

export type RiskLevel = "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk";
export type Severity = "Critical" | "High" | "Medium" | "Low";
export type SectionStatus = "Pass" | "Warning" | "Critical" | "Not Found";
export type UserRole = 'Freelancer' | 'Small Business' | 'Enterprise' | 'Individual';
export type SafetyRating = 'Safe' | 'Moderate' | 'Risky' | 'Dangerous';
export type ComplexityLevel = 'Simple' | 'Standard' | 'Complex';
export type ExportFormat = 'pdf' | 'word' | 'annotated';
export type AnalysisStatus = 'idle' | 'loading' | 'completed' | 'error';
export type RecommendationCategory = 'Risk Mitigation' | 'Compliance' | 'Negotiation' | 'Clarity' | 'Protection';
export type RecommendationPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ActionItemStatus = 'Pending' | 'In Progress' | 'Completed' | 'Deferred';
export type TimeSensitivity = 'Immediate' | 'Short-term' | 'Long-term';

// Enhanced Core Interface
export interface EnhancedContractAnalysis {
  metadata: {
    analysisId: string;
    contractId: string;
    userId: string;
    analysisDate: string;
    contractType: string;
    pageCount: number;
    wordCount: number;
    processingTime: number;
  };
  
  executive_summary: {
    contract_overview: {
      type: string;
      parties: Party[];
      effective_date: string;
      contract_term: string;
      jurisdiction: string;
      governing_law: string;
      total_value?: string;
      purpose_summary: string;
      // Legacy/UI-friendly optional fields
      contract_type?: string;
      complexity_level?: string;
      contract_length?: string;
      primary_language?: string;
      contract_value?: string;
      duration?: string;
      key_purpose?: string;
    };
    // Legacy/UI-friendly optional fields for older components
    overall_risk_level?: string;
    risk_score?: number;
    summary?: string;
    key_findings?: string[];
    immediate_actions?: string[];
    // Optional party analysis used by older UI
    party_analysis?: any;
    key_metrics: {
      risk_score: number; // 0-100
      safety_rating: SafetyRating;
      complexity_level: ComplexityLevel;
      estimated_review_time: string;
    };
    quick_insights: {
      biggest_risk: string;
      strongest_protection: string;
      most_important_clause: string;
      negotiation_priority: string;
    };
  };
  
  risk_assessment: {
    overall_score: number;
    // Legacy/UI-friendly optional mirrors
    overall_risk_score?: number;
    risk_level?: 'low' | 'medium' | 'high' | 'critical' | string;
    mitigation_summary?: string;
    risk_distribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      safe: number;
    };
    category_breakdown: RiskCategory[];
    // Legacy alias for UI backward compatibility
    risk_categories?: RiskCategory[];
    // Optional trends used by older UI
    risk_trends?: Array<{ category: string; trend: 'increasing' | 'decreasing' | 'stable'; description: string }>;
    // Optional critical risks used by older UI
    critical_risks?: Array<{ title: string; severity: string; description: string; impact: string; likelihood: string; mitigation?: string }>;
    trend_analysis: {
      vs_industry_average: number;
      vs_similar_contracts: number;
      risk_trajectory: 'Improving' | 'Stable' | 'Declining';
    };
  };
  
  clause_analysis: {
    total_clauses: number;
    analyzed_clauses: number;
    clauses_by_section: ClauseSection[];
    critical_clauses: CriticalClause[];
    missing_clauses: MissingClause[];
  };
  
  legal_insights: {
    contextual_recommendations: Recommendation[];
    jurisdiction_specific: JurisdictionAdvice[];
    role_based_advice: RoleSpecificAdvice[];
    action_items: ActionItem[];
  };
  
  export_data: {
    pdf_template: string;
    word_template: string;
    annotations: ContractAnnotation[];
    charts_data: ChartData[];
  };
}

// Legacy Compatibility Interface (optional fields mixed into EnhancedContractAnalysis for UI)
export interface LegacyAnalysisData {
  overall_risk_level?: string;
  riskScore?: number;
  executiveSummary?: string;
  criticalIssues?: Array<{
    category: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    impact: string;
    recommendation: string;
  }>;
  missingClauses?: MissingClause[];
  overallRecommendations?: string[];
  sections?: Record<string, {
    keyFindings?: string[];
    recommendations?: string[];
    redFlags?: Array<{
      type: string;
      description: string;
      severity: 'Low' | 'Medium' | 'High' | 'Critical';
      impact: string;
      recommendation: string;
    }>;
  }>;
  chart_data?: ChartData[];
}

export interface Party {
  name: string;
  type: 'Individual' | 'Company' | 'Government' | 'Non-Profit';
  role: 'Client' | 'Service Provider' | 'Vendor' | 'Partner' | 'Other';
  legal_status: 'Verified' | 'Unverified' | 'Unknown';
  address?: string;
  registration_number?: string;
  authorized_representative?: string;
}

export interface RiskCategory {
  category: string;
  score: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  clause_count: number;
  key_issues: string[];
  recommendations: string[];
}

export interface ClauseSection {
  section_name: string;
  section_type: string;
  clauses: AnalyzedClause[];
  section_risk_score: number;
  summary: string;
}

export interface AnalyzedClause {
  clause_id: string;
  original_text: string;
  ai_summary: string;
  risk_level: 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';
  risk_score: number;
  risk_factors: string[];
  // Support both detailed and simple recommendation formats
  recommendations: ClauseRecommendation[] | string[];
  legal_implications: string[];
  negotiation_priority: 'High' | 'Medium' | 'Low';
  similar_clauses?: string[];
  industry_standards?: string[];
  // Legacy/UI-friendly optional fields used by older components
  id?: string;
  section?: string;
  confidence_score?: number;
  clause_number?: number;
  issues?: string[];
}

export interface ClauseRecommendation {
  type: 'Language' | 'Structure' | 'Addition' | 'Removal';
  priority: RecommendationPriority;
  description: string;
  suggested_language?: string;
  reasoning: string;
  implementation_notes: string;
}

export interface CriticalClause {
  clause_id: string;
  clause_type: string;
  risk_level: 'Critical';
  issues: string[];
  immediate_actions: string[];
  escalation_required: boolean;
  legal_review_recommended: boolean;
}

export interface Recommendation {
  id: string;
  // Allow legacy string categories
  category: RecommendationCategory | string;
  priority: RecommendationPriority;
  title: string;
  description: string;
  implementation_steps: string[];
  estimated_impact: string;
  time_sensitivity: TimeSensitivity;
  user_role_context: UserRole;
  // Legacy/UI-friendly optional fields
  relevance_score?: number;
  effort_level?: string;
  detailed_analysis?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  status: ActionItemStatus;
  due_date?: string;
  assigned_to?: string;
  completion_notes?: string;
}

export interface JurisdictionAdvice {
  jurisdiction: string;
  specific_considerations: string[];
  legal_requirements: string[];
  compliance_notes: string[];
}

export interface RoleSpecificAdvice {
  role: UserRole;
  specific_guidance: string[];
  common_pitfalls: string[];
  negotiation_tips: string[];
}

export interface ContractAnnotation {
  id: string;
  clause_id: string;
  annotation_type: 'highlight' | 'comment' | 'suggestion';
  content: string;
  position: number;
  risk_level?: 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface ChartData {
  chart_type: string;
  data: any[];
  configuration: any;
}

export interface MissingClause {
  clauseType: string;
  description: string;
  importance: 'High' | 'Medium' | 'Low';
  riskIfMissing: string;
  suggestedLanguage: string;
}

export interface SectionAnalysis {
  sectionName: string;
  goal?: string;
  riskLevel?: string;
  status?: 'Pass' | 'Warning' | 'Critical' | 'Unknown';
  keyFindings?: string[];
  redFlags?: RedFlag[];
  recommendations?: string[];
  checkItems?: CheckItem[];
}

export interface RedFlag {
  type: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  impact: string;
  recommendation: string;
}

export interface CheckItem {
  item: string;
  status: 'Pass' | 'Warning' | 'Fail';
  description: string;
  recommendation?: string;
}

// State Management Interfaces
export interface ContractAnalysisStore {
  analysis: EnhancedContractAnalysis | null;
  analysisStatus: AnalysisStatus;
  analysisError: string | null;
  
  activeSection: string;
  expandedSections: Set<string>;
  selectedClause: AnalyzedClause | null;
  filterOptions: FilterOptions;
  
  exportStatus: 'idle' | 'generating' | 'completed' | 'error';
  exportProgress: number;
  exportFormat: ExportFormat;
  
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  chatContext: string[];
  
  userRole: UserRole;
  jurisdiction: string;
  industry: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface FilterOptions {
  riskLevel?: ('Safe' | 'Low' | 'Medium' | 'High' | 'Critical')[];
  category?: string[];
  priority?: RecommendationPriority[];
  searchTerm?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: string;
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  error?: string;
  format: ExportFormat;
}

// Validation helpers
export function validateEnhancedAnalysis(data: any): data is EnhancedContractAnalysis {
  return (
    typeof data === 'object' &&
    typeof data.metadata === 'object' &&
    typeof data.executive_summary === 'object' &&
    typeof data.risk_assessment === 'object' &&
    typeof data.clause_analysis === 'object' &&
    typeof data.legal_insights === 'object'
  );
}

// Additional legacy-friendly exports for older components
export interface ExecutiveSummary {
  overall_risk_level?: string;
  risk_score?: number;
  summary?: string;
  key_findings?: string[];
  immediate_actions?: string[];
  contract_overview: any;
}

export interface RiskAssessment {
  risk_level?: string;
  overall_risk_score?: number;
  mitigation_summary?: string;
  risk_categories?: Array<{
    category: string;
    score: number;
    risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
    trend?: 'increasing' | 'decreasing' | 'stable';
    description?: string;
    factors?: string[];
  }>;
  critical_risks?: Array<{
    title: string;
    severity: string;
    description: string;
    impact: string;
    likelihood: string;
    mitigation?: string;
  }>;
}

export interface ExportData {
  pdf_template?: string;
  word_template?: string;
  annotations?: ContractAnnotation[];
  charts_data?: ChartData[];
}