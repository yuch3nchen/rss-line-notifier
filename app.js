const express = require("express");
const axios = require("axios");
const Parser = require("rss-parser");
require("dotenv").config();
const {
  saveSentNotifications,
  loadSentNotifications,
  deleteOldNotifications,
} = require("./db.js");

const app = express();
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
    console.error("Fetch RSS Failed:", error);
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
    console.log("sent to Line Notify successfully");
  } catch (error) {
    console.error(
      "Send to Line Notify failed:",
      error.response ? error.response.data : error.message
    );
  }
}

// 隨機取數
function getRandomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 主要執行
async function main() {
  try {
    const filteredItems = await fetchAndFilterRSS();
    const stickerPkgId = 11539;
    const stickerIds = [52114110, 52114116, 52114122, 52114117];

    await deleteOldNotifications();

    const sentNotifications = await loadSentNotifications();
    // console.log(sentNotifications);

    for (let item of filteredItems) {
      // console.log(item);

      const itemId = item.guid || item.link;
      if (sentNotifications[itemId]) {
        console.log(`Notification for ${itemId} already sent, skipping`);
        continue;
      }

      const num = getRandomNum(0, stickerIds.length - 1);
      if (item.content.length > 1000) {
        console.warn("content too long, truncating...");
        item.content = item.content.substring(0, 997) + "...";
      }
      const message = `${item.title}\n${item.link}\n${item.content}`;

      try {
        const result = await sendToLineNotify(
          message,
          stickerPkgId,
          stickerIds[num]
        );
        console.log("Sent notification successfully");
      } catch (error) {
        console.error("Send notification failed: ", item.title, error);
      }

      await saveSentNotifications(itemId, new Date().toISOString());
    }
  } catch (error) {
    console.error("Main function failed:", error);
  }
}

app.get("/api/run-cron-job", async (req, res) => {
  console.log("Cron job start!");
  await main();
  res.send("Cron job executed");
});

app.get("/", (req, res) => {
  res.send("RSS Line Notifier is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

main();
