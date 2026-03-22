export const contextTypeTranslations: Record<string, string> = {
  RESIDENT: 'דייר',
  MANAGER: 'מנהל',
  ADMIN: 'מנהל מערכת',
};

export const translateContextType = (contextType?: string): string => {
  if (!contextType) return '';
  return contextTypeTranslations[contextType] || contextType;
};
