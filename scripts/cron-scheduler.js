// scripts/cron-scheduler.js
const fs = require('fs');

// 環境変数からNotionの設定を取得
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_VERSION = '2022-06-28';

async function main() {
  try {
    console.log('Notionデータベースを確認しています... (Native Fetch版)');
    
    // 安全装置: DATABASE_ID の中身をチェック
    if (!DATABASE_ID) {
      throw new Error('NOTION_DATABASE_ID が空です。GitHub Secretsの設定を確認してください。');
    }
    if (DATABASE_ID.includes('http') || DATABASE_ID.includes('/')) {
      throw new Error(`NOTION_DATABASE_ID の設定が間違っています。URLではなく32桁のIDのみを指定してください。 (現在の値: ${DATABASE_ID})`);
    }

    // ライブラリを使わず、直接Notion APIへHTTPリクエストを送信
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          property: 'ステータス',
          status: {
            equals: 'Claude生成待ち'
          }
        },
        page_size: 1 // 1回の実行で1つのタスクを処理
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP Error: ${response.status} \n${errorText}`);
    }

    const data = await response.json();

    if (data.results.length === 0) {
      console.log('💡 現在「Claude生成待ち」のタスクはありません。');
      return;
    }

    const page = data.results[0];
    const pageId = page.id;
    
    // 💡 タスクIDを取得（IDプロパティに対応するよう改修）
    let taskId = 'task-unknown';
    const taskIdProp = page.properties['タスクID'];
    
    if (taskIdProp) {
      if (taskIdProp.type === 'unique_id' && taskIdProp.unique_id) {
        // Notionの「IDプロパティ(№)」の場合、プレフィックスと番号を結合する
        const prefix = taskIdProp.unique_id.prefix ? `${taskIdProp.unique_id.prefix}-` : '';
        taskId = `${prefix}${taskIdProp.unique_id.number}`;
      } else if (taskIdProp.title && taskIdProp.title.length > 0) {
        // タイトルプロパティの場合
        taskId = taskIdProp.title[0].plain_text;
      } else if (taskIdProp.rich_text && taskIdProp.rich_text.length > 0) {
        // テキストプロパティの場合
        taskId = taskIdProp.rich_text[0].plain_text;
      }
    }

    console.log(`✅ タスクが見つかりました: ${taskId} (Page ID: ${pageId})`);

    // GitHub Actionsの環境変数(GITHUB_ENV)にタスクIDをエクスポート
    if (process.env.GITHUB_ENV) {
      fs.appendFileSync(process.env.GITHUB_ENV, `TASK_ID=${taskId}\n`);
    }

    // 最終ステップでのステータス更新用に PAGE_ID をJSONに保存
    fs.writeFileSync('task_info.json', JSON.stringify({ PAGE_ID: pageId }));
    console.log('タスク情報を task_info.json に保存しました。');

  } catch (error) {
    console.error('❌ Notion APIエラー:', error.message);
    process.exit(1);
  }
}

main();
