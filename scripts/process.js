// @ts-check
const fs = require("fs/promises");
const path = require("path");
const thesaurus = require("thesaurus");

let synonyms = require("../synonyms.json");

const OUTPUT_FOLDER = path.resolve(__dirname, "..", "icons");
const DESTINATION_FOLDER = path.resolve(
  __dirname,
  "..",
  "ionicons",
  "src",
  "svg"
);

const BLACK_LIST_WORDS = ["circle", "git", "ellipsis", "logo", "off"];

async function copyIcon ({ variant, icon, filename }) {
  const outputPath = path.join(OUTPUT_FOLDER, variant, `${icon}.svg`)

  try { 
    await fs.access(path.dirname(outputPath))
  } catch (e) {
    console.log(e)
    await fs.mkdir(path.dirname(outputPath))
  }

  return fs.copyFile(
    path.join(DESTINATION_FOLDER, filename),
    path.join(OUTPUT_FOLDER, variant, `${icon}.svg`)
  );
}

async function main() {
  const pathContents = await fs.readdir(DESTINATION_FOLDER);

  return Promise.all(
    pathContents
      .map((filename) => {
        const rest = filename.match(/(.{1,100})-(outline|sharp)\.svg/);
        if (rest === null) {
          return {
            filename,
            icon: filename.replace(".svg", ""),
            variant: "filled",
          };
        }

        const [_, icon, variant] = rest;
        return { icon, variant, filename };
      })
      .map((result) => {
        if (!synonyms[result.icon]) {
          const subwords = result.icon.split("-");
          synonyms[result.icon] = [
            ...subwords,
            ...subwords
              .filter((word) => !BLACK_LIST_WORDS.includes(word))
              .flatMap((word) => thesaurus.find(word)),
          ];
        }

        return result;
      })
      .map(copyIcon)
  );
}

main()
  .then(() => {
    console.log("✅ Icons copied")
    return fs.writeFile(
      path.resolve(__dirname, "..", "synonyms.json"),
      JSON.stringify(synonyms, null, 2),
      "utf-8"
    );
  })
  .catch(console.error);
