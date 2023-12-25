import { PrismaClient } from '@prisma/client'
import * as fs from 'fs';

const MIN_ANALYZE_RATING = 1700;
const MAX_ANALYZE_RATING = 1720;
const OFFSET = 20;

const prisma = new PrismaClient()

const now = new Date();
let musicMap: { [key: string]: any; } = {};
const difficultyMap: { [key: number]: string; } = {
  1: "BASIC",
  2: "ADVANCED",
  3: "EXPERT",
  4: "MASTER",
  5: "LUNATIC",
}

async function analyseRatings(ratings: any[], userLength: number = 0) {
  const ratingSongs: { [key: string]: {
    songId: number,
    title: string,
    difficulty: number,
    difficultyStr: string,
    count: number,
    usePercentage: string,
    totalRating: number,
    totalScore: number,
    totalRank: number,
    averageRating: string, // 表示用なのでstringにしておく（使い捨てスクリプトならでは）
    averageScore: number,
    averageRank: string, // これも
  } } = {};

  for (const rating of ratings) {
    let key = rating.songId.toString() + "_" + rating.difficulty.toString();
    if (!(key in ratingSongs)) {
      ratingSongs[key] = {
        songId: rating.songId,
        title: musicMap[key].title,
        difficulty: rating.difficulty,
        difficultyStr: "",
        count: 0,
        usePercentage: "",
        totalRating: 0,
        totalScore: 0,
        totalRank: 0,
        averageRating: "",
        averageScore: 0,
        averageRank: "",
      };
    }
    ratingSongs[key].count++;
    ratingSongs[key].totalRating += rating.rating;
    ratingSongs[key].totalScore += rating.score;
    ratingSongs[key].totalRank += rating.rank;
  }

  // 平均値算出
  for (const key in ratingSongs) {
    ratingSongs[key].difficultyStr = difficultyMap[ratingSongs[key].difficulty];
    ratingSongs[key].averageRating = (ratingSongs[key].totalRating / ratingSongs[key].count / 100).toFixed(2);
    ratingSongs[key].averageScore = Math.round(ratingSongs[key].totalScore / ratingSongs[key].count);
    // 7500以上はデータ上意味がないので1007500に
    if (ratingSongs[key].averageScore > 1007500) {
      ratingSongs[key].averageScore = 1007500;
    }

    ratingSongs[key].usePercentage = (ratingSongs[key].count / userLength * 100).toFixed(1);
    ratingSongs[key].averageRank = (ratingSongs[key].totalRank / ratingSongs[key].count).toFixed(2);
  }

  // countの降順でソート
  const sortedRatingSongs: { [key: string]: any } = {};
  Object.keys(ratingSongs).sort((a, b) => {
    return ratingSongs[b].count - ratingSongs[a].count;
  }).forEach((key) => {
    sortedRatingSongs[key] = ratingSongs[key];
  });

  return sortedRatingSongs;
}

async function main() {
  if (!process.env.DATA_URL) {
    throw new Error("DATA_URL is not defined.");
  }

  const musics = await prisma.music.findMany({});
  musicMap = musics.reduce((map: { [key: string]: any }, music) => {
    const key = music.id.toString() + "_" + music.difficulty.toString();
    map[key] = music;
    return map;
  }, {});

  let rating = MIN_ANALYZE_RATING;
  while (rating < MAX_ANALYZE_RATING) {
    // 指定レーティングごとにユーザーを取得
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            rating: {
              gte: rating,
              lt: rating + OFFSET,
            }
          },
          {
            updateAt: {
              gte: new Date((new Date()).setDate((new Date()).getDate() - 60))
            }
          },
          {
            registrationAt: {
              gte: new Date((new Date()).setDate((new Date()).getDate() - 30))
            }
          }
        ]
      },
      orderBy: { updateAt: 'desc' },
    });

    console.log(rating, "-", (rating + OFFSET), users.length, "users.");

    const ids = users.map(user => user.id);
    const oldRatings = await prisma.userOldRating.findMany({
      where: {
        userId: {
          in: ids,
        }
      }
    });

    const newRatings = await prisma.userNewRating.findMany({
      where: {
        userId: {
          in: ids,
        }
      }
    });

    const ratings = newRatings.length + oldRatings.length;

    const userLength = ratings / 45;
    console.log("  " + ratings, "ratings. (", userLength, "users.)")

    // 以下集計処理
    const newRatingSongs = await analyseRatings(newRatings, userLength);
    const oldRatingSongs = await analyseRatings(oldRatings, userLength);

    const result = {
      "userLength": userLength,
      "date": now.toLocaleString(),
      "new": newRatingSongs,
      "old": oldRatingSongs,
    }
    const path = "./result/" + now.getTime() + "/";
    const fileName = rating + "-" + (rating + OFFSET) + ".json";
    await fs.promises.mkdir(path, { recursive: true })
    await fs.promises.writeFile((path + fileName), JSON.stringify(result), 'utf8');

    rating += OFFSET;
  }
}

await main()