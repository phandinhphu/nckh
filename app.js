/**
 * APP.JS - Main application logic and UI interactions
 * Coordinates all 4 phases of the academic scheduling algorithm
 */

class AcademicPlannerApp {
    constructor() {
        this.curriculum = [];
        this.scheduler = null;
        this.visualizer = new ScheduleVisualizer();
        this.currentPlan = null;
        this.currentValidation = null;
        this.selectedCourses = new Set();
        this.undoStack = [];
        this.redoStack = [];
        
        this.init();
    }

    async init() {
        try {
            // Load curriculum data
            await this.loadCurriculumData();
            
            // Initialize UI components
            this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize scheduler
            this.scheduler = new AcademicScheduler(this.curriculum);
            
            // Show initial data stats
            this.displayDataStats();
            
            console.log('Academic Planner App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Không thể khởi tạo ứng dụng. Vui lòng kiểm tra dữ liệu.');
        }
    }

    async loadCurriculumData() {
        try {
            const response = await fetch('./data_test_v1.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.curriculum = await response.json();
            console.log('Loaded', this.curriculum.length, 'courses');
        } catch (error) {
            console.error('Error loading curriculum:', error);
            // Fallback to test data if available
            if (typeof curriculum !== 'undefined') {
                this.curriculum = curriculum;
                console.log('Using fallback curriculum data');
            } else {
                throw new Error('No curriculum data available');
            }
        }
    }

    initializeUI() {
        // Initialize course list
        this.populateCourseList();
        
        // Initialize DAG visualization
        this.visualizer.initializeDAGVisualization('dagContainer');
        
        // Setup drag and drop for manual scheduling
        this.setupDragAndDrop();
        
        // Initialize charts containers
        this.initializeChartContainers();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Course search
        const courseSearch = document.getElementById('courseSearch');
        if (courseSearch) {
            courseSearch.addEventListener('input', (e) => this.filterCourses(e.target.value));
        }

        // Main action buttons
        const generatePlanBtn = document.getElementById('generatePlan');
        if (generatePlanBtn) {
            generatePlanBtn.addEventListener('click', () => this.generateOptimalPlan());
        }

        const autoScheduleBtn = document.getElementById('autoSchedule');
        if (autoScheduleBtn) {
            autoScheduleBtn.addEventListener('click', () => this.autoSchedule());
        }

        const validateScheduleBtn = document.getElementById('validateSchedule');
        if (validateScheduleBtn) {
            validateScheduleBtn.addEventListener('click', () => this.validateCurrentSchedule());
        }

        const optimizeScheduleBtn = document.getElementById('optimizeSchedule');
        if (optimizeScheduleBtn) {
            optimizeScheduleBtn.addEventListener('click', () => this.optimizeSchedule());
        }

        // Strategy comparison
        const compareStrategiesBtn = document.getElementById('compareStrategies');
        if (compareStrategiesBtn) {
            compareStrategiesBtn.addEventListener('click', () => this.compareStrategies());
        }

        // View controls
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchScheduleView(e.target.id));
        });

        // Filter controls
        const semesterFilter = document.getElementById('semesterFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        if (semesterFilter && categoryFilter) {
            semesterFilter.addEventListener('change', () => this.updateReadyCoursesFilter());
            categoryFilter.addEventListener('change', () => this.updateReadyCoursesFilter());
        }

        // DAG controls
        const resetZoomBtn = document.getElementById('resetZoom');
        const centerGraphBtn = document.getElementById('centerGraph');
        if (resetZoomBtn) {
            resetZoomBtn.addEventListener('click', () => this.visualizer.resetZoom());
        }
        if (centerGraphBtn) {
            centerGraphBtn.addEventListener('click', () => this.visualizer.centerGraph());
        }

        // Undo/Redo controls
        const undoBtn = document.getElementById('undoMove');
        const redoBtn = document.getElementById('redoMove');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undoLastMove());
        }
        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redoLastMove());
        }

        // Export buttons
        const exportPDFBtn = document.getElementById('exportPDF');
        const exportExcelBtn = document.getElementById('exportExcel');
        const exportJSONBtn = document.getElementById('exportJSON');
        if (exportPDFBtn) {
            exportPDFBtn.addEventListener('click', () => this.exportToPDF());
        }
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => this.exportToExcel());
        }
        if (exportJSONBtn) {
            exportJSONBtn.addEventListener('click', () => this.exportToJSON());
        }

        // Modal close
        const modal = document.getElementById('courseModal');
        const closeBtn = modal?.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }
    }

    populateCourseList() {
        const courseList = document.getElementById('courseList');
        if (!courseList) return;

        courseList.innerHTML = '';

        this.curriculum.forEach(course => {
            const courseItem = document.createElement('div');
            courseItem.className = 'course-item';
            courseItem.dataset.courseCode = course.code;
            
            courseItem.innerHTML = `
                <div class="course-info">
                    <div class="course-code">${course.code}</div>
                    <div class="course-name">${course.name}</div>
                </div>
                <div class="course-credits">${course.credits} TC</div>
            `;

            courseItem.addEventListener('click', () => this.toggleCourseSelection(course));
            courseList.appendChild(courseItem);
        });
    }

    filterCourses(searchTerm) {
        const courseItems = document.querySelectorAll('.course-item');
        const term = searchTerm.toLowerCase();

        courseItems.forEach(item => {
            const code = item.querySelector('.course-code').textContent.toLowerCase();
            const name = item.querySelector('.course-name').textContent.toLowerCase();
            
            if (code.includes(term) || name.includes(term)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    toggleCourseSelection(course) {
        const courseItem = document.querySelector(`[data-course-code="${course.code}"]`);
        
        if (this.selectedCourses.has(course.code)) {
            this.selectedCourses.delete(course.code);
            courseItem.classList.remove('selected');
            this.removeSelectedCourseTag(course.code);
        } else {
            this.selectedCourses.add(course.code);
            courseItem.classList.add('selected');
            this.addSelectedCourseTag(course);
        }

        this.updateSelectedCoursesDisplay();
    }

    addSelectedCourseTag(course) {
        const container = document.getElementById('selectedCoursesContainer');
        if (!container) return;

        const tag = document.createElement('span');
        tag.className = 'selected-course-tag';
        tag.dataset.courseCode = course.code;
        tag.innerHTML = `
            ${course.code}
            <button class="remove-course" onclick="app.removeCourse('${course.code}')">×</button>
        `;
        container.appendChild(tag);
    }

    removeSelectedCourseTag(courseCode) {
        const tag = document.querySelector(`[data-course-code="${courseCode}"].selected-course-tag`);
        if (tag) {
            tag.remove();
        }
    }

    removeCourse(courseCode) {
        this.selectedCourses.delete(courseCode);
        
        const courseItem = document.querySelector(`[data-course-code="${courseCode}"].course-item`);
        if (courseItem) {
            courseItem.classList.remove('selected');
        }
        
        this.removeSelectedCourseTag(courseCode);
        this.updateSelectedCoursesDisplay();
    }

    updateSelectedCoursesDisplay() {
        const countElement = document.getElementById('selectedCount');
        if (countElement) {
            countElement.textContent = this.selectedCourses.size;
        }
    }

    displayDataStats() {
        const statsContainer = document.getElementById('dataStats');
        if (!statsContainer) return;

        const totalCourses = this.curriculum.length;
        const requiredCourses = this.curriculum.filter(c => c.isRequired).length;
        const electiveCourses = totalCourses - requiredCourses;
        const totalCredits = this.curriculum.reduce((sum, c) => sum + c.credits, 0);

        const stats = [
            { label: 'Tổng môn học', value: totalCourses, icon: 'fas fa-book' },
            { label: 'Môn bắt buộc', value: requiredCourses, icon: 'fas fa-star' },
            { label: 'Môn tự chọn', value: electiveCourses, icon: 'fas fa-list' },
            { label: 'Tổng tín chỉ', value: totalCredits, icon: 'fas fa-calculator' }
        ];

        statsContainer.innerHTML = '';
        stats.forEach(stat => {
            const statCard = document.createElement('div');
            statCard.className = 'stat-card';
            statCard.innerHTML = `
                <i class="${stat.icon}"></i>
                <div class="stat-number">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
            `;
            statsContainer.appendChild(statCard);
        });
    }

    /**
     * PHASE 1-4: Main Algorithm Execution
     */
    async generateOptimalPlan() {
        try {
            this.showLoading('Đang thực hiện thuật toán lập kế hoạch...');

            // Get user options
            const options = this.collectUserOptions();
            
            // Set completed courses and options
            this.scheduler.setCompletedCourses(Array.from(this.selectedCourses));
            this.scheduler.setOptions(options);

            // Execute all 4 phases
            const result = this.scheduler.generateOptimalPlan();
            
            this.currentPlan = result.schedule;
            this.currentValidation = result.validation;

            // Update all visualizations
            await this.updateAllVisualizations(result);

            // Switch to analysis tab to show results
            this.switchTab('analysis');

            this.hideLoading();
            this.showSuccess('Kế hoạch học tập đã được tạo thành công!');

        } catch (error) {
            console.error('Error generating plan:', error);
            this.hideLoading();
            this.showError('Có lỗi xảy ra khi tạo kế hoạch. Vui lòng thử lại.');
        }
    }

    collectUserOptions() {
        const strategy = document.getElementById('strategy')?.value || 'balanced';
        const enableAdvanced = document.getElementById('enableAdvanced')?.checked || false;
        const includeSummer = document.getElementById('includeSummer')?.checked || false;
        const maxCredits = parseInt(document.getElementById('maxCredits')?.value) || 22;
        const currentSemester = parseInt(document.getElementById('currentSemester')?.value) || 1;

        return {
            strategy,
            enableAdvancedStudy: enableAdvanced,
            includeSummerSemesters: includeSummer,
            maxCreditsPerSemester: maxCredits,
            currentSemester,
            allowOverload: false
        };
    }

    async updateAllVisualizations(result) {
        // Phase 2: DAG and ready courses
        this.visualizer.renderDAG(result.graph, Array.from(this.selectedCourses));
        this.visualizer.renderReadyCourses(result.readyCourses, 'readyCoursesContainer');
        this.visualizer.renderPrerequisitesAnalysis(
            result.graph, 
            this.scheduler.findPrerequisiteBottlenecks(), 
            document.querySelector('.prerequisites-analysis')
        );

        // Phase 3: Schedule display
        this.renderScheduleDisplay(result.schedule);

        // Phase 4: Evaluation and recommendations
        this.visualizer.renderValidationResults(result.validation, 'validationResults');
        this.visualizer.renderStatisticsCharts(result.statistics, 'overallStats');
        
        const recommendations = this.scheduler.analyzePlanOptimization(result.schedule, result.validation);
        this.visualizer.renderRecommendations(recommendations, 'recommendations');

        // Timeline
        this.visualizer.renderScheduleTimeline(result.schedule, 'studyTimeline');

        // Update statistics display
        this.updateStatisticsDisplay(result.statistics);
    }

    renderScheduleDisplay(schedule) {
        const container = document.getElementById('scheduleDisplay');
        if (!container) return;

        container.innerHTML = '';

        if (!schedule || schedule.length === 0) {
            container.innerHTML = `
                <div class="schedule-placeholder">
                    <i class="fas fa-calendar-plus"></i>
                    <p>Chưa có kế hoạch học tập</p>
                </div>
            `;
            return;
        }

        // Group by year
        const yearGroups = new Map();
        schedule.forEach(sem => {
            if (!yearGroups.has(sem.year)) {
                yearGroups.set(sem.year, []);
            }
            yearGroups.get(sem.year).push(sem);
        });

        // Render each year
        for (const [year, semesters] of yearGroups) {
            const yearContainer = document.createElement('div');
            yearContainer.className = 'year-container';
            yearContainer.innerHTML = `<h3>Năm ${year}</h3>`;

            semesters.sort((a, b) => a.semester - b.semester);
            
            semesters.forEach(semester => {
                const semesterCard = this.createSemesterCard(semester);
                yearContainer.appendChild(semesterCard);
            });

            container.appendChild(yearContainer);
        }
    }

    createSemesterCard(semester) {
        const card = document.createElement('div');
        card.className = 'semester-card';
        card.dataset.semesterId = `${semester.year}-${semester.semester}`;

        const semesterTypeText = semester.semesterType === 'summer' ? ' (Học kỳ hè)' : '';
        
        card.innerHTML = `
            <div class="semester-header">
                <div class="semester-title">
                    <i class="fas fa-calendar-alt"></i>
                    Học kỳ ${semester.semester}${semesterTypeText}
                </div>
                <div class="semester-info">
                    ${semester.credits} tín chỉ • ${semester.courses.length} môn
                </div>
            </div>
            <div class="semester-courses" id="semester-${semester.year}-${semester.semester}">
                ${semester.courses.map(course => this.createCourseCard(course, semester)).join('')}
            </div>
        `;

        return card;
    }

    createCourseCard(course, semester) {
        const isAdvanced = course.expectedSemester > Math.floor(semester.semester);
        const advancedText = isAdvanced ? ' 🚀' : '';
        
        return `
            <div class="course-card" draggable="true" data-course-code="${course.code}">
                <div class="course-header">
                    <span class="course-code-card">${course.code}${advancedText}</span>
                    <span class="course-credits-card">${course.credits} TC</span>
                </div>
                <div class="course-name-card">${course.name}</div>
            </div>
        `;
    }

    updateStatisticsDisplay(statistics) {
        const container = document.getElementById('overallStats');
        if (!container) return;

        const stats = [
            { label: 'Tổng học kỳ', value: statistics.totalSemesters },
            { label: 'Học kỳ chính', value: statistics.regularSemesters },
            { label: 'Học kỳ hè', value: statistics.summerSemesters },
            { label: 'Thời gian', value: `${statistics.completionTimeInYears} năm` },
            { label: 'Tổng tín chỉ', value: statistics.totalCredits },
            { label: 'Học vượt', value: `${statistics.advancedStudyCourses} môn` }
        ];

        container.innerHTML = '';
        stats.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            statItem.innerHTML = `
                <div class="stat-value">${stat.value}</div>
                <div class="stat-description">${stat.label}</div>
            `;
            container.appendChild(statItem);
        });
    }

    /**
     * Tab Navigation
     */
    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');

        // Trigger specific tab actions
        this.onTabSwitch(tabId);
    }

    onTabSwitch(tabId) {
        switch (tabId) {
            case 'analysis':
                // Refresh DAG visualization if needed
                if (this.currentPlan) {
                    this.visualizer.renderDAG(
                        this.scheduler.graph, 
                        Array.from(this.selectedCourses)
                    );
                }
                break;
            case 'scheduling':
                // Refresh schedule display
                if (this.currentPlan) {
                    this.renderScheduleDisplay(this.currentPlan);
                }
                break;
            case 'evaluation':
                // Refresh evaluation charts
                if (this.currentValidation) {
                    this.updateEvaluationDisplays();
                }
                break;
        }
    }

    /**
     * Schedule Management
     */
    autoSchedule() {
        if (!this.currentPlan) {
            this.showWarning('Vui lòng tạo kế hoạch học tập trước');
            return;
        }

        this.renderScheduleDisplay(this.currentPlan);
        this.showSuccess('Lịch học đã được tự động sắp xếp');
    }

    validateCurrentSchedule() {
        if (!this.currentPlan) {
            this.showWarning('Chưa có kế hoạch để kiểm tra');
            return;
        }

        const validation = this.scheduler.validateSchedule(this.currentPlan);
        this.currentValidation = validation;
        
        this.visualizer.renderValidationResults(validation, 'validationResults');
        
        if (validation.isValid) {
            this.showSuccess('Kế hoạch học tập hợp lệ!');
        } else {
            this.showWarning(`Kế hoạch có ${validation.errors.length} lỗi và ${validation.warnings.length} cảnh báo`);
        }

        this.switchTab('evaluation');
    }

    optimizeSchedule() {
        if (!this.currentPlan) {
            this.showWarning('Chưa có kế hoạch để tối ưu');
            return;
        }

        try {
            this.showLoading('Đang tối ưu hóa kế hoạch...');

            // Regenerate with optimization strategy
            const optimizedOptions = {
                ...this.collectUserOptions(),
                strategy: 'fast' // Use fast strategy for optimization
            };

            this.scheduler.setOptions(optimizedOptions);
            const result = this.scheduler.generateOptimalPlan();
            
            this.currentPlan = result.schedule;
            this.currentValidation = result.validation;

            this.updateAllVisualizations(result);
            
            this.hideLoading();
            this.showSuccess('Kế hoạch đã được tối ưu hóa!');

        } catch (error) {
            console.error('Error optimizing schedule:', error);
            this.hideLoading();
            this.showError('Có lỗi xảy ra khi tối ưu hóa');
        }
    }

    compareStrategies() {
        try {
            this.showLoading('Đang so sánh các chiến lược...');

            const comparisonResults = this.scheduler.compareStrategies(Array.from(this.selectedCourses));
            
            this.visualizer.renderStrategyComparison(comparisonResults, 'comparisonResults');
            
            this.hideLoading();
            this.showSuccess('So sánh chiến lược hoàn tất!');

        } catch (error) {
            console.error('Error comparing strategies:', error);
            this.hideLoading();
            this.showError('Có lỗi xảy ra khi so sánh chiến lược');
        }
    }

    /**
     * Drag and Drop for Manual Adjustment
     */
    setupDragAndDrop() {
        // This would implement drag and drop functionality
        // for manual course rearrangement between semesters
        console.log('Drag and drop functionality would be implemented here');
    }

    undoLastMove() {
        if (this.undoStack.length === 0) return;
        
        const lastMove = this.undoStack.pop();
        this.redoStack.push(lastMove);
        
        // Apply reverse move
        this.applyMove(lastMove, true);
        
        document.getElementById('undoMove').disabled = this.undoStack.length === 0;
        document.getElementById('redoMove').disabled = false;
    }

    redoLastMove() {
        if (this.redoStack.length === 0) return;
        
        const moveToRedo = this.redoStack.pop();
        this.undoStack.push(moveToRedo);
        
        // Apply move
        this.applyMove(moveToRedo, false);
        
        document.getElementById('redoMove').disabled = this.redoStack.length === 0;
        document.getElementById('undoMove').disabled = false;
    }

    applyMove(move, reverse) {
        // Implementation for applying/reversing course moves
        console.log('Apply move:', move, 'reverse:', reverse);
    }

    /**
     * Filter Management
     */
    updateReadyCoursesFilter() {
        const semesterFilter = document.getElementById('semesterFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        
        const filters = {
            semester: semesterFilter,
            category: categoryFilter
        };

        if (this.scheduler && this.scheduler.graph) {
            const readyCourses = this.scheduler.findReadyCourses();
            this.visualizer.renderReadyCourses(readyCourses, 'readyCoursesContainer', filters);
        }
    }

    switchScheduleView(viewId) {
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(viewId).classList.add('active');

        // Implement different view modes
        switch (viewId) {
            case 'viewByYear':
                this.renderScheduleByYear();
                break;
            case 'viewBySemester':
                this.renderScheduleBySemester();
                break;
            case 'viewTimeline':
                this.renderScheduleTimeline();
                break;
        }
    }

    renderScheduleByYear() {
        if (this.currentPlan) {
            this.renderScheduleDisplay(this.currentPlan);
        }
    }

    renderScheduleBySemester() {
        // Alternative semester view implementation
        console.log('Semester view rendering');
    }

    renderScheduleTimeline() {
        if (this.currentPlan) {
            this.visualizer.renderScheduleTimeline(this.currentPlan, 'scheduleDisplay');
        }
    }

    /**
     * Export Functions
     */
    exportToPDF() {
        if (!this.currentPlan) {
            this.showWarning('Chưa có kế hoạch để xuất');
            return;
        }

        // PDF export implementation would go here
        this.showInfo('Tính năng xuất PDF đang được phát triển');
    }

    exportToExcel() {
        if (!this.currentPlan) {
            this.showWarning('Chưa có kế hoạch để xuất');
            return;
        }

        // Excel export implementation would go here
        this.showInfo('Tính năng xuất Excel đang được phát triển');
    }

    exportToJSON() {
        if (!this.currentPlan) {
            this.showWarning('Chưa có kế hoạch để xuất');
            return;
        }

        const exportData = {
            plan: this.currentPlan,
            validation: this.currentValidation,
            completedCourses: Array.from(this.selectedCourses),
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ke-hoach-hoc-tap.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showSuccess('Đã xuất file JSON thành công');
    }

    /**
     * Utility Functions
     */
    initializeChartContainers() {
        // Initialize any chart containers that need special setup
    }

    updateEvaluationDisplays() {
        if (this.currentValidation) {
            this.visualizer.renderValidationResults(this.currentValidation, 'validationResults');
            this.updateStatisticsDisplay(this.currentValidation.statistics);
        }
    }

    showLoading(message = 'Đang xử lý...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            const text = overlay.querySelector('p');
            if (text) text.textContent = message;
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Simple alert for now - could be replaced with toast notifications
        alert(message);
    }

    closeModal() {
        const modal = document.getElementById('courseModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showCourseDetails(courseCode) {
        const course = this.curriculum.find(c => c.code === courseCode);
        if (!course) return;

        const modal = document.getElementById('courseModal');
        const detailsContainer = document.getElementById('courseDetails');
        
        if (modal && detailsContainer) {
            detailsContainer.innerHTML = `
                <h2>${course.code}: ${course.name}</h2>
                <p><strong>Tín chỉ:</strong> ${course.credits}</p>
                <p><strong>Loại:</strong> ${course.isRequired ? 'Bắt buộc' : 'Tự chọn'}</p>
                <p><strong>Học kỳ dự kiến:</strong> ${course.expectedSemester}</p>
                <p><strong>Độ khó:</strong> ${course.difficulty}/5</p>
                ${course.prerequisites?.length ? `<p><strong>Môn tiên quyết:</strong> ${course.prerequisites.join(', ')}</p>` : ''}
                ${course.corequisites?.length ? `<p><strong>Môn học trước:</strong> ${course.corequisites.join(', ')}</p>` : ''}
                ${course.equivalents?.length ? `<p><strong>Môn thay thế:</strong> ${course.equivalents.join(', ')}</p>` : ''}
            `;
            modal.style.display = 'block';
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AcademicPlannerApp();
});

// Make app globally available for inline event handlers
window.app = null;
