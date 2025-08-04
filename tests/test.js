const curriculum = require("./data_test_v1.json");

/**
 * GIAI ĐOẠN 1: CẤU TRÚC DỮ LIỆU VÀ TIỀN XỬ LÝ
 */

// Xây dựng đồ thị DAG cho môn học
function buildDAG(curriculum) {
    const graph = {
        adjacencyList: {}, // Danh sách kề: course -> [dependencies]
        reverseList: {}, // Danh sách ngược: course -> [dependents]
        courseMap: new Map(), // Map để truy cập nhanh thông tin môn học
        groups: new Map(), // Nhóm môn học (tự chọn, chuyên sâu, etc.)
    };

    // Khởi tạo cấu trúc
    curriculum.forEach((course) => {
        graph.adjacencyList[course.code] = course.prerequisites || [];
        graph.reverseList[course.code] = [];
        graph.courseMap.set(course.code, course);
    });

    // Xây dựng danh sách ngược (dependents)
    curriculum.forEach((course) => {
        (course.prerequisites || []).forEach((prereq) => {
            if (graph.reverseList[prereq]) {
                graph.reverseList[prereq].push(course.code);
            }
        });
    });

    return graph;
}

// Đếm số môn phụ thuộc (trong mô hình DAG, đây là out-degree)
function countDependents(graph, courseCode) {
    return graph.reverseList[courseCode]?.length || 0;
}

// Tính toán độ ưu tiên của môn học
function calculatePriority(course, graph, completedCourses) {
    let priority = 0;

    // Ưu tiên 1: Môn bắt buộc
    if (course.isRequired) priority += 1000;

    // Ưu tiên 2: Số môn phụ thuộc (unlock nhiều môn)
    priority += countDependents(graph, course.code) * 100;

    // Ưu tiên 3: Học kỳ dự kiến sớm hơn
    priority += (10 - (course.expectedSemester || 10)) * 10;

    // Ưu tiên 4: Môn nền tảng (có nhiều prerequisites)
    priority += (course.prerequisites?.length || 0) * 5;

    return priority;
}

/**
 * GIAI ĐOẠN 2: XÁC ĐỊNH MÔN HỌC KHẢ DỤNG
 */

// Tìm các môn học sẵn sàng để đăng ký (topological approach) - Backward compatibility
function findReadyCourses(graph, completed, allCourses) {
    const completedSet = new Set(completed);

    return allCourses.filter((course) => {
        // Bỏ qua môn đã học
        if (completedSet.has(course.code)) return false;

        // Kiểm tra môn thay thế đã học chưa
        if (course.equivalents?.some((eq) => completedSet.has(eq)))
            return false;

        // Kiểm tra prerequisites
        const prereqs = course.prerequisites || [];
        const prereqsSatisfied = prereqs.every((p) => completedSet.has(p));

        return prereqsSatisfied;
    });
}

// Tìm các môn học sẵn sàng với khả năng học vượt
function findReadyCoursesAdvanced(graph, completed, allCourses, currentSemester, enableAdvancedStudy = true) {
    const completedSet = new Set(completed);

    return allCourses.filter((course) => {
        // Bỏ qua môn đã học
        if (completedSet.has(course.code)) return false;

        // Kiểm tra môn thay thế đã học chưa
        if (course.equivalents?.some((eq) => completedSet.has(eq)))
            return false;

        // Kiểm tra prerequisites
        const prereqs = course.prerequisites || [];
        const prereqsSatisfied = prereqs.every((p) => completedSet.has(p));

        if (!prereqsSatisfied) return false;

        // Nếu không cho phép học vượt, chỉ lấy môn của học kỳ hiện tại hoặc trước đó
        if (!enableAdvancedStudy) {
            return course.expectedSemester <= currentSemester;
        }

        // Cho phép học vượt với ràng buộc:
        // - Có thể học vượt tối đa 1 năm (2 học kỳ)
        // - Ưu tiên môn của học kỳ hiện tại và trước đó
        const maxAdvanceSemesters = 4; // Có thể học vượt tối đa 4 học kỳ (2 năm)
        return course.expectedSemester <= currentSemester + maxAdvanceSemesters;
    });
}

