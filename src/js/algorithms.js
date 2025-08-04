/**
 * ALGORITHMS.JS - Core scheduling algorithms implementation
 * Implements the 4-phase academic planning algorithm as described in the requirements
 */

class AcademicScheduler {
    constructor(curriculum) {
        this.curriculum = curriculum;
        this.graph = null;
        this.completedCourses = [];
        this.options = {
            maxCreditsPerSemester: 22,
            minCreditsPerSemester: 14, // 2/3 of average
            maxSummerCredits: 10,
            strategy: 'balanced',
            enableAdvancedStudy: true,
            includeSummerSemesters: true,
            allowOverload: false
        };
        this.validation = {
            errors: [],
            warnings: [],
            isValid: true
        };
    }

    /**
     * PHASE 1: Data Preparation and Preprocessing
     * Thu thập dữ liệu sinh viên và xây dựng đồ thị môn học
     */
    buildDAG() {
        console.log('Phase 1: Building DAG from curriculum...');
        
        this.graph = {
            adjacencyList: {}, // course -> [dependencies]
            reverseList: {}, // course -> [dependents]
            courseMap: new Map(),
            groups: new Map()
        };

        // Initialize structures
        this.curriculum.forEach(course => {
            this.graph.adjacencyList[course.code] = course.prerequisites || [];
            this.graph.reverseList[course.code] = [];
            this.graph.courseMap.set(course.code, course);
            
            // Group courses by category
            if (!this.graph.groups.has(course.group)) {
                this.graph.groups.set(course.group, []);
            }
            this.graph.groups.get(course.group).push(course);
        });

        // Build reverse dependencies (dependents)
        this.curriculum.forEach(course => {
            (course.prerequisites || []).forEach(prereq => {
                if (this.graph.reverseList[prereq]) {
                    this.graph.reverseList[prereq].push(course.code);
                }
            });
        });

        // Remove completed courses from graph
        this.removeCompletedCourses();
        
        console.log('DAG built successfully with', Object.keys(this.graph.adjacencyList).length, 'nodes');
        return this.graph;
    }

    removeCompletedCourses() {
        const completedSet = new Set(this.completedCourses);
        
        // Remove completed courses and their equivalents
        this.curriculum.forEach(course => {
            if (completedSet.has(course.code) || 
                course.equivalents?.some(eq => completedSet.has(eq))) {
                delete this.graph.adjacencyList[course.code];
                delete this.graph.reverseList[course.code];
            }
        });
    }

    /**
     * PHASE 2: Identify Available Courses (Ready-to-take courses)
     * Xác định các môn học khả dụng - có thể đăng ký
     */
    findReadyCourses(currentSemester = 1) {
        console.log('Phase 2: Finding ready courses for semester', currentSemester);
        
        const completedSet = new Set(this.completedCourses);
        const readyCourses = [];

        this.curriculum.forEach(course => {
            // Skip if already completed
            if (completedSet.has(course.code)) return;
            
            // Skip if equivalent course completed
            if (course.equivalents?.some(eq => completedSet.has(eq))) return;

            // Check prerequisites
            const prereqs = course.prerequisites || [];
            const prereqsSatisfied = prereqs.every(p => completedSet.has(p));
            
            if (!prereqsSatisfied) return;

            // Apply advanced study constraints
            if (!this.options.enableAdvancedStudy) {
                // Only allow courses for current semester or earlier
                if (course.expectedSemester > currentSemester) return;
            } else {
                // Allow advance study up to 4 semesters (2 years)
                const maxAdvanceSemesters = 4;
                if (course.expectedSemester > currentSemester + maxAdvanceSemesters) return;
            }

            readyCourses.push({
                ...course,
                priority: this.calculatePriority(course, currentSemester),
                isAdvanceStudy: course.expectedSemester > currentSemester
            });
        });

        // Sort by priority
        readyCourses.sort((a, b) => b.priority - a.priority);
        
        console.log('Found', readyCourses.length, 'ready courses');
        return readyCourses;
    }

