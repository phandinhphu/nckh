# 🎓 Hệ thống Lập Kế hoạch Học tập Tối ưu

> **Thuật toán DAG cho việc xếp lịch môn học thông minh**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](package.json)

## 🎯 Giới thiệu

Hệ thống web hoàn chỉnh để lập kế hoạch học tập tối ưu cho sinh viên, sử dụng thuật toán đồ thị DAG (Directed Acyclic Graph) và các kỹ thuật tối ưu hóa tiên tiến.

**Thực hiện đầy đủ 4 giai đoạn thuật toán:**

1. **Chuẩn bị dữ liệu và tiền xử lý**
2. **Xác định các môn học khả dụng**
3. **Phân bổ môn học vào các học kỳ**
4. **Đánh giá và Phản hồi**

## 🚀 Demo & Truy cập

- **🎮 Demo Page:** [demo.html](demo.html)
- **🚀 Main App:** [index.html](index.html)
- **📊 Project Structure:** [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- **👨‍💻 Development Guide:** [DEVELOPMENT.md](DEVELOPMENT.md)

## ⚡ Khởi chạy Nhanh

```bash
# Clone repository
git clone <repository-url>
cd nckh

# Start server
npm start
# hoặc
node server.js

# Truy cập ứng dụng
# Demo: http://localhost:3000/demo.html
# App:  http://localhost:3000/index.html
```

## � Tính năng Chính

### ✅ Giai đoạn 1: Chuẩn bị dữ liệu

- Thu thập dữ liệu sinh viên (môn đã hoàn thành)
- Xây dựng đồ thị DAG với quan hệ tiên quyết
- Loại bỏ môn đã học khỏi đồ thị
- Phân nhóm môn học theo danh mục

### ✅ Giai đoạn 2: Xác định môn khả dụng

- Thuật toán Topological Sort cho môn "Ready-to-take"
- Kiểm tra ràng buộc môn tiên quyết
- Hỗ trợ học vượt thông minh (tối đa 4 học kỳ)
- Tính toán độ ưu tiên cho từng môn

### ✅ Giai đoạn 3: Lập lịch môn học

- Thuật toán Greedy với 3 chiến lược (Balanced, Fast, Load-balanced)
- **Ràng buộc tín chỉ:** 2/3 ≤ tín chỉ ≤ 3/2 trung bình học kỳ
- **Học kỳ hè:** tối đa 10 tín chỉ
- Xử lý môn học trước (Corequisites) và môn thay thế
- Tối ưu hóa thời gian hoàn thành

### ✅ Giai đoạn 4: Đánh giá và tối ưu

- Kiểm tra tính hợp lệ toàn diện
- Thống kê chi tiết (thời gian, tín chỉ, cân bằng tải)
- Phân tích và khuyến nghị tối ưu
- So sánh hiệu quả các chiến lược

## 🛠️ Công nghệ

- **Frontend:** HTML5, CSS3, Vanilla JavaScript ES6+
- **Visualization:** D3.js (DAG), Chart.js (Statistics)
- **Algorithms:** DAG, Topological Sort, Greedy Algorithm
- **Design:** Responsive, Mobile-friendly
- **Data:** JSON-based curriculum structure

## 📁 Cấu trúc Dự án

```
nckh/
├── 📁 src/                     # Mã nguồn chính
│   ├── 📁 js/                  # JavaScript modules
│   │   ├── algorithms.js       # Core algorithm engine
│   │   ├── app.js             # Application controller
│   │   └── visualizations.js   # Visualization components
│   ├── 📁 css/                # Stylesheets
│   └── 📁 data/               # Data files
├── 📁 docs/                   # Documentation
├── 📁 tests/                  # Test files
├── 📁 examples/               # Example implementations
├── 📁 assets/                 # Static assets
├── 📄 index.html              # Main application
├── 📄 demo.html               # Demo page
├── 📄 server.js               # Development server
└── 📄 package.json            # Project config
```

## 🔧 Scripts

```bash
# Development
npm start                # Start development server
npm run dev             # Alternative dev command

# Building
npm run build           # Build JS and CSS
npm run build:all       # Build everything
npm run clean           # Clean build directory

# Testing
npm test               # Run tests
npm run test:unit      # Unit tests
npm run lint           # Code linting
```

## 📊 Dữ liệu & Ràng buộc

### Dữ liệu Test

- **835+ môn học** với đầy đủ metadata
- **Quan hệ phức tạp:** Prerequisites, Corequisites, Equivalents
- **Phân loại:** Required/Elective, Categories, Difficulty levels

### Ràng buộc Tuân thủ

- **Học kỳ chính:** 2/3 ≤ tín chỉ ≤ 3/2 × trung bình theo kế hoạch chuẩn
- **Học kỳ hè:** ≤ 10 tín chỉ (không quy định tối thiểu)
- **Prerequisites:** Đảm bảo môn tiên quyết đã học
- **Advanced Study:** Học vượt thông minh ≤ 4 học kỳ

## 🎨 Screenshots

> _Screenshots sẽ được thêm vào thư mục `/assets/images/`_

## 📈 Performance

- **Algorithm Complexity:** O(V + E) cho DAG construction
- **Memory Usage:** Optimized for large curriculum datasets
- **Response Time:** < 100ms cho schedule generation
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge)

