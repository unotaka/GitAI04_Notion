// scripts/claude-coder.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path'); // 💡 修正ポイント: パス操作用にインポート追加
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PREMISE_PAGE_ID = '38f4c3b4a172807b8bccc4e52d041661';

// ブロックからテキストを再帰的に抽出する関数
async function extractTextFromBlocks(blockId, depth = 0) {
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
    if (!fs.existsSync('./task_info.json')) {
      console.log('タスク情報が見つかりません。実行をスキップします。');
      return;
    }
    const taskInfo = JSON.parse(fs.readFileSync('./task_info.json', 'utf8'));
    const pageId = taskInfo.PAGE_ID;

    const page = await notion.pages.retrieve({ page_id: pageId });
    
    let targetNote = "指定なし";
    if (page.properties['更新対象ノート'] && page.properties['更新対象ノート'].rich_text.length > 0) {
      targetNote = page.properties['更新対象ノート'].rich_text[0].plain_text;
    }
    console.log(`📝 更新対象ノート: ${targetNote}`);

    console.log('📚 前提資料と下位ノートの開発環境情報を読み取っています...');
    const premiseText = await extractTextFromBlocks(PREMISE_PAGE_ID);

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

    // 💡 修正ポイント: AIに「ツールを使わずテキストで出力する」ことを厳命する
    const prompt = `あなたは優秀なAIエンジニアです。以下の「前提資料」と「今回の実装仕様」に従って、対象のソースコードを生成してください。

【🚨 厳守事項：出力フォーマットについて】
あなたは現在CI環境で動作しているため、ファイル書き込み（Write/Edit）やBashツールが権限エラーでブロックされます。ツールは絶対に使用しないでください。
代わりに、作成・更新すべきファイルの内容を、必ず以下の「独自のテキストフォーマット」で標準出力（コンソール）に出力してください。後続のシステムがこれを読み取ってファイルを作成します。

[FILE_START: 作成するファイルの相対パス (例: src/index.js)]
(ここにファイルの中身を記述)
[FILE_END]

※複数のファイルがある場合は、必要な数だけ上記ブロックを繰り返してください。

【対象画面/機能】
${targetNote}

【前提資料（技術スタック・全体仕様）】
${premiseText || '（前提資料なし）'}

【今回の実装仕様（対象ノートの本文）】
${targetNoteBody || '（仕様の記載なし）'}

※ノートに反映させるべき修正点や情報不足がある場合は、「修正点:」というキーワードを含めて出力してください。`;

    console.log('🤖 Claude Codeを実行中...');
    
    const result = execFileSync('claude', ['-p', prompt], { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    console.log('✅ Claude Codeの実行が完了しました。以下のAIの出力結果を確認します:\n');
    console.log('--------------------------------------------------');
    console.log(result);
    console.log('--------------------------------------------------\n');

    // 💡 修正ポイント: AIの出力からファイル内容を抽出し、Node.js側でファイルを作成する
    const fileRegex = /\[FILE_START:\s*(.+?)\]([\s\S]*?)\[FILE_END\]/g;
    let match;
    let fileCreated = false;

    while ((match = fileRegex.exec(result)) !== null) {
      const filePath = match[1].trim();
      const fileContent = match[2].trim() + '\n';
      
      // ディレクトリが存在しない場合は自動で作成
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(filePath, fileContent);
      console.log(`📁 ファイルを解析し、ディスクに保存しました: ${filePath}`);
      fileCreated = true;
    }

    if (!fileCreated) {
      console.log('⚠️ [FILE_START] ~ [FILE_END] のフォーマットが検出されませんでした。コードは生成されていません。');
    }

    if (result.includes('修正点:') || result.includes('修正点：')) {
      console.log('💡 修正点が検出されたため、Notionにフィードバックを追記します。');
      try {
        const commentResponse = await fetch('https://api.notion.com/v1/comments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            parent: { page_id: pageId },
            rich_text: [{ text: { content: "【AIからの修正点・フィードバック】\n" + result.substring(0, 1800) } }]
          })
        });

        if (!commentResponse.ok) {
          throw new Error(`HTTP ${commentResponse.status} - ${await commentResponse.text()}`);
        }
        console.log('✅ Notionへのフィードバック完了。');
      } catch (commentErr) {
        console.error('⚠️ コメントの送信に失敗しました:', commentErr.message);
      }
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
