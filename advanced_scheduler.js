const curriculum = require("./data.json");

// Import thuật toán từ file chính
const {
    buildOptimalPlan,
    validatePlan,
    calculatePlanStatistics,
    testStrategies,
} = require("./test.js");

/**
 * DEMO CÁC TÍNH NĂNG NÂNG CAO
 */

// 1. So sánh các chiến lược lập lịch
function compareStrategies() {
    console.log("=== SO SÁNH CÁC CHIẾN LƯỢC LẬP LỊCH ===\n");

    const completedCourses = ["1130299", "1090061", "1050273"]; // Một số môn đã học
    const strategies = ["balanced", "fast", "load-balanced"];
    const results = {};

    strategies.forEach((strategy) => {
        console.log(`🔍 Chiến lược: ${strategy.toUpperCase()}`);

        const plan = buildOptimalPlan(curriculum, completedCourses, {
            strategy,
        });
        const validation = validatePlan(plan, curriculum);

        results[strategy] = {
            plan,
            validation,
            semesters: plan.length,
            totalCredits: validation.statistics.totalCredits,
            avgCredits: validation.statistics.averageCreditsPerSemester,
        };

        console.log(`   📊 Tổng học kỳ: ${plan.length}`);
        console.log(
            `   📈 Tổng tín chỉ: ${validation.statistics.totalCredits}`
        );
        console.log(
            `   ⚖️ TB tín chỉ/HK: ${validation.statistics.averageCreditsPerSemester.toFixed(
                1
            )}\n`
        );
    });

    return results;
}

// 2. Mô phỏng kế hoạch cho sinh viên đã học một số môn
function simulatePartialCompletion() {
    console.log("=== MÔ PHỎNG SINH VIÊN ĐÃ HỌC MỘT SỐ MÔN ===\n");

    // Sinh viên đã hoàn thành năm 1
    const year1Completed = [
        "1130299", // Triết học Mác-Lênin
        "1090061", // Tiếng Anh 1
        "1050273", // Nhập môn lập trình
        "1010013", // Toán cao cấp A1
        "1010014", // Toán cao cấp A2
        "1050016", // Hệ quản trị cơ sở dữ liệu
        "1050041", // Nhập môn công nghệ phần mềm
    ];

    console.log("📚 Các môn đã hoàn thành:");
    year1Completed.forEach((code) => {
        const course = curriculum.find((c) => c.code === code);
        if (course) {
            console.log(
                `   ✅ ${course.code}: ${course.name} (${course.credits} tín chỉ)`
            );
        }
    });

    console.log("\n📋 Kế hoạch học tiếp:\n");

    const plan = buildOptimalPlan(curriculum, year1Completed, {
        strategy: "balanced",
        maxCreditsPerSemester: 18,
    });

    plan.forEach((semester, index) => {
        console.log(`🎓 Học kỳ ${index + 2} (${semester.credits} tín chỉ):`);
        semester.courses.forEach((course) => {
            const prefix = course.isRequired ? "📌" : "📝";
            console.log(
                `   ${prefix} ${course.code}: ${course.name} (${course.credits} tín chỉ)`
            );
        });
        console.log("");
    });

    return plan;
}

