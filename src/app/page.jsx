'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Zap,
  Battery,
  BatteryCharging,
  Navigation,
  MapPin,
  Settings,
  ChevronRight,
  Wind,
  Activity,
  Layers,
  Wifi,
  AlertTriangle,
  RefreshCw,
  Server,
  Lock,
  Car,
  Gauge,
  Map,
  Route,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

const CONFIG = {
  USE_PROXY: true,
  PROXY_ENDPOINT: '/api/proxy',
  TESLAMATE_URL: process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3001',
  TOKEN: process.env.NEXT_PUBLIC_GRAFANA_TOKEN || '',
  DATASOURCE_UID: process.env.NEXT_PUBLIC_DATASOURCE_UID || 'YOUR_DATASOURCE_UID',
};

// --- Mock Data (Fallback) ---
const MOCK_DRIVE_STATS = [
  { day: 'Mon', distance: 45, energy: 12 },
  { day: 'Tue', distance: 32, energy: 8.5 },
  { day: 'Wed', distance: 58, energy: 15.2 },
  { day: 'Thu', distance: 12, energy: 3.1 },
  { day: 'Fri', distance: 89, energy: 24.5 },
  { day: 'Sat', distance: 120, energy: 32.0 },
  { day: 'Sun', distance: 65, energy: 16.8 },
];

const MOCK_CHARGING_HISTORY = [
  { day: 'Mon', energy: 22, cost: 13.8 },
  { day: 'Tue', energy: 8.4, cost: 5.1 },
  { day: 'Wed', energy: 0, cost: 0 },
  { day: 'Thu', energy: 15.2, cost: 9.4 },
  { day: 'Fri', energy: 18.6, cost: 11.6 },
  { day: 'Sat', energy: 25.1, cost: 14.2 },
  { day: 'Sun', energy: 12.7, cost: 8.3 },
];

const RECENT_TRIPS = [
  { id: 1, date: 'Today, 08:30 AM', from: 'Home', to: 'Office', distance: '15.2 km', duration: '24 min' },
  { id: 2, date: 'Yesterday, 06:15 PM', from: 'Office', to: 'Supercharger', distance: '8.4 km', duration: '15 min' },
];

const MOCK_CHARGES = [
  { id: 1, started_at: 'Yesterday 21:08', energy: '26.3 kWh', cost: '¥ 15.8' },
  { id: 2, started_at: '2 days ago 10:15', energy: '18.1 kWh', cost: '¥ 10.9' },
];

const DEFAULT_CHARGING_SUMMARY = {
  energy: 0,
  cost: 0,
  costPerKwh: 0,
};

const DEFAULT_CAR_STATUS = {
  name: 'Tesla Model 3',
  state: 'offline',
  batteryLevel: 0,
  range: '0 km',
  odometer: '0 km',
  version: '---',
  location: 'Unknown',
  speed: 0,
  inside_temp: 0,
  outside_temp: 0,
};

