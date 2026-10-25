import React from 'react';
import { Users, UserCheck, MessageSquare, CheckCheck } from 'lucide-react';

export default function StatsBar({ stats }) {
  const {
    total = 0,
    requestedCount = 0,
    messagedCount = 0,
    bothCount = 0,
    requestedPercent = 0,
    messagedPercent = 0,
  } = stats || {};

  const cards = [
    {
      title: 'Total Recruiters',
      value: total.toLocaleString(),
      subtext: 'Imported from database',
      icon: Users,
      iconColor: 'text-indigo-400',
      bgColor: 'bg-indigo-950/30',
      borderColor: 'border-indigo-900/40',
      progress: null,
    },
    {
      title: 'Your Requests Sent',
      value: requestedCount.toLocaleString(),
      subtext: `${requestedPercent}% of pipeline requested by you`,
      icon: UserCheck,
      iconColor: 'text-sky-400',
      bgColor: 'bg-sky-950/30',
      borderColor: 'border-sky-900/40',
      progress: requestedPercent,
      progressColor: 'bg-sky-500',
    },
    {
      title: 'Your Messages Sent',
      value: messagedCount.toLocaleString(),
      subtext: `${messagedPercent}% reached out by you`,
      icon: MessageSquare,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-950/30',
      borderColor: 'border-emerald-900/40',
      progress: messagedPercent,
      progressColor: 'bg-emerald-500',
    },
    {
      title: 'Your Full Outreach',
      value: bothCount.toLocaleString(),
      subtext: 'Both requested & messaged by you',
      icon: CheckCheck,
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-950/30',
      borderColor: 'border-purple-900/40',
      progress: total > 0 ? Math.round((bothCount / total) * 100) : 0,
      progressColor: 'bg-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${card.borderColor} ${card.bgColor} bg-slate-900/50 backdrop-blur-sm transition-all hover:bg-slate-800/40`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  {card.title}
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {card.value}
                </h3>
              </div>
              <div className={`p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/60 ${card.iconColor}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>

            {card.progress !== null && (
              <div className="mt-3">
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${card.progressColor} transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(0, card.progress))}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
              <span>{card.subtext}</span>
              {card.progress !== null && (
                <span className="font-semibold text-slate-300">{card.progress}%</span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