// Xây dựng học kỳ hè với focus vào học vượt thông minh
function buildSummerSemester(graph, taken, allCourses, selectedEquivalents, currentSemester, enableAdvancedStudy) {
    const maxSummerCredits = 12; // Giới hạn tín chỉ học kỳ hè
    const maxSummerCourses = 4; // Giới hạn số môn học kỳ hè
    
    // Tìm các môn có thể học vượt trong học kỳ hè
    const summerCandidates = findReadyCoursesAdvanced(
        graph,
        taken,
        allCourses,
        currentSemester + 2, // Có thể học vượt 1 năm trong học kỳ hè
        enableAdvancedStudy
    ).filter((course) => {
        // Loại bỏ môn đã chọn
        if (selectedEquivalents.has(course.code)) return false;
        
        // Ưu tiên các loại môn phù hợp với học kỳ hè:
        // 1. Môn lý thuyết (ít thực hành)
        // 2. Môn có ít tín chỉ
        // 3. Môn tự chọn
        // 4. Môn học vượt có lợi
        
        // Tránh môn có nhiều thực hành trong học kỳ hè
        const isPracticalCourse = course.name.toLowerCase().includes('thực hành') ||
                                 course.name.toLowerCase().includes('thí nghiệm') ||
                                 course.name.toLowerCase().includes('project');
        
        // Ưu tiên môn lý thuyết và môn ít tín chỉ
        return !isPracticalCourse || course.credits <= 2;
    });

    // Sắp xếp ưu tiên cho học kỳ hè với logic thông minh hơn
    const sortedSummerCourses = summerCandidates.sort((a, b) => {
        // 1. Ưu tiên môn học vượt có lợi (mở khóa nhiều môn)
        const depA = countDependents(graph, a.code);
        const depB = countDependents(graph, b.code);
        
        const isAdvanceA = a.expectedSemester > currentSemester;
        const isAdvanceB = b.expectedSemester > currentSemester;
        
        // Môn học vượt có lợi (có dependent) được ưu tiên cao nhất
        if (isAdvanceA && depA > 0 && (!isAdvanceB || depB === 0)) return -1;
        if (isAdvanceB && depB > 0 && (!isAdvanceA || depA === 0)) return 1;
        
        // 2. So sánh số môn phụ thuộc
        if (depA !== depB) return depB - depA;
        
        // 3. Ưu tiên môn học vượt
        if (isAdvanceA && !isAdvanceB) return -1;
        if (!isAdvanceA && isAdvanceB) return 1;
        
        // 4. Ưu tiên môn ít tín chỉ (phù hợp học kỳ hè)
        if (a.credits !== b.credits) return a.credits - b.credits;
        
        // 5. Ưu tiên môn tự chọn (linh hoạt hơn)
        if (!a.isRequired && b.isRequired) return -1;
        if (a.isRequired && !b.isRequired) return 1;
        
        // 6. Ưu tiên môn ít khó
        const diffA = a.difficulty || 1;
        const diffB = b.difficulty || 1;
        return diffA - diffB;
    });

    // Chọn môn cho học kỳ hè với thuật toán tối ưu
    const summerCourses = [];
    let summerCredits = 0;
    let summerCourseCount = 0;

    for (const course of sortedSummerCourses) {
        // Kiểm tra các ràng buộc
        if (summerCourseCount >= maxSummerCourses) break;
        if (summerCredits + course.credits > maxSummerCredits) continue;
        
        // Kiểm tra corequisites có thể thực hiện được không
        const coreqCourses = (course.corequisites || [])
            .map((c) => allCourses.find((x) => x.code === c))
            .filter((c) => c && !new Set(taken).has(c.code));
            
        const totalCreditsWithCoreq = course.credits + 
            coreqCourses.reduce((sum, c) => sum + c.credits, 0);
            
        if (summerCredits + totalCreditsWithCoreq <= maxSummerCredits &&
            summerCourseCount + 1 + coreqCourses.length <= maxSummerCourses) {
            
            summerCourses.push(course);
            summerCourses.push(...coreqCourses);
            summerCredits += totalCreditsWithCoreq;
            summerCourseCount += 1 + coreqCourses.length;
        } else if (summerCredits + course.credits <= maxSummerCredits) {
            summerCourses.push(course);
            summerCredits += course.credits;
            summerCourseCount++;
        }
    }

    return {
        courses: summerCourses,
        credits: summerCredits,
        load: calculateSemesterLoad(summerCourses),
    };
}

// Áp dụng chiến lược sắp xếp với xem xét học vượt
function applySortingStrategyAdvanced(courses, graph, taken, strategy, currentSemester) {
    switch (strategy) {
        case "fast":
            return sortForFastCompletionAdvanced(courses, graph, currentSemester);
        case "load-balanced":
            return sortForLoadBalanceAdvanced(courses, graph, currentSemester);
        case "balanced":
        default:
            return sortBalancedAdvanced(courses, graph, currentSemester);
    }
}

// Sắp xếp để hoàn thành nhanh nhất với xem xét học vượt
function sortForFastCompletionAdvanced(courses, graph, currentSemester) {
    return courses.sort((a, b) => {
        // Ưu tiên môn của học kỳ hiện tại trước
        const isCurrSemA = a.expectedSemester === currentSemester;
        const isCurrSemB = b.expectedSemester === currentSemester;
        
        if (isCurrSemA && !isCurrSemB) return -1;
        if (!isCurrSemA && isCurrSemB) return 1;

        // Ưu tiên môn mở khóa nhiều môn khác
        const depA = countDependents(graph, a.code);
        const depB = countDependents(graph, b.code);
        if (depA !== depB) return depB - depA;

        // Ưu tiên môn bắt buộc
        if (a.isRequired && !b.isRequired) return -1;
        if (!a.isRequired && b.isRequired) return 1;

        // Ưu tiên học kỳ dự kiến sớm hơn
        return (a.expectedSemester || 99) - (b.expectedSemester || 99);
    });
}

// Sắp xếp cân bằng tải với xem xét học vượt
function sortForLoadBalanceAdvanced(courses, graph, currentSemester) {
    return courses.sort((a, b) => {
        // Ưu tiên môn của học kỳ hiện tại
        const isCurrSemA = a.expectedSemester === currentSemester;
        const isCurrSemB = b.expectedSemester === currentSemester;
        
        if (isCurrSemA && !isCurrSemB) return -1;
        if (!isCurrSemA && isCurrSemB) return 1;

        const priorityA = calculatePriorityAdvanced(a, graph, currentSemester);
        const priorityB = calculatePriorityAdvanced(b, graph, currentSemester);

        // Cân nhắc độ khó
        const difficultyA = a.difficulty || 1;
        const difficultyB = b.difficulty || 1;

        return priorityB - difficultyB * 10 - (priorityA - difficultyA * 10);
    });
}

// Sắp xếp cân bằng với xem xét học vượt
function sortBalancedAdvanced(courses, graph, currentSemester) {
    return courses.sort((a, b) => {
        const priorityA = calculatePriorityAdvanced(a, graph, currentSemester);
        const priorityB = calculatePriorityAdvanced(b, graph, currentSemester);
        return priorityB - priorityA;
    });
}

// Tính toán độ ưu tiên với xem xét học vượt
function calculatePriorityAdvanced(course, graph, currentSemester) {
    let priority = 0;

    // Ưu tiên 1: Môn của học kỳ hiện tại
    if (course.expectedSemester === currentSemester) priority += 2000;

    // Ưu tiên 2: Môn bắt buộc
    if (course.isRequired) priority += 1000;

    // Ưu tiên 3: Số môn phụ thuộc (unlock nhiều môn)
    priority += countDependents(graph, course.code) * 100;

    // Ưu tiên 4: Môn nền tảng (có nhiều prerequisites)
    priority += (course.prerequisites?.length || 0) * 50;

    // Ưu tiên 5: Học kỳ dự kiến (càng sớm càng ưu tiên)
    priority += (10 - (course.expectedSemester || 10)) * 10;

    // Penalty cho môn học vượt quá xa
    const advanceDistance = Math.max(0, course.expectedSemester - currentSemester);
    priority -= advanceDistance * 20;

    return priority;
}

