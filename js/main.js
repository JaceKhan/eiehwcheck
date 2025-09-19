/**
 * A7-1 Let's Speak 1 - 숙제 체크 관리 시스템
 * Main JavaScript Application (Local Storage Version)
 * 날짜 계산 수정된 버전
 */

class HomeworkCheckSystem {
    constructor() {
        this.students = [];
        this.homeworkChecks = [];
        this.currentWeek = this.getCurrentWeek();
        this.currentTeacher = 'Erica T';
        this.classes = [];
        this.currentClass = null;
        this.studentChart = null;
        this.dailyChart = null;
        
        this.init();
    }

    /**
     * 시스템 초기화
     */
    async init() {
        this.setupEventListeners();
        this.setCurrentWeek();
        this.loadData();
        this.showTab('students');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // Tab navigation
        document.getElementById('tab-students').addEventListener('click', () => this.showTab('students'));
        document.getElementById('tab-homework').addEventListener('click', () => this.showTab('homework'));
        document.getElementById('tab-statistics').addEventListener('click', () => this.showTab('statistics'));

        // Student management
        document.getElementById('add-student-btn').addEventListener('click', () => this.showAddStudentForm());
        document.getElementById('cancel-student-btn').addEventListener('click', () => this.hideAddStudentForm());
        document.getElementById('student-form').addEventListener('submit', (e) => this.handleAddStudent(e));
        document.getElementById('go-to-students').addEventListener('click', () => this.showTab('students'));

        // Homework management
        document.getElementById('week-selector').addEventListener('change', (e) => this.handleWeekChange(e));
        document.getElementById('teacher-name').addEventListener('change', (e) => this.handleTeacherChange(e));

        // Class management
        document.getElementById('manage-classes-btn').addEventListener('click', () => this.showClassManagement());
        document.getElementById('close-class-modal').addEventListener('click', () => this.hideClassManagement());
        document.getElementById('add-class-form').addEventListener('submit', (e) => this.handleAddClass(e));
        document.getElementById('class-selector').addEventListener('change', (e) => this.handleClassChange(e));

        // Statistics
        document.getElementById('calculate-stats').addEventListener('click', () => this.calculateStatistics());
        document.getElementById('last-week').addEventListener('click', () => this.setDateRange(7));
        document.getElementById('last-month').addEventListener('click', () => this.setDateRange(30));
        document.getElementById('this-month').addEventListener('click', () => this.setCurrentMonth());
    }

