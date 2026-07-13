import { PROCESS_ROLE_MASTER, createCareerEntry, createInitialBasicInfo, createInitialTechSummary } from './constants';

export function buildMarkdown({ basicInfo, techSummary, skillCategories, careerList }) {
  const lines = [];

  lines.push('# 経歴書');
  lines.push('');
  lines.push('## 📝 1. 基本情報');
  lines.push(`- **最終更新日**: ${basicInfo.lastUpdated || ''}`);
  lines.push(`- **氏名**: ${basicInfo.name || ''} (${basicInfo.kana || ''})`);
  lines.push(`- **性別**: ${basicInfo.gender || ''}`);
  lines.push(`- **生年月日**: ${basicInfo.birthDate || ''}`);
  lines.push(`- **居住地**: ${basicInfo.address || ''}`);
  lines.push(`- **最寄駅**: ${basicInfo.nearestStation || ''}`);
  lines.push(`- **最終学歴**: ${basicInfo.education || ''}`);
  lines.push(`- **保有資格**: ${basicInfo.qualifications || ''}`);
  lines.push('');
  lines.push('### 業務経歴（全体要約）');
  lines.push(basicInfo.careerSummary || '');
  lines.push('');
  lines.push('### 自己啓発');
  lines.push(basicInfo.selfDevelopment || '');

  lines.push('');
  lines.push('## 📊 2. 技術経歴サマリー');
  lines.push(`- **経験タイプ**: ${techSummary.experienceType || ''}`);
  lines.push(`- **実務年数**: ${techSummary.experienceYears || ''}`);
  lines.push('');
  lines.push('| No | 分類 | 経験・スキル要素 | 習得度レベル |');
  lines.push('|----|------|------------------|--------------|');
  (skillCategories || []).forEach((category, index) => {
    const items = category.items && category.items.length > 0 ? category.items : [{ name: '', level: '' }];
    items.forEach((item) => {
      lines.push(`| ${index + 1} | ${category.name || ''} | ${item.name || ''} | ${item.level || ''} |`);
    });
  });

  lines.push('');
  lines.push('## 📁 3. 詳細業務経歴');
  (careerList || []).forEach((career, index) => {
    lines.push('');
    lines.push(`### 経歴 #${index + 1}`);
    lines.push(`- **期間**: ${career.periodStart || ''} 〜 ${career.periodEnd || ''}`);
    lines.push(`- **業種**: ${career.industry || ''}`);
    lines.push(`- **システム名**: ${career.systemName || ''}`);
    lines.push(`- **概要**: ${career.overview || ''}`);
    lines.push(
      `- **環境**: OS: ${career.environment?.os || ''} / DB: ${career.environment?.db || ''} / 言語: ${career.environment?.language || ''} / その他: ${career.environment?.other || ''}`
    );
    const roleText = PROCESS_ROLE_MASTER.map(
      (role) => `${role.label}:${career.processRoles?.[role.key] ? '〇' : ''}`
    ).join(' / ');
    lines.push(`- **担当工程**: ${roleText}`);
  });

  return lines.join('\n');
}

export function buildMarkdownFilename(basicInfo) {
  const digitsOnly = (basicInfo.lastUpdated || '').replace(/\D/g, '') || 'undated';
  const name = basicInfo.name || 'noname';
  return `${name}_${digitsOnly}.md`;
}