// Kiểm tra ràng buộc corequisites
function validateCorequisites(selectedCourses, course) {
    if (!course.corequisites || course.corequisites.length === 0) {
        return { valid: true, requiredCoreqs: [] };
    }

    const selectedCodes = new Set(selectedCourses.map((c) => c.code));
    const requiredCoreqs = course.corequisites.filter(
        (coreq) => !selectedCodes.has(coreq)
    );

    return {
        valid: requiredCoreqs.length === 0,
        requiredCoreqs,
    };
}

// Tính toán tải học tập cho học kỳ
function calculateSemesterLoad(courses) {
    return {
        totalCredits: courses.reduce((sum, c) => sum + c.credits, 0),
        requiredCount: courses.filter((c) => c.isRequired).length,
        electiveCount: courses.filter((c) => !c.isRequired).length,
        difficulty:
            courses.reduce((sum, c) => sum + (c.difficulty || 1), 0) /
            courses.length,
    };
}

/**
 * GIAI ĐOẠN 3: THUẬT TOÁN LẬP LỊCH TỐI ỨU
 */

// Thuật toán lập lịch chính với nhiều chiến lược được cải tiến
function buildOptimalPlan(curriculum, completedCourses, options = {}) {
    const {
        maxCreditsPerSemester = null,
        strategy = "balanced", // 'fast', 'balanced', 'load-balanced'
        allowOverload = false,
        prioritizeRequired = true,
        enableAdvancedStudy = true, // Cho phép học vượt
        includeSummerSemesters = true, // Bao gồm học kỳ hè
        fixedFirstSemester = true, // Cố định học kỳ 1 năm 1
    } = options;

    const graph = buildDAG(curriculum);
    const allCourses = curriculum;
    const taken = new Set(completedCourses);
    const plan = [];
    const selectedEquivalents = new Set();

    // Tính toán maxCreditsPerSemester động
    const dynamicMaxCredits =
        maxCreditsPerSemester || getDynamicMaxCredits(curriculum, 1);

    // Xử lý học kỳ 1 năm 1 cố định
    if (fixedFirstSemester && plan.length === 0) {
        const firstSemesterCourses = curriculum.filter(
            course => course.expectedSemester === 1
        );
        
        if (firstSemesterCourses.length > 0) {
            // Lọc ra những môn chưa học và có thể học được (đáp ứng prerequisites)
            const availableFirstSem = firstSemesterCourses.filter(course => {
                // Chưa học
                if (taken.has(course.code)) return false;
                
                // Chưa học môn thay thế
                if (course.equivalents?.some((eq) => taken.has(eq))) return false;
                
                // Kiểm tra prerequisites (thường HK1 không có prerequisites)
                const prereqs = course.prerequisites || [];
                return prereqs.every((p) => taken.has(p));
            });
            
            if (availableFirstSem.length > 0) {
                // Sắp xếp theo độ ưu tiên (môn bắt buộc trước, sau đó theo tín chỉ)
                availableFirstSem.sort((a, b) => {
                    if (a.isRequired && !b.isRequired) return -1;
                    if (!a.isRequired && b.isRequired) return 1;
                    return b.credits - a.credits; // Ưu tiên môn nhiều tín chỉ
                });

                // Thêm tất cả môn HK1 còn lại hoặc đến khi đạt giới hạn tín chỉ
                const firstSemesterSelected = [];
                let firstSemCredits = 0;
                const maxFirstSemCredits = Math.min(dynamicMaxCredits, 25); // Giới hạn HK1

                for (const course of availableFirstSem) {
                    if (firstSemCredits + course.credits <= maxFirstSemCredits) {
                        firstSemesterSelected.push(course);
                        firstSemCredits += course.credits;
                        taken.add(course.code);
                        course.equivalents?.forEach((eq) => selectedEquivalents.add(eq));
                    }
                }

                if (firstSemesterSelected.length > 0) {
                    plan.push({
                        semester: 1,
                        semesterType: "regular",
                        year: 1,
                        courses: firstSemesterSelected,
                        load: calculateSemesterLoad(firstSemesterSelected),
                        credits: firstSemCredits,
                        isFixed: true,
                    });
                }
            }
        }
    }

    let currentSemester = plan.length + 1;
    let currentYear = Math.ceil(currentSemester / 2);
    
    while (true) {
        // Tìm các môn sẵn sàng với khả năng học vượt
        const ready = findReadyCoursesAdvanced(
            graph,
            Array.from(taken),
            allCourses,
            currentSemester,
            enableAdvancedStudy
        ).filter((course) => !selectedEquivalents.has(course.code));

        if (ready.length === 0) {
            // Thử học kỳ hè nếu được bật
            if (includeSummerSemesters && currentSemester % 2 === 0) {
                const summerSemester = buildSummerSemester(
                    graph,
                    Array.from(taken),
                    allCourses,
                    selectedEquivalents,
                    currentSemester,
                    enableAdvancedStudy
                );
                
                if (summerSemester.courses.length > 0) {
                    summerSemester.courses.forEach((course) => {
                        taken.add(course.code);
                        course.equivalents?.forEach((eq) => selectedEquivalents.add(eq));
                    });

                    plan.push({
                        semester: currentSemester + 0.5, // 1.5, 2.5, etc. cho học kỳ hè
                        semesterType: "summer",
                        year: currentYear,
                        courses: summerSemester.courses,
                        load: summerSemester.load,
                        credits: summerSemester.credits,
                    });
                    
                    // Tiếp tục với học kỳ tiếp theo
                    currentSemester++;
                    currentYear = Math.ceil(currentSemester / 2);
                    continue;
                }
            }
            break;
        }

        // Áp dụng chiến lược sắp xếp với xem xét học vượt
        const sortedCourses = applySortingStrategyAdvanced(
            ready,
            graph,
            taken,
            strategy,
            currentSemester
        );

        // Xây dựng học kỳ với thuật toán tham lam cải tiến
        const semester = buildSemesterGreedy(
            sortedCourses,
            taken,
            selectedEquivalents,
            allCourses,
            dynamicMaxCredits,
            allowOverload
        );

        if (semester.courses.length === 0) break;

        // Cập nhật trạng thái
        semester.courses.forEach((course) => {
            taken.add(course.code);
            // Đánh dấu môn thay thế
            course.equivalents?.forEach((eq) => selectedEquivalents.add(eq));
        });

        plan.push({
            semester: currentSemester,
            semesterType: "regular",
            year: currentYear,
            courses: semester.courses,
            load: semester.load,
            credits: semester.credits,
        });

        currentSemester++;
        currentYear = Math.ceil(currentSemester / 2);
    }

    return plan;
}

