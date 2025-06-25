const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return 'bg-blue-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}; 