/**
 * VISUALIZATIONS.JS - Data visualization components
 * Handles DAG visualization, charts, and interactive elements
 */

class ScheduleVisualizer {
    constructor() {
        this.dagSvg = null;
        this.dagData = null;
        this.charts = {};
    }

    /**
     * DAG Visualization using D3.js
     */
    initializeDAGVisualization(containerId) {
        const container = d3.select(`#${containerId}`);
        container.selectAll("*").remove();

        const width = container.node().getBoundingClientRect().width || 800;
        const height = container.node().getBoundingClientRect().height || 400;

        this.dagSvg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("border", "1px solid #ddd")
            .style("border-radius", "8px");

        // Add zoom and pan functionality
        const g = this.dagSvg.append("g");
        
        const zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        this.dagSvg.call(zoom);

        // Add arrow markers for directed edges
        this.dagSvg.append("defs")
            .append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 8)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#666");

        return g;
    }

    renderDAG(graph, completedCourses = []) {
        if (!this.dagSvg) return;

        const g = this.dagSvg.select("g");
        g.selectAll("*").remove();

        // Prepare data for visualization
        const nodes = this.prepareDAGNodes(graph, completedCourses);
        const links = this.prepareDAGLinks(graph, nodes);

        // Create force simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(400, 200))
            .force("collision", d3.forceCollide().radius(30));

        // Create links
        const link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrowhead)");

        // Create nodes
        const node = g.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", this.dragstarted)
                .on("drag", this.dragged)
                .on("end", this.dragended));

        // Add circles for nodes
        node.append("circle")
            .attr("r", d => Math.max(15, Math.sqrt(d.credits) * 3))
            .attr("fill", d => this.getNodeColor(d))
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);

        // Add labels
        node.append("text")
            .attr("dx", 0)
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .text(d => d.code.substring(d.code.length - 3));

        // Add tooltips
        node.append("title")
            .text(d => `${d.code}: ${d.name}\n${d.credits} tín chỉ\n${d.isRequired ? 'Bắt buộc' : 'Tự chọn'}`);

        // Update positions on simulation tick
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Store simulation for controls
        this.simulation = simulation;
    }

    prepareDAGNodes(graph, completedCourses) {
        const completedSet = new Set(completedCourses);
        const nodes = [];

        for (const [code, course] of graph.courseMap) {
            nodes.push({
                id: code,
                code: code,
                name: course.name,
                credits: course.credits,
                isRequired: course.isRequired,
                isCompleted: completedSet.has(code),
                expectedSemester: course.expectedSemester || 1,
                difficulty: course.difficulty || 1,
                category: course.category
            });
        }

        return nodes;
    }

    prepareDAGLinks(graph, nodes) {
        const links = [];
        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        for (const [courseCode, prerequisites] of Object.entries(graph.adjacencyList)) {
            prerequisites.forEach(prereq => {
                if (nodeMap.has(prereq) && nodeMap.has(courseCode)) {
                    links.push({
                        source: prereq,
                        target: courseCode
                    });
                }
            });
        }

        return links;
    }

    getNodeColor(node) {
        if (node.isCompleted) return '#28a745'; // Green for completed
        if (node.isRequired) return '#667eea'; // Blue for required
        if (node.category === 'math') return '#ff6b6b'; // Red for math
        if (node.category === 'programming') return '#ffa726'; // Orange for programming
        return '#95a5a6'; // Gray for electives
    }

    // Drag handlers
    dragstarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    dragended(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // DAG controls
    resetZoom() {
        if (this.dagSvg) {
            this.dagSvg.transition().duration(750).call(
                d3.zoom().transform,
                d3.zoomIdentity
            );
        }
    }

    centerGraph() {
        if (this.simulation) {
            this.simulation.alpha(1).restart();
        }
    }

    /**
     * Schedule Timeline Visualization
     */
    renderScheduleTimeline(schedule, containerId) {
        const container = d3.select(`#${containerId}`);
        container.selectAll("*").remove();

        if (!schedule || schedule.length === 0) {
            container.append("p")
                .attr("class", "placeholder")
                .text("Chưa có dữ liệu lịch học");
            return;
        }

        const width = container.node().getBoundingClientRect().width || 800;
        const height = 200;
        const margin = { top: 20, right: 20, bottom: 40, left: 60 };

        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height);

        // Prepare timeline data
        const timelineData = schedule.map((sem, index) => ({
            index,
            semester: sem.semester,
            semesterType: sem.semesterType,
            year: sem.year,
            credits: sem.credits,
            courseCount: sem.courses.length
        }));

        // Scales
        const xScale = d3.scaleLinear()
            .domain([0, timelineData.length - 1])
            .range([margin.left, width - margin.right]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(timelineData, d => d.credits)])
            .range([height - margin.bottom, margin.top]);

        // Line generator
        const line = d3.line()
            .x(d => xScale(d.index))
            .y(d => yScale(d.credits))
            .curve(d3.curveMonotoneX);

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xScale)
                .tickFormat(i => timelineData[i] ? `HK${timelineData[i].semester}` : ""));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale));

        // Add axis labels
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Tín chỉ");

        // Add the line
        svg.append("path")
            .datum(timelineData)
            .attr("fill", "none")
            .attr("stroke", "#667eea")
            .attr("stroke-width", 3)
            .attr("d", line);

        // Add points
        svg.selectAll(".dot")
            .data(timelineData)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.index))
            .attr("cy", d => yScale(d.credits))
            .attr("r", 5)
            .attr("fill", d => d.semesterType === 'summer' ? '#ffa726' : '#667eea')
            .append("title")
            .text(d => `Học kỳ ${d.semester} (${d.semesterType === 'summer' ? 'Hè' : 'Chính'})\n${d.credits} tín chỉ, ${d.courseCount} môn`);
    }

    /**
     * Statistics Charts
     */
    renderStatisticsCharts(statistics, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        // Credit distribution pie chart
        this.renderCreditDistributionChart(statistics, container);
        
        // Load balance chart
        this.renderLoadBalanceChart(statistics, container);
    }

    renderCreditDistributionChart(statistics, container) {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 200;
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Bắt buộc', 'Tự chọn'],
                datasets: [{
                    data: [statistics.requiredCredits, statistics.electiveCredits],
                    backgroundColor: ['#667eea', '#ffa726'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Phân bổ tín chỉ'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderLoadBalanceChart(statistics, container) {
        // This would be implemented based on load balance data
        // For now, create a simple bar chart placeholder
        const chartDiv = document.createElement('div');
        chartDiv.innerHTML = `
            <h4>Cân bằng tải học tập</h4>
            <p>Tín chỉ tối thiểu: ${statistics.loadBalance.minCredits}</p>
            <p>Tín chỉ tối đa: ${statistics.loadBalance.maxCredits}</p>
            <p>Độ lệch chuẩn: ${statistics.loadBalance.standardDeviation?.toFixed(2) || 0}</p>
        `;
        container.appendChild(chartDiv);
    }

    /**
     * Ready Courses Visualization
     */
    renderReadyCourses(readyCourses, containerId, filters = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (!readyCourses || readyCourses.length === 0) {
            container.innerHTML = '<p class="placeholder">Không có môn học khả dụng</p>';
            return;
        }

        // Apply filters
        let filteredCourses = [...readyCourses];
        
        if (filters.semester && filters.semester !== 'all') {
            // Filter logic based on semester
        }
        
        if (filters.category && filters.category !== 'all') {
            filteredCourses = filteredCourses.filter(course => 
                filters.category === 'required' ? course.isRequired : !course.isRequired
            );
        }

        // Sort by priority
        filteredCourses.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // Create course items
        filteredCourses.forEach(course => {
            const courseItem = document.createElement('div');
            courseItem.className = 'ready-course-item';
            courseItem.innerHTML = `
                <div class="ready-course-header">
                    <span class="ready-course-code">${course.code}</span>
                    <span class="ready-course-credits">${course.credits} TC</span>
                </div>
                <div class="ready-course-name">${course.name}</div>
                <div class="ready-course-info">
                    ${course.isRequired ? '📌 Bắt buộc' : '📝 Tự chọn'} • 
                    HK${course.expectedSemester} • 
                    ${course.isAdvanceStudy ? '🚀 Học vượt' : ''}
                    ${course.priority ? `• Ưu tiên: ${Math.round(course.priority)}` : ''}
                </div>
            `;
            container.appendChild(courseItem);
        });
    }

    /**
     * Prerequisites Analysis Visualization
     */
    renderPrerequisitesAnalysis(graph, bottlenecks, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Create statistics section
        const statsContainer = container.querySelector('.prerequisites-stats');
        if (statsContainer) {
            statsContainer.innerHTML = '';

            const totalCourses = Object.keys(graph.adjacencyList).length;
            const coursesWithPrereqs = Object.values(graph.adjacencyList)
                .filter(prereqs => prereqs.length > 0).length;
            const avgPrereqs = Object.values(graph.adjacencyList)
                .reduce((sum, prereqs) => sum + prereqs.length, 0) / totalCourses;

            const stats = [
                { label: 'Tổng môn học', value: totalCourses },
                { label: 'Có tiên quyết', value: coursesWithPrereqs },
                { label: 'TB tiên quyết', value: avgPrereqs.toFixed(1) },
                { label: 'Môn tắc nghẽn', value: bottlenecks.length }
            ];

            stats.forEach(stat => {
                const statDiv = document.createElement('div');
                statDiv.className = 'prereq-stat';
                statDiv.innerHTML = `
                    <div class="prereq-stat-number">${stat.value}</div>
                    <div class="prereq-stat-label">${stat.label}</div>
                `;
                statsContainer.appendChild(statDiv);
            });
        }

        // Create bottlenecks section
        const bottlenecksContainer = container.querySelector('.bottlenecks');
        if (bottlenecksContainer) {
            bottlenecksContainer.innerHTML = '<h4>Môn học gây tắc nghẽn</h4>';

            if (bottlenecks.length === 0) {
                bottlenecksContainer.innerHTML += '<p>Không có môn nào gây tắc nghẽn đáng kể</p>';
            } else {
                bottlenecks.slice(0, 5).forEach(course => {
                    const bottleneckDiv = document.createElement('div');
                    bottleneckDiv.className = 'bottleneck-item';
                    bottleneckDiv.innerHTML = `
                        <span class="bottleneck-course">${course.code}: ${course.name}</span>
                        <span class="bottleneck-count">${course.dependentCount} môn phụ thuộc</span>
                    `;
                    bottlenecksContainer.appendChild(bottleneckDiv);
                });
            }
        }
    }

    /**
     * Validation Results Visualization
     */
    renderValidationResults(validation, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        // Overall status
        const statusDiv = document.createElement('div');
        statusDiv.className = `validation-item ${validation.isValid ? 'success' : 'error'}`;
        statusDiv.innerHTML = `
            <strong>${validation.isValid ? '✅ Kế hoạch hợp lệ' : '❌ Kế hoạch có lỗi'}</strong>
        `;
        container.appendChild(statusDiv);

        // Errors
        validation.errors.forEach(error => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-item error';
            errorDiv.innerHTML = `
                <strong>❌ ${error.type}</strong><br>
                Môn: ${error.course} (HK${error.semester}${error.semesterType === 'summer' ? ' - Hè' : ''})<br>
                ${error.missing ? `Thiếu: ${error.missing.join(', ')}` : ''}
            `;
            container.appendChild(errorDiv);
        });

        // Warnings
        validation.warnings.forEach(warning => {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'validation-item warning';
            warningDiv.innerHTML = `
                <strong>⚠️ ${warning.type}</strong><br>
                ${warning.course ? `Môn: ${warning.course}` : ''}
                ${warning.semester ? `(HK${warning.semester}${warning.semesterType === 'summer' ? ' - Hè' : ''})` : ''}
                ${warning.credits ? `<br>Tín chỉ: ${warning.credits}` : ''}
                ${warning.missing ? `<br>Thiếu: ${warning.missing.join(', ')}` : ''}
            `;
            container.appendChild(warningDiv);
        });

        if (validation.errors.length === 0 && validation.warnings.length === 0) {
            const successDiv = document.createElement('div');
            successDiv.className = 'validation-item success';
            successDiv.innerHTML = '✅ Không có cảnh báo hoặc lỗi nào';
            container.appendChild(successDiv);
        }
    }

    /**
     * Recommendations Visualization
     */
    renderRecommendations(recommendations, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (!recommendations || recommendations.length === 0) {
            container.innerHTML = '<p class="placeholder">Không có khuyến nghị nào</p>';
            return;
        }

        recommendations.forEach(rec => {
            const recDiv = document.createElement('div');
            recDiv.className = 'recommendation-item';
            recDiv.innerHTML = `
                <div class="recommendation-priority priority-${rec.priority}">${rec.priority.toUpperCase()}</div>
                <div class="recommendation-title">${rec.type}</div>
                <div class="recommendation-description">${rec.description}</div>
                <div class="recommendation-suggestion">💡 ${rec.suggestion}</div>
            `;
            container.appendChild(recDiv);
        });
    }

    /**
     * Strategy Comparison Visualization
     */
    renderStrategyComparison(comparisonResults, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (!comparisonResults || comparisonResults.length === 0) {
            container.innerHTML = '<p class="placeholder">Chưa có dữ liệu so sánh</p>';
            return;
        }

        // Create comparison table
        const table = document.createElement('table');
        table.className = 'comparison-table';

        // Header
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th>Chiến lược</th>
            <th>Thời gian (năm)</th>
            <th>HK chính</th>
            <th>HK hè</th>
            <th>Học vượt</th>
            <th>Tổng tín chỉ</th>
        `;
        table.appendChild(headerRow);

        // Data rows
        comparisonResults.forEach(result => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${result.name}</strong></td>
                <td>${result.completionTimeInYears}</td>
                <td>${result.regularSemesters}</td>
                <td>${result.summerSemesters}</td>
                <td>${result.advancedStudyCourses}</td>
                <td>${result.totalCredits}</td>
            `;
            table.appendChild(row);
        });

        container.appendChild(table);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScheduleVisualizer;
} else {
    window.ScheduleVisualizer = ScheduleVisualizer;
}
