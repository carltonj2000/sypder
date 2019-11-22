const fs = require("fs");
const path = require("path");

const fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const baseUrl = "https://birdandhike.com/";
const dir = "./birdandhike";

const index = path.join(dir, "index.html");

const test = true;

const main = async () => {
  try {
    let text;
    if (test) {
      text = fs.readFileSync(index);
    } else {
      const res = await fetch(baseUrl);
      text = await res.text();
    }

    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    if (!test) fs.writeFileSync(path.join(dir, "index.html"), text);

    const dom = new JSDOM(text);

    if (!test) {
      const links = [...dom.window.document.querySelectorAll("link")];
      links.map(async link => {
        const url = new URL(link.href, baseUrl);
        const res = await fetch(url);
        const blob = await res.blob();
        const out = link.href.includes("css")
          ? await blob.text()
          : new Buffer.from(await blob.arrayBuffer());
        fs.writeFileSync(path.join(dir, link.href), out);
      });
    }
    const imgs = [...dom.window.document.querySelectorAll("img")];
    imgs.map(async img => {
      console.log(img.src);
      const paths = img.src.split("/");
      const subDir =
        paths.length === 0
          ? ""
          : path.length === 1
          ? paths[0]
          : paths.slice(0, paths.length - 1).join("/");
      const file = paths[paths.length - 1];
      const d = path.join(dir, subDir);
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
      const url = new URL(img.src, baseUrl);
      const res = await fetch(url);
      const blob = await res.blob();
      const out = new Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(path.join(d, file), out);
    });
  } catch (e) {
    console.log("failed with", e.message ? e.message : e);
  }
};

main();
