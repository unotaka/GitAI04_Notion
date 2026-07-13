import * as XLSX from 'xlsx';
import { parseExcelDate } from './helpers';
import { createCareerEntry } from './constants';

const BASIC_INFO_LABELS = {
  ふりがな: 'kana',
  氏名: 'name',
  性別: 'gender',
  生年月日: 'birthDate',
  居住地: 'address',
  最寄駅: 'nearestStation',
  最終学歴: 'education',
};

export function parseWorkbook(workbook) {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const basicInfo = {};
  const careerList = [];

  // 固定セル: 行0 列16 -> 最終更新日
  const rawQ1 = rows[0] ? rows[0][16] : undefined;
  if (rawQ1 !== undefined && rawQ1 !== null && rawQ1 !== '') {
    basicInfo.lastUpdated = typeof rawQ1 === 'number' ? parseExcelDate(rawQ1) : String(rawQ1);
  }

  // 固定セル: 行8 列14 -> 保有資格
  const rawQuals = rows[8] ? rows[8][14] : undefined;
  if (rawQuals !== undefined && rawQuals !== null && rawQuals !== '') {
    basicInfo.qualifications = String(rawQuals);
  }

  let currentCareer = null;

  rows.forEach((row) => {
    if (!row) return;
    const cellB = row[1];
    if (cellB === undefined || cellB === null || cellB === '') return;
    const label = String(cellB).trim();

    // 基本情報解析: B列が既知ラベルと完全一致する場合、同じ行の 列インデックス+2 を取得
    if (BASIC_INFO_LABELS[label]) {
      const value = row[1 + 2];
      basicInfo[BASIC_INFO_LABELS[label]] = value !== undefined && value !== null ? String(value) : '';
      return;
    }

    // 経歴解析: B列が「（」または「(」で始まる行を経歴開始行と判定
    if (label.startsWith('(') || label.startsWith('（')) {
      if (currentCareer) careerList.push(currentCareer);
      currentCareer = createCareerEntry();
      currentCareer.industry = label;
    }
  });

  if (currentCareer) careerList.push(currentCareer);

  return { basicInfo, careerList };
}

export function importExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(parseWorkbook(workbook));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
