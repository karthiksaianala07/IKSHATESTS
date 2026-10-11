import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { supabase } from '../config/supabase';
import { NCERT_CHAPTERS } from '../config/ncertChapters';
import MathKeypad from '../components/MathKeypad';
import AdminAnalytics from '../components/AdminAnalytics';
import StudentAnalyticsWorkspace from '../components/StudentAnalyticsWorkspace';
import AddTestPage from './AddTestPage';
import QuestionBankDocumentUpload from '../components/QuestionBankDocumentUpload';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const DEFAULT_SERIES = [
  {
    id: 'series-jee',
    key: 'jee',
    title: 'IIT JEE Series',
    categoryType: 'Engineering',
    description: 'Premier mock exams for JEE Main and JEE Advanced engineering aspirants.',
    icon: 'architecture',
    color: '#81c3d7',
    badgeColor: 'border-[#81c3d7]/40 bg-[#81c3d7]/15 text-[#81c3d7]',
    isDefault: true,
    sections: [
      { id: 'full', label: 'Full-Length Mocks', icon: 'assignment' },
      { id: 'pyq', label: 'Previous Year Papers', icon: 'history_edu' },
      { id: 'chapter', label: 'Subject-wise Tests', icon: 'category' }
    ]
  },
  {
    id: 'series-neet',
    key: 'neet',
    title: 'NEET (UG) Series',
    categoryType: 'Medical',
    description: 'Comprehensive testing and diagnostic blueprints for medical aspirants.',
    icon: 'biotech',
    color: '#3a7ca5',
    badgeColor: 'border-[#3a7ca5]/40 bg-[#3a7ca5]/20 text-[#d9dcd6]',
    isDefault: true,
    sections: [
      { id: 'full', label: 'Full-Length Mocks', icon: 'assignment' },
      { id: 'pyq', label: 'Previous Year Papers', icon: 'history_edu' },
      { id: 'chapter', label: 'Subject-wise Tests', icon: 'biotech' }
    ]
  }
];

