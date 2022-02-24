var dotenv = require('dotenv');
dotenv.config();
var axios = require('axios').default;
var { readFileSync, writeFileSync } = require('fs');

const MAX_DESCRIPTION_LENGTH = 100;

function formatDescription(description) {
    if (description) {
        if (description.length > MAX_DESCRIPTION_LENGTH) {
            return description.substr(0, MAX_DESCRIPTION_LENGTH - 1) + "\u2026";
        } else {
            return description;
        }
    } else {
        return "_No description provided_"
    }
}

async function main() {
    const resources = JSON.parse(readFileSync('../resources.json'));
    const header = readFileSync('../header.md');

    const allAPIData = {};
    async function githubApiToMap({ name, repo }) {
        // https://docs.github.com/en/rest/reference/repos
        const githubApiRes = await axios.get(`https://api.github.com/repos/${repo}`, {
            headers: {
                Accept: "application/vnd.github.v3+json"
            },
            auth: process.env.GITHUB_USERNAME ? {
                username: process.env.GITHUB_USERNAME,
                password: process.env.GITHUB_ACCESS_TOKEN
            } : undefined
        });
        allAPIData[repo] = githubApiRes.data;
    }

    await Promise.all(Object.values(resources).flat().map(singleResource => githubApiToMap(singleResource)));

    let finalMdString = header + "\n\n";
    for (const [lang, repos] of Object.entries(resources)) {
        finalMdString += `### ${lang}\nName | Description | GitHub Activity\n---- | ----------- | ---------------`;
        for (const currResource of repos) {
            const { name, repo } = currResource;
            const { description, size, stargazers_count, watchers_count /** ...etc */ } = allAPIData[repo];
            finalMdString += `\n[${name}](https://github.com/${repo}) | ${formatDescription(description)} | ![GitHub stars](https://img.shields.io/github/stars/${repo}) ![GitHub commit activity](https://img.shields.io/github/commit-activity/y/${repo})`
        }
        finalMdString += "\n\n";
    }
    writeFileSync("README-dev.md", finalMdString);
}

require.main === module && main();