import { Socket } from "socket.io";
import { CDPSession, Page } from "puppeteer";

const emptyFunction = async () => {};
const defaultAfterWritingNewFile = async (fileName: boolean) =>
  console.log(`${fileName} was written`);

export class PuppeteerMassScreenshots {
  page: Page;
  socket: Socket;
  client: CDPSession;
  canScreenshot: boolean;

  async init(page: Page, socket: Socket, options = {}) {
    // page - represents the web page
    // socket - Socket.io
    // options - Chrome DevTools config

    const runOptions = {
      beforeWritingImageFile: emptyFunction,
      afterWritingImageFile: defaultAfterWritingNewFile,
      beforeAck: emptyFunction,
      afterAck: emptyFunction,
      ...options,
    };

    this.socket = socket;
    this.page = page;

    // CDPSession instance is used to talk to Chrome DevTools Protocal
    this.client = await this.page.target().createCDPSession();
    this.canScreenshot = true;

    // The frameObject param contains the compressed image data
    // requested by Page.startScreencast.
    this.client.on("Page.screencastFrame", async (frameObject) => {
      if (this.canScreenshot) {
        await runOptions.beforeWritingImageFile();
        const fileName = await this.writeImageFilename(frameObject.data);
        await runOptions.afterWritingImageFile(fileName as unknown as boolean);

        try {
          await runOptions.beforeAck();
          await this.client.send("Page.screencastFrameAck", {
            sessionId: frameObject.sessionId,
          });
          await runOptions.afterAck();
        } catch (error) {
          this.canScreenshot = false;
        }
      }
    });
  }
  async writeImageFilename(data: string) {
    const fullHeight = await this.page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );
    });
    // Emits event containing the image and its full height
    return this.socket.emit("image", { img: data, fullHeight });
  }

  /*
   The start(options) function specifies the properties of the screencast
   format
   quality
   everyNthFrame - specifies the number of frames to ignore before taking the next screenshot
   */

  async start(options = {}) {
    type ScreenShotFormat = {
      format: "jpeg" | "png" | undefined;
      quality: number;
      everyNthFrame: number;
    };

    const startOptions: ScreenShotFormat = {
      format: "jpeg",
      quality: 10,
      everyNthFrame: 1,
      ...options,
    };

    try {
      await this.client.send("Page.startScreencast", startOptions);
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
    }
  }

  async stop() {
    try {
      await this.client.send("Page.stopScreencast");
    } catch (error) {
      if (error instanceof Error) throw new Error(error.message);
    }
  }
}
