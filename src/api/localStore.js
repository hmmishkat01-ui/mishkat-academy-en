// =============================================
// LocalStore - Alternative to Base44 localStorage data store
// =============================================

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const getTimestamp = () => new Date().toISOString();

class EntityStore {
  constructor(entityName) {
    this.entityName = entityName;
    this.storageKey = `mishkat_${entityName.toLowerCase()}`;
  }

  _getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  _saveAll(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  async list(filters = {}) {
    let items = this._getAll();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        items = items.filter(item => item[key] === value);
      }
    });
    return items;
  }

  async get(id) {
    const items = this._getAll();
    const item = items.find(i => i.id === id);
    if (!item) throw new Error(`${this.entityName} with id ${id} not found`);
    return item;
  }

  async create(data) {
    const items = this._getAll();
    const newItem = {
      ...data,
      id: generateId(),
      created_date: getTimestamp(),
      updated_date: getTimestamp(),
    };
    items.push(newItem);
    this._saveAll(items);
    return newItem;
  }

  async update(id, data) {
    const items = this._getAll();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error(`${this.entityName} with id ${id} not found`);
    items[index] = { ...items[index], ...data, updated_date: getTimestamp() };
    this._saveAll(items);
    return items[index];
  }

  async delete(id) {
    const items = this._getAll();
    const filtered = items.filter(i => i.id !== id);
    this._saveAll(filtered);
    return { success: true };
  }

  // Works with both objects and functions
  async filter(filterFnOrObj) {
    const items = this._getAll();
    if (typeof filterFnOrObj === 'function') {
      return items.filter(filterFnOrObj);
    } else if (typeof filterFnOrObj === 'object' && filterFnOrObj !== null) {
      return items.filter(item =>
        Object.entries(filterFnOrObj).every(([key, value]) => item[key] === value)
      );
    }
    return items;
  }
}

// Create all entities
export const StudentStore = new EntityStore('Student');
export const CourseStore = new EntityStore('Course');
export const BatchStore = new EntityStore('Batch');
export const EnrollmentStore = new EntityStore('Enrollment');
export const ExpenseStore = new EntityStore('Expense');
export const SettingsStore = new EntityStore('Settings');
export const AssignmentStore = new EntityStore('Assignment');
export const CourseModuleStore = new EntityStore('CourseModule');

// A unified API object similar to Base44
export const localDB = {
  Student: StudentStore,
  Course: CourseStore,
  Batch: BatchStore,
  Enrollment: EnrollmentStore,
  Expense: ExpenseStore,
  Settings: SettingsStore,
  Assignment: AssignmentStore,
  CourseModule: CourseModuleStore,
};

export default localDB;
