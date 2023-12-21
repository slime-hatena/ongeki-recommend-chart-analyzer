import { PrismaClient } from '@prisma/client'
import { JSDOM } from 'jsdom';

const prisma = new PrismaClient()

const difficultyMap: { [key: string]: number } = {
  Bas: 1,
  Adv: 2,
  Exp: 3,
  Mas: 4,
  Lun: 5,
};

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function main() {
  if (!process.env.DATA_URL) {
    throw new Error("DATA_URL is not defined.");
  }

  const users = await prisma.user.findMany({
    where: {
      rating: {
        gte: 1500,
        lt: 1709,
      },
      updateAt: {
        gte: new Date('2023-11-20')
      }
    },
    orderBy: { updateAt: 'desc' },
  });

  const ratingList: { [key: number]: any[] } = {};
  for (const u of users) {
    const key = Math.floor(u.rating / 10) * 10;
    if (!ratingList[key]) {
      ratingList[key] = [u];
    } else {
      ratingList[key].push(u);
    }
  }

  const keys = Object.keys(ratingList);
  keys.sort();
  for(const key of keys) {
    console.log(`${key} : ${ratingList[parseInt(key)].length}`);
  }
  console.log(users.length, "users.");

  for (const key in ratingList) {
    if (Object.prototype.hasOwnProperty.call(ratingList, key)) {
      const ratings = ratingList[key];
      console.log(key, ratings.length, "users.");
      for (const user of ratings) {
        // const content = await fetch(process.env.DATA_URL + "/user/2/rating");
        const content = await fetch(process.env.DATA_URL + "/user/" + user.id + "/rating");

        const body = await content.text();
        const dom = new JSDOM(body);

        // これが取得できなければStandardユーザー > スキップ
        if (dom.window.document.querySelector("#rating_statistics > p:nth-child(4) > span")?.textContent === undefined) {
          continue;
        }

        // 新曲枠の取得
        const ratingNewElements = dom.window.document.querySelectorAll("#rating_new > div:nth-child(4) > table > tbody > tr");
        let rank = 0;
        for (const r of ratingNewElements) {
          ++rank;
          const id = parseInt(((r.querySelector("td.sort_title > a") as HTMLAnchorElement)?.href ?? "")
            .replace(process.env.DATA_URL + "user/" + user.id + "/music/", "")
            .replace("/basic", "")
            .replace("/advanced", "")
            .replace("/expert", "")
            .replace("/master", "")
            .replace("/lunatic", ""));  // ゴリ押しが過ぎるんだけど・・・単発で動かすものだしまあええか・・・
          const title = r.querySelector("td.sort_title")?.textContent ?? "";
          const difficulty = difficultyMap[r.querySelector("td:nth-child(2)")?.textContent ?? ""];
          const level = parseFloat(r.querySelector("td:nth-child(3)")?.textContent ?? "");
          const score = parseInt((r.querySelector("td:nth-child(4)")?.textContent ?? "").replaceAll(",",""));
          const rating = parseInt((r.querySelector("td:nth-child(5)")?.textContent ?? "").replace(".",""));
          console.log(rank, id, title, difficulty, level, score, rating);

          await prisma.userNewRating.upsert({
            where: {
              userId_rank: {
                userId: user.id,
                rank: rank,
              },
            },
            create: {
              userId: user.id,
              rank: rank,
              songId: id,
              score: score,
              rating: rating,
            },
            update: {
              userId: user.id,
              rank: rank,
              songId: id,
              score: score,
              rating: rating,
            },
          });
        }

        console.log();

        // ベスト枠の取得
        const ratingOldElements = dom.window.document.querySelectorAll("#rating_old > div:nth-child(4) > table > tbody > tr");
        rank = 0;
        for (const r of ratingOldElements) {
          // 上の処理コピペ！ ちゃんとしたプロジェクトではこういうことをやってはいけない！！！
          ++rank;
          const id = parseInt(((r.querySelector("td.sort_title > a") as HTMLAnchorElement)?.href ?? "")
            .replace(process.env.DATA_URL + "user/" + user.id + "/music/", "")
            .replace("/basic", "")
            .replace("/advanced", "")
            .replace("/expert", "")
            .replace("/master", "")
            .replace("/lunatic", ""));  // ゴリ押しが過ぎるんだけど・・・単発で動かすものだしまあええか・・・
          const title = r.querySelector("td.sort_title")?.textContent ?? "";
          const difficulty = difficultyMap[r.querySelector("td:nth-child(2)")?.textContent ?? ""];
          const level = parseFloat(r.querySelector("td:nth-child(3)")?.textContent ?? "");
          const score = parseInt((r.querySelector("td:nth-child(4)")?.textContent ?? "").replaceAll(",",""));
          const rating = parseInt((r.querySelector("td:nth-child(5)")?.textContent ?? "").replace(".",""));
          console.log(rank, id, title, difficulty, level, score, rating);

          await prisma.userOldRating.upsert({
            where: {
              userId_rank: {
                userId: user.id,
                rank: rank,
              },
            },
            create: {
              userId: user.id,
              rank: rank,
              songId: id,
              score: score,
              rating: rating,
            },
            update: {
              userId: user.id,
              rank: rank,
              songId: id,
              score: score,
              rating: rating,
            },
          });
        }

        await sleep(3000);

        console.log();
        console.log();
        console.log();

      }
    }
  }
}

await main()
