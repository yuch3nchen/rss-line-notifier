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
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const conditions = ["全台", "高雄", "高屏", "南部", "解除", "以南", "西半部"];

// 抓取RSS資料並進行篩選
async function fetchAndFilterRSS() {
  try {
    const feed = await parser.parseURL(RSS_URL);
    const items = filterRSSItems(feed.items, conditions);
    return items;
  } catch (error) {
    log("error", `Fetch rss failed: ${error}`);
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

// 記錄日誌
function log(level, message) {
  const levels = ["error", "warn", "info", "debug"];
  if (levels.indexOf(level) <= levels.indexOf(LOG_LEVEL)) {
    console.log(`${level.toUpperCase()}: ${message}`);
  }
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
    return true;
  } catch (error) {
    log(
      "error",
      `Send to Line Notify failed: ${
        error.response ? error.response.data : error.message
      }`
    );
    return false;
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
    log("info", `Fetched ${filteredItems.length} items`);

    const stickerPkgId = 11539;
    const stickerIds = [
      52114110, 52114113, 52114115, 52114116, 52114122, 52114121,
    ];

    await deleteOldNotifications();

    const sentNotifications = await loadSentNotifications();
    // console.log(sentNotifications);

    let sentCount = 0;
    for (let item of filteredItems) {
      // console.log(item);

      const itemId = item.guid || item.link;
      if (sentNotifications[itemId]) {
        log("debug", `Notification for ${itemId} alreaddy sent, skipping`);
        continue;
      }

      const num = getRandomNum(0, stickerIds.length - 1);

      let message = `${item.title}\n${item.link}\n${item.content}`;

      // 字數過長處理
      if (message.length > 1000) {
        log("warn", "content too long, truncating...");
        message = message.substring(0, 997) + "...";
      }

      try {
        const success = await sendToLineNotify(
          message,
          stickerPkgId,
          stickerIds[num]
        );
        if (success) {
          sentCount++;
          await saveSentNotifications(itemId, new Date().toISOString());
        }
      } catch (error) {
        log("error", `Send notification failed: ${item.title},${error}`);
        throw error;
      }
      log("info", `Sent ${sentCount} notifications successfully`);
      return {
        processedItems: filteredItems.length,
        sentNotifications: sentCount,
      };
    }
  } catch (error) {
    log("error", `Main function failed: ${error}`);
    throw error;
  }
}

app.get("/api/run-cron-job", async (req, res) => {
  log("info", "Cron job start!");
  try {
    const result = await main();
    res.json({ status: "success", ...result });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("RSS Line Notifier is running");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

main();
