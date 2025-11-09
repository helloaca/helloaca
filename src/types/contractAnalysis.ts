// types/contractAnalysis.ts

export type RiskLevel = "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk";
export type Severity = "Critical" | "High" | "Medium" | "Low";
export type SectionStatus = "Pass" | "Warning" | "Critical" | "Not Found";

// Red Flag Interface
export interface RedFlag {
  type: string;
  severity: Severity;
  description: string;
  impact: string;
}

export interface MissingClause {
  clauseType: string;
  description: string;
  importance: 'High' | 'Medium' | 'Low';
  riskIfMissing: string;
  suggestedLanguage: string;
}

// Check Item Interface
export interface CheckItem {
  item: string;
  status: SectionStatus;
  finding: string;
  recommendation?: string;
}

// Base Section Analysis Interface
export interface SectionAnalysis {
  sectionName: string;
  goal: string;
  riskLevel: RiskLevel;
  status: SectionStatus;
  checkItems: CheckItem[];
  redFlags: RedFlag[];
  keyFindings: string[];
  recommendations: string[];
  content?: string; // Actual contract text for this section
}

// 11 Specific Section Interfaces
export interface TitlePartiesAnalysis extends SectionAnalysis {
  sectionName: "Title & Parties";
  parties: {
    name: string;
    isLegalName: boolean;
    hasRegistrationNumber: boolean;
    hasAddress: boolean;
    isAuthorized: boolean;
  }[];
}

export interface RecitalsAnalysis extends SectionAnalysis {
  sectionName: "Recitals";
  intentMatch: boolean;
  scopeConsistency: boolean;
  backgroundAccuracy: boolean;
}

export interface ScopeOfWorkAnalysis extends SectionAnalysis {
  sectionName: "Scope of Work";
  hasDeliverables: boolean;
  hasPerformanceStandards: boolean;
  hasExclusions: boolean;
  clarityScore: number; // 1-10
}

export interface PaymentTermsAnalysis extends SectionAnalysis {
  sectionName: "Payment Terms";
  hasDueDates: boolean;
  hasCurrency: boolean;
  hasMilestones: boolean;
  hasLatePenalties: boolean;
  hasRefundConditions: boolean;
}

export interface TermTerminationAnalysis extends SectionAnalysis {
  sectionName: "Term & Termination";
  isFixedTerm: boolean;
  hasTerminationForCause: boolean;
  hasTerminationForConvenience: boolean;
  isMutualTermination: boolean;
}

export interface IntellectualPropertyAnalysis extends SectionAnalysis {
  sectionName: "Intellectual Property";
  retainsPreExistingIP: boolean;
  definesNewIPOwnership: boolean;
  hasLicensingRights: boolean;
  isExclusive: boolean;
}

export interface ConfidentialityAnalysis extends SectionAnalysis {
  sectionName: "Confidentiality";
  hasDuration: boolean;
  hasDefinition: boolean;
  hasExceptions: boolean;
  durationReasonable: boolean;
}

export interface LiabilityAnalysis extends SectionAnalysis {
  sectionName: "Liability & Warranties";
  hasLiabilityCap: boolean;
  isMutualIndemnification: boolean;
  hasIndirectDamageDisclaimer: boolean;
  isBalanced: boolean;
}

export interface DisputeResolutionAnalysis extends SectionAnalysis {
  sectionName: "Dispute Resolution";
  hasArbitration: boolean;
  hasJurisdiction: boolean;
  hasMediation: boolean;
  isFavorableJurisdiction: boolean;
}

export interface BoilerplateAnalysis extends SectionAnalysis {
  sectionName: "Boilerplate";
  hasEntireAgreement: boolean;
  hasAssignmentClause: boolean;
  hasNoticeProvisions: boolean;
  allowsUnilateralAssignment: boolean;
}

export interface SignaturePageAnalysis extends SectionAnalysis {
  sectionName: "Signature Page";
  signatorsIdentified: boolean;
  datesConsistent: boolean;
  matchesEntities: boolean;
  hasProperAuthority: boolean;
}

// Main Contract Analysis Interface
export interface ContractAnalysis {
  // Overall Assessment
  overallRiskLevel: RiskLevel;
  riskScore: number; // 1-100
  executiveSummary: string;
  
  // Section-by-Section Analysis
  sections: {
    titleParties: TitlePartiesAnalysis;
    recitals: RecitalsAnalysis;
    scopeOfWork: ScopeOfWorkAnalysis;
    paymentTerms: PaymentTermsAnalysis;
    termTermination: TermTerminationAnalysis;
    intellectualProperty: IntellectualPropertyAnalysis;
    confidentiality: ConfidentialityAnalysis;
    liability: LiabilityAnalysis;
    disputeResolution: DisputeResolutionAnalysis;
    boilerplate: BoilerplateAnalysis;
    signaturePage: SignaturePageAnalysis;
  };
  
  // Summary Data
  totalRedFlags: number;
  criticalIssues: RedFlag[];
  missingClauses: MissingClause[];
  overallRecommendations: string[];
  
  // Analysis Metadata
  analysisDate: string;
  contractType?: string;
  contractLength?: number; // pages or words
}

// Legacy interfaces for backward compatibility
export interface CriticalIssue {
  category: string;
  severity: Severity;
  description: string;
  impact: string;
  recommendation: string;
}

export interface KeyFinding {
  title: string;
  severity: Severity;
  description: string;
  location: string;
  impact: string;
}

// Validation helper
export function validateAnalysis(data: any): data is ContractAnalysis {
  return (
    typeof data === 'object' &&
    typeof data.overallRiskLevel === 'string' &&
    typeof data.riskScore === 'number' &&
    typeof data.executiveSummary === 'string' &&
    typeof data.sections === 'object' &&
    Array.isArray(data.criticalIssues) &&
    Array.isArray(data.missingClauses) &&
    Array.isArray(data.overallRecommendations)
  );
}