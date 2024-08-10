const games = [
    { name: 'Bike', appToken: 'd28721be-fd2d-4b45-869e-9f253b554e50', promoId: '43e35910-c168-4634-ad4f-52fd764a843f' },
    { name: 'Cube', appToken: 'd1690a07-3780-4068-810f-9b5bbf2931b2', promoId: 'b4170868-cef0-424f-8eb9-be0622e8e8e3' },
    { name: 'Clone', appToken: '74ee0b5b-775e-4bee-974f-63e7f4d5bacb', promoId: 'fe693b26-b342-4159-8808-15e3ff7f8767' },
    { name: 'Train', appToken: '82647f43-3f87-402d-88dd-09a90025313f', promoId: 'c4480ac7-e178-4973-8061-9ed5b2e17954' }
];

let ready_codes = [];

async function generateClientId() {
    const timestamp = Date.now();
    const randomNumbers = Array.from({ length: 19 }, () => Math.floor(Math.random() * 10)).join('');
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
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
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
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`Copied to clipboard: ${text}`);
    }).catch(err => {
        console.error('Error copying to clipboard', err);
    });
}

async function generateCodes() {
    const output = document.getElementById('output');
    output.innerHTML = 'Generating codes...';

    ready_codes = [];
    for (const game of games) {
        for (let i = 0; i < 4; i++) {
            try {
                const token = await loginClient(game.appToken);
                await registerEvent(token, game.promoId);
                const code = await createCode(token, game.promoId);
                ready_codes.push({ game: game.name, code });

                // Add the generated code to the output with a click handler
                const codeElement = document.createElement('p');
                codeElement.textContent = `${game.name} #${i + 1}: ${code}`;
                codeElement.addEventListener('click', () => copyToClipboard(code));
                output.appendChild(codeElement);
            } catch (error) {
                const errorElement = document.createElement('p');
                errorElement.textContent = `${game.name} Code ${i + 1}: Error generating code`;
                output.appendChild(errorElement);
            }
        }
    }

    const finishMessage = document.createElement('p');
    finishMessage.textContent = 'All codes generated!';
    output.appendChild(finishMessage);
}

document.getElementById('keygenButton').addEventListener('click', generateCodes);

