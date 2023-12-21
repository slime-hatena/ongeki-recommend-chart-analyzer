import { PrismaClient } from '@prisma/client'
import { JSDOM } from 'jsdom';

const prisma = new PrismaClient()

const difficultyMap: { [key: string]: number } = {
  Basic: 1,
  Advanced: 2,
  Expert: 3,
  Master: 4,
  Lunatic: 5,
};

async function main() {
  if (!process.env.DATA_URL) {
    throw new Error("DATA_URL is not defined.");
  }

  const content = await fetch(process.env.DATA_URL + "/music");
  const body = await content.text();
  const dom = new JSDOM(body);
  const element = dom.window.document.querySelectorAll("#sort_table > table > tbody > tr");

  for (const iterator of element) {
    const id = parseInt(((iterator.querySelector("td.sort_title > a") as HTMLAnchorElement)?.href ?? "")
      .replace("/music/", "")
      .replace("/basic", "")
      .replace("/advanced", "")
      .replace("/expert", "")
      .replace("/master", "")
      .replace("/lunatic", ""));
    let name = iterator.querySelector("td.sort_title > a")?.textContent ?? "";
    const difficulty = difficultyMap[iterator.querySelector("td:nth-child(2)")?.textContent ?? ""];
    const level = parseInt((iterator.querySelector("td:nth-child(4)")?.textContent ?? "").replace(".", ""));

    // Hand in Hand問題 ベタ書きで何とかする
    if (id === 185) {
      name = "Hand in Hand - ユーフィリア（CV：高橋 李依）";
    }else if (id === 337) {
      name = "Hand in Hand - livetune";
    }

    if (id === 362) {
      name = "Singularity - technoplanet";
    } else if (id === 425) {
      name = "Singularity - ETIA.";
    } else if (id === 487) {
      name = "Singularity - SEGA SOUND STAFF「セガNET麻雀 MJ」";
    }

    console.log(id, name, difficulty, level);

    await prisma.music.upsert({
      where: {
        id_difficulty: {
          id: id,
          difficulty: difficulty,
        },
      },
      create: {
        id: id,
        title: name,
        difficulty: difficulty,
        level: level,
      },
      update: {
        title: name,
        difficulty: difficulty,
        level: level,
      },
    });
  }

}

await main()
