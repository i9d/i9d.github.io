const games = [
    {name: 'Cube', appToken: 'd1690a07-3780-4068-810f-9b5bbf2931b2', promoId: 'b4170868-cef0-424f-8eb9-be0622e8e8e3'},
    {name: 'Train', appToken: '82647f43-3f87-402d-88dd-09a90025313f', promoId: 'c4480ac7-e178-4973-8061-9ed5b2e17954'},
    {name: 'Merge', appToken: '8d1cc2ad-e097-4b86-90ef-7a27e19fb833', promoId: 'dc128d28-c45b-411c-98ff-ac7726fbaea4'},
    {name: 'Twerk', appToken: '61308365-9d16-4040-8bb0-2f4a4c69074c', promoId: '61308365-9d16-4040-8bb0-2f4a4c69074c'},
    {name: 'Polysphere', appToken: '2aaf5aee-2cbc-47ec-8a3f-0962cc14bc71', promoId: '2aaf5aee-2cbc-47ec-8a3f-0962cc14bc71'},
    {name: 'mow_trim', appToken: 'ef319a80-949a-492e-8ee0-424fb5fc20a6', promoId: 'ef319a80-949a-492e-8ee0-424fb5fc20a6'},
    {name: 'zoopolis', appToken: 'b2436c89-e0aa-4aed-8046-9b0515e1c46b', promoId: 'b2436c89-e0aa-4aed-8046-9b0515e1c46b'},
    {name: 'fluff', appToken: '112887b0-a8af-4eb2-ac63-d82df78283d9', promoId: '112887b0-a8af-4eb2-ac63-d82df78283d9'},
    {name: 'trio', appToken: 'e68b39d2-4880-4a31-b3aa-0393e7df10c7', promoId: 'e68b39d2-4880-4a31-b3aa-0393e7df10c7'},
    {name: 'stone', appToken: '04ebd6de-69b7-43d1-9c4b-04a6ca3305af', promoId: '04ebd6de-69b7-43d1-9c4b-04a6ca3305af'},
    {name: 'bounce', appToken: 'bc72d3b9-8e91-4884-9c33-f72482f0db37', promoId: 'bc72d3b9-8e91-4884-9c33-f72482f0db37'},
    {name: 'ball', appToken: '4bf4966c-4d22-439b-8ff2-dc5ebca1a600', promoId: '4bf4966c-4d22-439b-8ff2-dc5ebca1a600'},
    {name: 'count', appToken: '4bdc17da-2601-449b-948e-f8c7bd376553', promoId: '4bdc17da-2601-449b-948e-f8c7bd376553'},
    {name: 'pinout', appToken: 'd2378baf-d617-417a-9d99-d685824335f0', promoId: 'd2378baf-d617-417a-9d99-d685824335f0'},
];

let ready_codes = [];
let codesCount = {
    cube: 0,
    train: 0,
    merge: 0,
    twerk: 0,
    polysphere: 0,
    mow_trim: 0,
    zoopolis: 0,
    fluff: 0,
    trio: 0,
    stone: 0,
    bounce: 0,
    ball: 0,
};

const MAX_CODES_PER_GAME = 4;
const MIN_CODES = 1;

async function generateClientId() {
    const timestamp = Date.now();
    const randomNumbers = Array.from({length: 19}, () => Math.floor(Math.random() * 10)).join('');
    return `${timestamp}-${randomNumbers}`;
}

async function loginClient(appToken) {
    const clientId = await generateClientId();
    try {
        const response = await axios.post('https://api.gamepromo.io/promo/login-client', {
            appToken: appToken,
            clientId: clientId,
            clientOrigin: 'deviceid'
        }, {
            headers: {'Content-Type': 'application/json; charset=utf-8'}
        });
        return response.data.clientToken;
    } catch (error) {
        console.error('Error logging in client:', error.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return loginClient(appToken);
    }
}

async function registerEvent(token, promoId) {
    const eventId = generateRandomUUID();
    try {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const response = await axios.post('https://api.gamepromo.io/promo/register-event', {
            promoId: promoId,
            eventId: eventId,
            eventOrigin: 'undefined'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json; charset=utf-8',
            }
        });

        if (!response.data.hasCode) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            return registerEvent(token, promoId);
        } else {
            return true;
        }
    } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        return registerEvent(token, promoId);
    }
}

