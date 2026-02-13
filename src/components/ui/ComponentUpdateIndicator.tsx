/**
 * Component Update Indicator
 * Shows real-time feedback when components are updated across the app
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useComponentUpdates } from '@/hooks/useComponentUpdates';
import { ComponentName, COMPONENT_USAGE_MAP } from '@/utils/componentUpdates';
import { RefreshCw, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface ComponentUpdateIndicatorProps {
  className?: string;
  showHistory?: boolean;
}

export const ComponentUpdateIndicator: React.FC<ComponentUpdateIndicatorProps> = ({ 
  className = '',
  showHistory = true 
}) => {
  const { 
    trackUpdate, 
    validateComponent, 
    validateAllComponents, 
    getRecentUpdates, 
    isValidating 
  } = useComponentUpdates();

  const recentUpdates = getRecentUpdates().slice(0, 3);

  const testComponentUpdate = async () => {
    // Test with the dialog component we just updated
    await trackUpdate('dialog', [
      'Updated 5 dialogs to use DialogScrollArea pattern',
      'Standardized header/content/footer structure across all modals',
      'Fixed scrolling behavior in AddVideoModal, EditVideoModal, VideoPlayerModal',
      'Modernized CreateQuizModal and VideoPage quiz dialog',
      'Achieved 100% consistency in dialog implementation'
    ]);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
          Component Updates
        </CardTitle>
        <CardDescription>
          Track and validate component changes across dashboards
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Test Update Button */}
        <div className="flex gap-2">
          <Button 
            onClick={testComponentUpdate}
            disabled={isValidating}
            size="sm"
            variant="default"
          >
            ✅ Library Updated
          </Button>
          <Button 
            onClick={() => validateComponent('dialog')}
            disabled={isValidating}
            size="sm"
            variant="outline"
          >
            Validate Dialog
          </Button>
          <Button 
            onClick={validateAllComponents}
            disabled={isValidating}
            size="sm"
            variant="outline"
          >
            Check All
          </Button>
        </div>

        {/* Component Status */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(COMPONENT_USAGE_MAP).slice(0, 6).map(([component, areas]) => (
            <div key={component} className="flex items-center justify-between p-2 border rounded">
              <span className="text-body-sm font-medium">{component}</span>
              <Badge variant="secondary">
                {Array.isArray(areas) ? areas.length : 1} areas
              </Badge>
            </div>
          ))}
        </div>

        {/* Recent Updates */}
        {showHistory && recentUpdates.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-body-sm font-semibold flex items-center gap-2">
              <Info className="w-4 h-4" />
              Recent Updates
            </h4>
            {recentUpdates.map((update, index) => (
              <div key={index} className="p-2 bg-muted rounded text-caption space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {update.component}
                  </Badge>
                  <span className="text-muted-foreground">
                    {update.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  {update.changes.slice(0, 2).join(', ')}
                  {update.changes.length > 2 && '...'}
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-success" />
                  <span className="text-success">
                    Propagated to {update.affectedAreas.length} areas
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How It Works */}
        <div className="p-3 bg-muted/50 rounded text-caption space-y-1">
          <h5 className="font-semibold">🔄 How Component Updates Work:</h5>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Updates to <code>src/components/ui/*</code> automatically propagate</li>
            <li>• All dashboards import from the same component source</li>
            <li>• Changes are immediately reflected across the entire app</li>
            <li>• No manual intervention needed - React handles the updates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};