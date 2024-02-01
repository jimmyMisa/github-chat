const core = require('@actions/core');
const axios = require('axios');
const fs = require('fs').promises;

async function run() {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        const gatoken = process.env.GA_TOKEN;
        const branch = core.getInput('branch');
        const repoOwner = process.env.GITHUB_REPOSITORY.split('/')[0];
        const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];

        // Récupérer la liste des fichiers modifiés
        const { data: modifiedFiles } = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/compare/main^...main`);

        // Boucle sur chaque fichier
        for (const file of modifiedFiles.files) {
            // Ignorer les fichiers dans le dossier public/build
            if (
                !file.filename.startsWith('public/build/') &&
                !file.filename.startsWith('node_modules/') &&
                !file.filename.startsWith('action.yaml') &&
                !file.filename.startsWith('.github')
            ) {
                // Appel à l'API OpenAI pour la revue de code
        
				const { data: fileContent } = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${file.filename}?ref=main`);
				const encoded = fileContent.content;
				const content = atob(encoded);
                const prompt = `Review this ${file.filename} code for potential bugs or Code Smells and suggest improvements. Generate your response in markdown format:\n\`\`\`\n${content}\n\`\`\``;

                try {


                    const axios = require('axios');
                    let data = JSON.stringify({
                        "model": "gpt-3.5-turbo",
                        "messages": [{
                            "role": "user",
                            "content": prompt
                        }],
                        "temperature": 0.7
                    });

                    let config = {
                        method: 'post',
                        maxBodyLength: Infinity,
                        url: 'https://api.openai.com/v1/chat/completions',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        data: data
                    };


                    const response = await axios.request(config);


                    // Récupérer la réponse de l'API OpenAI
                    const aiResponse = response.data.choices[0].message['content'];

                    // Créer une issue avec le commentaire


                    const issueTitle = `Code Review for ${file.filename}`;
                    const issueBody = `## Code Review for ${file.filename}\n\n${aiResponse}`;

                    const { data: createdIssue } = await axios.post(
                        `https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
                            title: issueTitle,
                            body: issueBody,
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                //'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                                'Authorization': `Bearer ${gatoken}`,
                            },
                        }
                    );

                    console.log(`Code review for ${file.filename} added as issue: ${createdIssue.html_url}`);
                } catch (error) {
                	console.log(error.response.data)
                    core.setFailed(`Error calling OpenAI API: ${error.message}`);
                }
            }
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();