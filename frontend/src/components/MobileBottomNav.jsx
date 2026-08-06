import React from 'react';
import { 
  BarChart2, 
  ShoppingBag, 
  Truck,
  TrendingUp as GraphIcon,
  Store,
  Crown,
  PackageCheck,
  Layers
} from 'lucide-react';

const MobileBottomNav = ({ activeTab, setActiveTab }) => {
  const reports = [
    { id: 'total-sales', label: 'Total Sales', icon: BarChart2 },
    { id: 'direct-sales', label: 'Direct Sales', icon: ShoppingBag },
    { id: 'distributor-details', label: 'Distributor', icon: Truck },
    { id: 'cumulative-budget', label: 'Budget vs Cum.', icon: GraphIcon },
    { id: 'distributor-rd-annual', label: 'RD vs Annual', icon: Store },
    { id: 'cumulative-sales-gsh', label: 'Cum. GSH', icon: Crown },
    { id: 'distributor-primary-annual', label: 'Primary Annual', icon: PackageCheck },
    { id: 'distributor-target-actual', label: 'Target vs Actual', icon: Layers },
  ];

  return (
    <div className="mobile-bottom-nav-container">
      <div className="mobile-bottom-nav-scroll">
        {reports.map((report) => {
          const Icon = report.icon;
          const isActive = activeTab === report.id;
          return (
            <button
              key={report.id}
              onClick={() => setActiveTab(report.id)}
              className={`mobile-bottom-tab ${isActive ? 'active' : ''}`}
            >
              <Icon style={{ 
                width: '18px', 
                height: '18px', 
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                flexShrink: 0 
              }} />
              <span className="mobile-tab-label">{report.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
