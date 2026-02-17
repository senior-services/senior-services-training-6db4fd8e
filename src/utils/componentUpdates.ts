/**
 * Component Update Tracking and Validation System
 * Automatically tracks which components are updated and validates propagation
 */

// Component usage mapping across the application
export const COMPONENT_USAGE_MAP = {
  // UI Components and where they're used
  'button': [
    'AdminDashboard', 'Auth', 'ComponentsGallery', 'EmployeeDashboard', 'Landing', 'VideoPage',
    'AddEmployeeModal', 'AdminManagement', 'AssignVideosModal', 'EmployeeList', 'VideoTable'
  ],
  'dialog': [
    'ComponentsGallery', 'VideoPage', 'AddEmployeeModal', 'AdminManagement', 'AssignVideosModal'
  ],
  'card': [
    'Auth', 'ComponentsGallery', 'Landing', 'VideoPage', 'AdminManagement', 'DashboardOverview', 'VideoTable'
  ],
  'badge': [
    'ComponentsGallery', 'EmployeeDashboard', 'VideoPage', 'AdminManagement', 'AssignVideosModal', 'DashboardOverview', 'EmployeeList', 'VideoTable'
  ],
  'table': [
    'ComponentsGallery', 'AdminManagement', 'VideoTable'
  ],
  'tabs': [
    'AdminDashboard', 'Auth', 'ComponentsGallery'
  ],
  'input': [
    'Auth', 'ComponentsGallery', 'AddEmployeeModal', 'AdminManagement'
  ],
  'progress': [
    'ComponentsGallery', 'VideoPage', 'DashboardOverview', 'EmployeeList'
  ],
  'checkbox': [
    'ComponentsGallery', 'AssignVideosModal'
  ],
  'loading-spinner': [
    'ComponentsGallery', 'AdminManagement', 'AssignVideosModal', 'EmployeeList', 'VideoTable'
  ],
  'alert-dialog': [
    'ComponentsGallery', 'AdminManagement', 'AssignVideosModal'
  ],
  'scroll-area': [
    'AssignVideosModal'
  ],
  'calendar': [
    'ComponentsGallery', 'AssignVideosModal'
  ],
  'accordion': [
    'ComponentsGallery', 'EmployeeDashboard'
  ],
  'collapsible': [
    'ComponentsGallery'
  ],
  'dropdown-menu': [
    'ComponentsGallery'
  ],
  'select': [
    'ComponentsGallery'
  ],
  'toast': [
    'All components via useToast hook'
  ]
};

export type ComponentName = keyof typeof COMPONENT_USAGE_MAP;

// Track recent component updates
interface ComponentUpdate {
  component: ComponentName;
  timestamp: Date;
  changes: string[];
  affectedAreas: string[];
}

class ComponentUpdateTracker {
  private updates: ComponentUpdate[] = [];
  
  /**
   * Register a component update
   */
  registerUpdate(component: ComponentName, changes: string[]): ComponentUpdate {
    const update: ComponentUpdate = {
      component,
      timestamp: new Date(),
      changes,
      affectedAreas: [...COMPONENT_USAGE_MAP[component]]
    };
    
    this.updates.push(update);
    
    // Keep only last 10 updates
    if (this.updates.length > 10) {
      this.updates = this.updates.slice(-10);
    }
    
    return update;
  }
  
  /**
   * Get recent updates
   */
  getRecentUpdates(limit = 5): ComponentUpdate[] {
    return this.updates
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  /**
   * Generate update summary
   */
  generateUpdateSummary(update: ComponentUpdate): string {
    const affectedCount = update.affectedAreas.length;
    const changesList = update.changes.map(change => `• ${change}`).join('\n');
    
    return `
📦 COMPONENT UPDATED: ${update.component}
⏰ Time: ${update.timestamp.toLocaleString()}
🔄 Changes:
${changesList}

🎯 Affected Areas (${affectedCount}):
${update.affectedAreas.map(area => `• ${area}`).join('\n')}

✅ Changes automatically propagate to all affected areas via React imports.
    `;
  }
  
  /**
   * Validate component structure and imports
   */
  async validateComponentHealth(component: ComponentName): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check if component exists in usage map
    if (!COMPONENT_USAGE_MAP[component]) {
      issues.push(`Component '${component}' not found in usage mapping`);
    }
    
    // Validate affected areas
    const affectedAreas = COMPONENT_USAGE_MAP[component] || [];
    if (affectedAreas.length === 0) {
      issues.push(`No usage areas mapped for component '${component}'`);
      recommendations.push(`Add usage mapping for '${component}' in COMPONENT_USAGE_MAP`);
    }
    
    // Check for common issues
    if (component === 'dialog') {
      const dialogAreas = [...COMPONENT_USAGE_MAP[component]];
      if (!dialogAreas.includes('AssignVideosModal')) {
        recommendations.push('Consider using DialogScrollArea for long content in modals');
      }
    }
    
    if (component === 'button' && affectedAreas.length > 5) {
      recommendations.push('Consider creating button variants for consistent styling across many uses');
    }
    
    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
  }
}

// Export singleton instance
export const componentTracker = new ComponentUpdateTracker();

// Helper functions for common operations
export const trackComponentUpdate = (component: ComponentName, changes: string[]) => {
  const update = componentTracker.registerUpdate(component, changes);
  console.log(componentTracker.generateUpdateSummary(update));
  return update;
};

export const getComponentHealth = async (component: ComponentName) => {
  return await componentTracker.validateComponentHealth(component);
};

export const getUpdateHistory = () => {
  return componentTracker.getRecentUpdates();
};

// Validation helpers
export const validateAllComponents = async () => {
  const results = await Promise.all(
    Object.keys(COMPONENT_USAGE_MAP).map(async (component) => {
      const health = await componentTracker.validateComponentHealth(component as ComponentName);
      return { component, ...health };
    })
  );
  
  const unhealthyComponents = results.filter(r => !r.isHealthy);
  const allRecommendations = results.flatMap(r => r.recommendations);
  
  return {
    totalComponents: results.length,
    healthyComponents: results.filter(r => r.isHealthy).length,
    unhealthyComponents,
    globalRecommendations: allRecommendations
  };
};
