const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let database;

// 連結資料庫
async function connectToDatabase() {
  if (!database) {
    await client.connect();
    database = client.db("rss_notifier");
  }
  return database;
}

// 儲存已傳送的通知
async function saveSentNotifications(id, sentDate) {
  try {
    const db = await connectToDatabase();
    const notifications = db.collection("sent_notifications");
    await notifications.updateOne(
      { _id: id },
      { $set: { sent_at: new Date(sentDate).toISOString() } },
      { upsert: true }
    );
  } catch (error) {
    console.error("saving notification failed: ", error);
    throw error;
  }
}

// 取得已傳送的通知
async function loadSentNotifications() {
  try {
    const db = await connectToDatabase();
    const notifications = db.collection("sent_notifications");
    const result = await notifications.find().toArray();
    return result.reduce((acc, notification) => {
      acc[notification._id] = notification.sent_at;
      return acc;
    }, {});
  } catch (error) {
    console.error("loading notification failed: ", error);
    throw error;
  }
}

// 清除過期的通知
async function deleteOldNotifications(hours = 12) {
  try {
    const db = await connectToDatabase();
    const notifications = db.collection("sent_notifications");
    const cutOffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const cutOffDateString = cutOffDate.toISOString();

    console.log(
      `Attempint to delete notifications older than ${cutOffDateString}`
    );

    const result = await notifications.deleteMany({
      sent_at: { $lt: cutOffDateString },
    });
    console.log(`Delete ${result.deletedCount} notifications successfully`);
  } catch (error) {
    console.error("delete old notifications failed:", error);
  }
}

module.exports = {
  saveSentNotifications,
  loadSentNotifications,
  deleteOldNotifications,
};
