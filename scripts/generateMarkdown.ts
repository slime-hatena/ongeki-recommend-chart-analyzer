import * as fs from 'fs';

async function generateTable(songs: any) {
  let markdown = "| 曲名 | 譜面定数 | 平均レート値 | 平均スコア | 登録率 |\n"
    + "| --- | --- | --- | --- | --- |\n";

  for (const key in songs) {
    if (Object.prototype.hasOwnProperty.call(songs, key)) {
      const element = songs[key];
      let title = element["title"];

      // master以外は難易度を表示
      if (element["difficulty"] != "4") {
        title += " (" + element["difficultyStr"] + ")";
      }

      markdown += "| " + title + " | "
        + element["level"] + " | "
        + element["averageRating"] + " | "
        + element["averageScore"].toLocaleString() + " | "
        + element["usePercentage"] + "% (" + element["count"] + ") |\n";
    }
  }

  return markdown;
}

async function main() {
  // resultディレクトリの中身を取得
  const listFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent =>
    dirent.isFile() ? [`${dir}/${dirent.name}`] : listFiles(`${dir}/${dirent.name}`)
  )
  const files = listFiles( "./result");
  console.log(files);

  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));

    const ratingMin = json["ratingMin"];
    const ratingMax = json["ratingMax"];

    let markdown = "";
    markdown += "集計対象: " + ratingMin + " ～ " + ratingMax + "\n";
    markdown += "対象ユーザー数: " + json["userLength"] + "\n";
    markdown += "データ取得日: 2023/12/24 5時ごろ\n\n"; // ベタ書き～
    markdown += "## 新曲枠\n\n";
    markdown += await generateTable(json["new"]) + "\n";
    markdown += "## ベスト枠\n\n";
    markdown += await generateTable(json["old"]);

    // markdown書き出し
    fs.writeFileSync("./markdown/" + ratingMin + "-" + ratingMax + ".md", markdown);
  }
}

await main();
