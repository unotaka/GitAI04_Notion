const { Client } = require('@notionhq/client');
const fs = require('fs');

// 環境変数からNotionの設定を取得
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

async function main() {
  try {
    console.log('Notionデータベースを確認しています...');
    
    // ステータスが「Claude生成待ち」のタスクを検索
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'ステータス',
        status: {
          equals: 'Claude生成待ち'
        }
      },
      page_size: 1 // 1回の実行で1つのタスクを処理
    });

    if (response.results.length === 0) {
      console.log('💡 現在「Claude生成待ち」のタスクはありません。');
      return;
    }

    const page = response.results[0];
    const pageId = page.id;
    
    // タスクIDを取得（プロパティ名はNotionの設定に合わせて調整してください）
    let taskId = 'task-unknown';
    if (page.properties['タスクID']) {
      if (page.properties['タスクID'].title && page.properties['タスクID'].title.length > 0) {
        taskId = page.properties['タスクID'].title[0].plain_text;
      } else if (page.properties['タスクID'].rich_text && page.properties['タスクID'].rich_text.length > 0) {
        taskId = page.properties['タスクID'].rich_text[0].plain_text;
      }
    }

    console.log(`✅ タスクが見つかりました: ${taskId} (Page ID: ${pageId})`);

    // GitHub Actionsの環境変数(GITHUB_ENV)にタスクIDをエクスポート（ブランチ作成用）
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
