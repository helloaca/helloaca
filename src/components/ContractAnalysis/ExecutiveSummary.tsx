import React from 'react';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  Shield, 
  Users,
  Award,
  Target
} from 'lucide-react';
import { EnhancedContractAnalysis } from '../../types/contractAnalysis';

interface ExecutiveSummaryProps {
  analysis: EnhancedContractAnalysis;
  onSectionClick?: (section: string) => void;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ analysis, onSectionClick }) => {
  const { executive_summary, metadata } = analysis;
  const { key_metrics, contract_overview, party_analysis } = executive_summary;

  type MetricColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';

  const MetricCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color = 'blue',
    onClick 
  }: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: MetricColor;
    onClick?: () => void;
  }) => {
    const colorClasses: Record<MetricColor, string> = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      gray: 'bg-gray-50 text-gray-600 border-gray-200'
    };

    return (
      <div 
        className={`p-4 rounded-lg border-2 ${colorClasses[color]} transition-all hover:shadow-md cursor-pointer`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-5 h-5" />
          <span className="text-xs font-medium text-gray-500">{title}</span>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        {subtitle && <div className="text-xs text-gray-600">{subtitle}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">Executive Summary</h2>
        <p className="text-blue-100">Comprehensive analysis of your contract with key insights and recommendations</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={AlertTriangle}
          title="Risk Score"
          value={`${key_metrics.risk_score}%`}
          subtitle={key_metrics.safety_rating}
          color={key_metrics.risk_score >= 70 ? 'red' : key_metrics.risk_score >= 50 ? 'yellow' : 'green'}
          onClick={() => onSectionClick?.('risk-assessment')}
        />
        
        <MetricCard
          icon={Shield}
          title="Safety Rating"
          value={key_metrics.safety_rating}
          subtitle="Overall contract safety"
          color={key_metrics.safety_rating === 'Safe' ? 'green' : 
                 key_metrics.safety_rating === 'Moderate' ? 'blue' : 
                 key_metrics.safety_rating === 'Risky' ? 'yellow' : 'red'}
        />
        
        <MetricCard
          icon={FileText}
          title="Total Clauses"
          value={analysis.clause_analysis.total_clauses}
          subtitle={`${analysis.clause_analysis.critical_clauses.length} critical`}
          color="blue"
          onClick={() => onSectionClick?.('clause-analysis')}
        />
        
        <MetricCard
          icon={Clock}
          title="Processing Time"
          value={`${metadata.processingTime}s`}
          subtitle="Analysis completed"
          color="purple"
        />
      </div>

      {/* Contract Overview */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Contract Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Contract Type</label>
              <p className="text-gray-900">{contract_overview.contract_type}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Complexity Level</label>
              <p className="text-gray-900">{contract_overview.complexity_level}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Contract Length</label>
              <p className="text-gray-900">{contract_overview.contract_length}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Primary Language</label>
              <p className="text-gray-900">{contract_overview.primary_language}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Governing Law</label>
              <p className="text-gray-900">{contract_overview.governing_law}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Jurisdiction</label>
              <p className="text-gray-900">{contract_overview.jurisdiction}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Contract Value</label>
              <p className="text-gray-900">{contract_overview.contract_value}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Duration</label>
              <p className="text-gray-900">{contract_overview.duration}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Party Analysis */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          Party Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {party_analysis.map((party: any, index: number) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{party.role}</h4>
              <p className="text-sm text-gray-600 mb-2">{party.name}</p>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Negotiating Power:</span>
                  <span className="font-medium">{party.negotiating_power}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Risk Profile:</span>
                  <span className="font-medium">{party.risk_profile}</span>
                </div>
                {party.experience_level && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Experience:</span>
                    <span className="font-medium">{party.experience_level}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onSectionClick?.('clause-analysis')}
          className="p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2"
        >
          <Target className="w-5 h-5" />
          <span className="font-medium">View Detailed Analysis</span>
        </button>
        
        <button
          onClick={() => onSectionClick?.('risk-assessment')}
          className="p-4 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors flex items-center justify-center space-x-2"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Review Risk Assessment</span>
        </button>
        
        <button
          onClick={() => onSectionClick?.('legal-insights')}
          className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition-colors flex items-center justify-center space-x-2"
        >
          <Award className="w-5 h-5" />
          <span className="font-medium">Get Legal Insights</span>
        </button>
    </div>
    </div>
  );
};

export default ExecutiveSummary;