// Áp dụng chiến lược sắp xếp khác nhau
function applySortingStrategy(courses, graph, taken, strategy) {
    switch (strategy) {
        case "fast":
            return sortForFastCompletion(courses, graph);
        case "load-balanced":
            return sortForLoadBalance(courses, graph);
        case "balanced":
        default:
            return sortBalanced(courses, graph);
    }
}

// Sắp xếp để hoàn thành nhanh nhất
function sortForFastCompletion(courses, graph) {
    return courses.sort((a, b) => {
        // Ưu tiên môn mở khóa nhiều môn khác
        const depA = countDependents(graph, a.code);
        const depB = countDependents(graph, b.code);
        if (depA !== depB) return depB - depA;

        // Ưu tiên môn bắt buộc
        if (a.isRequired && !b.isRequired) return -1;
        if (!a.isRequired && b.isRequired) return 1;

        // Ưu tiên học kỳ dự kiến sớm hơn
        return (a.expectedSemester || 99) - (b.expectedSemester || 99);
    });
}

// Sắp xếp cân bằng tải
function sortForLoadBalance(courses, graph) {
    return courses.sort((a, b) => {
        const priorityA = calculatePriority(a, graph);
        const priorityB = calculatePriority(b, graph);

        // Cân nhắc độ khó
        const difficultyA = a.difficulty || 1;
        const difficultyB = b.difficulty || 1;

        return priorityB - difficultyB * 10 - (priorityA - difficultyA * 10);
    });
}

// Sắp xếp cân bằng
function sortBalanced(courses, graph) {
    return courses.sort((a, b) => {
        const priorityA = calculatePriority(a, graph);
        const priorityB = calculatePriority(b, graph);
        return priorityB - priorityA;
    });
}

// Xây dựng học kỳ với thuật toán tham lam cải tiến
function buildSemesterGreedy(
    sortedCourses,
    taken,
    selectedEquivalents,
    allCourses,
    maxCredits,
    allowOverload
) {
    let semester = [];
    let credits = 0;
    const coreqQueue = []; // Hàng đợi cho corequisites

    for (const course of sortedCourses) {
        if (taken.has(course.code)) continue;

        // Kiểm tra môn thay thế
        if (course.equivalents?.some((eq) => taken.has(eq))) continue;

        // Tìm corequisites cần thiết
        const coreqCourses = (course.corequisites || [])
            .map((c) => allCourses.find((x) => x.code === c))
            .filter((c) => c && !taken.has(c.code));

        const totalCredits =
            course.credits +
            coreqCourses.reduce((sum, c) => sum + c.credits, 0);

        // Kiểm tra ràng buộc tín chỉ
        if (
            credits + totalCredits <= maxCredits ||
            (allowOverload && credits + totalCredits <= maxCredits * 1.2)
        ) {
            semester.push(course);
            coreqCourses.forEach((c) => semester.push(c));
            credits += totalCredits;

            // Đánh dấu equivalents
            course.equivalents?.forEach((eq) => selectedEquivalents.add(eq));
            coreqCourses.forEach((c) =>
                c.equivalents?.forEach((eq) => selectedEquivalents.add(eq))
            );
        }
    }

    return {
        courses: semester,
        credits: credits,
        load: calculateSemesterLoad(semester),
    };
}

/**
 * CÁC HÀM TIỆN ÍCH VÀ THỐNG KÊ
 */

function countCreditsPersemester(curriculum) {
    return curriculum.reduce((acc, course) => {
        const semester = course.expectedSemester || 1;
        if (!acc[semester]) acc[semester] = 0;
        acc[semester] += course.credits;
        return acc;
    }, {});
}

function getDynamicMaxCredits(curriculum, currentSemester) {
    const creditsPerSemester = countCreditsPersemester(curriculum);
    // Trả về số tín chỉ của học kỳ hiện tại, hoặc trung bình nếu không có
    if (creditsPerSemester[currentSemester]) {
        return creditsPerSemester[currentSemester];
    }
    // Fallback: tính trung bình
    const totalCredits = Object.values(creditsPerSemester).reduce(
        (sum, credits) => sum + credits,
        0
    );
    const totalSemesters = Object.keys(creditsPerSemester).length;
    return Math.ceil(totalCredits / totalSemesters);
}

/**
 * GIAI ĐOẠN 4: ĐÁNH GIÁ VÀ VALIDATION
 */

