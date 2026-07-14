import * as XLSX from 'xlsx';
import { parseExcelDate } from './helpers';
import {
  createCareerEntry,
  createInitialBasicInfo,
  createInitialTechSummary,
  createSkillCategory,
  createSkillItem,
  PROCESS_ROLE_MASTER,
  SKILL_LEVELS,
} from './constants';

// 技術経験要素サマリーのスキャン開始行（1始まり）
const SKILL_SCAN_START_ROW = 16;

// 実務経験サマリー（経験タイプ／実務年数）のB列ラベル対応表
const TECH_SUMMARY_LABELS = {
  経験タイプ: 'experienceType',
  実務年数: 'experienceYears',
};

// 経歴カード内の詳細情報ラベル（B列）に対応する格納先
const CAREER_DETAIL_SETTERS = {
  システム名: (career, value) => {
    career.systemName = value;
  },
  概要: (career, value) => {
    career.overview = value;
  },
  OS: (career, value) => {
    career.environment.os = value;
  },
  DB: (career, value) => {
    career.environment.db = value;
  },
  言語: (career, value) => {
    career.environment.language = value;
  },
  その他: (career, value) => {
    career.environment.other = value;
  },
};

// 本仕様書内の「行」「列」はExcel画面通り1始まりで指定されるため、
// 参照時は必ず -1 して配列インデックス（0始まり）に変換する。
function getCell(rows, row1, col1) {
  try {
    const row = rows[row1 - 1];
    if (!row) return '';
    const value = row[col1 - 1];
    return value === undefined || value === null ? '' : value;
  } catch (err) {
    return '';
  }
}

// 空文字・undefined・null等によるクラッシュを防止する安全な文字列化
function safeText(value) {
  try {
    return String(value || '').trim();
  } catch (err) {
    return '';
  }
}

// 数値（Excelシリアル値）の場合は日付文字列へ変換し、それ以外はそのまま安全に文字列化する
function safeDateText(value) {
  try {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value === 'number') return parseExcelDate(value);
    return safeText(value);
  } catch (err) {
    return '';
  }
}

// 姓名の間の半角・全角スペースをすべて除去する
function removeAllSpaces(value) {
  return safeText(value).replace(/[\s\u3000]+/g, '');
}

