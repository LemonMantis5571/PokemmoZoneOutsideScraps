const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = 3000;
const cors = require('cors');
const sleep = ms => new Promise(res => setTimeout(res, ms));

app.use(cors());

app.get('/get-shiny-counts', async (req, res) => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://www.pokemmotools.net/showcase');

        await page.waitForSelector('body'); // Adjust the selector as needed
        await sleep(3000);

        const users = {};
        const data = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('a, span')); // Select all <a> and <span> tags
            return elements.map(element => {
                const text = element.textContent.trim(); // Get the text content of the element
                const match = text.match(/(\w+)\s*\((\d+)\)/);
                return match ? { username: match[1].trim(), count: parseInt(match[2], 10) } : null;
            }).filter(item => item !== null);
        });

        data.forEach(({ username, count }) => {
            if (!users[username]) {
                users[username] = { OTShinyCount: count };
            } else {
                users[username].OTShinyCount += count;
            }
        });

        const totalShinies = Object.values(users).reduce((sum, user) => sum + user.OTShinyCount, 0);

        const jsonData = {
            name: "Thug",
            code: "Thug",
            url: "https://www.pokemmotools.net/showcase",
            totalshinies: totalShinies,
            members: Object.entries(users).map(([username, data]) => ({
                username,
                count: data.OTShinyCount
            }))
        };

        await browser.close();

        // Respond with JSON data
        res.json(jsonData);

    } catch (error) {
        console.error('Error fetching shiny counts:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
