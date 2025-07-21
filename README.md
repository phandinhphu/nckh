# 🎓 Thuật Toán Lập Lịch Học Tập Tối Ưu

## 📋 Tổng Quan

Hệ thống thuật toán lập lịch học tập tối ưu được thiết kế để giải quyết bài toán phức tạp trong việc xây dựng kế hoạch học tập cho sinh viên đại học. Thuật toán sử dụng mô hình **Đồ thị Có Hướng Không Chu Trình (DAG)** để xử lý các ràng buộc về môn tiên quyết, corequisites, và tối ưu hóa thời gian tốt nghiệp.

## 🚀 Tính Năng Chính

### ✨ Thuật Toán Lõi

-   **Xây dựng DAG tối ưu**: O(n log n) thay vì O(n²) của thuật toán truyền thống
-   **Đa chiến lược lập lịch**: Balanced, Fast completion, Load-balanced
-   **Xử lý ràng buộc phức tạp**: Prerequisites, corequisites, equivalents
-   **Validation toàn diện**: Kiểm tra tính hợp lệ của kế hoạch

### 🎯 Tối Ưu Hóa

-   **Phân tích bottleneck**: Tìm các môn học then chốt
-   **Critical path analysis**: Xác định đường đi dài nhất
-   **Tối ưu đa mục tiêu**: Thời gian, tải học tập, GPA
-   **Flexibility scoring**: Đánh giá độ linh hoạt của kế hoạch

### 📊 Phân Tích và Báo Cáo

-   **Thống kê chi tiết**: Tín chỉ, học kỳ, phân bổ môn học
-   **Scenarios comparison**: So sánh các kịch bản khác nhau
-   **Visual feedback**: Hiển thị trực quan với emoji và màu sắc
-   **Error detection**: Phát hiện và báo cáo lỗi

## 📁 Cấu Trúc Project

```
├── test.js                     # Thuật toán chính
├── advanced_scheduler.js       # Tính năng nâng cao
├── real_world_demo.js         # Demo các kịch bản thực tế
├── data.json                  # Dữ liệu khung chương trình đào tạo
├── ALGORITHM_DOCUMENTATION.md # Documentation chi tiết
└── README.md                  # File này
```

## 🛠️ Cài Đặt và Sử Dụng

### Yêu Cầu Hệ Thống

-   Node.js >= 14.0.0
-   Memory: 512MB+ (tùy thuộc kích thước dữ liệu)

### Cài Đặt

```bash
# Clone hoặc tải về project
cd workspace

# Không cần cài đặt dependencies (sử dụng built-in modules)
```

### Sử Dụng Cơ Bản

#### 1. Tạo kế hoạch cho sinh viên mới

```javascript
const { generateSchedule } = require("./test.js");

// Sinh viên chưa học môn nào
generateSchedule([]);
```

#### 2. Tạo kế hoạch cho sinh viên đã học một số môn

```javascript
const completedCourses = [
    "1130299", // Triết học Mác-Lênin
    "1090061", // Tiếng Anh 1
    "1050273", // Nhập môn lập trình
];

generateSchedule(completedCourses, {
    strategy: "balanced",
    maxCreditsPerSemester: 18,
});
```

#### 3. Sử dụng các chiến lược khác nhau

```javascript
const { buildOptimalPlan } = require("./test.js");

// Tốt nghiệp nhanh nhất
const fastPlan = buildOptimalPlan(curriculum, [], {
    strategy: "fast",
    maxCreditsPerSemester: 20,
    allowOverload: true,
});

// Cân bằng tải học tập
const balancedPlan = buildOptimalPlan(curriculum, [], {
    strategy: "load-balanced",
    maxCreditsPerSemester: 15,
});
```

### Sử Dụng Nâng Cao

#### 1. Chạy demo đầy đủ

```bash
node advanced_scheduler.js
```

#### 2. Test với các kịch bản thực tế

```bash
node real_world_demo.js
```

#### 3. Phân tích bottleneck

```javascript
const { analyzeBottlenecks } = require("./advanced_scheduler.js");
const bottlenecks = analyzeBottlenecks();
console.log("Top bottleneck courses:", bottlenecks);
```

## 🎮 Demo Scenarios

### Scenario 1: Sinh Viên Mới

-   **Mục tiêu**: Kế hoạch cân bằng cho sinh viên bắt đầu từ năm 1
-   **Tham số**: 16 tín chỉ/học kỳ, chiến lược balanced
-   **Kết quả**: ~5 học kỳ, 14 tín chỉ trung bình

### Scenario 2: Tốt Nghiệp Nhanh

-   **Mục tiêu**: Hoàn thành sớm nhất có thể
-   **Tham số**: 20+ tín chỉ/học kỳ, chiến lược fast, cho phép overload
-   **Kết quả**: ~3 học kỳ, 23+ tín chỉ trung bình

### Scenario 3: Sinh Viên Làm Thêm

-   **Mục tiêu**: Tải nhẹ để cân bằng công việc
-   **Tham số**: 12 tín chỉ/học kỳ, chiến lược load-balanced
-   **Kết quả**: ~6 học kỳ, 12 tín chỉ trung bình

### Scenario 4: Sinh Viên Năm 2+

-   **Mục tiêu**: Lập kế hoạch cho sinh viên đã hoàn thành một phần
-   **Tham số**: Danh sách môn đã học, 18 tín chỉ/học kỳ
-   **Kết quả**: Kế hoạch tối ưu cho phần còn lại

