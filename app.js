const games = [
    {name: 'Bike', appToken: 'd28721be-fd2d-4b45-869e-9f253b554e50', promoId: '43e35910-c168-4634-ad4f-52fd764a843f'},
    {name: 'Cube', appToken: 'd1690a07-3780-4068-810f-9b5bbf2931b2', promoId: 'b4170868-cef0-424f-8eb9-be0622e8e8e3'},
    {name: 'Clone', appToken: '74ee0b5b-775e-4bee-974f-63e7f4d5bacb', promoId: 'fe693b26-b342-4159-8808-15e3ff7f8767'},
    {name: 'Train', appToken: '82647f43-3f87-402d-88dd-09a90025313f', promoId: 'c4480ac7-e178-4973-8061-9ed5b2e17954'},
    {name: 'Merge', appToken: '8d1cc2ad-e097-4b86-90ef-7a27e19fb833', promoId: 'dc128d28-c45b-411c-98ff-ac7726fbaea4'},
    {name: 'Twerk', appToken: '61308365-9d16-4040-8bb0-2f4a4c69074c', promoId: '61308365-9d16-4040-8bb0-2f4a4c69074c'}
];

let ready_codes = [];
let codesCount = {
    bike: 0,
    cube: 0,
    clone: 0,
    train: 0,
    merge: 0,
    twerk: 0,
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
            await new Promise(resolve => setTimeout(resolve, 5000));
            return registerEvent(token, promoId);
        } else {
            return true;
        }
    } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 5000));
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
    output.innerHTML = ''
    const output_text = document.getElementById('generating-text');
    const finishMessage = document.getElementById('generated-text');
    output_text.classList.remove('hidden')
    finishMessage.classList.add('hidden')

    ready_codes = [];
    codesCount = {bike: 0, cube: 0, clone: 0, train: 0, merge: 0, twerk: 0};

    const selectedGames = Array.from(document.querySelectorAll('.game-button.active')).map(button => button.getAttribute('data-game'));
    const totalCodesPerGame = parseInt(document.getElementById('codeCount').textContent);

    for (const game of games) {
        if (selectedGames.includes(game.name.toLowerCase())) {
            while (codesCount[game.name.toLowerCase()] < totalCodesPerGame) {
                try {
                    const token = await loginClient(game.appToken);
                    await registerEvent(token, game.promoId);
                    const code = await createCode(token, game.promoId);
                    ready_codes.push({game: game.name, code});
                    codesCount[game.name.toLowerCase()]++;

                    // Add the generated code to the output with a click handler
                    const codeElement = document.createElement('p');
                    codeElement.textContent = `${code}`;
                    codeElement.addEventListener('click', () => copyToClipboard(code));
                    output.appendChild(codeElement);

                    // Break out of the loop if we have reached the limit
                    if (codesCount[game.name.toLowerCase()] >= totalCodesPerGame) {
                        break;
                    }
                } catch (error) {
                    const errorElement = document.createElement('p');
                    errorElement.textContent = `${game.name} Code Error`;
                    output.appendChild(errorElement);
                }
            }
        }
    }

    output_text.classList.add('hidden')
    finishMessage.classList.remove('hidden')

    keygenButton.removeAttribute('disabled');
}

function updateButtonStates() {
    decreaseButton.disabled = (codeCount <= MIN_CODES);
    increaseButton.disabled = (codeCount >= MAX_CODES_PER_GAME);
}

function updateGameSelection() {
    const selectedGames = Array.from(document.querySelectorAll('.game-button.active'))
        .map(button => button.getAttribute('data-game'));
    console.log('Selected games:', selectedGames);
    // Логика для обработки выбранных игр
}


function checkSubscription() {
    const subscribedPart = document.getElementById('subscribed')
    const unsubscribedPart = document.getElementById('unsubscribed')
    const fail = document.getElementById('fail')


    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? '307766739';
    if (!userId) {
        fail.classList.remove('hidden')
        subscribedPart.classList.add('hidden')
    } else {

        const url = `http://localhost:8080/check-subscription?userId=${userId}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Предполагаем, что ответ в формате JSON
            })
            .then(data => {
                // Обработка полученных данных
                console.log('User subscription status:', data);
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });

        var subscribed = false
        if (!subscribed) {
            subscribedPart.classList.add('hidden')
            unsubscribedPart.classList.remove('hidden')
        } else {
            subscribedPart.classList.remove('hidden')
            unsubscribedPart.classList.add('hidden')
        }
    }
}

// checkSubscription()

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


document.getElementById('keygenButton').addEventListener('click', generateCodes);
