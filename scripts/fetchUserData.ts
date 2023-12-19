import { PrismaClient } from '@prisma/client'
import { JSDOM } from 'jsdom';

const prisma = new PrismaClient()

async function main() {
  if (!process.env.DATA_URL) {
    throw new Error("DATA_URL is not defined.");
  }

  const content = await fetch(process.env.DATA_URL + "/user");
  const body = await content.text();
  const dom = new JSDOM(body);
  const element = dom.window.document.querySelectorAll("#sort_table > table > tbody > tr");

  if (element) {
    for (const e of element) {
      const id = parseInt(e.querySelector("td.sort_id")?.textContent ?? "");
      const name = e.querySelector("td.sort_name > a")?.textContent ?? "";
      const rating = parseInt((e.querySelector("td.sort_max")?.textContent ?? "").replace(".", "").replace("(", "").replace(")", ""));
      const time = e.querySelector("td.sort_update > span.sort-key")?.textContent ?? "";
      const date = e.querySelector("td.sort_update")?.textContent?.replace(time, "");
      const updateAt = new Date(date + ' ' + time);

      await prisma.user.upsert({
        where: { id: id },
        create: {
          id: id,
          name: name,
          rating: rating,
          updateAt: updateAt,
        },
        update: {
          name: name,
          rating: rating,
          updateAt: updateAt,
        },
      }).then((_r) => {
        console.log(id, name, rating, updateAt);
      }).catch((_e) => {
        console.log("Error:");
        console.log(id, name, rating, updateAt);
        throw e;
      });
    }
  }

  console.log('element.length', element.length);
}

await main()
