import { PrismaClient } from '@prisma/client'
import * as fs from 'fs';

const generateRatingRangeList = [1400, 1450,
  1500, 1520, 1540, 1560, 1580,
  1600, 1610, 1620, 1630, 1640, 1650, 1660, 1670, 1680, 1690,
  1700, 1750];

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
    level: string,
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
        level: musicMap[key].level.toString().slice(0, -1) + "." + musicMap[key].level.toString().slice(-1),
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

  // 指定レーティングごとにユーザーを取得
  let ratingMin = 0;
  for (const ratingMax of generateRatingRangeList) {
    if (ratingMin == 0) {
      ratingMin = ratingMax;
      continue;
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            rating: {
              gte: ratingMin,
              lt: ratingMax,
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

    console.log(ratingMin, "-", ratingMax, users.length, "users.");

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
      "ratingMin": ratingMin.toString().slice(0, -2) + "." + ratingMin.toString().slice(-2),
      "ratingMax": (ratingMax - 1).toString().slice(0, -2) + "." + (ratingMax - 1).toString().slice(-2),
      "date": now.toLocaleString(),
      "new": newRatingSongs,
      "old": oldRatingSongs,
    }
    const path = "./result/" + now.getTime() + "/";
    const fileName = ratingMin + "-" + ratingMax + ".json";
    await fs.promises.mkdir(path, { recursive: true })
    await fs.promises.writeFile((path + fileName), JSON.stringify(result), 'utf8');

    ratingMin = ratingMax;
  }
}

await main()