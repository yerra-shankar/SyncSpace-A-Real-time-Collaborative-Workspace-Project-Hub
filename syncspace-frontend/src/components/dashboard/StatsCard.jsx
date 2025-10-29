import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import '../../styles/App.css';

function StatsCard({ icon, label, value, color, trend, trendUp }) {
  const colorClasses = {
    blue: 'stat-card-icon-blue',
    green: 'stat-card-icon-green',
    purple: 'stat-card-icon-purple',
    orange: 'stat-card-icon-orange',
  };

  return (
    <div className="stat-card-container">
      <div className={`stat-card-icon ${colorClasses[color]}`}>
        {icon}
      </div>
      
      <div className="stat-card-content">
        <p className="stat-card-label">{label}</p>
        <div className="stat-card-value-row">
          <h3 className="stat-card-value">{value}</h3>
          {trend && (
            <div className={`stat-card-trend ${trendUp ? 'stat-card-trend-up' : 'stat-card-trend-down'}`}>
              {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trend}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsCard;