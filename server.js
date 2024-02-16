const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/news/:teamName', async (req, res) => {
    const teamName = req.params.teamName;
    const url = `https://www.bbc.com/sport/football/teams/${teamName}`;

    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Add these to help with common Puppeteer deployment issues
        });
        const page = await browser.newPage();

        // Adjusted to handle navigation and waiting for elements more gracefully
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => {
            console.error(`Error navigating to ${url}:`, e);
            res.status(500).send("Error fetching the page.");
            return;
        });

        const allArticles = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('article')).slice(0, 12).map(article => {
                const title = article.querySelector('h3') ? article.querySelector('h3').innerText : 'No title';
                const content = Array.from(article.querySelectorAll('p')).map(p => p.innerText).join(' ');
                return { title, content };
            });
        });

        await browser.close();
        res.json(allArticles);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).send("Error fetching news.");
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