## 🔧 API Reference

### Core Functions

#### `buildOptimalPlan(curriculum, completedCourses, options)`

Tạo kế hoạch học tập tối ưu.

**Parameters:**

-   `curriculum` (Array): Danh sách tất cả môn học
-   `completedCourses` (Array): Mã môn học đã hoàn thành
-   `options` (Object): Tùy chọn cấu hình
    -   `maxCreditsPerSemester` (Number): Số tín chỉ tối đa/học kỳ
    -   `strategy` (String): 'balanced' | 'fast' | 'load-balanced'
    -   `allowOverload` (Boolean): Cho phép vượt giới hạn tín chỉ

**Returns:** Kế hoạch học tập với thông tin chi tiết mỗi học kỳ

#### `validatePlan(plan, curriculum)`

Kiểm tra tính hợp lệ của kế hoạch.

**Returns:** Object chứa errors, warnings, và statistics

#### `generateSchedule(completedCourses, options)`

Tạo và hiển thị kế hoạch với format đẹp mắt.

### Analysis Functions

#### `analyzeBottlenecks()`

Phân tích các môn học then chốt.

#### `calculatePlanStatistics(plan, curriculum)`

Tính toán thống kê chi tiết của kế hoạch.

## 📊 Các Chiến Lược Lập Lịch

### 1. Balanced (Cân Bằng)

-   **Mục tiêu**: Cân bằng giữa thời gian và tải học tập
-   **Ưu tiên**: Môn bắt buộc → Môn có nhiều dependents → Học kỳ dự kiến
-   **Phù hợp**: Đa số sinh viên

### 2. Fast (Hoàn Thành Nhanh)

-   **Mục tiêu**: Tốt nghiệp sớm nhất
-   **Ưu tiên**: Môn mở khóa nhiều môn khác → Môn bắt buộc → Thứ tự học kỳ
-   **Phù hợp**: Sinh viên có khả năng học tải nặng

### 3. Load-Balanced (Cân Bằng Tải)

-   **Mục tiêu**: Phân bổ đều độ khó và tải học tập
-   **Ưu tiên**: Cân nhắc difficulty score và workload
-   **Phù hợp**: Sinh viên làm thêm hoặc có ràng buộc thời gian

## ⚙️ Cấu Hình Dữ Liệu

### Cấu Trúc Môn Học (data.json)

```json
{
    "code": "1050041",
    "name": "Nhập môn công nghệ phần mềm",
    "credits": 3,
    "isRequired": true,
    "expectedSemester": 2,
    "prerequisites": ["1050273"],
    "corequisites": [],
    "equivalents": [],
    "difficulty": 2
}
```

### Các Trường Bắt Buộc

-   `code`: Mã môn học (unique)
-   `name`: Tên môn học
-   `credits`: Số tín chỉ
-   `isRequired`: Môn bắt buộc hay tự chọn

### Các Trường Tùy Chọn

-   `expectedSemester`: Học kỳ dự kiến
-   `prerequisites`: Danh sách môn tiên quyết
-   `corequisites`: Danh sách môn học trước
-   `equivalents`: Danh sách môn thay thế
-   `difficulty`: Độ khó (1-5, mặc định 1)

## 🚨 Xử Lý Lỗi và Cảnh Báo

### Các Loại Lỗi

-   **MISSING_PREREQUISITES**: Thiếu môn tiên quyết
-   **INVALID_COREQUISITES**: Môn học trước không hợp lệ
-   **CREDIT_OVERFLOW**: Vượt quá giới hạn tín chỉ
-   **CIRCULAR_DEPENDENCY**: Phụ thuộc vòng tròn

### Các Loại Cảnh Báo

-   **UNBALANCED_LOAD**: Tải không cân bằng giữa các học kỳ
-   **LATE_REQUIRED_COURSES**: Môn bắt buộc học muộn
-   **MISSING_ELECTIVES**: Thiếu môn tự chọn

## 🔄 Workflow Phát Triển

1. **Input Validation**: Kiểm tra dữ liệu đầu vào
2. **Graph Construction**: Xây dựng DAG từ curriculum
3. **Ready Courses Detection**: Tìm môn sẵn sàng học
4. **Strategy Application**: Áp dụng chiến lược sắp xếp
5. **Semester Building**: Xây dựng từng học kỳ
6. **Validation & Optimization**: Kiểm tra và tối ưu
7. **Output Generation**: Tạo kết quả và báo cáo

## 🎯 Roadmap

### Phase 1 (Completed)

-   ✅ Thuật toán DAG cơ bản
-   ✅ Ba chiến lược lập lịch
-   ✅ Validation engine
-   ✅ Demo scenarios

### Phase 2 (Future)

-   🔲 Machine Learning integration
-   🔲 Real-time collaboration
-   🔲 Web interface
-   🔲 Integration với LMS

### Phase 3 (Future)

-   🔲 Multi-university support
-   🔲 Advanced analytics
-   🔲 Mobile app
-   🔲 AI-powered recommendations

## 🤝 Contributing

Để đóng góp vào project:

1. Fork repository
2. Tạo feature branch
3. Implement changes với tests
4. Submit pull request với documentation

## 📝 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 📞 Support

-   **Issues**: Tạo issue trên GitHub
-   **Documentation**: Xem ALGORITHM_DOCUMENTATION.md
-   **Examples**: Chạy các file demo để hiểu cách sử dụng

---

**Made with ❤️ for Vietnamese universities**
