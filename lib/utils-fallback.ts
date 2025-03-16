/**
 * This is a fallback file that will be used if the real utils.ts file is not found.
 */

// Function to merge class names (tailwind utility)
export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Add other utility functions as needed for fallback
export function formatDate(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
} 