let logs = [];

/** Determines whether to convert the value to a unix-timestamp or date */
const setValue = input =>
    !isNaN(input) && input !== ''
    ? unixToDate(input)
    : DateToUnix(input);

/** Convert unix timestamp to date  */
const unixToDate = value => new Date(value * 1000);

/* Set inputs */
const setInputs = value => {
    let res = setValue(value);
    if (typeof res === 'object' && Array.isArray(res)) {
        document.getElementById('input').value = res[0];
        document.getElementById('result').value = res[1];
    } else {
        document.getElementById('input').value = value;
        document.getElementById('result').value = setValue(value);
    }
};

/** Convert date to unix timestamp */
const DateToUnix = input => {
    let date = new Date();
    switch (input) {
        case 'startOfDay':
            let startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            return [Math.floor(startOfDay.getTime() / 1000), startOfDay];
        case 'endOfDay':
            let endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            endOfDay.setHours(23, 59, 59, 999);
            return [Math.floor(endOfDay.getTime() / 1000), endOfDay];
        case 'now':
            return [Math.floor(date.getTime() / 1000), date];
        case 'yesterday':
            date.setDate(date.getDate() - 1);
            return [Math.floor(date.getTime() / 1000), date];
        case 'tomorrow':
            date.setDate(date.getDate() + 1);
            return [Math.floor(date.getTime() / 1000), date];
        case 'noon': // next noon
            if (date.getHours() >= 12) date.setDate(date.getDate() + 1);
            date.setHours(12, 0, 0, 0);
            return [Math.floor(date.getTime() / 1000), date];
        case '':
            return 'Waiting for input above...';
        default:
            return new Date(input).getTime() / 1000;
    }
};

/* Commit log data to storage */
const setLogs = value => chrome.storage.sync.set({key: value});

/* Display log data in UI */
function renderLogs(logs, logsContainer, clearLogs) {
    // Remove event listeners (for logs)
    document.querySelectorAll('td').forEach(td => removeEventListener('click', td));

    // Set the logs container
    logsContainer.innerHTML = `
                <table>
                    ${logs.map(([ut, date]) => `
                        <tr>
                            <td data-value="${ut}">${ut}</td> 
                            <td data-value="${date}">${date}</td>
                        </tr>`).join('')}
                </table>`;
    clearLogs.style.visibility = logs.length ? 'visible' : 'hidden';

    // Add event listeners (for logs)
    document.querySelectorAll('td').forEach(td => {
        td.addEventListener('click', function (e) {
            setInputs(this.dataset.value);
        });
    });

};

document.addEventListener('DOMContentLoaded', function () {
    let input = document.getElementById('input');
    let result = document.getElementById('result');
    let logsContainer = document.getElementById('logs');
    let clearLogs = document.getElementById('clearLogs');
    let info = document.getElementById('info');

    // Set logs
    chrome.storage.sync.get(['key'], (result) => {
        logs = result.key || [];
        renderLogs(logs, logsContainer, clearLogs);
    });

    // Update inputs
    input.addEventListener('input', function () {
        setInputs(this.value);
    });

    // Add current value to logs (if you press enter)
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            logs.unshift([input.value, result.value]);
            setLogs(logs);
            if (logs.length) {
                renderLogs(logs, logsContainer, clearLogs);
            }
        }
    });

    // Remove all logs
    clearLogs.addEventListener('click', () => {
        logs = [];
        setLogs(logs);
        renderLogs(logs, logsContainer, clearLogs);
    });

    // Shortcuts
    document.getElementById('shortcut_startOfDay').addEventListener('click', function () {
        setInputs('startOfDay', true);
    });
    document.getElementById('shortcut_endOfDay').addEventListener('click', function () {
        setInputs('endOfDay', true);
    });
    document.getElementById('shortcut_now').addEventListener('click', function () {
        setInputs('now', true);
    });
    document.getElementById('shortcut_yesterday').addEventListener('click', function () {
        setInputs('yesterday', true);
    });
    document.getElementById('shortcut_tomorrow').addEventListener('click', function () {
        setInputs('tomorrow', true);
    });
    document.getElementById('shortcut_noon').addEventListener('click', function () {
        setInputs('noon', true);
    });


    // Grab user selected input (to use for conversion)
    chrome.tabs.executeScript({
        code: 'window.getSelection().toString();'
    }, function ([selection]) {
        selection = ((selection && selection.toString()) || '').trim(); // JIC
        if (!!selection.length) {
            info.style.transition = '1.5s';
            info.style.opacity = '1';
            setTimeout(() => (info.style.opacity = '0'), 2500);
            setInputs(selection);
        }
    });
    input.focus();
}, false);