const translations = {
  en: {
    brand: 'TeslaMate',
    frameworkSubtitle: 'Vehicle overview powered by TeslaMate',
    nav: {
      dashboard: 'Dashboard',
      charging: 'Charging',
    },
    connection: {
      connected: 'Connected',
      on: 'On',
      connecting: 'Connecting...',
      authFailed: 'Auth Failed',
      failed: 'Connection Failed',
      authTitle: 'Authentication Error',
      errorTitle: 'Connection Error',
      proxyLabel: 'Proxy Mode',
      helpSteps: [
        'The Token provided is incorrect or expired.',
        'Open your Grafana instance',
        'Navigate to Configuration -> Service Accounts',
        'Create a new Service Account & Token',
        'Update NEXT_PUBLIC_GRAFANA_TOKEN in .env.local',
      ],
      networkHint: 'Check your network connection to',
    },
    quickActionsTitle: 'Actions',
    quickActions: [
      { id: 'drives', label: 'Drive logs', icon: Route },
      { id: 'charges', label: 'Charging logs', icon: BatteryCharging },
      { id: 'tracks', label: 'Map tracks', icon: Map },
      { id: 'alerts', label: 'Alerts & errors', icon: AlertTriangle },
      { id: 'journey', label: 'Trip journal', icon: Navigation },
      { id: 'battery', label: 'Battery health', icon: Battery },
      { id: 'tires', label: 'Tire & safety', icon: ShieldCheck },
      { id: 'stats', label: 'Driving stats', icon: Gauge },
    ],
    cards: {
      batteryStatus: 'Battery status',
      range: 'Estimated range',
      state: 'Vehicle state',
      location: 'Location',
      inside: 'Cabin',
      outside: 'Exterior',
      monthlyMileage: 'Monthly mileage',
      thisMonth: 'This month',
      lastMonth: 'Last month',
      latestTrip: 'Recent trip',
      latestCharge: 'Recent charge',
      distance: 'Distance',
      duration: 'Duration',
      started: 'Started',
      energy: 'Energy',
      cost: 'Cost',
      noTrip: 'No trips found',
      noCharge: 'No charging sessions found',
      driveDistance: 'Driving distance (7d)',
      chargingTrend: 'Charging trend (14d)',
      recentDrives: 'Recent drives',
      chargingSessions: 'Recent charging sessions',
    },
    empty: {
      noDriveData: 'No drive data available',
      noTrips: 'No trips found',
      noCharging: 'No charging data available',
      noChargingHistory: 'No charging history found',
    },
    buttons: {
      language: '中文 / EN',
    },
    labels: {
      route: 'Route',
      odometer: 'Odometer',
      version: 'Version',
      speed: 'Speed',
      km: 'km',
      min: 'min',
      kwh: 'kWh',
      currency: '¥',
    },
  },
  zh: {
    brand: '特斯拉管家',
    frameworkSubtitle: '基于 TeslaMate 的车辆概览',
    nav: {
      dashboard: '驾驶概览',
      charging: '充电分析',
    },
    connection: {
      connected: '已连接',
      on: '在线',
      connecting: '连接中...',
      authFailed: '认证失败',
      failed: '连接异常',
      authTitle: '认证错误',
      errorTitle: '连接错误',
      proxyLabel: '代理模式',
      helpSteps: [
        '提供的 Token 不正确或已失效。',
        '前往你的 Grafana 实例',
        '进入 Configuration -> Service Accounts',
        '创建新的 Service Account 与 Token',
        '更新 .env.local 中的 NEXT_PUBLIC_GRAFANA_TOKEN',
      ],
      networkHint: '检查到以下地址的网络连接',
    },
    quickActionsTitle: '功能分类',
    quickActions: [
      { id: 'drives', label: '行程记录', icon: Route },
      { id: 'charges', label: '充电记录', icon: BatteryCharging },
      { id: 'tracks', label: '地图轨迹', icon: Map },
      { id: 'alerts', label: '异常提醒', icon: AlertTriangle },
      { id: 'journey', label: '行程日历', icon: Navigation },
      { id: 'battery', label: '电池健康', icon: Battery },
      { id: 'tires', label: '胎压/安全', icon: ShieldCheck },
      { id: 'stats', label: '驾驶统计', icon: Gauge },
    ],
    cards: {
      batteryStatus: '电池状态',
      range: '续航里程',
      state: '车辆状态',
      location: '车辆位置',
      inside: '车内温度',
      outside: '外界温度',
      monthlyMileage: '月度里程',
      thisMonth: '本月',
      lastMonth: '上月',
      latestTrip: '最近行程',
      latestCharge: '最近充电',
      distance: '里程',
      duration: '用时',
      started: '开始时间',
      energy: '充电量',
      cost: '费用',
      noTrip: '暂无行程数据',
      noCharge: '暂无充电数据',
      driveDistance: '7 日行驶里程',
      chargingTrend: '14 日充电趋势',
      recentDrives: '近期行程',
      chargingSessions: '近期充电',
    },
    empty: {
      noDriveData: '暂无驾驶数据',
      noTrips: '暂无行程记录',
      noCharging: '暂无充电数据',
      noChargingHistory: '暂无充电记录',
    },
    buttons: {
      language: 'EN / 中文',
    },
    labels: {
      route: '路线',
      odometer: '总里程',
      version: '版本',
      speed: '车速',
      km: '公里',
      min: '分钟',
      kwh: '千瓦时',
      currency: '¥',
    },
  },
};