// 3. Phân tích bottleneck và đường găng
function analyzeBottlenecks() {
    console.log("=== PHÂN TÍCH BOTTLENECK VÀ ĐƯỜNG GĂNG ===\n");

    // Tìm các môn có nhiều dependents nhất (bottleneck)
    const dependentCounts = {};

    curriculum.forEach((course) => {
        dependentCounts[course.code] = 0;
    });

    curriculum.forEach((course) => {
        (course.prerequisites || []).forEach((prereq) => {
            if (dependentCounts[prereq] !== undefined) {
                dependentCounts[prereq]++;
            }
        });
    });

    const bottlenecks = Object.entries(dependentCounts)
        .filter(([code, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    console.log("🔍 Top 10 môn bottleneck (mở khóa nhiều môn khác):");
    bottlenecks.forEach(([code, count]) => {
        const course = curriculum.find((c) => c.code === code);
        if (course) {
            console.log(`   ${code}: ${course.name} → mở khóa ${count} môn`);
        }
    });

    console.log("\n🎯 Đề xuất ưu tiên:");
    console.log("   • Tập trung hoàn thành các môn bottleneck trước");
    console.log("   • Cân nhắc học vượt các môn quan trọng");
    console.log("   • Lập kế hoạch dự phòng cho các môn khó\n");

    return bottlenecks;
}

// 4. Tối ưu hóa cho mục tiêu cụ thể
function optimizeForGoals() {
    console.log("=== TỐI ỨU HÓA CHO MỤC TIÊU CỤ THỂ ===\n");

    const scenarios = [
        {
            name: "Tốt nghiệp nhanh nhất",
            options: { strategy: "fast", maxCreditsPerSemester: 20 },
        },
        {
            name: "Cân bằng cuộc sống",
            options: { strategy: "load-balanced", maxCreditsPerSemester: 15 },
        },
        {
            name: "Tập trung vào GPA",
            options: { strategy: "balanced", maxCreditsPerSemester: 12 },
        },
    ];

    scenarios.forEach((scenario) => {
        console.log(`🎯 Kịch bản: ${scenario.name}`);

        const plan = buildOptimalPlan(curriculum, [], scenario.options);
        const validation = validatePlan(plan, curriculum);

        console.log(`   📅 Thời gian: ${plan.length} học kỳ`);
        console.log(
            `   📊 TB tín chỉ/HK: ${validation.statistics.averageCreditsPerSemester.toFixed(
                1
            )}`
        );
        console.log(
            `   💯 Tỷ lệ môn bắt buộc: ${(
                (validation.statistics.requiredCredits /
                    validation.statistics.totalCredits) *
                100
            ).toFixed(1)}%\n`
        );
    });
}

// 5. Tạo báo cáo chi tiết
function generateDetailedReport(completedCourses = []) {
    console.log("=== BÁO CÁO CHI TIẾT KẾ HOẠCH HỌC TẬP ===\n");

    const plan = buildOptimalPlan(curriculum, completedCourses);
    const validation = validatePlan(plan, curriculum);

    // Thống kê tổng quan
    console.log("📊 THỐNG KÊ TỔNG QUAN:");
    console.log(`   • Tổng môn học: ${curriculum.length}`);
    console.log(`   • Đã hoàn thành: ${completedCourses.length}`);
    console.log(`   • Cần học thêm: ${validation.statistics.remainingCourses}`);
    console.log(`   • Thời gian dự kiến: ${plan.length} học kỳ`);
    console.log(`   • Tổng tín chỉ: ${validation.statistics.totalCredits}`);

    // Phân tích theo loại môn
    console.log("\n📈 PHÂN TÍCH THEO LOẠI MÔN:");
    const requiredCount = curriculum.filter((c) => c.isRequired).length;
    const electiveCount = curriculum.length - requiredCount;

    console.log(`   • Môn bắt buộc: ${requiredCount} môn`);
    console.log(`   • Môn tự chọn: ${electiveCount} môn`);
    console.log(
        `   • Tỷ lệ bắt buộc: ${(
            (requiredCount / curriculum.length) *
            100
        ).toFixed(1)}%`
    );

    // Cảnh báo và đề xuất
    console.log("\n⚠️ CẢNH BÁO VÀ ĐỀ XUẤT:");
    if (validation.errors.length > 0) {
        console.log(`   ❌ Có ${validation.errors.length} lỗi nghiêm trọng`);
    }
    if (validation.warnings.length > 0) {
        console.log(`   ⚠️ Có ${validation.warnings.length} cảnh báo`);
    }

    console.log(
        `   💡 Đề xuất tăng/giảm tải: Có thể điều chỉnh ±2 tín chỉ mỗi học kỳ`
    );
    console.log(
        `   🎯 Mức độ linh hoạt: ${plan.length <= 8 ? "Cao" : "Trung bình"}`
    );

    return { plan, validation };
}

// Chạy demo
function runDemo() {
    console.log("🚀 DEMO THUẬT TOÁN LẬP LỊCH HỌC TỐI ỨU\n");
    console.log("=".repeat(60) + "\n");

    // 1. So sánh chiến lược
    compareStrategies();
    console.log("=".repeat(60) + "\n");

    // 2. Mô phỏng sinh viên đã học một phần
    simulatePartialCompletion();
    console.log("=".repeat(60) + "\n");

    // 3. Phân tích bottleneck
    analyzeBottlenecks();
    console.log("=".repeat(60) + "\n");

    // 4. Tối ưu hóa cho mục tiêu
    optimizeForGoals();
    console.log("=".repeat(60) + "\n");

    // 5. Báo cáo chi tiết
    generateDetailedReport();
}

// Export functions nếu cần
module.exports = {
    compareStrategies,
    simulatePartialCompletion,
    analyzeBottlenecks,
    optimizeForGoals,
    generateDetailedReport,
    runDemo,
};

// Chạy demo nếu file được execute trực tiếp
if (require.main === module) {
    runDemo();
}
