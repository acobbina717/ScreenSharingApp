import http from "http";
import cors from "cors";
import express from "express";
import puppeteer from "puppeteer";
import { Server, Socket } from "socket.io";
import { PuppeteerMassScreenshots } from "./screen.shooter";

const app = express();
const PORT = 4000;

// Create httpServer with express App
const httpServer = http.createServer(app);

// Create socket.io server to work with httpServer
// Configure cors to give client access socket
const io = new Server(httpServer, {
  cors: {
    origin: "*",
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
      await page.goto(url);
      const screenShots = new PuppeteerMassScreenshots();
      await screenShots.init(page, socket);
      await screenShots.start();
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
    }

    socket.on("mouseMove", async ({ x, y }) => {
      try {
        //sets the cursor the position with Puppeteer
        await page.mouse.move(x, y);
        /*
            👇🏻 This function runs within the page's context, 
               calculates the element position from the view point 
               and returns the CSS style for the element.
            */
        const cur = await page.evaluate(
          (p) => {
            const elementFromPoint = document.elementFromPoint(p.x, p.y);
            return window
              .getComputedStyle(elementFromPoint as Element, null)
              .getPropertyValue("cursor");
          },
          { x, y }
        );

        //👇🏻 sends the CSS styling to the frontend
        socket.emit("cursor", cur);
      } catch (error) {
        if (error instanceof Error) throw new Error(error.message);
      }
    });

    socket.on("mouseClick", async ({ x, y }) => {
      try {
        await page.mouse.click(x, y);
      } catch (error) {
        if (error instanceof Error) throw new Error(error.message);
      }
    });

    socket.on("scroll", ({ position }) => {
      page.evaluate((top) => {
        window.scrollTo({ top });
      }, position);
    });
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
