const axios = require("axios");
const Parser = require("rss-parser");
const cron = require("node-cron");
require("dotenv").config();

const parser = new Parser();

const RSS_URL = process.env.RSS_URL;
const LINE_NOTIFY_TOKEN = process.env.LINE_NOTIFY_TOKEN;
const PORT = process.env.PORT || 3000;

const conditions = ["全台", "高雄", "高屏", "南部", "解除"];

// 抓取RSS資料並進行篩選
async function fetchAndFilterRSS() {
  try {
    const feed = await parser.parseURL(RSS_URL);
    const items = filterRSSItems(feed.items, conditions);
    return items;
  } catch (error) {
    console.log("Fetch RSS Failed:", error);
    return [];
  }
}

// 篩選功能
function filterRSSItems(items, conditions) {
  return items.filter((item) => {
    return conditions.some((condition) => {
      return item.content.includes(condition);
    });
  });
}

// 傳送給 LINE Notify
async function sendToLineNotify(message, stickerPackageId, stickerId) {
  try {
    const params = new URLSearchParams({
      message,
      stickerPackageId,
      stickerId,
    });
    await axios.post("https://notify-api.line.me/api/notify", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`,
      },
    });
    console.log("Sent to Line Notify successfully");
  } catch (error) {
    console.log(
      "Send to Line Notify failed:",
      error.response ? error.response.data : error.message
    );
  }
}

// 隨機取數
function getRandomNum(max, min) {
  return Math.floor(Math.random() * (max - min + 1));
}

// 主要執行
async function main() {
  try {
    const filteredItems = await fetchAndFilterRSS();
    const stickerPkgId = 11539;
    const stickerIds = [52114110, 52114116, 52114122, 52114117];
    for (let item of filteredItems) {
      console.log(item);
      const stickerId = getRandomNum(stickerIds.length - 1, 0);
      const message = `${item.title}\n${item.link}\n${item.content}`;
      await sendToLineNotify(message, stickerPkgId, stickerId);
    }
  } catch (error) {
    console.log("Main function failed:", error);
  }
}

// 排程執行
cron.schedule("0 * * * *", main);

main();
