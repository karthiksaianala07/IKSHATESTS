import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

// Sample Mock Students Database categorized by Class (Used for Demo & Offline Fallback)
const MOCK_STUDENTS = [
  {
    id: 'std-1',
    rollNo: 'IK-1101',
    name: 'Aryan Sharma',
    email: 'aryan.sharma@example.com',
    classCohort: 'Class 11',
    stream: 'JEE',
    classRank: 1,
    testsAttempted: 14,
    avgScore: 248,
    maxScore: 300,
    accuracy: 91.2,
    pacingSec: 46,
    cutoffClearedRate: '100%',
    status: 'High Performer',
    streak: '18 Days',
    subjects: [
      { name: 'Physics', score: 86, maxScore: 100, accuracy: 92.4, avgTimePerQ: '1.4m' },
      { name: 'Chemistry', score: 88, maxScore: 100, accuracy: 94.1, avgTimePerQ: '1.1m' },
      { name: 'Mathematics', score: 74, maxScore: 100, accuracy: 87.2, avgTimePerQ: '2.1m' }
    ],
    topicDiagnostics: {
      strong: [
        { topic: 'Laws of Motion', subject: 'Physics', accuracy: '96%', speed: 'Optimal' },
        { topic: 'Chemical Bonding', subject: 'Chemistry', accuracy: '94%', speed: 'Fast' },
        { topic: 'Sequence & Series', subject: 'Mathematics', accuracy: '91%', speed: 'Optimal' }
      ],
      careless: [
        { topic: 'Work, Energy & Power', subject: 'Physics', accuracy: '72%', impact: '-3 pts leak' },
        { topic: 'Thermodynamics', subject: 'Chemistry', accuracy: '68%', impact: '-2 pts leak' }
      ],
      weak: [
        { topic: 'Rotational Dynamics', subject: 'Physics', accuracy: '45%', status: 'Revision Needed' },
        { topic: 'Permutations & Combinations', subject: 'Mathematics', accuracy: '52%', status: 'Low Accuracy' }
      ]
    },
    testHistory: [
      {
        title: 'Class 11 JEE Milestone Mock #5',
        date: '2026-09-16',
        score: 260,
        max: 300,
        accuracy: '93%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 90, maxScore: 100 },
          { subject: 'Chemistry', score: 92, maxScore: 100 },
          { subject: 'Mathematics', score: 78, maxScore: 100 }
        ]
      },
      {
        title: 'PCM Combined Sprint Test #4',
        date: '2026-09-08',
        score: 252,
        max: 300,
        accuracy: '91%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 86, maxScore: 100 },
          { subject: 'Chemistry', score: 90, maxScore: 100 },
          { subject: 'Mathematics', score: 76, maxScore: 100 }
        ]
      },
      {
        title: 'Class 11 JEE Milestone Mock #4',
        date: '2026-08-30',
        score: 244,
        max: 300,
        accuracy: '89%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 82, maxScore: 100 },
          { subject: 'Chemistry', score: 87, maxScore: 100 },
          { subject: 'Mathematics', score: 75, maxScore: 100 }
        ]
      },
      {
        title: 'Physics & Chem Part Test #2',
        date: '2026-08-22',
        score: 236,
        max: 300,
        accuracy: '88%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 79, maxScore: 100 },
          { subject: 'Chemistry', score: 85, maxScore: 100 },
          { subject: 'Mathematics', score: 72, maxScore: 100 }
        ]
      },
      {
        title: 'Class 11 Comprehensive Drill #3',
        date: '2026-08-05',
        score: 228,
        max: 300,
        accuracy: '86%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 75, maxScore: 100 },
          { subject: 'Chemistry', score: 83, maxScore: 100 },
          { subject: 'Mathematics', score: 70, maxScore: 100 }
        ]
      }
    ]
  },
  {
    id: 'std-2',
    rollNo: 'IK-1102',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    classCohort: 'Class 11',
    stream: 'NEET',
    classRank: 2,
    testsAttempted: 12,
    avgScore: 615,
    maxScore: 720,
    accuracy: 88.5,
    pacingSec: 42,
    cutoffClearedRate: '100%',
    status: 'Top Ranker',
    streak: '14 Days',
    subjects: [
      { name: 'Biology', score: 324, maxScore: 360, accuracy: 93.5, avgTimePerQ: '0.8m' },
      { name: 'Chemistry', score: 154, maxScore: 180, accuracy: 87.2, avgTimePerQ: '1.2m' },
      { name: 'Physics', score: 137, maxScore: 180, accuracy: 82.0, avgTimePerQ: '1.6m' }
    ],
    topicDiagnostics: {
      strong: [
        { topic: 'Cell Biology & Genetics', subject: 'Biology', accuracy: '98%', speed: 'Fast' },
        { topic: 'Structure of Atom', subject: 'Chemistry', accuracy: '92%', speed: 'Optimal' }
      ],
      careless: [
        { topic: 'Kinematics', subject: 'Physics', accuracy: '70%', impact: '-4 pts leak' }
      ],
      weak: [
        { topic: 'Plant Physiology', subject: 'Biology', accuracy: '58%', status: 'Revision Needed' },
        { topic: 'Oscillations & Waves', subject: 'Physics', accuracy: '50%', status: 'Low Accuracy' }
      ]
    },
    testHistory: [
      {
        title: 'NEET Grand National Mock #4',
        date: '2026-09-17',
        score: 636,
        max: 720,
        accuracy: '91%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Biology', score: 338, maxScore: 360 },
          { subject: 'Chemistry', score: 158, maxScore: 180 },
          { subject: 'Physics', score: 140, maxScore: 180 }
        ]
      },
      {
        title: 'NEET Class 11 Diagnostic Mock #3',
        date: '2026-09-10',
        score: 622,
        max: 720,
        accuracy: '89%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Biology', score: 330, maxScore: 360 },
          { subject: 'Chemistry', score: 154, maxScore: 180 },
          { subject: 'Physics', score: 138, maxScore: 180 }
        ]
      },
      {
        title: 'PCB Combined Speed Drill #2',
        date: '2026-09-02',
        score: 608,
        max: 720,
        accuracy: '88%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Biology', score: 322, maxScore: 360 },
          { subject: 'Chemistry', score: 150, maxScore: 180 },
          { subject: 'Physics', score: 136, maxScore: 180 }
        ]
      },
      {
        title: 'Biology Full Botany Sprint',
        date: '2026-08-25',
        score: 594,
        max: 720,
        accuracy: '86%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Biology', score: 318, maxScore: 360 },
          { subject: 'Chemistry', score: 146, maxScore: 180 },
          { subject: 'Physics', score: 130, maxScore: 180 }
        ]
      },
      {
        title: 'NEET Early Diagnostic Part 1',
        date: '2026-08-08',
        score: 580,
        max: 720,
        accuracy: '84%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Biology', score: 310, maxScore: 360 },
          { subject: 'Chemistry', score: 142, maxScore: 180 },
          { subject: 'Physics', score: 128, maxScore: 180 }
        ]
      }
    ]
  },
  {
    id: 'std-3',
    rollNo: 'IK-1103',
    name: 'Rohan Desai',
    email: 'rohan.desai@example.com',
    classCohort: 'Class 11',
    stream: 'JEE',
    classRank: 8,
    testsAttempted: 9,
    avgScore: 168,
    maxScore: 300,
    accuracy: 72.4,
    pacingSec: 58,
    cutoffClearedRate: '78%',
    status: 'On Track',
    streak: '6 Days',
    subjects: [
      { name: 'Physics', score: 58, maxScore: 100, accuracy: 74.0, avgTimePerQ: '1.9m' },
      { name: 'Chemistry', score: 66, maxScore: 100, accuracy: 78.5, avgTimePerQ: '1.5m' },
      { name: 'Mathematics', score: 44, maxScore: 100, accuracy: 64.0, avgTimePerQ: '2.5m' }
    ],
    topicDiagnostics: {
      strong: [
        { topic: 'Periodic Classification', subject: 'Chemistry', accuracy: '88%', speed: 'Fast' }
      ],
      careless: [
        { topic: 'Newtonian Dynamics', subject: 'Physics', accuracy: '62%', impact: '-6 pts leak' }
      ],
      weak: [
        { topic: 'Trigonometric Functions', subject: 'Mathematics', accuracy: '38%', status: 'Needs Intervention' },
        { topic: 'Kinetic Theory', subject: 'Physics', accuracy: '42%', status: 'Low Accuracy' }
      ]
    },
    testHistory: [
      {
        title: 'Class 11 JEE Milestone Mock #5',
        date: '2026-09-16',
        score: 184,
        max: 300,
        accuracy: '76%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 64, maxScore: 100 },
          { subject: 'Chemistry', score: 72, maxScore: 100 },
          { subject: 'Mathematics', score: 48, maxScore: 100 }
        ]
      },
      {
        title: 'PCM Combined Sprint Test #4',
        date: '2026-09-08',
        score: 174,
        max: 300,
        accuracy: '73%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 60, maxScore: 100 },
          { subject: 'Chemistry', score: 68, maxScore: 100 },
          { subject: 'Mathematics', score: 46, maxScore: 100 }
        ]
      },
      {
        title: 'Class 11 JEE Milestone Mock #4',
        date: '2026-08-30',
        score: 165,
        max: 300,
        accuracy: '71%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 56, maxScore: 100 },
          { subject: 'Chemistry', score: 65, maxScore: 100 },
          { subject: 'Mathematics', score: 44, maxScore: 100 }
        ]
      },
      {
        title: 'Physics & Chem Part Test #2',
        date: '2026-08-22',
        score: 158,
        max: 300,
        accuracy: '69%',
        cutoffCleared: false,
        status: 'Below Cutoff',
        subjectScores: [
          { subject: 'Physics', score: 54, maxScore: 100 },
          { subject: 'Chemistry', score: 62, maxScore: 100 },
          { subject: 'Mathematics', score: 42, maxScore: 100 }
        ]
      }
    ]
  },
  {
    id: 'std-7',
    rollNo: 'IK-1105',
    name: 'Kavya Nair',
    email: 'kavya.nair@example.com',
    classCohort: 'Class 11',
    stream: 'JEE',
    classRank: 3,
    testsAttempted: 11,
    avgScore: 232,
    maxScore: 300,
    accuracy: 86.4,
    pacingSec: 47,
    cutoffClearedRate: '100%',
    status: 'Rising Star',
    streak: '12 Days',
    subjects: [
      { name: 'Physics', score: 82, maxScore: 100, accuracy: 89.0, avgTimePerQ: '1.5m' },
      { name: 'Chemistry', score: 84, maxScore: 100, accuracy: 91.5, avgTimePerQ: '1.2m' },
      { name: 'Mathematics', score: 66, maxScore: 100, accuracy: 78.8, avgTimePerQ: '2.2m' }
    ],
    topicDiagnostics: {
      strong: [
        { topic: 'Vectors & Kinematics', subject: 'Physics', accuracy: '94%', speed: 'Optimal' },
        { topic: 'Gaseous State', subject: 'Chemistry', accuracy: '90%', speed: 'Fast' }
      ],
      careless: [
        { topic: 'Quadratic Equations', subject: 'Mathematics', accuracy: '72%', impact: '-4 pts leak' }
      ],
      weak: [
        { topic: 'Circular Motion', subject: 'Physics', accuracy: '54%', status: 'Practice Needed' }
      ]
    },
    testHistory: [
      {
        title: 'Class 11 JEE Milestone Mock #5',
        date: '2026-09-16',
        score: 242,
        max: 300,
        accuracy: '88%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 84, maxScore: 100 },
          { subject: 'Chemistry', score: 88, maxScore: 100 },
          { subject: 'Mathematics', score: 70, maxScore: 100 }
        ]
      },
      {
        title: 'PCM Combined Sprint Test #4',
        date: '2026-09-08',
        score: 236,
        max: 300,
        accuracy: '87%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 82, maxScore: 100 },
          { subject: 'Chemistry', score: 85, maxScore: 100 },
          { subject: 'Mathematics', score: 69, maxScore: 100 }
        ]
      },
      {
        title: 'Class 11 JEE Milestone Mock #4',
        date: '2026-08-30',
        score: 228,
        max: 300,
        accuracy: '85%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 80, maxScore: 100 },
          { subject: 'Chemistry', score: 82, maxScore: 100 },
          { subject: 'Mathematics', score: 66, maxScore: 100 }
        ]
      }
    ]
  },
  {
    id: 'std-8',
    rollNo: 'IK-1104',
    name: 'Aditya Verma',
    email: 'aditya.verma@example.com',
    classCohort: 'Class 11',
    stream: 'NEET',
    classRank: 5,
    testsAttempted: 10,
    avgScore: 562,
    maxScore: 720,
    accuracy: 82.0,
    pacingSec: 49,
    cutoffClearedRate: '90%',
    status: 'Active Performer',
    streak: '8 Days',
    subjects: [
      { name: 'Biology', score: 298, maxScore: 360, accuracy: 88.0, avgTimePerQ: '0.9m' },
      { name: 'Chemistry', score: 142, maxScore: 180, accuracy: 80.5, avgTimePerQ: '1.4m' },
      { name: 'Physics', score: 122, maxScore: 180, accuracy: 76.0, avgTimePerQ: '1.8m' }
    ],
    topicDiagnostics: {
      strong: [
        { topic: 'Biological Classification', subject: 'Biology', accuracy: '92%', speed: 'Fast' }
      ],
      careless: [
        { topic: 'Chemical Bonding', subject: 'Chemistry', accuracy: '68%', impact: '-5 pts leak' }
      ],
      weak: [
        { topic: 'Units and Measurements', subject: 'Physics', accuracy: '52%', status: 'Review Needed' }
      ]
    },
    testHistory: [
      {
        title: 'NEET Grand National Mock #4',
        date: '2026-09-17',
        score: 580,
        max: 720,
        accuracy: '84%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Biology', score: 310, maxScore: 360 },
          { subject: 'Chemistry', score: 145, maxScore: 180 },
          { subject: 'Physics', score: 125, maxScore: 180 }
        ]
      },
      {
        title: 'NEET Class 11 Diagnostic Mock #3',
        date: '2026-09-10',
        score: 565,
        max: 720,
        accuracy: '82%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Biology', score: 300, maxScore: 360 },
          { subject: 'Chemistry', score: 142, maxScore: 180 },
          { subject: 'Physics', score: 123, maxScore: 180 }
        ]
      }
    ]
  },
  {
    id: 'std-4',
    rollNo: '128003120',
    name: 'Tanvi Kulkarni',
    email: 'tanvi.128003@example.com',
    classCohort: 'Class 12',
    stream: 'JEE',
    classRank: 1,
    testsAttempted: 22,
    avgScore: 262,
    maxScore: 300,
    accuracy: 94.0,
    pacingSec: 41,
    cutoffClearedRate: '100%',
    status: 'Top Ranker',
    streak: '32 Days',
    subjects: [
      { name: 'Physics', score: 92, maxScore: 100, accuracy: 95.0, avgTimePerQ: '1.3m' },
      { name: 'Chemistry', score: 91, maxScore: 100, accuracy: 96.2, avgTimePerQ: '1.0m' },
      { name: 'Mathematics', score: 79, maxScore: 100, accuracy: 90.8, avgTimePerQ: '1.9m' }
    ],
    topicDiagnostics: {
      strong: [
        { topic: 'Electrostatics', subject: 'Physics', accuracy: '98%', speed: 'Fast' },
        { topic: 'Current Electricity', subject: 'Physics', accuracy: '96%', speed: 'Optimal' },
        { topic: 'Coordination Compounds', subject: 'Chemistry', accuracy: '97%', speed: 'Fast' },
        { topic: 'Matrices & Determinants', subject: 'Mathematics', accuracy: '94%', speed: 'Optimal' }
      ],
      careless: [
        { topic: 'Definite Integrals', subject: 'Mathematics', accuracy: '78%', impact: '-2 pts leak' }
      ],
      weak: [
        { topic: 'Wave Optics', subject: 'Physics', accuracy: '62%', status: 'Review Formulas' }
      ]
    },
    testHistory: [
      {
        title: 'JEE Main Ultimate Full Mock #2',
        date: '2026-09-16',
        score: 278,
        max: 300,
        accuracy: '96%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 96, maxScore: 100 },
          { subject: 'Chemistry', score: 95, maxScore: 100 },
          { subject: 'Mathematics', score: 87, maxScore: 100 }
        ]
      },
      {
        title: 'JEE Main Ultimate Full Mock #1',
        date: '2026-09-09',
        score: 268,
        max: 300,
        accuracy: '95%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 94, maxScore: 100 },
          { subject: 'Chemistry', score: 92, maxScore: 100 },
          { subject: 'Mathematics', score: 82, maxScore: 100 }
        ]
      },
      {
        title: 'JEE Advanced Paper 1 Mock',
        date: '2026-09-01',
        score: 262,
        max: 300,
        accuracy: '93%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 91, maxScore: 100 },
          { subject: 'Chemistry', score: 90, maxScore: 100 },
          { subject: 'Mathematics', score: 81, maxScore: 100 }
        ]
      },
      {
        title: 'Class 12 Physics & Maths Sprint',
        date: '2026-08-24',
        score: 254,
        max: 300,
        accuracy: '91%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 89, maxScore: 100 },
          { subject: 'Chemistry', score: 87, maxScore: 100 },
          { subject: 'Mathematics', score: 78, maxScore: 100 }
        ]
      },
      {
        title: 'Class 12 Diagnostic Part Test #1',
        date: '2026-08-10',
        score: 246,
        max: 300,
        accuracy: '90%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 86, maxScore: 100 },
          { subject: 'Chemistry', score: 85, maxScore: 100 },
          { subject: 'Mathematics', score: 75, maxScore: 100 }
        ]
      }
    ]
  },
  {
    id: 'std-5',
    rollNo: 'IK-1205',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@example.com',
    classCohort: 'Class 12',
    stream: 'JEE',
    classRank: 5,
    testsAttempted: 18,
    avgScore: 215,
    maxScore: 300,
    accuracy: 82.5,
    pacingSec: 49,
    cutoffClearedRate: '94%',
    status: 'High Performer',
    streak: '15 Days',
    subjects: [
      { name: 'Physics', score: 72, maxScore: 100, accuracy: 83.0, avgTimePerQ: '1.7m' },
      { name: 'Chemistry', score: 81, maxScore: 100, accuracy: 89.0, avgTimePerQ: '1.2m' },
      { name: 'Mathematics', score: 62, maxScore: 100, accuracy: 75.5, avgTimePerQ: '2.3m' }
    ],
    topicDiagnostics: {
      strong: [
        { topic: 'Solutions & Colligative', subject: 'Chemistry', accuracy: '92%', speed: 'Fast' }
      ],
      careless: [
        { topic: 'Magnetism & Matter', subject: 'Physics', accuracy: '65%', impact: '-4 pts leak' }
      ],
      weak: [
        { topic: 'Differential Equations', subject: 'Mathematics', accuracy: '48%', status: 'Review Needed' }
      ]
    },
    testHistory: [
      {
        title: 'JEE Main Ultimate Full Mock #2',
        date: '2026-09-16',
        score: 226,
        max: 300,
        accuracy: '85%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 76, maxScore: 100 },
          { subject: 'Chemistry', score: 85, maxScore: 100 },
          { subject: 'Mathematics', score: 65, maxScore: 100 }
        ]
      },
      {
        title: 'JEE Main Ultimate Full Mock #1',
        date: '2026-09-09',
        score: 218,
        max: 300,
        accuracy: '84%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 74, maxScore: 100 },
          { subject: 'Chemistry', score: 82, maxScore: 100 },
          { subject: 'Mathematics', score: 62, maxScore: 100 }
        ]
      },
      {
        title: 'Class 12 Physics & Maths Sprint',
        date: '2026-08-24',
        score: 210,
        max: 300,
        accuracy: '81%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 70, maxScore: 100 },
          { subject: 'Chemistry', score: 80, maxScore: 100 },
          { subject: 'Mathematics', score: 60, maxScore: 100 }
        ]
      }
    ]
  },
  {
    id: 'std-9',
    rollNo: 'IK-1208',
    name: 'Siddharth Rao',
    email: 'siddharth.rao@example.com',
    classCohort: 'Class 12',
    stream: 'JEE',
    classRank: 2,
    testsAttempted: 19,
    avgScore: 248,
    maxScore: 300,
    accuracy: 90.5,
    pacingSec: 43,
    cutoffClearedRate: '100%',
    status: 'Speed Specialist',
    streak: '24 Days',
    subjects: [
      { name: 'Physics', score: 88, maxScore: 100, accuracy: 93.0, avgTimePerQ: '1.2m' },
      { name: 'Chemistry', score: 86, maxScore: 100, accuracy: 92.0, avgTimePerQ: '1.1m' },
      { name: 'Mathematics', score: 74, maxScore: 100, accuracy: 86.5, avgTimePerQ: '1.8m' }
    ],
    topicDiagnostics: {
      strong: [
        { topic: 'Ray Optics', subject: 'Physics', accuracy: '96%', speed: 'Fast' },
        { topic: 'Probability', subject: 'Mathematics', accuracy: '92%', speed: 'Optimal' }
      ],
      careless: [
        { topic: 'Aldehydes & Ketones', subject: 'Chemistry', accuracy: '70%', impact: '-3 pts leak' }
      ],
      weak: [
        { topic: 'Vector 3D', subject: 'Mathematics', accuracy: '56%', status: 'Practice Needed' }
      ]
    },
    testHistory: [
      {
        title: 'JEE Main Ultimate Full Mock #2',
        date: '2026-09-16',
        score: 256,
        max: 300,
        accuracy: '92%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 92, maxScore: 100 },
          { subject: 'Chemistry', score: 88, maxScore: 100 },
          { subject: 'Mathematics', score: 76, maxScore: 100 }
        ]
      },
      {
        title: 'JEE Main Ultimate Full Mock #1',
        date: '2026-09-09',
        score: 248,
        max: 300,
        accuracy: '90%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 89, maxScore: 100 },
          { subject: 'Chemistry', score: 86, maxScore: 100 },
          { subject: 'Mathematics', score: 73, maxScore: 100 }
        ]
      }
    ]
  },
  {
    id: 'std-10',
    rollNo: 'IK-1202',
    name: 'Meera Sundaram',
    email: 'meera.sundaram@example.com',
    classCohort: 'Class 12',
    stream: 'NEET',
    classRank: 1,
    testsAttempted: 24,
    avgScore: 668,
    maxScore: 720,
    accuracy: 94.5,
    pacingSec: 39,
    cutoffClearedRate: '100%',
    status: 'Top Ranker',
    streak: '38 Days',
    subjects: [
      { name: 'Biology', score: 348, maxScore: 360, accuracy: 97.0, avgTimePerQ: '0.7m' },
      { name: 'Chemistry', score: 168, maxScore: 180, accuracy: 93.5, avgTimePerQ: '1.1m' },
      { name: 'Physics', score: 152, maxScore: 180, accuracy: 91.0, avgTimePerQ: '1.4m' }
    ],
    topicDiagnostics: {
      strong: [
        { topic: 'Human Physiology', subject: 'Biology', accuracy: '99%', speed: 'Fast' },
        { topic: 'Biomolecules & Polymers', subject: 'Chemistry', accuracy: '96%', speed: 'Fast' },
        { topic: 'Semiconductor Electronics', subject: 'Physics', accuracy: '94%', speed: 'Optimal' }
      ],
      careless: [
        { topic: 'Optics & Wave Motion', subject: 'Physics', accuracy: '78%', impact: '-4 pts leak' }
      ],
      weak: [
        { topic: 'Coordination Compounds', subject: 'Chemistry', accuracy: '66%', status: 'Review Needed' }
      ]
    },
    testHistory: [
      {
        title: 'NEET Grand National Mock #4',
        date: '2026-09-17',
        score: 680,
        max: 720,
        accuracy: '96%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Biology', score: 352, maxScore: 360 },
          { subject: 'Chemistry', score: 172, maxScore: 180 },
          { subject: 'Physics', score: 156, maxScore: 180 }
        ]
      },
      {
        title: 'NEET Class 12 All-India Mock #2',
        date: '2026-09-08',
        score: 668,
        max: 720,
        accuracy: '94%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Biology', score: 348, maxScore: 360 },
          { subject: 'Chemistry', score: 168, maxScore: 180 },
          { subject: 'Physics', score: 152, maxScore: 180 }
        ]
      },
      {
        title: 'PCB Full Length Grand Test #1',
        date: '2026-08-26',
        score: 656,
        max: 720,
        accuracy: '93%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Biology', score: 344, maxScore: 360 },
          { subject: 'Chemistry', score: 164, maxScore: 180 },
          { subject: 'Physics', score: 148, maxScore: 180 }
        ]
      }
    ]
  },
  {
    id: 'std-6',
    rollNo: 'IK-1301',
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    classCohort: 'Dropper / Repeaters',
    stream: 'JEE',
    classRank: 1,
    testsAttempted: 28,
    avgScore: 242,
    maxScore: 300,
    accuracy: 88.0,
    pacingSec: 44,
    cutoffClearedRate: '100%',
    status: 'High Performer',
    streak: '40 Days',
    subjects: [
      { name: 'Physics', score: 82, maxScore: 100, accuracy: 89.0, avgTimePerQ: '1.5m' },
      { name: 'Chemistry', score: 88, maxScore: 100, accuracy: 92.0, avgTimePerQ: '1.1m' },
      { name: 'Mathematics', score: 72, maxScore: 100, accuracy: 83.0, avgTimePerQ: '2.0m' }
    ],
    topicDiagnostics: {
      strong: [
        { topic: 'Modern Physics', subject: 'Physics', accuracy: '95%', speed: 'Optimal' },
        { topic: 'Organic Reaction Mechanisms', subject: 'Chemistry', accuracy: '93%', speed: 'Fast' }
      ],
      careless: [
        { topic: 'Integration Techniques', subject: 'Mathematics', accuracy: '69%', impact: '-3 pts leak' }
      ],
      weak: [
        { topic: 'Optics Instruments', subject: 'Physics', accuracy: '54%', status: 'Review Needed' }
      ]
    },
    testHistory: [
      {
        title: 'JEE Main Ultimate Full Mock #2',
        date: '2026-09-16',
        score: 250,
        max: 300,
        accuracy: '90%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 85, maxScore: 100 },
          { subject: 'Chemistry', score: 89, maxScore: 100 },
          { subject: 'Mathematics', score: 76, maxScore: 100 }
        ]
      },
      {
        title: 'JEE Main Ultimate Full Mock #1',
        date: '2026-09-09',
        score: 242,
        max: 300,
        accuracy: '88%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 82, maxScore: 100 },
          { subject: 'Chemistry', score: 88, maxScore: 100 },
          { subject: 'Mathematics', score: 72, maxScore: 100 }
        ]
      },
      {
        title: 'Dropper Booster All India Test',
        date: '2026-08-28',
        score: 234,
        max: 300,
        accuracy: '86%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 78, maxScore: 100 },
          { subject: 'Chemistry', score: 84, maxScore: 100 },
          { subject: 'Mathematics', score: 72, maxScore: 100 }
        ]
      },
      {
        title: 'Physics & Chemistry Intensive Drill',
        date: '2026-08-12',
        score: 224,
        max: 300,
        accuracy: '84%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 75, maxScore: 100 },
          { subject: 'Chemistry', score: 81, maxScore: 100 },
          { subject: 'Mathematics', score: 68, maxScore: 100 }
        ]
      }
    ]
  },
  {
    id: 'std-12',
    rollNo: 'IK-1302',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    classCohort: 'Dropper / Repeaters',
    stream: 'NEET',
    classRank: 2,
    testsAttempted: 26,
    avgScore: 648,
    maxScore: 720,
    accuracy: 92.5,
    pacingSec: 41,
    cutoffClearedRate: '100%',
    status: 'Top Ranker',
    streak: '35 Days',
    subjects: [
      { name: 'Biology', score: 342, maxScore: 360, accuracy: 95.5, avgTimePerQ: '0.8m' },
      { name: 'Chemistry', score: 162, maxScore: 180, accuracy: 91.0, avgTimePerQ: '1.2m' },
      { name: 'Physics', score: 144, maxScore: 180, accuracy: 88.0, avgTimePerQ: '1.5m' }
    ],
    topicDiagnostics: {
      strong: [
        { topic: 'Genetics & Evolution', subject: 'Biology', accuracy: '97%', speed: 'Fast' },
        { topic: 'Equilibrium & Thermodynamics', subject: 'Chemistry', accuracy: '94%', speed: 'Optimal' }
      ],
      careless: [
        { topic: 'Current Electricity', subject: 'Physics', accuracy: '74%', impact: '-3 pts leak' }
      ],
      weak: [
        { topic: 'Magnetism in Matter', subject: 'Physics', accuracy: '58%', status: 'Revision Needed' }
      ]
    },
    testHistory: [
      {
        title: 'NEET Grand National Mock #4',
        date: '2026-09-17',
        score: 660,
        max: 720,
        accuracy: '94%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Biology', score: 348, maxScore: 360 },
          { subject: 'Chemistry', score: 166, maxScore: 180 },
          { subject: 'Physics', score: 146, maxScore: 180 }
        ]
      },
      {
        title: 'NEET Dropper Special Grand Mock #2',
        date: '2026-09-07',
        score: 648,
        max: 720,
        accuracy: '92%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Biology', score: 342, maxScore: 360 },
          { subject: 'Chemistry', score: 162, maxScore: 180 },
          { subject: 'Physics', score: 144, maxScore: 180 }
        ]
      },
      {
        title: 'NEET Repeater Full Sprint #1',
        date: '2026-08-25',
        score: 636,
        max: 720,
        accuracy: '91%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Biology', score: 336, maxScore: 360 },
          { subject: 'Chemistry', score: 158, maxScore: 180 },
          { subject: 'Physics', score: 142, maxScore: 180 }
        ]
      }
    ]
  },
  {
    id: 'std-13',
    rollNo: 'IK-1305',
    name: 'Abhishek Joshi',
    email: 'abhishek.joshi@example.com',
    classCohort: 'Dropper / Repeaters',
    stream: 'JEE',
    classRank: 3,
    testsAttempted: 21,
    avgScore: 228,
    maxScore: 300,
    accuracy: 84.5,
    pacingSec: 46,
    cutoffClearedRate: '95%',
    status: 'High Improver',
    streak: '22 Days',
    subjects: [
      { name: 'Physics', score: 78, maxScore: 100, accuracy: 86.0, avgTimePerQ: '1.6m' },
      { name: 'Chemistry', score: 82, maxScore: 100, accuracy: 88.5, avgTimePerQ: '1.2m' },
      { name: 'Mathematics', score: 68, maxScore: 100, accuracy: 79.0, avgTimePerQ: '2.1m' }
    ],
    topicDiagnostics: {
      strong: [
        { topic: 'Thermodynamics', subject: 'Physics', accuracy: '92%', speed: 'Optimal' },
        { topic: 'Hydrocarbons', subject: 'Chemistry', accuracy: '90%', speed: 'Fast' }
      ],
      careless: [
        { topic: 'Complex Numbers', subject: 'Mathematics', accuracy: '66%', impact: '-4 pts leak' }
      ],
      weak: [
        { topic: 'Electromagnetic Induction', subject: 'Physics', accuracy: '52%', status: 'Needs Practice' }
      ]
    },
    testHistory: [
      {
        title: 'JEE Main Ultimate Full Mock #2',
        date: '2026-09-16',
        score: 236,
        max: 300,
        accuracy: '87%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 80, maxScore: 100 },
          { subject: 'Chemistry', score: 85, maxScore: 100 },
          { subject: 'Mathematics', score: 71, maxScore: 100 }
        ]
      },
      {
        title: 'Dropper Booster All India Test',
        date: '2026-08-28',
        score: 220,
        max: 300,
        accuracy: '82%',
        cutoffCleared: true,
        status: 'Cleared',
        subjectScores: [
          { subject: 'Physics', score: 75, maxScore: 100 },
          { subject: 'Chemistry', score: 80, maxScore: 100 },
          { subject: 'Mathematics', score: 65, maxScore: 100 }
        ]
      }
    ]
  }
];

