"use client";

export default function ScoreBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let ringColor = 'ring-gray-200';
  
  if (score >= 0.8) {
    bgColor = 'bg-success-100';
    textColor = 'text-success-800';
    ringColor = 'ring-success-200';
  } else if (score >= 0.65) {
    bgColor = 'bg-upwork-100';
    textColor = 'text-upwork-800';
    ringColor = 'ring-upwork-200';
  } else if (score >= 0.5) {
    bgColor = 'bg-warning-100';
    textColor = 'text-warning-800';
    ringColor = 'ring-warning-200';
  } else if (score >= 0.3) {
    bgColor = 'bg-orange-100';
    textColor = 'text-orange-800';
    ringColor = 'ring-orange-200';
  } else {
    bgColor = 'bg-danger-100';
    textColor = 'text-danger-800';
    ringColor = 'ring-danger-200';
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ring-1 ring-inset ${bgColor} ${textColor} ${ringColor}`}>
        {percentage}%
      </div>
      <div className="w-16 bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            score >= 0.8 ? 'bg-success-500' :
            score >= 0.65 ? 'bg-upwork-500' :
            score >= 0.5 ? 'bg-warning-500' :
            score >= 0.3 ? 'bg-orange-500' :
            'bg-danger-500'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