    /**
     * 탭 전환
     */
    showTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            btn.classList.add('border-transparent', 'text-gray-500');
            btn.classList.remove('border-blue-500', 'text-blue-600');
        });

        const activeTab = document.getElementById(`tab-${tabName}`);
        activeTab.classList.add('active');
        activeTab.classList.remove('border-transparent', 'text-gray-500');
        activeTab.classList.add('border-blue-500', 'text-blue-600');

        // Show/hide content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`content-${tabName}`).classList.remove('hidden');

        // Load appropriate data
        if (tabName === 'students') {
            this.renderStudents();
        } else if (tabName === 'homework') {
            this.renderHomeworkTable();
        } else if (tabName === 'statistics') {
            this.initializeStatistics();
        }
    }

    /**
     * 현재 주 반환 (간단한 방법, HTML5 week input과 호환)
     */
    getCurrentWeek() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const date = today.getDate();
        const day = today.getDay();
        
        // 이번 주 월요일 찾기 (일요일을 0으로, 월요일을 1로 계산)
        const monday = new Date(year, month, date - (day === 0 ? 6 : day - 1));
        
        // 1월 첫 번째 월요일부터 몇 주째인지 계산
        const firstMonday = new Date(year, 0, 1);
        const firstDay = firstMonday.getDay();
        
        // 1월 1일이 월요일이 아니라면 첫 번째 월요일 찾기
        if (firstDay !== 1) {
            const daysToMonday = firstDay === 0 ? 1 : 8 - firstDay;
            firstMonday.setDate(1 + daysToMonday);
        }
        
        // 현재 월요일까지 몇 주인지 계산
        const weeksDiff = Math.floor((monday - firstMonday) / (7 * 24 * 60 * 60 * 1000));
        const weekNum = weeksDiff + 1;
        
        return `${year}-W${weekNum.toString().padStart(2, '0')}`;
    }

    /**
     * 주간 선택기 초기값 설정
     */
    setCurrentWeek() {
        document.getElementById('week-selector').value = this.currentWeek;
        document.getElementById('teacher-name').value = this.currentTeacher;
    }

    /**
     * 로컬 스토리지에서 데이터 로드
     */
    loadData() {
        try {
            // 반 데이터 로드
            const savedClasses = localStorage.getItem('homework_classes');
            if (savedClasses) {
                this.classes = JSON.parse(savedClasses);
            } else {
                // 초기 반 데이터 설정
                this.initializeDefaultClasses();
            }

            // 현재 선택된 반 로드
            const savedCurrentClass = localStorage.getItem('homework_current_class');
            if (savedCurrentClass && this.classes.find(c => c.id === savedCurrentClass)) {
                this.currentClass = savedCurrentClass;
            } else if (this.classes.length > 0) {
                this.currentClass = this.classes[0].id;
            }

            // 반별 데이터 로드
            this.loadClassData();
            this.updateClassSelector();
            this.updateClassDisplay();

        } catch (error) {
            console.error('데이터 로드 중 오류:', error);
            this.showError('데이터를 불러오는 중 오류가 발생했습니다.');
        }
    }

    /**
     * 현재 반의 데이터 로드
     */
    loadClassData() {
        if (!this.currentClass) return;

        try {
            // 학생 데이터 로드
            const savedStudents = localStorage.getItem(`homework_students_${this.currentClass}`);
            if (savedStudents) {
                this.students = JSON.parse(savedStudents);
            } else {
                // 기본반인 경우만 초기 데이터 설정
                if (this.currentClass === 'class_default') {
                    this.initializeDefaultStudents();
                } else {
                    this.students = [];
                }
            }

            // 숙제 체크 데이터 로드
            const savedHomeworkChecks = localStorage.getItem(`homework_checks_${this.currentClass}`);
            if (savedHomeworkChecks) {
                this.homeworkChecks = JSON.parse(savedHomeworkChecks);
            } else {
                this.homeworkChecks = [];
            }

        } catch (error) {
            console.error('반 데이터 로드 중 오류:', error);
            this.showError('반 데이터를 불러오는 중 오류가 발생했습니다.');
        }
    }

    /**
     * 초기 반 데이터 설정
     */
    initializeDefaultClasses() {
        const defaultClasses = [{
            id: 'class_default',
            name: 'A7-1 Let\'s Speak 1',
            schedule: '월-금 15:10-16:00',
            description: '기본반'
        }];

        this.classes = defaultClasses;
        this.saveClasses();
    }

    /**
     * 초기 학생 데이터 설정
     */
    initializeDefaultStudents() {
        const currentClassName = this.getCurrentClassName();
        const defaultStudents = [
            { id: this.generateId(), korean_name: '김태이', english_name: 'Tay', class_name: currentClassName, active: true },
            { id: this.generateId(), korean_name: '박재이', english_name: 'Jay', class_name: currentClassName, active: true },
            { id: this.generateId(), korean_name: '박준희', english_name: 'Junhee', class_name: currentClassName, active: true },
            { id: this.generateId(), korean_name: '송주원', english_name: 'Juwon', class_name: currentClassName, active: true },
            { id: this.generateId(), korean_name: '양승호', english_name: 'Ryan', class_name: currentClassName, active: true },
            { id: this.generateId(), korean_name: '이로빈', english_name: 'Robin', class_name: currentClassName, active: true },
            { id: this.generateId(), korean_name: '조예슬', english_name: 'Stella', class_name: currentClassName, active: true },
            { id: this.generateId(), korean_name: '편주원', english_name: 'James', class_name: currentClassName, active: true },
            { id: this.generateId(), korean_name: '서선준', english_name: 'Seonjun', class_name: currentClassName, active: true }
        ];

        this.students = defaultStudents;
        this.saveStudents();
    }

    /**
     * 현재 반 이름 반환
     */
    getCurrentClassName() {
        const currentClassObj = this.classes.find(c => c.id === this.currentClass);
        return currentClassObj ? currentClassObj.name : 'A7-1 Let\'s Speak 1';
    }

    /**
     * 고유 ID 생성
     */
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    /**
     * 반 데이터 저장
     */
    saveClasses() {
        try {
            localStorage.setItem('homework_classes', JSON.stringify(this.classes));
        } catch (error) {
            console.error('반 데이터 저장 오류:', error);
            this.showError('반 데이터 저장 중 오류가 발생했습니다.');
        }
    }

    /**
     * 현재 반 저장
     */
    saveCurrentClass() {
        try {
            localStorage.setItem('homework_current_class', this.currentClass);
        } catch (error) {
            console.error('현재 반 저장 오류:', error);
        }
    }

    /**
     * 학생 데이터 저장
     */
    saveStudents() {
        try {
            if (this.currentClass) {
                localStorage.setItem(`homework_students_${this.currentClass}`, JSON.stringify(this.students));
            }
        } catch (error) {
            console.error('학생 데이터 저장 오류:', error);
            this.showError('데이터 저장 중 오류가 발생했습니다.');
        }
    }

    /**
     * 숙제 체크 데이터 저장
     */
    saveHomeworkChecks() {
        try {
            if (this.currentClass) {
                localStorage.setItem(`homework_checks_${this.currentClass}`, JSON.stringify(this.homeworkChecks));
            }
        } catch (error) {
            console.error('숙제 체크 데이터 저장 오류:', error);
            this.showError('데이터 저장 중 오류가 발생했습니다.');
        }
    }

    /**
     * 학생 목록 렌더링
     */
    renderStudents() {
        const container = document.getElementById('student-list');
        const emptyMessage = document.getElementById('empty-students');

        if (this.students.length === 0) {
            container.innerHTML = '';
            emptyMessage.classList.remove('hidden');
            return;
        }

        emptyMessage.classList.add('hidden');
        
        container.innerHTML = this.students.map((student, index) => `
            <div class="student-card flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="student-avatar student-color-${(index % 10) + 1}">
                        ${student.korean_name ? student.korean_name.charAt(0) : '?'}
                    </div>
                    <div>
                        <div class="font-medium text-gray-900">${student.korean_name || '이름 없음'}</div>
                        <div class="text-sm text-gray-500">${student.english_name || 'No English name'}</div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="status-indicator ${student.active ? 'status-active' : 'status-inactive'}"></span>
                    <span class="text-sm ${student.active ? 'text-green-600' : 'text-red-600'}">
                        ${student.active ? '활성' : '비활성'}
                    </span>
                    <button onclick="homeworkSystem.toggleStudentStatus('${student.id}')" 
                            class="ml-4 text-sm px-3 py-1 rounded-md ${student.active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}">
                        ${student.active ? '비활성화' : '활성화'}
                    </button>
                    <button onclick="homeworkSystem.deleteStudent('${student.id}')" 
                            class="text-sm px-3 py-1 bg-gray-100 text-red-600 rounded-md hover:bg-red-100">
                        삭제
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * 학생 추가 폼 표시
     */
    showAddStudentForm() {
        document.getElementById('add-student-form').classList.remove('hidden');
        document.getElementById('korean-name').focus();
    }

    /**
     * 학생 추가 폼 숨김
     */
    hideAddStudentForm() {
        document.getElementById('add-student-form').classList.add('hidden');
        document.getElementById('student-form').reset();
    }

    /**
     * 학생 추가 처리
     */
    handleAddStudent(event) {
        event.preventDefault();
        
        const koreanName = document.getElementById('korean-name').value.trim();
        const englishName = document.getElementById('english-name').value.trim();

        if (!koreanName || !englishName) {
            this.showError('모든 필드를 입력해주세요.');
            return;
        }

        try {
            const newStudent = {
                id: this.generateId(),
                korean_name: koreanName,
                english_name: englishName,
                class_name: this.getCurrentClassName(),
                active: true
            };

            this.students.push(newStudent);
            this.saveStudents();
            this.hideAddStudentForm();
            this.renderStudents();
            this.showSuccess('학생이 성공적으로 추가되었습니다.');

        } catch (error) {
            console.error('학생 추가 오류:', error);
            this.showError('학생 추가 중 오류가 발생했습니다.');
        }
    }

    /**
     * 학생 상태 토글
     */
    toggleStudentStatus(studentId) {
        try {
            const student = this.students.find(s => s.id === studentId);
            if (!student) return;

            student.active = !student.active;
            this.saveStudents();
            this.renderStudents();
            this.showSuccess(`학생 상태가 ${student.active ? '활성' : '비활성'}으로 변경되었습니다.`);

        } catch (error) {
            console.error('학생 상태 변경 오류:', error);
            this.showError('상태 변경 중 오류가 발생했습니다.');
        }
    }

    /**
     * 학생 삭제
     */
    deleteStudent(studentId) {
        if (!confirm('정말로 이 학생을 삭제하시겠습니까?\n해당 학생의 모든 숙제 기록도 함께 삭제됩니다.')) return;

        try {
            // 학생 삭제
            this.students = this.students.filter(s => s.id !== studentId);
            this.saveStudents();

            // 해당 학생의 숙제 기록도 삭제
            this.homeworkChecks = this.homeworkChecks.filter(check => check.student_id !== studentId);
            this.saveHomeworkChecks();

            this.renderStudents();
            this.showSuccess('학생이 성공적으로 삭제되었습니다.');

        } catch (error) {
            console.error('학생 삭제 오류:', error);
            this.showError('학생 삭제 중 오류가 발생했습니다.');
        }
    }

    /**
     * 숙제 체크리스트 테이블 렌더링
     */
    renderHomeworkTable() {
        const container = document.getElementById('homework-table');
        const noStudentsMessage = document.getElementById('no-students-homework');
        
        const activeStudents = this.students.filter(s => s.active);

        if (activeStudents.length === 0) {
            container.innerHTML = '';
            noStudentsMessage.classList.remove('hidden');
            return;
        }

        noStudentsMessage.classList.add('hidden');

        const weekDates = this.getWeekDates(this.currentWeek);
        const weekdays = ['월', '화', '수', '목', '금'];

        let tableHTML = `
            <table class="homework-table">
                <thead>
                    <tr>
                        <th class="student-name-cell">학생</th>
                        ${weekdays.map((day, index) => `
                            <th>${day}<br><span class="text-xs text-gray-500">${weekDates[index]}</span></th>
                        `).join('')}
                        <th>완료율</th>
                    </tr>
                </thead>
                <tbody>
        `;

        activeStudents.forEach((student, studentIndex) => {
            let completedCount = 0;
            let totalDays = weekdays.length;

            tableHTML += `
                <tr>
                    <td class="student-name-cell">
                        <div class="student-korean student-color-${(studentIndex % 10) + 1}">${student.korean_name}</div>
                        <div class="student-english">${student.english_name}</div>
                    </td>
            `;

            weekdays.forEach((day, dayIndex) => {
                const date = weekDates[dayIndex];
                const isChecked = this.isHomeworkChecked(student.id, date);
                if (isChecked) completedCount++;

                tableHTML += `
                    <td>
                        <input type="checkbox" 
                               class="homework-checkbox" 
                               ${isChecked ? 'checked' : ''}
                               onchange="homeworkSystem.toggleHomeworkCheck('${student.id}', '${date}', this.checked)"
                               data-tooltip="${student.korean_name} - ${date}">
                    </td>
                `;
            });

            const completionRate = Math.round((completedCount / totalDays) * 100);
            tableHTML += `
                <td>
                    <div class="flex items-center space-x-2">
                        <div class="progress-bar flex-1">
                            <div class="progress-fill" style="width: ${completionRate}%"></div>
                        </div>
                        <span class="text-sm font-medium">${completionRate}%</span>
                    </div>
                </td>
            `;

            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }

    /**
     * 주간 날짜 배열 반환 (수정된 버전)
     */
    getWeekDates(weekString) {
        const [year, weekPart] = weekString.split('-W');
        const weekNum = parseInt(weekPart);
        
        // 해당 년도 1월 1일
        const jan1 = new Date(parseInt(year), 0, 1);
        const jan1Day = jan1.getDay(); // 0=일요일, 1=월요일, ...
        
        // 1월 첫 번째 월요일 찾기
        let firstMonday;
        if (jan1Day <= 1) {
            // 1월 1일이 일요일(0) 또는 월요일(1)인 경우
            firstMonday = new Date(parseInt(year), 0, jan1Day === 0 ? 2 : 1);
        } else {
            // 1월 1일이 화요일 이후인 경우
            firstMonday = new Date(parseInt(year), 0, 1 + (8 - jan1Day));
        }
        
        // 해당 주의 월요일 계산 (weekNum-1 주 후)
        const targetMonday = new Date(firstMonday);
        targetMonday.setDate(firstMonday.getDate() + (weekNum - 1) * 7);

        const dates = [];
        for (let i = 0; i < 5; i++) { // 월-금
            const date = new Date(targetMonday);
            date.setDate(targetMonday.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }

        return dates;
    }

    /**
     * 숙제 완료 여부 확인
     */
    isHomeworkChecked(studentId, date) {
        return this.homeworkChecks.some(check => 
            check.student_id === studentId && 
            check.date === date && 
            check.completed
        );
    }

    /**
     * 숙제 체크 토글
     */
    toggleHomeworkCheck(studentId, date, isChecked) {
        try {
            const existingCheckIndex = this.homeworkChecks.findIndex(check => 
                check.student_id === studentId && check.date === date
            );

            if (existingCheckIndex >= 0) {
                // 기존 체크 업데이트
                this.homeworkChecks[existingCheckIndex].completed = isChecked;
                this.homeworkChecks[existingCheckIndex].checked_by = this.currentTeacher;
                this.homeworkChecks[existingCheckIndex].updated_at = new Date().toISOString();
            } else {
                // 새로운 체크 생성
                const newCheck = {
                    id: this.generateId(),
                    student_id: studentId,
                    date: date,
                    completed: isChecked,
                    checked_by: this.currentTeacher,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                this.homeworkChecks.push(newCheck);
            }

            this.saveHomeworkChecks();
            // 테이블 업데이트 (완료율 다시 계산)
            this.renderHomeworkTable();

        } catch (error) {
            console.error('숙제 체크 업데이트 오류:', error);
            this.showError('숙제 체크 업데이트 중 오류가 발생했습니다.');
        }
    }

    /**
     * 주간 변경 처리
     */
    handleWeekChange(event) {
        this.currentWeek = event.target.value;
        this.renderHomeworkTable();
    }

    /**
     * 선생님 변경 처리
     */
    handleTeacherChange(event) {
        this.currentTeacher = event.target.value;
    }

    /**
     * 반 관리 모달 표시
     */
    showClassManagement() {
        document.getElementById('class-management-modal').classList.remove('hidden');
        this.renderClassesList();
    }

    /**
     * 반 관리 모달 숨김
     */
    hideClassManagement() {
        document.getElementById('class-management-modal').classList.add('hidden');
        document.getElementById('add-class-form').reset();
    }

    /**
     * 반 목록 렌더링
     */
    renderClassesList() {
        const container = document.getElementById('classes-list');
        
        if (this.classes.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">등록된 반이 없습니다.</p>';
            return;
        }

        container.innerHTML = this.classes.map((classItem) => `
            <div class="bg-gray-50 rounded-lg p-4 border ${classItem.id === this.currentClass ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <h5 class="font-medium text-gray-900">${classItem.name}</h5>
                        <p class="text-sm text-gray-600 mt-1">
                            <i class="fas fa-clock mr-1"></i>${classItem.schedule}
                        </p>
                        ${classItem.description ? `<p class="text-sm text-gray-500 mt-1">${classItem.description}</p>` : ''}
                        ${classItem.id === this.currentClass ? '<span class="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded mt-2">현재 선택</span>' : ''}
                    </div>
                    <div class="flex items-center space-x-2 ml-4">
                        ${classItem.id !== this.currentClass ? `<button onclick="homeworkSystem.selectClass('${classItem.id}')" 
                                class="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
                                선택
                            </button>` : ''}
                        ${classItem.id !== 'class_default' ? `<button onclick="homeworkSystem.deleteClass('${classItem.id}')" 
                                class="text-sm px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200">
                                삭제
                            </button>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 새 반 추가 처리
     */
    handleAddClass(event) {
        event.preventDefault();
        
        const className = document.getElementById('new-class-name').value.trim();
        const schedule = document.getElementById('new-class-schedule').value.trim();
        const description = document.getElementById('new-class-description').value.trim();

        if (!className || !schedule) {
            this.showError('반 이름과 수업 시간을 입력해주세요.');
            return;
        }

        // 중복 체크
        if (this.classes.some(c => c.name === className)) {
            this.showError('이미 같은 이름의 반이 있습니다.');
            return;
        }

        try {
            const newClass = {
                id: this.generateId(),
                name: className,
                schedule: schedule,
                description: description || ''
            };

            this.classes.push(newClass);
            this.saveClasses();
            this.updateClassSelector();
            this.renderClassesList();
            
            document.getElementById('add-class-form').reset();
            this.showSuccess('새 반이 성공적으로 추가되었습니다.');

        } catch (error) {
            console.error('반 추가 오류:', error);
            this.showError('반 추가 중 오류가 발생했습니다.');
        }
    }

    /**
     * 반 선택
     */
    selectClass(classId) {
        if (classId === this.currentClass) return;

        this.currentClass = classId;
        this.saveCurrentClass();
        this.loadClassData();
        this.updateClassSelector();
        this.updateClassDisplay();
        this.renderStudents();
        this.renderHomeworkTable();
        this.renderClassesList();
        
        this.showSuccess('반이 변경되었습니다.');
    }

    /**
     * 반 삭제
     */
    deleteClass(classId) {
        const classToDelete = this.classes.find(c => c.id === classId);
        if (!classToDelete) return;

        if (!confirm(`'${classToDelete.name}' 반을 삭제하시겠습니까?\n해당 반의 모든 학생과 숙제 기록이 함께 삭제됩니다.`)) return;

        try {
            // 반 목록에서 제거
            this.classes = this.classes.filter(c => c.id !== classId);
            this.saveClasses();

            // 해당 반의 데이터 삭제
            localStorage.removeItem(`homework_students_${classId}`);
            localStorage.removeItem(`homework_checks_${classId}`);

            // 현재 반이 삭제된 반이라면 다른 반으로 변경
            if (this.currentClass === classId) {
                if (this.classes.length > 0) {
                    this.currentClass = this.classes[0].id;
                    this.saveCurrentClass();
                    this.loadClassData();
                    this.updateClassDisplay();
                    this.renderStudents();
                    this.renderHomeworkTable();
                }
            }

            this.updateClassSelector();
            this.renderClassesList();
            this.showSuccess('반이 성공적으로 삭제되었습니다.');

        } catch (error) {
            console.error('반 삭제 오류:', error);
            this.showError('반 삭제 중 오류가 발생했습니다.');
        }
    }

    /**
     * 반 선택기 업데이트
     */
    updateClassSelector() {
        const selector = document.getElementById('class-selector');
        selector.innerHTML = this.classes.map(classItem => 
            `<option value="${classItem.id}" ${classItem.id === this.currentClass ? 'selected' : ''}>${classItem.name}</option>`
        ).join('');
    }

    /**
     * 반 표시 업데이트
     */
    updateClassDisplay() {
        const currentClassObj = this.classes.find(c => c.id === this.currentClass);
        if (currentClassObj) {
            document.getElementById('current-class-title').textContent = currentClassObj.name;
            document.getElementById('class-schedule').textContent = currentClassObj.schedule;
        }
    }

    /**
     * 반 변경 처리
     */
    handleClassChange(event) {
        const selectedClassId = event.target.value;
        this.selectClass(selectedClassId);
    }

    /**
     * 통계 초기화
     */
    initializeStatistics() {
        this.setDefaultDates();
        document.getElementById('statistics-results').classList.add('hidden');
        document.getElementById('no-stats-data').classList.remove('hidden');
    }

    /**
     * 기본 날짜 설정 (최근 1개월)
     */
    setDefaultDates() {
        const today = new Date();
        const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        
        document.getElementById('end-date').value = today.toISOString().split('T')[0];
        document.getElementById('start-date').value = oneMonthAgo.toISOString().split('T')[0];
    }

    /**
     * 날짜 범위 설정
     */
    setDateRange(days) {
        const today = new Date();
        const startDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
        
        document.getElementById('end-date').value = today.toISOString().split('T')[0];
        document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
    }

    /**
     * 이번 달 설정
     */
    setCurrentMonth() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        document.getElementById('start-date').value = firstDay.toISOString().split('T')[0];
        document.getElementById('end-date').value = today.toISOString().split('T')[0];
    }

    /**
     * 통계 계산
     */
    calculateStatistics() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        if (!startDate || !endDate) {
            this.showError('시작일과 종료일을 모두 선택해주세요.');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            this.showError('시작일이 종료일보다 늦을 수 없습니다.');
            return;
        }

        try {
            const stats = this.generateStatistics(startDate, endDate);
            this.displayStatistics(stats, startDate, endDate);
            
            document.getElementById('no-stats-data').classList.add('hidden');
            document.getElementById('statistics-results').classList.remove('hidden');

        } catch (error) {
            console.error('통계 계산 오류:', error);
            this.showError('통계 계산 중 오류가 발생했습니다.');
        }
    }

    /**
     * 통계 데이터 생성
     */
    generateStatistics(startDate, endDate) {
        const activeStudents = this.students.filter(s => s.active);
        const dateRange = this.getDateRange(startDate, endDate);
        
        // 평일만 필터링 (월-금)
        const weekdays = dateRange.filter(date => {
            const day = new Date(date).getDay();
            return day >= 1 && day <= 5; // 월(1) ~ 금(5)
        });

        const studentStats = activeStudents.map(student => {
            const completedAssignments = weekdays.filter(date => 
                this.isHomeworkChecked(student.id, date)
            ).length;

            const completionRate = weekdays.length > 0 ? 
                Math.round((completedAssignments / weekdays.length) * 100) : 0;

            return {
                student: student,
                completed: completedAssignments,
                total: weekdays.length,
                rate: completionRate
            };
        });

        // 일별 완료율 계산
        const dailyStats = weekdays.map(date => {
            const completed = activeStudents.filter(student => 
                this.isHomeworkChecked(student.id, date)
            ).length;

            const rate = activeStudents.length > 0 ? 
                Math.round((completed / activeStudents.length) * 100) : 0;

            return {
                date: date,
                completed: completed,
                total: activeStudents.length,
                rate: rate
            };
        });

        // 전체 통계
        const totalAssignments = studentStats.reduce((sum, stat) => sum + stat.total, 0);
        const totalCompleted = studentStats.reduce((sum, stat) => sum + stat.completed, 0);
        const overallRate = totalAssignments > 0 ? 
            Math.round((totalCompleted / totalAssignments) * 100) : 0;

        return {
            students: studentStats,
            daily: dailyStats,
            overall: {
                totalStudents: activeStudents.length,
                totalAssignments: totalAssignments,
                totalCompleted: totalCompleted,
                completionRate: overallRate
            }
        };
    }

    /**
     * 날짜 범위 배열 생성
     */
    getDateRange(startDate, endDate) {
        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            dates.push(date.toISOString().split('T')[0]);
        }

        return dates;
    }

    /**
     * 통계 표시
     */
    displayStatistics(stats, startDate, endDate) {
        // 기간 표시
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const periodText = `${startDateObj.getMonth() + 1}/${startDateObj.getDate()} ~ ${endDateObj.getMonth() + 1}/${endDateObj.getDate()}`;
        
        document.getElementById('period-display').textContent = periodText;
        document.getElementById('overall-completion').textContent = `${stats.overall.completionRate}%`;
        document.getElementById('active-students-count').textContent = `${stats.overall.totalStudents}명`;
        document.getElementById('total-assignments').textContent = `${stats.overall.totalAssignments}개`;

        // 목표 달성 카드 업데이트
        this.updateAchievementCard(stats.overall.completionRate);

        // 학생별 차트
        this.renderStudentChart(stats.students);

        // 일별 차트
        this.renderDailyChart(stats.daily);

        // 상세 테이블
        this.renderStatsTable(stats.students);
    }

    /**
     * 목표 달성 카드 업데이트
     */
    updateAchievementCard(completionRate) {
        const goalRate = parseInt(document.getElementById('goal-rate').value) || 80; // 설정된 목표 수행률
        const card = document.getElementById('class-achievement-card');
        const icon = document.getElementById('achievement-icon');
        const title = document.getElementById('achievement-title');
        const progress = document.getElementById('achievement-progress');
        const text = document.getElementById('achievement-text');
        const message = document.getElementById('achievement-message');

        // 진행률 바 업데이트
        const progressWidth = Math.min(completionRate, 100);
        progress.style.width = `${progressWidth}%`;

        if (completionRate >= goalRate) {
            // 목표 달성!
            card.className = 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-xl p-6 text-center achievement-celebration';
            icon.className = 'fas fa-trophy text-4xl text-yellow-500 mb-3 animate-bounce';
            title.className = 'text-xl font-bold text-yellow-700';
            title.textContent = '🎉 목표 달성! 🎉';
            progress.className = 'bg-gradient-to-r from-yellow-400 to-orange-400 h-4 rounded-full transition-all duration-500';
            text.className = 'text-yellow-700 font-medium';
            text.textContent = `목표 달성률: ${completionRate}% (목표: ${goalRate}%)`;
            message.className = 'text-lg font-bold text-yellow-800';
            message.innerHTML = `
                <div class="mb-2">🍪 과자 파티 시간이에요! 🍪</div>
                <div class="text-sm">모든 학생들이 열심히 했어요! 축하해주세요!</div>
            `;

        } else if (completionRate >= goalRate - 10) {
            // 거의 달성 (70% 이상)
            card.className = 'bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-400 rounded-xl p-6 text-center';
            icon.className = 'fas fa-bullseye text-4xl text-blue-500 mb-3';
            title.className = 'text-xl font-bold text-blue-700';
            title.textContent = '🎯 거의 다 왔어요!';
            progress.className = 'bg-gradient-to-r from-blue-400 to-indigo-400 h-4 rounded-full transition-all duration-500';
            text.className = 'text-blue-700 font-medium';
            text.textContent = `현재: ${completionRate}% (목표까지 ${goalRate - completionRate}% 남음)`;
            message.className = 'text-lg font-medium text-blue-800';
            message.innerHTML = `
                <div class="mb-2">조금만 더 힘내면 과자 파티! 🍪</div>
                <div class="text-sm">학생들을 격려해주세요!</div>
            `;

        } else if (completionRate >= goalRate - 20) {
            // 절반 이상 (60% 이상)
            card.className = 'bg-gradient-to-r from-green-100 to-teal-100 border-2 border-green-400 rounded-xl p-6 text-center';
            icon.className = 'fas fa-seedling text-4xl text-green-500 mb-3';
            title.className = 'text-xl font-bold text-green-700';
            title.textContent = '🌱 좋은 출발이에요!';
            progress.className = 'bg-gradient-to-r from-green-400 to-teal-400 h-4 rounded-full transition-all duration-500';
            text.className = 'text-green-700 font-medium';
            text.textContent = `현재: ${completionRate}% (목표: ${goalRate}%)`;
            message.className = 'text-lg font-medium text-green-800';
            message.innerHTML = `
                <div class="mb-2">꾸준히 발전하고 있어요! 💪</div>
                <div class="text-sm">계속 격려해주세요!</div>
            `;

        } else {
            // 더 노력 필요
            card.className = 'bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-400 rounded-xl p-6 text-center';
            icon.className = 'fas fa-heart text-4xl text-red-500 mb-3';
            title.className = 'text-xl font-bold text-red-700';
            title.textContent = '💪 함께 힘내요!';
            progress.className = 'bg-gradient-to-r from-red-400 to-pink-400 h-4 rounded-full transition-all duration-500';
            text.className = 'text-red-700 font-medium';
            text.textContent = `현재: ${completionRate}% (목표: ${goalRate}%)`;
            message.className = 'text-lg font-medium text-red-800';
            message.innerHTML = `
                <div class="mb-2">조금 더 관심이 필요해요! 🤗</div>
                <div class="text-sm">학생들과 함께 목표를 향해 가봐요!</div>
            `;
        }

        // 목표 달성 시 축하 애니메이션 추가
        if (completionRate >= goalRate) {
            setTimeout(() => {
                this.showCelebrationNotification(completionRate);
            }, 500);
        }
    }

    /**
     * 축하 알림 표시
     */
    showCelebrationNotification(completionRate) {
        const celebration = document.createElement('div');
        celebration.className = 'fixed top-4 right-4 z-50 p-6 rounded-lg shadow-xl max-w-sm bg-gradient-to-r from-yellow-400 to-orange-400 text-white celebration-notification';
        celebration.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="fas fa-trophy text-2xl animate-bounce"></i>
                <div>
                    <div class="font-bold text-lg">🎉 목표 달성!</div>
                    <div class="text-sm opacity-90">과자 파티 준비하세요! (${completionRate}%)</div>
                </div>
            </div>
        `;

        document.body.appendChild(celebration);

        // 5초 후 자동 제거
        setTimeout(() => {
            celebration.remove();
        }, 5000);
    }

    /**
     * 학생별 차트 렌더링
     */
    renderStudentChart(studentStats) {
        const ctx = document.getElementById('student-chart').getContext('2d');
        
        // 기존 차트가 있다면 제거
        if (this.studentChart) {
            this.studentChart.destroy();
        }

        const labels = studentStats.map(stat => stat.student.korean_name);
        const data = studentStats.map(stat => stat.rate);
        const colors = studentStats.map((_, index) => {
            const colorIndex = (index % 10) + 1;
            const colorMap = {
                1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#06b6d4',
                6: '#3b82f6', 7: '#8b5cf6', 8: '#ec4899', 9: '#84cc16', 10: '#f59e0b'
            };
            return colorMap[colorIndex];
        });

        this.studentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '완료율 (%)',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const studentStat = studentStats[context.dataIndex];
                                return `완료율: ${context.raw}% (${studentStat.completed}/${studentStat.total})`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * 일별 차트 렌더링
     */
    renderDailyChart(dailyStats) {
        const ctx = document.getElementById('daily-chart').getContext('2d');
        
        // 기존 차트가 있다면 제거
        if (this.dailyChart) {
            this.dailyChart.destroy();
        }

        const labels = dailyStats.map(stat => {
            const date = new Date(stat.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        const data = dailyStats.map(stat => stat.rate);

        this.dailyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '일별 완료율',
                    data: data,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const dailyStat = dailyStats[context.dataIndex];
                                return `완료율: ${context.raw}% (${dailyStat.completed}/${dailyStat.total}명)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * 상세 통계 테이블 렌더링
     */
    renderStatsTable(studentStats) {
        const tbody = document.getElementById('stats-table-body');
        
        // 완료율 순으로 정렬
        const sortedStats = [...studentStats].sort((a, b) => b.rate - a.rate);
        
        tbody.innerHTML = sortedStats.map((stat, index) => {
            let grade = '';
            let gradeClass = '';
            
            if (stat.rate >= 90) {
                grade = 'A+';
                gradeClass = 'text-green-700 bg-green-100';
            } else if (stat.rate >= 80) {
                grade = 'A';
                gradeClass = 'text-blue-700 bg-blue-100';
            } else if (stat.rate >= 70) {
                grade = 'B+';
                gradeClass = 'text-yellow-700 bg-yellow-100';
            } else if (stat.rate >= 60) {
                grade = 'B';
                gradeClass = 'text-orange-700 bg-orange-100';
            } else {
                grade = 'C';
                gradeClass = 'text-red-700 bg-red-100';
            }

            return `
                <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="px-4 py-3 border-b">
                        <div>
                            <div class="font-medium text-gray-900">${stat.student.korean_name}</div>
                            <div class="text-sm text-gray-500">${stat.student.english_name}</div>
                        </div>
                    </td>
                    <td class="px-4 py-3 border-b text-center font-medium">${stat.completed}개</td>
                    <td class="px-4 py-3 border-b text-center">${stat.total}개</td>
                    <td class="px-4 py-3 border-b text-center">
                        <div class="flex items-center justify-center">
                            <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div class="bg-purple-600 h-2 rounded-full" style="width: ${stat.rate}%"></div>
                            </div>
                            <span class="font-medium">${stat.rate}%</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 border-b text-center">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${gradeClass}">${grade}</span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * 데이터 초기화 (개발/테스트용)
     */
    resetAllData() {
        if (confirm('모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
            localStorage.clear();
            this.students = [];
            this.homeworkChecks = [];
            this.classes = [];
            this.initializeDefaultClasses();
            this.currentClass = this.classes[0].id;
            this.loadClassData();
            this.updateClassSelector();
            this.updateClassDisplay();
            this.renderStudents();
            this.renderHomeworkTable();
            this.showSuccess('데이터가 초기화되었습니다.');
        }
    }

    /**
     * 데이터 내보내기 (백업용)
     */
    exportData() {
        try {
            const exportData = {
                classes: this.classes,
                currentClass: this.currentClass,
                students: this.students,
                homeworkChecks: this.homeworkChecks,
                exportDate: new Date().toISOString()
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `homework_data_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showSuccess('데이터를 성공적으로 내보냈습니다.');
        } catch (error) {
            console.error('데이터 내보내기 오류:', error);
            this.showError('데이터 내보내기 중 오류가 발생했습니다.');
        }
    }

    /**
     * 성공 메시지 표시
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * 오류 메시지 표시
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * 알림 메시지 표시
     */
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // 3초 후 자동 제거
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// 전역 인스턴스 생성
let homeworkSystem;

// DOM 로드 완료 시 시스템 초기화
document.addEventListener('DOMContentLoaded', () => {
    homeworkSystem = new HomeworkCheckSystem();
});

// 개발자 도구용 전역 함수들 (콘솔에서 사용 가능)
window.resetData = () => homeworkSystem.resetAllData();
window.exportData = () => homeworkSystem.exportData();