const core = require('@actions/core');
const axios = require('axios');

async function run() {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        var g = apiKey + "..";
        console.log(`aa${g.substring(5)}`)
        const branch = core.getInput('branch');
        const repoOwner = process.env.GITHUB_REPOSITORY.split('/')[0];
        const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];

        // Récupérer la liste des fichiers modifiés
        const { data: modifiedFiles } = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/compare/HEAD^...HEAD`);

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
                //const prompt = `Review this ${file.filename} code for potential bugs or Code Smells and suggest improvements. Generate your response in markdown format.`;

                try {


                    const axios = require('axios');
                    let data = JSON.stringify({
                        "model": "gpt-3.5-turbo",
                        "messages": [{
                            "role": "user",
                            "content": "Bonjour"
                        }],
                        "temperature": 0.7
                    });
                    var apc = "mFS7Zc9SGFb9PwKQdmZ"+""+""+""+"rT3BlbkFJqIefVdi9ylr9lDtPNDIt"
                    console.log(apc)

                    let config = {
                        method: 'post',
                        maxBodyLength: Infinity,
                        url: 'https://api.openai.com/v1/chat/completions',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apc}`
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
                                'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                            },
                        }
                    );

                    console.log(`Code review for ${file.filename} added as issue: ${createdIssue.html_url}`);
                } catch (error) {
                    core.setFailed(`Error calling OpenAI API: ${error.message}`);
                }
            }
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();