// Kiểm tra tính hợp lệ của kế hoạch với hỗ trợ học kỳ hè và học vượt
function validatePlan(plan, curriculum) {
    const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        statistics: {},
    };

    const allScheduledCourses = plan.flatMap((sem) => sem.courses);
    const scheduledCodes = new Set(allScheduledCourses.map((c) => c.code));

    // Sắp xếp plan theo thứ tự thời gian (bao gồm học kỳ hè)
    const sortedPlan = [...plan].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.semester - b.semester;
    });

    // Kiểm tra prerequisites và học vượt
    for (let i = 0; i < sortedPlan.length; i++) {
        const currentSem = sortedPlan[i];
        const semesterCodes = new Set(currentSem.courses.map((c) => c.code));
        const previousCourses = new Set();

        // Collect all courses from previous semesters (including summer)
        for (let j = 0; j < i; j++) {
            sortedPlan[j].courses.forEach((c) => previousCourses.add(c.code));
        }

        for (const course of currentSem.courses) {
            // Check prerequisites
            const missingPrereqs = (course.prerequisites || []).filter(
                (prereq) => !previousCourses.has(prereq)
            );

            if (missingPrereqs.length > 0) {
                validation.errors.push({
                    type: "MISSING_PREREQUISITES",
                    semester: currentSem.semester,
                    semesterType: currentSem.semesterType,
                    year: currentSem.year,
                    course: course.code,
                    missing: missingPrereqs,
                });
                validation.isValid = false;
            }

            // Check corequisites
            const missingCoreqs = (course.corequisites || []).filter(
                (coreq) => !semesterCodes.has(coreq)
            );

            if (missingCoreqs.length > 0) {
                validation.warnings.push({
                    type: "MISSING_COREQUISITES",
                    semester: currentSem.semester,
                    semesterType: currentSem.semesterType,
                    year: currentSem.year,
                    course: course.code,
                    missing: missingCoreqs,
                });
            }

            // Validate học vượt (chỉ cảnh báo nếu học vượt quá xa)
            const actualSemester = Math.floor(currentSem.semester);
            if (course.expectedSemester && course.expectedSemester > actualSemester + 4) {
                validation.warnings.push({
                    type: "EXCESSIVE_ADVANCE_STUDY",
                    semester: currentSem.semester,
                    semesterType: currentSem.semesterType,
                    year: currentSem.year,
                    course: course.code,
                    expectedSemester: course.expectedSemester,
                    actualSemester: actualSemester,
                });
            }
        }
    }

    // Kiểm tra tính cân bằng tải
    validateLoadBalance(sortedPlan, validation);

    // Tính thống kê
    validation.statistics = calculatePlanStatistics(plan, curriculum);

    return validation;
}

// Kiểm tra tính cân bằng tải học tập
function validateLoadBalance(sortedPlan, validation) {
    const regularSemesters = sortedPlan.filter(sem => sem.semesterType === "regular");
    const summerSemesters = sortedPlan.filter(sem => sem.semesterType === "summer");
    
    // Kiểm tra tải quá nặng trong học kỳ chính
    regularSemesters.forEach(sem => {
        if (sem.credits > 25) {
            validation.warnings.push({
                type: "HEAVY_SEMESTER_LOAD",
                semester: sem.semester,
                semesterType: sem.semesterType,
                year: sem.year,
                credits: sem.credits,
                maxRecommended: 22,
            });
        }
        
        // Kiểm tra quá nhiều môn khó
        const difficultCourses = sem.courses.filter(c => (c.difficulty || 1) >= 4);
        if (difficultCourses.length > 2) {
            validation.warnings.push({
                type: "TOO_MANY_DIFFICULT_COURSES",
                semester: sem.semester,
                semesterType: sem.semesterType,
                year: sem.year,
                difficultCourses: difficultCourses.map(c => c.code),
            });
        }
    });
    
    // Kiểm tra học kỳ hè
    summerSemesters.forEach(sem => {
        if (sem.credits > 12) {
            validation.warnings.push({
                type: "HEAVY_SUMMER_LOAD",
                semester: sem.semester,
                semesterType: sem.semesterType,
                year: sem.year,
                credits: sem.credits,
                maxRecommended: 12,
            });
        }
    });
    
    // Kiểm tra sự phân bổ đều
    if (regularSemesters.length > 1) {
        const creditCounts = regularSemesters.map(sem => sem.credits);
        const maxCredits = Math.max(...creditCounts);
        const minCredits = Math.min(...creditCounts);
        
        if (maxCredits - minCredits > 8) {
            validation.warnings.push({
                type: "UNBALANCED_LOAD_DISTRIBUTION",
                maxCredits,
                minCredits,
                difference: maxCredits - minCredits,
            });
        }
    }
}

