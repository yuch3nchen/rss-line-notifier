# RSS Line Notifier

![image](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![image](https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white)
![image](https://img.shields.io/badge/axios-671ddf?&style=for-the-badge&logo=axios&logoColor=white)
![image](https://img.shields.io/badge/RSS-FFA500?style=for-the-badge&logo=rss&logoColor=white)
![image](https://img.shields.io/badge/Line-00C300?style=for-the-badge&logo=line&logoColor=white)

RSS Line Notifier is an automated notification system that sends weather alerts for specific conditions of Taiwan via Line Notify, built with Node.js and Express.

## Features

- Fetches and filters RSS feeds from the [Central Weather Administration](https://www.cwa.gov.tw/V8/C/S/eservice/rss.html)
- Sends filtered alerts to [Line Notify](https://notify-bot.line.me/doc/en/)
- Stores and avoids duplicate notifications using [MongoDB](https://www.mongodb.com/)
- Provides API endpoints for manual triggering and monitoring
- Deployed on [Render](https://render.com/) with scheduled execution via [Uptime Robot](https://uptimerobot.com/) or [Cron-job.org](https://cron-job.org/)

## Preview

<img src='./screenshot/screenshot.png' width="600px"/>

## Technologies Used

- Node.js
- Express.js
- Axios
- MongoDB
- Line Notify API
- RSS Parser

## Prerequisites

- Node.js (version 20.10.0)
- MongoDB (version 6.8.0)
- Line Notify Token
- RSS feed URL

## Installation

1. Clone the repository:

```
git clone https://github.com/yuch3nchen/rss-line-notifier.git
```

2. Install dependencies:

```
npm install
```

3. Set up environment variables in a `.env` file:

```
RSS_URL={your_rss_url}
LINE_NOTIFY_TOKEN={your_line_notify_token}
MONGODB_URI={your_mongodb_uri}
PORT=3000
LOG_LEVEL=info
```

## Usage

To start the server:

```
npm start
```

To manually trigger the notification process, send a GET request to:

```
/api/run-cron-job
```

## Configuration

### Modifying Filter Conditions

To change the filter conditions for RSS feeds:

1. Open `app.js` in the project root directory.
2. Find the following line:
   ```javascript
   const conditions = [
     "全台",
     "高雄",
     "高屏",
     "南部",
     "解除",
     "以南",
     "西半部",
   ];
   ```
3. Modify this array with your desired keywords.
4. Save the file and restart the application.

## Deployment

This project is configured for deployment on Render. Follow Render's [documentation](https://docs.render.com/) for deploying Node.js applications.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

If you have any questions or suggestions, please feel free to contact me:

- Email: yuch3nchen@gmail.com
- GitHub: [@yuch3nchen](https://github.com/yuch3nchen)
