# Hệ thống Lập Kế hoạch Học tập Tối ưu

## 🎯 Mô tả Dự án

Đây là một hệ thống web hoàn chỉnh để lập kế hoạch học tập tối ưu cho sinh viên, sử dụng thuật toán đồ thị DAG (Directed Acyclic Graph) và các kỹ thuật tối ưu hóa tiên tiến.

Hệ thống thực hiện đầy đủ **4 giai đoạn thuật toán** theo yêu cầu:

1. **Chuẩn bị dữ liệu và tiền xử lý**
2. **Xác định các môn học khả dụng**
3. **Phân bổ môn học vào các học kỳ**
4. **Đánh giá và Phản hồi**

## 🚀 Demo

- **Trang chính:** [index.html](index.html)
- **Trang demo:** [demo.html](demo.html)

## 📋 Tính năng Chính

### Giai đoạn 1: Chuẩn bị dữ liệu

- ✅ Thu thập dữ liệu sinh viên (môn đã hoàn thành)
- ✅ Xây dựng đồ thị DAG với quan hệ tiên quyết
- ✅ Loại bỏ môn đã học khỏi đồ thị
- ✅ Phân nhóm môn học theo danh mục

### Giai đoạn 2: Xác định môn khả dụng

- ✅ Thuật toán Topological Sort cho môn "Ready-to-take"
- ✅ Kiểm tra ràng buộc môn tiên quyết
- ✅ Hỗ trợ học vượt thông minh (tối đa 4 học kỳ)
- ✅ Tính toán độ ưu tiên cho từng môn

### Giai đoạn 3: Lập lịch môn học

- ✅ Thuật toán Greedy với 3 chiến lược (Balanced, Fast, Load-balanced)
- ✅ Ràng buộc tín chỉ: **2/3 ≤ tín chỉ ≤ 3/2** trung bình học kỳ
- ✅ Học kỳ hè: **tối đa 10 tín chỉ**
- ✅ Xử lý môn học trước (Corequisites) và môn thay thế
- ✅ Tối ưu hóa thời gian hoàn thành

### Giai đoạn 4: Đánh giá và tối ưu

- ✅ Kiểm tra tính hợp lệ toàn diện
- ✅ Thống kê chi tiết (thời gian, tín chỉ, cân bằng tải)
- ✅ Phân tích và khuyến nghị tối ưu
- ✅ So sánh hiệu quả các chiến lược

## 🛠️ Công nghệ Sử dụng

- **Frontend:** HTML5, CSS3, Vanilla JavaScript ES6+
- **Visualization:** D3.js (DAG), Chart.js (Statistics)
- **Algorithms:** DAG, Topological Sort, Greedy Algorithm
- **Design:** Responsive, Mobile-friendly
- **Data:** JSON-based curriculum structure

## 📂 Cấu trúc Dự án

```
nckh/
├── index.html              # Trang chính ứng dụng
├── demo.html              # Trang demo và hướng dẫn
├── styles.css             # Stylesheet chính
├── app.js                 # Logic ứng dụng và UI
├── algorithms.js          # Core algorithms (4 phases)
├── visualizations.js      # Data visualization components
├── data_test_v1.json      # Dữ liệu curriculum test
├── test_v1.js            # Algorithm implementation cũ
└── README_WEB.md         # Tài liệu này
```

## 🔧 Cách Sử dụng

### 1. Khởi chạy

```bash
# Mở trong browser
open index.html
# hoặc
open demo.html  # Để xem hướng dẫn
```

### 2. Sử dụng ứng dụng

#### Bước 1: Nhập thông tin (Tab 1)

- Nhập mã sinh viên, họ tên
- Chọn học kỳ hiện tại
- Tìm và chọn các môn đã hoàn thành
- Thiết lập tùy chọn thuật toán

#### Bước 2: Phân tích DAG (Tab 2)

- Xem đồ thị DAG môn học
- Kiểm tra môn khả dụng
- Phân tích ràng buộc và bottlenecks

#### Bước 3: Lập lịch (Tab 3)

- Tự động tạo kế hoạch học tập
- Điều chỉnh thủ công bằng drag & drop
- Thay đổi view theo năm/học kỳ/timeline

