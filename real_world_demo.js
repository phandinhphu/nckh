const {
    buildOptimalPlan,
    validatePlan,
    generateSchedule,
    curriculum,
} = require("./test.js");

/**
 * DEMO VỚI CÁC KỊCH BẢN THỰC TẾ
 */

console.log("🎓 DEMO THUẬT TOÁN LẬP LỊCH HỌC TỐI ỨU");
console.log("=".repeat(50));

// Kịch bản 1: Sinh viên mới
console.log("\n📚 KỊCH BẢN 1: SINH VIÊN MỚI");
console.log("-".repeat(30));
const newStudentPlan = generateSchedule([], {
    strategy: "balanced",
    maxCreditsPerSemester: 16,
});

// Kịch bản 2: Sinh viên năm 2
console.log("\n📚 KỊCH BẢN 2: SINH VIÊN ĐÃ HỌC NĂM 1");
console.log("-".repeat(30));
const year2Completed = [
    "1130299", // Triết học Mác-Lênin
    "1090061", // Tiếng Anh 1
    "1050273", // Nhập môn lập trình
    "1010013", // Toán cao cấp A1
    "1010014", // Toán cao cấp A2
    "1050016", // Hệ quản trị cơ sở dữ liệu
    "1050041", // Nhập môn công nghệ phần mềm
    "1010126", // Xác suất thống kê
];

const year2Plan = generateSchedule(year2Completed, {
    strategy: "fast",
    maxCreditsPerSemester: 18,
});

// Kịch bản 3: Sinh viên muốn tốt nghiệp nhanh
console.log("\n📚 KỊCH BẢN 3: TỐT NGHIỆP NHANH (20 TÍN CHỈ/HK)");
console.log("-".repeat(30));
const fastPlan = generateSchedule([], {
    strategy: "fast",
    maxCreditsPerSemester: 20,
    allowOverload: true,
});

// Kịch bản 4: Sinh viên làm thêm (tải nhẹ)
console.log("\n📚 KỊCH BẢN 4: SINH VIÊN LÀM THÊM (12 TÍN CHỈ/HK)");
console.log("-".repeat(30));
const lightLoadPlan = generateSchedule([], {
    strategy: "load-balanced",
    maxCreditsPerSemester: 12,
});

// So sánh các kịch bản
console.log("\n📊 SO SÁNH CÁC KỊCH BẢN");
console.log("=".repeat(50));

const scenarios = [
    { name: "Sinh viên mới (16 TC)", plan: newStudentPlan.plan },
    { name: "Sinh viên năm 2 (18 TC)", plan: year2Plan.plan },
    { name: "Tốt nghiệp nhanh (20 TC)", plan: fastPlan.plan },
    { name: "Tải nhẹ (12 TC)", plan: lightLoadPlan.plan },
];

scenarios.forEach((scenario) => {
    const validation = validatePlan(scenario.plan, curriculum);
    console.log(`\n🎯 ${scenario.name}:`);
    console.log(`   📅 Số học kỳ: ${scenario.plan.length}`);
    console.log(`   📊 Tổng tín chỉ: ${validation.statistics.totalCredits}`);
    console.log(
        `   ⚖️ TB tín chỉ/HK: ${validation.statistics.averageCreditsPerSemester.toFixed(
            1
        )}`
    );
    console.log(`   ✅ Hợp lệ: ${validation.isValid ? "Có" : "Không"}`);
    if (validation.errors.length > 0) {
        console.log(`   ❌ Lỗi: ${validation.errors.length}`);
    }
});

// Phân tích dependencies
console.log("\n🔍 PHÂN TÍCH DEPENDENCIES");
console.log("=".repeat(50));

// Tìm các môn không có prerequisites (có thể học ngay)
const noPrereqCourses = curriculum.filter(
    (course) => !course.prerequisites || course.prerequisites.length === 0
);

console.log(`\n🚀 Môn có thể học ngay (${noPrereqCourses.length} môn):`);
noPrereqCourses.slice(0, 10).forEach((course) => {
    console.log(`   • ${course.code}: ${course.name} (${course.credits} TC)`);
});

// Tìm các môn có nhiều prerequisites nhất
const complexCourses = curriculum
    .filter((course) => course.prerequisites && course.prerequisites.length > 0)
    .sort((a, b) => b.prerequisites.length - a.prerequisites.length)
    .slice(0, 5);

console.log(`\n🔗 Môn phức tạp nhất (nhiều tiên quyết):`);
complexCourses.forEach((course) => {
    console.log(`   • ${course.code}: ${course.name}`);
    console.log(`     Tiên quyết: ${course.prerequisites.join(", ")}`);
});

// Tính toán critical path
console.log("\n🛤️  CRITICAL PATH ANALYSIS");
console.log("=".repeat(50));

function findLongestPath(curriculum) {
    const graph = {};
    const depths = {};

    // Xây dựng graph
    curriculum.forEach((course) => {
        graph[course.code] = course.prerequisites || [];
        depths[course.code] = 0;
    });

    // Tính độ sâu của mỗi môn
    function calculateDepth(courseCode, visited = new Set()) {
        if (visited.has(courseCode)) return 0; // Tránh chu trình
        if (depths[courseCode] !== 0) return depths[courseCode];

        visited.add(courseCode);

        const prereqs = graph[courseCode] || [];
        if (prereqs.length === 0) {
            depths[courseCode] = 1;
        } else {
            depths[courseCode] =
                1 +
                Math.max(
                    ...prereqs.map((prereq) =>
                        calculateDepth(prereq, new Set(visited))
                    )
                );
        }

        return depths[courseCode];
    }

    curriculum.forEach((course) => {
        calculateDepth(course.code);
    });

    return depths;
}

const pathDepths = findLongestPath(curriculum);
const criticalCourses = Object.entries(pathDepths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

console.log("🎯 Critical Path (môn có chuỗi dependencies dài nhất):");
criticalCourses.forEach(([code, depth]) => {
    const course = curriculum.find((c) => c.code === code);
    if (course) {
        console.log(`   • ${code}: ${course.name} (depth: ${depth})`);
    }
});

console.log("\n✨ Demo completed!");
console.log("=".repeat(50));
