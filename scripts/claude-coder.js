// scripts/claude-coder.js
const { execSync } = require('child_process');
const fs = require('fs');
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function main() {
  try {
    // 1. タスク情報(PAGE_ID)の読み込み
    if (!fs.existsSync('./task_info.json')) {
      console.log('タスク情報が見つかりません。実行をスキップします。');
      return;
    }
    const taskInfo = JSON.parse(fs.readFileSync('./task_info.json', 'utf8'));
    const pageId = taskInfo.PAGE_ID;

    // 2. Notionから「更新対象ノート」の情報を取得
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    let targetNote = "指定なし";
    if (page.properties['更新対象ノート'] && page.properties['更新対象ノート'].rich_text.length > 0) {
      targetNote = page.properties['更新対象ノート'].rich_text[0].plain_text;
    }

    console.log(`📝 更新対象ノート: ${targetNote}`);

    // 3. Claude Codeへのプロンプト作成と実行
    // ※前提資料と更新対象ノートを考慮してコードを生成させるよう指示
    const prompt = `前提資料「AI04_業務経歴書」および下位ノートの開発環境情報を参照し、「${targetNote}」の要件に従ってソースコードを生成・更新してください。ノートに反映させるべき修正点がある場合は、「修正点:」というキーワードを含めて出力してください。`;

    console.log('🤖 Claude Codeを実行中...');
    
    // 子プロセスとしてclaudeコマンドを実行し、出力を取得
    // ※ ワークフロー側で CLAUDE_CODE_NON_INTERACTIVE="true" が設定されている前提
    const result = execSync(`claude -p "${prompt}"`, { 
      encoding: 'utf-8',
      stdio: 'pipe' // 出力を変数に格納するためにpipeを使用
    });

    console.log('✅ Claude Codeの実行が完了しました。');

    // 4. Notion（かんばん）へのフィードバック（要件4）
    // Claudeの出力に特定のキーワード（例: 修正点）が含まれているか判定
    if (result.includes('修正点:') || result.includes('修正点：')) {
      console.log('💡 修正点が検出されたため、Notionにフィードバックを追記します。');
      
      // Notionのページへコメントとして結果を送信
      await notion.comments.create({
        parent: { page_id: pageId },
        rich_text: [
          {
            text: {
              // Notionの文字数制限（通常2000文字）を考慮し切り詰める
              content: "【AIからの修正点・フィードバック】\n" + result.substring(0, 1800)
            }
          }
        ]
      });
      console.log('Notionへのフィードバック完了。');
    }

  } catch (error) {
    console.error('❌ Claude実行またはNotion通信エラー:', error.message);
    if (error.stdout) {
      console.error('【Claude出力ログ】\n', error.stdout.toString());
    }
    process.exit(1);
  }
}

main();
