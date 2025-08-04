# Hướng dẫn Phát triển - Academic Scheduler

## 🚀 Bắt đầu Phát triển

### Yêu cầu hệ thống

- Node.js >= 14.0.0
- Git
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Cài đặt

```bash
# Clone repository
git clone <repository-url>
cd nckh

# Install dependencies (if any)
npm install

# Start development server
npm run dev
```

### Khởi chạy ứng dụng

```bash
# Development mode
npm run start

# Access the application
# Demo: http://localhost:3000/demo.html
# Main App: http://localhost:3000/index.html
```

## 📁 Cấu trúc Dự án

```
src/
├── js/                    # JavaScript modules
│   ├── algorithms/        # Core scheduling algorithms
│   ├── visualization/     # D3.js & Chart.js components
│   ├── ui/               # UI logic and interactions
│   ├── utils/            # Utility functions
│   ├── algorithms.js     # Main algorithm engine
│   ├── app.js           # Application controller
│   └── visualizations.js # Visualization components
├── css/                  # Stylesheets
│   └── styles.css       # Main stylesheet
└── data/                # Data files
    ├── data_test_v1.json # Test curriculum data
    └── data.json        # Additional data
```

## 🔧 Scripts Phát triển

```bash
# Development
npm run dev              # Start dev server
npm run serve           # Alternative serve command

# Building
npm run build           # Build JS and CSS
npm run build:all       # Build everything including HTML
npm run clean           # Clean dist directory

# Testing
npm test               # Run all tests
npm run test:unit      # Run unit tests
npm run test:integration # Run integration tests

# Code quality
npm run lint           # Lint code
```

## 🧪 Testing

### Cấu trúc Tests

```
tests/
├── test.js             # Basic functionality tests
├── test_v1.js          # Advanced algorithm tests
└── advanced_scheduler.js # Performance tests
```

### Chạy Tests

```bash
# All tests
npm test

# Specific test file
node tests/test_v1.js
```

## 📝 Coding Standards

### JavaScript Style Guide

```javascript
// Class naming: PascalCase
class AcademicScheduler {
  // Method naming: camelCase
  buildOptimalPlan() {
    // Variable naming: camelCase
    const readyCourses = [];

    // Constants: UPPER_SNAKE_CASE
    const MAX_CREDITS_PER_SEMESTER = 22;
  }
}

// Function naming: camelCase
function calculatePriority(course) {
  return priority;
}

// File naming: kebab-case or camelCase
// academic-scheduler.js or academicScheduler.js
```

### CSS/HTML Guidelines

```css
/* Class naming: kebab-case */
.semester-card {
  /* Property ordering: alphabetical */
  background: white;
  border-radius: 8px;
  padding: 20px;
}

/* BEM methodology for complex components */
.course-card__header--active {
  color: blue;
}
```

## 🔄 Git Workflow

### Branch Naming

```bash
# Feature branches
feature/add-summer-semester-support
feature/improve-dag-visualization

# Bug fixes
bugfix/fix-prerequisite-validation
hotfix/critical-scheduling-bug

# Improvements
improvement/optimize-algorithm-performance
refactor/reorganize-file-structure
```

### Commit Messages

```bash
# Format: type(scope): description
feat(algorithms): add support for corequisite validation
fix(ui): resolve drag and drop issue in schedule view
docs(readme): update installation instructions
refactor(data): reorganize JSON structure
test(algorithms): add unit tests for DAG building
style(css): improve responsive design for mobile
```

## 🏗️ Architecture Overview

### 4-Phase Algorithm Implementation

```
Phase 1: Data Preparation
├── buildDAG()
├── removeCompletedCourses()
└── validateCurriculumData()

Phase 2: Available Courses
├── findReadyCourses()
├── calculatePriority()
└── applyAdvanceStudyConstraints()

Phase 3: Course Scheduling
├── buildOptimalSchedule()
├── applySortingStrategy()
└── validateCreditConstraints()

Phase 4: Evaluation & Feedback
├── validateSchedule()
├── calculateStatistics()
└── generateRecommendations()
```

### Module Dependencies

```
app.js (Main Controller)
├── algorithms.js (Core Engine)
├── visualizations.js (UI Components)
└── utils/ (Helper Functions)
```

## 🎨 UI Development

### Component Structure

```javascript
// Each UI component should be self-contained
class ScheduleVisualizer {
  constructor() {
    this.initializeComponent();
  }

  render(data) {
    // Rendering logic
  }

  setupEventListeners() {
    // Event handling
  }

  destroy() {
    // Cleanup
  }
}
```

### Styling Guidelines

- Use CSS Grid and Flexbox for layouts
- Mobile-first responsive design
- CSS Custom Properties for theming
- Consistent spacing scale (8px base unit)

## 📊 Performance Guidelines

### Algorithm Optimization

- Use efficient data structures (Map, Set)
- Minimize DOM manipulation
- Implement lazy loading for large datasets
- Cache computed results when possible

### Bundle Size

- Keep external dependencies minimal
- Use tree shaking for unused code
- Compress assets in production

## 🐛 Debugging

### Development Tools

```javascript
// Enable debug mode
localStorage.setItem("debug", "true");

// Console logging levels
console.log("Info:", data);
console.warn("Warning:", issue);
console.error("Error:", error);

// Performance monitoring
console.time("Algorithm Execution");
// ... algorithm code
console.timeEnd("Algorithm Execution");
```

### Common Issues

1. **Data loading errors**: Check file paths and CORS
2. **Algorithm performance**: Profile with browser DevTools
3. **UI responsiveness**: Test on different screen sizes
4. **Memory leaks**: Monitor memory usage in long sessions

## 📚 Documentation

### Code Documentation

```javascript
/**
 * Builds an optimal academic schedule using DAG algorithms
 * @param {Array} curriculum - Array of course objects
 * @param {Array} completedCourses - Array of completed course codes
 * @param {Object} options - Configuration options
 * @returns {Object} Generated schedule with validation results
 */
function buildOptimalPlan(curriculum, completedCourses, options) {
  // Implementation
}
```

### API Documentation

- Document all public methods
- Include usage examples
- Specify parameter types and return values
- Add performance notes for complex operations

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build:all

# Test production build
npm run serve:prod
```

### Environment Configuration

```javascript
const config = {
  development: {
    apiUrl: "http://localhost:3000",
    debug: true,
  },
  production: {
    apiUrl: "https://your-domain.com",
    debug: false,
  },
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Update documentation
6. Submit a pull request

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No console errors
- [ ] Responsive design tested
- [ ] Cross-browser compatibility verified

---

**Happy Coding! 🎓✨**
