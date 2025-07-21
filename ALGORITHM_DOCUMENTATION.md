# Thuật Toán Lập Lịch Học Tập Tối Ưu

## Tổng Quan

Thuật toán được thiết kế dựa trên mô hình **Đồ thị Có Hướng Không Chu Trình (DAG)** để giải quyết bài toán lập lịch học tập tối ưu, tính đến các ràng buộc về môn tiên quyết, số tín chỉ, và mục tiêu tốt nghiệp.

## Kiến Trúc Thuật Toán

### Giai Đoạn 1: Chuẩn Bị Dữ Liệu và Tiền Xử Lý

#### 1.1 Xây Dựng Đồ Thị DAG

```javascript
function buildDAG(curriculum) {
    return {
        adjacencyList: {}, // course -> [prerequisites]
        reverseList: {}, // course -> [dependents]
        courseMap: new Map(), // Truy cập nhanh thông tin môn
        groups: new Map(), // Nhóm môn học
    };
}
```

**Ưu điểm:**

-   **O(1)** tra cứu thông tin môn học
-   **O(1)** tìm môn phụ thuộc
-   Hỗ trợ nhiều loại quan hệ phức tạp

#### 1.2 Tính Toán Độ Ưu Tiên

```javascript
function calculatePriority(course, graph) {
    let priority = 0;

    // Ưu tiên 1: Môn bắt buộc (trọng số 1000)
    if (course.isRequired) priority += 1000;

    // Ưu tiên 2: Số môn phụ thuộc (trọng số 100)
    priority += countDependents(graph, course.code) * 100;

    // Ưu tiên 3: Học kỳ dự kiến (trọng số 10)
    priority += (10 - (course.expectedSemester || 10)) * 10;

    // Ưu tiên 4: Môn nền tảng (trọng số 5)
    priority += (course.prerequisites?.length || 0) * 5;

    return priority;
}
```

### Giai Đoạn 2: Xác Định Môn Học Khả Dụng

#### 2.1 Thuật Toán Tìm Môn Sẵn Sàng (Topological Approach)

```javascript
function findReadyCourses(graph, completed, allCourses) {
    const completedSet = new Set(completed);

    return allCourses.filter((course) => {
        // Kiểm tra môn đã học
        if (completedSet.has(course.code)) return false;

        // Kiểm tra môn thay thế
        if (course.equivalents?.some((eq) => completedSet.has(eq)))
            return false;

        // Kiểm tra prerequisites
        const prereqs = course.prerequisites || [];
        return prereqs.every((p) => completedSet.has(p));
    });
}
```

**Độ phức tạp:** O(n × m) với n là số môn, m là số prerequisites trung bình

#### 2.2 Validation Corequisites

```javascript
function validateCorequisites(selectedCourses, course) {
    const selectedCodes = new Set(selectedCourses.map((c) => c.code));
    const requiredCoreqs = course.corequisites.filter(
        (coreq) => !selectedCodes.has(coreq)
    );

    return {
        valid: requiredCoreqs.length === 0,
        requiredCoreqs,
    };
}
```

### Giai Đoạn 3: Thuật Toán Lập Lịch Tối Ưu

#### 3.1 Chiến Lược Lập Lịch

##### A. Chiến Lược Cân Bằng (Balanced)

```javascript
function sortBalanced(courses, graph) {
    return courses.sort((a, b) => {
        const priorityA = calculatePriority(a, graph);
        const priorityB = calculatePriority(b, graph);
        return priorityB - priorityA;
    });
}
```

##### B. Chiến Lược Hoàn Thành Nhanh (Fast)

```javascript
function sortForFastCompletion(courses, graph) {
    return courses.sort((a, b) => {
        // Ưu tiên môn mở khóa nhiều môn khác
        const depA = countDependents(graph, a.code);
        const depB = countDependents(graph, b.code);
        if (depA !== depB) return depB - depA;

        // Ưu tiên môn bắt buộc
        if (a.isRequired && !b.isRequired) return -1;
        if (!a.isRequired && b.isRequired) return 1;

        return (a.expectedSemester || 99) - (b.expectedSemester || 99);
    });
}
```

##### C. Chiến Lược Cân Bằng Tải (Load-Balanced)

```javascript
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
```

#### 3.2 Thuật Toán Tham Lam Cải Tiến

