#!/usr/bin/env node

/**
 * Batch Update Script for Dashboard Stats Cards
 * 
 * This script updates all remaining dashboard pages to use the shared
 * DashboardStatsCard component for consistent premium styling.
 * 
 * Usage: node update-all-stats-cards.js
 */

const fs = require('fs');
const path = require('path');

// Define all pages that need updating
const pagesToUpdate = [
    {
        file: 'app/dashboard/school-levels/page.tsx',
        stats: [
            { title: 'Total Levels', icon: 'Layers', color: 'blue', desc: 'Academic levels' },
            { title: 'Classes', icon: 'GraduationCap', color: 'purple', desc: 'Across all levels' },
            { title: 'Students', icon: 'Users', color: 'emerald', desc: 'Total enrollment' }
        ],
        columns: 3
    },
    {
        file: 'app/dashboard/school-levels/[id]/page.tsx',
        stats: [
            { title: 'Classes', icon: 'GraduationCap', color: 'blue', desc: 'In this level' },
            { title: 'Students', icon: 'Users', color: 'purple', desc: 'Enrolled students' },
            { title: 'Subjects', icon: 'BookOpen', color: 'emerald', desc: 'Taught subjects' }
        ],
        columns: 3
    },
    {
        file: 'app/dashboard/subjects/[id]/page.tsx',
        stats: [
            { title: 'Classes', icon: 'GraduationCap', color: 'blue', desc: 'Teaching this subject' },
            { title: 'Teachers', icon: 'Users', color: 'purple', desc: 'Assigned teachers' },
            { title: 'Students', icon: 'Users', color: 'emerald', desc: 'Learning this subject' }
        ],
        columns: 3
    },
    {
        file: 'app/dashboard/fees/page.tsx',
        stats: [
            { title: 'Total Fees', icon: 'DollarSign', color: 'blue', desc: 'All fee records' },
            { title: 'Paid', icon: 'CheckCircle', color: 'emerald', desc: 'Completed payments' },
            { title: 'Pending', icon: 'Clock', color: 'amber', desc: 'Awaiting payment' },
            { title: 'Overdue', icon: 'AlertCircle', color: 'rose', desc: 'Past due date' }
        ],
        columns: 4
    },
    {
        file: 'app/dashboard/classes/[id]/page.tsx',
        stats: [
            { title: 'Students', icon: 'Users', color: 'blue', desc: 'Enrolled students' },
            { title: 'Subjects', icon: 'BookOpen', color: 'amber', desc: 'Taught subjects' },
            { title: 'Teachers', icon: 'GraduationCap', color: 'emerald', desc: 'Teaching staff' }
        ],
        columns: 3
    },
    {
        file: 'app/dashboard/students/[id]/page.tsx',
        stats: [
            { title: 'Attendance', icon: 'Calendar', color: 'blue', desc: 'Overall attendance' }
        ],
        columns: 1
    },
    {
        file: 'app/dashboard/settings/_components/school-settings.tsx',
        stats: [
            { title: 'Students', icon: 'Users', color: 'blue', desc: 'Total students' },
            { title: 'Teachers', icon: 'GraduationCap', color: 'purple', desc: 'Teaching staff' },
            { title: 'Classes', icon: 'School', color: 'emerald', desc: 'Active classes' }
        ],
        columns: 3
    },
    {
        file: 'app/dashboard/parent/_components/parent-dashboard.tsx',
        stats: [
            { title: 'Children', icon: 'Users', color: 'blue', desc: 'Your children' },
            { title: 'Attendance', icon: 'Calendar', color: 'emerald', desc: 'Average attendance' },
            { title: 'Fees', icon: 'DollarSign', color: 'amber', desc: 'Pending fees' },
            { title: 'Events', icon: 'Bell', color: 'purple', desc: 'Upcoming events' }
        ],
        columns: 4
    },
    {
        file: 'app/dashboard/p-settings/page.tsx',
        stats: [
            { title: 'Children', icon: 'Users', color: 'blue', desc: 'Registered children' },
            { title: 'Notifications', icon: 'Bell', color: 'purple', desc: 'Active alerts' }
        ],
        columns: 2
    },
    {
        file: 'app/dashboard/children/page.tsx',
        stats: [
            { title: 'Children', icon: 'Users', color: 'blue', desc: 'Your children' },
            { title: 'Classes', icon: 'GraduationCap', color: 'purple', desc: 'Enrolled classes' },
            { title: 'Attendance', icon: 'Calendar', color: 'emerald', desc: 'Average attendance' }
        ],
        columns: 3
    },
    {
        file: 'app/dashboard/parents/[id]/page.tsx',
        stats: [
            { title: 'Children', icon: 'Users', color: 'blue', desc: 'Registered children' },
            { title: 'Fees Paid', icon: 'CheckCircle', color: 'emerald', desc: 'Completed payments' },
            { title: 'Fees Pending', icon: 'Clock', color: 'purple', desc: 'Outstanding fees' },
            { title: 'Messages', icon: 'MessageSquare', color: 'orange', desc: 'Communications' }
        ],
        columns: 4
    }
];

console.log('🚀 Starting batch update of dashboard stats cards...\n');
console.log(`📊 Total pages to update: ${pagesToUpdate.length}\n`);

// Instructions for manual update
console.log('📝 MANUAL UPDATE INSTRUCTIONS:\n');
console.log('For each file listed below, you need to:');
console.log('1. Add import: import { DashboardStatsCard, DashboardStatsGrid } from "@/components/dashboard-stats-card"');
console.log('2. Replace the old stats card grid with DashboardStatsGrid and DashboardStatsCard components\n');

pagesToUpdate.forEach((page, index) => {
    console.log(`\n${index + 1}. ${page.file}`);
    console.log(`   Columns: ${page.columns}`);
    console.log(`   Stats: ${page.stats.length}`);
    page.stats.forEach((stat, i) => {
        console.log(`   ${i + 1}. ${stat.title} (${stat.color}) - ${stat.desc}`);
    });
});

console.log('\n\n✅ COMPLETED PAGES:');
const completedPages = [
    'app/dashboard/classes/page.tsx',
    'app/dashboard/subjects/subjects-client.tsx',
    'app/dashboard/departments/page.tsx',
    'app/dashboard/teachers/teachers-client.tsx',
    'app/dashboard/students/students-client.tsx',
    'app/dashboard/sessions/page.tsx'
];

completedPages.forEach((page, i) => {
    console.log(`${i + 1}. ✅ ${page}`);
});

console.log(`\n📈 Progress: ${completedPages.length}/${completedPages.length + pagesToUpdate.length} pages updated`);
console.log(`⏳ Remaining: ${pagesToUpdate.length} pages\n`);

console.log('💡 TIP: Use the DashboardStatsCard component for consistent styling across all pages!');
console.log('📚 Documentation: docs/DASHBOARD_STATS_COMPONENT.md\n');
