import BatchStudents from './pages/BatchStudents';
import ExamTimer from './pages/ExamTimer';
import Batches from './pages/Batches';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Search from './pages/Search';
import Settings from './pages/Settings';
import StudentProfile from './pages/StudentProfile';
import Students from './pages/Students';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BatchStudents": BatchStudents,
    "Batches": Batches,
    "Courses": Courses,
    "Dashboard": Dashboard,
    "Expenses": Expenses,
    "Reports": Reports,
    "Search": Search,
    "Settings": Settings,
    "StudentProfile": StudentProfile,
    "Students": Students,
    "ExamTimer": ExamTimer,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};