## 🧪 Testing

```bash
# Run all tests
npm test

# Specific test categories
npm run test:unit           # Algorithm unit tests
npm run test:integration    # UI integration tests
```

## 📚 Documentation

- **📖 [Web App Guide](docs/README_WEB.md)**: Hướng dẫn sử dụng web app
- **🧮 [Algorithm Docs](docs/ALGORITHM_DOCUMENTATION.md)**: Tài liệu thuật toán
- **🏗️ [Project Structure](PROJECT_STRUCTURE.md)**: Cấu trúc dự án
- **👨‍💻 [Development Guide](DEVELOPMENT.md)**: Hướng dẫn phát triển

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Xem thêm chi tiết tại [DEVELOPMENT.md](DEVELOPMENT.md)

## � License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **NCKH Research Team** - _Initial work_

## 🙏 Acknowledgments

- Thuật toán DAG và Topological Sort
- D3.js community for visualization tools
- Chart.js for statistics charts
- Academic scheduling research papers

---

**Phát triển bởi:** Nhóm nghiên cứu NCKH  
**Ngày cập nhật:** Tháng 8, 2025  
**Version:** 1.0.0

⭐ **Nếu dự án hữu ích, hãy star repository này!**

# Clone hoặc tải về project

cd workspace

# Không cần cài đặt dependencies (sử dụng built-in modules)

````

### Sử Dụng Cơ Bản

#### 1. Tạo kế hoạch cho sinh viên mới

