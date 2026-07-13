import { PROCESS_ROLE_MASTER } from './constants';
import { calculateAge } from './helpers';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function openPrintPreview({ basicInfo, techSummary, skillCategories, careerList }) {
  const age = calculateAge(basicInfo.birthDate);
  const logoUrl = `${window.location.origin}/Flight_Logo.png`;

  const skillRows = (skillCategories || [])
    .map((category, index) => {
      const items = category.items && category.items.length > 0 ? category.items : [{ name: '', level: '' }];
      return items
        .map(
          (item, itemIndex) => `
          <tr>
            ${
              itemIndex === 0
                ? `<td rowspan="${items.length}">${index + 1}</td><td rowspan="${items.length}">${escapeHtml(category.name)}</td>`
                : ''
            }
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.level)}</td>
          </tr>`
        )
        .join('');
    })
    .join('');

  const careerRows = (careerList || [])
    .map((career) => {
      const roleCells = PROCESS_ROLE_MASTER.map(
        (role) => `<td class="col-narrow">${career.processRoles?.[role.key] ? '〇' : ''}</td>`
      ).join('');
      return `
        <tr>
          <td>${escapeHtml(career.periodStart)}<br/>〜<br/>${escapeHtml(career.periodEnd)}</td>
          <td>${escapeHtml(career.industry)}<br/>${escapeHtml(career.systemName)}</td>
          <td>${escapeHtml(career.environment?.os)}</td>
          <td>${escapeHtml(career.environment?.language)}</td>
          ${roleCells}
        </tr>`;
    })
    .join('');

  const roleHeaderCells = PROCESS_ROLE_MASTER.map(
    (role) => `<th class="col-narrow">${escapeHtml(role.label)}</th>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<title>経歴書_${escapeHtml(basicInfo.name)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  body { font-family: 'Meiryo', 'Hiragino Kaku Gothic ProN', sans-serif; font-size: 12px; color: #222; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 12px; }
  .header img { height: 40px; }
  h1 { font-size: 18px; margin: 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { border: 1px solid #999; padding: 4px 6px; font-size: 11px; vertical-align: top; }
  th { background: #f0f0f0; }
  .col-narrow { width: 24px; text-align: center; padding: 2px; }
  .section-title { font-size: 14px; font-weight: bold; margin: 16px 0 6px; border-left: 4px solid #333; padding-left: 6px; }
  @media print {
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>技術経歴書</h1>
    <img src="${logoUrl}" alt="logo" onerror="this.style.display='none'" />
  </div>

  <div class="section-title">基本情報</div>
  <table>
    <tr><th>氏名</th><td>${escapeHtml(basicInfo.name)}（${escapeHtml(basicInfo.kana)}）</td><th>性別</th><td>${escapeHtml(basicInfo.gender)}</td></tr>
    <tr><th>生年月日</th><td>${escapeHtml(basicInfo.birthDate)}（満${age}歳）</td><th>最終学歴</th><td>${escapeHtml(basicInfo.education)}</td></tr>
    <tr><th>居住地</th><td>${escapeHtml(basicInfo.address)}</td><th>最寄駅</th><td>${escapeHtml(basicInfo.nearestStation)}</td></tr>
    <tr><th>保有資格</th><td colspan="3">${escapeHtml(basicInfo.qualifications)}</td></tr>
    <tr><th>最終更新日</th><td colspan="3">${escapeHtml(basicInfo.lastUpdated)}</td></tr>
  </table>

  <div class="section-title">業務経歴（全体要約）</div>
  <table><tr><td>${escapeHtml(basicInfo.careerSummary).replace(/\n/g, '<br/>')}</td></tr></table>

  <div class="section-title">技術経歴サマリー（経験タイプ: ${escapeHtml(techSummary.experienceType)} / 実務年数: ${escapeHtml(techSummary.experienceYears)}年）</div>
  <table>
    <thead>
      <tr><th>No</th><th>分類</th><th>経験・スキル要素</th><th>習得度レベル</th></tr>
    </thead>
    <tbody>
      ${skillRows}
    </tbody>
  </table>

  <div class="section-title">詳細業務経歴</div>
  <table>
    <thead>
      <tr><th>期間</th><th>業種/システム名</th><th>OS</th><th>言語</th>${roleHeaderCells}</tr>
    </thead>
    <tbody>
      ${careerRows}
    </tbody>
  </table>

  <div class="section-title">自己啓発</div>
  <table><tr><td>${escapeHtml(basicInfo.selfDevelopment).replace(/\n/g, '<br/>')}</td></tr></table>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
}
