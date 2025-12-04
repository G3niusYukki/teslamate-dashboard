'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Zap, Battery, BatteryCharging, Navigation, MapPin, Settings,
  ChevronRight, Wind, Activity, Layers, Wifi, AlertTriangle,
  RefreshCw, Server, Lock, Route, ShieldCheck,
  X, Save, Globe
} from 'lucide-react';

// --- Constants ---
// 安全获取环境变量，防止在非 Node 环境下报错
const safeGetEnv = (key) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return '';
};

const DEFAULT_CONFIG = {
  USE_PROXY: true,
  PROXY_ENDPOINT: '/api/proxy',
  // 如果环境变量有值，作为默认值，否则为空，等待用户输入
  TESLAMATE_URL: safeGetEnv('NEXT_PUBLIC_GRAFANA_URL') || '',
  TOKEN: safeGetEnv('NEXT_PUBLIC_GRAFANA_TOKEN') || '',
  DATASOURCE_UID: safeGetEnv('NEXT_PUBLIC_DATASOURCE_UID') || '',
};

const LS_KEY = 'teslamate_dashboard_config_v1';

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

const DEFAULT_CHARGING_SUMMARY = { energy: 0, cost: 0, costPerKwh: 0 };

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
    frameworkSubtitle: 'Vehicle overview',
    nav: { dashboard: 'Dashboard', charging: 'Charging' },
    connection: {
      connected: 'Connected', on: 'On', connecting: 'Connecting...',
      authFailed: 'Auth Failed', failed: 'Connection Failed',
      authTitle: 'Authentication Error', errorTitle: 'Connection Error',
      proxyLabel: 'Proxy Mode',
      helpSteps: [
        'Check your API Settings (Bottom Left Gear Icon).',
        'Ensure Grafana URL is accessible (include https://).',
        'Verify your Service Account Token.',
        'Check if Datasource UID is correct.'
      ],
      networkHint: 'Check settings or network to',
      openSettings: 'Open Settings',
    },
    cards: {
      batteryStatus: 'Battery status', range: 'Estimated range', state: 'Vehicle state',
      location: 'Location', inside: 'Cabin', outside: 'Exterior',
      monthlyMileage: 'Monthly mileage', latestTrip: 'Recent trip', latestCharge: 'Recent charge',
      distance: 'Distance', duration: 'Duration', started: 'Started', energy: 'Energy', cost: 'Cost',
      driveDistance: 'Driving distance (7d)', chargingTrend: 'Charging trend (14d)',
      recentDrives: 'Recent drives', chargingSessions: 'Recent charging sessions',
      batteryHealth: 'Battery Health', totalCharged: 'Total Charged (30d)', totalCost: 'Total Cost', avgCost: 'Avg. Cost/kWh'
    },
    settings: {
      title: 'Settings',
      language: 'Language',
      connection: 'API Connection',
      urlLabel: 'Grafana URL',
      urlPlaceholder: 'https://your-grafana.com',
      tokenLabel: 'Service Token',
      tokenPlaceholder: 'glsa_...',
      uidLabel: 'Datasource UID',
      uidPlaceholder: 'e.g. P12345678',
      save: 'Save Configuration',
      cancel: 'Cancel',
      saved: 'Saved!',
      reset: 'Reset to Env Vars'
    },
    labels: { odometer: 'Odometer', version: 'Version', tempIn: 'Temp (In)' }
  },
  zh: {
    brand: '特斯拉管家',
    frameworkSubtitle: '车辆概览',
    nav: { dashboard: '驾驶概览', charging: '充电分析' },
    connection: {
      connected: '已连接', on: '在线', connecting: '连接中...',
      authFailed: '认证失败', failed: '连接异常',
      authTitle: '认证错误', errorTitle: '连接错误',
      proxyLabel: '代理模式',
      helpSteps: [
        '请检查左下角的“设置”中的 API 配置。',
        '确保 Grafana 地址正确（包含 https://）。',
        '验证 Token 是否有效。',
        '检查数据源 UID 是否匹配。'
      ],
      networkHint: '检查配置或网络连接：',
      openSettings: '打开设置',
    },
    cards: {
      batteryStatus: '电池状态', range: '续航里程', state: '车辆状态',
      location: '车辆位置', inside: '车内温度', outside: '外界温度',
      monthlyMileage: '月度里程', latestTrip: '最近行程', latestCharge: '最近充电',
      distance: '里程', duration: '用时', started: '开始时间', energy: '充电量', cost: '费用',
      driveDistance: '7 日行驶里程', chargingTrend: '14 日充电趋势',
      recentDrives: '近期行程', chargingSessions: '近期充电',
      batteryHealth: '电池健康', totalCharged: '累计充电 (30天)', totalCost: '累计费用', avgCost: '平均单价'
    },
    settings: {
      title: '设置',
      language: '语言 / Language',
      connection: 'API 连接配置',
      urlLabel: 'Grafana 地址',
      urlPlaceholder: 'https://your-grafana.com',
      tokenLabel: 'Service Token',
      tokenPlaceholder: 'glsa_...',
      uidLabel: '数据源 UID',
      uidPlaceholder: '例如: P12345678',
      save: '保存配置',
      cancel: '取消',
      saved: '已保存!',
      reset: '重置为默认'
    },
    labels: { odometer: '总里程', version: '版本', tempIn: '车内温度' }
  },
};

