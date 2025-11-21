import { create } from 'zustand';
import { 
  EnhancedContractAnalysis, 
  AnalyzedClause, 
  FilterOptions, 
  ChatMessage, 
  ExportResult, 
  UserRole, 
  AnalysisStatus, 
  ExportFormat 
} from '../types/contractAnalysis';

interface ContractAnalysisState {
  // Analysis Data
  analysis: EnhancedContractAnalysis | null;
  analysisStatus: AnalysisStatus;
  analysisError: string | null;
  
  // UI State
  activeSection: string;
  expandedSections: Set<string>;
  selectedClause: AnalyzedClause | null;
  filterOptions: FilterOptions;
  
  // Export State
  exportStatus: 'idle' | 'generating' | 'completed' | 'error';
  exportProgress: number;
  exportFormat: ExportFormat;
  
  // Chat State
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  chatContext: string[];
  
  // User Preferences
  userRole: UserRole;
  jurisdiction: string;
  industry: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Expert';
}

interface ContractAnalysisActions {
  // Analysis Actions
  setAnalysis: (analysis: EnhancedContractAnalysis | null) => void;
  updateAnalysisStatus: (status: AnalysisStatus) => void;
  setAnalysisError: (error: string | null) => void;
  
  // UI Actions
  setActiveSection: (section: string) => void;
  toggleSection: (section: string) => void;
  selectClause: (clause: AnalyzedClause | null) => void;
  updateFilters: (filters: FilterOptions) => void;
  clearFilters: () => void;
  
  // Export Actions
  startExport: (format: ExportFormat) => void;
  updateExportProgress: (progress: number) => void;
  completeExport: (result: ExportResult) => void;
  resetExport: () => void;
  
  // Chat Actions
  addChatMessage: (message: ChatMessage) => void;
  setChatLoading: (loading: boolean) => void;
  clearChat: () => void;
  
  // User Actions
  updateUserPreferences: (preferences: {
    userRole?: UserRole;
    jurisdiction?: string;
    industry?: string;
    experienceLevel?: 'Beginner' | 'Intermediate' | 'Expert';
  }) => void;
  
  // Reset Actions
  resetAnalysis: () => void;
  resetAll: () => void;
}

const initialState: ContractAnalysisState = {
  analysis: null,
  analysisStatus: 'idle',
  analysisError: null,
  
  activeSection: 'executive-summary',
  expandedSections: new Set(),
  selectedClause: null,
  filterOptions: {},
  
  exportStatus: 'idle',
  exportProgress: 0,
  exportFormat: 'pdf',
  
  chatMessages: [],
  chatLoading: false,
  chatContext: [],
  
  userRole: 'Freelancer',
  jurisdiction: 'United States',
  industry: 'Technology',
  experienceLevel: 'Intermediate',
};

export const useContractAnalysisStore = create<ContractAnalysisState & ContractAnalysisActions>()(
  (set, get) => ({
    ...initialState,
    
    // Analysis Actions
    setAnalysis: (analysis) => set({ analysis }),
    
    updateAnalysisStatus: (status) => set({ analysisStatus: status }),
    
    setAnalysisError: (error) => set({ analysisError: error }),
    
    // UI Actions
    setActiveSection: (section) => set({ activeSection: section }),
    
    toggleSection: (section) => {
      const { expandedSections } = get();
      const newExpanded = new Set(expandedSections);
      if (newExpanded.has(section)) {
        newExpanded.delete(section);
      } else {
        newExpanded.add(section);
      }
      set({ expandedSections: newExpanded });
    },
    
    selectClause: (clause) => set({ selectedClause: clause }),
    
    updateFilters: (filters) => set({ filterOptions: filters }),
    
    clearFilters: () => set({ filterOptions: {} }),
    
    // Export Actions
    startExport: (format) => set({ 
      exportStatus: 'generating', 
      exportFormat: format,
      exportProgress: 0 
    }),
    
    updateExportProgress: (progress) => set({ exportProgress: progress }),
    
    completeExport: (result) => set({ 
      exportStatus: result.success ? 'completed' : 'error',
      exportProgress: result.success ? 100 : 0
    }),
    
    resetExport: () => set({ 
      exportStatus: 'idle', 
      exportProgress: 0 
    }),
    
    // Chat Actions
    addChatMessage: (message) => {
      const { chatMessages } = get();
      set({ chatMessages: [...chatMessages, message] });
    },
    
    setChatLoading: (loading) => set({ chatLoading: loading }),
    
    clearChat: () => set({ chatMessages: [], chatContext: [] }),
    
    // User Actions
    updateUserPreferences: (preferences) => set(preferences),
    
    // Reset Actions
    resetAnalysis: () => set({
      analysis: null,
      analysisStatus: 'idle',
      analysisError: null,
      selectedClause: null,
      filterOptions: {},
    }),
    
    resetAll: () => set(initialState),
  })
);

// Selectors for computed values
export const useAnalysisSummary = () => {
  const analysis = useContractAnalysisStore(state => state.analysis);
  if (!analysis) return null;
  
  return {
    riskScore: analysis.executive_summary.key_metrics.risk_score,
    safetyRating: analysis.executive_summary.key_metrics.safety_rating,
    totalClauses: analysis.clause_analysis.total_clauses,
    criticalClauses: analysis.clause_analysis.critical_clauses.length,
    totalRecommendations: analysis.legal_insights.contextual_recommendations.length,
    processingTime: analysis.metadata.processingTime,
  };
};

export const useFilteredClauses = () => {
  const analysis = useContractAnalysisStore(state => state.analysis);
  const filters = useContractAnalysisStore(state => state.filterOptions);
  
  if (!analysis) return [];
  
  let clauses = analysis.clause_analysis.clauses_by_section.flatMap(section => section.clauses);
  
  if (filters.riskLevel && filters.riskLevel.length > 0) {
    clauses = clauses.filter(clause => filters.riskLevel!.includes(clause.risk_level));
  }
  
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    clauses = clauses.filter(clause => 
      clause.original_text.toLowerCase().includes(searchLower) ||
      clause.ai_summary.toLowerCase().includes(searchLower)
    );
  }
  
  return clauses;
};

export const useCriticalActionItems = () => {
  const analysis = useContractAnalysisStore(state => state.analysis);
  if (!analysis) return [];
  
  return analysis.legal_insights.action_items.filter(item => 
    item.priority === 'Critical' && item.status === 'Pending'
  );
};