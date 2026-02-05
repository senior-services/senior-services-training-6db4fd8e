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
    
    case 'hide-employee':
      return 'Hide employee from list';
    
    case 'show-employee':
      return 'Show employee in main list';
    
    case 'hide-video':
      return 'Hide Video from List';
    
    case 'show-video':
      return 'Show Video in List';
    
    case 'delete-video-blocked':
      return context?.status ? `Cannot delete: ${context.status}. Hide video instead to remove from list.` : 'Cannot delete: Video has been assigned or completed by users';
    
    case 'delete-quiz-blocked':
      return context?.status ? `Cannot delete: ${context.status}` : 'Cannot delete: Quiz has been completed by users';
    
    default:
      return action;
  }
};