    calculatePriority(course, currentSemester) {
        let priority = 0;

        // Priority 1: Current semester courses
        if (course.expectedSemester === currentSemester) priority += 2000;

        // Priority 2: Required courses
        if (course.isRequired) priority += 1000;

        // Priority 3: Number of dependents (unlocks more courses)
        const dependentCount = this.graph.reverseList[course.code]?.length || 0;
        priority += dependentCount * 100;

        // Priority 4: Foundation courses (many prerequisites)
        priority += (course.prerequisites?.length || 0) * 50;

        // Priority 5: Expected semester (earlier = higher)
        priority += (10 - (course.expectedSemester || 10)) * 10;

        // Penalty for excessive advance study
        const advanceDistance = Math.max(0, course.expectedSemester - currentSemester);
        priority -= advanceDistance * 20;

        return priority;
    }

    /**
     * PHASE 3: Course Scheduling Algorithm
     * Phân bổ môn học vào các học kỳ theo thuật toán tối ưu
     */
    buildOptimalSchedule() {
        console.log('Phase 3: Building optimal schedule...');
        
        const schedule = [];
        const takenCourses = new Set(this.completedCourses);
        const selectedEquivalents = new Set();
        
        let currentSemester = 1;
        let currentYear = 1;

        // Calculate dynamic max credits based on curriculum
        const avgCreditsPerSemester = this.calculateAverageCreditsPerSemester();
        this.options.maxCreditsPerSemester = Math.ceil(avgCreditsPerSemester * 1.5); // 3/2 of average
        this.options.minCreditsPerSemester = Math.ceil(avgCreditsPerSemester * 2/3); // 2/3 of average

        while (true) {
            // Find ready courses for current semester
            const readyCourses = this.findReadyCoursesForSemester(
                Array.from(takenCourses), 
                currentSemester
            );

            if (readyCourses.length === 0) {
                // Try summer semester if enabled
                if (this.options.includeSummerSemesters && currentSemester % 2 === 0) {
                    const summerSemester = this.buildSummerSemester(
                        Array.from(takenCourses),
                        currentSemester,
                        selectedEquivalents
                    );
                    
                    if (summerSemester.courses.length > 0) {
                        summerSemester.courses.forEach(course => {
                            takenCourses.add(course.code);
                            course.equivalents?.forEach(eq => selectedEquivalents.add(eq));
                        });

                        schedule.push({
                            semester: currentSemester + 0.5,
                            semesterType: 'summer',
                            year: currentYear,
                            courses: summerSemester.courses,
                            credits: summerSemester.credits,
                            load: this.calculateSemesterLoad(summerSemester.courses)
                        });
                    }
                }
                
                currentSemester++;
                currentYear = Math.ceil(currentSemester / 2);
                
                // Check if all courses are scheduled
                if (this.allCoursesScheduled(takenCourses)) break;
                if (currentSemester > 16) break; // Safety limit
                continue;
            }

            // Apply sorting strategy
            const sortedCourses = this.applySortingStrategy(readyCourses, currentSemester);
            
            // Build semester using greedy algorithm
            const semesterResult = this.buildSemesterGreedy(
                sortedCourses,
                takenCourses,
                selectedEquivalents
            );

            if (semesterResult.courses.length === 0) break;

            // Update state
            semesterResult.courses.forEach(course => {
                takenCourses.add(course.code);
                course.equivalents?.forEach(eq => selectedEquivalents.add(eq));
            });

            schedule.push({
                semester: currentSemester,
                semesterType: 'regular',
                year: currentYear,
                courses: semesterResult.courses,
                credits: semesterResult.credits,
                load: semesterResult.load
            });

            currentSemester++;
            currentYear = Math.ceil(currentSemester / 2);
        }

        console.log('Schedule built with', schedule.length, 'semesters');
        return schedule;
    }

    findReadyCoursesForSemester(takenCourses, currentSemester) {
        const takenSet = new Set(takenCourses);
        
        return this.curriculum.filter(course => {
            // Skip completed courses
            if (takenSet.has(course.code)) return false;
            if (course.equivalents?.some(eq => takenSet.has(eq))) return false;

            // Check prerequisites
            const prereqs = course.prerequisites || [];
            const prereqsSatisfied = prereqs.every(p => takenSet.has(p));
            
            if (!prereqsSatisfied) return false;

            // Apply advance study constraints
            if (!this.options.enableAdvancedStudy) {
                return course.expectedSemester <= currentSemester;
            }
            
            const maxAdvanceSemesters = 4;
            return course.expectedSemester <= currentSemester + maxAdvanceSemesters;
        });
    }