// Sample Mock Exams Database
const MOCK_EXAMS = [
  {
    id: 'exam-1',
    title: 'JEE Main Ultimate Full Mock #1',
    category: 'JEE',
    duration_minutes: 180,
    maxScore: 300,
    cutoff: 92,
    date: '2026-08-15',
    totalSubmissions: 48,
    highestScore: 288,
    avgScore: 196,
    medianScore: 192,
    cutoffClearanceRate: '87.5%',
    scoreDistribution: [
      { range: '< 90 (Below Cutoff)', count: 6, color: 'bg-rose-500/40' },
      { range: '90 - 150', count: 12, color: 'bg-amber-500/40' },
      { range: '151 - 200', count: 15, color: 'bg-primary/50' },
      { range: '201 - 250', count: 11, color: 'bg-cyan-500/60' },
      { range: '251 - 300 (Top Tier)', count: 4, color: 'bg-emerald-500/60' }
    ],
    subjectBreakdown: [
      { name: 'Physics', avgScore: 68, max: 100, accuracy: 76.5 },
      { name: 'Chemistry', avgScore: 74, max: 100, accuracy: 82.0 },
      { name: 'Mathematics', avgScore: 54, max: 100, accuracy: 64.2 }
    ],
    attendees: [
      {
        id: 'std-4',
        rollNo: '128003120',
        name: 'Tanvi Kulkarni',
        email: 'tanvi.128003@example.com',
        score: 268,
        accuracy: 95,
        timeTaken: '162m',
        rank: 1,
        percentile: '99.8 %ile',
        proctorStatus: 'CLEARED',
        timeWastage: '6m 20s',
        subjects: [
          { name: 'Physics', score: 94, max: 100, correct: 24, wrong: 1, skipped: 0 },
          { name: 'Chemistry', score: 96, max: 100, correct: 24, wrong: 1, skipped: 0 },
          { name: 'Mathematics', score: 78, max: 100, correct: 20, wrong: 3, skipped: 2 }
        ],
        questionMatrix: Array.from({ length: 30 }, (_, i) => ({
          qNum: i + 1,
          status: i === 6 || i === 18 ? 'wrong' : (i === 24 || i === 28 ? 'skipped' : 'correct'),
          studentTime: i % 2 === 0 ? '1m 15s' : '1m 40s',
          topperTime: '1m 20s',
          subject: ['Physics', 'Chemistry', 'Mathematics'][i % 3],
          topic: ['Electrostatics', 'Chemical Bonding', 'Definite Integrals'][i % 3]
        }))
      },
      {
        id: 'std-6',
        rollNo: 'IK-1301',
        name: 'Vikram Singh',
        email: 'vikram.singh@example.com',
        score: 242,
        accuracy: 88,
        timeTaken: '174m',
        rank: 2,
        percentile: '98.5 %ile',
        proctorStatus: 'CLEARED',
        timeWastage: '14m 10s',
        subjects: [
          { name: 'Physics', score: 82, max: 100, correct: 21, wrong: 3, skipped: 1 },
          { name: 'Chemistry', score: 88, max: 100, correct: 22, wrong: 2, skipped: 1 },
          { name: 'Mathematics', score: 72, max: 100, correct: 19, wrong: 4, skipped: 2 }
        ],
        questionMatrix: Array.from({ length: 30 }, (_, i) => ({
          qNum: i + 1,
          status: i % 5 === 0 ? 'wrong' : (i % 7 === 0 ? 'skipped' : 'correct'),
          studentTime: '1m 35s',
          topperTime: '1m 20s',
          subject: ['Physics', 'Chemistry', 'Mathematics'][i % 3],
          topic: ['Modern Physics', 'Equilibrium', 'Matrices'][i % 3]
        }))
      },
      {
        id: 'std-5',
        rollNo: 'IK-1205',
        name: 'Ananya Iyer',
        email: 'ananya.iyer@example.com',
        score: 218,
        accuracy: 84,
        timeTaken: '178m',
        rank: 3,
        percentile: '95.2 %ile',
        proctorStatus: 'CLEARED',
        timeWastage: '18m 40s',
        subjects: [
          { name: 'Physics', score: 74, max: 100, correct: 19, wrong: 4, skipped: 2 },
          { name: 'Chemistry', score: 82, max: 100, correct: 21, wrong: 3, skipped: 1 },
          { name: 'Mathematics', score: 62, max: 100, correct: 17, wrong: 6, skipped: 2 }
        ],
        questionMatrix: Array.from({ length: 30 }, (_, i) => ({
          qNum: i + 1,
          status: i % 4 === 0 ? 'wrong' : (i % 6 === 0 ? 'skipped' : 'correct'),
          studentTime: '1m 50s',
          topperTime: '1m 20s',
          subject: ['Physics', 'Chemistry', 'Mathematics'][i % 3],
          topic: ['Current Electricity', 'Solutions', 'Differential Equations'][i % 3]
        }))
      }
    ]
  },
  {
    id: 'exam-2',
    title: 'NEET Practice Drill #3',
    category: 'NEET',
    duration_minutes: 200,
    maxScore: 720,
    cutoff: 137,
    date: '2026-08-12',
    totalSubmissions: 34,
    highestScore: 685,
    avgScore: 540,
    medianScore: 535,
    cutoffClearanceRate: '94.1%',
    scoreDistribution: [
      { range: '< 200 (Below Benchmark)', count: 2, color: 'bg-rose-500/40' },
      { range: '200 - 450', count: 7, color: 'bg-amber-500/40' },
      { range: '451 - 580', count: 14, color: 'bg-primary/50' },
      { range: '581 - 650', count: 8, color: 'bg-cyan-500/60' },
      { range: '651 - 720 (Top Ranks)', count: 3, color: 'bg-emerald-500/60' }
    ],
    subjectBreakdown: [
      { name: 'Biology', avgScore: 295, max: 360, accuracy: 86.4 },
      { name: 'Chemistry', avgScore: 134, max: 180, accuracy: 78.5 },
      { name: 'Physics', avgScore: 111, max: 180, accuracy: 69.2 }
    ],
    attendees: [
      {
        id: 'std-2',
        rollNo: 'IK-1102',
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        score: 628,
        accuracy: 89,
        timeTaken: '185m',
        rank: 1,
        percentile: '98.9 %ile',
        proctorStatus: 'CLEARED',
        timeWastage: '12m 30s',
        subjects: [
          { name: 'Biology', score: 334, max: 360, correct: 84, wrong: 5, skipped: 1 },
          { name: 'Chemistry', score: 156, max: 180, correct: 40, wrong: 4, skipped: 1 },
          { name: 'Physics', score: 138, max: 180, correct: 36, wrong: 6, skipped: 3 }
        ],
        questionMatrix: Array.from({ length: 30 }, (_, i) => ({
          qNum: i + 1,
          status: i % 7 === 0 ? 'wrong' : (i % 9 === 0 ? 'skipped' : 'correct'),
          studentTime: '1m 10s',
          topperTime: '1m 05s',
          subject: ['Biology', 'Chemistry', 'Physics'][i % 3],
          topic: ['Cell Biology', 'Chemical Bonding', 'Kinematics'][i % 3]
        }))
      }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────
// ── COMPONENT: Student Subject Marks Progression Line Graph ─────
// ─────────────────────────────────────────────────────────────────
const SUBJECT_THEME = {
  Physics: {
    stroke: '#38bdf8', // sky-400
    halo: 'rgba(56, 189, 248, 0.35)',
    fillGradient: 'url(#gradPhysics)',
    bg: 'bg-sky-400',
    border: 'border-sky-400/50',
    text: 'text-sky-400',
    badgeBg: 'bg-sky-950/60'
  },
  Chemistry: {
    stroke: '#c084fc', // purple-400
    halo: 'rgba(192, 132, 252, 0.35)',
    fillGradient: 'url(#gradChemistry)',
    bg: 'bg-purple-400',
    border: 'border-purple-400/50',
    text: 'text-purple-400',
    badgeBg: 'bg-purple-950/60'
  },
  Mathematics: {
    stroke: '#34d399', // emerald-400
    halo: 'rgba(52, 211, 153, 0.35)',
    fillGradient: 'url(#gradMath)',
    bg: 'bg-emerald-400',
    border: 'border-emerald-400/50',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/60'
  },
  Biology: {
    stroke: '#fbbf24', // amber-400
    halo: 'rgba(251, 191, 36, 0.35)',
    fillGradient: 'url(#gradBio)',
    bg: 'bg-amber-400',
    border: 'border-amber-400/50',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-950/60'
  }
};

function StudentSubjectMarksLineGraph({ student }) {
  // Timeframe toggle: '7' (1 Week), '30' (1 Month), '60' (2 Months)
  const [timeRange, setTimeRange] = useState('30');
  const [hiddenSubjects, setHiddenSubjects] = useState(new Set());
  const [hoveredExamIdx, setHoveredExamIdx] = useState(null);

  // Platform reference timestamp: dynamic current date (with fallback to platform date)
  const REFERENCE_DATE = useMemo(() => new Date(), []);
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // Filter exams by selected time window, sorted chronologically (earliest to latest)
  const filteredExams = useMemo(() => {
    if (!student?.testHistory || student.testHistory.length === 0) return [];
    const sorted = [...student.testHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (timeRange === '7') {
      const cutoff = new Date(REFERENCE_DATE.getTime() - 7 * MS_PER_DAY);
      return sorted.filter(t => new Date(t.date) >= cutoff);
    } else if (timeRange === '30') {
      const cutoff = new Date(REFERENCE_DATE.getTime() - 30 * MS_PER_DAY);
      return sorted.filter(t => new Date(t.date) >= cutoff);
    } else if (timeRange === '60') {
      const cutoff = new Date(REFERENCE_DATE.getTime() - 60 * MS_PER_DAY);
      return sorted.filter(t => new Date(t.date) >= cutoff);
    }
    return sorted;
  }, [student, timeRange, REFERENCE_DATE, MS_PER_DAY]);

  // Extract all distinct subjects represented in these tests
  const subjectsList = useMemo(() => {
    const set = new Set();
    filteredExams.forEach(e => {
      if (e.subjectScores && e.subjectScores.length > 0) {
        e.subjectScores.forEach(s => set.add(s.subject));
      }
    });
    if (set.size === 0 && student?.subjects) {
      student.subjects.forEach(s => set.add(s.name));
    }
    return Array.from(set);
  }, [filteredExams, student]);

  // Determine maximum subject score across current exams to scale Y axis accurately
  const maxSubjectScore = useMemo(() => {
    let max = 100;
    filteredExams.forEach(e => {
      e.subjectScores?.forEach(s => {
        if (s.maxScore && s.maxScore > max) max = s.maxScore;
        if (s.score && s.score > max) max = s.score;
      });
    });
    return max;
  }, [filteredExams]);

  // Chart dimensions & padding
  const svgWidth = 780;
  const svgHeight = 280;
  const padding = { top: 35, right: 40, bottom: 50, left: 55 };
  const plotW = svgWidth - padding.left - padding.right;
  const plotH = svgHeight - padding.top - padding.bottom;

  // Coordinate mapping
  const getX = (index) => {
    if (filteredExams.length <= 1) return padding.left + plotW / 2;
    return padding.left + (index / (filteredExams.length - 1)) * plotW;
  };

  const getY = (scoreVal) => {
    const clamped = Math.max(0, Math.min(scoreVal, maxSubjectScore));
    return padding.top + plotH - (clamped / maxSubjectScore) * plotH;
  };

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(ratio => Math.round(ratio * maxSubjectScore));

  // Build line path & points for each subject
  const subjectSeries = useMemo(() => {
    return subjectsList.map((subjName) => {
      const theme = SUBJECT_THEME[subjName] || {
        stroke: '#38bdf8',
        halo: 'rgba(56, 189, 248, 0.35)',
        bg: 'bg-sky-400',
        border: 'border-sky-400/50',
        text: 'text-sky-400',
        badgeBg: 'bg-sky-950/60'
      };

      const points = filteredExams.map((exam, idx) => {
        const scoreItem = exam.subjectScores?.find(s => s.subject === subjName);
        const score = scoreItem ? scoreItem.score : 0;
        const max = scoreItem ? scoreItem.maxScore : 100;
        return {
          x: getX(idx),
          y: getY(score),
          score,
          maxScore: max,
          exam,
          idx,
          subject: subjName
        };
      });

      // SVG path definition
      let pathD = '';
      if (points.length === 1) {
        pathD = `M ${points[0].x} ${points[0].y}`;
      } else if (points.length > 1) {
        pathD = points.reduce((acc, pt, i) => {
          if (i === 0) return `M ${pt.x} ${pt.y}`;
          const prev = points[i - 1];
          const cp1x = prev.x + (pt.x - prev.x) / 2;
          const cp1y = prev.y;
          const cp2x = prev.x + (pt.x - prev.x) / 2;
          const cp2y = pt.y;
          return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
        }, '');
      }

      return {
        name: subjName,
        theme,
        points,
        pathD
      };
    });
  }, [subjectsList, filteredExams, maxSubjectScore]);

  // Compute key insights over the 30-day window
  const insights = useMemo(() => {
    if (filteredExams.length === 0 || subjectsList.length === 0) return null;

    // 1. Highest average subject in this period
    let highestAvgSubj = null;
    let highestAvgVal = -1;

    // 2. Greatest improvement from first to last exam
    let greatestImprover = null;
    let greatestGain = -999;

    subjectsList.forEach(subj => {
      let total = 0;
      let count = 0;
      const scores = [];

      filteredExams.forEach(e => {
        const item = e.subjectScores?.find(s => s.subject === subj);
        if (item) {
          total += item.score;
          count++;
          scores.push(item.score);
        }
      });

      const avg = count > 0 ? total / count : 0;
      if (avg > highestAvgVal) {
        highestAvgVal = avg;
        highestAvgSubj = subj;
      }

      if (scores.length >= 2) {
        const gain = scores[scores.length - 1] - scores[0];
        if (gain > greatestGain) {
          greatestGain = gain;
          greatestImprover = { subject: subj, gain };
        }
      }
    });

    const latestExam = filteredExams[filteredExams.length - 1];

    return {
      highestAvgSubj,
      highestAvgVal: Math.round(highestAvgVal),
      greatestImprover,
      latestExam
    };
  }, [filteredExams, subjectsList]);

  // Toggle visibility of a subject line
  const toggleSubject = (subj) => {
    setHiddenSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subj)) {
        next.delete(subj);
      } else {
        // Prevent hiding all subjects
        if (next.size < subjectsList.length - 1) {
          next.add(subj);
        }
      }
      return next;
    });
  };

  const activeExam = hoveredExamIdx !== null ? filteredExams[hoveredExamIdx] : (filteredExams[filteredExams.length - 1] || null);

  return (
    <div className="bg-[#060913]/70 border border-slate-900/80 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden">
      
      {/* Background subtle radial ambient glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-900/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {timeRange === '7' ? '1 Week Trend' : timeRange === '60' ? '2 Months Trend' : '1 Month Trend'}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {timeRange === '7' ? 'Past 7 Days' : timeRange === '60' ? 'Past 60 Days' : 'Past 30 Days'}
            </span>
          </div>
          <h3 className="font-headline font-black text-xl md:text-2xl text-slate-100 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-cyan-400 text-2xl">trending_up</span>
            Subject Marks Trajectory in Recent Exams
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Tracking individual subject marks for <strong className="text-slate-200">{student.name}</strong> ({student.rollNo}) across all exams attended in the {timeRange === '7' ? 'past 1 week' : timeRange === '60' ? 'past 2 months' : 'past 1 month'}.
          </p>
        </div>

        {/* Time Horizon Filter & Attendance Count */}
        <div className="flex items-center gap-3 flex-wrap self-end lg:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Exams Attended</span>
            <span className="text-sm font-black text-cyan-400 font-mono">
              {filteredExams.length} {filteredExams.length === 1 ? 'Test' : 'Tests'}
            </span>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => setTimeRange('7')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === '7'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1 Week
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === '30'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1 Month
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('60')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === '60'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2 Months
            </button>
          </div>
        </div>
      </div>

      {/* Subject Toggles & Interactive Legend */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-slate-500">layers</span>
            Subjects:
          </span>
          {subjectsList.map(subj => {
            const isHidden = hiddenSubjects.has(subj);
            const theme = SUBJECT_THEME[subj] || { stroke: '#38bdf8', bg: 'bg-sky-400', text: 'text-sky-400', border: 'border-sky-400/40' };
            return (
              <button
                key={subj}
                type="button"
                onClick={() => toggleSubject(subj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                  isHidden
                    ? 'bg-slate-950/40 border-slate-900 text-slate-600 line-through opacity-60'
                    : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700 shadow-sm'
                }`}
                title={isHidden ? `Click to show ${subj}` : `Click to hide ${subj}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full transition-transform"
                  style={{ backgroundColor: isHidden ? '#475569' : theme.stroke }}
                />
                <span>{subj}</span>
                <span className="text-[10px] font-mono font-normal text-slate-500">
                  {student.subjects?.find(s => s.name === subj)?.maxScore ? `/ ${student.subjects.find(s => s.name === subj).maxScore}m` : ''}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xs text-cyan-400">touch_app</span>
          <span>Hover data points to inspect detailed score breakdown</span>
        </div>
      </div>

      {/* Main Interactive Line Chart */}
      {filteredExams.length === 0 ? (
        <div className="p-12 text-center bg-slate-950/40 border border-dashed border-slate-900 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">query_stats</span>
          <h4 className="text-slate-300 font-bold text-sm">No Exams Recorded in Selected Period</h4>
          <p className="text-xs text-slate-500 mt-1">
            This student has not attempted any tests within the selected timeframe.
          </p>
          <button
            type="button"
            onClick={() => setTimeRange('60')}
            className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-800/40 rounded-xl text-xs font-bold cursor-pointer"
          >
            Switch to 2 Months
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* SVG Canvas Container */}
          <div className="w-full overflow-x-auto select-none">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-h-[260px] max-h-[340px]"
              preserveAspectRatio="xMidYMid meet"
              onMouseLeave={() => setHoveredExamIdx(null)}
            >
              <defs>
                {/* Glow Filter for High-Def Cyber Effect */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Subtle linear gradients for area under lines */}
                <linearGradient id="gradPhysics" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradChemistry" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradMath" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradBio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Background Horizontal Grid Lines & Y-Axis Labels */}
              {yTicks.map((val) => {
                const y = getY(val);
                return (
                  <g key={val}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 12}
                      y={y + 4}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Y Axis Title */}
              <text
                x={12}
                y={padding.top - 14}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="start"
              >
                MARKS (PTS)
              </text>

              {/* Vertical Columns / Date Guides on X Axis */}
              {filteredExams.map((exam, idx) => {
                const x = getX(idx);
                const isHovered = hoveredExamIdx === idx;
                const dateObj = new Date(exam.date);
                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <g key={idx}>
                    {/* Vertical guideline */}
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + plotH}
                      stroke={isHovered ? '#38bdf8' : '#1e293b'}
                      strokeWidth={isHovered ? '1.5' : '1'}
                      strokeDasharray={isHovered ? 'none' : '2 2'}
                      opacity={isHovered ? '0.8' : '0.5'}
                    />

                    {/* Date label at bottom */}
                    <text
                      x={x}
                      y={padding.top + plotH + 20}
                      textAnchor="middle"
                      fill={isHovered ? '#38bdf8' : '#94a3b8'}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight={isHovered ? 'bold' : 'normal'}
                    >
                      {formattedDate}
                    </text>

                    {/* Exam Title snippet */}
                    <text
                      x={x}
                      y={padding.top + plotH + 34}
                      textAnchor="middle"
                      fill={isHovered ? '#f1f5f9' : '#475569'}
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {exam.title.length > 14 ? exam.title.slice(0, 12) + '…' : exam.title}
                    </text>

                    {/* Transparent hover capture zone */}
                    <rect
                      x={x - (plotW / (filteredExams.length || 1)) / 2}
                      y={padding.top}
                      width={plotW / (filteredExams.length || 1)}
                      height={plotH + 45}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredExamIdx(idx)}
                    />
                  </g>
                );
              })}

              {/* Render Polylines for each visible subject */}
              {subjectSeries.map((series) => {
                if (hiddenSubjects.has(series.name)) return null;

                return (
                  <g key={series.name}>
                    {/* Glowing outer blur line */}
                    <path
                      d={series.pathD}
                      fill="none"
                      stroke={series.theme.stroke}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.25"
                    />

                    {/* Main crisp line */}
                    <path
                      d={series.pathD}
                      fill="none"
                      stroke={series.theme.stroke}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data Points on each exam */}
                    {series.points.map((pt) => {
                      const isHovered = hoveredExamIdx === pt.idx;
                      return (
                        <g key={pt.idx} className="cursor-pointer" onMouseEnter={() => setHoveredExamIdx(pt.idx)}>
                          {/* Outer halo when active */}
                          {isHovered && (
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="10"
                              fill={series.theme.stroke}
                              opacity="0.3"
                              className="animate-ping"
                            />
                          )}

                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? '6' : '4'}
                            fill={isHovered ? '#020617' : series.theme.stroke}
                            stroke={isHovered ? series.theme.stroke : '#0f172a'}
                            strokeWidth={isHovered ? '3' : '2'}
                            className="transition-all duration-200"
                          />

                          {/* Data label on hovered point */}
                          {isHovered && (
                            <text
                              x={pt.x}
                              y={pt.y - 12}
                              textAnchor="middle"
                              fill={series.theme.stroke}
                              fontSize="11"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              {pt.score}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Inspection Card when hovering over an exam */}
          {activeExam && (
            <div className="mt-4 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2 py-0.5 rounded bg-primary/20 text-cyan-300 border border-primary/30 text-[10px] font-mono font-bold">
                    {hoveredExamIdx !== null ? `Exam #${hoveredExamIdx + 1}` : 'Latest Attempt'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {activeExam.date}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    activeExam.cutoffCleared
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                      : 'bg-rose-950/60 text-rose-400 border-rose-800/40'
                  }`}>
                    {activeExam.status}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-100">
                  {activeExam.title}
                </h4>
              </div>

              {/* Subject scores breakdown pills */}
              <div className="flex items-center gap-3 flex-wrap">
                {activeExam.subjectScores?.map((s) => {
                  const theme = SUBJECT_THEME[s.subject] || { stroke: '#38bdf8', text: 'text-sky-400', badgeBg: 'bg-sky-950/60' };
                  const isHidden = hiddenSubjects.has(s.subject);
                  return (
                    <div
                      key={s.subject}
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
                        isHidden
                          ? 'opacity-40 bg-slate-900 border-slate-800'
                          : `${theme.badgeBg} border-slate-800/80`
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.stroke }} />
                      <span className="text-xs font-bold text-slate-200">{s.subject}:</span>
                      <span className={`text-xs font-mono font-black ${theme.text}`}>
                        {s.score} <span className="text-[10px] text-slate-500 font-normal">/ {s.maxScore}</span>
                      </span>
                    </div>
                  );
                })}

                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">Total</span>
                  <span className="text-xs font-mono font-black text-slate-100">
                    {activeExam.score} / {activeExam.max}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 30-Day Intelligence Badges */}
      {insights && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-900/80">
          <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400 shrink-0">
              <span className="material-symbols-outlined text-lg">star</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Top Scoring Subject</span>
              <span className="text-xs font-bold text-slate-200 truncate block">
                {insights.highestAvgSubj} ({insights.highestAvgVal} pts avg)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
              <span className="material-symbols-outlined text-lg">flight_takeoff</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Highest 30-Day Gain</span>
              <span className="text-xs font-bold text-emerald-400 truncate block">
                {insights.greatestImprover
                  ? `${insights.greatestImprover.subject} (+${insights.greatestImprover.gain} pts)`
                  : 'Consistent Track'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 shrink-0">
              <span className="material-symbols-outlined text-lg">pace</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Latest Exam Result</span>
              <span className="text-xs font-bold text-slate-200 truncate block">
                {insights.latestExam ? `${insights.latestExam.score} / ${insights.latestExam.max} (${insights.latestExam.accuracy})` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function StudentAnalyticsWorkspace({ adminTests = [] }) {
  // ── Primary Category: 'class' or 'exam' ──
  const [primaryCategory, setPrimaryCategory] = useState('class');

  // ── Category 1: Class State ──
  const [selectedClass, setSelectedClass] = useState('All Classes'); // 'Class 11', 'Class 12', 'Dropper / Repeaters', 'All Classes'
  const [classViewMode, setClassViewMode] = useState('individual'); // 'individual' | 'cohort'
  const [classStudentSearch, setClassStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // ── Category 2: Exam State ──
  const [selectedExamId, setSelectedExamId] = useState('');
  const [examViewMode, setExamViewMode] = useState('individual'); // 'individual' | 'overview'
  const [examStudentSearch, setExamStudentSearch] = useState('');
  const [selectedExamStudentId, setSelectedExamStudentId] = useState('');

  // Selected question in individual exam matrix
  const [inspectedQuestion, setInspectedQuestion] = useState(null);

  // ── Live Database Analytics State ──
  const [liveStudents, setLiveStudents] = useState([]);
  const [liveExams, setLiveExams] = useState([]);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [liveDataActive, setLiveDataActive] = useState(false);

  const fetchLiveAnalytics = async () => {
    setIsLoadingLive(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/student-analytics`);
      if (res.data?.success) {
        if (res.data.students && res.data.students.length > 0) {
          setLiveStudents(res.data.students);
          // Auto-select student with attempts or first student
          const topStudent = res.data.students.find(s => s.testsAttempted > 0) || res.data.students[0];
          setSelectedStudentId(prev => prev && res.data.students.some(s => s.id === prev) ? prev : topStudent.id);
        }
        if (res.data.exams && res.data.exams.length > 0) {
          setLiveExams(res.data.exams);
          // Auto-select exam with submissions or first exam
          const topExam = res.data.exams.find(e => e.totalSubmissions > 0) || res.data.exams[0];
          setSelectedExamId(prev => prev && res.data.exams.some(e => e.id === prev) ? prev : topExam.id);
        }
        setLiveDataActive(true);
      }
    } catch (err) {
      console.warn("Live analytics fetch error, keeping fallback data:", err.message);
      setLiveDataActive(false);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveAnalytics();
  }, []);

  // ── Resolve All Students: Merges Live DB accounts with rich demo students for comprehensive evaluation ──
  const allStudents = useMemo(() => {
    const liveList = liveStudents || [];
    const liveIds = new Set(liveList.map(s => s.id));
    const demoList = MOCK_STUDENTS.filter(m => !liveIds.has(m.id));
    return [...liveList, ...demoList];
  }, [liveStudents]);

  // ── Resolve All Exams: Merges Live DB tests with rich demo exams ──
  const allExams = useMemo(() => {
    const liveList = liveExams || [];
    const liveIds = new Set(liveList.map(e => e.id));
    const demoList = MOCK_EXAMS.filter(m => !liveIds.has(m.id));
    return [...liveList, ...demoList];
  }, [liveExams]);

  // Active Exam Object
  const currentExam = useMemo(() => {
    const found = allExams.find(e => e.id === selectedExamId);
    return found || allExams[0];
  }, [allExams, selectedExamId]);

  // Filtered Students for selected Class
  const classStudents = useMemo(() => {
    if (selectedClass === 'All Classes') return allStudents;
    const filtered = allStudents.filter(s => s.classCohort === selectedClass);
    return filtered.length > 0 ? filtered : allStudents;
  }, [selectedClass, allStudents]);

  // Active Individual Student for Class Category
  const currentClassStudent = useMemo(() => {
    const found = classStudents.find(s => s.id === selectedStudentId);
    return found || classStudents[0] || allStudents[0] || MOCK_STUDENTS[0];
  }, [classStudents, selectedStudentId, allStudents]);

  // Filtered Attendees for Exam Category
  const examAttendees = useMemo(() => {
    return currentExam?.attendees || [];
  }, [currentExam]);

  // Active Individual Student for Exam Category
  const currentExamStudent = useMemo(() => {
    const found = examAttendees.find(a => a.id === selectedExamStudentId);
    return found || examAttendees[0] || null;
  }, [examAttendees, selectedExamStudentId]);

  // Autocomplete matching for Class student search
  const classSearchMatches = useMemo(() => {
    if (!classStudentSearch.trim()) return [];
    const q = classStudentSearch.toLowerCase().trim();
    return classStudents.filter(s =>
      s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
    );
  }, [classStudents, classStudentSearch]);

  // Autocomplete matching for Exam student search
  const examSearchMatches = useMemo(() => {
    if (!examStudentSearch.trim()) return [];
    const q = examStudentSearch.toLowerCase().trim();
    return examAttendees.filter(a =>
      a.name.toLowerCase().includes(q) || a.rollNo.toLowerCase().includes(q)
    );
  }, [examAttendees, examStudentSearch]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── 1. Top Bar & Primary Category Selector ── */}
      <div className="bg-[#060913]/60 border border-slate-900/60 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono font-black uppercase tracking-widest">
              Performance Intelligence
            </span>
            {liveDataActive ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/50 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Database Active ({allStudents.length} Students • {allExams.length} Exams)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-800/50 text-amber-400 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Offline Mode
              </span>
            )}
            <button
              type="button"
              onClick={fetchLiveAnalytics}
              disabled={isLoadingLive}
              className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              title="Refresh Live Data from Database"
            >
              <span className={`material-symbols-outlined text-[13px] ${isLoadingLive ? 'animate-spin' : ''}`}>sync</span>
              {isLoadingLive ? 'Syncing...' : 'Sync Live'}
            </button>
          </div>
          <h2 className="font-headline font-black text-2xl md:text-3xl text-slate-100">
            Student Analytics Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Toggle between longitudinal <strong className="text-slate-200">Class Cohort diagnostics</strong> and granular <strong className="text-slate-200">Exam-Specific breakdown</strong> with individual student drill-down.
          </p>
        </div>

        {/* Primary Toggle: 'class' vs 'exam' */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner shrink-0">
          <button
            type="button"
            onClick={() => setPrimaryCategory('class')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              primaryCategory === 'class'
                ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-102'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span className="material-symbols-outlined text-base">school</span>
            <span>Class Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setPrimaryCategory('exam')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              primaryCategory === 'exam'
                ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-102'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span className="material-symbols-outlined text-base">assignment</span>
            <span>Exam Analytics</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ── CATEGORY 1: CLASS ANALYTICS ────────────────────────────────── */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {primaryCategory === 'class' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Class Filters & Mode Switcher Bar */}
          <div className="bg-[#060913]/60 border border-slate-900/60 p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-cyan-400">tune</span>
                Select Class:
              </span>
              {['Class 11', 'Class 12', 'Dropper / Repeaters', 'All Classes'].map((cls) => (
                <button
                  key={cls}
                  onClick={() => {
                    setSelectedClass(cls);
                    setClassStudentSearch('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedClass === cls
                      ? 'bg-cyan-950/40 border-cyan-700/50 text-cyan-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>

            {/* View Mode: Individual vs Entire Class */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-end lg:self-auto">
              <button
                onClick={() => setClassViewMode('individual')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  classViewMode === 'individual'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">person</span>
                Individual Student Analysis
              </button>
              <button
                onClick={() => setClassViewMode('cohort')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  classViewMode === 'cohort'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">groups</span>
                Entire Class Overview
              </button>
            </div>
          </div>

          {/* ── Sub-View A: Individual Student Analysis in Class ── */}
          {classViewMode === 'individual' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Dual-Lookup Student Selector (Name or Roll No) */}
              <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-headline font-bold text-lg text-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">person_search</span>
                      Select Student (by Name or Roll No)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Type the student's name or roll number, or pick from the roster list.
                    </p>
                  </div>

                  {/* Student Switcher Shortcuts */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500 mr-1">
                      {classStudents.findIndex(s => s.id === currentClassStudent.id) + 1} of {classStudents.length}
                    </span>
                    <button
                      onClick={() => {
                        const idx = classStudents.findIndex(s => s.id === currentClassStudent.id);
                        if (idx > 0) setSelectedStudentId(classStudents[idx - 1].id);
                      }}
                      disabled={classStudents.findIndex(s => s.id === currentClassStudent.id) === 0}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Previous Student"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <button
                      onClick={() => {
                        const idx = classStudents.findIndex(s => s.id === currentClassStudent.id);
                        if (idx < classStudents.length - 1) setSelectedStudentId(classStudents[idx + 1].id);
                      }}
                      disabled={classStudents.findIndex(s => s.id === currentClassStudent.id) === classStudents.length - 1}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Next Student"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>

                {/* Search / Select Autocomplete Box */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search by student name (e.g. Aryan, Tanvi) or Roll No (e.g. IK-1101, 128003120)..."
                      value={classStudentSearch}
                      onChange={(e) => setClassStudentSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary font-mono transition-all"
                    />

                    {/* Autocomplete Dropdown */}
                    {classStudentSearch.trim() && classSearchMatches.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-900">
                        {classSearchMatches.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setSelectedStudentId(s.id);
                              setClassStudentSearch('');
                            }}
                            className="p-3 hover:bg-slate-900 flex justify-between items-center cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 rounded bg-primary/20 text-cyan-300 border border-primary/30 font-mono text-[10px] font-bold">
                                {s.rollNo}
                              </span>
                              <span className="font-bold text-xs text-slate-200">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono uppercase">{s.classCohort}</span>
                              <span className="text-[10px] text-emerald-400 font-bold">{s.accuracy}% Acc</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Direct Dropdown Picker */}
                  <div className="md:col-span-4">
                    <select
                      value={currentClassStudent?.id || ''}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
                    >
                      {classStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.rollNo} — {s.name} ({s.classCohort})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Individual Student Performance Blueprint */}
              {currentClassStudent && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  
                  {/* Student Identity Card */}
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#060913] border border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-cyan-500/20 border border-primary/40 flex items-center justify-center font-headline font-black text-xl text-cyan-300 shadow-md">
                        {currentClassStudent.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2.5 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                            Roll No: {currentClassStudent.rollNo}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase">
                            {currentClassStudent.classCohort} • {currentClassStudent.stream}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold">
                            {currentClassStudent.status}
                          </span>
                        </div>
                        <h3 className="font-headline font-black text-2xl text-slate-100">
                          {currentClassStudent.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {currentClassStudent.email} • Streak: {currentClassStudent.streak}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="px-5 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-right">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Class Rank</span>
                        <span className="text-2xl font-black text-primary font-headline">#{currentClassStudent.classRank}</span>
                        <span className="text-[10px] text-slate-400 block font-semibold">in {currentClassStudent.classCohort}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Performance Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono font-bold uppercase text-slate-400">
                        <span>Tests Completed</span>
                        <span className="material-symbols-outlined text-cyan-400 text-lg">history_edu</span>
                      </div>
                      <h4 className="text-3xl font-black text-slate-100">{currentClassStudent.testsAttempted}</h4>
                      <p className="text-[11px] text-emerald-400 font-bold">100% Attendance Rate</p>
                    </div>

                    <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono font-bold uppercase text-slate-400">
                        <span>Average Score</span>
                        <span className="material-symbols-outlined text-purple-400 text-lg">score</span>
                      </div>
                      <h4 className="text-3xl font-black text-slate-100">
                        {currentClassStudent.avgScore} <span className="text-sm font-medium text-slate-500">/ {currentClassStudent.maxScore}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {((currentClassStudent.avgScore / currentClassStudent.maxScore) * 100).toFixed(1)}% Marks Avg
                      </p>
                    </div>

                    <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono font-bold uppercase text-slate-400">
                        <span>Overall Accuracy</span>
                        <span className="material-symbols-outlined text-emerald-400 text-lg">target</span>
                      </div>
                      <h4 className="text-3xl font-black text-slate-100">{currentClassStudent.accuracy}%</h4>
                      <p className="text-[11px] text-emerald-400 font-bold">Cutoff Clearance: {currentClassStudent.cutoffClearedRate}</p>
                    </div>

                    <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono font-bold uppercase text-slate-400">
                        <span>Average Pacing</span>
                        <span className="material-symbols-outlined text-amber-400 text-lg">speed</span>
                      </div>
                      <h4 className="text-3xl font-black text-slate-100">{currentClassStudent.pacingSec}s</h4>
                      <p className="text-[11px] text-slate-400">Per question optimal velocity</p>
                    </div>
                  </div>

                  {/* ── 30-Day Subject Marks Progression Line Graph ── */}
                  <StudentSubjectMarksLineGraph student={currentClassStudent} />

                  {/* Subject Breakdown & Topic Heatmap */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Subject Breakdown */}
                    <div className="lg:col-span-5 bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl shadow-xl space-y-5">
                      <h4 className="font-headline font-bold text-base text-slate-200 flex items-center gap-2 border-b border-slate-900/60 pb-3">
                        <span className="material-symbols-outlined text-primary text-xl">pie_chart</span>
                        Subject Mastery Progression
                      </h4>

                      <div className="space-y-4">
                        {currentClassStudent.subjects.map((sub, idx) => (
                          <div key={idx} className="bg-slate-950/70 p-4 rounded-xl border border-slate-900 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs text-slate-200">{sub.name}</span>
                              <span className="text-xs font-mono font-bold text-cyan-300">
                                {sub.score} / {sub.maxScore} pts ({sub.accuracy}%)
                              </span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-700"
                                style={{ width: `${sub.accuracy}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>Pacing: {sub.avgTimePerQ} / Q</span>
                              <span className="text-emerald-400">Mastery Level: Advanced</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Topic Diagnostics: Strong vs Careless vs Weak */}
                    <div className="lg:col-span-7 bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl shadow-xl space-y-5">
                      <h4 className="font-headline font-bold text-base text-slate-200 flex items-center gap-2 border-b border-slate-900/60 pb-3">
                        <span className="material-symbols-outlined text-amber-400 text-xl">psychology</span>
                        Topic Diagnostic Matrix (For {currentClassStudent.name})
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Strong */}
                        <div className="bg-emerald-950/20 border border-emerald-800/30 p-4 rounded-xl space-y-3">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-emerald-800/20 pb-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Strong Topics
                          </span>
                          <div className="space-y-2">
                            {currentClassStudent.topicDiagnostics.strong.map((item, i) => (
                              <div key={i} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                                <p className="font-bold text-slate-200 truncate">{item.topic}</p>
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                  <span>{item.subject}</span>
                                  <span className="text-emerald-400 font-bold">{item.accuracy}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Careless */}
                        <div className="bg-amber-950/20 border border-amber-800/30 p-4 rounded-xl space-y-3">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-800/20 pb-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Careless Leaks
                          </span>
                          <div className="space-y-2">
                            {currentClassStudent.topicDiagnostics.careless.map((item, i) => (
                              <div key={i} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                                <p className="font-bold text-slate-200 truncate">{item.topic}</p>
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                  <span>{item.subject}</span>
                                  <span className="text-amber-400 font-bold">{item.impact}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Weak */}
                        <div className="bg-rose-950/20 border border-rose-800/30 p-4 rounded-xl space-y-3">
                          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-rose-800/20 pb-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            Needs Revision
                          </span>
                          <div className="space-y-2">
                            {currentClassStudent.topicDiagnostics.weak.map((item, i) => (
                              <div key={i} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                                <p className="font-bold text-slate-200 truncate">{item.topic}</p>
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                  <span>{item.subject}</span>
                                  <span className="text-rose-400 font-bold">{item.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test Attempt History Table */}
                  <div className="bg-[#060913]/60 border border-slate-900/60 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-900/60 flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <h4 className="font-headline font-bold text-base text-slate-200 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-xl">checklist</span>
                          Test Attempt History for {currentClassStudent.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Chronological log of exam submissions, individual subject scores, and cutoff validations.
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-300">
                        {currentClassStudent.testHistory.length} Test Attempts Recorded
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-900/80 bg-slate-950/40 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                            <th className="p-4">Exam Blueprint Title</th>
                            <th className="p-4">Attempt Date</th>
                            <th className="p-4">Total Score</th>
                            <th className="p-4">Subject Marks Breakdown</th>
                            <th className="p-4">Accuracy</th>
                            <th className="p-4">Cutoff Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                          {currentClassStudent.testHistory.map((t, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                              <td className="p-4 font-bold text-slate-100">{t.title}</td>
                              <td className="p-4 font-mono text-slate-400">{t.date}</td>
                              <td className="p-4 font-mono font-bold text-cyan-400">
                                {t.score} <span className="text-slate-500 font-normal">/ {t.max}</span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {t.subjectScores && t.subjectScores.length > 0 ? (
                                    t.subjectScores.map((s, sIdx) => {
                                      const theme = SUBJECT_THEME[s.subject] || { stroke: '#38bdf8', text: 'text-sky-400' };
                                      return (
                                        <span
                                          key={sIdx}
                                          className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono flex items-center gap-1"
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.stroke }} />
                                          <span className="text-slate-400">{s.subject.slice(0, 4)}:</span>
                                          <span className={`font-bold ${theme.text}`}>{s.score}</span>
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-[10px] text-slate-500">Aggregate</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 font-mono">{t.accuracy}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                  t.cutoffCleared
                                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                                    : 'bg-rose-950/60 text-rose-400 border-rose-800/40'
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Sub-View B: Entire Class as a Whole ── */}
          {classViewMode === 'cohort' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Cohort Overview Bento Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Class Roster Size</span>
                  <h4 className="text-3xl font-black text-slate-100">{classStudents.length} Students</h4>
                  <p className="text-[11px] text-emerald-400 font-bold">100% Active in {selectedClass}</p>
                </div>
                <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Class Average Score</span>
                  <h4 className="text-3xl font-black text-slate-100">
                    {Math.round(classStudents.reduce((a, b) => a + b.avgScore, 0) / classStudents.length)} pts
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">+4.2% vs previous session</p>
                </div>
                <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Cohort Mean Accuracy</span>
                  <h4 className="text-3xl font-black text-slate-100">
                    {(classStudents.reduce((a, b) => a + b.accuracy, 0) / classStudents.length).toFixed(1)}%
                  </h4>
                  <p className="text-[11px] text-cyan-400 font-bold">High Precision Tier</p>
                </div>
                <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Mean Pacing</span>
                  <h4 className="text-3xl font-black text-slate-100">
                    {Math.round(classStudents.reduce((a, b) => a + b.pacingSec, 0) / classStudents.length)}s
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">Benchmark: 60s per Q</p>
                </div>
              </div>

              {/* Class Student Roster Table */}
              <div className="bg-[#060913]/60 border border-slate-900/60 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-900/60 flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h3 className="font-headline font-bold text-lg text-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">groups</span>
                      {selectedClass} Student Performance Roster
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click any student row to immediately inspect their detailed individual diagnostics.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900/80 bg-slate-950/40 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <th className="p-4">Rank</th>
                        <th className="p-4">Roll No</th>
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Stream</th>
                        <th className="p-4">Tests Attempted</th>
                        <th className="p-4">Average Score</th>
                        <th className="p-4">Accuracy</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                      {classStudents.map((s, idx) => (
                        <tr
                          key={s.id}
                          onClick={() => {
                            setSelectedStudentId(s.id);
                            setClassViewMode('individual');
                          }}
                          className="hover:bg-slate-900/40 transition-colors cursor-pointer group"
                        >
                          <td className="p-4 font-headline font-black text-cyan-400">#{s.classRank}</td>
                          <td className="p-4 font-mono font-bold text-slate-400">{s.rollNo}</td>
                          <td className="p-4 font-bold text-slate-100 group-hover:text-primary transition-colors">
                            {s.name}
                          </td>
                          <td className="p-4 font-mono text-[11px] text-slate-400">{s.stream}</td>
                          <td className="p-4 font-mono">{s.testsAttempted}</td>
                          <td className="p-4 font-mono font-bold text-slate-200">{s.avgScore} / {s.maxScore}</td>
                          <td className="p-4 font-mono font-bold text-emerald-400">{s.accuracy}%</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold">
                              {s.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button className="px-3 py-1 bg-primary/20 hover:bg-primary text-cyan-300 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer border border-primary/30">
                              Inspect Analysis
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ── CATEGORY 2: EXAM ANALYTICS ─────────────────────────────────── */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {primaryCategory === 'exam' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Exam Selector Bar */}
          <div className="bg-[#060913]/60 border border-slate-900/60 p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-cyan-400">assignment</span>
                Select Exam:
              </span>
              <select
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  setExamStudentSearch('');
                  setInspectedQuestion(null);
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-primary cursor-pointer max-w-md"
              >
                {allExams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.category}) — {ex.date}
                  </option>
                ))}
              </select>

              <span className="px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                {currentExam?.category}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono">
                Duration: {currentExam?.duration_minutes}m
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono">
                Cutoff: {currentExam?.cutoff} pts
              </span>
            </div>

            {/* View Mode: Individual vs Overview */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-end lg:self-auto">
              <button
                onClick={() => setExamViewMode('individual')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  examViewMode === 'individual'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">person</span>
                Individual Student Exam Analysis
              </button>
              <button
                onClick={() => setExamViewMode('overview')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  examViewMode === 'overview'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">analytics</span>
                Exam Benchmark Overview
              </button>
            </div>
          </div>

          {/* ── Sub-View A: Individual Student Performance in this Exam ── */}
          {examViewMode === 'individual' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Dual-Lookup Student Selector (by Name or Roll No) for this Exam */}
              <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-headline font-bold text-lg text-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">manage_search</span>
                      Select Exam Attendee (by Name or Roll No)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select a student who submitted "{currentExam?.title}" to view their question-by-question breakdown.
                    </p>
                  </div>

                  {/* Previous / Next Shortcuts */}
                  {examAttendees.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500 mr-1">
                        {examAttendees.findIndex(a => a.id === currentExamStudent?.id) + 1} of {examAttendees.length} attendees
                      </span>
                      <button
                        onClick={() => {
                          const idx = examAttendees.findIndex(a => a.id === currentExamStudent?.id);
                          if (idx > 0) setSelectedExamStudentId(examAttendees[idx - 1].id);
                        }}
                        disabled={examAttendees.findIndex(a => a.id === currentExamStudent?.id) <= 0}
                        className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 disabled:opacity-30 cursor-pointer"
                        title="Previous Attendee"
                      >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                      </button>
                      <button
                        onClick={() => {
                          const idx = examAttendees.findIndex(a => a.id === currentExamStudent?.id);
                          if (idx < examAttendees.length - 1) setSelectedExamStudentId(examAttendees[idx + 1].id);
                        }}
                        disabled={examAttendees.findIndex(a => a.id === currentExamStudent?.id) === examAttendees.length - 1}
                        className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 disabled:opacity-30 cursor-pointer"
                        title="Next Attendee"
                      >
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search attendee by name (e.g. Tanvi, Vikram) or Roll No (e.g. 128003120)..."
                      value={examStudentSearch}
                      onChange={(e) => setExamStudentSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary font-mono transition-all"
                    />

                    {/* Autocomplete Dropdown */}
                    {examStudentSearch.trim() && examSearchMatches.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-900">
                        {examSearchMatches.map((a) => (
                          <div
                            key={a.id}
                            onClick={() => {
                              setSelectedExamStudentId(a.id);
                              setExamStudentSearch('');
                            }}
                            className="p-3 hover:bg-slate-900 flex justify-between items-center cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 rounded bg-primary/20 text-cyan-300 border border-primary/30 font-mono text-[10px] font-bold">
                                {a.rollNo}
                              </span>
                              <span className="font-bold text-xs text-slate-200">{a.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-cyan-400 font-mono font-bold">{a.score} pts</span>
                              <span className="text-[10px] text-emerald-400 font-bold">Rank #{a.rank}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dropdown Selector */}
                  <div className="md:col-span-4">
                    <select
                      value={currentExamStudent?.id || ''}
                      onChange={(e) => setSelectedExamStudentId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
                    >
                      {examAttendees.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.rollNo} — {a.name} (Score: {a.score} / {currentExam?.maxScore})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Individual Student Exam Diagnostics */}
              {currentExamStudent ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                  
                  {/* Performance Summary Header Card */}
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#060913] border border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                          Roll No: {currentExamStudent.rollNo}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/40 text-purple-300 text-[10px] font-mono font-bold uppercase">
                          Exam Rank: #{currentExamStudent.rank}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-[10px] font-bold">
                          {currentExamStudent.percentile}
                        </span>
                      </div>
                      <h3 className="font-headline font-black text-2xl text-slate-100">
                        {currentExamStudent.name}’s Performance in {currentExam.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        Time Taken: {currentExamStudent.timeTaken} · Time Leak Detected: <span className="text-amber-400 font-bold">{currentExamStudent.timeWastage}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Score Achieved</span>
                        <span className="text-3xl font-black text-primary font-headline">
                          {currentExamStudent.score}
                        </span>
                        <span className="text-xs text-slate-400 font-bold"> / {currentExam.maxScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Benchmark Gauge Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-[#060913]/60 border border-slate-900/60 p-5 rounded-2xl">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">This Student</span>
                      <h4 className="text-2xl font-black text-cyan-400 mt-1">{currentExamStudent.score} pts</h4>
                      <p className="text-xs text-slate-400 font-mono mt-1">Accuracy: {currentExamStudent.accuracy}%</p>
                    </div>

                    <div className="bg-[#060913]/60 border border-slate-900/60 p-5 rounded-2xl">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Exam Topper</span>
                      <h4 className="text-2xl font-black text-emerald-400 mt-1">{currentExam.highestScore} pts</h4>
                      <p className="text-xs text-slate-400 font-mono mt-1">Difference: -{currentExam.highestScore - currentExamStudent.score} pts</p>
                    </div>

                    <div className="bg-[#060913]/60 border border-slate-900/60 p-5 rounded-2xl">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Class / Exam Average</span>
                      <h4 className="text-2xl font-black text-slate-200 mt-1">{currentExam.avgScore} pts</h4>
                      <p className="text-xs text-emerald-400 font-mono mt-1">
                        +{currentExamStudent.score - currentExam.avgScore} pts above average
                      </p>
                    </div>
                  </div>

                  {/* Subject Scores for this Student in this Exam */}
                  <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl space-y-4">
                    <h4 className="font-headline font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-900/60 pb-3">
                      <span className="material-symbols-outlined text-primary text-lg">pie_chart</span>
                      Subject Score Breakdown in this Exam
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {currentExamStudent.subjects.map((s, idx) => (
                        <div key={idx} className="bg-slate-950/70 p-4 rounded-xl border border-slate-900 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-200">{s.name}</span>
                            <span className="text-xs font-mono font-bold text-cyan-400">{s.score} / {s.max}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono pt-2 border-t border-slate-900">
                            <span className="text-emerald-400 font-bold">{s.correct} Correct</span>
                            <span className="text-rose-400 font-bold">{s.wrong} Wrong</span>
                            <span className="text-slate-500 font-bold">{s.skipped} Skipped</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Question-by-Question Matrix */}
                  <div className="bg-[#060913]/60 border border-slate-900/60 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl">
                    <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-900/60 pb-4">
                      <div>
                        <h4 className="font-headline font-bold text-lg text-slate-100 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">apps</span>
                          Question-by-Question Diagnostic Matrix
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Click any question node to inspect time spent vs topper average benchmarks.
                        </p>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-4 text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Correct (+4)
                        </span>
                        <span className="flex items-center gap-1.5 text-rose-400">
                          <span className="w-3 h-3 rounded-full bg-rose-500"></span> Incorrect (-1)
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <span className="w-3 h-3 rounded-full bg-slate-600"></span> Skipped (0)
                        </span>
                      </div>
                    </div>

                    {/* Question Nodes Grid */}
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2.5">
                      {currentExamStudent.questionMatrix.map((q) => {
                        const isSelected = inspectedQuestion?.qNum === q.qNum;
                        let btnStyle = 'bg-slate-800/50 text-slate-400 border-slate-700/40 hover:bg-slate-800';
                        if (q.status === 'correct') {
                          btnStyle = 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/40';
                        }
                        if (q.status === 'wrong') {
                          btnStyle = 'bg-rose-950/40 text-rose-300 border-rose-800/40 hover:bg-rose-900/40';
                        }

                        return (
                          <button
                            key={q.qNum}
                            onClick={() => setInspectedQuestion(q)}
                            className={`h-12 rounded-xl font-mono text-xs flex flex-col items-center justify-center border transition-all cursor-pointer ${btnStyle} ${
                              isSelected ? 'ring-2 ring-primary scale-105 shadow-md' : ''
                            }`}
                          >
                            <span className="font-bold">Q{q.qNum}</span>
                            <span className="text-[9px] opacity-70">
                              {q.status === 'correct' ? '+4' : q.status === 'wrong' ? '-1' : '0'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Inspected Question Detail Box */}
                    {inspectedQuestion && (
                      <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-3 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center flex-wrap gap-2 border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-cyan-300">
                              Question #{inspectedQuestion.qNum}
                            </span>
                            <span className="text-xs text-slate-400">· {inspectedQuestion.subject} ({inspectedQuestion.topic})</span>
                          </div>
                          <button
                            onClick={() => setInspectedQuestion(null)}
                            className="text-xs text-slate-500 hover:text-slate-300"
                          >
                            Close
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Outcome</span>
                            <span className={`font-bold ${
                              inspectedQuestion.status === 'correct' ? 'text-emerald-400' :
                              inspectedQuestion.status === 'wrong' ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                              {inspectedQuestion.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Student Time Spent</span>
                            <span className="font-bold text-slate-200">{inspectedQuestion.studentTime}</span>
                          </div>
                          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Topper Benchmark Time</span>
                            <span className="font-bold text-emerald-400">{inspectedQuestion.topperTime}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 bg-[#060913]/60 border border-slate-900/60 rounded-2xl">
                  No submissions found for this exam yet.
                </div>
              )}
            </div>
          )}

          {/* ── Sub-View B: Exam Benchmark Overview ── */}
          {examViewMode === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Exam Overview KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-[#060913]/60 border border-slate-900/60 p-5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Total Attendees</span>
                  <h4 className="text-2xl font-black text-slate-100">{currentExam.totalSubmissions}</h4>
                  <p className="text-[10px] text-slate-500">Completed Papers</p>
                </div>

                <div className="bg-[#060913]/60 border border-slate-900/60 p-5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Cutoff Clearance</span>
                  <h4 className="text-2xl font-black text-emerald-400">{currentExam.cutoffClearanceRate}</h4>
                  <p className="text-[10px] text-slate-500">Cutoff: {currentExam.cutoff} pts</p>
                </div>

                <div className="bg-[#060913]/60 border border-slate-900/60 p-5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Exam Highest</span>
                  <h4 className="text-2xl font-black text-cyan-400">{currentExam.highestScore} pts</h4>
                  <p className="text-[10px] text-slate-500">Max: {currentExam.maxScore} pts</p>
                </div>

                <div className="bg-[#060913]/60 border border-slate-900/60 p-5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Average Score</span>
                  <h4 className="text-2xl font-black text-slate-100">{currentExam.avgScore} pts</h4>
                  <p className="text-[10px] text-slate-500">Mean Score</p>
                </div>

                <div className="bg-[#060913]/60 border border-slate-900/60 p-5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Median Score</span>
                  <h4 className="text-2xl font-black text-slate-100">{currentExam.medianScore} pts</h4>
                  <p className="text-[10px] text-slate-500">50th Percentile</p>
                </div>
              </div>

              {/* Score Distribution Bell Curve */}
              <div className="bg-[#060913]/60 border border-slate-900/60 p-6 md:p-8 rounded-2xl shadow-xl space-y-5">
                <h4 className="font-headline font-bold text-base text-slate-200 flex items-center gap-2 border-b border-slate-900/60 pb-3">
                  <span className="material-symbols-outlined text-primary text-lg">bar_chart</span>
                  Score Distribution Across Mark Brackets
                </h4>

                <div className="space-y-3">
                  {currentExam.scoreDistribution.map((b, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300 font-bold">{b.range}</span>
                        <span className="text-slate-400">{b.count} Students ({Math.round((b.count / currentExam.totalSubmissions) * 100)}%)</span>
                      </div>
                      <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60">
                        <div
                          className={`h-full ${b.color} rounded-full transition-all duration-700`}
                          style={{ width: `${(b.count / currentExam.totalSubmissions) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendees List Table */}
              <div className="bg-[#060913]/60 border border-slate-900/60 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-900/60 flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h3 className="font-headline font-bold text-lg text-slate-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">format_list_numbered</span>
                      Submitted Attendees Rank List ({examAttendees.length})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click any attendee to immediately inspect their question-by-question matrix and timing analysis.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900/80 bg-slate-950/40 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <th className="p-4">Rank</th>
                        <th className="p-4">Roll No</th>
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Score</th>
                        <th className="p-4">Accuracy</th>
                        <th className="p-4">Time Taken</th>
                        <th className="p-4">Percentile</th>
                        <th className="p-4">Proctor</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                      {examAttendees.map((a) => (
                        <tr
                          key={a.id}
                          onClick={() => {
                            setSelectedExamStudentId(a.id);
                            setExamViewMode('individual');
                          }}
                          className="hover:bg-slate-900/40 transition-colors cursor-pointer group"
                        >
                          <td className="p-4 font-headline font-black text-cyan-400">#{a.rank}</td>
                          <td className="p-4 font-mono font-bold text-slate-400">{a.rollNo}</td>
                          <td className="p-4 font-bold text-slate-100 group-hover:text-primary transition-colors">
                            {a.name}
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-200">
                            {a.score} <span className="text-slate-500 font-normal">/ {currentExam.maxScore}</span>
                          </td>
                          <td className="p-4 font-mono font-bold text-emerald-400">{a.accuracy}%</td>
                          <td className="p-4 font-mono text-slate-400">{a.timeTaken}</td>
                          <td className="p-4 font-mono text-cyan-300 font-bold">{a.percentile}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-[10px] font-bold uppercase">
                              {a.proctorStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button className="px-3 py-1 bg-primary/20 hover:bg-primary text-cyan-300 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer border border-primary/30">
                              View Analysis
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
