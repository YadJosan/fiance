import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) {
    return `Today, ${d.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }
}

export function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Food & Dining': '☕',
    'Transportation': '⛽',
    'Shopping': '🛒',
    'Bills & Utilities': '💡',
    'Entertainment': '🎬',
    'Healthcare': '🏥',
    'Salary': '💰',
    'Freelance': '💼',
    'Investment': '📈',
    'Gift': '🎁',
    'Refund': '↩️',
    'Other Income': '💵',
    'Other': '📝'
  };
  
  return iconMap[category] || '📝';
}

export function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Food & Dining': 'bg-red-100 text-red-600',
    'Transportation': 'bg-blue-100 text-blue-600',
    'Shopping': 'bg-purple-100 text-purple-600',
    'Bills & Utilities': 'bg-yellow-100 text-yellow-600',
    'Entertainment': 'bg-pink-100 text-pink-600',
    'Healthcare': 'bg-green-100 text-green-600',
    'Salary': 'bg-emerald-100 text-emerald-600',
    'Freelance': 'bg-blue-100 text-blue-600',
    'Investment': 'bg-indigo-100 text-indigo-600',
    'Gift': 'bg-pink-100 text-pink-600',
    'Refund': 'bg-gray-100 text-gray-600',
    'Other Income': 'bg-green-100 text-green-600',
    'Other': 'bg-gray-100 text-gray-600'
  };
  
  return colorMap[category] || 'bg-gray-100 text-gray-600';
}
