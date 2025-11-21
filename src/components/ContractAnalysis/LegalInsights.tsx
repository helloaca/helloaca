import React, { useState } from 'react';
import { 
  Lightbulb, 
  CheckCircle, 
  User, 
  Globe, 
  Scale,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
  Share2,
  DollarSign
} from 'lucide-react';
import { EnhancedContractAnalysis, Recommendation, ActionItem } from '../../types/contractAnalysis';

interface LegalInsightsProps {
  analysis: EnhancedContractAnalysis;
  onActionSelect?: (action: ActionItem) => void;
}

const LegalInsights: React.FC<LegalInsightsProps> = ({ analysis, onActionSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  const { legal_insights } = analysis;

  const toggleRecommendation = (id: string) => {
    const newExpanded = new Set(expandedRecommendations);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRecommendations(newExpanded);
  };

  const toggleAction = (id: string) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedActions(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'blocked': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'financial': return <DollarSign className="w-4 h-4" />;
      case 'legal': return <Scale className="w-4 h-4" />;
      case 'operational': return <TrendingUp className="w-4 h-4" />;
      case 'compliance': return <CheckCircle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const filteredRecommendations = legal_insights.contextual_recommendations.filter(rec => {
    if (selectedCategory !== 'all' && rec.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && rec.priority !== selectedPriority) return false;
    return true;
  });

  const filteredActions = legal_insights.action_items.filter(action => {
    if (selectedPriority !== 'all' && action.priority !== selectedPriority) return false;
    if (selectedStatus !== 'all' && action.status !== selectedStatus) return false;
    return true;
  });

  const RecommendationCard = ({ recommendation }: { recommendation: Recommendation }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getCategoryIcon(recommendation.category)}
          <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
          {recommendation.priority}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>Category: {recommendation.category}</span>
        <span>Relevance: {recommendation.relevance_score}%</span>
      </div>
      
      <button
        onClick={() => toggleRecommendation(recommendation.id)}
        className="w-full flex items-center justify-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors py-2 border-t border-gray-200"
      >
        <span>{expandedRecommendations.has(recommendation.id) ? 'Hide Details' : 'View Details'}</span>
        {expandedRecommendations.has(recommendation.id) ? 
          <ChevronUp className="w-4 h-4" /> : 
          <ChevronDown className="w-4 h-4" />
        }
      </button>
      
      {expandedRecommendations.has(recommendation.id) && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Detailed Analysis:</h5>
            <p className="text-sm text-gray-600">{recommendation.detailed_analysis}</p>
          </div>
          
          {recommendation.implementation_steps.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Implementation Steps:</h5>
              <ol className="list-decimal list-inside space-y-1">
                {recommendation.implementation_steps.map((step, index) => (
                  <li key={index} className="text-sm text-gray-600">{step}</li>
                ))}
              </ol>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Time Sensitivity:</span>
              <span className="ml-2 text-gray-900">{recommendation.time_sensitivity}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Effort Level:</span>
              <span className="ml-2 text-gray-900">{recommendation.effort_level}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const ActionItemCard = ({ action }: { action: ActionItem }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-gray-900">{action.title}</h4>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(action.priority)}`}>
            {action.priority}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(action.status)}`}>
            {action.status}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{action.description}</p>
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        {action.due_date && (
          <span>Due: {new Date(action.due_date).toLocaleDateString()}</span>
        )}
        {action.assigned_to && (
          <span>Assigned to: {action.assigned_to}</span>
        )}
      </div>
      
      <button
        onClick={() => toggleAction(action.id)}
        className="w-full flex items-center justify-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors py-2 border-t border-gray-200"
      >
        <span>{expandedActions.has(action.id) ? 'Hide Details' : 'View Details'}</span>
        {expandedActions.has(action.id) ? 
          <ChevronUp className="w-4 h-4" /> : 
          <ChevronDown className="w-4 h-4" />
        }
      </button>
      
      {expandedActions.has(action.id) && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          {/* Removed unsupported fields: detailed_description, dependencies, time_sensitivity, estimated_hours */}
          <div className="flex space-x-2">
            <button
              onClick={() => onActionSelect?.(action)}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mark as Complete
            </button>
            <button
              onClick={() => {/* Share action */}}
              className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">Legal Insights</h2>
        <p className="text-green-100">Personalized recommendations and actionable insights</p>
      </div>

      {/* Jurisdiction Advice */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-green-600" />
          Jurisdiction-Specific Advice
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {legal_insights.jurisdiction_specific.map((advice, index) => (
            <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">{advice.jurisdiction}</h4>
              {/* Show specific considerations */}
              {advice.specific_considerations && advice.specific_considerations.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-green-700">Specific Considerations:</h5>
                  <ul className="space-y-1">
                    {advice.specific_considerations.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-xs text-green-600 flex items-start space-x-1">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Legal requirements */}
              {advice.legal_requirements && advice.legal_requirements.length > 0 && (
                <div className="space-y-2 mt-3">
                  <h5 className="text-xs font-medium text-green-700">Legal Requirements:</h5>
                  <ul className="space-y-1">
                    {advice.legal_requirements.map((reg, regIndex) => (
                      <li key={regIndex} className="text-xs text-green-600 flex items-start space-x-1">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>{reg}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Compliance notes */}
              {advice.compliance_notes && advice.compliance_notes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <h5 className="text-xs font-medium text-green-700 mb-1">Compliance Notes:</h5>
                  <ul className="space-y-1">
                    {advice.compliance_notes.map((note, noteIndex) => (
                      <li key={noteIndex} className="text-xs text-green-600 flex items-start space-x-1">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Role-Specific Insights */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-green-600" />
          Role-Specific Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {legal_insights.role_based_advice.map((advice, index) => (
            <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">{advice.role}</h4>
              {advice.specific_guidance && advice.specific_guidance.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-blue-700">Specific Guidance:</h5>
                  <ul className="space-y-1">
                    {advice.specific_guidance.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-xs text-blue-600 flex items-start space-x-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {advice.common_pitfalls && advice.common_pitfalls.length > 0 && (
                <div className="space-y-2 mt-3">
                  <h5 className="text-xs font-medium text-blue-700">Common Pitfalls:</h5>
                  <ul className="space-y-1">
                    {advice.common_pitfalls.map((pitfall, pitIndex) => (
                      <li key={pitIndex} className="text-xs text-blue-600 flex items-start space-x-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{pitfall}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {advice.negotiation_tips && advice.negotiation_tips.length > 0 && (
                <div className="space-y-2 mt-3">
                  <h5 className="text-xs font-medium text-blue-700">Negotiation Tips:</h5>
                  <ul className="space-y-1">
                    {advice.negotiation_tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="text-xs text-blue-600 flex items-start space-x-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contextual Recommendations */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-green-600" />
            Contextual Recommendations
          </h3>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Categories</option>
              <option value="financial">Financial</option>
              <option value="legal">Legal</option>
              <option value="operational">Operational</option>
              <option value="compliance">Compliance</option>
            </select>
            
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecommendations.map((recommendation, index) => (
            <RecommendationCard key={index} recommendation={recommendation} />
          ))}
        </div>
        
        {filteredRecommendations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No recommendations match your current filters.</p>
          </div>
        )}
      </div>

      {/* Action Items */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Action Items
          </h3>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActions.map((action, index) => (
            <ActionItemCard key={index} action={action} />
          ))}
        </div>
        
        {filteredActions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No action items match your current filters.</p>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Insights Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {legal_insights.contextual_recommendations.length}
            </div>
            <div className="text-sm text-blue-700 font-medium">Total Recommendations</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {legal_insights.action_items.length}
            </div>
            <div className="text-sm text-green-700 font-medium">Action Items</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {legal_insights.action_items.filter(a => a.priority === 'Critical').length}
            </div>
            <div className="text-sm text-red-700 font-medium">Critical Actions</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {legal_insights.jurisdiction_specific.length}
            </div>
            <div className="text-sm text-yellow-700 font-medium">Jurisdictions Covered</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalInsights;