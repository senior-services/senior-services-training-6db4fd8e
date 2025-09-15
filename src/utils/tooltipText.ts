interface TooltipContext {
  name?: string;
  status?: string;
  isPending?: boolean;
}

/**
 * Utility function for generating dynamic, context-aware tooltip text
 * Future: integrate with i18n system
 */
export const getTooltipText = (action: string, context?: TooltipContext): string => {
  switch (action) {
    case 'archive-employee':
      return 'Archive Employee';
    
    case 'remove-admin':
      return 'Remove Admin';
    
    case 'remove-file':
      return 'Remove Selected File';
    
    case 'edit-item':
      return 'Edit';
    
    case 'delete-item':
      return context?.name ? `Delete ${context.name}` : 'Delete item';
    
    case 'assign-videos':
      return 'Assign Videos';
    
    case 'unarchive-employee':
      return 'Unarchive Employee';
    
    default:
      return action;
  }
};