const fetchGrafanaData = async (sqlString) => {
  try {
    let response;

    if (CONFIG.USE_PROXY) {
      response = await fetch(CONFIG.PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlString }),
      });
    } else {
      response = await fetch(`${CONFIG.TESLAMATE_URL}/api/ds/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CONFIG.TOKEN}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          queries: [
            {
              refId: 'A',
              datasource: { type: 'postgres', uid: CONFIG.DATASOURCE_UID },
              rawSql: sqlString,
              format: 'table',
            },
          ],
          from: 'now-6h',
          to: 'now',
        }),
      });
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication Failed (401): Invalid Token. Please check NEXT_PUBLIC_GRAFANA_TOKEN.');
      }
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error('Data Fetch Error:', error);
    throw error;
  }
};

const parseGrafanaRows = (result) => {
  const frame = result?.results?.A?.frames?.[0];
  const fields = frame?.schema?.fields || [];
  const values = frame?.data?.values || [];

  if (!fields.length || !values.length) return [];

  const rowCount = values[0]?.length || 0;
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const row = {};
    fields.forEach((field, colIdx) => {
      row[field.name] = values[colIdx]?.[rowIndex];
    });
    return row;
  });
};

// --- Components ---
const ConnectionStatus = ({ status, error }) => {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">
        <Wifi size={12} />
        <span className="hidden sm:inline">{translate('connection.connected')}</span>
        <span className="sm:hidden">{translate('connection.on')}</span>
      </div>
    );
  }
  if (status === 'error') {
    const isAuthError = error?.message?.includes('401') || error?.message?.includes('Invalid');
    return (
      <div className="group relative flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-full cursor-help">
        {isAuthError ? <Lock size={12} /> : <AlertTriangle size={12} />}
        <span className="hidden sm:inline">{isAuthError ? translate('connection.authFailed') : translate('connection.failed')}</span>
        <span className="sm:hidden">{translate('connection.failed')}</span>
        <div className="absolute top-full right-0 mt-2 w-80 p-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl text-zinc-300 z-50 hidden group-hover:block">
          <div className="font-bold text-white mb-2 flex items-center gap-2">
            <Server size={14} />
            {isAuthError ? translate('connection.authTitle') : translate('connection.errorTitle')}
          </div>
          <div className="text-xs font-mono bg-black/50 p-2 rounded mb-3 break-all border border-red-500/30 text-red-300">
            {error?.message || 'Unknown Error'}
          </div>
          {isAuthError ? (
            <div className="text-xs text-zinc-400 space-y-2">
              <p className="font-medium text-white">{translate('connection.authTitle')}</p>
              <ol className="list-decimal pl-4 space-y-1">
                {translate('connection.helpSteps').map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              {translate('connection.networkHint')} {CONFIG.TESLAMATE_URL}
            </p>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs rounded-full">
      <RefreshCw size={12} className="animate-spin" />
      <span className="hidden sm:inline">{translate('connection.connecting')}</span>
      <span className="sm:hidden">{translate('connection.connecting')}</span>
    </div>
  );
};

const Card = ({ children, className = '', title, subtitle, icon: Icon }) => (
  <div className={`bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 ${className} transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/80`}>
    {(title || Icon) && (
      <div className="flex justify-between items-start mb-4">
        <div>
          {title && <h3 className="text-zinc-100 font-medium text-lg">{title}</h3>}
          {subtitle && <p className="text-zinc-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
        {Icon && <Icon className="w-5 h-5 text-zinc-500" />}
      </div>
    )}
    {children}
  </div>
);

const ProgressBar = ({ value, color = 'bg-blue-500' }) => (
  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
    <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${value}%` }} />
  </div>
);

