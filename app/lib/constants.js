export const PROCESS_ROLE_MASTER = [
  { key: 'prjMgmt', label: 'Prj管理' },
  { key: 'research', label: '調査分析' },
  { key: 'reqDef', label: '要件定義' },
  { key: 'basicDesign', label: '基本設計' },
  { key: 'funcDesign', label: '機能設計' },
  { key: 'detailDesign', label: '詳細設計' },
  { key: 'develop', label: '製造' },
  { key: 'testing', label: '試験' },
  { key: 'training', label: '訓練教育' },
];

export const SKILL_LEVELS = ['未設定', '◎', '○', '●'];

export const MAX_ITEMS_PER_CATEGORY = 9;

export const BASIC_INFO_FIELDS = [
  { key: 'lastUpdated', label: '最終更新日' },
  { key: 'kana', label: 'ふりがな' },
  { key: 'name', label: '氏名' },
  { key: 'gender', label: '性別' },
  { key: 'birthDate', label: '生年月日・年齢' },
  { key: 'address', label: '居住地' },
  { key: 'nearestStation', label: '最寄駅' },
  { key: 'education', label: '最終学歴' },
  { key: 'qualifications', label: '保有資格' },
];

export function createInitialBasicInfo() {
  return {
    lastUpdated: '',
    kana: '',
    name: '',
    gender: '',
    birthDate: '',
    address: '',
    nearestStation: '',
    education: '',
    qualifications: '',
    careerSummary: '',
    selfDevelopment: '',
  };
}

export function createInitialTechSummary() {
  return {
    experienceType: '',
    experienceYears: '',
  };
}

export function createSkillCategory() {
  return {
    id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    items: [],
  };
}

export function createSkillItem() {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    level: '未設定',
  };
}

export function createCareerEntry() {
  const roles = {};
  PROCESS_ROLE_MASTER.forEach((role) => {
    roles[role.key] = false;
  });
  return {
    id: `career-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    periodStart: '',
    periodEnd: '',
    industry: '',
    systemName: '',
    overview: '',
    environment: {
      os: '',
      db: '',
      language: '',
      other: '',
    },
    processRoles: roles,
  };
}