export function parseWorkbook(workbook) {
  const basicInfo = createInitialBasicInfo();
  const techSummary = createInitialTechSummary();
  const skillCategories = [];
  const careerList = [];

  try {
    const sheetName = workbook && workbook.SheetNames ? workbook.SheetNames[0] : undefined;
    const worksheet = sheetName ? workbook.Sheets[sheetName] : null;
    if (!worksheet) {
      return { basicInfo, techSummary, skillCategories, careerList };
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) || [];

    // ---- シート走査前：固定セルからの基本情報一括取得 ----
    try {
      basicInfo.lastUpdated = safeDateText(getCell(rows, 1, 17)); // Q1: 最終更新日
    } catch (err) {
      /* 個別項目の失敗が全体のインポートを止めないようにガード */
    }
    try {
      basicInfo.name = removeAllSpaces(getCell(rows, 9, 4)); // D9: 氏名（姓名間スペース除去）
    } catch (err) {}
    try {
      basicInfo.kana = safeText(getCell(rows, 8, 4)); // D8: ふりがな
    } catch (err) {}
    try {
      basicInfo.address = safeText(getCell(rows, 11, 4)); // D11: 居住地
    } catch (err) {}
    try {
      basicInfo.nearestStation = safeText(getCell(rows, 12, 4)); // D12: 最寄駅
    } catch (err) {}
    try {
      basicInfo.education = safeText(getCell(rows, 11, 12)); // L11: 最終学歴
    } catch (err) {}
    try {
      basicInfo.qualifications = safeText(getCell(rows, 9, 15)); // O9: 保有資格
    } catch (err) {}
    try {
      basicInfo.gender = safeText(getCell(rows, 9, 10)); // J9: 性別（優先取得）
    } catch (err) {}
    try {
      basicInfo.birthDate = safeDateText(getCell(rows, 9, 11)); // K9: 生年月日
    } catch (err) {}

    // ---- シート全体の走査 ----
    let currentCareer = null;
    let currentCategory = null;
    let inCareerSection = false;

    rows.forEach((row, rowIndex) => {
      try {
        if (!row) return;
        const row1 = rowIndex + 1; // 1始まりの行番号
        const cellB = safeText(row[1]);
        const cellC = safeText(row[2]);
        const cellD = safeText(row[3]);

        // 自己啓発: B列が「自己啓発」と完全一致する行のC列（1セル分）のみ取得
        if (cellB === '自己啓発') {
          basicInfo.selfDevelopment = cellC;
          return;
        }

        // 実務経験サマリー: 経験タイプ / 実務年数
        if (TECH_SUMMARY_LABELS[cellB]) {
          techSummary[TECH_SUMMARY_LABELS[cellB]] = cellC;
          return;
        }

        // 経歴ブロックの検知: B列が「(」または「（」で始まる行を新規経歴の開始行とみなす
        if (cellB.startsWith('(') || cellB.startsWith('（')) {
          inCareerSection = true;
          if (currentCareer) careerList.push(currentCareer);
          currentCareer = createCareerEntry();
          currentCareer.industry = cellB;

          // 期間の抽出: 同一行内から "YYYY/MM〜YYYY/MM"（または現在/継続）のパターンを検索
          try {
            const periodSource = row.map((c) => safeText(c)).join(' ');
            const periodMatch = periodSource.match(
              /(\d{2,4}[\/年]\d{1,2})\s*[〜~\-−]\s*(\d{2,4}[\/年]\d{1,2}|現在|継続)/
            );
            if (periodMatch) {
              currentCareer.periodStart = periodMatch[1];
              currentCareer.periodEnd = periodMatch[2];
            }
          } catch (err) {
            /* 期間抽出の失敗は経歴カード自体の生成を妨げない */
          }
          return;
        }

        // 詳細情報の抽出（基準行の特定）: 経歴ブロック内のラベル行から詳細情報を取得
        if (inCareerSection) {
          if (!currentCareer) return;
          const setter = CAREER_DETAIL_SETTERS[cellB];
          if (setter) {
            setter(currentCareer, cellC);
            return;
          }
          const role = PROCESS_ROLE_MASTER.find((r) => r.label === cellB);
          if (role && cellC) {
            currentCareer.processRoles[role.key] = true;
          }
          return;
        }

        // 技術経験要素サマリー（16行目以降からスキャン）
        if (row1 >= SKILL_SCAN_START_ROW) {
          if (cellB) {
            currentCategory = createSkillCategory();
            currentCategory.name = cellB;
            skillCategories.push(currentCategory);
          }
          if (cellC) {
            if (!currentCategory) {
              currentCategory = createSkillCategory();
              skillCategories.push(currentCategory);
            }
            const item = createSkillItem();
            item.name = cellC;
            item.level = SKILL_LEVELS.includes(cellD) ? cellD : '未設定';
            currentCategory.items.push(item);
          }
        }
      } catch (err) {
        // 1行の解析失敗が全体のインポート処理を止めないようにガード
      }
    });

    if (currentCareer) careerList.push(currentCareer);
  } catch (err) {
    // ワークブック全体の解析に失敗した場合も、ここまでに復元できた内容を返す
  }

  return { basicInfo, techSummary, skillCategories, careerList };
}

export function importExcelFile(file) {
  return new Promise((resolve, reject) => {
    try {
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
      reader.onerror = () => reject(reader.error || new Error('ファイルの読み込みに失敗しました'));
      reader.readAsArrayBuffer(file);
    } catch (err) {
      reject(err);
    }
  });
}