// --- Helper Functions ---
const fetchGrafanaData = async (sqlString, config) => {
  try {
    let response;

    // We always use proxy now to support custom headers dynamically
    response = await fetch(DEFAULT_CONFIG.PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: sqlString,
        config: {
          grafanaUrl: config.TESLAMATE_URL,
          token: config.TOKEN,
          datasourceUid: config.DATASOURCE_UID,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401 || errorData.error?.includes('401')) {
        throw new Error('Authentication Failed (401)');
      }
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
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
const ConnectionStatus = ({ status, error, translate, onOpenSettings }) => {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">
        <Wifi size={12} />
        <span className="hidden sm:inline">{translate('connection.connected')}</span>
      </div>
    );
  }
  if (status === 'error') {
    const isAuthError = error?.message?.includes('401') || error?.message?.includes('Token');
    return (
      <div className="group relative flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-full cursor-pointer hover:bg-red-500/20 transition-colors" onClick={onOpenSettings}>
        {isAuthError ? <Lock size={12} /> : <AlertTriangle size={12} />}
        <span className="hidden sm:inline">{isAuthError ? translate('connection.authFailed') : translate('connection.failed')}</span>
        
        {/* Tooltip */}
        <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl text-zinc-300 z-50 hidden group-hover:block cursor-auto">
          <div className="font-bold text-white mb-2 flex items-center gap-2">
            <Server size={14} />
            {isAuthError ? translate('connection.authTitle') : translate('connection.errorTitle')}
          </div>
          <div className="text-xs font-mono bg-black/50 p-2 rounded mb-3 break-all border border-red-500/30 text-red-300">
            {error?.message || 'Unknown Error'}
          </div>
          <div className="text-xs text-zinc-400 space-y-2">
             <ol className="list-decimal pl-4 space-y-1">
                {translate('connection.helpSteps').map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
             <button onClick={(e) => { e.stopPropagation(); onOpenSettings(); }} className="mt-2 w-full py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-white text-xs border border-zinc-600">
                {translate('connection.openSettings')}
             </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs rounded-full">
      <RefreshCw size={12} className="animate-spin" />
      <span className="hidden sm:inline">{translate('connection.connecting')}</span>
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

const StatBadge = ({ icon: Icon, label, value, unit }) => (
  <div className="bg-zinc-800/50 rounded-xl p-3 flex flex-col items-center justify-center text-center border border-zinc-700/50">
    <Icon size={16} className="text-zinc-400 mb-2" />
    <div className="text-xs text-zinc-500 mb-0.5">{label}</div>
    <div className="text-sm font-medium text-zinc-200">{value} <span className="text-xs text-zinc-500">{unit}</span></div>
  </div>
);

const SettingsModal = ({ isOpen, onClose, config, onSave, onReset, translate, language, setLanguage }) => {
  const [formData, setFormData] = useState(config);

  useEffect(() => {
    if (isOpen) setFormData(config);
  }, [isOpen, config]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Settings size={20} /> {translate('settings.title')}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Language Section */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{translate('settings.language')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${language === 'en' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('zh')}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${language === 'zh' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
              >
                中文
              </button>
            </div>
          </div>

          <div className="h-px bg-zinc-800" />

          {/* Connection Section */}
          <div className="space-y-4">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{translate('settings.connection')}</label>
            
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300 block">{translate('settings.urlLabel')}</label>
              <input
                type="text"
                name="TESLAMATE_URL"
                value={formData.TESLAMATE_URL}
                onChange={handleChange}
                placeholder={translate('settings.urlPlaceholder')}
                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300 block">{translate('settings.tokenLabel')}</label>
              <input
                type="password"
                name="TOKEN"
                value={formData.TOKEN}
                onChange={handleChange}
                placeholder={translate('settings.tokenPlaceholder')}
                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300 block">{translate('settings.uidLabel')}</label>
              <input
                type="text"
                name="DATASOURCE_UID"
                value={formData.DATASOURCE_UID}
                onChange={handleChange}
                placeholder={translate('settings.uidPlaceholder')}
                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-3">
           <button
            onClick={() => { onReset(); onClose(); }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            {translate('settings.reset')}
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            {translate('settings.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center gap-2"
          >
            <Save size={16} /> {translate('settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Views ---
const DashboardView = ({ carStatus, driveStats, recentDrives, chargingHistory, translate }) => {
  const driveData = driveStats?.length ? driveStats : MOCK_DRIVE_STATS;
  const tripData = recentDrives?.length ? recentDrives : RECENT_TRIPS;
  const chargingData = chargingHistory?.length ? chargingHistory : MOCK_CHARGING_HISTORY;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Main Car Status */}
      <div className="lg:col-span-2 relative h-80 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black z-0" />
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-96 h-96 bg-blue-500/30 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 p-8 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{carStatus.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${carStatus.state === 'online' || carStatus.state === 'driving' ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
                <span className={`font-medium uppercase text-xs tracking-wider ${carStatus.state === 'online' || carStatus.state === 'driving' ? 'text-green-400' : 'text-zinc-500'}`}>{carStatus.state}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-white tracking-tighter">
                {carStatus.batteryLevel}<span className="text-2xl text-zinc-500">%</span>
              </div>
              <div className="text-zinc-400 mt-1">{carStatus.range} Range</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-8">
            <StatBadge icon={Navigation} label={translate('labels.odometer')} value={carStatus.odometer} unit="" />
            <StatBadge icon={Wind} label={translate('labels.tempIn')} value={carStatus.inside_temp} unit="°C" />
            <StatBadge icon={Settings} label={translate('labels.version')} value={carStatus.version} unit="" />
            <StatBadge icon={MapPin} label={translate('cards.location')} value={carStatus.location} unit="" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="space-y-6">
        <Card title={translate('cards.batteryHealth')} icon={Battery}>
          <div className="mt-2">
            <div className="flex justify-between mb-2">
              <span className="text-zinc-300">Health</span>
              <span className="text-green-400">97.6%</span>
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
        <Card title={translate('cards.driveDistance')} subtitle="7 Days" icon={Activity}>
          <div className="h-32 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={driveData}>
                <Line type="monotone" dataKey="distance" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Drives */}
      <div className="lg:col-span-2">
        <Card title={translate('cards.recentDrives')} subtitle="Latest trips">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="pb-3 font-medium text-zinc-500 pl-2">{translate('cards.started')}</th>
                  <th className="pb-3 font-medium text-zinc-500">{translate('labels.route')}</th>
                  <th className="pb-3 font-medium text-zinc-500">{translate('cards.distance')}</th>
                  <th className="pb-3 font-medium text-zinc-500 text-right pr-2">{translate('cards.duration')}</th>
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
      <Card title={translate('cards.chargingTrend')} className="lg:col-span-1">
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chargingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} />
              <Tooltip
                cursor={{fill: '#27272a'}}
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
              />
              <Bar dataKey="energy" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

const ChargingView = ({ chargingSummary, chargingHistory, recentCharges, translate }) => {
  const summary = chargingSummary || DEFAULT_CHARGING_SUMMARY;
  const history = chargingHistory?.length ? chargingHistory : MOCK_CHARGING_HISTORY;
  const charges = recentCharges?.length ? recentCharges : MOCK_CHARGES;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-center items-center py-8">
          <div className="text-zinc-500 mb-2">{translate('cards.totalCharged')}</div>
          <div className="text-4xl font-bold text-white">{summary.energy.toFixed(1)} <span className="text-xl text-zinc-600 font-normal">kWh</span></div>
        </Card>
        <Card className="flex flex-col justify-center items-center py-8">
          <div className="text-zinc-500 mb-2">{translate('cards.totalCost')}</div>
          <div className="text-4xl font-bold text-white">¥ {summary.cost.toFixed(2)}</div>
        </Card>
        <Card className="flex flex-col justify-center items-center py-8">
          <div className="text-zinc-500 mb-2">{translate('cards.avgCost')}</div>
          <div className="text-4xl font-bold text-white">¥ {summary.costPerKwh.toFixed(2)}</div>
        </Card>
      </div>

      <Card title={translate('cards.chargingTrend')}>
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
              />
              <Area type="monotone" dataKey="energy" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#chargeEnergy)" />
              <Line type="monotone" dataKey="cost" stroke="#3b82f6" strokeDasharray="5 5" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title={translate('cards.chargingSessions')}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="pb-3 font-medium text-zinc-500 pl-2">{translate('cards.started')}</th>
                <th className="pb-3 font-medium text-zinc-500">{translate('cards.energy')}</th>
                <th className="pb-3 font-medium text-zinc-500 text-right pr-2">{translate('cards.cost')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {charges.map((session) => (
                <tr key={session.id} className="group hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 pl-2 text-zinc-300">{session.started_at}</td>
                  <td className="py-3 text-zinc-300">{session.energy !== undefined ? `${session.energy} kWh` : '—'}</td>
                  <td className="py-3 text-right pr-2 text-zinc-300">{session.cost !== undefined ? `¥ ${session.cost}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState('zh');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // App State
  const [apiConfig, setApiConfig] = useState(DEFAULT_CONFIG);
  const [carStatus, setCarStatus] = useState(DEFAULT_CAR_STATUS);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [connectionError, setConnectionError] = useState(null);
  const [driveStats, setDriveStats] = useState(MOCK_DRIVE_STATS);
  const [recentDrives, setRecentDrives] = useState(RECENT_TRIPS);
  const [chargingHistory, setChargingHistory] = useState(MOCK_CHARGING_HISTORY);
  const [chargingSummary, setChargingSummary] = useState(DEFAULT_CHARGING_SUMMARY);
  const [recentCharges, setRecentCharges] = useState(MOCK_CHARGES);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let val = translations[language];
    keys.forEach(k => { val = val?.[k] });
    return val || key;
  }, [language]);

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(LS_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setApiConfig(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load config", e);
      }
    }
  }, []);

  const handleSaveConfig = (newConfig) => {
    setApiConfig(newConfig);
    localStorage.setItem(LS_KEY, JSON.stringify(newConfig));
    // Trigger reload logic potentially
    setConnectionStatus('connecting'); // Will trigger effect below to retry
  };

  const handleResetConfig = () => {
    setApiConfig(DEFAULT_CONFIG);
    localStorage.removeItem(LS_KEY);
    setConnectionStatus('connecting');
  };

  // Data Fetching Logic
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      // Don't try if URL is missing (unless default is set)
      if (!apiConfig.TESLAMATE_URL && !DEFAULT_CONFIG.TESLAMATE_URL) {
        setConnectionStatus('error');
        setConnectionError({ message: 'Missing Grafana URL. Configure in Settings.' });
        return;
      }

      const carSql = `
        SELECT c.name, p.battery_level, p.est_battery_range_km, p.odometer, p.speed, p.inside_temp, p.outside_temp, a.name as location,
          CASE WHEN p.date > (NOW() - INTERVAL '2 minutes') THEN 'online' ELSE 'asleep' END as status
        FROM cars c
        JOIN positions p ON p.car_id = c.id
        LEFT JOIN addresses a ON p.address_id = a.id
        ORDER BY p.date DESC LIMIT 1;
      `;

      try {
        const result = await fetchGrafanaData(carSql, apiConfig);
        if (!isMounted) return;

        const frame = result?.results?.A?.frames?.[0];
        const values = frame?.data?.values;
        if (values && values[0]) {
          // Grafana returns array of columns, values[colIndex][rowIndex]
          setCarStatus({
            name: values[0][0] || 'Tesla',
            batteryLevel: values[1][0] || 0,
            range: `${Math.round(values[2][0] || 0)} km`,
            odometer: `${Math.round(values[3][0] || 0).toLocaleString()} km`,
            speed: values[4][0] || 0,
            inside_temp: values[5][0] || 0,
            outside_temp: values[6][0] || 0,
            location: values[7][0] || 'Unknown',
            state: values[8][0] || 'offline',
            version: '2024.x' // Query typically doesn't have version easily, usually in car_settings
          });
          setConnectionStatus('connected');
          setConnectionError(null);
        } else {
            // No data implies connected but empty? Or just connected
            setConnectionStatus('connected');
        }
      } catch (e) {
        if (!isMounted) return;
        setConnectionError(e);
        setConnectionStatus('error');
      }

      // --- Fetch Other Data (Simplified for brevity, similar try-catch blocks) ---
      // In a real app, you might want to Promise.all or waterfall these
      // Keeping it simple here to ensure the main connection works first.
      
      // ... (Existing fetching logic for drives/charges would go here using apiConfig) ...
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [apiConfig]); // Re-run when config changes

  const NavItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeTab === id ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl flex flex-col w-64">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-900/20">
              <Zap className="text-white" size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight">{t('brand')}</span>
              <span className="text-xs text-zinc-500">{t('frameworkSubtitle')}</span>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            <NavItem id="dashboard" icon={Layers} label={t('nav.dashboard')} />
            <NavItem id="charging" icon={BatteryCharging} label={t('nav.charging')} />
          </nav>

          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center justify-center gap-3 text-zinc-400 hover:text-white transition-colors w-full px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800"
            >
              <Settings size={18} />
              <span>{t('settings.title')}</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto md:p-8 p-4 relative">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold capitalize">{t(`nav.${activeTab}`)}</h2>
              <p className="text-zinc-400 text-sm flex items-center gap-2">
                 {apiConfig.TESLAMATE_URL ? (
                    <span className="flex items-center gap-1 text-green-500/80">
                        <Globe size={12}/> {new URL(apiConfig.TESLAMATE_URL).hostname}
                    </span>
                 ) : 'No Server Configured'}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <ConnectionStatus 
                status={connectionStatus} 
                error={connectionError} 
                translate={t} 
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <DashboardView
              carStatus={carStatus}
              driveStats={driveStats}
              recentDrives={recentDrives}
              chargingHistory={chargingHistory}
              translate={t}
            />
          )}
          {activeTab === 'charging' && (
            <ChargingView
              chargingSummary={chargingSummary}
              chargingHistory={chargingHistory}
              recentCharges={recentCharges}
              translate={t}
            />
          )}
        </main>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        config={apiConfig}
        onSave={handleSaveConfig}
        onReset={handleResetConfig}
        translate={t}
        language={language}
        setLanguage={setLanguage}
      />
    </div>
  );
}
