// scripts/claude-coder.js
const { execFileSync } = require('child_process'); // 💡 修正点: execSync から execFileSync に変更
const fs = require('fs');
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// 💡 前提資料「AI04_業務経歴書」のページID
const PREMISE_PAGE_ID = '38f4c3b4a172807b8bccc4e52d041661';

// ブロックからテキストを再帰的に抽出する関数（下位ノートも読み込む）
async function extractTextFromBlocks(blockId, depth = 0) {
  // API制限や処理の肥大化を防ぐため、深さ2階層まででストップ
  if (depth > 2) return "";

  let textContent = "";
  try {
    const blocks = await notion.blocks.children.list({ block_id: blockId });
    for (const block of blocks.results) {
      if (block.type === 'paragraph' && block.paragraph.rich_text.length > 0) {
        textContent += block.paragraph.rich_text.map(t => t.plain_text).join('') + '\n';
      } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item.rich_text.length > 0) {
        textContent += "・" + block.bulleted_list_item.rich_text.map(t => t.plain_text).join('') + '\n';
      } else if (block.type === 'numbered_list_item' && block.numbered_list_item.rich_text.length > 0) {
        textContent += "・" + block.numbered_list_item.rich_text.map(t => t.plain_text).join('') + '\n';
      } else if (block.type === 'child_page') {
        textContent += `\n\n--- 【下位ノート: ${block.child_page.title}】 ---\n`;
        textContent += await extractTextFromBlocks(block.id, depth + 1);
      }
    }
  } catch (e) {
    console.log(`⚠️ ID: ${blockId} のテキスト抽出をスキップしました`);
  }
  return textContent;
}

async function main() {
  try {
    // 1. タスク情報(PAGE_ID)の読み込み
    if (!fs.existsSync('./task_info.json')) {
      console.log('タスク情報が見つかりません。実行をスキップします。');
      return;
    }
    const taskInfo = JSON.parse(fs.readFileSync('./task_info.json', 'utf8'));
    const pageId = taskInfo.PAGE_ID;

    // 2. Notionから「かんばんタスク」のページ情報を取得
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    let targetNote = "指定なし";
    if (page.properties['更新対象ノート'] && page.properties['更新対象ノート'].rich_text.length > 0) {
      targetNote = page.properties['更新対象ノート'].rich_text[0].plain_text;
    }
    console.log(`📝 更新対象ノート: ${targetNote}`);

    // 3. 前提資料（AI04_業務経歴書）と下位ノートの読み込み
    console.log('📚 前提資料と下位ノートの開発環境情報を読み取っています...');
    const premiseText = await extractTextFromBlocks(PREMISE_PAGE_ID);

    // 4. 「更新対象ノート」のタイトルでNotionを検索し、仕様書本文を取得する
    let targetNoteBody = "（仕様書の取得に失敗したか、本文が空です）";
    if (targetNote !== "指定なし") {
      console.log(`🔍 更新対象ノート「${targetNote}」を検索しています...`);
      try {
        const searchResponse = await notion.search({
          query: targetNote,
          filter: { value: 'page', property: 'object' },
          page_size: 1
        });
        
        if (searchResponse.results.length > 0) {
          const targetPageId = searchResponse.results[0].id;
          console.log(`📄 対象ノートを発見しました (Page ID: ${targetPageId})。内容を読み取ります...`);
          targetNoteBody = await extractTextFromBlocks(targetPageId);
        } else {
          console.log(`⚠️ 「${targetNote}」に一致するページが見つかりませんでした。`);
        }
      } catch (searchError) {
        console.log(`⚠️ ノート検索中にエラーが発生しました: ${searchError.message}`);
      }
    }

    // 5. Claude Codeへのプロンプト作成
    const prompt = `あなたは優秀なAIエンジニアです。以下の「前提資料（開発環境・技術スタック等）」と「今回の実装仕様」に従って、対象のソースコードを生成・更新し、ファイルに書き込んでください。

【対象画面/機能】
${targetNote}

【前提資料（技術スタック・全体仕様）】
${premiseText || '（前提資料の取得に失敗、または空です）'}

【今回の実装仕様（対象ノートの本文）】
${targetNoteBody || '（仕様の記載なし）'}

※ノートに反映させるべき修正点や、実行環境の問題がある場合は、「修正点:」というキーワードを含めて出力してください。`;

    console.log('🤖 Claude Codeを実行中...');
    
    // 💡 修正ポイント: シェル( /bin/sh )の構文解釈を完全にバイパスして安全にコマンドを実行する
    const result = execFileSync('claude', ['-p', prompt], { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    console.log('✅ Claude Codeの実行が完了しました。');

    // 6. Notion（かんばん）へのフィードバック
    if (result.includes('修正点:') || result.includes('修正点：')) {
      console.log('💡 修正点が検出されたため、Notionにフィードバックを追記します。');
      await notion.comments.create({
        parent: { page_id: pageId },
        rich_text: [{ text: { content: "【AIからの修正点・フィードバック】\n" + result.substring(0, 1800) } }]
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
