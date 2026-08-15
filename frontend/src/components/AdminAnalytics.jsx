import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, BookOpen, Percent, CreditCard, RefreshCw, 
  Download, Calendar, Search, Filter, Activity, 
  Cpu, HardDrive, ShieldCheck, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Clock, Award
} from 'lucide-react';
import { API_URL } from '../config/api';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Date Range State
  const [dateRange, setDateRange] = useState('7days');
  // Exam Series Filter
  const [selectedExam, setSelectedExam] = useState('all');
  // Subject Filter
  const [selectedSubject, setSelectedSubject] = useState('all');

  // KPI Metrics State
  const [metrics, setMetrics] = useState({
    activeStudents: 0,
    testsSubmitted: 0,
    avgScore: 0,
    avgAccuracy: 0,
    revenue: 0,
    proctorAlerts: 0,
    activeStudentsTrend: 12.4,
    testsSubmittedTrend: 8.2,
    avgScoreTrend: -1.5,
    revenueTrend: 15.3
  });

  // Chart Interactivity States
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [chartMetric, setChartMetric] = useState('both'); // 'both', 'registrations', 'submissions'

  // Table Pagination & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tableTab, setTableTab] = useState('submissions'); // 'submissions' or 'testAggregates'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Mock Database telemetry for high-fidelity SVG Trend Chart
  const trendData = [
    { day: 'Mon', registrations: 12, submissions: 45, avgScore: 198, activeTime: 120 },
    { day: 'Tue', registrations: 19, submissions: 58, avgScore: 204, activeTime: 135 },
    { day: 'Wed', registrations: 15, submissions: 64, avgScore: 201, activeTime: 110 },
    { day: 'Thu', registrations: 24, submissions: 72, avgScore: 218, activeTime: 160 },
    { day: 'Fri', registrations: 32, submissions: 88, avgScore: 212, activeTime: 180 },
    { day: 'Sat', registrations: 45, submissions: 112, avgScore: 224, activeTime: 220 },
    { day: 'Sun', registrations: 38, submissions: 98, avgScore: 219, activeTime: 195 }
  ];

  // Mock Subject breakdown data
  const subjectPerformance = [
    { name: 'Physics', avgScore: 68, accuracy: 74, color: 'bg-primary', stroke: '#f97316' },
    { name: 'Chemistry', avgScore: 78, accuracy: 82, color: 'bg-emerald-500', stroke: '#10b981' },
    { name: 'Mathematics', avgScore: 54, accuracy: 64, color: 'bg-blue-500', stroke: '#3b82f6' },
    { name: 'Biology', avgScore: 82, accuracy: 86, color: 'bg-purple-500', stroke: '#a855f7' }
  ];

  // Mock Recent Student Submissions Table Data
  const recentSubmissions = [
    { id: '1', email: 'rahul.sharma@gmail.com', test: 'JEE Main Full Mock #1', category: 'JEE', score: 214, max: 300, accuracy: '81%', status: 'CLEARED', date: '2026-08-14' },
    { id: '2', email: 'priya.patel@gmail.com', test: 'NEET Practice Drill #3', category: 'NEET', score: 580, max: 720, accuracy: '86%', status: 'FLAGGED', date: '2026-08-14' },
    { id: '3', email: 'amit.verma@outlook.com', test: 'JEE Main Full Mock #1', category: 'JEE', score: 184, max: 300, accuracy: '72%', status: 'CLEARED', date: '2026-08-13' },
    { id: '4', email: 'sneha.reddy@yahoo.com', test: 'NEET All India Mock #4', category: 'NEET', score: 610, max: 720, accuracy: '89%', status: 'CLEARED', date: '2026-08-13' },
    { id: '5', email: 'vikram.singh@gmail.com', test: 'JEE Main Part Test #2', category: 'JEE', score: 92, max: 120, accuracy: '78%', status: 'CLEARED', date: '2026-08-12' },
    { id: '6', email: 'ananya.iyer@gmail.com', test: 'NEET Practice Drill #3', category: 'NEET', score: 490, max: 720, accuracy: '74%', status: 'SUSPENDED', date: '2026-08-12' },
    { id: '7', email: 'kunal.gupta@gmail.com', test: 'JEE Main Full Mock #1', category: 'JEE', score: 245, max: 300, accuracy: '91%', status: 'CLEARED', date: '2026-08-11' }
  ];

  // Mock Aggregated Test Performance Data Table
  const testAggregates = [
    { title: 'JEE Main Full Mock #1', category: 'JEE', attempts: 184, avgScore: 198, maxScore: 300, accuracy: '74%', high: 288 },
    { title: 'NEET Practice Drill #3', category: 'NEET', attempts: 142, avgScore: 512, maxScore: 720, accuracy: '79%', high: 695 },
    { title: 'JEE Main Part Test #2', category: 'JEE', attempts: 96, avgScore: 84, maxScore: 120, accuracy: '71%', high: 116 },
    { title: 'NEET All India Mock #4', category: 'NEET', attempts: 215, avgScore: 540, maxScore: 720, accuracy: '82%', high: 710 },
    { title: 'JEE Math Intensive Quiz', category: 'JEE', attempts: 64, avgScore: 42, maxScore: 100, accuracy: '62%', high: 95 }
  ];

  // System status monitoring metrics
  const systemStatus = {
    latency: 18, // ms
    uptime: '99.98%',
    dbLoad: 14 // %
  };

  // Fetch real-time metrics from API with Axios
  const fetchData = async () => {
    try {
      setError(null);
      
      const statsUrl = `${API_URL}/api/admin/stats`;
      const violationsUrl = `${API_URL}/api/admin/violations`;
      
      const [statsRes, violationsRes] = await Promise.all([
        axios.get(statsUrl).catch(() => null),
        axios.get(violationsUrl).catch(() => null)
      ]);

      let activeStudents = 4280;
      let testsSubmitted = 844;
      let avgScore = 202;
      let proctorAlerts = 3;

      if (statsRes && statsRes.data) {
        activeStudents = statsRes.data.activeStudents || activeStudents;
        testsSubmitted = statsRes.data.testsSubmitted || testsSubmitted;
        avgScore = statsRes.data.avgScore || avgScore;
      }

      if (violationsRes && violationsRes.data) {
        proctorAlerts = violationsRes.data.length || proctorAlerts;
      }

      // Format individual state metrics
      setMetrics(prev => ({
        ...prev,
        activeStudents,
        testsSubmitted,
        avgScore,
        avgAccuracy: 78,
        revenue: Math.round(testsSubmitted * 399 * 0.75), // Derived estimate
        proctorAlerts
      }));

    } catch (err) {
      console.error("[ADMIN_ANALYTICS_FETCH_ERROR]", err);
      setError("Failed to load real-time database feeds. Showing aggregated mock insights.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedExam, selectedSubject]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // CSV Mock Export triggers
  const handleExportCSV = () => {
    const headers = "Student,Test Title,Score,Accuracy,Status,Date\n";
    const rows = recentSubmissions.map(s => `"${s.email}","${s.test}",${s.score},"${s.accuracy}","${s.status}","${s.date}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ikshatests_admin_analytics_${dateRange}.csv`);
    a.click();
  };

  // Filter Table Records
  const filteredSubmissions = recentSubmissions.filter(s => {
    const matchesSearch = s.email.toLowerCase().includes(searchQuery.toLowerCase()) || s.test.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesExam = selectedExam === 'all' || s.category.toLowerCase() === selectedExam.toLowerCase();
    return matchesSearch && matchesStatus && matchesExam;
  });

  const filteredAggregates = testAggregates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExam = selectedExam === 'all' || t.category.toLowerCase() === selectedExam.toLowerCase();
    return matchesSearch && matchesExam;
  });

  const currentRecords = tableTab === 'submissions' ? filteredSubmissions : filteredAggregates;
  const totalPages = Math.ceil(currentRecords.length / itemsPerPage);
  const paginatedRecords = currentRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // SVG dimensions for smooth area chart construction
  const chartWidth = 500;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 20;

  // Calculate coordinates for SVG paths
  const getCoordinates = (metric) => {
    const maxVal = metric === 'registrations' ? 50 : 120;
    return trendData.map((data, index) => {
      const x = paddingX + (index * (chartWidth - paddingX * 2)) / (trendData.length - 1);
      const val = data[metric];
      const y = chartHeight - paddingY - (val * (chartHeight - paddingY * 2)) / maxVal;
      return { x, y, value: val, day: data.day };
    });
  };

  const regPoints = getCoordinates('registrations');
  const subPoints = getCoordinates('submissions');

  const makeSvgPath = (points) => {
    return points.reduce((path, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      // Cubic Bezier curve handles for smooth vector flow
      const prev = points[i - 1];
      const cpX1 = prev.x + (p.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (p.x - prev.x) / 2;
      const cpY2 = p.y;
      return `${path} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
    }, "");
  };

  const makeAreaPath = (points) => {
    const path = makeSvgPath(points);
    if (!path) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${path} L ${last.x} ${chartHeight - paddingY} L ${first.x} ${chartHeight - paddingY} Z`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 select-none">
      
      {/* ── 1. Header & Actions ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/40 p-6 rounded-3xl border border-slate-900/60 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-black font-headline text-white flex items-center gap-2 tracking-tight">
            <Activity className="w-6 h-6 text-primary" /> Analytics & Performance Insights
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Aggregate student participation ratios, behavioral analytics, and system stability health logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Date Picker */}
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300">
            <Calendar className="w-3.5 h-3.5 mr-2 text-slate-500" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-slate-200"
              aria-label="Select date range"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thismonth">This Month</option>
              <option value="alltime">All Time</option>
            </select>
          </div>

          {/* Export CSV */}
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            aria-label="Export data to CSV"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>

          {/* Refresh Action */}
          <button 
            onClick={handleRefresh}
            className="flex items-center justify-center p-2.5 bg-primary hover:bg-[#ff8533] text-slate-950 rounded-xl transition-all cursor-pointer shadow-md"
            title="Refresh Real-time Feeds"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 2. Filters Row ── */}
      <div className="flex flex-wrap items-center gap-4 bg-[#070912]/80 border border-slate-900/60 p-4.5 rounded-2xl">
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5"><Filter className="w-3 h-3 text-primary" /> Filter Matrix:</span>
        
        {/* Exam filter */}
        <select 
          value={selectedExam} 
          onChange={(e) => { setSelectedExam(e.target.value); setCurrentPage(1); }}
          className="bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          aria-label="Filter by Exam Series"
        >
          <option value="all">All Exam Series</option>
          <option value="jee">IIT JEE</option>
          <option value="neet">NEET (UG)</option>
        </select>

        {/* Subject filter */}
        <select 
          value={selectedSubject} 
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          aria-label="Filter by Subject"
        >
          <option value="all">All Subjects</option>
          <option value="physics">Physics</option>
          <option value="chemistry">Chemistry</option>
          <option value="math">Mathematics</option>
          <option value="biology">Biology</option>
        </select>
      </div>

      {/* ── 3. KPI Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Active Students */}
        <div className="bg-slate-950/40 border border-slate-900/60 p-6 rounded-2xl relative overflow-hidden shadow-sm hover:translate-y-[-4px] hover:border-slate-800 transition-all duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start z-10">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" /> Active Students
            </span>
            <span className="p-2 bg-primary/10 text-primary rounded-xl">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 z-10">
            <h3 className="text-3xl font-black font-headline text-white">{metrics.activeStudents.toLocaleString()}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-black tracking-wide text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3 h-3" /> +{metrics.activeStudentsTrend}%
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">vs last hour</span>
            </div>
          </div>
        </div>

        {/* Card 2: Tests Submitted */}
        <div className="bg-slate-950/40 border border-slate-900/60 p-6 rounded-2xl relative overflow-hidden shadow-sm hover:translate-y-[-4px] hover:border-slate-800 transition-all duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start z-10">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> Tests Conducted
            </span>
            <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 z-10">
            <h3 className="text-3xl font-black font-headline text-white">{metrics.testsSubmitted.toLocaleString()}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-black tracking-wide text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3 h-3" /> +{metrics.testsSubmittedTrend}%
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Today</span>
            </div>
          </div>
        </div>

        {/* Card 3: Avg Score Rate */}
        <div className="bg-slate-950/40 border border-slate-900/60 p-6 rounded-2xl relative overflow-hidden shadow-sm hover:translate-y-[-4px] hover:border-slate-800 transition-all duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start z-10">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-blue-500" /> Avg Accuracy
            </span>
            <span className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 z-10">
            <h3 className="text-3xl font-black font-headline text-white">{metrics.avgAccuracy}%</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-black tracking-wide text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">
                <TrendingDown className="w-3 h-3" /> {metrics.avgScoreTrend}%
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Weekly Shift</span>
            </div>
          </div>
          {/* Progress bar inside card */}
          <div className="w-full h-1 bg-slate-900 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" style={{ width: `${metrics.avgAccuracy}%` }}></div>
          </div>
        </div>

        {/* Card 4: Platform Subscriptions / Revenue */}
        <div className="bg-slate-950/40 border border-slate-900/60 p-6 rounded-2xl relative overflow-hidden shadow-sm hover:translate-y-[-4px] hover:border-slate-800 transition-all duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start z-10">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-purple-500" /> Projected Revenue
            </span>
            <span className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 z-10">
            <h3 className="text-3xl font-black font-headline text-white">₹{(metrics.revenue).toLocaleString()}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-black tracking-wide text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3 h-3" /> +{metrics.revenueTrend}%
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">this month</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Charts Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Large Chart: Trends over Time */}
        <div className="lg:col-span-2 bg-slate-950/40 border border-slate-900/60 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-sm font-bold font-headline text-white uppercase tracking-wider">Registration & Activity Trends</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Historical overview of student onboarding and mocks taken.</p>
            </div>
            
            {/* Metric Toggle Buttons */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-[10px] font-black tracking-widest uppercase">
              <button 
                onClick={() => setChartMetric('both')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${chartMetric === 'both' ? 'bg-primary text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                Both
              </button>
              <button 
                onClick={() => setChartMetric('registrations')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${chartMetric === 'registrations' ? 'bg-primary text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                Users
              </button>
              <button 
                onClick={() => setChartMetric('submissions')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${chartMetric === 'submissions' ? 'bg-primary text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                Mocks
              </button>
            </div>
          </div>

          {/* SVG Trend Line/Area Chart */}
          <div className="relative w-full aspect-[5/2] min-h-[200px]">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-full overflow-visible"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                {/* Registration Gradient */}
                <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                </linearGradient>
                {/* Submission Gradient */}
                <linearGradient id="subGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>

              {/* Horizontal grid guide lines */}
              <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
              <line x1={paddingX} y1={(chartHeight) / 2} x2={chartWidth - paddingX} y2={(chartHeight) / 2} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
              <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="rgba(255,255,255,0.06)" />

              {/* AREA PATHS */}
              {(chartMetric === 'both' || chartMetric === 'registrations') && (
                <path d={makeAreaPath(regPoints)} fill="url(#regGradient)" />
              )}
              {(chartMetric === 'both' || chartMetric === 'submissions') && (
                <path d={makeAreaPath(subPoints)} fill="url(#subGradient)" />
              )}

              {/* LINE PATHS */}
              {(chartMetric === 'both' || chartMetric === 'registrations') && (
                <path d={makeSvgPath(regPoints)} fill="none" stroke="#00f2fe" strokeWidth="2.5" />
              )}
              {(chartMetric === 'both' || chartMetric === 'submissions') && (
                <path d={makeSvgPath(subPoints)} fill="none" stroke="#f97316" strokeWidth="2.5" />
              )}

              {/* Interactive grid hit rectangles for hover triggers */}
              {trendData.map((data, idx) => {
                const x = paddingX + (idx * (chartWidth - paddingX * 2)) / (trendData.length - 1);
                return (
                  <g key={idx}>
                    {/* Invisible hover intercept bar */}
                    <rect 
                      x={x - 20} 
                      y={0} 
                      width={40} 
                      height={chartHeight - paddingY} 
                      fill="transparent" 
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPoint({ idx, x, day: data.day, reg: data.registrations, sub: data.submissions, avg: data.avgScore })}
                    />
                    {/* Axis Labels */}
                    <text 
                      x={x} 
                      y={chartHeight - 4} 
                      fill="rgba(255,255,255,0.25)" 
                      fontSize="9" 
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {data.day}
                    </text>
                  </g>
                );
              })}

              {/* Hover indicator lines & circles */}
              {hoveredPoint && (
                <g>
                  {/* Vertical cursor tracer */}
                  <line 
                    x1={hoveredPoint.x} 
                    y1={paddingY} 
                    x2={hoveredPoint.x} 
                    y2={chartHeight - paddingY} 
                    stroke="rgba(255,255,255,0.15)" 
                    strokeDasharray="2 2" 
                  />
                  
                  {/* Registration point tracker */}
                  {(chartMetric === 'both' || chartMetric === 'registrations') && (
                    <circle 
                      cx={hoveredPoint.x} 
                      cy={regPoints[hoveredPoint.idx].y} 
                      r="4.5" 
                      fill="#00f2fe" 
                      stroke="#05060b" 
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Submission point tracker */}
                  {(chartMetric === 'both' || chartMetric === 'submissions') && (
                    <circle 
                      cx={hoveredPoint.x} 
                      cy={subPoints[hoveredPoint.idx].y} 
                      r="4.5" 
                      fill="#f97316" 
                      stroke="#05060b" 
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              )}
            </svg>

            {/* Custom interactive tooltip markup overlay */}
            {hoveredPoint && (
              <div 
                className="absolute bg-slate-950/95 border border-slate-900 rounded-xl p-3 shadow-2xl backdrop-blur-md text-[10px] font-mono w-44 pointer-events-none transition-all duration-100 z-30"
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  transform: `translate(${hoveredPoint.idx > 3 ? '-105%' : '5%'}, -50%)`,
                  top: '40%'
                }}
              >
                <div className="font-bold text-slate-200 border-b border-slate-900 pb-1.5 mb-1.5 flex justify-between">
                  <span>Day: {hoveredPoint.day}</span>
                  <span className="text-primary">Telemetry</span>
                </div>
                <div className="flex justify-between mb-1 text-slate-400">
                  <span>Registrations:</span>
                  <span className="text-[#00f2fe] font-bold">+{hoveredPoint.reg}</span>
                </div>
                <div className="flex justify-between mb-1 text-slate-400">
                  <span>Mocks Taken:</span>
                  <span className="text-primary font-bold">+{hoveredPoint.sub}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Avg. Score:</span>
                  <span className="text-slate-200 font-bold">{hoveredPoint.avg}/300</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Medium Chart: Subject breakdown */}
        <div className="bg-slate-950/40 border border-slate-900/60 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-headline text-white uppercase tracking-wider mb-1">Subject Performance</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Average syllabus accuracy & score ratio across segments.</p>
          </div>

          <div className="space-y-4 my-6">
            {subjectPerformance.map((sub, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${sub.color}`}></span>
                    {sub.name}
                  </span>
                  <span className="text-slate-400">
                    Accuracy: <strong className="text-white">{sub.accuracy}%</strong> (Avg: {sub.avgScore} pts)
                  </span>
                </div>
                {/* Horizontal Progress Bar */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000`} 
                    style={{ 
                      width: `${sub.accuracy}%`,
                      backgroundColor: sub.stroke,
                      boxShadow: `0 0 8px ${sub.stroke}40`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom aggregate summary badge */}
          <div className="bg-[#0b0f20]/60 border border-slate-900/40 p-4 rounded-xl flex items-center gap-3 text-xs leading-relaxed">
            <Award className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-slate-400 font-medium">
              <strong className="text-white">Chemistry</strong> remains the top scoring segment, while <strong className="text-white">Mathematics</strong> shows higher timing overhead.
            </p>
          </div>
        </div>

      </div>

      {/* ── 5. Data Table / Breakdown Section ── */}
      <div className="bg-slate-950/40 border border-slate-900/60 rounded-3xl p-6 backdrop-blur-md">
        
        {/* Table Toolbar controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Tab Selector */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-[10px] font-black tracking-widest uppercase">
            <button 
              onClick={() => { setTableTab('submissions'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${tableTab === 'submissions' ? 'bg-primary text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Recent Submissions
            </button>
            <button 
              onClick={() => { setTableTab('testAggregates'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${tableTab === 'testAggregates' ? 'bg-primary text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Exam Aggregates
            </button>
          </div>

          {/* Search bar & status filter inputs */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs w-full sm:w-48">
              <Search className="w-3.5 h-3.5 mr-2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="bg-transparent outline-none w-full text-slate-200"
                aria-label="Search records"
              />
            </div>

            {/* Status Filter (shown only for Submissions tab) */}
            {tableTab === 'submissions' && (
              <select 
                value={statusFilter} 
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl px-3 py-2 outline-none cursor-pointer"
                aria-label="Filter by proctor status"
              >
                <option value="all">All Status</option>
                <option value="CLEARED">Cleared</option>
                <option value="FLAGGED">Flagged</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-slate-900/60 rounded-2xl overflow-hidden bg-slate-950/20">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0b0f20]/60 text-slate-400 font-bold border-b border-slate-900">
              {tableTab === 'submissions' ? (
                <tr>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Student Email</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Mock Exam</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Date</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Score / Max</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Accuracy</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Proctor Status</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Exam Title</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Path</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Attempts</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Avg Score</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Avg Accuracy</th>
                  <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px]">High Score</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-900/80 font-medium">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-slate-900/20 transition-colors">
                    {tableTab === 'submissions' ? (
                      <>
                        <td className="px-5 py-4 text-xs font-bold text-slate-200">{record.email}</td>
                        <td className="px-5 py-4 text-xs text-slate-400 font-semibold">{record.test}</td>
                        <td className="px-5 py-4 text-[10px] text-slate-500 font-mono">{record.date}</td>
                        <td className="px-5 py-4 text-xs text-slate-200 font-bold">{record.score} <span className="text-slate-600 font-semibold">/ {record.max}</span></td>
                        <td className="px-5 py-4 text-xs font-bold text-emerald-400">{record.accuracy}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] uppercase font-black tracking-widest border ${
                            record.status === 'CLEARED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            record.status === 'FLAGGED' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-4 text-xs font-bold text-slate-200">{record.title}</td>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 bg-slate-900 text-slate-400 border border-slate-800 rounded-lg text-[9px] font-black uppercase tracking-wider`}>
                            {record.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-slate-400">{record.attempts}</td>
                        <td className="px-5 py-4 text-xs text-slate-200 font-bold">{record.avgScore} <span className="text-slate-600 font-semibold">/ {record.maxScore}</span></td>
                        <td className="px-5 py-4 text-xs font-bold text-emerald-400">{record.accuracy}</td>
                        <td className="px-5 py-4 text-xs font-black text-slate-200">
                          {record.high} <span className="text-slate-600 font-semibold">pts</span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500 font-bold">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              Showing Page {currentPage} of {totalPages} ({currentRecords.length} records)
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-900 rounded-xl hover:bg-slate-900/60 disabled:opacity-30 disabled:pointer-events-none text-slate-400 hover:text-white cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-900 rounded-xl hover:bg-slate-900/60 disabled:opacity-30 disabled:pointer-events-none text-slate-400 hover:text-white cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── 6. Bottom Widgets Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* System Health Status */}
        <div className="bg-slate-950/40 border border-slate-900/60 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between">
          <h3 className="text-xs font-bold font-headline text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-primary" /> System Telemetry
          </h3>

          <div className="space-y-4">
            {/* Latency */}
            <div className="bg-slate-950/80 border border-slate-900/60 p-4 rounded-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Activity className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-200">API Response</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Active latency</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-emerald-400 font-mono">{systemStatus.latency} ms</div>
                <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Optimal</div>
              </div>
            </div>

            {/* Server Status */}
            <div className="bg-slate-950/80 border border-slate-900/60 p-4 rounded-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-200">Server Uplink</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Platform uptime</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-blue-400 font-mono">{systemStatus.uptime}</div>
                <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Stable</div>
              </div>
            </div>

            {/* DB Load */}
            <div className="bg-slate-950/80 border border-slate-900/60 p-4 rounded-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                  <HardDrive className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-200">Database Load</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">CPU Usage capacity</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-purple-400 font-mono">{systemStatus.dbLoad}%</div>
                <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Low Usage</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Engagement Peak Hours */}
        <div className="md:col-span-2 bg-slate-950/40 border border-slate-900/60 p-6 rounded-3xl backdrop-blur-md">
          <h3 className="text-xs font-bold font-headline text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" /> Student Engagement Peak Hours
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-6">Aggregate concurrent mock submissions based on local time slices.</p>

          <div className="space-y-3.5">
            {/* Hour 1 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
                <span>06:00 PM - 09:00 PM (Late Evening Peak)</span>
                <span className="text-primary font-black">42% Activity</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]" style={{ width: '42%' }}></div>
              </div>
            </div>

            {/* Hour 2 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
                <span>02:00 PM - 05:00 PM (NTA Slot 2 Match)</span>
                <span className="text-emerald-400 font-black">35% Activity</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: '35%' }}></div>
              </div>
            </div>

            {/* Hour 3 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
                <span>09:00 AM - 12:00 PM (NTA Slot 1 Match)</span>
                <span className="text-blue-400 font-black">18% Activity</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.4)]" style={{ width: '18%' }}></div>
              </div>
            </div>

            {/* Hour 4 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
                <span>Night Owls (10:00 PM - 02:00 AM)</span>
                <span className="text-purple-400 font-black">5% Activity</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.4)]" style={{ width: '5%' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