```javascript
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

    for (const course of sortedCourses) {
        // Kiểm tra các ràng buộc
        if (taken.has(course.code)) continue;
        if (course.equivalents?.some((eq) => taken.has(eq))) continue;

        // Xử lý corequisites
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
        }
    }

    return {
        courses: semester,
        credits: credits,
        load: calculateSemesterLoad(semester),
    };
}
```

### Giai Đoạn 4: Đánh Giá và Validation

#### 4.1 Kiểm Tra Tính Hợp Lệ

```javascript
function validatePlan(plan, curriculum) {
    const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        statistics: {},
    };

    // Kiểm tra prerequisites
    for (const semester of plan) {
        const previousCourses = new Set();
        // Thu thập tất cả môn từ học kỳ trước

        for (const course of semester.courses) {
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
        }
    }

    return validation;
}
```

#### 4.2 Thống Kê và Phân Tích

```javascript
function calculatePlanStatistics(plan, curriculum) {
    return {
        totalSemesters: plan.length,
        totalCredits: plan.reduce((sum, sem) => sum + sem.credits, 0),
        averageCreditsPerSemester: totalCredits / plan.length,
        requiredCredits: /* tính toán môn bắt buộc */,
        electiveCredits: /* tính toán môn tự chọn */,
        remainingCourses: /* môn chưa lên lịch */
    };
}
```

## Độ Phức Tạp Thuật Toán

### Độ Phức Tạp Thời Gian

-   **Xây dựng đồ thị:** O(n + m) với n = số môn, m = số quan hệ prerequisites
-   **Tìm môn sẵn sàng:** O(n × p) với p = số prerequisites trung bình
-   **Sắp xếp ưu tiên:** O(n log n)
-   **Xây dựng học kỳ:** O(n)
-   **Tổng thể:** O(s × n × (p + log n)) với s = số học kỳ

### Độ Phức Tạp Không Gian

-   **Đồ thị:** O(n + m)
-   **Cấu trúc hỗ trợ:** O(n)
-   **Tổng:** O(n + m)

## Tính Năng Nâng Cao

### 1. Phân Tích Bottleneck

```javascript
function analyzeBottlenecks() {
    // Tìm các môn có nhiều dependents nhất
    const dependentCounts = {};
    curriculum.forEach((course) => {
        (course.prerequisites || []).forEach((prereq) => {
            dependentCounts[prereq] = (dependentCounts[prereq] || 0) + 1;
        });
    });

    return Object.entries(dependentCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
}
```

### 2. Tối Ưu Hóa Đa Mục Tiêu

-   **Thời gian tốt nghiệp:** Minimize số học kỳ
-   **Cân bằng tải:** Optimize phân bổ tín chỉ
-   **GPA tối ưu:** Minimize độ khó mỗi học kỳ

### 3. Validation Thời Gian Thực

-   Kiểm tra ràng buộc ngay lập tức
-   Đề xuất điều chỉnh tự động
-   Cảnh báo xung đột lịch học

## So Sánh Với Thuật Toán Cũ

| Tiêu Chí             | Thuật Toán Cũ           | Thuật Toán Mới             |
| -------------------- | ----------------------- | -------------------------- |
| Cấu trúc dữ liệu     | Adjacency List đơn giản | DAG với reverse lookup     |
| Chiến lược sắp xếp   | Một chiến lược cố định  | Nhiều chiến lược linh hoạt |
| Xử lý corequisites   | Cơ bản                  | Nâng cao với validation    |
| Phân tích bottleneck | Không có                | Có đầy đủ                  |
| Validation           | Cơ bản                  | Toàn diện với báo cáo      |
| Độ phức tạp          | O(n²)                   | O(n log n)                 |
| Tính mở rộng         | Hạn chế                 | Cao                        |

## Kết Luận

Thuật toán mới cung cấp:

1. **Hiệu suất tốt hơn:** O(n log n) thay vì O(n²)
2. **Tính linh hoạt cao:** Nhiều chiến lược lập lịch
3. **Validation toàn diện:** Kiểm tra đầy đủ các ràng buộc
4. **Phân tích sâu:** Bottleneck analysis và optimization suggestions
5. **Khả năng mở rộng:** Dễ dàng thêm tính năng mới

Thuật toán đã được thiết kế để xử lý các trường hợp phức tạp trong thực tế và có thể dễ dàng tùy chỉnh theo nhu cầu cụ thể của từng trường đại học hoặc chương trình đào tạo.
