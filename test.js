const curriculum = require("./data.json");

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

// Tìm các môn học sẵn sàng để đăng ký (topological approach)
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

// Thuật toán lập lịch chính với nhiều chiến lược
function buildOptimalPlan(curriculum, completedCourses, options = {}) {
    const {
        maxCreditsPerSemester = null,
        strategy = "balanced", // 'fast', 'balanced', 'load-balanced'
        allowOverload = false,
        prioritizeRequired = true,
    } = options;

    const graph = buildDAG(curriculum);
    const allCourses = curriculum;
    const taken = new Set(completedCourses);
    const plan = [];
    const selectedEquivalents = new Set();

    // Tính toán maxCreditsPerSemester động
    const dynamicMaxCredits =
        maxCreditsPerSemester || getDynamicMaxCredits(curriculum, 1);

    while (true) {
        // Tìm các môn sẵn sàng
        const ready = findReadyCourses(
            graph,
            Array.from(taken),
            allCourses
        ).filter((course) => !selectedEquivalents.has(course.code));

        if (ready.length === 0) break;

        // Áp dụng chiến lược sắp xếp
        const sortedCourses = applySortingStrategy(
            ready,
            graph,
            taken,
            strategy
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
            semester: plan.length + 1,
            courses: semester.courses,
            load: semester.load,
            credits: semester.credits,
        });
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

// Kiểm tra tính hợp lệ của kế hoạch
function validatePlan(plan, curriculum) {
    const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        statistics: {},
    };

    const allScheduledCourses = plan.flatMap((sem) => sem.courses);
    const scheduledCodes = new Set(allScheduledCourses.map((c) => c.code));

    // Kiểm tra prerequisites
    for (const semester of plan) {
        const semesterCodes = new Set(semester.courses.map((c) => c.code));
        const previousCourses = new Set();

        // Collect all courses from previous semesters
        const prevSemesters = plan.slice(0, semester.semester - 1);
        prevSemesters.forEach((sem) =>
            sem.courses.forEach((c) => previousCourses.add(c.code))
        );

        for (const course of semester.courses) {
            // Check prerequisites
            const missingPrereqs = (course.prerequisites || []).filter(
                (prereq) => !previousCourses.has(prereq)
            );

            if (missingPrereqs.length > 0) {
                validation.errors.push({
                    type: "MISSING_PREREQUISITES",
                    semester: semester.semester,
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
                    semester: semester.semester,
                    course: course.code,
                    missing: missingCoreqs,
                });
            }
        }
    }

    // Tính thống kê
    validation.statistics = calculatePlanStatistics(plan, curriculum);

    return validation;
}

// Tính thống kê kế hoạch
function calculatePlanStatistics(plan, curriculum) {
    const stats = {
        totalSemesters: plan.length,
        totalCredits: 0,
        requiredCredits: 0,
        electiveCredits: 0,
        averageCreditsPerSemester: 0,
        remainingCourses: 0,
    };

    plan.forEach((semester) => {
        stats.totalCredits +=
            semester.credits ||
            semester.courses.reduce((sum, c) => sum + c.credits, 0);

        semester.courses.forEach((course) => {
            if (course.isRequired) {
                stats.requiredCredits += course.credits;
            } else {
                stats.electiveCredits += course.credits;
            }
        });
    });

    stats.averageCreditsPerSemester = stats.totalCredits / stats.totalSemesters;

    // Đếm môn chưa lên lịch
    const scheduledCodes = new Set(
        plan.flatMap((sem) => sem.courses.map((c) => c.code))
    );
    stats.remainingCourses = curriculum.filter(
        (c) => !scheduledCodes.has(c.code)
    ).length;

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
    console.log("=== THUẬT TOÁN LẬP LỊCH HỌC TỐI ỨU ===\n");

    const plan = buildOptimalPlan(curriculum, completedCourses, options);
    const validation = validatePlan(plan, curriculum);

    // Hiển thị kế hoạch
    plan.forEach((block) => {
        console.log(
            `🎓 Học kỳ ${block.semester} (${
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
            console.log(
                `  ${prefix} ${course.code}: ${course.name} (${course.credits} tín chỉ)${prereqInfo}`
            );
        });

        // Hiển thị thông tin tải học tập
        if (block.load) {
            console.log(
                `     📊 Tải: ${block.load.requiredCount} bắt buộc, ${block.load.electiveCount} tự chọn`
            );
        }
        console.log("");
    });

    // Hiển thị thống kê
    console.log("📈 THỐNG KÊ:");
    console.log(`   • Tổng học kỳ: ${validation.statistics.totalSemesters}`);
    console.log(`   • Tổng tín chỉ: ${validation.statistics.totalCredits}`);
    console.log(
        `   • Trung bình/học kỳ: ${validation.statistics.averageCreditsPerSemester.toFixed(
            1
        )} tín chỉ`
    );
    console.log(`   • Môn còn lại: ${validation.statistics.remainingCourses}`);

    // Hiển thị cảnh báo/lỗi
    if (validation.errors.length > 0) {
        console.log("\n❌ LỖI:");
        validation.errors.forEach((error) => {
            console.log(
                `   • ${error.type}: ${error.course} ở học kỳ ${error.semester}`
            );
        });
    }

    if (validation.warnings.length > 0) {
        console.log("\n⚠️ CẢNH BÁO:");
        validation.warnings.forEach((warning) => {
            console.log(
                `   • ${warning.type}: ${warning.course} ở học kỳ ${warning.semester}`
            );
        });
    }

    return { plan, validation };
}

// Test với các chiến lược khác nhau
function testStrategies(completedCourses = []) {
    console.log("=== SO SÁNH CÁC CHIẾN LƯỢC ===\n");

    const strategies = [
        { name: "Cân bằng", strategy: "balanced" },
        { name: "Hoàn thành nhanh", strategy: "fast" },
        { name: "Cân bằng tải", strategy: "load-balanced" },
    ];

    strategies.forEach(({ name, strategy }) => {
        console.log(`🔍 Chiến lược: ${name}`);
        const result = generateSchedule(completedCourses, { strategy });
        console.log("─".repeat(60));
    });
}

// Ví dụ sử dụng
generateSchedule([]); // Kế hoạch từ đầu

// Uncomment để test các chiến lược
// testStrategies([]);

// console.log(countCreditsPersemester(curriculum));

/**
 * EXPORTS CHO MODULE
 */
module.exports = {
    // Core functions
    buildDAG,
    buildOptimalPlan,
    buildPlan,

    // Validation and analysis
    validatePlan,
    calculatePlanStatistics,

    // Utility functions
    findReadyCourses,
    calculatePriority,
    countDependents,
    getDynamicMaxCredits,

    // Display functions
    generateSchedule,
    testStrategies,

    // Data
    curriculum,
};
