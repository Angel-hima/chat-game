/**
 * クリップボードにテキストをコピーするユーティリティ関数
 * HTTP接続時（Secure Context外）やブラウザの権限仕様、iOS Safari等でも
 * 確実にコピーできるよう execCommand('copy') のフォールバックを備えています。
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. モダンブラウザかつ Secure Context（HTTPS または localhost）の場合
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText に失敗したため、フォールバックを実行します:', err);
    }
  }

  // 2. フォールバック: 一時的な textarea 要素によるコピー
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length); // iOS Safari対応

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('クリップボードへのコピーに失敗しました:', err);
    return false;
  }
}
