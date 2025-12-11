// サーバーからの日時文字列（UTC想定）をローカル日時に変換する
// 例: "2025-12-11 09:49:53" -> "2025-12-11T09:49:53Z" として解釈
export function parseServerDate(value: string): Date {
  const withZone = value && !value.includes('T') && !value.includes('Z')
    ? `${value}Z`.replace(' ', 'T')
    : value;

  const parsed = new Date(withZone);
  // もしパースに失敗したらそのまま new Date(value) を試す
  return isNaN(parsed.getTime()) ? new Date(value) : parsed;
}
