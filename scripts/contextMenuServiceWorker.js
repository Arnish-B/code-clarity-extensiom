    const getKey = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openai-key'], (result) => {
        if (result['openai-key']) {
            const decodedKey = atob(result['openai-key']);
            resolve(decodedKey);
        }
        });
    });
    };  
    const sendMessage = (content) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0].id;

        chrome.tabs.sendMessage(
        activeTab,
        { message: 'inject', content },
        (response) => {
            if (response.status === 'failed') {
            console.log('injection failed.');
            }
        }
        );
    });
    };

    const generate = async (prompt) => {

    const key = await getKey();
    const url = 'https://api.openai.com/v1/completions';


    const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 1250,
        temperature: 0.7,
    }),
    });

    // Select the top choice and send back
    const completion = await completionResponse.json();
    return completion.choices.pop();
    }

    const generateCompletionAction = async (info) => {
    try {
        sendMessage('generating...');
        const { selectionText } = info;
        const basePromptPrefix = `
        Make a table of all the key points of the code below, and also make a list of technical details such as time complexity and space complexity if applicable. Include errors (logical, syntactic and semantic) if any:

        Code:
        `;
        const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);

        const secondPrompt = 
    `
    Use the table of contents and also the code along with it to generate it's explanation such that a 10 year old can understand it

    Title: ${req.body.userInput}

    Table of Contents: ${basePromptOutput.text}

    Code Explanation:
    `;

    const secondPromptCompletion = await generate(secondPrompt);

    sendMessage(secondPromptCompletion.text);
    } catch (error) {
        console.log(error);

        sendMessage(error.toString());
    }
    };

    chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'context-run',
        title: 'Simplify code',
        contexts: ['selection'],
    });
    });

    chrome.contextMenus.onClicked.addListener(generateCompletionAction);