async function createCode(token, promoId) {
    let response;
    do {
        try {
            response = await axios.post('https://api.gamepromo.io/promo/create-code', {
                promoId: promoId
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json; charset=utf-8',
                }
            });
        } catch (error) {
            console.error('Error creating code:', error.message);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } while (!response || !response.data.promoCode);

    return response.data.promoCode;
}

function generateRandomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log(`Copied to clipboard: ${text}`);
    }).catch(err => {
        console.error('Error copying to clipboard', err);
    });
}

async function generateCodes() {
    const keygenButton = document.getElementById('keygenButton');
    keygenButton.setAttribute('disabled', '');
    const output = document.getElementById('output-codes');
    output.innerHTML = '';
    const output_text = document.getElementById('generating-text');
    const finishMessage = document.getElementById('generated-text');
    output_text.classList.remove('hidden');
    finishMessage.classList.add('hidden');

    ready_codes = [];

    const selectedGames = Array.from(document.querySelectorAll('.game-button.active')).map(button => button.getAttribute('data-game'));
    const totalCodesPerGame = parseInt(document.getElementById('codeCount').textContent);


    const tasks = games.flatMap(game => {
        if (selectedGames.includes(game.name.toLowerCase())) {
            return Array.from({length: totalCodesPerGame}).map(async () => {
                try {
                    const token = await loginClient(game.appToken);
                    await registerEvent(token, game.promoId);
                    const code = await createCode(token, game.promoId);
                    ready_codes.push({game: game.name, code});
                    codesCount[game.name.toLowerCase()]++;

                    // Добавляем сгенерированный код на страницу с обработчиком клика
                    const codeElement = document.createElement('p');
                    codeElement.classList.add('code');
                    codeElement.textContent = `${code}`;
                    codeElement.addEventListener('click', () => copyToClipboard(code));
                    output.appendChild(codeElement);
                } catch (error) {
                    const errorElement = document.createElement('p');
                    errorElement.textContent = `${game.name} Code Error`;
                    output.appendChild(errorElement);
                }
            });
        } else {
            return [];
        }
    });

    // Ждем выполнения всех задач параллельно
    await Promise.all(tasks);

    output_text.classList.add('hidden');
    finishMessage.classList.remove('hidden');

    keygenButton.removeAttribute('disabled');
}

function updateButtonStates() {
    if (codeCount <= MIN_CODES) {
        decreaseButton.classList.add('transparent')
    } else {
        decreaseButton.classList.remove('transparent')
    }
    if (codeCount >= MAX_CODES_PER_GAME) {
        increaseButton.classList.add('transparent')
    } else {
        increaseButton.classList.remove('transparent')
    }
}

function updateGameSelection() {
    const selectedGames = Array.from(document.querySelectorAll('.game-button.active'))
        .map(button => button.getAttribute('data-game'));
    console.log('Selected games:', selectedGames);
    // Логика для обработки выбранных игр
}

function checkSubscription() {
    const subscribedPart = document.getElementById('subscribed');
    const unsubscribedPart = document.getElementById('unsubscribed');

    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (userId) {
        const url = `https://hkfambot-pnikitap.amvera.io/check-subscription?userId=${userId}`;
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const subscribed = data.subscribed;
                if (!subscribed) {
                    subscribedPart.classList.add('hidden');
                    unsubscribedPart.classList.remove('hidden');
                } else {
                    subscribedPart.classList.remove('hidden');
                    unsubscribedPart.classList.add('hidden');
                }
                console.log('User subscription status:', data);
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    }
}

checkSubscription();
document.getElementById('checkSub')?.addEventListener('click', checkSubscription);

const gameButtons = document.querySelectorAll('.game-button');

gameButtons.forEach(button => {
    button.addEventListener('click', () => {
        button.classList.toggle('active');
        updateGameSelection();
    });
});

const decreaseButton = document.getElementById('decreaseCount');
const increaseButton = document.getElementById('increaseCount');
const codeCountSpan = document.getElementById('codeCount');
let codeCount = parseInt(codeCountSpan.textContent, 10);
updateButtonStates();
decreaseButton.addEventListener('click', () => {
    if (codeCount > MIN_CODES) {
        codeCount--;
        codeCountSpan.textContent = codeCount;
        updateButtonStates();
    }
});

increaseButton.addEventListener('click', () => {
    if (codeCount < MAX_CODES_PER_GAME) {
        codeCount++;
        codeCountSpan.textContent = codeCount;
        updateButtonStates();
    }
});

updateButtonStates();

document.getElementById('keygenButton').addEventListener('click', generateCodes);