    applySortingStrategy(courses, currentSemester) {
        switch (this.options.strategy) {
            case 'fast':
                return this.sortForFastCompletion(courses, currentSemester);
            case 'load-balanced':
                return this.sortForLoadBalance(courses, currentSemester);
            case 'balanced':
            default:
                return this.sortBalanced(courses, currentSemester);
        }
    }

    sortForFastCompletion(courses, currentSemester) {
        return courses.sort((a, b) => {
            // Current semester courses first
            const isCurrA = a.expectedSemester === currentSemester;
            const isCurrB = b.expectedSemester === currentSemester;
            if (isCurrA && !isCurrB) return -1;
            if (!isCurrA && isCurrB) return 1;

            // Courses that unlock more courses
            const depA = this.graph.reverseList[a.code]?.length || 0;
            const depB = this.graph.reverseList[b.code]?.length || 0;
            if (depA !== depB) return depB - depA;

            // Required courses
            if (a.isRequired && !b.isRequired) return -1;
            if (!a.isRequired && b.isRequired) return 1;

            // Earlier expected semester
            return (a.expectedSemester || 99) - (b.expectedSemester || 99);
        });
    }

    sortForLoadBalance(courses, currentSemester) {
        return courses.sort((a, b) => {
            const priorityA = this.calculatePriority(a, currentSemester);
            const priorityB = this.calculatePriority(b, currentSemester);

            // Factor in difficulty
            const diffA = a.difficulty || 1;
            const diffB = b.difficulty || 1;

            return (priorityB - diffB * 10) - (priorityA - diffA * 10);
        });
    }

    sortBalanced(courses, currentSemester) {
        return courses.sort((a, b) => {
            const priorityA = this.calculatePriority(a, currentSemester);
            const priorityB = this.calculatePriority(b, currentSemester);
            return priorityB - priorityA;
        });
    }

    buildSemesterGreedy(sortedCourses, takenCourses, selectedEquivalents) {
        const semesterCourses = [];
        let semesterCredits = 0;
        const maxCredits = this.options.allowOverload ? 
            this.options.maxCreditsPerSemester * 1.2 : 
            this.options.maxCreditsPerSemester;

        for (const course of sortedCourses) {
            if (takenCourses.has(course.code)) continue;
            if (course.equivalents?.some(eq => takenCourses.has(eq))) continue;

            // Find required corequisites
            const coreqCourses = (course.corequisites || [])
                .map(c => this.curriculum.find(x => x.code === c))
                .filter(c => c && !takenCourses.has(c.code));

            const totalCredits = course.credits + 
                coreqCourses.reduce((sum, c) => sum + c.credits, 0);

            // Check credit constraints
            if (semesterCredits + totalCredits <= maxCredits) {
                semesterCourses.push(course);
                coreqCourses.forEach(c => semesterCourses.push(c));
                semesterCredits += totalCredits;

                // Mark equivalents as selected
                course.equivalents?.forEach(eq => selectedEquivalents.add(eq));
                coreqCourses.forEach(c => 
                    c.equivalents?.forEach(eq => selectedEquivalents.add(eq))
                );
            }
        }

        return {
            courses: semesterCourses,
            credits: semesterCredits,
            load: this.calculateSemesterLoad(semesterCourses)
        };
    }

    buildSummerSemester(takenCourses, currentSemester, selectedEquivalents) {
        const maxSummerCredits = this.options.maxSummerCredits;
        const maxSummerCourses = 4;

        // Find suitable summer courses (advance study opportunities)
        const summerCandidates = this.findReadyCoursesForSemester(
            takenCourses, 
            currentSemester + 2
        ).filter(course => {
            if (selectedEquivalents.has(course.code)) return false;
            
            // Prefer theoretical courses for summer
            const isPractical = course.name.toLowerCase().includes('thực hành') ||
                              course.name.toLowerCase().includes('thí nghiệm') ||
                              course.name.toLowerCase().includes('project');
            
            return !isPractical || course.credits <= 2;
        });

        // Sort for summer optimization
        summerCandidates.sort((a, b) => {
            const depA = this.graph.reverseList[a.code]?.length || 0;
            const depB = this.graph.reverseList[b.code]?.length || 0;
            
            const isAdvanceA = a.expectedSemester > currentSemester;
            const isAdvanceB = b.expectedSemester > currentSemester;
            
            // Prioritize advance courses that unlock many others
            if (isAdvanceA && depA > 0 && (!isAdvanceB || depB === 0)) return -1;
            if (isAdvanceB && depB > 0 && (!isAdvanceA || depA === 0)) return 1;
            
            if (depA !== depB) return depB - depA;
            if (isAdvanceA && !isAdvanceB) return -1;
            if (!isAdvanceA && isAdvanceB) return 1;
            if (a.credits !== b.credits) return a.credits - b.credits;
            
            return 0;
        });

        // Select courses for summer
        const summerCourses = [];
        let summerCredits = 0;
        let courseCount = 0;

        for (const course of summerCandidates) {
            if (courseCount >= maxSummerCourses) break;
            if (summerCredits + course.credits > maxSummerCredits) continue;

            summerCourses.push(course);
            summerCredits += course.credits;
            courseCount++;
        }

        return {
            courses: summerCourses,
            credits: summerCredits,
            load: this.calculateSemesterLoad(summerCourses)
        };
    }