export function parseMarkdown(text) {
  const basicInfo = createInitialBasicInfo();
  const techSummary = createInitialTechSummary();
  const skillCategories = [];
  const careerList = [];

  const getField = (label) => {
    const regex = new RegExp(`\\*\\*${label}\\*\\*:\\s*(.*)`);
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  basicInfo.lastUpdated = getField('最終更新日');

  const nameMatch = text.match(/\*\*氏名\*\*:\s*(.*?)\s*\((.*?)\)/);
  if (nameMatch) {
    basicInfo.name = nameMatch[1].trim();
    basicInfo.kana = nameMatch[2].trim();
  }

  basicInfo.gender = getField('性別');
  basicInfo.birthDate = getField('生年月日');
  basicInfo.address = getField('居住地');
  basicInfo.nearestStation = getField('最寄駅');
  basicInfo.education = getField('最終学歴');
  basicInfo.qualifications = getField('保有資格');

  const careerSummaryMatch = text.match(/### 業務経歴（全体要約）\n([\s\S]*?)\n###/);
  if (careerSummaryMatch) basicInfo.careerSummary = careerSummaryMatch[1].trim();

  const selfDevMatch = text.match(/### 自己啓発\n([\s\S]*?)\n##/);
  if (selfDevMatch) basicInfo.selfDevelopment = selfDevMatch[1].trim();

  techSummary.experienceType = getField('経験タイプ');
  techSummary.experienceYears = getField('実務年数');

  // テーブル行解析（No列をキーにカテゴリをグループ化）
  const tableRows = text.match(/^\|\s*\d+\s*\|.*\|$/gm) || [];
  const categoryMap = new Map();
  tableRows.forEach((row) => {
    const cols = row
      .split('|')
      .map((c) => c.trim())
      .filter((c, i, arr) => !(i === 0 && c === '') && !(i === arr.length - 1 && c === ''));
    if (cols.length < 4) return;
    const [no, categoryName, itemName, level] = cols;
    if (!categoryMap.has(no)) {
      categoryMap.set(no, {
        id: `cat-${no}-${Date.now()}`,
        name: categoryName,
        items: [],
      });
    }
    if (itemName) {
      const cat = categoryMap.get(no);
      cat.items.push({
        id: `item-${no}-${cat.items.length}-${Date.now()}`,
        name: itemName,
        level: level || '未設定',
      });
    }
  });
  categoryMap.forEach((category) => skillCategories.push(category));

  // 経歴セクション解析（### 経歴 #n で分割）
  const careerSections = text.split(/### 経歴 #\d+/).slice(1);
  careerSections.forEach((section) => {
    const entry = createCareerEntry();
    const periodMatch = section.match(/\*\*期間\*\*:\s*(.*?)\s*〜\s*(.*)/);
    if (periodMatch) {
      entry.periodStart = periodMatch[1].trim();
      entry.periodEnd = periodMatch[2].trim();
    }
    const industryMatch = section.match(/\*\*業種\*\*:\s*(.*)/);
    if (industryMatch) entry.industry = industryMatch[1].trim();
    const systemMatch = section.match(/\*\*システム名\*\*:\s*(.*)/);
    if (systemMatch) entry.systemName = systemMatch[1].trim();
    const overviewMatch = section.match(/\*\*概要\*\*:\s*(.*)/);
    if (overviewMatch) entry.overview = overviewMatch[1].trim();
    const envMatch = section.match(
      /\*\*環境\*\*:\s*OS:\s*(.*?)\s*\/\s*DB:\s*(.*?)\s*\/\s*言語:\s*(.*?)\s*\/\s*その他:\s*(.*)/
    );
    if (envMatch) {
      entry.environment = {
        os: envMatch[1].trim(),
        db: envMatch[2].trim(),
        language: envMatch[3].trim(),
        other: envMatch[4].trim(),
      };
    }
    const roleMatch = section.match(/\*\*担当工程\*\*:\s*(.*)/);
    if (roleMatch) {
      const roleParts = roleMatch[1].split('/').map((part) => part.trim());
      roleParts.forEach((part) => {
        const [label, mark] = part.split(':').map((s) => (s || '').trim());
        const role = PROCESS_ROLE_MASTER.find((r) => r.label === label);
        if (role) entry.processRoles[role.key] = mark === '〇';
      });
    }
    careerList.push(entry);
  });

  return { basicInfo, techSummary, skillCategories, careerList };
}

export function downloadMarkdown(basicInfo, techSummary, skillCategories, careerList) {
  const content = buildMarkdown({ basicInfo, techSummary, skillCategories, careerList });
  const filename = buildMarkdownFilename(basicInfo);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