#### Bước 4: Đánh giá (Tab 4)

- Xem thống kê tổng quan
- Kiểm tra tính hợp lệ
- Nhận khuyến nghị tối ưu
- So sánh các chiến lược
- Xuất kết quả (PDF/Excel/JSON)

## ⚙️ Thuật toán Chi tiết

### Core Algorithm Class: `AcademicScheduler`

```javascript
// Khởi tạo
const scheduler = new AcademicScheduler(curriculum);
scheduler.setCompletedCourses(["1010245", "1010038"]);
scheduler.setOptions({
  strategy: "balanced",
  enableAdvancedStudy: true,
  includeSummerSemesters: true,
  maxCreditsPerSemester: 22,
});

// Thực thi 4 giai đoạn
const result = scheduler.generateOptimalPlan();
```

### Ràng buộc được xử lý

1. **Prerequisites:** Đảm bảo môn tiên quyết đã học
2. **Corequisites:** Môn học cùng học kỳ
3. **Credit Limits:** Tuân thủ quy định tín chỉ
4. **Summer Constraints:** Giới hạn học kỳ hè ≤ 10TC
5. **Advanced Study:** Học vượt thông minh ≤ 4 học kỳ
6. **Load Balancing:** Cân bằng độ khó và tải học tập

### Chiến lược tối ưu

- **Balanced:** Cân bằng tất cả yếu tố
- **Fast:** Hoàn thành nhanh nhất có thể
- **Load-balanced:** Ưu tiên cân bằng tải học tập

## 📊 Dữ liệu Test

File `data_test_v1.json` chứa:

- **835+ môn học** với đầy đủ metadata
- **Quan hệ phức tạp:** Prerequisites, Corequisites, Equivalents
- **Phân loại:** Required/Elective, Categories, Difficulty levels
- **Thông tin học kỳ:** Expected semesters, Credits

## 🎨 Giao diện

- **4 Tab chính** tương ứng 4 giai đoạn thuật toán
- **Visualization:** Interactive DAG với D3.js
- **Charts:** Statistics charts với Chart.js
- **Responsive:** Tương thích mobile và desktop
- **Dark/Light theme:** Tự động theo system preference

## 🔍 Validation & Quality

### Kiểm tra tự động

- Prerequisites validation
- Credit constraints checking
- Load balance analysis
- Timeline consistency
- Advanced study limits

### Metrics

- Completion time optimization
- Credit distribution balance
- Course dependency analysis
- Bottleneck identification
- Strategy comparison

## 📤 Export Features

- **PDF:** Kế hoạch học tập formatted
- **Excel:** Spreadsheet với chi tiết
- **JSON:** Raw data để import/backup

## 🚧 Hạn chế và Cải tiến

### Hiện tại

- Sử dụng dữ liệu test tĩnh
- Export PDF/Excel chưa implement đầy đủ
- Drag & drop manual adjustment đang phát triển

### Tương lai

- Kết nối database thực
- Machine learning cho recommendation
- Collaborative filtering
- Mobile app companion

## 📝 API Reference

### Main Classes

#### `AcademicScheduler`

```javascript
// Core scheduling engine
buildDAG(); // Phase 1: Build graph
findReadyCourses(); // Phase 2: Find available courses
buildOptimalSchedule(); // Phase 3: Create schedule
validateSchedule(); // Phase 4: Validate & analyze
```

#### `ScheduleVisualizer`

```javascript
// Visualization components
renderDAG(); // DAG visualization
renderScheduleTimeline(); // Timeline chart
renderValidationResults(); // Validation display
renderStatisticsCharts(); // Statistics visualization
```

#### `AcademicPlannerApp`

```javascript
// Main application controller
generateOptimalPlan(); // Execute full algorithm
compareStrategies(); // Strategy comparison
exportToJSON(); // Data export
```

## 🤝 Đóng góp

Dự án này được phát triển theo yêu cầu nghiên cứu khoa học. Mọi đóng góp và phản hồi đều được hoan nghênh.

## 📄 License

Dự án nghiên cứu khoa học - Educational use only.

---

**Phát triển bởi:** Nhóm nghiên cứu NCKH  
**Ngày cập nhật:** Tháng 8, 2025  
**Version:** 1.0.0