```javascript
const { generateSchedule } = require("./test.js");

// Sinh viên chưa học môn nào
generateSchedule([]);
````

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

- **Mục tiêu**: Kế hoạch cân bằng cho sinh viên bắt đầu từ năm 1
- **Tham số**: 16 tín chỉ/học kỳ, chiến lược balanced
- **Kết quả**: ~5 học kỳ, 14 tín chỉ trung bình

### Scenario 2: Tốt Nghiệp Nhanh

- **Mục tiêu**: Hoàn thành sớm nhất có thể
- **Tham số**: 20+ tín chỉ/học kỳ, chiến lược fast, cho phép overload
- **Kết quả**: ~3 học kỳ, 23+ tín chỉ trung bình

### Scenario 3: Sinh Viên Làm Thêm

- **Mục tiêu**: Tải nhẹ để cân bằng công việc
- **Tham số**: 12 tín chỉ/học kỳ, chiến lược load-balanced
- **Kết quả**: ~6 học kỳ, 12 tín chỉ trung bình

### Scenario 4: Sinh Viên Năm 2+

- **Mục tiêu**: Lập kế hoạch cho sinh viên đã hoàn thành một phần
- **Tham số**: Danh sách môn đã học, 18 tín chỉ/học kỳ
- **Kết quả**: Kế hoạch tối ưu cho phần còn lại

## 🔧 API Reference

### Core Functions

#### `buildOptimalPlan(curriculum, completedCourses, options)`

Tạo kế hoạch học tập tối ưu.

**Parameters:**

- `curriculum` (Array): Danh sách tất cả môn học
- `completedCourses` (Array): Mã môn học đã hoàn thành
- `options` (Object): Tùy chọn cấu hình
  - `maxCreditsPerSemester` (Number): Số tín chỉ tối đa/học kỳ
  - `strategy` (String): 'balanced' | 'fast' | 'load-balanced'
  - `allowOverload` (Boolean): Cho phép vượt giới hạn tín chỉ

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

- **Mục tiêu**: Cân bằng giữa thời gian và tải học tập
- **Ưu tiên**: Môn bắt buộc → Môn có nhiều dependents → Học kỳ dự kiến
- **Phù hợp**: Đa số sinh viên

### 2. Fast (Hoàn Thành Nhanh)

- **Mục tiêu**: Tốt nghiệp sớm nhất
- **Ưu tiên**: Môn mở khóa nhiều môn khác → Môn bắt buộc → Thứ tự học kỳ
- **Phù hợp**: Sinh viên có khả năng học tải nặng

### 3. Load-Balanced (Cân Bằng Tải)

- **Mục tiêu**: Phân bổ đều độ khó và tải học tập
- **Ưu tiên**: Cân nhắc difficulty score và workload
- **Phù hợp**: Sinh viên làm thêm hoặc có ràng buộc thời gian

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

- `code`: Mã môn học (unique)
- `name`: Tên môn học
- `credits`: Số tín chỉ
- `isRequired`: Môn bắt buộc hay tự chọn

### Các Trường Tùy Chọn

- `expectedSemester`: Học kỳ dự kiến
- `prerequisites`: Danh sách môn tiên quyết
- `corequisites`: Danh sách môn học trước
- `equivalents`: Danh sách môn thay thế
- `difficulty`: Độ khó (1-5, mặc định 1)

## 🚨 Xử Lý Lỗi và Cảnh Báo

### Các Loại Lỗi

- **MISSING_PREREQUISITES**: Thiếu môn tiên quyết
- **INVALID_COREQUISITES**: Môn học trước không hợp lệ
- **CREDIT_OVERFLOW**: Vượt quá giới hạn tín chỉ
- **CIRCULAR_DEPENDENCY**: Phụ thuộc vòng tròn

### Các Loại Cảnh Báo

- **UNBALANCED_LOAD**: Tải không cân bằng giữa các học kỳ
- **LATE_REQUIRED_COURSES**: Môn bắt buộc học muộn
- **MISSING_ELECTIVES**: Thiếu môn tự chọn

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

- ✅ Thuật toán DAG cơ bản
- ✅ Ba chiến lược lập lịch
- ✅ Validation engine
- ✅ Demo scenarios

### Phase 2 (Future)

- 🔲 Machine Learning integration
- 🔲 Real-time collaboration
- 🔲 Web interface
- 🔲 Integration với LMS

### Phase 3 (Future)

- 🔲 Multi-university support
- 🔲 Advanced analytics
- 🔲 Mobile app
- 🔲 AI-powered recommendations

## 🤝 Contributing

Để đóng góp vào project:

1. Fork repository
2. Tạo feature branch
3. Implement changes với tests
4. Submit pull request với documentation

## 📝 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 📞 Support

- **Issues**: Tạo issue trên GitHub
- **Documentation**: Xem ALGORITHM_DOCUMENTATION.md
- **Examples**: Chạy các file demo để hiểu cách sử dụng

---

**Made with ❤️ for Vietnamese universities**
