import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  BarChart3,
  Key,
  Settings,
  Activity,
  Target
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Keywords', href: '/keywords', icon: Key },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <div className="flex flex-col w-64 bg-gray-900">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 bg-gray-800">
        <Target className="w-8 h-8 text-indigo-500" />
        <span className="ml-3 text-xl font-semibold text-white">Leadscout</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Status indicator */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center px-3 py-2">
          <Activity className="w-5 h-5 text-green-400 animate-pulse" />
          <span className="ml-3 text-sm text-gray-400">System Active</span>
        </div>
      </div>
    </div>
  );
}