// Tính thống kê kế hoạch với hỗ trợ học kỳ hè
function calculatePlanStatistics(plan, curriculum) {
    const stats = {
        totalSemesters: plan.length,
        regularSemesters: plan.filter(p => p.semesterType === "regular").length,
        summerSemesters: plan.filter(p => p.semesterType === "summer").length,
        totalCredits: 0,
        requiredCredits: 0,
        electiveCredits: 0,
        averageCreditsPerSemester: 0,
        averageCreditsPerRegularSemester: 0,
        remainingCourses: 0,
        advancedStudyCourses: 0,
        completionTimeInYears: 0,
        loadBalance: {
            minCredits: Infinity,
            maxCredits: 0,
            standardDeviation: 0,
        }
    };

    const regularSemesterCredits = [];
    let totalAdvanced = 0;

    plan.forEach((semester) => {
        const semCredits = semester.credits ||
            semester.courses.reduce((sum, c) => sum + c.credits, 0);
            
        stats.totalCredits += semCredits;
        
        if (semester.semesterType === "regular") {
            regularSemesterCredits.push(semCredits);
            stats.loadBalance.minCredits = Math.min(stats.loadBalance.minCredits, semCredits);
            stats.loadBalance.maxCredits = Math.max(stats.loadBalance.maxCredits, semCredits);
        }

        semester.courses.forEach((course) => {
            if (course.isRequired) {
                stats.requiredCredits += course.credits;
            } else {
                stats.electiveCredits += course.credits;
            }
            
            // Đếm môn học vượt
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

    // Tính độ lệch chuẩn của tải học tập
    if (regularSemesterCredits.length > 1) {
        const mean = stats.averageCreditsPerRegularSemester;
        const variance = regularSemesterCredits.reduce((acc, credits) => 
            acc + Math.pow(credits - mean, 2), 0) / regularSemesterCredits.length;
        stats.loadBalance.standardDeviation = Math.sqrt(variance);
    }

    // Đếm môn chưa lên lịch
    const scheduledCodes = new Set(
        plan.flatMap((sem) => sem.courses.map((c) => c.code))
    );
    stats.remainingCourses = curriculum.filter(
        (c) => !scheduledCodes.has(c.code)
    ).length;

    stats.advancedStudyCourses = totalAdvanced;

    // Tính thời gian hoàn thành (dựa trên học kỳ chính)
    const lastRegularSemester = plan
        .filter(p => p.semesterType === "regular")
        .reduce((max, sem) => Math.max(max, sem.semester), 0);
    stats.completionTimeInYears = Math.ceil(lastRegularSemester / 2);

    // Fix infinity values
    if (stats.loadBalance.minCredits === Infinity) {
        stats.loadBalance.minCredits = 0;
    }

    return stats;
}

/**
 * HÀM WRAPPER CHO THUẬT TOÁN CŨ (BACKWARD COMPATIBILITY)
 */
function buildPlan(curriculum, completedCourses, maxCreditsPerSemester = null) {
    const options = {
        maxCreditsPerSemester,
        strategy: "balanced",
    };

    return buildOptimalPlan(curriculum, completedCourses, options);
}

/**
 * HÀM HIỂN THỊ VÀ TESTING
 */

function generateSchedule(completedCourses, options = {}) {
    console.log("=== THUẬT TOÁN LẬP LỊCH HỌC TỐI ỨU (CẢI TIẾN) ===\n");

    const plan = buildOptimalPlan(curriculum, completedCourses, options);
    const validation = validatePlan(plan, curriculum);

    // Hiển thị kế hoạch với thông tin năm học và học kỳ hè
    plan.forEach((block) => {
        const semesterType = block.semesterType === "summer" ? " (Học kỳ hè)" : "";
        const fixedInfo = block.isFixed ? " [CỐ ĐỊNH]" : "";
        const yearInfo = ` - Năm ${block.year}`;
        
        console.log(
            `🎓 Học kỳ ${block.semester}${yearInfo}${semesterType}${fixedInfo} (${
                block.credits ||
                block.courses.reduce((sum, c) => sum + c.credits, 0)
            } tín chỉ):`
        );

        block.courses.forEach((course) => {
            const prefix = course.isRequired ? "📌" : "📝";
            const prereqInfo =
                course.prerequisites?.length > 0
                    ? ` [Tiên quyết: ${course.prerequisites.join(", ")}]`
                    : "";
            
            // Hiển thị thông tin học vượt
            const advanceInfo = course.expectedSemester > block.semester 
                ? ` 🚀[Học vượt từ HK${course.expectedSemester}]` 
                : "";
                
            console.log(
                `  ${prefix} ${course.code}: ${course.name} (${course.credits} tín chỉ)${prereqInfo}${advanceInfo}`
            );
        });

        // Hiển thị thông tin tải học tập
        if (block.load) {
            console.log(
                `     📊 Tải: ${block.load.requiredCount} bắt buộc, ${block.load.electiveCount} tự chọn`
            );
            if (block.semesterType === "summer") {
                const advancedCourses = block.courses.filter(c => c.expectedSemester > block.semester);
                if (advancedCourses.length > 0) {
                    console.log(`     🚀 Học vượt: ${advancedCourses.length} môn`);
                }
            }
        }
        console.log("");
    });

    // Hiển thị thống kê chi tiết với thông tin học kỳ hè
    console.log("📈 THỐNG KÊ CHI TIẾT:");
    console.log(`   • Tổng học kỳ chính: ${validation.statistics.regularSemesters}`);
    if (validation.statistics.summerSemesters > 0) {
        console.log(`   • Học kỳ hè: ${validation.statistics.summerSemesters}`);
    }
    console.log(`   • Thời gian hoàn thành: ${validation.statistics.completionTimeInYears} năm`);
    console.log(`   • Tổng tín chỉ: ${validation.statistics.totalCredits}`);
    console.log(`   • Bắt buộc: ${validation.statistics.requiredCredits} tín chỉ`);
    console.log(`   • Tự chọn: ${validation.statistics.electiveCredits} tín chỉ`);
    console.log(
        `   • Trung bình/học kỳ: ${validation.statistics.averageCreditsPerSemester.toFixed(1)} tín chỉ`
    );
    
    if (validation.statistics.regularSemesters > 0) {
        console.log(
            `   • Trung bình/học kỳ chính: ${validation.statistics.averageCreditsPerRegularSemester.toFixed(1)} tín chỉ`
        );
        
        // Thông tin cân bằng tải
        if (validation.statistics.loadBalance.standardDeviation > 0) {
            console.log(`   • Tải học tập: ${validation.statistics.loadBalance.minCredits}-${validation.statistics.loadBalance.maxCredits} tín chỉ`);
            console.log(`   • Độ lệch chuẩn: ${validation.statistics.loadBalance.standardDeviation.toFixed(1)}`);
        }
    }
    
    // Thống kê học vượt
    if (validation.statistics.advancedStudyCourses > 0) {
        console.log(`   • Môn học vượt: ${validation.statistics.advancedStudyCourses} môn`);
        
        // Chi tiết môn học vượt theo học kỳ hè
        const summerAdvanced = plan
            .filter(sem => sem.semesterType === "summer")
            .reduce((count, sem) => 
                count + sem.courses.filter(c => c.expectedSemester > Math.floor(sem.semester)).length, 0);
        
        if (summerAdvanced > 0) {
            console.log(`     ∘ Học vượt trong kỳ hè: ${summerAdvanced} môn`);
        }
    }
    
    console.log(`   • Môn còn lại: ${validation.statistics.remainingCourses}`);

    // Hiển thị cảnh báo/lỗi với thông tin chi tiết
    if (validation.errors.length > 0) {
        console.log("\n❌ LỖI:");
        validation.errors.forEach((error) => {
            const semInfo = error.semesterType === "summer" ? " (Hè)" : "";
            console.log(
                `   • ${error.type}: ${error.course} ở HK${error.semester}${semInfo} - Năm ${error.year}`
            );
            if (error.missing && error.missing.length > 0) {
                console.log(`     Thiếu: ${error.missing.join(", ")}`);
            }
        });
    }

    if (validation.warnings.length > 0) {
        console.log("\n⚠️ CẢNH BÁO:");
        validation.warnings.forEach((warning) => {
            const semInfo = warning.semesterType === "summer" ? " (Hè)" : "";
            console.log(
                `   • ${warning.type}: ${warning.course} ở HK${warning.semester}${semInfo} - Năm ${warning.year}`
            );
            
            // Thông tin chi tiết cho từng loại cảnh báo
            if (warning.missing && warning.missing.length > 0) {
                console.log(`     Thiếu: ${warning.missing.join(", ")}`);
            } else if (warning.credits) {
                console.log(`     Tín chỉ: ${warning.credits}/${warning.maxRecommended}`);
            } else if (warning.difficultCourses) {
                console.log(`     Môn khó: ${warning.difficultCourses.join(", ")}`);
            } else if (warning.expectedSemester && warning.actualSemester) {
                console.log(`     Học vượt: HK${warning.expectedSemester} → HK${warning.actualSemester}`);
            }
        });
    }

    return { plan, validation };
}

// Test với các chiến lược khác nhau và tính năng mới
function testStrategies(completedCourses = []) {
    console.log("=== SO SÁNH CÁC CHIẾN LƯỢC VÀ TÍNH NĂNG ===\n");

    const strategies = [
        { 
            name: "Cân bằng (Không học vượt)", 
            strategy: "balanced",
            enableAdvancedStudy: false,
            includeSummerSemesters: false
        },
        { 
            name: "Cân bằng (Có học vượt)", 
            strategy: "balanced",
            enableAdvancedStudy: true,
            includeSummerSemesters: false
        },
        { 
            name: "Hoàn thành nhanh (Có học vượt + học kỳ hè)", 
            strategy: "fast",
            enableAdvancedStudy: true,
            includeSummerSemesters: true
        },
        { 
            name: "Cân bằng tải (Có học vượt + học kỳ hè)", 
            strategy: "load-balanced",
            enableAdvancedStudy: true,
            includeSummerSemesters: true
        },
    ];

    strategies.forEach(({ name, strategy, enableAdvancedStudy, includeSummerSemesters }) => {
        console.log(`🔍 Chiến lược: ${name}`);
        const result = generateSchedule(completedCourses, { 
            strategy,
            enableAdvancedStudy,
            includeSummerSemesters
        });
        console.log("─".repeat(80));
    });
}

// Hàm phân tích và đề xuất tối ưu hóa kế hoạch
function analyzePlanOptimization(plan, validation, curriculum) {
    const recommendations = [];
    
    // 1. Phân tích tải học tập
    const regularSems = plan.filter(p => p.semesterType === "regular");
    if (regularSems.length > 1) {
        const loads = regularSems.map(s => s.credits);
        const maxLoad = Math.max(...loads);
        const minLoad = Math.min(...loads);
        
        if (maxLoad - minLoad > 6) {
            recommendations.push({
                type: "LOAD_BALANCING",
                priority: "medium",
                description: `Cân bằng tải: Chênh lệch ${maxLoad - minLoad} tín chỉ giữa học kỳ nặng nhất và nhẹ nhất`,
                suggestion: "Cân nhắc chuyển một số môn tự chọn từ học kỳ nặng sang học kỳ nhẹ"
            });
        }
    }
    
    // 2. Phân tích cơ hội học vượt
    const missedOpportunities = findMissedAdvancedStudyOpportunities(plan, curriculum);
    if (missedOpportunities.length > 0) {
        recommendations.push({
            type: "ADVANCED_STUDY_OPPORTUNITY",
            priority: "low",
            description: `Có ${missedOpportunities.length} cơ hội học vượt có thể tận dụng`,
            details: missedOpportunities.slice(0, 3).map(c => c.code),
            suggestion: "Xem xét học vượt để rút ngắn thời gian tốt nghiệp"
        });
    }
    
    // 3. Phân tích học kỳ hè
    const summerSems = plan.filter(p => p.semesterType === "summer");
    if (summerSems.length === 0 && validation.statistics.remainingCourses === 0) {
        recommendations.push({
            type: "SUMMER_UTILIZATION",
            priority: "low",
            description: "Không sử dụng học kỳ hè",
            suggestion: "Có thể sử dụng học kỳ hè để học vượt và rút ngắn thời gian"
        });
    }
    
    // 4. Phân tích prerequisite bottlenecks
    const bottlenecks = findPrerequisiteBottlenecks(plan, curriculum);
    if (bottlenecks.length > 0) {
        recommendations.push({
            type: "PREREQUISITE_BOTTLENECK",
            priority: "high",
            description: `Phát hiện ${bottlenecks.length} môn gây tắc nghẽn`,
            details: bottlenecks.map(b => b.code),
            suggestion: "Ưu tiên học sớm các môn này để mở khóa nhiều môn khác"
        });
    }
    
    return recommendations;
}

// Tìm cơ hội học vượt bị bỏ lỡ
function findMissedAdvancedStudyOpportunities(plan, curriculum) {
    const scheduledCourses = new Set(plan.flatMap(s => s.courses.map(c => c.code)));
    const unscheduled = curriculum.filter(c => !scheduledCourses.has(c.code));
    
    return unscheduled.filter(course => {
        // Các môn có thể học vượt dễ dàng
        return (course.prerequisites || []).length <= 1 && 
               !course.isRequired && 
               course.credits <= 3;
    });
}

// Tìm các môn gây tắc nghẽn
function findPrerequisiteBottlenecks(plan, curriculum) {
    const graph = buildDAG(curriculum);
    const dependentCounts = curriculum.map(course => ({
        ...course,
        dependentCount: countDependents(graph, course.code)
    }));
    
    return dependentCounts
        .filter(c => c.dependentCount >= 3)
        .sort((a, b) => b.dependentCount - a.dependentCount);
}

// Hàm demo các tính năng mới với phân tích tối ưu
function demoAdvancedFeatures() {
    console.log("=== DEMO TÍNH NĂNG MỚI VÀ PHÂN TÍCH TỐI ỨU ===\n");
    
    // Demo với sinh viên đã học một số môn
    const completedSample = ["1010245", "1010038", "1050074", "1050124"];
    
    console.log("📚 Sinh viên đã hoàn thành các môn:", completedSample.join(", "));
    console.log("\n");
    
    const result = generateSchedule(completedSample, {
        strategy: "fast",
        enableAdvancedStudy: true,
        includeSummerSemesters: true,
        maxCreditsPerSemester: 22,
        allowOverload: true
    });
    
    // Phân tích và đưa ra khuyến nghị
    console.log("\n🔍 PHÂN TÍCH VÀ KHUYẾN NGHỊ TỐI ỨU:");
    const recommendations = analyzePlanOptimization(result.plan, result.validation, curriculum);
    
    if (recommendations.length > 0) {
        recommendations.forEach((rec, index) => {
            const priorityIcon = rec.priority === "high" ? "🔴" : 
                                rec.priority === "medium" ? "🟡" : "🟢";
            
            console.log(`\n${priorityIcon} ${index + 1}. ${rec.type}:`);
            console.log(`   📋 ${rec.description}`);
            console.log(`   💡 ${rec.suggestion}`);
            
            if (rec.details && rec.details.length > 0) {
                console.log(`   📝 Chi tiết: ${rec.details.join(", ")}`);
            }
        });
    } else {
        console.log("✅ Kế hoạch đã được tối ưu tốt!");
    }
    
    return result;
}

// Hàm so sánh hiệu quả của các chiến lược
function compareStrategies(completedCourses = []) {
    console.log("=== SO SÁNH HIỆU QUẢ CÁC CHIẾN LƯỢC ===\n");
    
    const strategies = [
        { name: "Truyền thống", enableAdvancedStudy: false, includeSummerSemesters: false, strategy: "balanced" },
        { name: "Học vượt", enableAdvancedStudy: true, includeSummerSemesters: false, strategy: "balanced" },
        { name: "Học vượt + Hè", enableAdvancedStudy: true, includeSummerSemesters: true, strategy: "fast" },
    ];
    
    const results = strategies.map(config => {
        const plan = buildOptimalPlan(curriculum, completedCourses, config);
        const validation = validatePlan(plan, curriculum);
        return {
            name: config.name,
            plan,
            stats: validation.statistics
        };
    });
    
    console.log("📊 BẢNG SO SÁNH:");
    console.log("┌─────────────────┬──────────┬─────────────┬───────────────┬─────────────┐");
    console.log("│ Chiến lược      │ Thời gian│ HK chính    │ HK hè         │ Học vượt    │");
    console.log("├─────────────────┼──────────┼─────────────┼───────────────┼─────────────┤");
    
    results.forEach(result => {
        const name = result.name.padEnd(15);
        const time = `${result.stats.completionTimeInYears} năm`.padEnd(8);
        const regular = `${result.stats.regularSemesters}`.padEnd(11);
        const summer = `${result.stats.summerSemesters}`.padEnd(13);
        const advanced = `${result.stats.advancedStudyCourses}`.padEnd(11);
        
        console.log(`│ ${name} │ ${time} │ ${regular} │ ${summer} │ ${advanced} │`);
    });
    
    console.log("└─────────────────┴──────────┴─────────────┴───────────────┴─────────────┘");
    
    return results;
}

// Ví dụ sử dụng với tính năng mới
console.log("🎯 KẾ HOẠCH MẶC ĐỊNH (Có học vượt + học kỳ hè):");
generateSchedule([], {
    enableAdvancedStudy: true,
    includeSummerSemesters: true,
    strategy: "balanced"
});

console.log("\n" + "=".repeat(80) + "\n");

console.log("🎯 KẾ HOẠCH TRUYỀN THỐNG (Không học vượt):");
generateSchedule([], {
    enableAdvancedStudy: false,
    includeSummerSemesters: false,
    strategy: "balanced"
});

// Uncomment để test các tính năng mới
// console.log("\n" + "=".repeat(80) + "\n");
// testStrategies([]);
// console.log("\n" + "=".repeat(80) + "\n");
// demoAdvancedFeatures();
// console.log("\n" + "=".repeat(80) + "\n");
// compareStrategies([]);

// console.log(countCreditsPersemester(curriculum));

/**
 * EXPORTS CHO MODULE
 */
module.exports = {
    // Core functions
    buildDAG,
    buildOptimalPlan,
    buildPlan,

    // Advanced functions
    findReadyCoursesAdvanced,
    buildSummerSemester,
    applySortingStrategyAdvanced,
    calculatePriorityAdvanced,

    // Analysis and optimization
    analyzePlanOptimization,
    findMissedAdvancedStudyOpportunities,
    findPrerequisiteBottlenecks,
    validateLoadBalance,

    // Validation and analysis
    validatePlan,
    calculatePlanStatistics,

    // Utility functions
    findReadyCourses, // Giữ lại cho backward compatibility
    calculatePriority,
    countDependents,
    getDynamicMaxCredits,

    // Display functions
    generateSchedule,
    testStrategies,
    demoAdvancedFeatures,
    compareStrategies,

    // Data
    curriculum,
};