const StatRow = ({ icon: Icon, label, value, suffix }) => (
  <div className="flex items-center justify-between py-1.5">
    <div className="flex items-center gap-2 text-sm text-zinc-400">
      <Icon size={14} />
      <span>{label}</span>
    </div>
    <div className="text-zinc-100 font-medium">
      {value}
      {suffix && <span className="text-zinc-500 text-sm ml-1">{suffix}</span>}
    </div>
  </div>
);

const QuickActionGrid = ({ items }) => (
  <div className="grid grid-cols-4 gap-3">
    {items.map((item) => {
      const Icon = item.icon;
      return (
        <div
          key={item.id}
          className="flex flex-col items-center gap-2 bg-zinc-900/70 border border-zinc-800 rounded-xl py-4 hover:border-zinc-700 transition-colors text-center"
        >
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-blue-400">
            <Icon size={18} />
          </div>
          <span className="text-sm text-zinc-200 leading-tight">{item.label}</span>
        </div>
      );
    })}
  </div>
);

// --- Views (dashboard & charging only, like before) ---
const DashboardView = ({ carStatus, driveStats, recentDrives, chargingHistory }) => {
  const driveData = driveStats?.length ? driveStats : MOCK_DRIVE_STATS;
  const tripData = recentDrives?.length ? recentDrives : RECENT_TRIPS;
  const chargingData = chargingHistory?.length ? chargingHistory : MOCK_CHARGING_HISTORY;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Main Car Status */}
      <div className="lg:col-span-2 relative h-80 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black z-0" />
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div className="w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 p-8 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{carStatus.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${carStatus.state === 'online' || carStatus.state === 'driving' ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
                <span className={`font-medium uppercase text-xs tracking-wider ${carStatus.state === 'online' || carStatus.state == 'driving' ? 'text-green-400' : 'text-zinc-500'}`}>{carStatus.state}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-white tracking-tighter">
                {carStatus.batteryLevel}<span className="text-2xl text-zinc-500">%</span>
              </div>
              <div className="text-zinc-400 mt-1">{carStatus.range} Range</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-8">
            <StatBadge icon={Navigation} label="Odometer" value={carStatus.odometer} unit="" />
            <StatBadge icon={Wind} label="Temp (In)" value={carStatus.inside_temp} unit="°C" />
            <StatBadge icon={Settings} label="Version" value={carStatus.version} unit="" />
            <StatBadge icon={MapPin} label="Location" value={carStatus.location} unit="" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="space-y-6">
        <Card title="Battery Health" icon={Battery}>
          <div className="mt-2">
            <div className="flex justify-between mb-2">
              <span className="text-zinc-300">Degradation</span>
              <span className="text-green-400">2.4%</span>
            </div>
            <ProgressBar value={97.6} color="bg-green-500" />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-zinc-500 text-xs">Usable</div>
                <div className="text-zinc-200 text-lg font-medium">75.4 kWh</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs">Nominal</div>
                <div className="text-zinc-200 text-lg font-medium">78.0 kWh</div>
              </div>
            </div>
          </div>
        </Card>
        <Card title="Driving Distance (7d)" subtitle="Aggregated by day" icon={Activity}>
          <div className="h-32 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={driveData}>
                <Line type="monotone" dataKey="distance" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#e4e4e7' }}
                  formatter={(value) => [`${value} km`, 'Distance']}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Drives */}
      <div className="lg:col-span-2">
        <Card title="Recent Drives" subtitle="Latest trips from TeslaMate">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="pb-3 font-medium text-zinc-500 pl-2">Start</th>
                  <th className="pb-3 font-medium text-zinc-500">Route</th>
                  <th className="pb-3 font-medium text-zinc-500">Distance</th>
                  <th className="pb-3 font-medium text-zinc-500 text-right pr-2">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {tripData.map((trip) => (
                  <tr key={trip.id} className="group hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 pl-2 text-zinc-300">{trip.date || trip.start_time}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">{trip.from || trip.start_address}</span>
                        <ChevronRight size={12} className="text-zinc-600" />
                        <span className="text-zinc-200">{trip.to || trip.end_address}</span>
                      </div>
                    </td>
                    <td className="py-3 text-zinc-300">{trip.distance || `${trip.distance_km ?? 0} km`}</td>
                    <td className="py-3 text-right pr-2 text-zinc-300">{trip.duration || `${trip.duration_min ?? 0} min`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Weekly Charging */}
      <Card title="Charging (14d)" className="lg:col-span-1">
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chargingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} />
              <Tooltip
                cursor={{fill: '#27272a'}}
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                formatter={(value) => [`${value} kWh`, 'Energy']}
              />
              <Bar dataKey="energy" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

const ChargingView = ({ chargingSummary, chargingHistory, recentCharges }) => {
  const summary = chargingSummary || DEFAULT_CHARGING_SUMMARY;
  const history = chargingHistory?.length ? chargingHistory : MOCK_CHARGING_HISTORY;
  const charges = recentCharges?.length ? recentCharges : MOCK_CHARGES;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-center items-center py-8">
          <div className="text-zinc-500 mb-2">Total Charged (30d)</div>
          <div className="text-4xl font-bold text-white">{summary.energy.toFixed(1)} <span className="text-xl text-zinc-600 font-normal">kWh</span></div>
        </Card>
        <Card className="flex flex-col justify-center items-center py-8">
          <div className="text-zinc-500 mb-2">Total Cost</div>
          <div className="text-4xl font-bold text-white">¥ {summary.cost.toFixed(2)}</div>
        </Card>
        <Card className="flex flex-col justify-center items-center py-8">
          <div className="text-zinc-500 mb-2">Avg. Cost/kWh</div>
          <div className="text-4xl font-bold text-white">¥ {summary.costPerKwh.toFixed(2)}</div>
        </Card>
      </div>

      <Card title="Charging Trend (14d)" subtitle="Energy & cost per day">
        <div className="h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="chargeEnergy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#71717a'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a'}} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                itemStyle={{ color: '#e4e4e7' }}
                formatter={(value, name) => [name === 'cost' ? `¥ ${value}` : `${value} kWh`, name === 'cost' ? 'Cost' : 'Energy']}
              />
              <Area type="monotone" dataKey="energy" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#chargeEnergy)" />
              <Line type="monotone" dataKey="cost" stroke="#3b82f6" strokeDasharray="5 5" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Recent Charging Sessions">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="pb-3 font-medium text-zinc-500 pl-2">Started</th>
                <th className="pb-3 font-medium text-zinc-500">Energy</th>
                <th className="pb-3 font-medium text-zinc-500 text-right pr-2">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {charges.map((session) => (
                <tr key={session.id} className="group hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 pl-2 text-zinc-300">{session.started_at}</td>
                  <td className="py-3 text-zinc-300">{session.energy !== undefined ? `${session.energy} kWh` : '—'}</td>
                  <td className="py-3 text-right pr-2 text-zinc-300">{session.cost !== undefined ? `¥ ${session.cost}` : '—'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// --- Main Layout ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [carStatus, setCarStatus] = useState(DEFAULT_CAR_STATUS);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [connectionError, setConnectionError] = useState(null);
  const [driveStats, setDriveStats] = useState(MOCK_DRIVE_STATS);
  const [recentDrives, setRecentDrives] = useState(RECENT_TRIPS);
  const [chargingHistory, setChargingHistory] = useState(MOCK_CHARGING_HISTORY);
  const [chargingSummary, setChargingSummary] = useState(DEFAULT_CHARGING_SUMMARY);
  const [recentCharges, setRecentCharges] = useState(MOCK_CHARGES);

  useEffect(() => {
    async function loadData() {
      setConnectionStatus('connecting');
      const carSql = `
        SELECT
          c.name,
          p.battery_level,
          p.est_battery_range_km,
          p.odometer,
          p.speed,
          p.inside_temp,
          p.outside_temp,
          CASE
              WHEN p.date > (NOW() - INTERVAL '2 minutes') THEN 'online'
              ELSE 'asleep'
          END as status
        FROM cars c
        JOIN positions p ON p.car_id = c.id
        LEFT JOIN addresses a ON p.address_id = a.id
        ORDER BY p.date DESC LIMIT 1;
      `;
      try {
        const result = await fetchGrafanaData(carSql);
        const frame = result?.results?.A?.frames?.[0];
        const values = frame?.data?.values;
        if (values) {
          const name = values[0]?.[0];
          const battery = values[1]?.[0];
          const range = values[2]?.[0];
          const odometer = values[3]?.[0];
          const speed = values[4]?.[0];
          const inside = values[5]?.[0];
          const outside = values[6]?.[0];
          const location = values[7]?.[0];
          const status = values[8]?.[0];

          setCarStatus({
            name: name || 'Tesla',
            state: status || 'unknown',
            batteryLevel: battery || 0,
            range: `${Math.round(range || 0)} km`,
            odometer: `${Math.round(odometer || 0).toLocaleString()} km`,
            version: '---',
            location: location || 'Unknown',
            speed: speed || 0,
            inside_temp: inside || 0,
            outside_temp: outside || 0,
          });
          setConnectionStatus('connected');
          setConnectionError(null);
        } else {
          setConnectionStatus('connected');
        }
      } catch (e) {
        setConnectionError(e);
        setConnectionStatus('error');
        setCarStatus({
          ...DEFAULT_CAR_STATUS,
          state: 'offline',
        });
      }

      const driveStatsSql = `
        SELECT
          to_char(date_trunc('day', start_date), 'Mon DD') AS day,
          ROUND(SUM(distance), 1) AS distance
        FROM drives
        WHERE start_date >= NOW() - INTERVAL '7 days'
        GROUP BY 1
        ORDER BY date_trunc('day', start_date);
      `;

      const recentDrivesSql = `
        SELECT
          d.id,
          to_char(d.start_date, 'YYYY-MM-DD HH24:MI') AS start_time,
          COALESCE(a1.name, 'Unknown') AS start_address,
          COALESCE(a2.name, 'Unknown') AS end_address,
          ROUND(d.distance, 1) AS distance_km,
          ROUND(d.duration_min, 0) AS duration_min
        FROM drives d
        LEFT JOIN addresses a1 ON d.start_address_id = a1.id
        LEFT JOIN addresses a2 ON d.end_address_id = a2.id
        ORDER BY d.start_date DESC
        LIMIT 6;
      `;

      const chargingSummarySql = `
        SELECT
          ROUND(COALESCE(SUM(cp.charge_energy_added), 0), 1) AS energy,
          ROUND(COALESCE(SUM(cp.cost), 0), 2) AS cost,
          ROUND(COALESCE(SUM(cp.cost) / NULLIF(SUM(cp.charge_energy_added), 0), 0), 2) AS cost_per_kwh
        FROM charging_processes cp
        WHERE cp.start_date >= NOW() - INTERVAL '30 days';
      `;

      const chargingHistorySql = `
        SELECT
          to_char(date_trunc('day', start_date), 'Mon DD') AS day,
          ROUND(SUM(charge_energy_added), 1) AS energy,
          ROUND(SUM(cost), 2) AS cost
        FROM charging_processes
        WHERE start_date >= NOW() - INTERVAL '14 days'
        GROUP BY 1
        ORDER BY date_trunc('day', start_date);
      `;

      const recentChargesSql = `
        SELECT
          cp.id,
          to_char(cp.start_date, 'YYYY-MM-DD HH24:MI') AS started_at,
          ROUND(cp.charge_energy_added, 1) AS energy,
          COALESCE(cp.cost, 0) AS cost
        FROM charging_processes cp
        ORDER BY cp.start_date DESC
        LIMIT 5;
      `;

      try {
        const driveRows = parseGrafanaRows(await fetchGrafanaData(driveStatsSql));
        if (driveRows.length) {
          setDriveStats(
            driveRows.map((row, idx) => ({
              id: row.id ?? idx,
              day: row.day || row.day_label,
              distance: Number(row.distance || row.distance_km || 0),
              energy: Number(row.energy || 0)
            }))
          );
        }
      } catch (err) {
        console.warn('Drive stats fallback', err);
      }

      try {
        const tripRows = parseGrafanaRows(await fetchGrafanaData(recentDrivesSql));
        if (tripRows.length) {
          setRecentDrives(
            tripRows.map((row) => ({
              id: row.id,
              start_time: row.start_time,
              start_address: row.start_address,
              end_address: row.end_address,
              distance_km: Number(row.distance_km || 0),
              duration_min: Number(row.duration_min || 0)
            }))
          );
        }
      } catch (err) {
        console.warn('Recent drives fallback', err);
      }

      try {
        const summaryRows = parseGrafanaRows(await fetchGrafanaData(chargingSummarySql));
        const summaryRow = summaryRows[0];
        if (summaryRow) {
          setChargingSummary({
            energy: Number(summaryRow.energy || 0),
            cost: Number(summaryRow.cost || 0),
            costPerKwh: Number(summaryRow.cost_per_kwh || 0),
          });
        }
      } catch (err) {
        console.warn('Charging summary fallback', err);
      }

      try {
        const historyRows = parseGrafanaRows(await fetchGrafanaData(chargingHistorySql));
        if (historyRows.length) {
          setChargingHistory(
            historyRows.map((row, idx) => ({
              id: row.id ?? idx,
              day: row.day,
              energy: Number(row.energy || 0),
              cost: Number(row.cost || 0),
            }))
          );
        }
      } catch (err) {
        console.warn('Charging history fallback', err);
      }

      try {
        const chargesRows = parseGrafanaRows(await fetchGrafanaData(recentChargesSql));
        if (chargesRows.length) {
          setRecentCharges(
            chargesRows.map((row) => ({
              id: row.id,
              started_at: row.started_at,
              energy: Number(row.energy || 0),
              cost: Number(row.cost || 0),
            }))
          );
        }
      } catch (err) {
        console.warn('Recent charges fallback', err);
      }
    }

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const NavItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeTab === id
          ? 'bg-blue-600/10 text-blue-400 font-medium'
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  const proxyLabel = CONFIG.USE_PROXY ? 'Proxy Mode: ON' : 'Proxy Mode: OFF';

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="flex h-screen overflow-hidden">
        <aside className="border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl flex flex-col w-64">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-900/20">
              <Zap className="text-white" size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight">{translate('brand')}</span>
              <span className="text-xs text-zinc-500">{translate('frameworkSubtitle')}</span>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            <NavItem id="dashboard" icon={Layers} label={translate('nav.dashboard')} />
            <NavItem id="charging" icon={BatteryCharging} label={translate('nav.charging')} />
          </nav>

          <div className="p-4 border-t border-zinc-800 space-y-2">
            <button
              onClick={() => setLanguage((prev) => (prev === 'en' ? 'zh' : 'en'))}
              className="flex items-center justify-center gap-3 text-zinc-400 hover:text-white transition-colors w-full px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800"
            >
              <Settings size={18} />
              <span>{translate('buttons.language')}</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto md:p-8 p-4">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold capitalize">{translate(`nav.${activeTab}`)}</h2>
              <p className="text-zinc-400 text-sm">{translate('frameworkSubtitle')}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <ConnectionStatus status={connectionStatus} error={connectionError} translate={translate} />
              <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 hidden md:block">
                {proxyLabel}
              </span>
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <DashboardView
              carStatus={carStatus}
              driveStats={driveStats}
              recentDrives={recentDrives}
              chargingHistory={chargingHistory}
            />
          )}
          {activeTab === 'charging' && (
            <ChargingView
              chargingSummary={chargingSummary}
              chargingHistory={chargingHistory}
              recentCharges={recentCharges}
            />
          )}
        </main>
      </div>
    </div>
  );
}
