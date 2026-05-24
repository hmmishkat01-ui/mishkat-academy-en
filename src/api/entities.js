import { localDB } from './localStore';

export const Student = localDB.Student;
export const Course = localDB.Course;
export const Batch = localDB.Batch;
export const Enrollment = localDB.Enrollment;
export const Expense = localDB.Expense;
export const Settings = localDB.Settings;
export const Assignment = localDB.Assignment;
export const CourseModule = localDB.CourseModule;

export const Query = { list: async () => [] };
export const User = {
  me: async () => ({ id: 'local-user', email: 'admin@mishkat.local', name: 'Admin' }),
};