    /**
     * PHASE 4: Evaluation and Feedback
     * Đánh giá và đưa ra phản hồi về kế hoạch
     */
    validateSchedule(schedule) {
        console.log('Phase 4: Validating schedule...');
        
        this.validation = {
            isValid: true,
            errors: [],
            warnings: [],
            statistics: {}
        };

        const sortedSchedule = [...schedule].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.semester - b.semester;
        });

        // Validate prerequisites and constraints
        this.validatePrerequisites(sortedSchedule);
        this.validateCreditConstraints(sortedSchedule);
        this.validateLoadBalance(sortedSchedule);

        // Calculate statistics
        this.validation.statistics = this.calculateStatistics(schedule);

        console.log('Validation completed:', this.validation.isValid ? 'PASSED' : 'FAILED');
        return this.validation;
    }

    validatePrerequisites(sortedSchedule) {
        const previousCourses = new Set();

        for (let i = 0; i < sortedSchedule.length; i++) {
            const currentSem = sortedSchedule[i];
            const semesterCodes = new Set(currentSem.courses.map(c => c.code));

            for (const course of currentSem.courses) {
                // Check prerequisites
                const missingPrereqs = (course.prerequisites || [])
                    .filter(prereq => !previousCourses.has(prereq));

                if (missingPrereqs.length > 0) {
                    this.validation.errors.push({
                        type: 'MISSING_PREREQUISITES',
                        semester: currentSem.semester,
                        semesterType: currentSem.semesterType,
                        course: course.code,
                        missing: missingPrereqs
                    });
                    this.validation.isValid = false;
                }

                // Check corequisites
                const missingCoreqs = (course.corequisites || [])
                    .filter(coreq => !semesterCodes.has(coreq));

                if (missingCoreqs.length > 0) {
                    this.validation.warnings.push({
                        type: 'MISSING_COREQUISITES',
                        semester: currentSem.semester,
                        semesterType: currentSem.semesterType,
                        course: course.code,
                        missing: missingCoreqs
                    });
                }
            }

            // Add current semester courses to previous
            currentSem.courses.forEach(c => previousCourses.add(c.code));
        }
    }

    validateCreditConstraints(sortedSchedule) {
        const regularSemesters = sortedSchedule.filter(s => s.semesterType === 'regular');
        const summerSemesters = sortedSchedule.filter(s => s.semesterType === 'summer');

        // Check regular semester constraints
        regularSemesters.forEach(sem => {
            if (sem.credits < this.options.minCreditsPerSemester) {
                this.validation.warnings.push({
                    type: 'INSUFFICIENT_CREDITS',
                    semester: sem.semester,
                    semesterType: sem.semesterType,
                    credits: sem.credits,
                    minimum: this.options.minCreditsPerSemester
                });
            }

            if (sem.credits > this.options.maxCreditsPerSemester) {
                if (this.options.allowOverload) {
                    this.validation.warnings.push({
                        type: 'CREDIT_OVERLOAD',
                        semester: sem.semester,
                        semesterType: sem.semesterType,
                        credits: sem.credits,
                        maximum: this.options.maxCreditsPerSemester
                    });
                } else {
                    this.validation.errors.push({
                        type: 'EXCESSIVE_CREDITS',
                        semester: sem.semester,
                        semesterType: sem.semesterType,
                        credits: sem.credits,
                        maximum: this.options.maxCreditsPerSemester
                    });
                    this.validation.isValid = false;
                }
            }
        });

        // Check summer semester constraints
        summerSemesters.forEach(sem => {
            if (sem.credits > this.options.maxSummerCredits) {
                this.validation.warnings.push({
                    type: 'EXCESSIVE_SUMMER_CREDITS',
                    semester: sem.semester,
                    semesterType: sem.semesterType,
                    credits: sem.credits,
                    maximum: this.options.maxSummerCredits
                });
            }
        });
    }

    validateLoadBalance(sortedSchedule) {
        const regularSemesters = sortedSchedule.filter(s => s.semesterType === 'regular');
        
        regularSemesters.forEach(sem => {
            // Check for too many difficult courses
            const difficultCourses = sem.courses.filter(c => (c.difficulty || 1) >= 4);
            if (difficultCourses.length > 2) {
                this.validation.warnings.push({
                    type: 'TOO_MANY_DIFFICULT_COURSES',
                    semester: sem.semester,
                    semesterType: sem.semesterType,
                    difficultCourses: difficultCourses.map(c => c.code)
                });
            }
        });

        // Check load distribution balance
        if (regularSemesters.length > 1) {
            const creditCounts = regularSemesters.map(s => s.credits);
            const maxCredits = Math.max(...creditCounts);
            const minCredits = Math.min(...creditCounts);

            if (maxCredits - minCredits > 8) {
                this.validation.warnings.push({
                    type: 'UNBALANCED_LOAD_DISTRIBUTION',
                    maxCredits,
                    minCredits,
                    difference: maxCredits - minCredits
                });
            }
        }
    }

    calculateStatistics(schedule) {
        const stats = {
            totalSemesters: schedule.length,
            regularSemesters: schedule.filter(s => s.semesterType === 'regular').length,
            summerSemesters: schedule.filter(s => s.semesterType === 'summer').length,
            totalCredits: 0,
            requiredCredits: 0,
            electiveCredits: 0,
            averageCreditsPerSemester: 0,
            averageCreditsPerRegularSemester: 0,
            advancedStudyCourses: 0,
            completionTimeInYears: 0,
            loadBalance: {
                minCredits: Infinity,
                maxCredits: 0,
                standardDeviation: 0
            }
        };

        const regularSemesterCredits = [];
        let totalAdvanced = 0;

        schedule.forEach(semester => {
            const semCredits = semester.credits;
            stats.totalCredits += semCredits;

            if (semester.semesterType === 'regular') {
                regularSemesterCredits.push(semCredits);
                stats.loadBalance.minCredits = Math.min(stats.loadBalance.minCredits, semCredits);
                stats.loadBalance.maxCredits = Math.max(stats.loadBalance.maxCredits, semCredits);
            }

            semester.courses.forEach(course => {
                if (course.isRequired) {
                    stats.requiredCredits += course.credits;
                } else {
                    stats.electiveCredits += course.credits;
                }

                if (course.expectedSemester > Math.floor(semester.semester)) {
                    totalAdvanced++;
                }
            });
        });

        stats.averageCreditsPerSemester = stats.totalCredits / stats.totalSemesters;
        
        if (stats.regularSemesters > 0) {
            stats.averageCreditsPerRegularSemester = 
                regularSemesterCredits.reduce((a, b) => a + b, 0) / stats.regularSemesters;
        }

        // Calculate standard deviation
        if (regularSemesterCredits.length > 1) {
            const mean = stats.averageCreditsPerRegularSemester;
            const variance = regularSemesterCredits.reduce((acc, credits) => 
                acc + Math.pow(credits - mean, 2), 0) / regularSemesterCredits.length;
            stats.loadBalance.standardDeviation = Math.sqrt(variance);
        }

        stats.advancedStudyCourses = totalAdvanced;

        // Calculate completion time
        const lastRegularSemester = schedule
            .filter(s => s.semesterType === 'regular')
            .reduce((max, sem) => Math.max(max, sem.semester), 0);
        stats.completionTimeInYears = Math.ceil(lastRegularSemester / 2);

        // Fix infinity values
        if (stats.loadBalance.minCredits === Infinity) {
            stats.loadBalance.minCredits = 0;
        }

        return stats;
    }

    // Utility methods
    calculateSemesterLoad(courses) {
        return {
            totalCredits: courses.reduce((sum, c) => sum + c.credits, 0),
            requiredCount: courses.filter(c => c.isRequired).length,
            electiveCount: courses.filter(c => !c.isRequired).length,
            averageDifficulty: courses.reduce((sum, c) => sum + (c.difficulty || 1), 0) / courses.length
        };
    }

    calculateAverageCreditsPerSemester() {
        const totalCredits = this.curriculum.reduce((sum, course) => sum + course.credits, 0);
        const maxSemester = Math.max(...this.curriculum.map(c => c.expectedSemester || 1));
        return totalCredits / maxSemester;
    }

    allCoursesScheduled(takenCourses) {
        const scheduledCodes = new Set(takenCourses);
        return this.curriculum.every(course => 
            scheduledCodes.has(course.code) || 
            course.equivalents?.some(eq => scheduledCodes.has(eq))
        );
    }

    // Public API methods
    setCompletedCourses(courses) {
        this.completedCourses = courses;
        return this;
    }

    setOptions(options) {
        this.options = { ...this.options, ...options };
        return this;
    }

    generateOptimalPlan() {
        // Execute all 4 phases
        this.buildDAG();
        const readyCourses = this.findReadyCourses();
        const schedule = this.buildOptimalSchedule();
        const validation = this.validateSchedule(schedule);

        return {
            schedule,
            validation,
            readyCourses,
            graph: this.graph,
            statistics: validation.statistics
        };
    }

    // Analysis methods for recommendations
    analyzePlanOptimization(schedule, validation) {
        const recommendations = [];

        // Load balancing analysis
        const regularSems = schedule.filter(s => s.semesterType === 'regular');
        if (regularSems.length > 1) {
            const loads = regularSems.map(s => s.credits);
            const maxLoad = Math.max(...loads);
            const minLoad = Math.min(...loads);

            if (maxLoad - minLoad > 6) {
                recommendations.push({
                    type: 'LOAD_BALANCING',
                    priority: 'medium',
                    description: `Chênh lệch tải học tập: ${maxLoad - minLoad} tín chỉ`,
                    suggestion: 'Cân nhắc chuyển môn tự chọn từ học kỳ nặng sang nhẹ'
                });
            }
        }

        // Advanced study opportunities
        const missedOpportunities = this.findMissedAdvancedStudyOpportunities(schedule);
        if (missedOpportunities.length > 0) {
            recommendations.push({
                type: 'ADVANCED_STUDY_OPPORTUNITY',
                priority: 'low',
                description: `${missedOpportunities.length} cơ hội học vượt`,
                suggestion: 'Xem xét học vượt để rút ngắn thời gian'
            });
        }

        // Prerequisite bottlenecks
        const bottlenecks = this.findPrerequisiteBottlenecks();
        if (bottlenecks.length > 0) {
            recommendations.push({
                type: 'PREREQUISITE_BOTTLENECK',
                priority: 'high',
                description: `${bottlenecks.length} môn gây tắc nghẽn`,
                suggestion: 'Ưu tiên học sớm các môn này'
            });
        }

        return recommendations;
    }

    findMissedAdvancedStudyOpportunities(schedule) {
        const scheduledCourses = new Set(schedule.flatMap(s => s.courses.map(c => c.code)));
        const unscheduled = this.curriculum.filter(c => !scheduledCourses.has(c.code));

        return unscheduled.filter(course => {
            return (course.prerequisites || []).length <= 1 && 
                   !course.isRequired && 
                   course.credits <= 3;
        });
    }

    findPrerequisiteBottlenecks() {
        const dependentCounts = this.curriculum.map(course => ({
            ...course,
            dependentCount: this.graph.reverseList[course.code]?.length || 0
        }));

        return dependentCounts
            .filter(c => c.dependentCount >= 3)
            .sort((a, b) => b.dependentCount - a.dependentCount);
    }

    compareStrategies(completedCourses) {
        const strategies = [
            { name: 'Truyền thống', enableAdvancedStudy: false, includeSummerSemesters: false, strategy: 'balanced' },
            { name: 'Học vượt', enableAdvancedStudy: true, includeSummerSemesters: false, strategy: 'balanced' },
            { name: 'Học vượt + Hè', enableAdvancedStudy: true, includeSummerSemesters: true, strategy: 'fast' }
        ];

        return strategies.map(config => {
            const scheduler = new AcademicScheduler(this.curriculum);
            scheduler.setCompletedCourses(completedCourses);
            scheduler.setOptions(config);
            
            const result = scheduler.generateOptimalPlan();
            return {
                name: config.name,
                ...result.statistics
            };
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AcademicScheduler;
} else {
    window.AcademicScheduler = AcademicScheduler;
}
