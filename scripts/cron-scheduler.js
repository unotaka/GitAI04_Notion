const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

async function main() {
  try {
    console.log('Notionデータベースを確認しています...');
    
    // 💡 エラー原因特定のための自己診断テスト
    if (!notion.databases || typeof notion.databases.query !== 'function') {
      console.error('🚨 [致命的なエラー] Notion SDKが正しく読み込まれていません。');
      console.error('🔍 【デバッグ情報】読み込まれた databases オブジェクト:', notion.databases);
      throw new Error('Notion SDKのインストール状態が不正です。');
    }
    
    // ステータスが「Claude生成待ち」のタスクを検索
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'ステータス',
        status: {
          equals: 'Claude生成待ち'
        }
      },
      page_size: 1
    });

    if (response.results.length === 0) {
      console.log('💡 現在「Claude生成待ち」のタスクはありません。');
      return;
    }

    const page = response.results[0];
    const pageId = page.id;
    
    // タスクIDを取得
    let taskId = 'task-unknown';
    if (page.properties['タスクID']) {
      if (page.properties['タスクID'].title && page.properties['タスクID'].title.length > 0) {
        taskId = page.properties['タスクID'].title[0].plain_text;
      } else if (page.properties['タスクID'].rich_text && page.properties['タスクID'].rich_text.length > 0) {
        taskId = page.properties['タスクID'].rich_text[0].plain_text;
      }
    }

    console.log(`✅ タスクが見つかりました: ${taskId} (Page ID: ${pageId})`);

    // GitHub Actionsの環境変数にタスクIDをエクスポート
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
