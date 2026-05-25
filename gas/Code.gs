/**
 * AI広報サポート LP — お問い合わせ受付（Google Apps Script）
 *
 * 【セットアップ手順】
 * 1. Google スプレッドシートを新規作成
 * 2. 拡張機能 → Apps Script を開き、この Code.gs の内容を貼り付け
 * 3. 左メニュー「プロジェクトの設定」→ スクリプト プロパティ に以下を追加
 *      SPREADSHEET_ID … スプレッドシートURLの /d/ と /edit の間の文字列
 * 4. 関数 setupSheet を選択して「実行」（初回のみ・シートとヘッダー作成）
 * 5. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
 *      - 実行ユーザー: 自分
 *      - アクセス: 全員（匿名ユーザーを含む）
 * 6. 表示された Web アプリ URL を LP の config.js の GAS_ENDPOINT_URL に貼る
 *
 * 【スプレッドシート列】
 * A: 送信日時  B: 医院名  C: お名前  D: メール  E: ご相談内容  F: 送信元
 */

const SHEET_NAME = 'お問い合わせ';

/**
 * 初回のみ実行：シートとヘッダー行を作成
 */
function setupSheet() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    throw new Error('SPREADSHEET_ID が設定されていません。スクリプトプロパティを追加してください。');
  }
  const ss = SpreadsheetApp.openById(id);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  initSheetHeaders_(sheet);
}

function initSheetHeaders_(sheet) {
  sheet.clear();
  sheet.getRange(1, 1, 1, 6).setValues([[
    '送信日時', '医院名', 'お名前', 'メールアドレス', 'ご相談内容', '送信元'
  ]]);
  sheet.getRange(1, 1, 1, 6)
    .setFontWeight('bold')
    .setBackground('#F5E6DC');
  sheet.setFrozenRows(1);
}

/**
 * POST: LP フォームからの送信
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const data = parsePostData_(e);
    validateData_(data);
    appendRow_(data);
    return jsonOutput_({ success: true, message: '送信が完了しました。' });
  } catch (err) {
    return jsonOutput_({ success: false, message: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * GET: 動作確認用（ブラウザで URL を開くと JSON が返る）
 */
function doGet() {
  return jsonOutput_({
    success: true,
    message: 'AI広報サポート お問い合わせ API は稼働中です。',
  });
}

// ---- 内部処理 ----

function parsePostData_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('送信データがありません。');
  }

  let parsed;
  try {
    parsed = JSON.parse(e.postData.contents);
  } catch (parseErr) {
    throw new Error('データ形式が正しくありません。');
  }

  return {
    clinic: String(parsed.clinic || '').trim(),
    name: String(parsed.name || '').trim(),
    email: String(parsed.email || '').trim(),
    message: String(parsed.message || '').trim(),
    source: String(parsed.source || 'AI広報サポートLP').trim(),
    website: String(parsed.website || '').trim(), // ハニーポット
  };
}

function validateData_(data) {
  if (data.website) {
    throw new Error('送信に失敗しました。');
  }
  if (!data.clinic) throw new Error('医院名を入力してください。');
  if (!data.name) throw new Error('お名前を入力してください。');
  if (!data.email) throw new Error('メールアドレスを入力してください。');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('メールアドレスの形式が正しくありません。');
  }
  if (data.clinic.length > 200) throw new Error('医院名が長すぎます。');
  if (data.name.length > 100) throw new Error('お名前が長すぎます。');
  if (data.message.length > 5000) throw new Error('ご相談内容が長すぎます。');
}

function appendRow_(data) {
  const sheet = getOrCreateSheet_();
  sheet.appendRow([
    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss'),
    data.clinic,
    data.name,
    data.email,
    data.message,
    data.source,
  ]);
}

function getOrCreateSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    throw new Error('SPREADSHEET_ID が設定されていません。スクリプトプロパティを確認してください。');
  }

  const ss = SpreadsheetApp.openById(id);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    initSheetHeaders_(sheet);
  } else if (sheet.getRange(1, 1).getValue() !== '送信日時') {
    initSheetHeaders_(sheet);
  }
  return sheet;
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
