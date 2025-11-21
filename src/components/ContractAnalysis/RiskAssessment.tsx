import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Info, 
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { EnhancedContractAnalysis, RiskCategory } from '../../types/contractAnalysis';

interface RiskAssessmentProps {
  analysis: EnhancedContractAnalysis;
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({ analysis }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

  const { risk_assessment } = analysis;

  // Derive safe values and aliases
  const categories = (risk_assessment.risk_categories || risk_assessment.category_breakdown || []) as RiskCategory[];
  const overallScore = (risk_assessment.overall_risk_score ?? risk_assessment.overall_score ?? 0) as number;
  const findScore = (name: string) => {
    const match = categories.find((c: any) => (c as any).category?.toLowerCase() === name.toLowerCase());
    return (match as any)?.score ?? 0;
  };
  const financialScore = findScore('Financial');
  const legalScore = findScore('Legal');

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Info className="w-4 h-4 text-yellow-600" />;
      case 'low': return <Shield className="w-4 h-4 text-green-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const RiskScoreCard = ({ score, label, description }: { score: number; label: string; description: string }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          score >= 80 ? 'bg-red-100 text-red-800' :
          score >= 60 ? 'bg-orange-100 text-orange-800' :
          score >= 40 ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {score}%
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`absolute left-0 top-0 h-full transition-all duration-500 ${
            score >= 80 ? 'bg-red-500' :
            score >= 60 ? 'bg-orange-500' :
            score >= 40 ? 'bg-yellow-500' :
            'bg-green-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  const RiskCategoryCard = ({ category }: { category: RiskCategory }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getRiskIcon(category.risk_level)}
          <h4 className="font-medium text-gray-900">{(category as any).name || category.category}</h4>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(category.risk_level)}`}>
          {category.risk_level}
        </span>
      </div>
      
      {(category as any).description && (
        <p className="text-sm text-gray-600 mb-3">{(category as any).description}</p>
      )}
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Affected Clauses:</span>
          <span className="font-medium">{category.clause_count}</span>
        </div>
        
        {(category.recommendations?.length ?? 0) > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Recommendations:</span>
            <span className="font-medium">{category.recommendations.length}</span>
          </div>
        )}
      </div>
      
      <button
        onClick={() => setExpandedRisk(expandedRisk === ((category as any).name || category.category) ? null : ((category as any).name || category.category))}
        className="mt-3 w-full flex items-center justify-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
      >
        <span>{expandedRisk === ((category as any).name || category.category) ? 'Hide Details' : 'View Details'}</span>
        {expandedRisk === ((category as any).name || category.category) ? 
          <ChevronUp className="w-4 h-4" /> : 
          <ChevronDown className="w-4 h-4" />
        }
      </button>
      
      {expandedRisk === ((category as any).name || category.category) && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-1">Key Issues:</h5>
            <div className="space-y-1">
              {(category.key_issues || []).slice(0, 3).map((issue: string, index: number) => (
                <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  {issue}
                </div>
              ))}
              {(category.key_issues?.length ?? 0) > 3 && (
                <div className="text-xs text-gray-500 italic">
                  +{(category.key_issues!.length - 3)} more issues
                </div>
              )}
            </div>
          </div>
          
          {(category.recommendations?.length ?? 0) > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-1">Key Recommendations:</h5>
              <div className="space-y-1">
                {category.recommendations.slice(0, 2).map((rec: string, index: number) => (
                  <div key={index} className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    {rec}
                  </div>
                ))}
                {(category.recommendations.length > 2) && (
                  <div className="text-xs text-blue-500 italic">
                    +{category.recommendations.length - 2} more recommendations
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const filteredCategories = selectedCategory === 'all'
    ? categories
    : categories.filter((cat: any) => {
        const name = (cat as any).name || (cat as any).category || ''
        return name.toLowerCase().includes(selectedCategory.toLowerCase())
      });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">Risk Assessment</h2>
        <p className="text-orange-100">Comprehensive risk analysis with mitigation strategies</p>
      </div>

      {/* Overall Risk Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskScoreCard
          score={overallScore}
          label="Overall Risk Score"
          description="Comprehensive risk assessment across all categories"
        />
        
        <RiskScoreCard
          score={financialScore}
          label="Financial Risk"
          description="Financial exposure and liability assessment"
        />
        
        <RiskScoreCard
          score={legalScore}
          label="Legal Risk"
          description="Legal compliance and enforceability risks"
        />
      </div>

      {/* Risk Distribution & Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Risk Categories</h3>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Categories</option>
                {categories.map((cat: any, index: number) => {
                  const name = (cat as any).name || (cat as any).category || ''
                  return (
                    <option key={index} value={name}>{name}</option>
                  )
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCategories.map((category: RiskCategory, index: number) => (
              <RiskCategoryCard key={index} category={category} />
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No categories match your current filters.</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Trends</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Trajectory</span>
                <span className="font-medium text-blue-900">{risk_assessment.trend_analysis?.risk_trajectory || 'Stable'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">vs Industry Avg</span>
                  <span className="font-medium text-green-900">{risk_assessment.trend_analysis?.vs_industry_average ?? 0}%</span>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-700">vs Similar Contracts</span>
                  <span className="font-medium text-yellow-900">{risk_assessment.trend_analysis?.vs_similar_contracts ?? 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mitigation Summary */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Mitigation Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(risk_assessment.mitigation_summary ? [risk_assessment.mitigation_summary] : []).slice(0, 3).map((item: string, index: number) => (
            <div key={index} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-700">Mitigation</span>
                <span className="font-medium text-orange-900">{index + 1}</span>
              </div>
              <p className="text-sm text-orange-800 mt-2">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RiskAssessment;