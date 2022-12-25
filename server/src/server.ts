import express from "express";
import http from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";
import puppeteer from "puppeteer";

const app = express();
const PORT = 4000;

// Create httpServer with express App
const httpServer = http.createServer(app);

// Create socket.io server to work with httpServer
// Configure cors to give client access socket
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"],
    credentials: true,
  },
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configure express app to use cors
app.use(cors());

// socketIO Events
io.on("connection", (socket: Socket) => {
  console.log(`⚡️: ${socket.id} user just connected!`);

  socket.on("browse", async ({ url }) => {
    const browser = await puppeteer.launch({
      headless: true,
    });

    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.setViewport({
      width: 1255,
      height: 800,
    });

    try {
      await page.goto(`http://${url}`);
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
    }
  });

  socket.on("disconnect", () => {
    socket.disconnect();
    console.log("🔥: A user disconnected");
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "Hello World",
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is live from PORT: ${PORT}`);
});
