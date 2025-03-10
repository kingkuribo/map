const express = require("express");
const app = express();
const http = require("http");
const { Client } = require("pg");
const server = http.createServer(app);
app.use(express.json()); // 📌 これがないと req.body は undefined になる

// ポート番号の設定
const PORT = 10000;

// 静的ファイルを提供
app.use(express.static("public"));

//ejs path定義
app.set("view engine", "ejs");

// データベース接続設定
const client = new Client({
  user: "kingkuribo",
  host: "ddpg-cuu5ab0gph6c73aake7g-a.oregon-postgres.render.com",
  database: "shogi_49ks",
  password: "JUABj20uB71nzfWb9F3pFRyexmCtc1xt",
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // RenderではSSLが必要
  },
});

client.connect((err) => {
  if (err) {
    console.error("データベース接続に失敗しました:", err.stack);
    return;
  }
  console.log("データベース接続に成功しました！");

  // サンプルクエリを実行
  client.query("SELECT NOW()", (queryErr, res) => {
    if (queryErr) {
      console.error("クエリエラー:", queryErr.stack);
    } else {
      console.log("クエリ結果:", res.rows[0]);
    }
  });
});

app.get("/api/get-locations", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM locations");
    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **クリックした座標をデータベースに保存**
app.post("/api/save-location", async (req, res) => {
  const { lat, lng } = req.body;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "Invalid data format" });
  }

  try {
    const result = await client.query(
      "INSERT INTO locations (latitude, longitude) VALUES ($1, $2) RETURNING *",
      [lat, lng]
    );

    res
      .status(201)
      .json({ message: "Location saved", location: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ルートでHTMLをレンダリング
app.get("/", (req, res) => {
  res.render("index.ejs");
});

// サーバー起動
server.listen(PORT, () => console.log(`サーバーがポート${PORT}で起動しました`));
