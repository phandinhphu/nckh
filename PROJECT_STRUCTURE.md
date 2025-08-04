# Cấu trúc Dự án - Hệ thống Lập Kế hoạch Học tập Tối ưu

## 📁 Cấu trúc Thư mục

```
nckh/
├── 📁 src/                     # Mã nguồn chính
│   ├── 📁 js/                  # JavaScript files
│   │   ├── 📁 algorithms/      # Core algorithms
│   │   ├── 📁 visualization/   # Data visualization
│   │   ├── 📁 ui/             # User interface logic
│   │   ├── 📁 utils/          # Utility functions
│   │   ├── 📄 algorithms.js    # Main algorithm engine
│   │   ├── 📄 app.js          # Application controller
│   │   └── 📄 visualizations.js # Visualization components
│   ├── 📁 css/                # Stylesheets
│   │   └── 📄 styles.css      # Main stylesheet
│   └── 📁 data/               # Data files
│       ├── 📄 data_test_v1.json # Test curriculum data
│       └── 📄 data.json       # Additional data
├── 📁 docs/                   # Documentation
│   ├── 📄 README_WEB.md       # Web app documentation
│   └── 📄 ALGORITHM_DOCUMENTATION.md # Algorithm docs
├── 📁 tests/                  # Test files
│   ├── 📄 test.js             # Basic tests
│   ├── 📄 test_v1.js          # Advanced tests
│   └── 📄 advanced_scheduler.js # Advanced scheduling tests
├── 📁 examples/               # Example implementations
│   └── 📄 real_world_demo.js  # Real world demo
├── 📁 assets/                 # Static assets
│   ├── 📁 images/             # Images
│   └── 📁 icons/              # Icons
├── 📁 dist/                   # Distribution/build files
├── 📄 index.html              # Main application page
├── 📄 demo.html               # Demo and documentation page
├── 📄 server.js               # Development server
├── 📄 package.json            # Project configuration
└── 📄 README.md               # Main project README
```

## 🎯 Mô tả các Thư mục

### `/src` - Mã nguồn chính

- **`/js`**: Tất cả JavaScript files
  - **`/algorithms`**: Core scheduling algorithms
  - **`/visualization`**: D3.js và Chart.js components
  - **`/ui`**: User interface logic và event handlers
  - **`/utils`**: Utility functions và helpers
- **`/css`**: Stylesheets và themes
- **`/data`**: JSON data files và test data

### `/docs` - Tài liệu

- **`README_WEB.md`**: Hướng dẫn sử dụng web app
- **`ALGORITHM_DOCUMENTATION.md`**: Tài liệu thuật toán chi tiết

### `/tests` - Kiểm thử

- **Unit tests**: Kiểm thử từng module
- **Integration tests**: Kiểm thử tích hợp
- **Performance tests**: Kiểm thử hiệu năng

### `/examples` - Ví dụ

- **Demo implementations**: Các ví dụ triển khai
- **Use cases**: Các trường hợp sử dụng thực tế

### `/assets` - Tài nguyên

- **Images**: Hình ảnh, screenshots
- **Icons**: Biểu tượng cho UI

### `/dist` - Phân phối

- **Minified files**: Files đã nén
- **Production builds**: Bản build cho production

## 🔧 Quy tắc Tổ chức

1. **Modular Structure**: Mỗi module có trách nhiệm riêng biệt
2. **Clear Naming**: Tên file và thư mục rõ ràng, có ý nghĩa
3. **Separation of Concerns**: Tách biệt logic, UI, và data
4. **Documentation**: Mỗi module có documentation riêng
5. **Testing**: Mỗi module có test cases tương ứng

## 📝 Hướng dẫn Phát triển

### Thêm tính năng mới:

1. Tạo module trong `/src/js/` thư mục tương ứng
2. Viết test trong `/tests/`
3. Cập nhật documentation trong `/docs/`
4. Thêm example trong `/examples/` nếu cần

### Cấu trúc file JavaScript:

```javascript
/**
 * MODULE_NAME.js - Brief description
 * Location: /src/js/[category]/
 */

class ModuleName {
  constructor() {
    // Initialize
  }

  // Public methods

  // Private methods
}

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = ModuleName;
} else {
  window.ModuleName = ModuleName;
}
```

## 🚀 Lợi ích của Cấu trúc này

1. **Dễ bảo trì**: Tìm và sửa code nhanh chóng
2. **Scalable**: Dễ mở rộng thêm tính năng
3. **Team-friendly**: Nhiều người có thể làm việc đồng thời
4. **Testing**: Dễ viết và chạy tests
5. **Documentation**: Tài liệu được tổ chức có hệ thống
6. **Deployment**: Dễ build và deploy

## 📊 Metrics và Monitoring

- **Code coverage**: Độ bao phủ của tests
- **Performance**: Thời gian thực thi thuật toán
- **Bundle size**: Kích thước file sau khi build
- **Dependencies**: Quản lý thư viện dependencies

---

_Cập nhật: Tháng 8, 2025_