export default function AdminPortal() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Route state
  const isAddTestView = location.pathname === '/admin/add-test';

  // Tabs: 'dashboard' | 'exams' | 'question-bank' | 'students' | 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Stats and data states
  const [stats, setStats] = useState({ activeStudents: 0, testsSubmitted: 0, avgScore: 0 });
  const [questions, setQuestions] = useState([]);
  const [violations, setViolations] = useState([]);
  const [adminTests, setAdminTests] = useState([]);
  const [loadingAdminTests, setLoadingAdminTests] = useState(false);
  const [showAddForm, setShowAddForm] = useState(true);
  const [qbImportMode, setQbImportMode] = useState('document'); // 'document' | 'manual' | 'json'

  // Exam Series management state (initialized with existing platform series)
  const [examSeriesList, setExamSeriesList] = useState(DEFAULT_SERIES);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [seriesSectionFilter, setSeriesSectionFilter] = useState('all');
  const [seriesStatusFilter, setSeriesStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'

  // Series Modals
  const [showCreateSeriesModal, setShowCreateSeriesModal] = useState(false);
  const [showEditSeriesModal, setShowEditSeriesModal] = useState(false);
  const [seriesFormData, setSeriesFormData] = useState({
    title: '',
    key: '',
    categoryType: 'Engineering',
    description: '',
    icon: 'quiz',
    color: '#81c3d7'
  });
  const [editingSeries, setEditingSeries] = useState(null);

  // Test Edit Modal
  const [showEditTestModal, setShowEditTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState({
    id: '',
    title: '',
    category: '',
    duration_minutes: 180,
    scheduled_at: ''
  });

  // Workspace Tab state ('students' | 'branding' | 'payments' | 'notifications' | 'access')
  const [workspaceTab, setWorkspaceTab] = useState('students');
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentCohortFilter, setStudentCohortFilter] = useState('all');
  const [studentExamFilter, setStudentExamFilter] = useState('all');

  // Enroll Student Modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [isEnrollingStudent, setIsEnrollingStudent] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    fullName: '',
    userId: '',
    email: '',
    password: '',
    classCohort: 'Class 11',
    targetExam: 'JEE',
    phoneNumber: '',
    batchName: 'General'
  });

  // Created Student Credentials Slip Modal state
  const [createdStudentSlip, setCreatedStudentSlip] = useState(null);
  const [copiedSlip, setCopiedSlip] = useState(false);

  // Reset Password Modal state
  const [resetPasswordModal, setResetPasswordModal] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Manual Question state
  const textRef = useRef(null);
  const subTextRef = useRef(null);
  const optionRefs = useRef([]);
  const [activeQuestionField, setActiveQuestionField] = useState('text');
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);

  const [newQuestion, setNewQuestion] = useState({
    subject: 'Physics',
    chapter: 'Physical World',
    type: 'MCQ',
    text: '',
    correct_answer: '',
    options: [
      { text: '', image_url: '' },
      { text: '', image_url: '' },
      { text: '', image_url: '' },
      { text: '', image_url: '' }
    ],
    image_url: '',
    sub_text: ''
  });
  const [uploading, setUploading] = useState(false);
  const [optUploading, setOptUploading] = useState(null);

  // Settings states
  const [brandName, setBrandName] = useState('IkshaTests Student Portal');
  const [supportEmail, setSupportEmail] = useState('support@ikshatests.edu');
  const [primaryColor, setPrimaryColor] = useState('#81c3d7');
  const [secondaryColor, setSecondaryColor] = useState('#3a7ca5');

  // Discover and combine series from state, default series, and any active tests in database
  const getDiscoveredSeriesList = () => {
    const list = [...(examSeriesList.length > 0 ? examSeriesList : DEFAULT_SERIES)];

    // Ensure core default series are always present
    DEFAULT_SERIES.forEach(def => {
      if (!list.some(s => s.key?.toLowerCase() === def.key.toLowerCase())) {
        list.push(def);
      }
    });

    // Dynamically auto-discover any other custom series present across database tests
    adminTests.forEach(test => {
      if (!test.category) return;
      const cleanCat = test.category.toLowerCase().split('-')[0].split('_')[0].trim();
      if (cleanCat && !list.some(s => s.key?.toLowerCase() === cleanCat)) {
        list.push({
          id: `series-auto-${cleanCat}`,
          key: cleanCat,
          title: cleanCat.toUpperCase() + ' Series',
          categoryType: 'General',
          description: `Allotted test blueprints and examinations under the ${cleanCat.toUpperCase()} track.`,
          icon: 'quiz',
          color: '#81c3d7',
          badgeColor: 'border-[#81c3d7]/30 bg-[#81c3d7]/15 text-[#81c3d7]',
          isDefault: false,
          sections: [
            { id: 'full', label: 'Full-Length Mocks', icon: 'assignment' },
            { id: 'pyq', label: 'Previous Year Papers', icon: 'history_edu' },
            { id: 'chapter', label: 'Subject-wise Tests', icon: 'category' }
          ]
        });
      }
    });

    return list;
  };

  // Load resources based on active view/tab
  useEffect(() => {
    fetchStats();
    fetchAdminTests();
    fetchExamSeries();
    fetchQuestions();
    fetchViolations();
    fetchStudents();

    if (activeTab === 'dashboard') {
      const interval = setInterval(fetchViolations, 8000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Synchronize path
  useEffect(() => {
    if (location.pathname === '/admin' && activeTab === '') {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  const fetchExamSeries = async () => {
    setLoadingSeries(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/series`);
      let list = res.data && Array.isArray(res.data) && res.data.length > 0 ? res.data : DEFAULT_SERIES;
      
      DEFAULT_SERIES.forEach(def => {
        if (!list.some(s => s.key?.toLowerCase() === def.key.toLowerCase())) {
          list.unshift(def);
        }
      });
      
      setExamSeriesList(list);
      if (selectedSeries) {
        const found = list.find(s => s.id === selectedSeries.id || s.key === selectedSeries.key);
        if (found) setSelectedSeries(found);
      }
    } catch (err) {
      console.error('Fetch series error:', err);
      setExamSeriesList(DEFAULT_SERIES);
    } finally {
      setLoadingSeries(false);
    }
  };

  const handleCreateSeries = async (e) => {
    e.preventDefault();
    if (!seriesFormData.title || !seriesFormData.key) {
      alert('Please provide Series Title and Key.');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/admin/series`, seriesFormData);
      setShowCreateSeriesModal(false);
      setSeriesFormData({
        title: '',
        key: '',
        categoryType: 'Engineering',
        description: '',
        icon: 'quiz',
        color: '#81c3d7'
      });
      fetchExamSeries();
      alert('Exam series created successfully!');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to create exam series');
    }
  };

  const handleEditSeries = async (e) => {
    e.preventDefault();
    if (!editingSeries) return;
    try {
      await axios.patch(`${API_URL}/api/admin/series/${editingSeries.id}`, {
        title: editingSeries.title,
        description: editingSeries.description,
        categoryType: editingSeries.categoryType,
        icon: editingSeries.icon,
        color: editingSeries.color
      });
      setShowEditSeriesModal(false);
      setEditingSeries(null);
      fetchExamSeries();
      alert('Exam series updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to update exam series');
    }
  };

  const handleDeleteSeries = async (series) => {
    if (series.isDefault) {
      alert('Core platform series (IIT JEE / NEET UG) cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${series.title}"?`)) return;
    try {
      await axios.delete(`${API_URL}/api/admin/series/${series.id}`);
      if (selectedSeries && (selectedSeries.id === series.id || selectedSeries.key === series.key)) {
        setSelectedSeries(null);
      }
      fetchExamSeries();
      alert('Exam series deleted.');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to delete exam series');
    }
  };

  const handleOpenEditTest = (test) => {
    setEditingTest({
      id: test.id,
      title: test.title,
      category: test.category || '',
      duration_minutes: test.duration_minutes || 180,
      scheduled_at: test.scheduled_at ? new Date(test.scheduled_at).toISOString().slice(0, 16) : ''
    });
    setShowEditTestModal(true);
  };

  const handleSaveEditTest = async (e) => {
    e.preventDefault();
    if (!editingTest.id || !editingTest.title) return;
    try {
      await axios.patch(`${API_URL}/api/admin/tests/${editingTest.id}`, {
        title: editingTest.title,
        category: editingTest.category,
        duration_minutes: parseInt(editingTest.duration_minutes),
        scheduled_at: editingTest.scheduled_at ? new Date(editingTest.scheduled_at).toISOString() : null
      });
      setShowEditTestModal(false);
      fetchAdminTests();
      fetchExamSeries();
      alert('Test updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to update test');
    }
  };

  const handleQuickQuestionView = (testId) => {
    window.open(`/admin/test-paper/${testId}`, '_blank');
  };

  const handlePublishTest = async (testId, testTitle) => {
    try {
      await axios.post(`${API_URL}/api/admin/tests/${testId}/publish`);
      fetchAdminTests();
      alert(`"${testTitle}" approved & published! It is now live for students.`);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to publish test');
    }
  };

  const handleUnpublishTest = async (testId, testTitle) => {
    if (!window.confirm(`Revert "${testTitle}" to staged draft? It will be hidden from students.`)) return;
    try {
      await axios.post(`${API_URL}/api/admin/tests/${testId}/unpublish`);
      fetchAdminTests();
      alert(`"${testTitle}" reverted to Staged Draft.`);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to revert test to draft');
    }
  };

  const fetchAdminTests = async () => {
    setLoadingAdminTests(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/tests`);
      setAdminTests(res.data || []);
    } catch (err) {
      console.error('Fetch tests error:', err);
    } finally {
      setLoadingAdminTests(false);
    }
  };

  const handleDeleteTest = async (testId, testTitle) => {
    if (!window.confirm(`Delete "${testTitle}"? This will un-link all questions.`)) return;
    try {
      await axios.delete(`${API_URL}/api/admin/tests/${testId}`);
      fetchAdminTests();
      fetchExamSeries();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to delete test');
    }
  };

  const fetchStats = () => {
    axios.get(`${API_URL}/api/admin/stats`)
      .then(res => {
        if (res.data && typeof res.data.activeStudents !== 'undefined') {
          setStats(res.data);
        }
      })
      .catch(err => {
        console.error("Stats Error:", err);
      });
  };

  const fetchViolations = () => {
    axios.get(`${API_URL}/api/admin/violations`)
      .then(res => {
        setViolations(res.data || []);
      })
      .catch(err => {
        console.error("Violations Fetch Error:", err);
      });
  };

  const fetchQuestions = () => {
    axios.get(`${API_URL}/api/admin/questions`)
      .then(res => {
        setQuestions(res.data || []);
      })
      .catch(err => {
        console.error("Questions Error:", err);
      });
  };

  // ── Student Management Helpers & API Handlers ──
  const generateRandomUserId = () => {
    const year = new Date().getFullYear();
    const randNum = Math.floor(100 + Math.random() * 900);
    return `IK${year}-${randNum}`;
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pass = 'Iksha@';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const openEnrollModal = () => {
    const autoUserId = generateRandomUserId();
    const autoPass = generateRandomPassword();
    setEnrollForm({
      fullName: '',
      userId: autoUserId,
      email: '',
      password: autoPass,
      classCohort: 'Class 11',
      targetExam: 'JEE',
      phoneNumber: '',
      batchName: 'General'
    });
    setShowEnrollModal(true);
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/students`);
      if (res.data && res.data.students) {
        setEnrolledStudents(res.data.students);
      }
    } catch (err) {
      console.error('Fetch students error:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!enrollForm.fullName?.trim() || !enrollForm.userId?.trim() || !enrollForm.password?.trim()) {
      alert('Please fill in Student Name, User ID, and Password.');
      return;
    }
    if (enrollForm.password.trim().length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    setIsEnrollingStudent(true);
    try {
      const res = await axios.post(`${API_URL}/api/admin/students`, enrollForm);
      if (res.data?.success) {
        const student = res.data.student;
        setCreatedStudentSlip({
          fullName: student.full_name,
          userId: student.user_id,
          email: student.email,
          password: enrollForm.password.trim(),
          classCohort: student.class_cohort,
          targetExam: student.target_exam,
          phoneNumber: student.phone_number
        });
        setShowEnrollModal(false);
        fetchStudents();
        fetchStats();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to enroll student';
      alert('Enrollment Error: ' + errMsg);
    } finally {
      setIsEnrollingStudent(false);
    }
  };

  const handleOpenResetPassword = (student) => {
    const suggestedPass = generateRandomPassword();
    setResetPasswordModal(student);
    setNewPasswordVal(suggestedPass);
    setResetSuccessMessage('');
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPasswordModal || !newPasswordVal.trim()) return;
    if (newPasswordVal.trim().length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await axios.post(`${API_URL}/api/admin/students/${resetPasswordModal.id}/reset-password`, {
        password: newPasswordVal.trim(),
        newPassword: newPasswordVal.trim()
      });
      if (res.data?.success) {
        setResetSuccessMessage(`Password successfully reset to: "${newPasswordVal.trim()}"`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to reset password';
      alert('Reset Password Error: ' + errMsg);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    const confirmName = prompt(
      `CAUTION: Deleting this student will permanently erase their profile, auth credentials, and past test submissions.\n\nTo confirm, please type the student's User ID ("${student.user_id}"):`
    );
    if (confirmName !== student.user_id) {
      if (confirmName !== null) alert('User ID did not match. Deletion cancelled.');
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/admin/students/${student.id}`);
      alert(`Student profile for ${student.full_name} (${student.user_id}) has been removed.`);
      fetchStudents();
      fetchStats();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to delete student';
      alert('Delete Error: ' + errMsg);
    }
  };

  const handleCopyCredentialsSlip = () => {
    if (!createdStudentSlip) return;
    const slipText = `IKSHATESTS - Student Login Credentials\n--------------------------------------\nStudent: ${createdStudentSlip.fullName}\nUser ID: ${createdStudentSlip.userId}\nLogin Email: ${createdStudentSlip.email}\nPassword: ${createdStudentSlip.password}\nClass: ${createdStudentSlip.classCohort}\nTarget Exam: ${createdStudentSlip.targetExam}\nPortal URL: ${window.location.origin}/login\n\n* Note: You can sign in using either your User ID or Email.\n* Passwords are institutionally managed for academic focus.`;

    navigator.clipboard.writeText(slipText).then(() => {
      setCopiedSlip(true);
      setTimeout(() => setCopiedSlip(false), 2500);
    });
  };

  const handleImageUpload = async (e, type = 'main', optIndex = null) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'main') setUploading(true);
    else setOptUploading(optIndex);

    try {
      let publicUrl = null;

      // 1. Try uploading via backend server using service role (bypasses RLS)
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(`${API_URL}/api/admin/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data?.publicUrl) {
          publicUrl = res.data.publicUrl;
        }
      } catch (backendErr) {
        console.warn("Backend image upload route failed, attempting direct Supabase fallback:", backendErr.message);
      }

      // 2. Fallback to client-side Supabase storage if backend is unavailable
      if (!publicUrl) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `questions/${fileName}`;

        let { error: uploadError } = await supabase.storage
          .from('question-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('question-assets')
          .getPublicUrl(filePath);

        publicUrl = data?.publicUrl;
      }

      if (!publicUrl) {
        throw new Error("Unable to obtain public URL for uploaded image.");
      }

      if (type === 'main') {
        setNewQuestion({ ...newQuestion, image_url: publicUrl });
      } else {
        const newOpts = [...newQuestion.options];
        newOpts[optIndex] = { ...newOpts[optIndex], image_url: publicUrl };
        setNewQuestion({ ...newQuestion, options: newOpts });
      }
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
      setOptUploading(null);
    }
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    axios.post(`${API_URL}/api/admin/questions`, newQuestion)
      .then(res => {
        setNewQuestion({
          subject: 'Physics',
          chapter: 'Physical World',
          type: 'MCQ',
          text: '',
          correct_answer: '',
          options: [
            { text: '', image_url: '' },
            { text: '', image_url: '' },
            { text: '', image_url: '' },
            { text: '', image_url: '' }
          ],
          image_url: '',
          sub_text: ''
        });
        fetchQuestions();
        alert('Question saved successfully!');
      })
      .catch(err => {
        const msg = err.response?.data?.error || err.message || "Failed to add question";
        alert("Error adding question: " + msg);
      });
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
      navigate('/login');
    }
  };

  const handleNavigation = (tabName) => {
    setActiveTab(tabName);
    setIsMobileSidebarOpen(false);
    navigate('/admin');
  };

  const formatNumber = (val) => (val || 0).toLocaleString();

  return (
    <div className="bg-[#020306] text-slate-100 font-sans min-h-screen min-h-[100dvh] w-full max-w-full flex antialiased relative overflow-x-hidden">
      {/* ── Mobile Sidebar Backdrop ── */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* ── Sidebar Navigation (Slide-over drawer on mobile, fixed on desktop) ── */}
      <aside className={`w-72 fixed left-0 top-0 bottom-0 bg-[#060913] border-r border-slate-900/60 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b border-slate-900/60 flex items-center justify-between">
          <Logo className="h-10 w-auto" />
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <nav className="flex-grow py-6 px-4 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleNavigation('dashboard')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none text-left ${
                  !isAddTestView && activeTab === 'dashboard'
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 bg-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation('exams')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none text-left ${
                  isAddTestView || (!isAddTestView && activeTab === 'exams')
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 bg-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">quiz</span>
                Exam Series
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation('question-bank')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none text-left ${
                  !isAddTestView && activeTab === 'question-bank'
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 bg-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">source_notes</span>
                Question Bank
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation('students')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none text-left ${
                  !isAddTestView && activeTab === 'students'
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 bg-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">leaderboard</span>
                Student Analytics
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation('settings')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none text-left ${
                  !isAddTestView && activeTab === 'settings'
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 bg-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                Manage Workspace
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-900/60">
          <button
            onClick={() => { setIsMobileSidebarOpen(false); navigate('/admin/add-test'); }}
            className="w-full bg-[#81c3d7] hover:bg-[#9ad4e4] text-[#0e2a3b] font-black text-[10px] uppercase tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(129,195,215,0.2)] border-none"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Create New Exam
          </button>
        </div>

        <div className="p-4 border-t border-slate-900/60 flex flex-col gap-1">
          <button
            onClick={() => { setIsMobileSidebarOpen(false); handleSignOut(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer border-none bg-transparent text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Panel Content Wrapper ── */}
      <div className="ml-0 lg:ml-72 flex-grow flex flex-col min-h-screen min-h-[100dvh] w-full max-w-full relative overflow-x-hidden">
        {/* Top App Bar */}
        <header className="h-16 border-b border-slate-900/60 bg-[#060913]/90 backdrop-blur-xl flex justify-between items-center px-4 sm:px-8 sticky top-0 z-30 gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors shrink-0 flex items-center justify-center border border-slate-800 cursor-pointer"
              aria-label="Open navigation sidebar"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
              <input
                className="w-full bg-slate-950/80 border border-slate-900/60 rounded-full pl-10 pr-4 py-2 text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-mono"
                placeholder="Search exams, students..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <span className="hidden sm:inline-block text-[10px] font-black uppercase text-[#81c3d7] tracking-widest font-mono">Faculty Console</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <button className="hidden sm:flex p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors border-none bg-transparent cursor-pointer items-center justify-center">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <div className="h-8 w-8 rounded-full border border-slate-800 bg-slate-900 ml-1 sm:ml-2 overflow-hidden flex items-center justify-center font-bold text-xs text-primary uppercase font-mono shadow">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* ── Render Content Areas ── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto space-y-6 sm:space-y-8 pb-16">
          {isAddTestView ? (
            /* ADD TEST SUB-VIEW */
            <div className="animate-in fade-in duration-300">
              <AddTestPage />
            </div>
          ) : (
            /* TABBED VIEWS */
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Overview Header */}
                  <div>
                    <h2 className="font-headline font-black text-3xl text-slate-100">Overview</h2>
                    <p className="text-sm text-slate-400 mt-1">High-precision metrics for active competitive mock exams.</p>
                  </div>

                  {/* Metrics Bento Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl relative overflow-hidden group hover:border-[#81c3d7]/30 transition-colors">
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Exams</span>
                        <span className="material-symbols-outlined text-primary text-xl">description</span>
                      </div>
                      <div className="font-headline font-black text-3xl mb-1 text-slate-100">2,400+</div>
                      <div className="font-mono text-[10px] font-bold text-[#81c3d7] flex items-center">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        <span className="ml-1">+12% this month</span>
                      </div>
                    </div>

                    <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl relative overflow-hidden group hover:border-[#3a7ca5]/30 transition-colors">
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-cyan-400/5 rounded-full blur-2xl group-hover:bg-cyan-400/10 transition-colors"></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">Active Students</span>
                        <span className="material-symbols-outlined text-cyan-400 text-xl">group</span>
                      </div>
                      <div className="font-headline font-black text-3xl mb-1 text-slate-100">{formatNumber(stats.activeStudents || 50000)}</div>
                      <div className="font-mono text-[10px] font-bold text-[#81c3d7] flex items-center">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        <span className="ml-1">+8% this week</span>
                      </div>
                    </div>

                    <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl relative overflow-hidden group hover:border-[#81c3d7]/30 transition-colors">
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-400/5 rounded-full blur-2xl group-hover:bg-amber-400/10 transition-colors"></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">Avg. Accuracy</span>
                        <span className="material-symbols-outlined text-[#81c3d7] text-xl">track_changes</span>
                      </div>
                      <div className="font-headline font-black text-3xl mb-1 text-slate-100">98.6%</div>
                      <div className="font-mono text-[10px] font-bold text-red-500 flex items-center">
                        <span className="material-symbols-outlined text-[14px]">trending_down</span>
                        <span className="ml-1">-0.2% variance</span>
                      </div>
                    </div>

                    <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl relative overflow-hidden group hover:border-[#81c3d7]/30 transition-colors">
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">Time Saved</span>
                        <span className="material-symbols-outlined text-primary text-xl">speed</span>
                      </div>
                      <div className="font-headline font-black text-3xl mb-1 text-slate-100">32%</div>
                      <div className="font-mono text-[10px] font-bold text-[#81c3d7] flex items-center">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        <span className="ml-1">+5% from last cohort</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart and Proctoring feed */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* SVG Chart Panel */}
                    <div className="xl:col-span-8 bg-[#060913]/60 border border-slate-900/60 rounded-2xl flex flex-col h-[420px]">
                      <div className="p-6 border-b border-slate-900/60 flex justify-between items-center">
                        <h3 className="font-headline font-bold text-lg">Performance Trends</h3>
                        <select className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-primary font-mono">
                          <option>Last 30 Days</option>
                          <option>Last Quarter</option>
                          <option>Year to Date</option>
                        </select>
                      </div>
                      <div className="flex-grow p-6 relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-50 pointer-events-none"></div>
                        <div className="w-full h-full border-l border-b border-slate-900/80 relative">
                          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <path className="opacity-80" d="M0,80 Q25,60 50,75 T100,25" fill="none" stroke="#81c3d7" strokeWidth="2.5"></path>
                            <path className="opacity-45" d="M0,90 Q30,75 60,88 T100,45" fill="none" stroke="#d9dcd6" strokeDasharray="4" strokeWidth="1.5"></path>
                          </svg>
                          <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Cohort Accuracy Analysis</div>
                        </div>
                      </div>
                    </div>

                    {/* Exambot proctoring violations feed */}
                    <div className="xl:col-span-4 bg-[#060913]/60 border border-slate-900/60 rounded-2xl flex flex-col h-[420px]">
                      <div className="p-6 border-b border-slate-900/60 flex justify-between items-center">
                        <h3 className="font-headline font-bold text-lg flex items-center gap-2">
                          <span className="material-symbols-outlined text-red-500 text-xl">shield_alert</span>
                          Security Alerts
                        </h3>
                        <button onClick={fetchViolations} className="p-1 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-slate-300 transition-colors border-none bg-transparent cursor-pointer" title="Refresh Feed">
                          <span className="material-symbols-outlined text-[18px]">refresh</span>
                        </button>
                      </div>
                      <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {violations && violations.length > 0 ? (
                          violations.map((v) => (
                            <div key={v.id} className="flex items-start gap-3 p-3 bg-slate-950/40 border border-slate-900/40 rounded-xl hover:border-red-900/30 transition-all group">
                              <div className="w-7 h-7 rounded-full bg-red-950/60 border border-red-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="material-symbols-outlined text-red-400 text-sm animate-pulse">shield</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-200 font-bold group-hover:text-red-400 transition-colors truncate">{v.email}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{v.testTitle} // <span className="text-red-400/80 font-bold">{v.violation}</span></p>
                              </div>
                              <span className="text-[9px] font-mono text-slate-600 self-center">{new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                            <span className="material-symbols-outlined text-3xl text-emerald-400 mb-2">check_circle</span>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Environment Clean</p>
                            <p className="text-[10px] text-slate-600 mt-1">No proctoring violations recorded.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'exams' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {!selectedSeries ? (
                    /* ── TIER 1: ALL EXAM SERIES OVERVIEW ── */
                    <div className="space-y-8">
                      {/* Header with Series & Test Actions */}
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-primary text-2xl">layers</span>
                            <h2 className="font-headline font-black text-3xl text-slate-100">Exam Series Tracks</h2>
                          </div>
                          <p className="text-sm text-slate-400">
                            Create, configure, and manage curriculum series. Select any track to view and edit its allotted tests.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setShowCreateSeriesModal(true)}
                            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 rounded-xl text-xs uppercase tracking-wider font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-base text-primary">add_circle</span>
                            New Series
                          </button>
                          <button
                            onClick={() => navigate('/admin/add-test')}
                            className="px-5 py-2.5 bg-primary hover:brightness-110 text-white rounded-xl text-xs uppercase tracking-wider font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2 border-none"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Add Test
                          </button>
                        </div>
                      </div>

                      {/* Series Cards Grid */}
                      {loadingSeries ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
                          <div className="w-10 h-10 border-4 border-t-primary rounded-full animate-spin opacity-60" />
                          <p className="text-xs font-bold uppercase tracking-widest font-mono">Loading Exam Tracks…</p>
                        </div>
                      ) : (() => {
                        const activeList = getDiscoveredSeriesList();
                        return activeList.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeList.map((series) => {
                              const allottedCount = adminTests.filter((t) => {
                                const cat = (t.category || '').toLowerCase();
                                const k = (series.key || '').toLowerCase();
                                return cat === k || cat.startsWith(k + '-') || cat.startsWith(k + '_') || cat.includes(k);
                              }).length;

                              return (
                                <div
                                  key={series.id || series.key}
                                  className="bg-[#060913]/70 border border-slate-900/80 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 shadow-xl group hover:-translate-y-1 relative overflow-hidden"
                                >
                                  <div
                                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none"
                                    style={{ backgroundColor: series.color || '#81c3d7' }}
                                  />
                                  <div>
                                    {/* Header Badge Row */}
                                    <div className="flex items-start justify-between gap-2 mb-4">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className="w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner"
                                          style={{
                                            backgroundColor: `${series.color || '#81c3d7'}20`,
                                            borderColor: `${series.color || '#81c3d7'}50`,
                                            color: series.color || '#81c3d7'
                                          }}
                                        >
                                          <span className="material-symbols-outlined text-2xl">
                                            {series.icon || 'quiz'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                                            {series.categoryType || 'Curriculum'}
                                          </span>
                                          <h3 className="font-headline font-bold text-lg text-slate-100 group-hover:text-primary transition-colors leading-tight">
                                            {series.title}
                                          </h3>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingSeries({ ...series });
                                            setShowEditSeriesModal(true);
                                          }}
                                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors border-none bg-transparent cursor-pointer"
                                          title="Edit Series Configuration"
                                        >
                                          <span className="material-symbols-outlined text-base">edit</span>
                                        </button>
                                        {!series.isDefault && (
                                          <button
                                            onClick={() => handleDeleteSeries(series)}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors border-none bg-transparent cursor-pointer"
                                            title="Delete Custom Series"
                                          >
                                            <span className="material-symbols-outlined text-base">delete</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Series Description */}
                                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-6">
                                      {series.description || 'Comprehensive test series with full mocks, chapter-wise practice and PYQ archives.'}
                                    </p>

                                    {/* Stats Pill Row */}
                                    <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                                      <div>
                                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Allotted Tests</span>
                                        <span className="text-sm font-bold font-headline text-slate-200">
                                          {allottedCount} {allottedCount === 1 ? 'Exam' : 'Exams'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Track Key</span>
                                        <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                                          {series.key}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Manage Button */}
                                  <button
                                    onClick={() => {
                                      setSelectedSeries(series);
                                      setSeriesSectionFilter('all');
                                    }}
                                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-primary text-slate-200 hover:text-white border border-slate-800 hover:border-transparent font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer group/btn"
                                  >
                                    <span>Manage Tests & Blueprints</span>
                                    <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">
                                      arrow_forward
                                    </span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-[#060913]/60 border border-slate-900/60 rounded-2xl p-12 text-center text-slate-500">
                            <span className="material-symbols-outlined text-5xl mb-3 text-slate-600">layers_clear</span>
                            <h3 className="font-bold text-base text-slate-300">No Exam Series Available</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                              Get started by creating your first exam series track to organize mock test blueprints.
                            </p>
                            <button
                              onClick={() => setShowCreateSeriesModal(true)}
                              className="mt-5 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border-none shadow-md"
                            >
                              Create First Series
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* ── TIER 2: ALLOTTED TESTS WITHIN SELECTED SERIES ── */
                    <div className="space-y-6">
                      {/* Breadcrumbs */}
                      <nav className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <button
                          onClick={() => setSelectedSeries(null)}
                          className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-slate-400 font-mono text-xs"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_back</span>
                          All Exam Series
                        </button>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-200 font-bold">{selectedSeries.title}</span>
                      </nav>

                      {/* Series Banner Card */}
                      <div className="bg-[#060913]/80 border border-slate-900/80 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
                        <div
                          className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
                          style={{ backgroundColor: selectedSeries.color || '#81c3d7' }}
                        />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                          <div className="flex items-start gap-4">
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg flex-shrink-0"
                              style={{
                                backgroundColor: `${selectedSeries.color || '#81c3d7'}25`,
                                borderColor: `${selectedSeries.color || '#81c3d7'}60`,
                                color: selectedSeries.color || '#81c3d7'
                              }}
                            >
                              <span className="material-symbols-outlined text-3xl">
                                {selectedSeries.icon || 'quiz'}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-900 border border-slate-800 text-slate-300">
                                  {selectedSeries.categoryType || 'Curriculum'}
                                </span>
                                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                                  Key: {selectedSeries.key}
                                </span>
                              </div>
                              <h2 className="font-headline font-black text-2xl md:text-3xl text-slate-100">
                                {selectedSeries.title}
                              </h2>
                              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                                {selectedSeries.description || 'Configured test blueprints, mocks, and full examination archives.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => {
                                setEditingSeries({ ...selectedSeries });
                                setShowEditSeriesModal(true);
                              }}
                              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                              Edit Series
                            </button>
                            <button
                              onClick={() => navigate('/admin/add-test')}
                              className="px-5 py-2.5 bg-primary hover:brightness-110 text-white rounded-xl text-xs uppercase tracking-wider font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2 border-none"
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                              Add Test to Series
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Section & Status Filter Pills */}
                      <div className="space-y-3 border-b border-slate-900/80 pb-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-slate-500 uppercase mr-1">Section:</span>
                            {[
                              { id: 'all', label: 'All Tests' },
                              { id: 'full', label: 'Full Length Mocks' },
                              { id: 'pyq', label: 'PYQ Archive' },
                              { id: 'chapter', label: 'Chapter / Topic Wise' }
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => setSeriesSectionFilter(tab.id)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                  seriesSectionFilter === tab.id
                                    ? 'bg-primary/20 text-primary border-primary/40'
                                    : 'bg-slate-950/60 text-slate-400 border-slate-900 hover:text-slate-200'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          {/* Status Filter Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap bg-slate-950/90 p-1 rounded-xl border border-slate-900">
                            <span className="text-[11px] font-mono text-slate-500 uppercase px-2">Status:</span>
                            {[
                              { id: 'all', label: 'All' },
                              { id: 'published', label: 'Published' },
                              { id: 'draft', label: 'Staged Drafts' }
                            ].map((st) => (
                              <button
                                key={st.id}
                                onClick={() => setSeriesStatusFilter(st.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                  seriesStatusFilter === st.id
                                    ? st.id === 'draft'
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                                      : st.id === 'published'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                                      : 'bg-primary/20 text-primary border-primary/40 shadow-sm'
                                    : 'text-slate-400 hover:text-white border-transparent'
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="text-xs font-mono text-slate-500 text-right">
                          Showing{' '}
                          <span className="font-bold text-slate-300">
                            {
                              adminTests
                                .filter((t) => {
                                  const cat = (t.category || '').toLowerCase();
                                  const k = (selectedSeries.key || '').toLowerCase();
                                  return cat === k || cat.startsWith(k + '-') || cat.startsWith(k + '_') || cat.includes(k);
                                })
                                .filter((t) => {
                                  if (seriesSectionFilter === 'all') return true;
                                  const cat = (t.category || '').toLowerCase();
                                  if (seriesSectionFilter === 'full') return cat.includes('full');
                                  if (seriesSectionFilter === 'pyq') return cat.includes('pyq');
                                  if (seriesSectionFilter === 'chapter') return cat.includes('chapter') || cat.includes('topic');
                                  return true;
                                })
                                .filter((t) => {
                                  const isDraft = (t.status === 'draft') || (t.category && t.category.includes('__draft'));
                                  if (seriesStatusFilter === 'published') return !isDraft;
                                  if (seriesStatusFilter === 'draft') return isDraft;
                                  return true;
                                }).length
                            }
                          </span>{' '}
                          Tests
                        </div>
                      </div>

                      {/* Tests List */}
                      <div className="bg-[#060913]/60 border border-slate-900/60 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-6 space-y-4">
                          {loadingAdminTests ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                              <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin opacity-50" />
                              <p className="text-xs font-bold uppercase tracking-widest font-mono">Retrieving blueprints…</p>
                            </div>
                          ) : (() => {
                              const filteredTests = adminTests
                                .filter((t) => {
                                  const cat = (t.category || '').toLowerCase();
                                  const k = (selectedSeries.key || '').toLowerCase();
                                  return cat === k || cat.startsWith(k + '-') || cat.startsWith(k + '_') || cat.includes(k);
                                })
                                .filter((t) => {
                                  if (seriesSectionFilter === 'all') return true;
                                  const cat = (t.category || '').toLowerCase();
                                  if (seriesSectionFilter === 'full') return cat.includes('full');
                                  if (seriesSectionFilter === 'pyq') return cat.includes('pyq');
                                  if (seriesSectionFilter === 'chapter') return cat.includes('chapter') || cat.includes('topic');
                                  return true;
                                })
                                .filter((t) => {
                                  const isDraft = (t.status === 'draft') || (t.category && t.category.includes('__draft'));
                                  if (seriesStatusFilter === 'published') return !isDraft;
                                  if (seriesStatusFilter === 'draft') return isDraft;
                                  return true;
                                });

                              if (filteredTests.length === 0) {
                                return (
                                  <div className="text-center py-16 text-slate-500 space-y-3">
                                    <span className="material-symbols-outlined text-5xl text-slate-600">assignment_late</span>
                                    <p className="text-sm font-bold uppercase tracking-wider text-slate-400">
                                      No tests match the current filter
                                    </p>
                                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                                      Try changing the section or status filter, or create a new test.
                                    </p>
                                    <button
                                      onClick={() => navigate('/admin/add-test')}
                                      className="mt-2 px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl text-xs font-bold uppercase tracking-wider border-none cursor-pointer"
                                    >
                                      Create Test Now
                                    </button>
                                  </div>
                                );
                              }

                              return filteredTests.map((test) => {
                                const isDraft = (test.status === 'draft') || (test.category && test.category.includes('__draft'));
                                return (
                                  <div
                                    key={test.id}
                                    className={`bg-slate-950/60 p-4 md:p-5 rounded-xl flex flex-col md:flex-row gap-4 justify-between md:items-center border transition-all group ${
                                      isDraft
                                        ? 'border-amber-500/30 hover:border-amber-500/60 bg-amber-950/10'
                                        : 'border-slate-900/80 hover:border-primary/40'
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: isDraft ? '#f59e0b' : (selectedSeries.color || '#81c3d7') }}
                                      />
                                      <div>
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                          <h4 className="font-bold text-slate-200 text-base group-hover:text-primary transition-colors">
                                            {test.title}
                                          </h4>
                                          {isDraft ? (
                                            <span className="px-2 py-0.5 rounded font-bold border bg-amber-950/40 text-amber-300 border-amber-800/60 flex items-center gap-1 font-mono text-[10px]">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                              STAGED DRAFT
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded font-bold border bg-emerald-950/40 text-emerald-300 border-emerald-800/60 flex items-center gap-1 font-mono text-[10px]">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                              PUBLISHED
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex gap-3 mt-1.5 flex-wrap font-mono text-[10px]">
                                          <span className="px-2 py-0.5 rounded uppercase font-bold border bg-red-950/30 text-red-400 border-red-900/40">
                                            {(test.category || selectedSeries.key || '').replace('__draft', '')}
                                          </span>
                                          <span className="text-slate-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                                            {test.duration_minutes} Mins
                                          </span>
                                          <span className="text-slate-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">help</span>
                                            {test.question_count || 0} Questions
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                                      {isDraft ? (
                                        <>
                                          {/* Proofread & Publish */}
                                          <button
                                            onClick={() => navigate(`/admin/test-paper/${test.id}`)}
                                            className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500 hover:text-slate-950 transition-all text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                                            title="Open full question paper proofreading console to inspect and publish"
                                          >
                                            <span className="material-symbols-outlined text-base">rate_review</span>
                                            <span>Proofread & Publish</span>
                                          </button>

                                          {/* Quick Publish */}
                                          <button
                                            onClick={() => handlePublishTest(test.id, test.title)}
                                            className="px-3 py-2 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                                            title="Directly publish to students"
                                          >
                                            <span className="material-symbols-outlined text-base">rocket_launch</span>
                                            <span>Publish</span>
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          {/* Quick Question View */}
                                          <button
                                            onClick={() => handleQuickQuestionView(test.id)}
                                            className="px-3.5 py-2 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                                            title="Open question paper view with Answer Key and Solutions in new tab"
                                          >
                                            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                                            <span>Question Paper View</span>
                                          </button>

                                          {/* Unpublish back to draft */}
                                          <button
                                            onClick={() => handleUnpublishTest(test.id, test.title)}
                                            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 border border-slate-800 hover:border-amber-400/30 transition-all cursor-pointer bg-transparent"
                                            title="Revert to Staged Draft (Hide from students)"
                                          >
                                            <span className="material-symbols-outlined text-base">unpublished</span>
                                          </button>
                                        </>
                                      )}

                                      {/* Edit Test Blueprint */}
                                      <button
                                        onClick={() => handleOpenEditTest(test)}
                                        className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 border border-slate-800 hover:border-amber-400/30 transition-all cursor-pointer bg-transparent"
                                        title="Edit Test Blueprint Details"
                                      >
                                        <span className="material-symbols-outlined text-base">edit</span>
                                      </button>

                                      {/* Delete Test Blueprint */}
                                      <button
                                        onClick={() => handleDeleteTest(test.id, test.title)}
                                        className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 transition-all cursor-pointer bg-transparent"
                                        title="Delete Test Blueprint"
                                      >
                                        <span className="material-symbols-outlined text-base">delete</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'question-bank' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Question Bank Header */}
                  <div className="flex justify-between items-end flex-wrap gap-4">
                    <div>
                      <h2 className="font-headline font-black text-3xl text-slate-100">Question Repository</h2>
                      <p className="text-sm text-slate-400 mt-1">Add questions to the repository via PDF & Word document scan, manual entry, or bulk JSON.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs font-bold">
                        Repository Count: {questions.length}
                      </span>
                    </div>
                  </div>

                  {/* Import Mode Selector Tabs */}
                  <div className="flex bg-[#060913]/80 p-1.5 rounded-xl border border-slate-900 flex-wrap gap-2 w-fit">
                    <button
                      type="button"
                      onClick={() => setQbImportMode('document')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        qbImportMode === 'document'
                          ? 'bg-primary text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">document_scanner</span>
                      <span>PDF & Word Upload</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQbImportMode('manual')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        qbImportMode === 'manual'
                          ? 'bg-primary text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">edit_note</span>
                      <span>Manual Question Form</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQbImportMode('json')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        qbImportMode === 'json'
                          ? 'bg-primary text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">code</span>
                      <span>Bulk JSON Import</span>
                    </button>
                  </div>

                  <div className="space-y-8">
                    {/* Active Import Mode Content */}
                    {qbImportMode === 'document' && (
                      <QuestionBankDocumentUpload onQuestionsSaved={fetchQuestions} />
                    )}

                    {qbImportMode === 'manual' && (
                        <form onSubmit={handleAddQuestion} className="bg-[#060913]/60 border border-slate-900/60 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl animate-in slide-in-from-top-4 duration-300">
                          <div className="border-b border-slate-900/60 pb-4 mb-4">
                            <h3 className="font-headline font-bold text-lg text-slate-200">Manual Question Form</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Subject</label>
                              <select
                                className="w-full p-3 rounded-lg border border-slate-900 bg-slate-950 text-slate-100 text-xs font-bold focus:outline-none focus:border-primary"
                                value={newQuestion.subject}
                                onChange={e => {
                                  const sub = e.target.value;
                                  setNewQuestion({
                                    ...newQuestion,
                                    subject: sub,
                                    chapter: NCERT_CHAPTERS[sub] ? NCERT_CHAPTERS[sub][0] : ''
                                  });
                                }}
                              >
                                <option>Physics</option>
                                <option>Chemistry</option>
                                <option>Mathematics</option>
                                <option>Biology</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Chapter</label>
                              <select
                                className="w-full p-3 rounded-lg border border-slate-900 bg-slate-950 text-slate-100 text-xs font-bold focus:outline-none focus:border-primary"
                                value={newQuestion.chapter}
                                onChange={e => setNewQuestion({...newQuestion, chapter: e.target.value})}
                              >
                                {(NCERT_CHAPTERS[newQuestion.subject] || []).map(ch => (
                                  <option key={ch} value={ch}>{ch}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Type</label>
                              <select
                                className="w-full p-3 rounded-lg border border-slate-900 bg-slate-950 text-slate-100 text-xs font-bold focus:outline-none focus:border-primary"
                                value={newQuestion.type}
                                onChange={e => setNewQuestion({...newQuestion, type: e.target.value})}
                              >
                                <option>MCQ</option>
                                <option>NUMERICAL</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Question Text (Supports LaTeX $$...$$)</label>
                            <textarea
                              ref={textRef}
                              className="w-full p-3 rounded-lg border border-slate-900 bg-slate-950 text-slate-100 text-sm min-h-[100px] focus:outline-none focus:border-primary"
                              placeholder="e.g. Find the value of $\int_0^{\pi} \sin x \, dx$"
                              value={newQuestion.text}
                              onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                              onFocus={() => setActiveQuestionField('text')}
                              required
                            />
                            <MathKeypad
                              targetRef={activeQuestionField === 'text' ? textRef : subTextRef}
                              value={activeQuestionField === 'text' ? newQuestion.text : (newQuestion.sub_text || '')}
                              setValue={(val) => setNewQuestion(prev => ({ ...prev, [activeQuestionField]: val }))}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Main Image Asset (Optional)</label>
                            <div className="flex flex-col gap-2">
                              <label className="flex flex-col items-center justify-center w-full h-28 border border-dashed border-slate-900 bg-slate-950 rounded-xl cursor-pointer hover:border-primary/50 transition-all group">
                                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                                  <span className={`material-symbols-outlined text-2xl mb-1 ${newQuestion.image_url ? 'text-green-400' : 'text-slate-500 group-hover:text-primary transition-colors'}`}>
                                    {uploading ? 'cloud_sync' : newQuestion.image_url ? 'check_circle' : 'cloud_upload'}
                                  </span>
                                  <p className="text-xs text-slate-500 group-hover:text-primary transition-colors font-mono">
                                    {uploading ? 'Processing...' : newQuestion.image_url ? 'Image Attached' : 'Upload main image'}
                                  </p>
                                </div>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} className="hidden" />
                              </label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Text Below Image (Optional, Supports LaTeX)</label>
                            <textarea
                              ref={subTextRef}
                              className="w-full p-3 rounded-lg border border-slate-900 bg-slate-950 text-slate-100 text-sm min-h-[60px] focus:outline-none focus:border-primary"
                              placeholder="e.g. Find the value of current in the circuit shown above."
                              value={newQuestion.sub_text || ''}
                              onChange={e => setNewQuestion({...newQuestion, sub_text: e.target.value})}
                              onFocus={() => setActiveQuestionField('sub_text')}
                            />
                          </div>

                          {newQuestion.type === 'MCQ' && (
                            <div className="space-y-4">
                              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block">MCQ Options (Rich Support)</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {newQuestion.options.map((opt, i) => (
                                  <div key={i} className="flex gap-2">
                                    <input
                                      ref={el => optionRefs.current[i] = el}
                                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                      className="flex-1 p-3 border border-slate-900 bg-slate-950 text-slate-100 text-xs rounded-lg focus:outline-none focus:border-primary"
                                      value={opt.text}
                                      onChange={e => {
                                        const newOpts = [...newQuestion.options];
                                        newOpts[i] = { ...newOpts[i], text: e.target.value };
                                        setNewQuestion({...newQuestion, options: newOpts});
                                      }}
                                      onFocus={() => setActiveOptionIndex(i)}
                                    />
                                    <label className={`w-12 flex items-center justify-center border border-dashed rounded-lg cursor-pointer bg-slate-950 hover:border-primary transition-colors ${opt.image_url ? 'border-green-500/50 bg-green-950/20' : 'border-slate-900'}`}>
                                      <span className={`material-symbols-outlined text-lg ${opt.image_url ? 'text-green-400' : 'text-slate-500'}`}>
                                        {optUploading === i ? 'sync' : opt.image_url ? 'image_check' : 'add_photo_alternate'}
                                      </span>
                                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'option', i)} className="hidden" />
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <MathKeypad
                                targetRef={{ current: optionRefs.current[activeOptionIndex] }}
                                value={newQuestion.options[activeOptionIndex]?.text || ''}
                                setValue={(val) => {
                                  const updated = [...newQuestion.options];
                                  updated[activeOptionIndex] = { ...updated[activeOptionIndex], text: val };
                                  setNewQuestion(prev => ({ ...prev, options: updated }));
                                }}
                              />
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Correct Answer (Index 0-3 for MCQ)</label>
                            <input
                              className="w-full p-3 rounded-lg border border-slate-900 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-primary font-mono"
                              value={newQuestion.correct_answer}
                              onChange={e => setNewQuestion({...newQuestion, correct_answer: e.target.value})}
                              placeholder="e.g. 0"
                              required
                            />
                          </div>

                          <button type="submit" disabled={uploading} className="w-full py-4 bg-primary hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(136,45,45,0.25)] border-none cursor-pointer">
                            Save Question to Database
                          </button>
                        </form>
                      )}

                      {qbImportMode === 'json' && (
                        <div className="bg-[#060913]/60 border border-slate-900/60 p-6 md:p-8 rounded-2xl shadow-xl animate-in slide-in-from-top-4 duration-300">
                          <h3 className="font-headline font-bold text-lg mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-cyan-400">cloud_upload</span>
                            Bulk Import JSON
                          </h3>
                          <p className="text-xs text-slate-400 mb-4">Paste an array of question JSON objects below to bulk-upload to the database.</p>
                          <textarea
                            className="w-full p-3 rounded-xl border border-slate-900 bg-slate-950 text-[10px] font-mono min-h-[160px] text-slate-300 focus:outline-none focus:border-primary"
                            placeholder='[{"subject": "Physics", "chapter": "Physical World", "type": "MCQ", "text": "What is...", "correct_answer": "0", "options": [{"text": "A"}, {"text": "B"}]}]'
                            onChange={async (e) => {
                              try {
                                const data = JSON.parse(e.target.value);
                                if (Array.isArray(data)) {
                                  axios.post(`${API_URL}/api/admin/questions`, data)
                                    .then(() => {
                                      alert("Bulk upload success!");
                                      fetchQuestions();
                                    })
                                    .catch(err => {
                                      const msg = err.response?.data?.error || err.message || "Failed to bulk upload";
                                      alert("Error: " + msg);
                                    });
                                }
                              } catch (err) { /* quiet during typing */ }
                            }}
                          />
                        </div>
                      )}
                  </div>
                </div>
              )}

              {activeTab === 'students' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <StudentAnalyticsWorkspace adminTests={adminTests} />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Workspace Header */}
                  <div className="border-b border-slate-900/80 pb-5">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-2xl">manage_accounts</span>
                      <h2 className="font-headline font-black text-2xl sm:text-3xl text-slate-100">
                        Manage Workspace
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Administer enrolled student accounts, provision login credentials, access control, and platform configurations.
                    </p>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Workspace Navigation */}
                    <nav className="w-full lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-none flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setWorkspaceTab('students')}
                        className={`whitespace-nowrap flex items-center justify-between px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-all w-full text-left cursor-pointer border-none ${
                          workspaceTab === 'students'
                            ? 'bg-primary/15 text-primary border-l-4 border-primary bg-[#060913]'
                            : 'text-slate-400 hover:bg-slate-900/30 hover:text-slate-200 bg-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[18px]">group</span>
                          <span>Student Accounts</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-cyan-200 font-mono font-bold">
                          {enrolledStudents.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWorkspaceTab('branding')}
                        className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-all w-full text-left cursor-pointer border-none ${
                          workspaceTab === 'branding'
                            ? 'bg-primary/15 text-primary border-l-4 border-primary bg-[#060913]'
                            : 'text-slate-400 hover:bg-slate-900/30 hover:text-slate-200 bg-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">branding_watermark</span>
                        <span>Platform Branding</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWorkspaceTab('payments')}
                        className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-all w-full text-left cursor-pointer border-none ${
                          workspaceTab === 'payments'
                            ? 'bg-primary/15 text-primary border-l-4 border-primary bg-[#060913]'
                            : 'text-slate-400 hover:bg-slate-900/30 hover:text-slate-200 bg-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">payments</span>
                        <span>Payment Integration</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWorkspaceTab('notifications')}
                        className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-all w-full text-left cursor-pointer border-none ${
                          workspaceTab === 'notifications'
                            ? 'bg-primary/15 text-primary border-l-4 border-primary bg-[#060913]'
                            : 'text-slate-400 hover:bg-slate-900/30 hover:text-slate-200 bg-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                        <span>Notifications</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWorkspaceTab('access')}
                        className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-all w-full text-left cursor-pointer border-none ${
                          workspaceTab === 'access'
                            ? 'bg-primary/15 text-primary border-l-4 border-primary bg-[#060913]'
                            : 'text-slate-400 hover:bg-slate-900/30 hover:text-slate-200 bg-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                        <span>Access Control</span>
                      </button>
                    </nav>

                    {/* Workspace Panel Content */}
                    <div className="flex-1 w-full min-w-0 space-y-6">
                      {workspaceTab === 'students' && (
                        <div className="space-y-6">
                          {/* Student Accounts Sub-Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#060913]/60 border border-slate-900/60 rounded-2xl p-6 shadow-xl">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">school</span>
                                <h3 className="font-headline font-bold text-lg text-slate-100">
                                  Enrolled Student Directory
                                </h3>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                Provision student candidate login credentials, manage User IDs, and monitor test participation.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={openEnrollModal}
                              className="px-4 py-2.5 rounded-xl bg-[#1282a2] hover:bg-[#159cc2] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(18,130,162,0.4)] transition-all cursor-pointer border-none self-start sm:self-auto"
                            >
                              <span className="material-symbols-outlined text-base">person_add</span>
                              <span>Enroll Student</span>
                            </button>
                          </div>

                          {/* Metric Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-[#060913]/70 border border-slate-900/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Total Students</span>
                                <span className="material-symbols-outlined text-cyan-400 text-xl">school</span>
                              </div>
                              <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-3xl font-black font-headline text-slate-100">{enrolledStudents.length}</span>
                                <span className="text-xs text-emerald-400 font-bold font-mono">Active</span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">Enrolled candidate accounts</p>
                            </div>

                            <div className="bg-[#060913]/70 border border-slate-900/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Target Tracks</span>
                                <span className="material-symbols-outlined text-sky-400 text-xl">track_changes</span>
                              </div>
                              <div className="mt-3 flex items-center gap-2 font-mono text-xs font-bold">
                                <span className="px-2 py-1 bg-sky-950/60 border border-sky-800/50 text-sky-300 rounded-lg">
                                  JEE: {enrolledStudents.filter(s => s.target_exam === 'JEE' || s.target_exam === 'BOTH').length}
                                </span>
                                <span className="px-2 py-1 bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 rounded-lg">
                                  NEET: {enrolledStudents.filter(s => s.target_exam === 'NEET' || s.target_exam === 'BOTH').length}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-2">Curriculum track allocation</p>
                            </div>

                            <div className="bg-[#060913]/70 border border-slate-900/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Mock Submissions</span>
                                <span className="material-symbols-outlined text-amber-400 text-xl">assignment_turned_in</span>
                              </div>
                              <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-3xl font-black font-headline text-slate-100">
                                  {enrolledStudents.reduce((sum, s) => sum + (s.tests_taken || 0), 0)}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">attempts</span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">Logged across all tests</p>
                            </div>
                          </div>

                          {/* Filter & Search Toolbar */}
                          <div className="bg-[#060913]/70 border border-slate-900/80 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
                            <div className="relative flex-1 max-w-md">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base">
                                search
                              </span>
                              <input
                                type="text"
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                placeholder="Search by Name, User ID, Email, Phone..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#1282a2] font-medium"
                              />
                              {studentSearch && (
                                <button
                                  onClick={() => setStudentSearch('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs border-none bg-transparent cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Cohort Filter */}
                              <select
                                value={studentCohortFilter}
                                onChange={(e) => setStudentCohortFilter(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-[#1282a2]"
                              >
                                <option value="all">All Classes</option>
                                <option value="Class 11">Class 11</option>
                                <option value="Class 12">Class 12</option>
                                <option value="Repeater">Repeater</option>
                              </select>

                              {/* Exam Filter */}
                              <select
                                value={studentExamFilter}
                                onChange={(e) => setStudentExamFilter(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-[#1282a2]"
                              >
                                <option value="all">All Exam Tracks</option>
                                <option value="JEE">JEE (Main/Adv)</option>
                                <option value="NEET">NEET (UG)</option>
                                <option value="BOTH">JEE & NEET</option>
                              </select>

                              {/* Refresh Button */}
                              <button
                                type="button"
                                onClick={() => { fetchStudents(); fetchStats(); }}
                                disabled={loadingStudents}
                                className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                                title="Refresh student records"
                              >
                                <span className={`material-symbols-outlined text-base ${loadingStudents ? 'animate-spin text-[#1282a2]' : ''}`}>
                                  refresh
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* Enrolled Students Table */}
                          <div className="bg-[#060913]/70 border border-slate-900/80 rounded-2xl shadow-xl overflow-hidden">
                            {loadingStudents ? (
                              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                                <span className="material-symbols-outlined text-3xl animate-spin text-[#1282a2]">progress_activity</span>
                                <p className="text-xs font-mono">Loading enrolled student directory...</p>
                              </div>
                            ) : enrolledStudents.length === 0 ? (
                              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                                <span className="material-symbols-outlined text-4xl text-slate-600">group_off</span>
                                <h4 className="text-base font-bold text-slate-200">No Enrolled Students Yet</h4>
                                <p className="text-xs text-slate-500 max-w-sm">
                                  Get started by adding student profiles directly to the database with dedicated User IDs and passwords.
                                </p>
                                <button
                                  type="button"
                                  onClick={openEnrollModal}
                                  className="mt-2 py-2 px-5 bg-[#1282a2] hover:bg-[#159cc2] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer border-none shadow-md"
                                >
                                  <span className="material-symbols-outlined text-base">person_add</span>
                                  <span>Enroll First Student</span>
                                </button>
                              </div>
                            ) : (
                              (() => {
                                const query = studentSearch.toLowerCase().trim();
                                const filtered = enrolledStudents.filter((s) => {
                                  const matchesQuery = !query ||
                                    (s.full_name && s.full_name.toLowerCase().includes(query)) ||
                                    (s.user_id && s.user_id.toLowerCase().includes(query)) ||
                                    (s.email && s.email.toLowerCase().includes(query)) ||
                                    (s.phone_number && s.phone_number.includes(query)) ||
                                    (s.roll_number && s.roll_number.toLowerCase().includes(query));

                                  const matchesCohort = studentCohortFilter === 'all' || s.class_cohort === studentCohortFilter;
                                  const matchesExam = studentExamFilter === 'all' || s.target_exam === studentExamFilter;

                                  return matchesQuery && matchesCohort && matchesExam;
                                });

                                if (filtered.length === 0) {
                                  return (
                                    <div className="p-10 text-center text-slate-400">
                                      <span className="material-symbols-outlined text-3xl text-slate-600 mb-2">search_off</span>
                                      <p className="text-xs font-mono">No students match your filter criteria.</p>
                                      <button
                                        onClick={() => { setStudentSearch(''); setStudentCohortFilter('all'); setStudentExamFilter('all'); }}
                                        className="mt-3 text-xs text-[#1282a2] hover:underline cursor-pointer bg-transparent border-none font-bold"
                                      >
                                        Reset Filters
                                      </button>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                      <thead>
                                        <tr className="border-b border-slate-900 bg-slate-950/70 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                                          <th className="py-3.5 px-4 font-bold">User ID</th>
                                          <th className="py-3.5 px-4 font-bold">Student Name & Email</th>
                                          <th className="py-3.5 px-4 font-bold">Class & Batch</th>
                                          <th className="py-3.5 px-4 font-bold">Target Exam</th>
                                          <th className="py-3.5 px-4 font-bold text-center">Tests Taken</th>
                                          <th className="py-3.5 px-4 font-bold">Contact</th>
                                          <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-900/60 text-xs">
                                        {filtered.map((student) => (
                                          <tr key={student.id} className="hover:bg-slate-900/30 transition-colors group">
                                            {/* User ID */}
                                            <td className="py-3.5 px-4 font-mono font-bold text-[#1282a2] whitespace-nowrap">
                                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1282a2]/10 border border-[#1282a2]/30">
                                                <span>{student.user_id}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(student.user_id);
                                                    alert(`User ID "${student.user_id}" copied!`);
                                                  }}
                                                  className="text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent p-0 flex items-center"
                                                  title="Copy User ID"
                                                >
                                                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                                                </button>
                                              </div>
                                            </td>

                                            {/* Name & Email */}
                                            <td className="py-3.5 px-4">
                                              <div className="font-bold text-slate-100 flex items-center gap-2">
                                                <span>{student.full_name}</span>
                                              </div>
                                              <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs mt-0.5">
                                                {student.email}
                                              </div>
                                            </td>

                                            {/* Class & Batch */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 border border-slate-800 text-slate-200">
                                                {student.class_cohort}
                                              </span>
                                              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                                                Batch: {student.batch_name || 'General'}
                                              </span>
                                            </td>

                                            {/* Target Exam */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                                student.target_exam === 'JEE'
                                                  ? 'bg-sky-950/50 border-sky-600/40 text-sky-300'
                                                  : student.target_exam === 'NEET'
                                                  ? 'bg-emerald-950/50 border-emerald-600/40 text-emerald-300'
                                                  : 'bg-purple-950/50 border-purple-600/40 text-purple-300'
                                              }`}>
                                                {student.target_exam}
                                              </span>
                                            </td>

                                            {/* Tests Taken */}
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                              <span className="inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-full text-xs font-bold font-mono bg-slate-900 border border-slate-800 text-slate-200">
                                                {student.tests_taken || 0}
                                              </span>
                                            </td>

                                            {/* Contact */}
                                            <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                              {student.phone_number || '—'}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                              <div className="inline-flex items-center gap-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() => handleOpenResetPassword(student)}
                                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                                  title="Reset password for this student"
                                                >
                                                  <span className="material-symbols-outlined text-sm">vpn_key</span>
                                                  <span>Reset Password</span>
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteStudent(student)}
                                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer border-none bg-transparent"
                                                  title="Delete student profile"
                                                >
                                                  <span className="material-symbols-outlined text-base">delete</span>
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      )}

                      {workspaceTab === 'branding' && (
                        <div className="bg-[#060913]/60 border border-slate-900/60 rounded-2xl p-6 md:p-8 shadow-xl space-y-8">
                          <div className="border-b border-slate-900/60 pb-4 mb-4 flex justify-between items-center flex-wrap gap-4">
                            <div>
                              <h3 className="font-headline font-bold text-lg text-slate-200">Platform Branding</h3>
                              <p className="text-xs text-slate-500 mt-1">Customize the visual identity details of the Student Portal.</p>
                            </div>
                            <button
                              onClick={() => alert('Branding settings saved locally! (Simulation)')}
                              className="bg-primary hover:brightness-110 text-white font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow border-none"
                            >
                              Save Changes
                            </button>
                          </div>

                          <div className="space-y-6">
                            {/* Logo upload */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                <h4 className="text-xs font-bold uppercase text-slate-300 font-mono tracking-wider">Platform Logo</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">Recommended format: SVG or PNG (256x256px).</p>
                              </div>
                              <div className="md:col-span-2">
                                <div className="flex items-center gap-6">
                                  <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-center overflow-hidden p-1.5">
                                    <Logo className="w-full h-full" showText={false} />
                                  </div>
                                  <label className="flex-1 border border-dashed border-slate-900 bg-slate-950 hover:bg-slate-950/80 rounded-xl p-4 text-center cursor-pointer transition-colors">
                                    <span className="material-symbols-outlined text-slate-500 text-xl mb-1">cloud_upload</span>
                                    <p className="text-xs text-slate-200 font-bold font-mono">Upload new logo file</p>
                                    <input type="file" accept="image/*" className="hidden" />
                                  </label>
                                </div>
                              </div>
                            </div>

                            <hr className="border-slate-900/60" />

                            {/* Colors */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                <h4 className="text-xs font-bold uppercase text-slate-300 font-mono tracking-wider">Brand Theme</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">Define core accents for the student interface.</p>
                              </div>
                              <div className="md:col-span-2 space-y-4 font-mono text-[10px]">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-[#81c3d7] border border-slate-900"></div>
                                  <input
                                    className="bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-slate-100 font-bold w-28 focus:outline-none focus:border-primary"
                                    type="text"
                                    value={primaryColor}
                                    onChange={e => setPrimaryColor(e.target.value)}
                                  />
                                  <span className="text-slate-500 uppercase tracking-widest font-bold">Primary Color</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-[#3a7ca5] border border-slate-900"></div>
                                  <input
                                    className="bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-slate-100 font-bold w-28 focus:outline-none focus:border-primary"
                                    type="text"
                                    value={secondaryColor}
                                    onChange={e => setSecondaryColor(e.target.value)}
                                  />
                                  <span className="text-slate-500 uppercase tracking-widest font-bold">Secondary Color</span>
                                </div>
                              </div>
                            </div>

                            <hr className="border-slate-900/60" />

                            {/* Text inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                <h4 className="text-xs font-bold uppercase text-slate-300 font-mono tracking-wider">Portal Details</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">Configuration details presented on main student headers.</p>
                              </div>
                              <div className="md:col-span-2 space-y-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Portal Title Name</label>
                                  <input
                                    className="w-full bg-slate-950 border border-slate-900 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-primary transition-colors font-medium"
                                    type="text"
                                    value={brandName}
                                    onChange={e => setBrandName(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Support Address Email</label>
                                  <input
                                    className="w-full bg-slate-950 border border-slate-900 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-primary transition-colors font-medium"
                                    type="email"
                                    value={supportEmail}
                                    onChange={e => setSupportEmail(e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {workspaceTab === 'payments' && (
                        <div className="bg-[#060913]/60 border border-slate-900/60 rounded-2xl p-8 shadow-xl text-center py-16">
                          <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">payments</span>
                          <h3 className="text-base font-bold text-slate-200">Payment Gateway Integration</h3>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Configure Razorpay or Stripe merchant credentials for automated student subscriptions and test registrations.
                          </p>
                          <span className="inline-block mt-4 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Enterprise Module
                          </span>
                        </div>
                      )}

                      {workspaceTab === 'notifications' && (
                        <div className="bg-[#060913]/60 border border-slate-900/60 rounded-2xl p-8 shadow-xl text-center py-16">
                          <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">notifications_active</span>
                          <h3 className="text-base font-bold text-slate-200">Broadcast Alerts & Webhooks</h3>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Send bulk SMS, email notices, or WhatsApp notifications when mock results are published.
                          </p>
                          <span className="inline-block mt-4 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                            Active via SMTP
                          </span>
                        </div>
                      )}

                      {workspaceTab === 'access' && (
                        <div className="bg-[#060913]/60 border border-slate-900/60 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
                          <div className="border-b border-slate-900/60 pb-4">
                            <h3 className="font-headline font-bold text-lg text-slate-200">Administrator Access Control</h3>
                            <p className="text-xs text-slate-500 mt-1">Authorized admin profiles with elevated permissions on examinations and user directories.</p>
                          </div>
                          <div className="space-y-3 font-mono text-xs">
                            <div className="flex items-center justify-between p-4 bg-slate-950/80 rounded-xl border border-slate-900">
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#81c3d7] text-2xl">shield_person</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-100">Karthik Sai Anala</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">DBA</span>
                                  </div>
                                  <span className="text-[11px] text-slate-400">karthiksaianala@gmail.com</span>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] uppercase">
                                Superadmin
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-950/80 rounded-xl border border-slate-900">
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#81c3d7] text-2xl">admin_panel_settings</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-100">Database Administrator</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">DBA2</span>
                                  </div>
                                  <span className="text-[11px] text-slate-400">ikshatests@zohomail.in</span>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold text-[10px] uppercase">
                                Administrator
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Create Series Modal ── */}
      {showCreateSeriesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-2xl">add_circle</span>
                <h3 className="font-headline font-bold text-lg text-slate-100">Create Exam Series</h3>
              </div>
              <button
                onClick={() => setShowCreateSeriesModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 border-none bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSeries} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                  Series Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPSC Civil Services Prelims"
                  value={seriesFormData.title}
                  onChange={(e) => setSeriesFormData({ ...seriesFormData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-primary font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Series Key (Unique) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. upsc"
                    value={seriesFormData.key}
                    onChange={(e) => setSeriesFormData({ ...seriesFormData, key: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Category Track
                  </label>
                  <select
                    value={seriesFormData.categoryType}
                    onChange={(e) => setSeriesFormData({ ...seriesFormData, categoryType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-bold focus:outline-none focus:border-primary"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Medical">Medical</option>
                    <option value="Civil Services">Civil Services</option>
                    <option value="Foundation">Foundation</option>
                    <option value="Aptitude">Aptitude</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the examination series curriculum..."
                  value={seriesFormData.description}
                  onChange={(e) => setSeriesFormData({ ...seriesFormData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Material Icon Name
                  </label>
                  <select
                    value={seriesFormData.icon}
                    onChange={(e) => setSeriesFormData({ ...seriesFormData, icon: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-primary"
                  >
                    <option value="quiz">quiz</option>
                    <option value="school">school</option>
                    <option value="science">science</option>
                    <option value="biotech">biotech</option>
                    <option value="engineering">engineering</option>
                    <option value="calculate">calculate</option>
                    <option value="terminal">terminal</option>
                    <option value="psychology">psychology</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={seriesFormData.color}
                      onChange={(e) => setSeriesFormData({ ...seriesFormData, color: e.target.value })}
                      className="w-10 h-10 rounded-lg bg-transparent border border-slate-800 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={seriesFormData.color}
                      onChange={(e) => setSeriesFormData({ ...seriesFormData, color: e.target.value })}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateSeriesModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-wider cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider cursor-pointer border-none shadow-md"
                >
                  Create Series
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Series Modal ── */}
      {showEditSeriesModal && editingSeries && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-2xl">edit_note</span>
                <h3 className="font-headline font-bold text-lg text-slate-100">Edit Exam Series</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditSeriesModal(false);
                  setEditingSeries(null);
                }}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 border-none bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSeries} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                  Series Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingSeries.title}
                  onChange={(e) => setEditingSeries({ ...editingSeries, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-primary font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Series Key
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingSeries.key}
                    className="w-full bg-slate-950/50 border border-slate-900 rounded-xl p-3 text-xs text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Category Track
                  </label>
                  <select
                    value={editingSeries.categoryType || 'Engineering'}
                    onChange={(e) => setEditingSeries({ ...editingSeries, categoryType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-bold focus:outline-none focus:border-primary"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Medical">Medical</option>
                    <option value="Civil Services">Civil Services</option>
                    <option value="Foundation">Foundation</option>
                    <option value="Aptitude">Aptitude</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingSeries.description || ''}
                  onChange={(e) => setEditingSeries({ ...editingSeries, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Material Icon Name
                  </label>
                  <select
                    value={editingSeries.icon || 'quiz'}
                    onChange={(e) => setEditingSeries({ ...editingSeries, icon: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-primary"
                  >
                    <option value="quiz">quiz</option>
                    <option value="school">school</option>
                    <option value="science">science</option>
                    <option value="biotech">biotech</option>
                    <option value="engineering">engineering</option>
                    <option value="calculate">calculate</option>
                    <option value="terminal">terminal</option>
                    <option value="psychology">psychology</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingSeries.color || '#81c3d7'}
                      onChange={(e) => setEditingSeries({ ...editingSeries, color: e.target.value })}
                      className="w-10 h-10 rounded-lg bg-transparent border border-slate-800 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={editingSeries.color || '#81c3d7'}
                      onChange={(e) => setEditingSeries({ ...editingSeries, color: e.target.value })}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditSeriesModal(false);
                    setEditingSeries(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-wider cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider cursor-pointer border-none shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Test Modal ── */}
      {showEditTestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-2xl">edit_document</span>
                <h3 className="font-headline font-bold text-lg text-slate-100">Edit Test Blueprint</h3>
              </div>
              <button
                onClick={() => setShowEditTestModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 border-none bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditTest} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                  Test Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingTest.title}
                  onChange={(e) => setEditingTest({ ...editingTest, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-primary font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={editingTest.category}
                    onChange={(e) => setEditingTest({ ...editingTest, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-primary"
                    placeholder="e.g. jee-full, neet-pyq"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    value={editingTest.duration_minutes}
                    onChange={(e) => setEditingTest({ ...editingTest, duration_minutes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditTestModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-wider cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider cursor-pointer border-none shadow-md"
                >
                  Update Test Blueprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Enroll New Student Modal ── */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#1282a2] text-2xl">person_add</span>
                <h3 className="font-headline font-bold text-lg text-slate-100">Enroll New Student</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 border-none bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleEnrollStudent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Full Name */}
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={enrollForm.fullName}
                  onChange={(e) => setEnrollForm({ ...enrollForm, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-[#1282a2] font-medium"
                />
              </div>

              {/* User ID & Helper */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Student User ID (Unique Login ID) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setEnrollForm({ ...enrollForm, userId: generateRandomUserId() })}
                    className="text-[10px] text-[#1282a2] hover:underline font-mono font-bold cursor-pointer bg-transparent border-none p-0 inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px]">autorenew</span>
                    Generate ID
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. IK2026-101"
                  value={enrollForm.userId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, userId: e.target.value.trim() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-[#1282a2]"
                />
                <span className="text-[10px] text-slate-500 font-mono block mt-1">
                  Students can use this User ID directly to log into the portal.
                </span>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                  Student / Parent Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com (or leave empty)"
                  value={enrollForm.email}
                  onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-[#1282a2]"
                />
                <span className="text-[10px] text-slate-500 font-mono block mt-1">
                  If left blank, an institutional address ({enrollForm.userId ? enrollForm.userId.toLowerCase().replace(/[^a-z0-9]/g, '') : 'userid'}@ikshatests.com) is created automatically.
                </span>
              </div>

              {/* Password & Generator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Initial Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setEnrollForm({ ...enrollForm, password: generateRandomPassword() })}
                    className="text-[10px] text-[#1282a2] hover:underline font-mono font-bold cursor-pointer bg-transparent border-none p-0 inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px]">password</span>
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Min 6 characters"
                  value={enrollForm.password}
                  onChange={(e) => setEnrollForm({ ...enrollForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-[#1282a2]"
                />
                <span className="text-[10px] text-amber-400/80 font-mono block mt-1">
                  Notice: Students cannot change passwords after login. Credential updates remain admin-managed.
                </span>
              </div>

              {/* Cohort & Target Exam */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Class Cohort
                  </label>
                  <select
                    value={enrollForm.classCohort}
                    onChange={(e) => setEnrollForm({ ...enrollForm, classCohort: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-bold focus:outline-none focus:border-[#1282a2]"
                  >
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                    <option value="Repeater">Repeater / Dropper</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Target Exam
                  </label>
                  <select
                    value={enrollForm.targetExam}
                    onChange={(e) => setEnrollForm({ ...enrollForm, targetExam: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-bold focus:outline-none focus:border-[#1282a2]"
                  >
                    <option value="JEE">JEE (Main + Adv)</option>
                    <option value="NEET">NEET (UG)</option>
                    <option value="BOTH">JEE & NEET</option>
                  </select>
                </div>
              </div>

              {/* Phone & Batch */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={enrollForm.phoneNumber}
                    onChange={(e) => setEnrollForm({ ...enrollForm, phoneNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-[#1282a2]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Batch Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Batch-A"
                    value={enrollForm.batchName}
                    onChange={(e) => setEnrollForm({ ...enrollForm, batchName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-[#1282a2]"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-wider cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEnrollingStudent}
                  className="px-5 py-2.5 rounded-xl bg-[#1282a2] hover:bg-[#159cc2] text-white text-xs font-bold uppercase tracking-wider cursor-pointer border-none shadow-[0_0_20px_rgba(18,130,162,0.4)] flex items-center gap-2"
                >
                  {isEnrollingStudent ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">how_to_reg</span>
                      <span>Create & Provision Student</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Student Credentials Slip Modal ── */}
      {createdStudentSlip && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#070b19] border-2 border-[#1282a2]/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(18,130,162,0.3)] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-[#034078]/80 to-[#1282a2]/50 border-b border-[#1282a2]/40 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <span className="material-symbols-outlined text-2xl">verified</span>
                </div>
                <div>
                  <h3 className="font-headline font-black text-lg text-white">Student Enrolled Successfully</h3>
                  <p className="text-[11px] text-cyan-200 font-mono">Official Academic Login Slip</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreatedStudentSlip(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 border-none bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Slip Card Details */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-400">Student Name:</span>
                  <span className="text-slate-100 font-bold">{createdStudentSlip.fullName}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-[#1282a2] font-bold">User ID (Sign-in identifier):</span>
                  <span className="text-[#1282a2] font-black text-sm px-2 py-0.5 rounded bg-[#1282a2]/15 border border-[#1282a2]/40">
                    {createdStudentSlip.userId}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-400">Login Email:</span>
                  <span className="text-slate-200">{createdStudentSlip.email}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-amber-400 font-bold">Password:</span>
                  <span className="text-amber-300 font-black text-sm px-2.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/40 select-all">
                    {createdStudentSlip.password}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-400">Class & Target Exam:</span>
                  <span className="text-slate-200 font-semibold">{createdStudentSlip.classCohort} • {createdStudentSlip.targetExam}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Portal URL:</span>
                  <span className="text-cyan-400 font-semibold">{window.location.origin}/login</span>
                </div>
              </div>

              {/* Policy Alert */}
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-amber-400 shrink-0 mt-0.5">info</span>
                <span>
                  <strong>Academic Policy:</strong> Students log in using their <strong>User ID</strong> or <strong>Email</strong> with this password. Students cannot change passwords after logging in; any credential adjustments must be made by the administrator.
                </span>
              </div>

              {/* Copy & Finish Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyCredentialsSlip}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1282a2] hover:bg-[#159cc2] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(18,130,162,0.4)] transition-all cursor-pointer border-none"
                >
                  <span className="material-symbols-outlined text-base">
                    {copiedSlip ? 'check_circle' : 'content_copy'}
                  </span>
                  <span>{copiedSlip ? 'Copied Slip to Clipboard!' : 'Copy Credentials Slip'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedStudentSlip(null)}
                  className="px-5 py-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-200 font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {resetPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-400 text-2xl">vpn_key</span>
                <h3 className="font-headline font-bold text-lg text-slate-100">Reset Student Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordModal(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 border-none bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-1">
                <div className="text-xs font-bold text-slate-200">{resetPasswordModal.full_name}</div>
                <div className="text-[11px] font-mono text-[#1282a2]">User ID: {resetPasswordModal.user_id}</div>
                <div className="text-[11px] font-mono text-slate-400">{resetPasswordModal.email}</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                    New Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordVal(generateRandomPassword())}
                    className="text-[10px] text-[#1282a2] hover:underline font-mono font-bold cursor-pointer bg-transparent border-none p-0 inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px]">autorenew</span>
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter new password"
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-[#1282a2]"
                />
              </div>

              {resetSuccessMessage && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between gap-2 animate-in fade-in">
                  <span>{resetSuccessMessage}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newPasswordVal);
                      alert('Password copied to clipboard!');
                    }}
                    className="px-2 py-1 rounded bg-emerald-900/60 text-emerald-200 text-[10px] font-mono font-bold border border-emerald-500/50 cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetPasswordModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-wider cursor-pointer bg-transparent"
                >
                  {resetSuccessMessage ? 'Close' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer border-none shadow-md flex items-center gap-2"
                >
                  {isResettingPassword ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">lock_reset</span>
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

