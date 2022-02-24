var axios = require('axios').default;
var { readFileSync, writeFileSync } = require('fs');

const MAX_DESCRIPTION_LENGTH = 50;

async function main() {
    const resources = JSON.parse(readFileSync('../resources.json'));
    const header = readFileSync('../header.md');
    
    const allAPIData = {};
    async function githubApiToMap({ name, repo }) {
        // https://docs.github.com/en/rest/reference/repos
        const githubApiRes = await axios.get(`https://api.github.com/repos/${repo}`, {
            headers: {
                Accept: "application/vnd.github.v3+json"
            }
        });
        allAPIData[name] = githubApiRes.data;
    }

    await Promise.all(Object.values(resources).flat().map(singleResource => githubApiToMap(singleResource)));

    let finalMdString = header + "\n\n";
    for (const [lang, repos] of Object.entries(resources)) {
        finalMdString += `### ${lang}\nName | Description | GitHub Activity\n---- | ----------- | ---------------\n`;
        for (const currResource of repos) {
            const { name, repo } = currResource;
            const { description, size, stargazers_count, watchers_count /** ...etc */ } = allAPIData[name];
            finalMdString += `[${name}](https://github.com/${repo}) | ${description ? description.substr(0, MAX_DESCRIPTION_LENGTH) + "\u2026" : "_no description provided_"} | ![GitHub stars](https://img.shields.io/github/stars/${repo}) ![GitHub commit activity](https://img.shields.io/github/commit-activity/y/${repo})`
        }
        finalMdString += "\n\n";
    }
    writeFileSync("README-dev.md", finalMdString);
}

require.main === module && main();